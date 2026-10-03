export interface ResumenFinanciero {
  ventasTotales: number;
  costoVentas: number;
  utilidadBruta: number;
  gastosOperativos: number;
  utilidadNeta: number;
  margenNetoPorcentaje: number;
}

export interface LiquidacionSunat {
  baseImponibleVentas: number;
  igvVentasDebito: number;
  baseImponibleCompras: number;
  igvComprasCredito: number;
  igvPagar: number;
}

export interface TopProductoReporte {
  nombre: string;
  sku: string;
  unidadesVendidas: number;
  totalRecaudado: number;
  porcentajeVenta: number;
}
