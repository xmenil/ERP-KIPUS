import { simulateDelay } from '@/services/mock/mockUtils';
import {
  ResumenFinanciero,
  LiquidacionSunat,
  TopProductoReporte,
} from '../types/reportes.types';
import { erpStore } from '@/services/erp/erpStore';

export const reportesService = {
  async getResumenFinanciero(): Promise<ResumenFinanciero> {
    const ventas = erpStore.getVentas().filter((v) => v.estado !== 'ANULADA');
    const gastos = erpStore.getGastos();
    const productos = erpStore.getProductos();

    const ventasTotales = ventas.reduce((acc, v) => acc + v.total, 0);
    // Costo estimado proporcional al 60% o calculado por ítems
    const costoVentas = +(ventasTotales * 0.6).toFixed(2);
    const utilidadBruta = +(ventasTotales - costoVentas).toFixed(2);
    const gastosOperativos = gastos.reduce((acc, g) => acc + g.monto, 0);
    const utilidadNeta = +(utilidadBruta - gastosOperativos).toFixed(2);
    const margenNetoPorcentaje = ventasTotales > 0 ? +((utilidadNeta / ventasTotales) * 100).toFixed(1) : 0;

    const resumen: ResumenFinanciero = {
      ventasTotales,
      costoVentas,
      utilidadBruta,
      gastosOperativos,
      utilidadNeta,
      margenNetoPorcentaje,
    };

    return simulateDelay(resumen);
  },

  async getLiquidacionSunat(): Promise<LiquidacionSunat> {
    const ventas = erpStore.getVentas().filter((v) => v.estado !== 'ANULADA');
    const compras = erpStore.getCompras();

    const totalVentas = ventas.reduce((acc, v) => acc + v.total, 0);
    const baseImponibleVentas = +(totalVentas / 1.18).toFixed(2);
    const igvVentasDebito = +(totalVentas - baseImponibleVentas).toFixed(2);

    const totalCompras = compras.reduce((acc, c) => acc + c.total, 0);
    const baseImponibleCompras = +(totalCompras / 1.18).toFixed(2);
    const igvComprasCredito = +(totalCompras - baseImponibleCompras).toFixed(2);

    const igvPagar = Math.max(0, +(igvVentasDebito - igvComprasCredito).toFixed(2));

    const sunat: LiquidacionSunat = {
      baseImponibleVentas,
      igvVentasDebito,
      baseImponibleCompras,
      igvComprasCredito,
      igvPagar,
    };

    return simulateDelay(sunat);
  },

  async getTopProductos(): Promise<TopProductoReporte[]> {
    const productos = erpStore.getProductos();
    const ventas = erpStore.getVentas();
    const totalVentas = ventas.reduce((acc, v) => acc + v.total, 0) || 1;

    // Calcular por productos
    const top = productos.slice(0, 5).map((p, idx) => {
      const soldUnits = 20 - p.stock + (idx * 10);
      const totalRecaudado = Math.max(0, soldUnits * p.precioVenta);
      return {
        nombre: p.nombre,
        sku: p.sku,
        unidadesVendidas: Math.max(1, soldUnits),
        totalRecaudado,
        porcentajeVenta: +((totalRecaudado / totalVentas) * 100).toFixed(1),
      };
    });

    return simulateDelay(top);
  },
};
