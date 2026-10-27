import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { paymentConfig, PaymentError, money, toCents } from "./config.js";

const { mercadopago: mpConfig } = paymentConfig;


async function mp(path, { method = "GET", body, idempotencyKey, deviceId } = {}) {
   if (!mpConfig.accessToken) throw new PaymentError("Mercado Pago no está configurado.", 503);

   let res;
   try {
      res = await fetch(`${mpConfig.apiUrl}${path}`, {
         method,
         headers: {
            Authorization: `Bearer ${mpConfig.accessToken}`,
            "Content-Type": "application/json",
            ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
            // Identificador del dispositivo (lo genera el SDK JS): mejora la aprobación y la prevención de fraude
            ...(deviceId ? { "X-meli-session-id": deviceId } : {}),
         },
         body: body ? JSON.stringify(body) : undefined,
         signal: AbortSignal.timeout(20_000),
      });
   } catch {
      throw new PaymentError("No se pudo conectar con Mercado Pago.", 502);
   }

   const data = await res.json().catch(() => null);
   if (!res.ok) {
      const detail = data?.message || data?.errors?.[0]?.message || data?.error || `HTTP ${res.status}`;
      console.error("[mercadopago]", method, path, res.status, JSON.stringify(data));
      throw new PaymentError(`Mercado Pago rechazó la solicitud: ${detail}`, res.status >= 500 ? 502 : 400, data);
   }
   return data;
}

const notificationUrl = () =>
   paymentConfig.publicApiUrl ? `${paymentConfig.publicApiUrl}/webhooks/mercadopago` : undefined;

// ---------- Estados ----------

export function paymentStatusToEstado(status) {
   switch (status) {
      case "approved":
         return "aprobado";
      case "rejected":
         return "rechazado";
      case "cancelled":
         return "cancelado"; // incluye tickets de OXXO/Paycash vencidos
      case "refunded":
      case "charged_back":
         return "reembolsado";
      default:
         return "pendiente"; // pending, in_process, authorized, in_mediation
   }
}

// Estados de una order de Point (API Orders)
export function pointOrderToEstado(status) {
   switch (status) {
      case "processed":
         return "aprobado";
      case "refunded":
         return "reembolsado";
      case "failed":
         return "rechazado";
      default:
         return "pendiente"; // created, at_terminal, canceled, expired, action_required: se puede reintentar
   }
}

// El monto aprobado debe coincidir con el total del pedido
export const amountMatches = (expected, received) => Math.abs(toCents(expected) - toCents(received)) <= 1;

// ---------- Checkout API: tarjeta y tiendas de conveniencia ----------
//
// El navegador tokeniza la tarjeta con el SDK de Mercado Pago (Payment Brick) y nos manda solo el token.
// Aquí se crea el pago con POST /v1/payments; los datos de la tarjeta nunca pasan por este servidor.

const ALLOWED_FORM_FIELDS = ["token", "issuer_id", "payment_method_id", "installments", "payer"];

// Misma tarjeta (token de un solo uso) o mismo intento en el mismo minuto => mismo pago, no uno doble
function idempotencyKeyFor(pedido, body) {
   const attempt = body.token ?? `${body.payment_method_id}:${Math.floor(Date.now() / 60_000)}`;
   return createHash("sha256").update(`${pedido.referencia}:${attempt}`).digest("hex");
}

export async function createCheckoutApiPayment({ pedido, lines = [], formData, description, fallbackEmail, deviceId }) {
   const body = {};
   for (const key of ALLOWED_FORM_FIELDS) {
      if (formData?.[key] !== undefined && formData[key] !== null && formData[key] !== "") body[key] = formData[key];
   }
   if (!body.payment_method_id) throw new PaymentError("Selecciona un medio de pago.", 400);

   // Solo se reenvían los campos permitidos del pagador
   const payer = formData?.payer ?? {};
   body.payer = { email: payer.email || fallbackEmail };
   if (payer.first_name) body.payer.first_name = String(payer.first_name);
   if (payer.last_name) body.payer.last_name = String(payer.last_name);
   if (payer.identification?.type && payer.identification?.number) {
      body.payer.identification = {
         type: String(payer.identification.type),
         number: String(payer.identification.number),
      };
   }
   if (!body.payer.email) throw new PaymentError("Falta el correo del pagador.", 400);

   if (body.installments) body.installments = Number(body.installments);
   if (body.issuer_id) body.issuer_id = Number(body.issuer_id);

   // El monto SIEMPRE sale de la base de datos, nunca del navegador
   body.transaction_amount = Number(money(pedido.total));
   body.description = description;
   body.external_reference = pedido.referencia;
   body.statement_descriptor = paymentConfig.storeName.slice(0, 22);
   // Detalle de los artículos: Mercado Pago lo usa para evaluar riesgo y mejorar la tasa de aprobación
   body.additional_info = {
      items: lines.map((l) => ({
         id: String(l.producto_id),
         title: l.nombre,
         quantity: Number(l.cantidad),
         unit_price: Number(money(l.precio_unitario)),
      })),
   };
   const url = notificationUrl();
   if (url) body.notification_url = url;

   return mp("/v1/payments", { method: "POST", body, idempotencyKey: idempotencyKeyFor(pedido, body), deviceId });
}

