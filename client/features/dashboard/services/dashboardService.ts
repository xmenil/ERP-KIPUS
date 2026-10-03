import { simulateDelay } from '@/services/mock/mockUtils';
import {
  DashboardMetrics,
  RecentSale,
  StockAlert,
  SalesTrendItem,
} from '../types/dashboard.types';
import { erpStore } from '@/services/erp/erpStore';

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    const ventas = erpStore.getVentas();
    const caja = erpStore.getEstadoCaja();
    const productos = erpStore.getProductos();
    const compras = erpStore.getCompras();

    const ventasHoy = ventas
      .filter((v) => v.estado !== 'ANULADA')
      .reduce((acc, v) => acc + v.total, 0);

    const pendientes = ventas.filter((v) => v.estado === 'PENDIENTE').length;
    const bajoStock = productos.filter((p) => p.stock <= p.stockMinimo).length;
    const totalCompras = compras.reduce((acc, c) => acc + c.total, 0);

    const metrics: DashboardMetrics = {
      ventasHoy,
      variacionVentas: 12.5,
      pedidosPendientes: pendientes,
      productosBajoStock: bajoStock,
      saldoCaja: caja.saldoEfectivoEsperado,
      comprasMes: totalCompras,
    };

    return simulateDelay(metrics);
  },

  async getRecentSales(): Promise<RecentSale[]> {
    const ventas = erpStore.getVentas().slice(0, 5);
    const recent: RecentSale[] = ventas.map((v) => ({
      id: v.id,
      codigo: v.serieCorrelativo,
      cliente: v.clienteNombre,
      monto: v.total,
      fecha: v.fecha,
      estado: v.estado,
      metodoPago: v.metodoPago,
    }));
    return simulateDelay(recent);
  },

  async getStockAlerts(): Promise<StockAlert[]> {
    const productos = erpStore.getProductos();
    const alertas: StockAlert[] = productos
      .filter((p) => p.stock <= p.stockMinimo)
      .map((p) => ({
        id: p.id,
        producto: p.nombre,
        sku: p.sku,
        stockActual: p.stock,
        stockMinimo: p.stockMinimo,
        almacen: 'Almacén Principal',
        urgencia: p.stock <= Math.floor(p.stockMinimo / 2) ? 'CRITICO' : 'BAJO',
      }));
    return simulateDelay(alertas);
  },

  async getSalesTrend(): Promise<SalesTrendItem[]> {
    const ventas = erpStore.getVentas();
    const gastos = erpStore.getGastos();
    const totalVentas = ventas.reduce((acc, v) => acc + v.total, 0);
    const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);

    const trend: SalesTrendItem[] = [
      { dia: 'Lun', ventas: 2400, gastos: 800 },
      { dia: 'Mar', ventas: 3100, gastos: 950 },
      { dia: 'Mié', ventas: 2800, gastos: 700 },
      { dia: 'Jue', ventas: 4200, gastos: 1200 },
      { dia: 'Vie', ventas: 5100, gastos: 1800 },
      { dia: 'Sáb', ventas: 6400, gastos: 1400 },
      { dia: 'Dom (Hoy)', ventas: Math.round(totalVentas), gastos: Math.round(totalGastos) },
    ];

    return simulateDelay(trend);
  },
};
