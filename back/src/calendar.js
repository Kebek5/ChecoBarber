import { JWT } from "google-auth-library";

const TZ = "America/Mexico_City";
const OFFSET = "-06:00"; // México ya no usa horario de verano

export const calendarEnabled = () =>
   Boolean(process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CALENDAR_ID);

let auth;
const client = () =>
   (auth ??= new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/calendar"],
   }));

const eventsUrl = () =>
   `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(process.env.GOOGLE_CALENDAR_ID)}/events`;

// "30 min" -> 30
export const minutesOf = (duration) => parseInt(duration, 10) || 30;

function endOf(date, hour, minutes) {
   const [h, m] = hour.split(":").map(Number);
   const total = h * 60 + m + minutes;
   const hh = String(Math.floor(total / 60)).padStart(2, "0");
   const mm = String(total % 60).padStart(2, "0");
   return `${date}T${hh}:${mm}:00`;
}

export async function createCalendarEvent({ id, date, hour, service, clientName, clientTel }) {
   if (!calendarEnabled()) return null;
   const res = await client().request({
      url: eventsUrl(),
      method: "POST",
      data: {
         summary: `${service.nombre} · ${clientName}`,
         description: `Cliente: ${clientName}\nTeléfono: ${clientTel}\nCita #${id}`,
         start: { dateTime: `${date}T${hour}:00`, timeZone: TZ },
         end: { dateTime: endOf(date, hour, minutesOf(service.duracion)), timeZone: TZ },
      },
   });
   return res.data.id;
}

export async function deleteCalendarEvent(eventId) {
   if (!calendarEnabled() || !eventId) return;
   await client().request({ url: `${eventsUrl()}/${eventId}`, method: "DELETE" });
}

// Bloques ocupados del calendario ese día (milisegundos). Si falla, no bloquea nada.
export async function googleBusy(date) {
   if (!calendarEnabled()) return [];
   try {
      const id = process.env.GOOGLE_CALENDAR_ID;
      const res = await client().request({
         url: "https://www.googleapis.com/calendar/v3/freeBusy",
         method: "POST",
         data: {
            timeMin: `${date}T00:00:00${OFFSET}`,
            timeMax: `${date}T23:59:59${OFFSET}`,
            timeZone: TZ,
            items: [{ id }],
         },
      });
      return (res.data.calendars?.[id]?.busy ?? []).map((b) => ({
         start: new Date(b.start).getTime(),
         end: new Date(b.end).getTime(),
      }));
   } catch (e) {
      console.error("[calendar] freeBusy:", e.message);
      return [];
   }
}