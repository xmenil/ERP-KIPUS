export type EstadoCompra =
  | 'RECIBIDO'
  | 'PENDIENTE'
  | 'ANULADO'
  | 'BORRADOR'
  | 'APROBADA'
  | 'RECIBIDA_PARCIAL';

export interface CompraItemDetalle {
  productoId: string;
  sku: string;
  nombre: string;
  cantidad: number;
  cantidadRecibida?: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Compra {
  id: string;
  fecha: string;
  proveedorNombre: string;
  proveedorRuc: string;
  proveedorId?: string;
  serieFactura: string;
  total: number;
  estado: EstadoCompra;
  metodoPago: string;
  itemsCount: number;
  items?: CompraItemDetalle[];
  origenSugerencia?: boolean;
  numeroGuiaRemision?: string;
  recepcionadoPor?: string;
  fechaRecepcion?: string;
  notasRecepcion?: string;
  fechaVencimiento?: string;
}

export interface NuevaCompraPayload {
  proveedorNombre: string;
  proveedorRuc: string;
  proveedorId?: string;
  serieFactura: string;
  total: number;
  metodoPago: string;
  itemsCount: number;
  items?: CompraItemDetalle[];
  productoId?: string;
  origenSugerencia?: boolean;
  estado?: EstadoCompra;
  fechaVencimiento?: string;
}

export interface AbonoProveedor {
  id: string;
  fecha: string;
  monto: number;
  metodoPago: string;
  referenciaOperacion?: string;
  registradoPor?: string;
}

export interface CuentaPorPagar {
  id: string;
  compraId?: string;
  proveedorId?: string;
  proveedorNombre: string;
  proveedorRuc: string;
  serieFactura: string;
  fechaEmision: string;
  fechaVencimiento: string;
  montoTotal: number;
  montoPagado: number;
  saldoPendiente: number;
  estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'VENCIDO';
  diasCredito?: number;
  metodoPago?: string;
  historialAbonos?: AbonoProveedor[];
}
