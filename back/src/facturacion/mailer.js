import { mailConfig } from "./config.js";

export async function sendInvoiceEmail({ to, referencia, xml, filename }) {
   if (!mailConfig.apiKey || !mailConfig.from) {
      throw new Error("El correo no está configurado (RESEND_API_KEY / MAIL_FROM).");
   }

   const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
         Authorization: `Bearer ${mailConfig.apiKey}`,
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         from: mailConfig.from,
         to: [to],
         subject: `Tu factura del pedido ${referencia}`,
         html: `<p>¡Gracias por tu compra!</p>
                  <p>Adjuntamos el XML de la factura de tu pedido <strong>${referencia}</strong>.</p>`,
         attachments: [
            { filename, content: Buffer.from(xml, "utf-8").toString("base64") },
         ],
      }),
   });

   if (!res.ok) {
      throw new Error(`Resend respondió ${res.status}: ${await res.text()}`);
   }
   return res.json();
}