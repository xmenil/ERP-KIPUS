import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '../hooks/useDashboard';
import { DashboardKpiCards } from '../components/DashboardKpiCards';
import { SalesTrendChart } from '../components/SalesTrendChart';
import { RecentSalesTable } from '../components/RecentSalesTable';
import { StockAlertsCard } from '../components/StockAlertsCard';
import { PlusCircle, RefreshCw, ShoppingCart, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/constants/routes';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { metrics, recentSales, stockAlerts, salesTrend, isLoading, refetchAll } =
    useDashboardData();

  return (
    <div className="space-y-6">
      {/* Encabezado con acciones */}
      <PageHeader
        title="Dashboard General"
        description="Monitoreo operativo y financiero en tiempo real para tu negocio"
        badge="En Línea"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={refetchAll}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(APP_ROUTES.CAJA)}
          className="gap-2"
        >
          <DollarSign className="h-4 w-4 text-emerald-600" />
          <span>Arqueo de Caja</span>
        </Button>

        <Button
          size="sm"
          onClick={() => navigate(APP_ROUTES.VENTAS)}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Nueva Venta</span>
        </Button>
      </PageHeader>

      {/* Tarjetas de Métricas / KPIs */}
      <DashboardKpiCards metrics={metrics} isLoading={isLoading} />

      {/* Gráficos y Tablas Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesTrendChart data={salesTrend} isLoading={isLoading} />
        </div>
        <div>
          <StockAlertsCard alerts={stockAlerts} isLoading={isLoading} />
        </div>
      </div>

      {/* Últimas Ventas */}
      <RecentSalesTable sales={recentSales} isLoading={isLoading} />
    </div>
  );
};

export default DashboardPage;
