export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE';
export type MotivoMovimiento = 'COMPRA' | 'VENTA' | 'INVENTARIO_INICIAL' | 'MERMA' | 'TRANSFERENCIA';

export interface MovimientoKardex {
  id: string;
  fecha: string;
  tipo: TipoMovimiento;
  motivo: MotivoMovimiento;
  productoNombre: string;
  sku: string;
  almacen: string;
  cantidad: number;
  stockResultante: number;
  referencia: string; // Factura, Guía de Remisión o Ticket
  usuario: string;
}

export interface AlmacenResumen {
  id: string;
  nombre: string;
  direccion: string;
  totalProductos: number;
  stockTotalUnidades: number;
}

export interface NuevoMovimientoPayload {
  tipo: TipoMovimiento;
  motivo: MotivoMovimiento;
  productoNombre: string;
  sku: string;
  almacen: string;
  cantidad: number;
  referencia: string;
}
