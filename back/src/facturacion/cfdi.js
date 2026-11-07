import { facturaConfig } from "./config.js";

const esc = (v) =>
   String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

// Trabajamos en centavos (enteros) para no arrastrar errores de punto flotante
const cents = (v) => Math.round(Number(v) * 100);
const fmt = (c) => (c / 100).toFixed(2);

// Fecha en hora de México: YYYY-MM-DDTHH:mm:ss
function fechaMexico(date = new Date()) {
   const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
         timeZone: "America/Mexico_City",
         year: "numeric", month: "2-digit", day: "2-digit",
         hour: "2-digit", minute: "2-digit", second: "2-digit",
         hourCycle: "h23",
      })
         .formatToParts(date)
         .map((x) => [x.type, x.value])
   );
   return { iso: `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`, year: p.year, month: p.month };
}

// Forma de pago SAT según el método de tu tienda
const FORMA_PAGO = {
   mercadopago: "04", // tarjeta de crédito
   link: "04",
   paypal: "04",
   terminal: "04",
   efectivo: "01",
};

/**
   * Construye el XML (sin sello ni timbre).
   * @param {object} pedido  fila de la tabla pedido
   * @param {Array}  lineas  [{ cantidad, precio_unitario, nombre }]
   * @param {object|null} fiscal fila de datos_fiscales (o null → Público en general)
*/

export function buildCfdiXml({ pedido, lineas, fiscal, serie, folio }) {
   const { emisor, claveProdServ, claveUnidad, tasaIva } = facturaConfig;
   const { iso, year, month } = fechaMexico();

   // Los precios ya incluyen IVA → se desglosa la base
   let subtotal = 0;
   let iva = 0;
   const conceptos = lineas.map((l) => {
      const bruto = cents(l.precio_unitario) * Number(l.cantidad);
      const base = Math.round(bruto / (1 + tasaIva));
      const ivaLinea = Math.round(base * tasaIva);
      subtotal += base;
      iva += ivaLinea;
      return { nombre: l.nombre, cantidad: Number(l.cantidad), base, ivaLinea };
   });
   const total = subtotal + iva;

   const publicoGeneral = !fiscal;
   const receptor = publicoGeneral
      ? { rfc: "XAXX010101000", nombre: "PUBLICO EN GENERAL", cp: emisor.cp, regimen: "616", uso: "S01" }
      : { rfc: fiscal.rfc, nombre: fiscal.razon_social, cp: fiscal.codigo_postal, regimen: fiscal.regimen_fiscal, uso: fiscal.uso_cfdi };

   const conceptosXml = conceptos
      .map(
         (c) => `    <cfdi:Concepto ClaveProdServ="${esc(claveProdServ)}" Cantidad="${c.cantidad}" ClaveUnidad="${esc(claveUnidad)}" Descripcion="${esc(c.nombre)}" ValorUnitario="${(c.base / 100 / c.cantidad).toFixed(6)}" Importe="${fmt(c.base)}" ObjetoImp="02">
      <cfdi:Impuestos>
         <cfdi:Traslados>
            <cfdi:Traslado Base="${fmt(c.base)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${fmt(c.ivaLinea)}"/>
         </cfdi:Traslados>
      </cfdi:Impuestos>
   </cfdi:Concepto>`
      )
      .join("\n");

   // Para "Público en general" el SAT exige el nodo InformacionGlobal
   const infoGlobal = publicoGeneral
      ? `  <cfdi:InformacionGlobal Periodicidad="01" Meses="${month}" Año="${year}"/>\n`
      : "";

   return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd" Version="4.0" Serie="${esc(serie)}" Folio="${esc(folio)}" Fecha="${iso}" FormaPago="${FORMA_PAGO[pedido.metodo_pago] ?? "99"}" SubTotal="${fmt(subtotal)}" Moneda="MXN" Total="${fmt(total)}" TipoDeComprobante="I" Exportacion="01" MetodoPago="PUE" LugarExpedicion="${esc(emisor.cp)}">
${infoGlobal}  <cfdi:Emisor Rfc="${esc(emisor.rfc)}" Nombre="${esc(emisor.nombre)}" RegimenFiscal="${esc(emisor.regimen)}"/>
  <cfdi:Receptor Rfc="${esc(receptor.rfc)}" Nombre="${esc(receptor.nombre)}" DomicilioFiscalReceptor="${esc(receptor.cp)}" RegimenFiscalReceptor="${esc(receptor.regimen)}" UsoCFDI="${esc(receptor.uso)}"/>
  <cfdi:Conceptos>
${conceptosXml}
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${fmt(iva)}">
    <cfdi:Traslados>
      <cfdi:Traslado Base="${fmt(subtotal)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${fmt(iva)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
</cfdi:Comprobante>
`;
}