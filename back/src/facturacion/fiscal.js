import { PaymentError } from "../payments/config.js";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valida los datos fiscales que llegan del front y los devuelve con el formato de la tabla
export function parseFiscal(input = {}) {
   const rfc = String(input.rfc ?? "").trim().toUpperCase();
   const razonSocial = String(input.razonSocial ?? "").trim().toUpperCase();
   const regimen = String(input.regimenFiscal ?? "").trim();
   const cp = String(input.codigoPostal ?? "").trim();
   const uso = String(input.usoCfdi ?? "G03").trim().toUpperCase();

   if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc)) throw new PaymentError("El RFC no es válido.", 400);
   if (!razonSocial) throw new PaymentError("Falta la razón social.", 400);
   if (!/^\d{3}$/.test(regimen)) throw new PaymentError("El régimen fiscal no es válido.", 400);
   if (!/^\d{5}$/.test(cp)) throw new PaymentError("El código postal no es válido.", 400);
   if (!/^[A-Z]\d{2}$/.test(uso)) throw new PaymentError("El uso de CFDI no es válido.", 400);

   return { rfc, razon_social: razonSocial, regimen_fiscal: regimen, codigo_postal: cp, uso_cfdi: uso };
}