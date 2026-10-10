import "dotenv/config";

const env = (name, fallback = "") => (process.env[name] ?? fallback).trim();

const paypalEnv = env("PAYPAL_ENV", "sandbox");

export const paymentConfig = {
   // URL pública del backend (túnel o dominio). Sin ella no se mandan notification_url.
   publicApiUrl: env("PUBLIC_API_URL").replace(/\/$/, ""),
   // URL del front, usada para regresar al cliente después de pagar
   frontUrl: env("FRONT_URL", "http://localhost:4321").replace(/\/$/, ""),
   storeName: env("STORE_NAME", "ChecoBarber"),

   mercadopago: {
      apiUrl: env("MP_API_URL", "https://api.mercadopago.com").replace(/\/$/, ""),
      accessToken: env("MP_ACCESS_TOKEN"),
      webhookSecret: env("MP_WEBHOOK_SECRET"),
      pointTerminalId: env("MP_POINT_TERMINAL_ID"),
   },

   paypal: {
      apiUrl: env(
         "PAYPAL_API_URL",
         paypalEnv === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"
      ).replace(/\/$/, ""),
      clientId: env("PAYPAL_CLIENT_ID"),
      clientSecret: env("PAYPAL_CLIENT_SECRET"),
      webhookId: env("PAYPAL_WEBHOOK_ID"),
   },
};

if (!paymentConfig.mercadopago.accessToken) {
   console.warn("[pagos] Falta MP_ACCESS_TOKEN: los pagos con Mercado Pago no funcionarán.");
}
if (!paymentConfig.paypal.clientId || !paymentConfig.paypal.clientSecret) {
   console.warn("[pagos] Faltan PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET: PayPal no funcionará.");
}
if (!paymentConfig.publicApiUrl) {
   console.warn("[pagos] Sin PUBLIC_API_URL: no llegarán webhooks; el estado se consultará al proveedor.");
}

// Error de un proveedor de pagos, con el código HTTP que conviene devolver
export class PaymentError extends Error {
   constructor(message, status = 400, details = null) {
      super(message);
      this.name = "PaymentError";
      this.status = status;
      this.details = details;
   }
}

// Redondeo a centavos para no arrastrar errores de FLOAT
export const toCents = (value) => Math.round(Number(value) * 100);
export const money = (value) => (toCents(value) / 100).toFixed(2);