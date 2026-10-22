export type PeriodoReporte = "ESTE_MES" | "MES_ANTERIOR" | "ANIO_ACTUAL";
export interface RangoReporte {
  desde: string;
  hasta: string;
  label: string;
}
export interface FilaReporte {
  concepto: string;
  monto: number | null;
}
export interface SerieMensual {
  periodo: string;
  ingresos: number;
  costos: number | null;
  gastos: number;
  utilidad: number | null;
}
export interface ResumenFinanciero {
  ventasTotales: number;
  ventasBrutas: number;
  devoluciones: number;
  cobrosRegistrados: number;
  ventasCredito: number;
  costoVentas: number | null;
  utilidadBruta: number | null;
  gastosOperativos: number;
  utilidadNeta: number | null;
  margenNetoPorcentaje: number | null;
  itemsSinCosto: number;
  desgloseMensual: SerieMensual[];
  filas: FilaReporte[];
}
export interface LiquidacionSunat {
  baseImponibleVentas: number;
  igvVentasDebito: number;
  baseImponibleCompras: number;
  igvComprasCredito: number;
  igvPagar: number;
  creditoFiscalRemanente: number;
  ventasConBoleta: number;
  ventasConFactura: number;
  comprasConFactura: number;
  filas: FilaReporte[];
}
export interface TopProductoReporte {
  productoId: string;
  nombre: string;
  sku: string;
  categoria?: string;
  unidadesVendidas: number;
  totalRecaudado: number;
  porcentajeVenta: number;
}
export interface OperacionReporte {
  fecha: string;
  tipo: "VENTA" | "DEVOLUCION" | "GASTO" | "COMPRA" | "COBRO";
  referencia: string;
  concepto: string;
  monto: number;
}
export interface Reporte {
  rango: RangoReporte;
  financiero: ResumenFinanciero;
  sunat: LiquidacionSunat;
  productos: TopProductoReporte[];
  operaciones: OperacionReporte[];
}
