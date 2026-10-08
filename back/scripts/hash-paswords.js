import "dotenv/config";
import { pool, query } from "../src/db.js";
import { hashPassword } from "../src/auth.js";

for (const u of await query("SELECT id, contrasena FROM usuario")) {
   if (u.contrasena.startsWith("$2")) continue;   // ya es bcrypt
   await query("UPDATE usuario SET contrasena = $1 WHERE id = $2", [
      await hashPassword(u.contrasena), u.id,
   ]);
}
await pool.end();
console.log("Contraseñas migradas.");