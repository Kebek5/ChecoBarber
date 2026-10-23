import { pool, query } from "./db.js";
import { createMpCheckout, verifyMpPayment, createPaypalCheckout, capturePaypal } from "./payments.js";
import { newReference, logEvent } from "./payments/orders.js";
import {
   hashPassword, verifyPassword, signToken,
   requireAuth, requireAdmin, fail, userError,
} from "./auth.js";


const roleToGraphQL = (rol) => (rol === "admin" ? "ADMIN" : "CLIENT");
const roleToDB = (role) => (role === "ADMIN" ? "admin" : "cliente");

const orderStatusToGraphQL = (estado) =>
   ({ pendiente: "PENDING", en_proceso: "IN_PROCESS", realizado: "COMPLETED" })[
      estado
   ] ?? "PENDING";

const appointmentStatusToGraphQL = (estado) =>
   ({ pendiente: "PENDING", completada: "COMPLETED", cancelada: "CANCELLED" })[
      estado
   ] ?? "PENDING";

const orderStatusToDB = (status) =>
   ({ PENDING: "pendiente", IN_PROCESS: "en_proceso", COMPLETED: "realizado" })[status];

const appointmentStatusToDB = (status) =>
   ({ PENDING: "pendiente", COMPLETED: "completada", CANCELLED: "cancelada" })[status];

const ORDER_FLOW = ["pendiente", "en_proceso", "realizado"];


const mapUser = (row) => ({
   id: row.id,
   name: row.nombre,
   tel: row.telefono,
   email: row.correo,
   role: roleToGraphQL(row.rol),
});

const mapCategory = (row) => ({
   id: row.id,
   name: row.nombre,
   description: row.descripcion,
});

const mapProduct = (row) => {
   const product = {
      id: row.id,
      name: row.nombre,
      description: row.descripcion,
      price: row.precio,
      stock: row.stock,
      img: row.imagen,
      categoryId: row.categoria_id,
   };
   // Si la consulta trajo la categoría con JOIN, se adjunta y se evita otra consulta
   if (row.categoria_nombre !== undefined) {
      product.category = row.categoria_id == null
         ? null
         : { id: row.categoria_id, name: row.categoria_nombre, description: row.categoria_descripcion };
   }
   return product;
};

const PAYMENT_METHOD_TO_DB = {
   MERCADOPAGO: "mercadopago",
   LINK: "link",
   PAYPAL: "paypal",
   TERMINAL: "terminal",
   CASH: "efectivo",
};

const PAYMENT_METHOD_TO_GQL = Object.fromEntries(
   Object.entries(PAYMENT_METHOD_TO_DB).map(([gql, db]) => [db, gql])
);

const PAYMENT_STATUS_TO_GQL = {
   pendiente: "PENDING",
   aprobado: "APPROVED",
   rechazado: "REJECTED",
   cancelado: "CANCELLED",
   reembolsado: "REFUNDED",
};

const mapOrder = (row) => ({
   id: row.id,
   date:
      row.fecha instanceof Date
         ? row.fecha.toISOString().slice(0, 10)
         : row.fecha,
   total: row.total,
   status: orderStatusToGraphQL(row.estado),
   clientId: row.cliente_id,
   reference: row.referencia,
   paymentMethod: PAYMENT_METHOD_TO_GQL[row.metodo_pago] ?? "CASH",
   paymentStatus: PAYMENT_STATUS_TO_GQL[row.estado_pago] ?? "PENDING",
   deliveryType: row.tipo_entrega === "recoger" ? "PICKUP" : "SHIPPING",
   address: row.direccion,
   paymentUrl: row.url_pago,
});

const mapOrderDetail = (row) => ({
   id: row.id,
   amount: row.cantidad,
   unitPrice: row.precio_unitario,
   productId: row.producto_id,
   orderId: row.pedido_id,
});

const mapService = (row) => ({
   id: row.id,
   name: row.nombre,
   description: row.descripcion,
   price: row.precio,
   duration: row.duracion,
});

