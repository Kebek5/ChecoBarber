import { applyPaymentStatus, baseReference, clearTerminalCharge, findOrderByReference } from "./orders.js";
import {
   amountMatches,
   findPaymentByReference,
   getPayment,
   getPointOrder,
   paymentStatusToEstado,
   pointOrderToEstado,
   ticketUrlOf,
} from "./mercadopago.js";
import { captureOf, captureToEstado, getPaypalOrder } from "./paypal.js";

// Resumen corto que se guarda en la bitácora (sin datos de tarjeta)
const mpPaymentSummary = (p) => ({
   id: p.id,
   status: p.status,
   status_detail: p.status_detail,
   payment_method_id: p.payment_method_id,
   payment_type_id: p.payment_type_id,
   amount: p.transaction_amount,
});

/** Aplica al pedido el estado de un pago de Mercado Pago (Brick o link). */
export async function applyMercadoPagoPayment(payment, evento) {
   const referencia = baseReference(payment?.external_reference);
   if (!referencia) return null;
   const pedido = await findOrderByReference(referencia);
   if (!pedido) return null;

   let estado = paymentStatusToEstado(payment.status);
   if (estado === "aprobado" && !amountMatches(pedido.total, payment.transaction_amount)) {
      console.error(`[pagos] Monto distinto en ${referencia}: esperado ${pedido.total}, recibido ${payment.transaction_amount}`);
      estado = "rechazado";
   }

   return applyPaymentStatus(pedido.id, {
      estado,
      proveedor: "mercadopago",
      externoId: String(payment.id),
      url: ticketUrlOf(payment),
      evento,
      detalle: mpPaymentSummary(payment),
   });
}

/** Aplica al pedido el estado de una order de Point. */
export async function applyPointOrder(order, evento) {
   const referencia = baseReference(order?.external_reference);
   if (!referencia) return null;
   const pedido = await findOrderByReference(referencia);
   if (!pedido) return null;

   const result = await applyPaymentStatus(pedido.id, {
      estado: pointOrderToEstado(order.status),
      proveedor: "mercadopago_point",
      externoId: order.id,
      evento,
      detalle: { id: order.id, status: order.status, status_detail: order.status_detail },
   });

   // Si el cobro ya no sigue en la terminal, se libera para poder reenviarlo
   if (["canceled", "expired", "failed"].includes(order.status)) {
      await clearTerminalCharge(pedido.id, order.id);
      return { ...result, pedido: (await findOrderByReference(referencia)) ?? result.pedido };
   }
   return result;
}

/** Aplica al pedido el estado de una order de PayPal (después de capturar o consultar). */
export async function applyPaypalOrder(order, evento) {
   const { unit, capture } = captureOf(order);
   const referencia = baseReference(capture?.custom_id ?? unit?.custom_id ?? unit?.reference_id);
   if (!referencia) return null;
   const pedido = await findOrderByReference(referencia);
   if (!pedido) return null;

   let estado = capture ? captureToEstado(capture.status) : "pendiente";
   if (estado === "aprobado" && !amountMatches(pedido.total, capture.amount?.value)) {
      console.error(`[pagos] Monto distinto en ${referencia} (PayPal)`);
      estado = "rechazado";
   }

   return applyPaymentStatus(pedido.id, {
      estado,
      proveedor: "paypal",
      externoId: order.id,
      evento,
      detalle: { order_id: order.id, order_status: order.status, capture_id: capture?.id, capture_status: capture?.status },
   });
}

// Evita consultar al proveedor más de una vez cada 10 s por pedido
const lastSync = new Map();

/**
 * Consulta al proveedor el estado real de un pedido pendiente.
 * Así la página de seguimiento funciona aunque los webhooks no lleguen (por ejemplo, en local).
 */
export async function syncOrder(pedido, { force = false } = {}) {
   if (!["pendiente", "rechazado"].includes(pedido.estado_pago)) return pedido;
   const now = Date.now();
   if (!force && now - (lastSync.get(pedido.id) ?? 0) < 10_000) return pedido;
   lastSync.set(pedido.id, now);

   try {
      let result = null;
      if (pedido.metodo_pago === "mercadopago" && /^\d+$/.test(pedido.pago_externo_id ?? "")) {
         // Brick: se consulta el último intento registrado
         result = await applyMercadoPagoPayment(await getPayment(pedido.pago_externo_id), "sincronizacion");
      } else if (pedido.metodo_pago === "link") {
         // Link: el pago se crea en Mercado Pago, se busca por la referencia del pedido
         const payment = await findPaymentByReference(pedido.referencia);
         if (payment) result = await applyMercadoPagoPayment(payment, "sincronizacion");
      } else if (pedido.proveedor_pago === "mercadopago_point" && pedido.pago_externo_id) {
         result = await applyPointOrder(await getPointOrder(pedido.pago_externo_id), "sincronizacion");
      } else if (pedido.proveedor_pago === "paypal" && pedido.pago_externo_id) {
         result = await applyPaypalOrder(await getPaypalOrder(pedido.pago_externo_id), "sincronizacion");
      }
      return result?.pedido ?? pedido;
   } catch (err) {
      console.error("[pagos] No se pudo sincronizar", pedido.referencia, err.message);
      return pedido;
   }
}