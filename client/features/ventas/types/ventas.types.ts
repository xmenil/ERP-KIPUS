export type TipoComprobante = 'BOLETA' | 'FACTURA' | 'NOTA_VENTA';
export type EstadoVenta = 'COMPLETADA' | 'PENDIENTE' | 'ANULADA';
export type MetodoPago = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA' | 'TRANSFERENCIA';

export interface ItemVenta {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  tipoComprobante: TipoComprobante;
  serieCorrelativo: string; // ej. B001-000482
  clienteNombre: string;
  clienteDocumento: string; // DNI o RUC
  fecha: string;
  metodoPago: MetodoPago;
  estado: EstadoVenta;
  subtotal: number;
  igv: number;
  total: number;
  items: ItemVenta[];
}

export interface NuevaVentaPayload {
  tipoComprobante: TipoComprobante;
  clienteNombre: string;
  clienteDocumento: string;
  metodoPago: MetodoPago;
  items: {
    productoId: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
  }[];
}
