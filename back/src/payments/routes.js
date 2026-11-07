import { Router } from "express";
import { query } from "../db.js";
import { userFromRequest } from "../auth.js";
import { PaymentError, paymentConfig } from "./config.js";
import {
   applyPaymentStatus,
   assertPayable,
   clearTerminalCharge,
   findOrderByReference,
   getOrderLines,
   loadOwnedOrder,
   logEvent,
   publicOrderView,
   savePaymentAttempt,
} from "./orders.js";
import {
   cancelPointOrder,
   createCheckoutApiPayment,
   createPointOrder,
   listTerminals,
   setTerminalPdvMode,
   ticketUrlOf,
} from "./mercadopago.js";
import { capturePaypalOrder, createPaypalOrder } from "./paypal.js";
import { applyMercadoPagoPayment, applyPaypalOrder, syncOrder } from "./sync.js";
import { adminInvoice, issueInvoice, retryInvoice } from "../facturacion/service.js";
import { EMAIL_RE, parseFiscal } from "../facturacion/fiscal.js";

export const paymentsRouter = Router();

// ---------- Autenticación (mismo JWT que GraphQL) ----------

function requireUser(req) {
   const user = userFromRequest(req);
   if (!user) throw new PaymentError("Debes iniciar sesión.", 401);
   return user;
}

function requireAdminUser(req) {
   const user = requireUser(req);
   if (user.role !== "ADMIN") throw new PaymentError("No tienes permiso para esto.", 403);
   return user;
}

async function userEmail(userId) {
   const rows = await query("SELECT correo FROM usuario WHERE id = $1", [userId]);
   return rows[0]?.correo ?? null;
}

const describe = (pedido) => `${paymentConfig.storeName} · Pedido ${pedido.referencia}`;

// ---------- Público: seguimiento ----------

// GET /pagos/estado/:referencia → estado del pedido (sin datos personales)
paymentsRouter.get("/estado/:referencia", async (req, res) => {
   let pedido = await findOrderByReference(req.params.referencia);
   if (!pedido) throw new PaymentError("El pedido no existe.", 404);
   pedido = await syncOrder(pedido);
   res.json(await publicOrderView(pedido));
});

// ---------- Mercado Pago: Checkout API (tarjeta y tiendas de conveniencia) ----------

// POST /pagos/mercadopago/pago  { referencia, formData, deviceId? }
paymentsRouter.post("/mercadopago/pago", async (req, res) => {
   const user = requireUser(req);
   const pedido = await loadOwnedOrder(req.body?.referencia, user);
   assertPayable(pedido, ["mercadopago"]);

   const payment = await createCheckoutApiPayment({
      pedido,
      lines: await getOrderLines(pedido.id),
      formData: req.body?.formData,
      description: describe(pedido),
      fallbackEmail: await userEmail(pedido.cliente_id),
      deviceId: typeof req.body?.deviceId === "string" ? req.body.deviceId.slice(0, 200) : undefined,
   });

   const result = await applyMercadoPagoPayment(payment, "pago_creado");
   res.json({
      referencia: pedido.referencia,
      estado: result?.pedido.estado_pago ?? "pendiente",
      status: payment.status,
      statusDetail: payment.status_detail,
      tipo: payment.payment_type_id, // credit_card, debit_card, ticket
      ticketUrl: ticketUrlOf(payment),
   });
});

// ---------- PayPal ----------

// POST /pagos/paypal/orden  { referencia } → { id } para el botón de PayPal
paymentsRouter.post("/paypal/orden", async (req, res) => {
   const user = requireUser(req);
   const pedido = await loadOwnedOrder(req.body?.referencia, user);
   assertPayable(pedido, ["paypal"]);

   const order = await createPaypalOrder({ pedido, description: describe(pedido) });
   await savePaymentAttempt(pedido.id, { proveedor: "paypal", externoId: order.id });
   await logEvent(pedido.id, "paypal", "orden_creada", "pendiente", { order_id: order.id });
   res.json({ id: order.id });
});

// POST /pagos/paypal/capturar  { referencia, paypalOrderId }
paymentsRouter.post("/paypal/capturar", async (req, res) => {
   const user = requireUser(req);
   const pedido = await loadOwnedOrder(req.body?.referencia, user);
   assertPayable(pedido, ["paypal"]);

   const paypalOrderId = String(req.body?.paypalOrderId ?? "");
   if (!paypalOrderId || paypalOrderId !== pedido.pago_externo_id) {
      throw new PaymentError("La orden de PayPal no corresponde a este pedido.", 400);
   }

   const order = await capturePaypalOrder(paypalOrderId);
   const result = await applyPaypalOrder(order, "pago_capturado");
   res.json({ referencia: pedido.referencia, estado: result?.pedido.estado_pago ?? "pendiente" });
});

// ---------- Admin: cobro al recoger ----------

