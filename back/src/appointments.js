import { query } from "./db.js";
import { googleBusy, minutesOf } from "./calendar.js";

const OPEN = 10 * 60;   // 10:00
const CLOSE = 19 * 60;  // 19:00
const STEP = 30;
const OFFSET = "-06:00";

const toMin = (hhmm) => {
   const [h, m] = hhmm.split(":").map(Number);
   return h * 60 + m;
};
const toHour = (min) =>
   `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export async function availableHours(date, service) {
   // Domingo cerrado
   if (new Date(`${date}T12:00:00${OFFSET}`).getUTCDay() === 0) return [];

   const need = minutesOf(service.duracion);

   const rows = await query(
      `SELECT c.hora, s.duracion
         FROM cita c JOIN servicio s ON s.id = c.servicio_id
        WHERE c.fecha = $1 AND c.estado <> 'cancelada'`,
      [date]
   );
   const busy = rows.map((r) => {
      const start = toMin(String(r.hora).slice(0, 5));
      return [start, start + minutesOf(r.duracion)];
   });

   const dayStart = new Date(`${date}T00:00:00${OFFSET}`).getTime();
   for (const g of await googleBusy(date)) {
      busy.push([(g.start - dayStart) / 60000, (g.end - dayStart) / 60000]);
   }

   const now = Date.now();
   const free = [];
   for (let t = OPEN; t + need <= CLOSE; t += STEP) {
      if (dayStart + t * 60000 <= now) continue;                    // ya pasó
      if (busy.some(([a, b]) => t < b && t + need > a)) continue;  // se empalma
      free.push(toHour(t));
   }
   return free;
}