import pg from "pg";
import "dotenv/config";


export const pool = new pg.Pool({
   host: process.env.DB_HOST || "localhost",
   port: Number(process.env.DB_PORT) || 5432,
   user: process.env.DB_USER || "postgres",
   password: process.env.DB_PASSWORD || "",
   database: process.env.DB_NAME || "p26_ecommerce",
   max: 10,

   ssl: {
      rejectUnauthorized: false,
   },
});


export async function query(sql, params = []) {
   const result = await pool.query(sql, params);
   return result.rows;
}