export const getPayment = (id) => mp(`/v1/payments/${encodeURIComponent(id)}`);

// Busca el pago más relevante de un pedido (sincroniza sin webhook y cubre pedidos antiguos con link de pago)
export async function findPaymentByReference(referencia) {
   const params = new URLSearchParams({
      external_reference: referencia,
      sort: "date_created",
      criteria: "desc",
      limit: "20",
   });
   const data = await mp(`/v1/payments/search?${params}`);
   const results = data?.results ?? [];
   return results.find((p) => p.status === "approved") ?? results[0] ?? null;
}

// URL con las instrucciones del ticket (OXXO, Paycash, etc.)
export const ticketUrlOf = (payment) =>
   payment?.transaction_details?.external_resource_url ??
   payment?.point_of_interaction?.transaction_data?.ticket_url ??
   null;

// ---------- Terminal Point (API Orders) ----------

export async function createPointOrder({ pedido, terminalId }) {
   const terminal = terminalId || mpConfig.pointTerminalId;
   if (!terminal) throw new PaymentError("No hay terminal configurada (MP_POINT_TERMINAL_ID).", 400);

   // external_reference debe ser único por order: se agrega un sufijo por intento
   const attempt = randomUUID().replace(/-/g, "").slice(0, 6);
   const body = {
      type: "point",
      external_reference: `${pedido.referencia}-T${attempt}`,
      expiration_time: "PT15M",
      description: `Pedido ${pedido.referencia}`,
      transactions: { payments: [{ amount: money(pedido.total) }] },
      config: { point: { terminal_id: terminal, print_on_terminal: "no_ticket" } },
   };
   return mp("/v1/orders", { method: "POST", body, idempotencyKey: randomUUID() });
}

export const getPointOrder = (id) => mp(`/v1/orders/${encodeURIComponent(id)}`);

export const cancelPointOrder = (id) =>
   mp(`/v1/orders/${encodeURIComponent(id)}/cancel`, { method: "POST", idempotencyKey: randomUUID() });

export const listTerminals = () => mp("/terminals/v1/list?limit=50");

export const setTerminalPdvMode = (terminalId) =>
   mp("/terminals/v1/setup", {
      method: "PATCH",
      body: { terminals: [{ id: terminalId, operating_mode: "PDV" }] },
   });

// ---------- Webhooks: validación de firma x-signature ----------

/**
 * Manifest oficial: "id:{data.id};request-id:{x-request-id};ts:{ts};"
 * Si falta un valor, esa parte se omite. data.id alfanumérico va en minúsculas.
 */
export function verifyWebhookSignature({ signatureHeader, requestId, dataId }) {
   if (!mpConfig.webhookSecret) return true; // sin secreto configurado no se valida (solo desarrollo)
   if (!signatureHeader) return false;

   const parts = Object.fromEntries(
      signatureHeader.split(",").map((part) => {
         const [key, ...rest] = part.split("=");
         return [key.trim(), rest.join("=").trim()];
      })
   );
   const { ts, v1 } = parts;
   if (!ts || !v1) return false;

   let manifest = "";
   if (dataId) manifest += `id:${String(dataId).toLowerCase()};`;
   if (requestId) manifest += `request-id:${requestId};`;
   manifest += `ts:${ts};`;

   const expected = createHmac("sha256", mpConfig.webhookSecret).update(manifest).digest("hex");
   const a = Buffer.from(expected);
   const b = Buffer.from(v1);
   return a.length === b.length && timingSafeEqual(a, b);
}