export type EstadoCompra = 'RECIBIDO' | 'PENDIENTE' | 'ANULADO';

export interface CompraItemDetalle {
  productoId: string;
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Compra {
  id: string;
  fecha: string;
  proveedorNombre: string;
  proveedorRuc: string;
  serieFactura: string;
  total: number;
  estado: EstadoCompra;
  metodoPago: string;
  itemsCount: number;
  items?: CompraItemDetalle[];
  origenSugerencia?: boolean;
}

export interface NuevaCompraPayload {
  proveedorNombre: string;
  proveedorRuc: string;
  serieFactura: string;
  total: number;
  metodoPago: string;
  itemsCount: number;
  items?: CompraItemDetalle[];
  productoId?: string;
  origenSugerencia?: boolean;
}
