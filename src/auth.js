import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";
import { query } from "./db.js";

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error("Falta JWT_SECRET en el archivo .env");

export const hashPassword = (plain) => bcrypt.hash(plain, 10);

export const signToken = (user) =>
   jwt.sign({ sub: String(user.id), role: user.rol }, SECRET, { expiresIn: "2h" });

// Lee "Authorization: Bearer <token>" y devuelve la fila del usuario (o null)
export async function getUserFromRequest(req) {
   const header = req.headers.authorization || "";
   const token = header.startsWith("Bearer ") ? header.slice(7) : null;
   if (!token) return null;

   try {
      const { sub } = jwt.verify(token, SECRET);
      const rows = await query("SELECT * FROM usuario WHERE id = ?", [sub]);
      return rows[0] ?? null;
   } catch {
      return null;
   }
}

export function requireAuth(ctx) {
   if (!ctx.user) {
      throw new GraphQLError("Debes iniciar sesión.", {
         extensions: { code: "UNAUTHENTICATED" },
      });
   }
   return ctx.user;
}

export function requireAdmin(ctx) {
   const user = requireAuth(ctx);
   if (user.rol !== "admin") {
      throw new GraphQLError("No tienes permiso para hacer esto.", {
         extensions: { code: "FORBIDDEN" },
      });
   }
   return user;
}

// Compara con bcrypt. Si la fila todavía tiene texto plano (los datos de db.sql)
// la acepta una vez y la convierte a hash.
export async function checkPassword(user, plain) {
   if (user.contrasena.startsWith("$2")) {
      return bcrypt.compare(plain, user.contrasena);
   }
   if (user.contrasena !== plain) return false;

   await query("UPDATE usuario SET contrasena = ? WHERE id = ?", [
      await hashPassword(plain),
      user.id,
   ]);
   return true;
}