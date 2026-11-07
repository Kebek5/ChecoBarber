export interface DatosFiscales {
   rfc: string
   razonSocial: string
   regimenFiscal: string
   codigoPostal: string
   usoCfdi: string
}

export const EMPTY_FISCAL: DatosFiscales = {
   rfc: '',
   razonSocial: '',
   regimenFiscal: '612',
   codigoPostal: '',
   usoCfdi: 'G03',
}

export const REGIMENES = [
   { id: '601', label: '601 · General de Ley Personas Morales' },
   { id: '603', label: '603 · Personas Morales con fines no lucrativos' },
   { id: '605', label: '605 · Sueldos y salarios' },
   { id: '606', label: '606 · Arrendamiento' },
   { id: '612', label: '612 · Personas Físicas con actividad empresarial' },
   { id: '616', label: '616 · Sin obligaciones fiscales' },
   { id: '621', label: '621 · Incorporación Fiscal' },
   { id: '625', label: '625 · Plataformas tecnológicas' },
   { id: '626', label: '626 · RESICO' },
] as const

export const USOS_CFDI = [
   { id: 'G01', label: 'G01 · Adquisición de mercancías' },
   { id: 'G03', label: 'G03 · Gastos en general' },
   { id: 'S01', label: 'S01 · Sin efectos fiscales' },
] as const