import pg from "pg";
import "dotenv/config";

// DATE (oid 1082) se entrega como texto "YYYY-MM-DD". Por defecto pg lo convierte a Date en la zona
// horaria del servidor, y al serializarlo con toISOString() el día puede correrse uno hacia atrás.
pg.types.setTypeParser(1082, (value) => value);


export const pool = new pg.Pool({
   host: process.env.DB_HOST,
   port: Number(process.env.DB_PORT) || 5432,
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   database: process.env.DB_NAME,
   max: 10,

   ssl: {
      rejectUnauthorized: false,
   },
});


export async function query(sql, params = []) {
   const result = await pool.query(sql, params);
   return result.rows;
}