// GET /pagos/admin/pendientes → pedidos para recoger que aún no se cobran
paymentsRouter.get("/admin/pendientes", async (req, res) => {
   requireAdminUser(req);
   const rows = await query(
      `SELECT p.*, u.nombre AS cliente_nombre, u.telefono AS cliente_telefono
         FROM pedido p
         JOIN usuario u ON u.id = p.cliente_id
         WHERE p.tipo_entrega = 'recoger'
            AND p.metodo_pago IN ('terminal', 'efectivo')
            AND p.estado_pago IN ('pendiente', 'rechazado')
         ORDER BY p.id DESC
         LIMIT 100`
   );
   res.json(
      rows.map((p) => ({
         referencia: p.referencia,
         fecha: p.fecha instanceof Date ? p.fecha.toISOString().slice(0, 10) : p.fecha,
         total: Number(p.total),
         metodoPago: p.metodo_pago,
         estadoPago: p.estado_pago,
         cobroEnTerminal: p.proveedor_pago === "mercadopago_point" ? p.pago_externo_id : null,
         cliente: { nombre: p.cliente_nombre, telefono: p.cliente_telefono },
      }))
   );
});

// POST /pagos/admin/terminal  { referencia, terminalId? } → manda el cobro a la terminal Point
paymentsRouter.post("/admin/terminal", async (req, res) => {
   requireAdminUser(req);
   const pedido = await loadOwnedOrder(req.body?.referencia, { role: "ADMIN" });
   assertPayable(pedido, ["terminal", "efectivo"]);
   if (pedido.tipo_entrega !== "recoger") throw new PaymentError("Solo se cobra en terminal al recoger.", 400);

   const order = await createPointOrder({ pedido, terminalId: req.body?.terminalId });
   await query("UPDATE pedido SET metodo_pago = 'terminal' WHERE id = $1", [pedido.id]);
   await savePaymentAttempt(pedido.id, { proveedor: "mercadopago_point", externoId: order.id });
   await logEvent(pedido.id, "mercadopago_point", "cobro_enviado_a_terminal", order.status, {
      order_id: order.id,
      status: order.status,
   });
   res.json({ referencia: pedido.referencia, orderId: order.id, status: order.status });
});

// POST /pagos/admin/terminal/cancelar  { referencia } → cancela el cobro que está en la terminal
paymentsRouter.post("/admin/terminal/cancelar", async (req, res) => {
   requireAdminUser(req);
   const pedido = await loadOwnedOrder(req.body?.referencia, { role: "ADMIN" });
   if (pedido.proveedor_pago !== "mercadopago_point" || !pedido.pago_externo_id) {
      throw new PaymentError("Este pedido no tiene un cobro en terminal.", 400);
   }
   const order = await cancelPointOrder(pedido.pago_externo_id);
   await logEvent(pedido.id, "mercadopago_point", "cobro_cancelado", order?.status ?? "canceled");
   await clearTerminalCharge(pedido.id, pedido.pago_externo_id);
   res.json({ referencia: pedido.referencia, status: order?.status ?? "canceled" });
});

// POST /pagos/admin/efectivo  { referencia } → el admin confirma que recibió el efectivo
paymentsRouter.post("/admin/efectivo", async (req, res) => {
   const admin = requireAdminUser(req);
   const pedido = await loadOwnedOrder(req.body?.referencia, admin);
   assertPayable(pedido, ["terminal", "efectivo"]);
   if (pedido.tipo_entrega !== "recoger") throw new PaymentError("Solo se cobra en efectivo al recoger.", 400);

   await query("UPDATE pedido SET metodo_pago = 'efectivo' WHERE id = $1", [pedido.id]);
   const result = await applyPaymentStatus(pedido.id, {
      estado: "aprobado",
      proveedor: "efectivo",
      evento: "pago_efectivo_confirmado",
      detalle: { admin_id: admin.id },
   });
   res.json({ referencia: pedido.referencia, estado: result.pedido.estado_pago });
});

// GET /pagos/admin/terminales → terminales Point de la cuenta
paymentsRouter.get("/admin/terminales", async (req, res) => {
   requireAdminUser(req);
   const data = await listTerminals();
   res.json(data?.data?.terminals ?? data?.terminals ?? data?.results ?? []);
});

// POST /pagos/admin/terminales/pdv  { terminalId } → activa el modo PDV (una sola vez por terminal)
paymentsRouter.post("/admin/terminales/pdv", async (req, res) => {
   requireAdminUser(req);
   const terminalId = String(req.body?.terminalId ?? "");
   if (!terminalId) throw new PaymentError("Falta terminalId.", 400);
   res.json(await setTerminalPdvMode(terminalId));
});

// ---------- Facturación ----------

// GET /pagos/datos-fiscales → datos fiscales guardados del usuario (o null)
paymentsRouter.get("/datos-fiscales", async (req, res) => {
   const user = requireUser(req);
   const rows = await query("SELECT * FROM datos_fiscales WHERE usuario_id = $1", [user.id]);
   const d = rows[0];
   res.json(
      d
         ? {
              rfc: d.rfc,
              razonSocial: d.razon_social,
              regimenFiscal: d.regimen_fiscal,
              codigoPostal: d.codigo_postal,
              usoCfdi: d.uso_cfdi,
           }
         : null
   );
});

