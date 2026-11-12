import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardService } from './dashboardService';
import { apiClient } from '@/services/api/apiClient';
import { DashboardMetrics, RecentSale, StockAlert, SalesTrendItem } from '../types/dashboard.types';

describe('Dashboard Service — Integración REST', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtiene las métricas y KPIs del negocio llamando a GET /dashboard/metrics', async () => {
    const mockMetrics: DashboardMetrics = {
      ventasHoy: 1250.0,
      variacionVentas: 15.2,
      pedidosPendientes: 3,
      productosBajoStock: 2,
      saldoCaja: 580.0,
      comprasMes: 3400.0,
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockMetrics);

    const res = await dashboardService.getMetrics();
    expect(getSpy).toHaveBeenCalledWith('/dashboard/metrics');
    expect(res.ventasHoy).toBe(1250.0);
    expect(res.pedidosPendientes).toBe(3);
  });

  it('obtiene las ventas recientes llamando a GET /dashboard/recent-sales', async () => {
    const mockRecent: RecentSale[] = [
      {
        id: 'v-1',
        codigo: 'B001-00045',
        cliente: 'Juan Perez',
        monto: 38.5,
        fecha: '2026-11-12T10:00:00.000Z',
        estado: 'COMPLETADA',
        metodoPago: 'EFECTIVO',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockRecent);

    const res = await dashboardService.getRecentSales();
    expect(getSpy).toHaveBeenCalledWith('/dashboard/recent-sales');
    expect(res).toHaveLength(1);
    expect(res[0].codigo).toBe('B001-00045');
  });

  it('obtiene las alertas de stock crítico llamando a GET /dashboard/stock-alerts', async () => {
    const mockAlerts: StockAlert[] = [
      {
        id: 'prod-1',
        producto: 'Aceite Primor 900ml',
        sku: 'ACE-PRI-01',
        stockActual: 2,
        stockMinimo: 5,
        almacen: 'Almacén Principal',
        urgencia: 'CRITICO',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockAlerts);

    const res = await dashboardService.getStockAlerts();
    expect(getSpy).toHaveBeenCalledWith('/dashboard/stock-alerts');
    expect(res).toHaveLength(1);
    expect(res[0].urgencia).toBe('CRITICO');
  });

  it('obtiene la tendencia de ventas y gastos de los últimos 7 días llamando a GET /dashboard/sales-trend', async () => {
    const mockTrend: SalesTrendItem[] = [
      { dia: 'Lun', ventas: 2100, gastos: 600 },
      { dia: 'Mar', ventas: 2500, gastos: 700 },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockTrend);

    const res = await dashboardService.getSalesTrend();
    expect(getSpy).toHaveBeenCalledWith('/dashboard/sales-trend');
    expect(res).toHaveLength(2);
    expect(res[0].dia).toBe('Lun');
  });
});

