export type EstadoCompra = 'RECIBIDO' | 'PENDIENTE' | 'ANULADO';

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
}

export interface NuevaCompraPayload {
  proveedorNombre: string;
  proveedorRuc: string;
  serieFactura: string;
  total: number;
  metodoPago: string;
  itemsCount: number;
}