// POST /pagos/datos-fiscales  { rfc, razonSocial, regimenFiscal, codigoPostal, usoCfdi }
paymentsRouter.post("/datos-fiscales", async (req, res) => {
   const user = requireUser(req);
   const f = parseFiscal(req.body);
   await query(
      `INSERT INTO datos_fiscales (usuario_id, rfc, razon_social, regimen_fiscal, codigo_postal, uso_cfdi)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (usuario_id) DO UPDATE SET
            rfc = EXCLUDED.rfc, razon_social = EXCLUDED.razon_social,
            regimen_fiscal = EXCLUDED.regimen_fiscal, codigo_postal = EXCLUDED.codigo_postal,
            uso_cfdi = EXCLUDED.uso_cfdi`,
      [user.id, f.rfc, f.razon_social, f.regimen_fiscal, f.codigo_postal, f.uso_cfdi]
   );
   res.json({ ok: true });
});

// GET /pagos/factura/:referencia → descarga el XML (dueño del pedido o admin)
paymentsRouter.get("/factura/:referencia", async (req, res) => {
   const user = requireUser(req);
   const pedido = await loadOwnedOrder(req.params.referencia, user);
   const rows = await query("SELECT * FROM factura WHERE pedido_id = $1", [pedido.id]);
   const factura = rows[0];
   if (!factura?.xml) throw new PaymentError("Este pedido aún no tiene factura.", 404);
   res.set({
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="factura-${factura.serie}-${factura.folio}.xml"`,
   });
   res.send(factura.xml);
});

// POST /pagos/factura/:referencia/reenviar → el cliente (o admin) pide o reenvía su factura
paymentsRouter.post("/factura/:referencia/reenviar", async (req, res) => {
   const user = requireUser(req);
   const pedido = await loadOwnedOrder(req.params.referencia, user);
   if (pedido.estado_pago !== "aprobado") throw new PaymentError("El pedido aún no está pagado.", 409);
   const rows = await query("SELECT id FROM factura WHERE pedido_id = $1", [pedido.id]);
   // Si el pedido se pagó antes de existir la facturación, se genera ahora
   const result = rows.length ? await retryInvoice(pedido.id) : await issueInvoice(pedido.id);
   if (result.ok === false) throw new PaymentError(`No se pudo enviar: ${result.error}`, 502);
   res.json({ ok: true });
});

// GET /pagos/admin/facturas → pedidos pagados con el estado de su factura
paymentsRouter.get("/admin/facturas", async (req, res) => {
   requireAdminUser(req);
   const rows = await query(
      `SELECT p.referencia, p.fecha, p.total, p.metodo_pago,
              u.nombre AS cliente, u.correo,
              f.estado AS factura_estado, f.error AS factura_error,
              f.enviada_en, f.correo_destino,
              COALESCE(f.receptor->>'rfc', df.rfc) AS rfc
         FROM pedido p
         JOIN usuario u ON u.id = p.cliente_id
         LEFT JOIN factura f ON f.pedido_id = p.id
         LEFT JOIN datos_fiscales df ON df.usuario_id = p.cliente_id
         WHERE p.estado_pago = 'aprobado'
         ORDER BY p.pagado_en DESC NULLS LAST, p.id DESC
         LIMIT 200`
   );
   res.json(
      rows.map((r) => ({
         referencia: r.referencia,
         fecha: r.fecha,
         total: Number(r.total),
         metodoPago: r.metodo_pago,
         cliente: r.cliente,
         correo: r.correo,
         rfc: r.rfc,
         facturaEstado: r.factura_estado,
         facturaError: r.factura_error,
         enviadaEn: r.enviada_en,
         correoDestino: r.correo_destino,
      }))
   );
});

// POST /pagos/admin/factura/:referencia  { correo?, publicoGeneral?, receptor? }
// Sin receptor ni publicoGeneral → usa los datos fiscales guardados del cliente
paymentsRouter.post("/admin/factura/:referencia", async (req, res) => {
   requireAdminUser(req);
   const pedido = await findOrderByReference(req.params.referencia);
   if (!pedido) throw new PaymentError("El pedido no existe.", 404);
   if (pedido.estado_pago !== "aprobado") throw new PaymentError("El pedido aún no está pagado.", 409);

   const b = req.body ?? {};
   const correo = b.correo ? String(b.correo).trim().toLowerCase() : null;
   if (correo && !EMAIL_RE.test(correo)) throw new PaymentError("El correo no es válido.", 400);

   const receptor = b.publicoGeneral ? { general: true } : b.receptor ? parseFiscal(b.receptor) : null;

   const result = await adminInvoice(pedido.id, { receptor, correo });
   if (!result.ok) throw new PaymentError(`No se pudo enviar: ${result.error}`, 502);
   res.json({ ok: true });
});

// ---------- Manejo de errores ----------

paymentsRouter.use((err, _req, res, _next) => {
   if (err instanceof PaymentError) return res.status(err.status).json({ error: err.message });
   console.error("[pagos]", err);
   res.status(500).json({ error: "Ocurrió un error al procesar el pago." });
});