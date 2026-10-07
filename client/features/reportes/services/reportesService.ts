import { simulateDelay } from '@/services/mock/mockUtils';
import {
  ResumenFinanciero,
  LiquidacionSunat,
  TopProductoReporte,
  PeriodoReporte,
} from '../types/reportes.types';
import { erpStore } from '@/services/erp/erpStore';

export const reportesService = {
  async getResumenFinanciero(periodo: PeriodoReporte = 'ESTE_MES'): Promise<ResumenFinanciero> {
    const ventas = erpStore.getVentas().filter((v) => v.estado !== 'ANULADA');
    const gastos = erpStore.getGastos();
    const productos = erpStore.getProductos();

    // Factor según periodo seleccionado para dar variedad realista
    const factorPeriodo = periodo === 'ESTE_MES' ? 1 : periodo === 'MES_ANTERIOR' ? 0.88 : 3.4;

    const baseVentasTotales = ventas.reduce((acc, v) => acc + v.total, 0);
    const ventasTotales = +(baseVentasTotales * factorPeriodo).toFixed(2);

    // Costo de ventas ponderado por costo de compra real o 62% típico de bodega
    const costoVentas = +(ventasTotales * 0.62).toFixed(2);
    const utilidadBruta = +(ventasTotales - costoVentas).toFixed(2);

    const baseGastos = gastos.reduce((acc, g) => acc + g.monto, 0);
    const gastosOperativos = +(baseGastos * factorPeriodo).toFixed(2);
    const utilidadNeta = +(utilidadBruta - gastosOperativos).toFixed(2);

    const margenNetoPorcentaje =
      ventasTotales > 0 ? +((utilidadNeta / ventasTotales) * 100).toFixed(1) : 0;
    const margenBrutoPorcentaje =
      ventasTotales > 0 ? +((utilidadBruta / ventasTotales) * 100).toFixed(1) : 0;

    // Desglose de rubros para gráfico de estructura
    const estructuraRubros = [
      {
        rubro: 'Ventas brutas facturadas',
        monto: ventasTotales,
        tipo: 'INGRESO' as const,
        porcentaje: 100,
      },
      {
        rubro: 'Costo de mercadería vendida',
        monto: costoVentas,
        tipo: 'COSTO' as const,
        porcentaje: +(costoVentas / (ventasTotales || 1) * 100).toFixed(1),
      },
      {
        rubro: 'Gastos operativos y servicios',
        monto: gastosOperativos,
        tipo: 'GASTO' as const,
        porcentaje: +(gastosOperativos / (ventasTotales || 1) * 100).toFixed(1),
      },
      {
        rubro: 'Utilidad neta disponible',
        monto: utilidadNeta,
        tipo: 'UTILIDAD' as const,
        porcentaje: margenNetoPorcentaje,
      },
    ];

    // Desglose de los últimos 6 meses para visualización de tendencia en ERP
    const desgloseMensual = [
      { periodo: 'May', ingresos: 14200, costos: 8800, gastos: 1950, utilidad: 3450 },
      { periodo: 'Jun', ingresos: 15800, costos: 9790, gastos: 2100, utilidad: 3910 },
      { periodo: 'Jul', ingresos: 18400, costos: 11400, gastos: 2300, utilidad: 4700 },
      { periodo: 'Ago', ingresos: 16900, costos: 10470, gastos: 2050, utilidad: 4380 },
      { periodo: 'Set', ingresos: 17500, costos: 10850, gastos: 2150, utilidad: 4500 },
      {
        periodo: 'Oct',
        ingresos: ventasTotales > 0 ? ventasTotales : 19200,
        costos: costoVentas > 0 ? costoVentas : 11900,
        gastos: gastosOperativos > 0 ? gastosOperativos : 2250,
        utilidad: utilidadNeta > 0 ? utilidadNeta : 5050,
      },
    ];

    const resumen: ResumenFinanciero = {
      ventasTotales,
      costoVentas,
      utilidadBruta,
      gastosOperativos,
      utilidadNeta,
      margenNetoPorcentaje,
      margenBrutoPorcentaje,
      desgloseMensual,
      estructuraRubros,
    };

    return simulateDelay(resumen);
  },

  async getLiquidacionSunat(periodo: PeriodoReporte = 'ESTE_MES'): Promise<LiquidacionSunat> {
    const ventas = erpStore.getVentas().filter((v) => v.estado !== 'ANULADA');
    const compras = erpStore.getCompras();

    const factorPeriodo = periodo === 'ESTE_MES' ? 1 : periodo === 'MES_ANTERIOR' ? 0.9 : 3.2;

    const totalVentas = +(ventas.reduce((acc, v) => acc + v.total, 0) * factorPeriodo).toFixed(2);
    const baseImponibleVentas = +(totalVentas / 1.18).toFixed(2);
    const igvVentasDebito = +(totalVentas - baseImponibleVentas).toFixed(2);

    const totalCompras = +(compras.reduce((acc, c) => acc + c.total, 0) * factorPeriodo).toFixed(2);
    const baseImponibleCompras = +(totalCompras / 1.18).toFixed(2);
    const igvComprasCredito = +(totalCompras - baseImponibleCompras).toFixed(2);

    const saldo = +(igvVentasDebito - igvComprasCredito).toFixed(2);
    const igvPagar = Math.max(0, saldo);
    const creditoFiscalRemanente = saldo < 0 ? Math.abs(saldo) : 0;

    const ventasConBoleta = +(totalVentas * 0.72).toFixed(2);
    const ventasConFactura = +(totalVentas * 0.28).toFixed(2);
    const comprasConFactura = totalCompras;

    const sunat: LiquidacionSunat = {
      baseImponibleVentas,
      igvVentasDebito,
      baseImponibleCompras,
      igvComprasCredito,
      igvPagar,
      creditoFiscalRemanente,
      ventasConBoleta,
      ventasConFactura,
      comprasConFactura,
    };

    return simulateDelay(sunat);
  },

  async getTopProductos(periodo: PeriodoReporte = 'ESTE_MES'): Promise<TopProductoReporte[]> {
    const productos = erpStore.getProductos();
    const ventas = erpStore.getVentas().filter((v) => v.estado !== 'ANULADA');

    // Mapeo de ventas reales si existen items vendidos
    const ventasPorProducto = new Map<string, { unidades: number; total: number }>();

    ventas.forEach((v) => {
      v.items?.forEach((item) => {
        const actual = ventasPorProducto.get(item.productoId) || { unidades: 0, total: 0 };
        ventasPorProducto.set(item.productoId, {
          unidades: actual.unidades + item.cantidad,
          total: actual.total + item.subtotal,
        });
      });
    });

    const totalGeneralVentas = ventas.reduce((acc, v) => acc + v.total, 0) || 1;

    // Si hay ventas registradas por items
    if (ventasPorProducto.size > 0) {
      const topList: TopProductoReporte[] = [];

      ventasPorProducto.forEach((data, prodId) => {
        const prod = productos.find((p) => p.id === prodId);
        if (prod) {
          topList.push({
            nombre: prod.nombre,
            sku: prod.sku,
            categoria: prod.categoria,
            unidadesVendidas: data.unidades,
            totalRecaudado: +data.total.toFixed(2),
            porcentajeVenta: +((data.total / totalGeneralVentas) * 100).toFixed(1),
          });
        }
      });

      topList.sort((a, b) => b.totalRecaudado - a.totalRecaudado);
      return simulateDelay(topList.slice(0, 10));
    }

    // Catálogo inicial con datos coherentes de bodega / minimarket de Tingo María
    const factorPeriodo = periodo === 'ESTE_MES' ? 1 : periodo === 'MES_ANTERIOR' ? 0.85 : 3.1;
    const baseTotal = (totalGeneralVentas > 0 ? totalGeneralVentas : 12400) * factorPeriodo;

    const catalogoTop = productos.slice(0, 8).map((p, idx) => {
      const soldUnits = Math.round((48 - idx * 5) * factorPeriodo);
      const totalRecaudado = +(soldUnits * p.precioVenta).toFixed(2);
      return {
        nombre: p.nombre,
        sku: p.sku,
        categoria: p.categoria,
        unidadesVendidas: Math.max(1, soldUnits),
        totalRecaudado,
        porcentajeVenta: +((totalRecaudado / (baseTotal || 1)) * 100).toFixed(1),
      };
    });

    catalogoTop.sort((a, b) => b.totalRecaudado - a.totalRecaudado);
    return simulateDelay(catalogoTop);
  },
};
