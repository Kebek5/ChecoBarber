import { Router } from "express";
import { getPayment, getPointOrder, verifyWebhookSignature } from "./mercadopago.js";
import { getPaypalOrder, verifyPaypalWebhook } from "./paypal.js";
import { applyMercadoPagoPayment, applyPaypalOrder, applyPointOrder } from "./sync.js";

export const webhooksRouter = Router();


webhooksRouter.post("/mercadopago", async (req, res) => {
   const type = req.body?.type ?? req.query.type ?? req.query.topic;
   const dataId = req.query["data.id"] ?? req.body?.data?.id ?? req.query.id;

   const valid = verifyWebhookSignature({
      signatureHeader: req.get("x-signature"),
      requestId: req.get("x-request-id"),
      dataId,
   });
   if (!valid) return res.status(401).json({ error: "Firma inválida" });
   if (!dataId) return res.sendStatus(200);

   try {
      if (type === "payment") {
         await applyMercadoPagoPayment(await getPayment(dataId), `webhook_${req.body?.action ?? "payment"}`);
      } else if (type === "order") {
         await applyPointOrder(await getPointOrder(dataId), `webhook_${req.body?.action ?? "order"}`);
      }
      // Otros tipos (merchant_order, etc.) se ignoran
      res.sendStatus(200);
   } catch (err) {
      console.error("[webhook mercadopago]", err.message);
      res.sendStatus(500); // Mercado Pago reintentará
   }
});

webhooksRouter.post("/paypal", async (req, res) => {
   const event = req.body;
   try {
      const valid = await verifyPaypalWebhook(req.headers, event);
      if (!valid) return res.status(401).json({ error: "Firma inválida" });

      // En eventos de captura, la order está en resource.supplementary_data.related_ids.order_id
      const orderId =
         event?.resource?.supplementary_data?.related_ids?.order_id ??
         (event?.resource_type === "checkout-order" ? event?.resource?.id : null);

      if (orderId && /^(PAYMENT\.CAPTURE\.|CHECKOUT\.ORDER\.)/.test(event?.event_type ?? "")) {
         await applyPaypalOrder(await getPaypalOrder(orderId), `webhook_${event.event_type}`);
      }
      res.sendStatus(200);
   } catch (err) {
      console.error("[webhook paypal]", err.message);
      res.sendStatus(500);
   }
});