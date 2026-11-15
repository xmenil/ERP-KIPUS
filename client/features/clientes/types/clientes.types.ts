export type TipoDocumentoCliente = 'DNI' | 'RUC';
export type TipoCliente = 'MINORISTA' | 'MAYORISTA' | 'CORPORATIVO';

export interface Cliente {
  id: string;
  documentoTipo: TipoDocumentoCliente;
  numeroDocumento: string;
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
  totalCompras: number;
  saldoPendiente: number;
  activo: boolean;
  tipoCliente?: TipoCliente;
  limiteCredito?: number;
  diasCredito?: number;
  fechaUltimoFiado?: string;
  fechaRegistro?: string;
  comprobantesAsociadosCount?: number;
}

export interface NuevoClientePayload {
  documentoTipo: TipoDocumentoCliente;
  numeroDocumento: string;
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
  tipoCliente?: TipoCliente;
  limiteCredito?: number;
  diasCredito?: number;
}

export interface AbonoCliente {
  id: string;
  fecha: string;
  hora: string;
  clienteId: string;
  clienteNombre: string;
  clienteDocumento: string;
  montoAbonado: number;
  saldoAnterior: number;
  saldoRestante: number;
  metodoPago: string;
  referenciaComprobante?: string;
  cajero: string;
}
