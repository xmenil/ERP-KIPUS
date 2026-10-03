export type TipoOperacionCaja = 'INGRESO' | 'EGRESO';
export type MetodoCaja = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA' | 'TRANSFERENCIA';

export interface MovimientoCaja {
  id: string;
  fecha: string;
  tipo: TipoOperacionCaja;
  concepto: string;
  metodo: MetodoCaja;
  monto: number;
  usuario: string;
}

export interface EstadoCaja {
  id: string;
  abierta: boolean;
  turno: string; // 'Mañana' | 'Tarde'
  fechaApertura: string;
  saldoInicial: number;
  ingresosEfectivo: number;
  egresosEfectivo: number;
  ingresosDigitales: number;
  saldoEfectivoEsperado: number;
}

export interface NuevaOperacionCajaPayload {
  tipo: TipoOperacionCaja;
  concepto: string;
  metodo: MetodoCaja;
  monto: number;
}
