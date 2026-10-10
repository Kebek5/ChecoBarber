import { paymentConfig, PaymentError, money } from "./config.js";

const { paypal: ppConfig } = paymentConfig;

let cachedToken = null; // { value, expiresAt }

async function getAccessToken() {
   if (!ppConfig.clientId || !ppConfig.clientSecret) throw new PaymentError("PayPal no está configurado.", 503);
   if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

   const basic = Buffer.from(`${ppConfig.clientId}:${ppConfig.clientSecret}`).toString("base64");
   let res;
   try {
      res = await fetch(`${ppConfig.apiUrl}/v1/oauth2/token`, {
         method: "POST",
         headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
         body: "grant_type=client_credentials",
         signal: AbortSignal.timeout(20_000),
      });
   } catch {
      throw new PaymentError("No se pudo conectar con PayPal.", 502);
   }
   const data = await res.json().catch(() => null);
   if (!res.ok || !data?.access_token) {
      console.error("[paypal] token", res.status, JSON.stringify(data));
      throw new PaymentError("PayPal rechazó las credenciales.", 502);
   }
   cachedToken = { value: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) - 60) * 1000 };
   return cachedToken.value;
}

async function pp(path, { method = "GET", body, requestId } = {}) {
   const token = await getAccessToken();
   let res;
   try {
      res = await fetch(`${ppConfig.apiUrl}${path}`, {
         method,
         headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
         },
         body: body ? JSON.stringify(body) : undefined,
         signal: AbortSignal.timeout(20_000),
      });
   } catch {
      throw new PaymentError("No se pudo conectar con PayPal.", 502);
   }
   const data = await res.json().catch(() => null);
   if (!res.ok) {
      const detail = data?.details?.[0]?.description || data?.message || `HTTP ${res.status}`;
      console.error("[paypal]", method, path, res.status, JSON.stringify(data));
      throw new PaymentError(`PayPal rechazó la solicitud: ${detail}`, res.status >= 500 ? 502 : 400, data);
   }
   return data;
}

export function captureToEstado(status) {
   switch (status) {
      case "COMPLETED":
         return "aprobado";
      case "DECLINED":
      case "FAILED":
         return "rechazado";
      case "REFUNDED":
      case "PARTIALLY_REFUNDED":
         return "reembolsado";
      default:
         return "pendiente"; // PENDING
   }
}

export async function createPaypalOrder({ pedido, description }) {
   return pp("/v2/checkout/orders", {
      method: "POST",
      body: {
         intent: "CAPTURE",
         purchase_units: [
            {
               reference_id: pedido.referencia,
               custom_id: pedido.referencia, // vuelve en la captura y en los webhooks
               description: description.slice(0, 127),
               amount: { currency_code: "MXN", value: money(pedido.total) },
            },
         ],
      },
   });
}

export const getPaypalOrder = (id) => pp(`/v2/checkout/orders/${encodeURIComponent(id)}`);

export const capturePaypalOrder = (id) =>
   pp(`/v2/checkout/orders/${encodeURIComponent(id)}/capture`, {
      method: "POST",
      requestId: `capture-${id}`, // idempotente: reintentos no cobran dos veces
   });

// Extrae la captura de una order de PayPal
export function captureOf(order) {
   const unit = order?.purchase_units?.[0];
   return { unit, capture: unit?.payments?.captures?.[0] ?? null };
}

// Verificación oficial de la firma del webhook
export async function verifyPaypalWebhook(headers, event) {
   if (!ppConfig.webhookId) {
      console.warn("[paypal] Sin PAYPAL_WEBHOOK_ID: el webhook no se puede verificar y se ignora.");
      return false;
   }
   const data = await pp("/v1/notifications/verify-webhook-signature", {
      method: "POST",
      body: {
         auth_algo: headers["paypal-auth-algo"],
         cert_url: headers["paypal-cert-url"],
         transmission_id: headers["paypal-transmission-id"],
         transmission_sig: headers["paypal-transmission-sig"],
         transmission_time: headers["paypal-transmission-time"],
         webhook_id: ppConfig.webhookId,
         webhook_event: event,
      },
   });
   return data?.verification_status === "SUCCESS";
}