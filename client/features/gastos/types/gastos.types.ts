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
  hora?: string;
  categoria: CategoriaGasto;
  descripcion: string;
  beneficiario: string;
  comprobante: string;
  monto: number;
  metodoPago: string;
  usuario?: string;
  sucursal?: string;
  cajaNombre?: string;
  estado?: 'REGISTRADO' | 'ANULADO';
  fechaAnulacion?: string;
  motivoAnulacion?: string;
}

export interface NuevoGastoPayload {
  categoria: CategoriaGasto;
  descripcion: string;
  beneficiario?: string;
  comprobante?: string;
  monto: number;
  metodoPago: string;
  fecha?: string;
}
