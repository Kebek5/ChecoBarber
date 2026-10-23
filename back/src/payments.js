import "dotenv/config";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const FRONT = process.env.FRONT_URL || "http://localhost:4321";
const PAYPAL = process.env.PAYPAL_ENV === "live"
   ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || "" });
const sameAmount = (a, b) => Math.abs(Number(a) - Number(b)) < 0.01;

// ---------- Mercado Pago ----------
export async function createMpCheckout(order, items) {
   const back = `${FRONT}/pago/resultado?orderId=${order.id}`;
   const pref = await new Preference(mp).create({
      body: {
         items: items.map((i) => ({
            id: String(i.id), title: i.title,
            quantity: i.quantity, unit_price: Number(i.unit_price), currency_id: "MXN",
         })),
         external_reference: String(order.id),
         back_urls: { success: back, failure: back, pending: back },
      },
   });
   return pref.init_point;
}

export async function verifyMpPayment(order, paymentId) {
   if (!paymentId) return false;
   const p = await new Payment(mp).get({ id: paymentId });
   return p.status === "approved"
      && p.external_reference === String(order.id)
      && sameAmount(p.transaction_amount, order.total);
}

// ---------- PayPal ----------
async function paypalToken() {
   const basic = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
   const r = await fetch(`${PAYPAL}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
   });
   if (!r.ok) throw new Error("No se pudo autenticar con PayPal.");
   return (await r.json()).access_token;
}

export async function createPaypalCheckout(order) {
   const r = await fetch(`${PAYPAL}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await paypalToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
         intent: "CAPTURE",
         purchase_units: [{
            reference_id: String(order.id),
            amount: { currency_code: "MXN", value: Number(order.total).toFixed(2) },
         }],
         payment_source: { paypal: { experience_context: {
            user_action: "PAY_NOW",
            return_url: `${FRONT}/pago/resultado?orderId=${order.id}`,
            cancel_url: `${FRONT}/pago/resultado?orderId=${order.id}`,
         } } },
      }),
   });
   const j = await r.json();
   if (!r.ok) throw new Error("PayPal rechazó la orden.");
   return { id: j.id, url: j.links.find((l) => l.rel === "payer-action").href };
}

export async function capturePaypal(order) {
   const r = await fetch(`${PAYPAL}/v2/checkout/orders/${order.pago_ref}/capture`, {
      method: "POST",
      headers: {
         Authorization: `Bearer ${await paypalToken()}`,
         "Content-Type": "application/json",
         "PayPal-Request-Id": `capture-${order.id}-${order.pago_ref}`,
      },
   });
   if (!r.ok) return false;   // aún no aprobada o ya capturada
   const j = await r.json();
   const cap = j.purchase_units?.[0]?.payments?.captures?.[0];
   return j.status === "COMPLETED"
      && j.purchase_units[0].reference_id === String(order.id)
      && sameAmount(cap?.amount?.value, order.total);
}