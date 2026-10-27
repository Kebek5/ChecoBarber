import { query } from "./db.js";

const num = (v) => Number(v ?? 0);
const round2 = (v) => Math.round(num(v) * 100) / 100;

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const METHOD_LABEL = {
   mercadopago: "Mercado Pago",
   link: "Link de pago",
   paypal: "PayPal",
   terminal: "Terminal",
   efectivo: "Efectivo",
};

const PAYMENT_STATUS_LABEL = {
   pendiente: "Pendiente",
   aprobado: "Aprobado",
   rechazado: "Rechazado",
   cancelado: "Cancelado",
   reembolsado: "Reembolsado",
};

const points = (rows, labelOf = (l) => l) =>
   rows.map((r) => ({ label: labelOf(r.label), value: round2(r.value) }));

/**
 * Estadísticas del panel de administración, calculadas con SQL.
 * "Ingresos" de la tienda = pedidos con pago aprobado; de citas = citas completadas.
 */
export async function adminStats(days = 30) {
   const span = Math.min(Math.max(Math.trunc(days) || 30, 7), 90);

   const [daily, monthly, byCategory, byMethod, byPaymentStatus, byWeekday, heat, byService, topProducts] =
      await Promise.all([
         query(
            `SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
                    COALESCE((SELECT SUM(p.total) FROM pedido p
                               WHERE p.fecha = d.day AND p.estado_pago = 'aprobado'), 0) AS shop,
                    COALESCE((SELECT SUM(c.precio) FROM cita c
                               WHERE c.fecha = d.day AND c.estado = 'completada'), 0) AS appointments,
                    (SELECT COUNT(*) FROM pedido p WHERE p.fecha = d.day) AS orders
               FROM (SELECT g::date AS day
                       FROM generate_series(CURRENT_DATE - ($1::int - 1), CURRENT_DATE, interval '1 day') g) d
              ORDER BY d.day`,
            [span]
         ),
         query(
            `SELECT to_char(m.month, 'YYYY-MM') AS month,
                    COALESCE((SELECT SUM(p.total) FROM pedido p
                               WHERE date_trunc('month', p.fecha) = m.month AND p.estado_pago = 'aprobado'), 0) AS shop,
                    COALESCE((SELECT SUM(c.precio) FROM cita c
                               WHERE date_trunc('month', c.fecha) = m.month AND c.estado = 'completada'), 0) AS appointments
               FROM (SELECT date_trunc('month', CURRENT_DATE) - (n || ' month')::interval AS month
                       FROM generate_series(0, 5) n) m
              ORDER BY m.month`
         ),
         query(
            `SELECT c.nombre AS label, SUM(d.cantidad * d.precio_unitario) AS value
               FROM detalle_pedido d
               JOIN pedido p ON p.id = d.pedido_id
               JOIN producto pr ON pr.id = d.producto_id
               JOIN categoria c ON c.id = pr.categoria_id
              WHERE p.estado_pago = 'aprobado'
              GROUP BY c.nombre
              ORDER BY value DESC`
         ),
         query(`SELECT metodo_pago AS label, COUNT(*) AS value FROM pedido GROUP BY metodo_pago ORDER BY value DESC`),
         query(`SELECT estado_pago AS label, COUNT(*) AS value FROM pedido GROUP BY estado_pago ORDER BY value DESC`),
         query(
            `SELECT EXTRACT(ISODOW FROM fecha)::int AS weekday, COUNT(*) AS value
               FROM cita WHERE estado <> 'cancelada' GROUP BY 1`
         ),
         query(
            `SELECT EXTRACT(ISODOW FROM fecha)::int AS weekday,
                    EXTRACT(HOUR FROM hora)::int AS hour,
                    COUNT(*) AS value
               FROM cita WHERE estado <> 'cancelada' GROUP BY 1, 2`
         ),
         query(
            `SELECT s.nombre AS label, SUM(c.precio) AS value
               FROM cita c JOIN servicio s ON s.id = c.servicio_id
              WHERE c.estado = 'completada'
              GROUP BY s.nombre ORDER BY value DESC LIMIT 6`
         ),
         query(
            `SELECT pr.nombre AS label, SUM(d.cantidad) AS value
               FROM detalle_pedido d
               JOIN pedido p ON p.id = d.pedido_id
               JOIN producto pr ON pr.id = d.producto_id
              WHERE p.estado_pago = 'aprobado'
              GROUP BY pr.nombre ORDER BY value DESC LIMIT 6`
         ),
      ]);

   const weekdayCount = new Map(byWeekday.map((r) => [r.weekday, num(r.value)]));

   return {
      days: span,
      salesByDay: daily.map((r) => ({
         date: r.date,
         shop: round2(r.shop),
         appointments: round2(r.appointments),
         orders: num(r.orders),
      })),
      salesByMonth: monthly.map((r) => ({
         month: r.month,
         shop: round2(r.shop),
         appointments: round2(r.appointments),
      })),
      revenueByCategory: points(byCategory),
      ordersByPaymentMethod: points(byMethod, (l) => METHOD_LABEL[l] ?? l),
      ordersByPaymentStatus: points(byPaymentStatus, (l) => PAYMENT_STATUS_LABEL[l] ?? l),
      appointmentsByWeekday: WEEKDAYS.map((label, i) => ({ label, value: weekdayCount.get(i + 1) ?? 0 })),
      appointmentHeatmap: heat.map((r) => ({ weekday: r.weekday, hour: r.hour, count: num(r.value) })),
      revenueByService: points(byService),
      topProductsPaid: points(topProducts),
   };
}
