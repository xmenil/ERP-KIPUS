export type CategoriaGasto =
  | 'ALQUILER'
  | 'SERVICIOS_BASICOS'
  | 'PLANILLA'
  | 'LOGISTICA'
  | 'MANTENIMIENTO'
  | 'MARKETING'
  | 'OTROS';

export interface Gasto {
  id: string;
  fecha: string;
  categoria: CategoriaGasto;
  descripcion: string;
  beneficiario: string;
  comprobante: string;
  monto: number;
  metodoPago: string;
}

export interface NuevoGastoPayload {
  categoria: CategoriaGasto;
  descripcion: string;
  beneficiario: string;
  comprobante: string;
  monto: number;
  metodoPago: string;
}
