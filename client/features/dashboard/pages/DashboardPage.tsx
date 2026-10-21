import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '../hooks/useDashboard';
import { DashboardKpiCards } from '../components/DashboardKpiCards';
import { SalesTrendChart } from '../components/SalesTrendChart';
import { RecentSalesTable } from '../components/RecentSalesTable';
import { StockAlertsCard } from '../components/StockAlertsCard';
import { RefreshCw, ShoppingCart, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/constants/routes';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    metrics,
    recentSales,
    stockAlerts,
    salesTrend,
    isLoading,
    isFetching,
    hasError,
    refetchAll,
  } = useDashboardData();

  return (
    <div className="space-y-6">
      {/* Encabezado con acción primaria única y secundarias */}
      <PageHeader
        title="Resumen del negocio"
        description="Resumen operativo de ventas, caja e inventario del día."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={refetchAll}
          disabled={isFetching}
          className="h-11 md:h-9 px-3 gap-2 text-sm font-medium"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`}
          />
          <span>Actualizar</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(APP_ROUTES.CAJA)}
          className="h-11 md:h-9 px-3 gap-2 text-sm font-medium"
        >
          <DollarSign className="h-3.5 w-3.5" />
          <span>Ver caja</span>
        </Button>

        <Button
          size="sm"
          onClick={() => navigate(APP_ROUTES.VENTAS)}
          className="h-11 md:h-9 px-4 gap-2 text-sm"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Registrar venta</span>
        </Button>
      </PageHeader>

      {hasError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-card p-4"
        >
          <p className="text-sm">
            No se pudo actualizar el resumen del negocio. Intenta cargarlo
            nuevamente.
          </p>
          <Button variant="outline" disabled={isFetching} onClick={refetchAll}>
            {isFetching ? 'Cargando…' : 'Reintentar'}
          </Button>
        </div>
      )}
      {!hasError && (
        <>
          {/* Bloque 1: Resumen de Dinero y Alertas Operativas */}
          <DashboardKpiCards metrics={metrics} isLoading={isLoading} />

          {/* Bloque 2: Gráfico y Alertas Críticas de Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SalesTrendChart data={salesTrend} isLoading={isLoading} />
            </div>
            <div>
              <StockAlertsCard alerts={stockAlerts} isLoading={isLoading} />
            </div>
          </div>

          {/* Bloque 3: Tabla de Últimas Ventas */}
          <RecentSalesTable sales={recentSales} isLoading={isLoading} />
        </>
      )}
    </div>
  );
};

export default DashboardPage;
