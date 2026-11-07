import { randomBytes } from "node:crypto";
import { pool, query } from "../db.js";
import { PaymentError } from "./config.js";
import { eventosCollection } from "../mongo.js";
import { issueInvoice } from "../facturacion/service.js";

// Referencia pública del pedido: CB- + 12 hex. Sirve como external_reference y en la URL de seguimiento.
export const newReference = () => `CB-${randomBytes(6).toString("hex")}`;

// Un cobro en terminal necesita external_reference único por intento: CB-xxxx-T1a2b. Aquí se recupera la base.
export const baseReference = (externalReference) => {
   const match = /^(CB-[0-9a-f]{12})/.exec(String(externalReference ?? ""));
   return match ? match[1] : null;
};

// Qué cambios de estado se permiten. "rechazado" permite reintentar con otro medio.
const TRANSITIONS = {
   pendiente: ["aprobado", "rechazado", "cancelado"],
   rechazado: ["pendiente", "aprobado", "rechazado", "cancelado"],
   aprobado: ["reembolsado"],
   cancelado: [],
   reembolsado: [],
};

export async function findOrderByReference(referencia) {
   const rows = await query("SELECT * FROM pedido WHERE referencia = $1", [referencia]);
   return rows[0] ?? null;
}

export async function getOrderLines(pedidoId) {
   return query(
      `SELECT d.cantidad, d.precio_unitario, p.id AS producto_id, p.nombre
         FROM detalle_pedido d
         JOIN producto p ON p.id = d.producto_id
         WHERE d.pedido_id = $1
         ORDER BY d.id`,
      [pedidoId]
   );
}

// Carga el pedido y verifica que pertenezca al usuario (o que sea admin)
export async function loadOwnedOrder(referencia, user) {
   if (!referencia) throw new PaymentError("Falta la referencia del pedido.", 400);
   const pedido = await findOrderByReference(referencia);
   if (!pedido) throw new PaymentError("El pedido no existe.", 404);
   if (user.role !== "ADMIN" && String(pedido.cliente_id) !== String(user.id)) {
      throw new PaymentError("Este pedido no te pertenece.", 403);
   }
   return pedido;
}

export function assertPayable(pedido, metodosPermitidos) {
   if (pedido.estado_pago === "aprobado") throw new PaymentError("Este pedido ya está pagado.", 409);
   if (["cancelado", "reembolsado"].includes(pedido.estado_pago)) {
      throw new PaymentError("Este pedido ya no se puede pagar.", 409);
   }
   if (metodosPermitidos && !metodosPermitidos.includes(pedido.metodo_pago)) {
      throw new PaymentError("Ese método de pago no corresponde a este pedido.", 400);
   }
}

export async function logEvent(pedidoId, proveedor, evento, estado = null, detalle = null) {
   try {
      await eventosCollection().insertOne({
         pedidoId: Number(pedidoId),
         proveedor,
         evento,
         estado,
         detalle,
         creadoEn: new Date(),
      });
   } catch (err) {
      console.error("[bitácora] No se pudo guardar el evento", evento, err.message);
   }
}

// Libera el cobro en terminal (cancelado o vencido) para poder enviar uno nuevo
export async function clearTerminalCharge(pedidoId, externoId) {
   await query(
      "UPDATE pedido SET pago_externo_id = NULL WHERE id = $1 AND pago_externo_id = $2 AND estado_pago <> 'aprobado'",
      [pedidoId, externoId]
   );
}

// Guarda datos del intento (id externo, URL) sin cambiar el estado
export async function savePaymentAttempt(pedidoId, { proveedor, externoId = null, url = null }) {
   const rows = await query(
      `UPDATE pedido
         SET proveedor_pago = $1,
            pago_externo_id = COALESCE($2, pago_externo_id),
            url_pago = COALESCE($3, url_pago)
            WHERE id = $4
        RETURNING *`,
      [proveedor, externoId, url, pedidoId]
   );
   return rows[0];
}

export async function applyPaymentStatus(pedidoId, { estado, proveedor, externoId = null, url = null, evento, detalle = null }) {
   const client = await pool.connect();
   const eventosPendientes = [];
   let resultado;
   try {
      await client.query("BEGIN");
      const { rows } = await client.query("SELECT * FROM pedido WHERE id = $1 FOR UPDATE", [pedidoId]);
      const pedido = rows[0];
      if (!pedido) throw new PaymentError("El pedido no existe.", 404);

      eventosPendientes.push([proveedor, evento, estado, detalle]);

      const actual = pedido.estado_pago;
      const permitido = estado === actual || TRANSITIONS[actual]?.includes(estado);

      if (!permitido) {
         await client.query("COMMIT");
         resultado = { pedido, cambio: false };
      } else {
         const { rows: updated } = await client.query(
            `UPDATE pedido
               SET estado_pago = $1::text,
                  proveedor_pago = $2,
                  pago_externo_id = COALESCE($3, pago_externo_id),
                  url_pago = COALESCE($4, url_pago),
                  pagado_en = CASE WHEN $1::text = 'aprobado' THEN COALESCE(pagado_en, now()) ELSE pagado_en END
                  WHERE id = $5
              RETURNING *`,
            [estado, proveedor, externoId, url, pedidoId]
         );

         if (estado === "cancelado" && actual !== "cancelado") {
            await client.query(
               `UPDATE producto p
                  SET stock = p.stock + d.cantidad
                  FROM detalle_pedido d
                  WHERE d.pedido_id = $1 AND d.producto_id = p.id`,
               [pedidoId]
            );
            eventosPendientes.push(["sistema", "stock_devuelto", estado, null]);
         }

         await client.query("COMMIT");
         resultado = { pedido: updated[0], cambio: actual !== estado };
      }
   } catch (err) {
      await client.query("ROLLBACK");
      throw err;
   } finally {
      client.release();
   }

   // Ya confirmado en Postgres: ahora sí se registra la bitácora en Mongo
   for (const [prov, ev, est, det] of eventosPendientes) {
      await logEvent(pedidoId, prov, ev, est, det);
   }

   // Pago aprobado por primera vez → se factura sin bloquear la respuesta al webhook
   if (resultado?.cambio && estado === "aprobado") {
      issueInvoice(pedidoId).catch((err) =>
         console.error("[facturación] No se pudo iniciar la factura", err.message)
      );
   }

   return resultado;
}
// Datos que puede ver cualquiera con el enlace de seguimiento (sin datos personales)
export async function publicOrderView(pedido) {
   const lines = await getOrderLines(pedido.id);
      const eventos = await eventosCollection()
      .find({ pedidoId: pedido.id }, { projection: { _id: 0, evento: 1, estado: 1, creadoEn: 1 } })
      .sort({ creadoEn: 1, _id: 1 })
      .toArray();
   return {
      referencia: pedido.referencia,
      fecha: pedido.fecha instanceof Date ? pedido.fecha.toISOString().slice(0, 10) : pedido.fecha,
      total: Number(pedido.total),
      estadoPedido: pedido.estado,
      estadoPago: pedido.estado_pago,
      metodoPago: pedido.metodo_pago,
      tipoEntrega: pedido.tipo_entrega,
      urlPago: pedido.url_pago,
      pagadoEn: pedido.pagado_en,
      lineas: lines.map((l) => ({
         producto: l.nombre,
         cantidad: l.cantidad,
         precioUnitario: Number(l.precio_unitario),
      })),
            eventos: eventos.map((e) => ({ evento: e.evento, estado: e.estado, fecha: e.creadoEn })),
   };
}