const mapAppointment = (row) => ({
   id: row.id,
   date:
      row.fecha instanceof Date
         ? row.fecha.toISOString().slice(0, 10)
         : row.fecha,
   hour: typeof row.hora === "string" ? row.hora.slice(0, 5) : row.hora,
   state: appointmentStatusToGraphQL(row.estado),
   price: row.precio,
   clientId: row.cliente_id,
   serviceId: row.servicio_id,
});
async function ownOrder(id, user) {
   const rows = await query("SELECT * FROM pedido WHERE id = $1 AND cliente_id = $2", [id, user.id]);
   if (!rows[0]) throw userError("Pedido no encontrado.");
   return rows[0];
}
export const resolvers = {
   Query: {
      // Catálogo con paginación simple vía LIMIT/OFFSET en SQL.
      products: async (_, { limit, offset }) => {
         let sql = `SELECT p.*, c.nombre AS categoria_nombre, c.descripcion AS categoria_descripcion
            FROM producto p
            LEFT JOIN categoria c ON c.id = p.categoria_id
            ORDER BY p.id`;

         const params = [];
         if (limit != null) {
            params.push(Number(limit));
            sql += ` LIMIT $${params.length}`;

            if (offset != null) {
               params.push(Number(offset));
               sql += ` OFFSET $${params.length}`;
            }
         }
         const rows = await query(sql, params);
         return rows.map(mapProduct);
      },

      product: async (_, { id }) => {
         const rows = await query("SELECT * FROM producto WHERE id = $1", [id]);
         return rows[0] ? mapProduct(rows[0]) : null;
      },

      categories: async () => {
         const rows = await query("SELECT * FROM categoria ORDER BY id");
         return rows.map(mapCategory);
      },

      category: async (_, { id }) => {
         const rows = await query("SELECT * FROM categoria WHERE id = $1", [id]);
         return rows[0] ? mapCategory(rows[0]) : null;
      },

      users: async (_, __, ctx) => {
         requireAdmin(ctx);
         const rows = await query("SELECT * FROM usuario ORDER BY id");
         return rows.map(mapUser);
      },

      me: async (_, __, ctx) => {
         const { id } = requireAuth(ctx);
         const rows = await query("SELECT * FROM usuario WHERE id = $1", [id]);
         return rows[0] ? mapUser(rows[0]) : null;
      },

      orders: async (_, __, ctx) => {
         const user = requireAuth(ctx);
         const rows = user.role === "ADMIN"
            ? await query("SELECT * FROM pedido ORDER BY fecha DESC, id DESC")
            : await query(
               "SELECT * FROM pedido WHERE cliente_id = $1 ORDER BY fecha DESC, id DESC",
               [user.id]
            );
         return rows.map(mapOrder);
      },

      order: async (_, { id }, ctx) => {
         const user = requireAuth(ctx);
         const rows = await query("SELECT * FROM pedido WHERE id = $1", [id]);
         const row = rows[0];
         if (!row) return null;
         // String(): el id de la BD es número y el del JWT es string
         if (user.role !== "ADMIN" && String(row.cliente_id) !== String(user.id)) return null;
         return mapOrder(row);
      },

      appointments: async (_, __, ctx) => {
         const user = requireAuth(ctx);
         const rows = user.role === "ADMIN"
            ? await query("SELECT * FROM cita ORDER BY fecha, hora")
            : await query(
               "SELECT * FROM cita WHERE cliente_id = $1 ORDER BY fecha, hora",
               [user.id]
            );
         return rows.map(mapAppointment);
      },

      appointment: async (_, { id }, ctx) => {
         const user = requireAuth(ctx);
         const rows = await query("SELECT * FROM cita WHERE id = $1", [id]);
         const row = rows[0];
         if (!row) return null;
         if (user.role !== "ADMIN" && String(row.cliente_id) !== String(user.id)) return null;
         return mapAppointment(row);
      },

      services: async (_, { limit, offset }) => {
         let sql = "SELECT * FROM servicio ORDER BY id";
         const params = [];
         if (limit != null) {
            params.push(Number(limit));
            sql += ` LIMIT $${params.length}`;
            if (offset != null) {
               params.push(Number(offset));
               sql += ` OFFSET $${params.length}`;
            }
         }
         const rows = await query(sql, params);
         return rows.map(mapService);
      },

      service: async (_, { id }) => {
         const rows = await query("SELECT * FROM servicio WHERE id = $1", [id]);
         return rows[0] ? mapService(rows[0]) : null;
      },
   },

   Mutation: {
      createProduct: async (_, { data }, ctx) => {
         requireAdmin(ctx);

         const { name, description, price, stock, categoryId, img } = data;
         const rows = await query(
            `INSERT INTO producto (nombre, descripcion, precio, stock, categoria_id, imagen)
               VALUES ($1, $2, $3, $4, $5, $6)
               RETURNING *`,
            [name, description, price, stock, categoryId, img]
         );
         return mapProduct(rows[0]);
      },

      updateProduct: async (_, { id, data }, ctx) => {
         requireAdmin(ctx);

         const { name, description, price, stock, categoryId, img } = data;
         const rows = await query(
            `UPDATE producto
               SET nombre = $1, descripcion = $2, precio = $3, stock = $4, categoria_id = $5, imagen = $6
               WHERE id = $7
               RETURNING *`,
            [name, description, price, stock, categoryId, img, id]
         );
         if (rows.length === 0) return null;
         return mapProduct(rows[0]);
      },

      deleteProduct: async (_, { id }, ctx) => {
         requireAdmin(ctx);

         try{
            const result = await pool.query("DELETE FROM producto WHERE id = $1", [id]);
            return result.rowCount > 0;

         } catch(e){
            if (e.code === "23503")
               throw new userError("No se puede eliminar: el producto ya forma parte de pedidos. Deja su stock en 0.");

            throw e;
         }
      },

      createCategory: async (_, { data }, ctx) => {
         requireAdmin(ctx);
         const { name, description } = data;
         const rows = await query(
            "INSERT INTO categoria (nombre, descripcion) VALUES ($1, $2) RETURNING *",
            [name, description]
         );
         return mapCategory(rows[0]);
      },

      updateOrderStatus: async (_, { id, status }, ctx) => {
         requireAdmin(ctx);
         const next = orderStatusToDB(status);
         const allowedFrom = ORDER_FLOW.slice(0, ORDER_FLOW.indexOf(next));   // solo hacia adelante

         // No se envía ni se entrega un pedido sin pago aprobado
         const [current] = await query("SELECT tipo_entrega, estado_pago FROM pedido WHERE id = $1", [id]);
         if (current && current.estado_pago !== "aprobado") {
            const needsPayment = next === "realizado" || (next === "en_proceso" && current.tipo_entrega === "envio");
            if (needsPayment) throw userError("El pedido aún no tiene un pago aprobado.");
         }
         
         const rows = await query(
            "UPDATE pedido SET estado = $1 WHERE id = $2 AND estado = ANY($3) RETURNING *",
            [next, id, allowedFrom]);

         if (rows[0]) return mapOrder(rows[0]);

         const exists = await query("SELECT 1 FROM pedido WHERE id = $1", [id]);

         if (exists.length === 0) return null;
         
         throw userError("El pedido no puede cambiar a ese estado.");
      },

      register: async (_, { data }) => {
         const { name, tel, password } = data;
         const email = data.email.trim().toLowerCase();
         if (password.length < 8)
            throw userError("La contraseña debe tener al menos 8 caracteres.");
         try {
            const rows = await query(
               `INSERT INTO usuario (nombre, telefono, correo, contrasena, rol)
               VALUES ($1, $2, $3, $4, 'cliente') RETURNING *`,
               [name.trim(), tel.trim(), email, await hashPassword(password)]
            );
            const user = mapUser(rows[0]);
            return { token: signToken(user), user };
         } catch (e) {
            if (e.code === "23505") throw userError("Ese correo ya está registrado.");  // unique_violation
            throw e;
         }
      },

      login: async (_, { data }) => {
         const rows = await query(
            "SELECT * FROM usuario WHERE lower(correo) = $1",
            [data.email.trim().toLowerCase()]
         );
         const row = rows[0];
         const match = await verifyPassword(data.password, row?.contrasena);
         if (!row || !match)   // mismo mensaje para "no existe" y "contraseña mala"
            throw fail("Correo o contraseña incorrectos.", "UNAUTHENTICATED", 401);
         const user = mapUser(row);
         return { token: signToken(user), user };
      }, 

      createOrder: async (_, { data }, ctx) => {
         const idClient = requireAuth(ctx).id;
         const { lines, paymentMethod, deliveryType } = data;
         const address = (data.address ?? "").trim();

         if (!lines || lines.length === 0) {
            throw userError("El pedido debe tener al menos un renglón (producto y cantidad).");
         }
         if (deliveryType === "SHIPPING" && !address) {
            throw userError("Escribe la dirección de entrega.");
         }
         if (["TERMINAL", "CASH"].includes(paymentMethod) && deliveryType !== "PICKUP") {
            throw userError("El pago en terminal o en efectivo solo está disponible al recoger en tienda.");
         }

         const connection = await pool.connect();
         try {
            await connection.query("BEGIN");

            let total = 0;
            const resolvedLines = [];

            for (const line of lines) {
               const { rows: productRows } = await connection.query(
                  "SELECT * FROM producto WHERE id = $1 FOR UPDATE",
                  [line.idProduct]
               );
               const product = productRows[0];
               if (!product) {
                  throw userError(`Producto ${line.idProduct} no existe.`);
               }
               if (product.stock < line.amount) {
                  throw userError(`Stock insuficiente para "${product.nombre}".`);
               }

               const unitPrice = product.precio;
               total += unitPrice * line.amount;
               resolvedLines.push({ ...line, unitPrice });
            }

            total = Math.round(total * 100) / 100;

            const { rows: orderRows } = await connection.query(
               `INSERT INTO pedido (fecha, total, estado, cliente_id,
                  tipo_entrega, direccion, metodo_pago, estado_pago, referencia)
                  VALUES (CURRENT_DATE, $1, 'pendiente', $2, $3, $4, $5, 'pendiente', $6)
                  RETURNING *`,
               [
                  total,
                  idClient,
                  deliveryType === "PICKUP" ? "recoger" : "envio",
                  deliveryType === "PICKUP" ? null : address,
                  PAYMENT_METHOD_TO_DB[paymentMethod],
                  newReference(),
               ]
            );
            const orderId = orderRows[0].id;

            

            for (const line of resolvedLines) {
               await connection.query(
                  `INSERT INTO detalle_pedido (cantidad, precio_unitario, pedido_id, producto_id)
                     VALUES ($1, $2, $3, $4)`,
                  [line.amount, line.unitPrice, orderId, line.idProduct]
               );
               await connection.query(
                  "UPDATE producto SET stock = stock - $1 WHERE id = $2",
                  [line.amount, line.idProduct]
               );
            }

            await connection.query("COMMIT");

                        await logEvent(orderId, PAYMENT_METHOD_TO_DB[paymentMethod], "pedido_creado", "pendiente");

            return mapOrder(orderRows[0]);
         } catch (err) {
            await connection.query("ROLLBACK");
            throw err;
         } finally {
            connection.release();
         }
      },
            startPayment: async (_, { orderId, method }, ctx) => {
         const order = await ownOrder(orderId, requireAuth(ctx));
         if (order.estado_pago === "pagado") throw userError("Este pedido ya está pagado.");
         if (method === "MERCADOPAGO") {
            const items = await query(
               `SELECT p.id, p.nombre AS title, d.cantidad AS quantity, d.precio_unitario AS unit_price
                  FROM detalle_pedido d JOIN producto p ON p.id = d.producto_id
                 WHERE d.pedido_id = $1`, [order.id]);
            const url = await createMpCheckout(order, items);
            await query("UPDATE pedido SET metodo_pago = 'mercadopago' WHERE id = $1", [order.id]);
            return { url };
         }
         const pp = await createPaypalCheckout(order);
         await query("UPDATE pedido SET metodo_pago = 'paypal', pago_ref = $2 WHERE id = $1", [order.id, pp.id]);
         return { url: pp.url };
      },

      confirmPayment: async (_, { orderId, ref }, ctx) => {
         const order = await ownOrder(orderId, requireAuth(ctx));
         if (order.estado_pago === "pagado") return { orderId, paid: true, status: "pagado" };
         let paid = false;
         if (order.metodo_pago === "mercadopago") paid = await verifyMpPayment(order, ref);
         else if (order.metodo_pago === "paypal") paid = await capturePaypal(order);
         if (paid) {
            await query(
               "UPDATE pedido SET estado_pago = 'pagado', pago_ref = COALESCE($2, pago_ref) WHERE id = $1",
               [order.id, order.metodo_pago === "mercadopago" ? ref : null]);
         }
         return { orderId, paid, status: paid ? "pagado" : "pendiente" };
      },

      createAppointment: async (_, { data }, ctx) => {
         const idClient = requireAuth(ctx).id;
         const { date, hour, idService } = data;

         const serviceRows = await query("SELECT * FROM servicio WHERE id = $1", [idService]);
         const service = serviceRows[0];
         if (!service) {
            throw new Error(`Servicio ${idService} no existe.`);
         }

         const rows = await query(
            `INSERT INTO cita (fecha, hora, estado, precio, cliente_id, servicio_id)
               VALUES ($1, $2, 'pendiente', $3, $4, $5)
               RETURNING *`,
            [date, hour, service.precio, idClient, idService]
         );
         return mapAppointment(rows[0]);
      },

      updateAppointmentStatus: async (_, { id, status }, ctx) => {
         requireAdmin(ctx);
         const next = appointmentStatusToDB(status);
         const allowedFrom = next === "pendiente" ? [] : ["pendiente"];
         const rows = await query(
            "UPDATE cita SET estado = $1 WHERE id = $2 AND estado = ANY($3) RETURNING *",
            [next, id, allowedFrom]);
         if (rows[0]) return mapAppointment(rows[0]);
         const exists = await query("SELECT 1 FROM cita WHERE id = $1", [id]);
         if (exists.length === 0) return null;
         throw userError("La cita no puede cambiar a ese estado.");
      },


      createService: async (_, { data }, ctx) => {
         requireAdmin(ctx);
         
         const { name, description, price, duration } = data;
         const rows = await query(
            "INSERT INTO servicio (nombre, descripcion, precio, duracion) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, description, price, duration]
         );
         return mapService(rows[0]);
      },
   },

   Category: {
      products: async (category) => {
         const rows = await query("SELECT * FROM producto WHERE categoria_id = $1", [
            category.id,
         ]);
         return rows.map(mapProduct);
      },
   },

   Product: {
      category: async (product) => {
         if ("category" in product) return product.category;
         const rows = await query("SELECT * FROM categoria WHERE id = $1", [product.categoryId]);
         return rows[0] ? mapCategory(rows[0]) : null;
      },
   },

   Order: {
      client: async (order) => {
         const rows = await query("SELECT * FROM usuario WHERE id = $1", [order.clientId]);
         return rows[0] ? mapUser(rows[0]) : null;
      },
      lines: async (order) => {
         const rows = await query("SELECT * FROM detalle_pedido WHERE pedido_id = $1", [
            order.id,
         ]);
         return rows.map(mapOrderDetail);
      },
   },

   OrderDetail: {
      product: async (line) => {
         const rows = await query("SELECT * FROM producto WHERE id = $1", [line.productId]);
         return rows[0] ? mapProduct(rows[0]) : null;
      },
   },

   Appointment: {
      client: async (appointment) => {
         const rows = await query("SELECT * FROM usuario WHERE id = $1", [appointment.clientId]);
         return rows[0] ? mapUser(rows[0]) : null;
      },
      service: async (appointment) => {
         const rows = await query("SELECT * FROM servicio WHERE id = $1", [
            appointment.serviceId,
         ]);
         return rows[0] ? mapService(rows[0]) : null;
      },
   },
};
