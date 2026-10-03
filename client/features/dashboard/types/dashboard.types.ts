export interface DashboardMetrics {
  ventasHoy: number;
  variacionVentas: number;
  pedidosPendientes: number;
  productosBajoStock: number;
  saldoCaja: number;
  comprasMes: number;
}

export type MetodoPago =
  | 'EFECTIVO'
  | 'YAPE'
  | 'PLIN'
  | 'TARJETA'
  | 'TRANSFERENCIA'
  | 'MIXTO'
  | 'CREDITO';
export type EstadoVenta = 'COMPLETADA' | 'PENDIENTE' | 'ANULADA';

export interface RecentSale {
  id: string;
  codigo: string;
  cliente: string;
  monto: number;
  fecha: string;
  estado: EstadoVenta;
  metodoPago: MetodoPago;
}

export interface StockAlert {
  id: string;
  producto: string;
  sku: string;
  stockActual: number;
  stockMinimo: number;
  almacen: string;
  urgencia: 'CRITICO' | 'BAJO';
}

export interface SalesTrendItem {
  dia: string;
  ventas: number;
  gastos: number;
}
