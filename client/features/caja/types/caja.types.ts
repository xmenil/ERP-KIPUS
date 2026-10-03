export type TipoOperacionCaja = 'INGRESO' | 'EGRESO';
export type MetodoCaja = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA' | 'TRANSFERENCIA';
export type EstadoCajaTipo = 'ABIERTA' | 'CERRADA' | 'EN_ARQUEO' | 'DIFERENCIA';
export type EstadoCierreTipo = 'CUADRADA' | 'CON_DIFERENCIA';

export interface MovimientoCaja {
  id: string;
  fecha: string;
  hora: string;
  tipo: TipoOperacionCaja;
  concepto: string;
  metodo: MetodoCaja;
  monto: number;
  usuario: string;
  sucursal?: string;
  cajaNombre?: string;
  origenTipo?: 'VENTA' | 'GASTO' | 'APERTURA' | 'INGRESO_MANUAL' | 'EGRESO_MANUAL' | 'DEVOLUCION';
  referenciaVentaId?: string;
  comprobanteRef?: string;
  categoria?: string;
  observaciones?: string;
}

export interface EstadoCaja {
  id: string;
  nombre: string;
  sucursal: string;
  responsable: string;
  abierta: boolean;
  estado: EstadoCajaTipo;
  turno: string; // ej: 'Mañana (08:00 - 16:00)'
  fechaApertura: string;
  horaApertura: string;
  saldoInicial: number;
  ventasEfectivo: number;
  otrosIngresosEfectivo: number;
  egresosEfectivo: number;
  saldoEfectivoEsperado: number;
  // Métodos no efectivo (informativo para arqueo digital)
  ventasDigitales: {
    yape: number;
    plin: number;
    tarjeta: number;
    transferencia: number;
  };
  totalVentasDigitales: number;
  totalVentasGeneral: number;
}

export interface CajaInfo {
  id: string;
  nombre: string;
  sucursal: string;
  responsableActual: string;
  estado: EstadoCajaTipo;
  saldoActualEfectivo: number;
  ventasDia: number;
  ultimaActividad: string;
  abierta: boolean;
}

export interface DenominacionConteo {
  denominacion: number; // 200, 100, 50, 20, 10, 5, 2, 1, 0.50, 0.20, 0.10
  cantidad: number;
  subtotal: number;
}

export interface ArqueoConteo {
  cajaId: string;
  fecha: string;
  hora: string;
  responsable: string;
  efectivoEsperado: number;
  efectivoContado: number;
  diferencia: number; // contado - esperado (+ sobra, - falta)
  estadoCuadre: EstadoCierreTipo;
  motivoDiferencia?: string;
  observaciones?: string;
  desglose?: DenominacionConteo[];
  // Opcional: arqueo de medios digitales
  digitalesEsperado?: {
    yape: number;
    plin: number;
    tarjeta: number;
    transferencia: number;
  };
  digitalesVerificado?: {
    yape: number;
    plin: number;
    tarjeta: number;
    transferencia: number;
  };
}

export interface CierreCaja {
  id: string;
  cajaId: string;
  cajaNombre: string;
  sucursal: string;
  responsable: string;
  fechaApertura: string;
  fechaCierre: string;
  horaCierre: string;
  saldoInicial: number;
  ventasEfectivo: number;
  otrosIngresos: number;
  egresos: number;
  saldoEsperado: number;
  saldoContado: number;
  diferencia: number;
  estado: EstadoCierreTipo;
  motivoDiferencia?: string;
  observaciones?: string;
  ventasTotales: number;
  totalOperaciones: number;
}

export interface AuditoriaCaja {
  id: string;
  usuario: string;
  accion: string; // 'APERTURA', 'INGRESO', 'EGRESO', 'ARQUEO', 'CIERRE', 'ANULACION'
  fecha: string;
  hora: string;
  caja: string;
  sucursal: string;
  movimiento?: string;
  valorAnterior?: string;
  valorNuevo?: string;
  observacion?: string;
}

export interface AperturaCajaPayload {
  cajaId: string;
  sucursal: string;
  responsable: string;
  saldoInicial: number;
  observaciones?: string;
}

export interface NuevaOperacionCajaPayload {
  tipo: TipoOperacionCaja;
  concepto: string;
  categoria?: string;
  metodo: MetodoCaja;
  monto: number;
  observaciones?: string;
}

export interface CierreCajaPayload {
  saldoContado: number;
  diferencia: number;
  motivoDiferencia?: string;
  observaciones?: string;
  desglose?: DenominacionConteo[];
}

