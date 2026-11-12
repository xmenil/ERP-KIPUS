import { apiClient } from '@/services/api/apiClient';
import {
  DashboardMetrics,
  RecentSale,
  StockAlert,
  SalesTrendItem,
} from '../types/dashboard.types';

export const dashboardService = {
  /**
   * Obtiene los KPIs consolidados y métricas operativas del día
   */
  async getMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>('/dashboard/metrics');
  },

  /**
   * Obtiene las ventas más recientes registradas en el POS
   */
  async getRecentSales(): Promise<RecentSale[]> {
    const data = await apiClient.get<RecentSale[]>('/dashboard/recent-sales');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Obtiene las alertas de existencias críticas y quiebres de stock
   */
  async getStockAlerts(): Promise<StockAlert[]> {
    const data = await apiClient.get<StockAlert[]>('/dashboard/stock-alerts');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Obtiene la tendencia comparativa de ventas y gastos de los últimos 7 días
   */
  async getSalesTrend(): Promise<SalesTrendItem[]> {
    const data = await apiClient.get<SalesTrendItem[]>('/dashboard/sales-trend');
    return Array.isArray(data) ? data : [];
  },
};
