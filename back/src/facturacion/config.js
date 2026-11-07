import "dotenv/config";

const env = (name, fallback = "") => (process.env[name] ?? fallback).trim();

export const facturaConfig = {
   serie: env("FACTURA_SERIE", "CB"),
   emisor: {
      rfc: env("FACTURA_RFC_EMISOR"),
      nombre: env("FACTURA_NOMBRE_EMISOR"),
      regimen: env("FACTURA_REGIMEN_EMISOR", "601"),
      cp: env("FACTURA_CP_EXPEDICION"),
   },
   claveProdServ: env("FACTURA_CLAVE_PROD_SERV", "01010101"),
   claveUnidad: env("FACTURA_CLAVE_UNIDAD", "H87"),
   tasaIva: 0.16,
};

export const mailConfig = {
   apiKey: env("RESEND_API_KEY"),
   from: env("MAIL_FROM"),
};

if (!facturaConfig.emisor.rfc || !facturaConfig.emisor.cp) {
   console.warn("[facturación] Faltan FACTURA_RFC_EMISOR / FACTURA_CP_EXPEDICION.");
}
if (!mailConfig.apiKey || !mailConfig.from) {
   console.warn("[facturación] Faltan RESEND_API_KEY / MAIL_FROM: no se enviarán correos.");
}