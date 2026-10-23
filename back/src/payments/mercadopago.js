import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { paymentConfig, PaymentError, money, toCents } from "./config.js";

const { mercadopago: mpConfig } = paymentConfig;


async function mp(path, { method = "GET", body, idempotencyKey } = {}) {
   if (!mpConfig.accessToken) throw new PaymentError("Mercado Pago no está configurado.", 503);

   let res;
   try {
      res = await fetch(`${mpConfig.apiUrl}${path}`, {
         method,
         headers: {
            Authorization: `Bearer ${mpConfig.accessToken}`,
            "Content-Type": "application/json",
            ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
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

// ---------- Payment Brick: tarjeta y tiendas de conveniencia ----------

const ALLOWED_FORM_FIELDS = ["token", "issuer_id", "payment_method_id", "installments", "payer"];

export async function createBrickPayment({ pedido, formData, description, fallbackEmail }) {
   const body = {};
   for (const key of ALLOWED_FORM_FIELDS) {
      if (formData?.[key] !== undefined && formData[key] !== null && formData[key] !== "") body[key] = formData[key];
   }
   if (!body.payment_method_id) throw new PaymentError("Selecciona un medio de pago.", 400);

   body.payer = { ...(body.payer ?? {}) };
   if (!body.payer.email) body.payer.email = fallbackEmail;
   if (body.installments) body.installments = Number(body.installments);

   // El monto SIEMPRE sale de la base de datos, nunca del navegador
   body.transaction_amount = Number(money(pedido.total));
   body.description = description;
   body.external_reference = pedido.referencia;
   body.statement_descriptor = paymentConfig.storeName.slice(0, 22);
   const url = notificationUrl();
   if (url) body.notification_url = url;

   return mp("/v1/payments", { method: "POST", body, idempotencyKey: randomUUID() });
}

export const getPayment = (id) => mp(`/v1/payments/${encodeURIComponent(id)}`);

// Busca el pago más relevante de un pedido (sirve para links de pago y para sincronizar sin webhook)
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

// ---------- Link de pago (Checkout Pro) ----------

export async function createPaymentLink({ pedido, lines, payerEmail }) {
   const backUrl = `${paymentConfig.frontUrl}/pedido/${pedido.referencia}`;
   const body = {
      items: lines.map((l) => ({
         id: String(l.producto_id),
         title: l.nombre,
         quantity: Number(l.cantidad),
         unit_price: Number(money(l.precio_unitario)),
         currency_id: "MXN",
      })),
      payer: payerEmail ? { email: payerEmail } : undefined,
      external_reference: pedido.referencia,
      statement_descriptor: paymentConfig.storeName.slice(0, 22),
      back_urls: { success: backUrl, pending: backUrl, failure: backUrl },
   };
   // auto_return solo se acepta con URLs públicas https
   if (backUrl.startsWith("https://")) body.auto_return = "approved";
   const url = notificationUrl();
   if (url) body.notification_url = url;

   const pref = await mp("/checkout/preferences", { method: "POST", body, idempotencyKey: randomUUID() });
   return { id: pref.id, url: pref.init_point ?? pref.sandbox_init_point };
}

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