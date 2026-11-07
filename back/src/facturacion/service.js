import { query } from "../db.js";
import { eventosCollection } from "../mongo.js";
import { facturaConfig } from "./config.js";
import { buildCfdiXml } from "./cfdi.js";
import { sendInvoiceEmail } from "./mailer.js";

async function logEvent(pedidoId, evento, estado, detalle = null) {
   try {
      await eventosCollection().insertOne({
         pedidoId: Number(pedidoId),
         proveedor: "facturacion",
         evento,
         estado,
         detalle,
         creadoEn: new Date(),
      });
   } catch (err) {
      console.error("[bitácora] No se pudo guardar el evento", evento, err.message);
   }
}

/** Automático: genera el XML (una sola vez por pedido) y lo envía al correo del cliente. */
export async function issueInvoice(pedidoId) {
   const reserved = await query(
      `INSERT INTO factura (pedido_id, serie, folio)
         VALUES ($1, $2, $3)
         ON CONFLICT (pedido_id) DO NOTHING
         RETURNING id`,
      [pedidoId, facturaConfig.serie, String(pedidoId)]
   );
   if (!reserved.length) return { skipped: true }; // ya existe
   return buildAndSend(pedidoId);
}

/**
 * Administrador: crea o rehace la factura con datos específicos.
 * receptor: null → datos guardados del cliente | { general: true } → Público en general | datos fiscales (snake_case)
 * correo:   null → correo del cliente
 */
export async function adminInvoice(pedidoId, { receptor = null, correo = null } = {}) {
   await query(
      `INSERT INTO factura (pedido_id, serie, folio, receptor, correo_destino)
         VALUES ($1, $2, $3, $4::jsonb, $5)
         ON CONFLICT (pedido_id) DO UPDATE SET
            receptor = EXCLUDED.receptor,
            correo_destino = COALESCE(EXCLUDED.correo_destino, factura.correo_destino),
            estado = 'generando',
            error = NULL`,
      [
         pedidoId,
         facturaConfig.serie,
         String(pedidoId),
         receptor ? JSON.stringify(receptor) : null,
         correo,
      ]
   );
   return buildAndSend(pedidoId);
}

/** Reintenta una factura existente (por ejemplo, si falló el correo). */
export async function retryInvoice(pedidoId) {
   return buildAndSend(pedidoId);
}

async function buildAndSend(pedidoId) {
   try {
      const [pedido] = await query("SELECT * FROM pedido WHERE id = $1", [pedidoId]);
      const [factura] = await query("SELECT * FROM factura WHERE pedido_id = $1", [pedidoId]);
      const [usuario] = await query("SELECT correo FROM usuario WHERE id = $1", [pedido.cliente_id]);
      const [guardados] = await query("SELECT * FROM datos_fiscales WHERE usuario_id = $1", [pedido.cliente_id]);
      const lineas = await query(
         `SELECT d.cantidad, d.precio_unitario, p.nombre
            FROM detalle_pedido d
            JOIN producto p ON p.id = d.producto_id
            WHERE d.pedido_id = $1
            ORDER BY d.id`,
         [pedidoId]
      );

      // Prioridad: lo que eligió el admin > datos guardados del cliente > Público en general
      const r = factura.receptor;
      const fiscal = r ? (r.general ? null : r) : (guardados ?? null);
      const to = factura.correo_destino ?? usuario.correo;

      const xml = buildCfdiXml({
         pedido,
         lineas,
         fiscal,
         serie: factura.serie,
         folio: factura.folio,
      });

      await query(
         "UPDATE factura SET xml = $1, estado = 'generada', correo_destino = $2, error = NULL WHERE pedido_id = $3",
         [xml, to, pedidoId]
      );
      await logEvent(pedidoId, "factura_generada", "generada");

      await sendInvoiceEmail({
         to,
         referencia: pedido.referencia,
         xml,
         filename: `factura-${factura.serie}-${factura.folio}.xml`,
      });

      await query("UPDATE factura SET estado = 'enviada', enviada_en = now() WHERE pedido_id = $1", [pedidoId]);
      await logEvent(pedidoId, "factura_enviada", "enviada", { to });
      return { ok: true };
   } catch (err) {
      console.error("[facturación]", pedidoId, err.message);
      await query("UPDATE factura SET estado = 'error', error = $1 WHERE pedido_id = $2", [err.message, pedidoId]);
      await logEvent(pedidoId, "factura_error", "error", { message: err.message });
      return { ok: false, error: err.message };
   }
}