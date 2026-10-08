import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";

if (!process.env.JWT_SECRET) {
   throw new Error("Falta JWT_SECRET en .env");   // falla al arrancar, no en el primer login
}

export const hashPassword = (plain) => bcrypt.hash(plain, 12);

// Hash falso: si el correo no existe igual se hace una comparación, para que el tiempo
// de respuesta no revele qué correos están registrados.
const DUMMY_HASH = bcrypt.hashSync("no-existe", 12);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash ?? DUMMY_HASH);

export const signToken = (user) =>
   jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
      subject: String(user.id),
      expiresIn: process.env.JWT_EXPIRES_IN || "2h",
   });

// Se ejecuta en CADA petición. Devuelve { id, role } o null; nunca lanza.
export function userFromRequest(req) {
   const header = req.headers.authorization ?? "";
   if (!header.startsWith("Bearer ")) return null;
   try {
      const p = jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ["HS256"] });
      return { id: p.sub, role: p.role };
   } catch {
      return null;   // vencido o manipulado = anónimo
   }
}

export const fail = (message, code, status) =>
   new GraphQLError(message, { extensions: { code, http: { status } } });

// Errores de entrada del usuario (el frontend los traduce a InvalidInputError)
export const userError = (message) =>
   new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });

export function requireAuth(ctx) {
   if (!ctx.user) throw fail("Debes iniciar sesión.", "UNAUTHENTICATED", 401);
   return ctx.user;
}

export function requireAdmin(ctx) {
   const user = requireAuth(ctx);
   if (user.role !== "ADMIN") throw fail("No tienes permiso para esto.", "FORBIDDEN", 403);
   return user;
}