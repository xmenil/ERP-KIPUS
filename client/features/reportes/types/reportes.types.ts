export type PeriodoReporte = 'ESTE_MES' | 'MES_ANTERIOR' | 'ANIO_ACTUAL';

export interface EstructuraRubroFinanciero {
  rubro: string;
  monto: number;
  tipo: 'INGRESO' | 'COSTO' | 'GASTO' | 'UTILIDAD';
  porcentaje?: number;
}

export interface ResumenFinanciero {
  ventasTotales: number;
  costoVentas: number;
  utilidadBruta: number;
  gastosOperativos: number;
  utilidadNeta: number;
  margenNetoPorcentaje: number;
  margenBrutoPorcentaje: number;
  desgloseMensual: {
    periodo: string;
    ingresos: number;
    costos: number;
    gastos: number;
    utilidad: number;
  }[];
  estructuraRubros: EstructuraRubroFinanciero[];
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
}

export interface TopProductoReporte {
  nombre: string;
  sku: string;
  categoria?: string;
  unidadesVendidas: number;
  totalRecaudado: number;
  porcentajeVenta: number;
}
