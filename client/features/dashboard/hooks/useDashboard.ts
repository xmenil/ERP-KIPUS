import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { subscribeToErp } from '@/services/erp/erpStore';

export function useDashboardData() {
  const queryClient = useQueryClient();

  const metricsQuery = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => dashboardService.getMetrics(),
  });

  const recentSalesQuery = useQuery({
    queryKey: ['dashboard', 'recentSales'],
    queryFn: () => dashboardService.getRecentSales(),
  });

  const stockAlertsQuery = useQuery({
    queryKey: ['dashboard', 'stockAlerts'],
    queryFn: () => dashboardService.getStockAlerts(),
  });

  const salesTrendQuery = useQuery({
    queryKey: ['dashboard', 'salesTrend'],
    queryFn: () => dashboardService.getSalesTrend(),
  });

  useEffect(() => {
    const unsubscribe = subscribeToErp(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const isLoading =
    metricsQuery.isLoading ||
    recentSalesQuery.isLoading ||
    stockAlertsQuery.isLoading ||
    salesTrendQuery.isLoading;

  return {
    metrics: metricsQuery.data,
    recentSales: recentSalesQuery.data ?? [],
    stockAlerts: stockAlertsQuery.data ?? [],
    salesTrend: salesTrendQuery.data ?? [],
    isLoading,
    refetchAll: () => {
      metricsQuery.refetch();
      recentSalesQuery.refetch();
      stockAlertsQuery.refetch();
      salesTrendQuery.refetch();
    },
  };
}
