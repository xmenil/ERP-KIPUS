import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '../hooks/useDashboard';
import { DashboardKpiCards } from '../components/DashboardKpiCards';
import { SalesTrendChart } from '../components/SalesTrendChart';
import { RecentSalesTable } from '../components/RecentSalesTable';
import { StockAlertsCard } from '../components/StockAlertsCard';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { isRoleAlmacenero, isRoleCajero } from '@/features/auth/utils/permissions';
import { useSocketEvent } from '@/services/socket/useSocketEvent';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { metrics, recentSales, stockAlerts, salesTrend, isLoading, refetchAll } =
    useDashboardData();

  // Sincronización en tiempo real ante eventos remotos por WebSockets
  useSocketEvent('ventas:nueva_venta', () => refetchAll());
  useSocketEvent('stock:actualizado', () => refetchAll());
  useSocketEvent('caja:balance_actualizado', () => refetchAll());

  const esAlmacenero = isRoleAlmacenero(user?.rol);
  const esCajero = isRoleCajero(user?.rol);

  const pageDescription = esAlmacenero
    ? 'Resumen de stock, existencias y requerimientos de abastecimiento de almacén.'
    : esCajero
    ? 'Resumen de turno, punto de venta y control de caja diaria.'
    : 'Resumen general del negocio: ventas, caja, inventario y alertas prioritarias.';

  return (
    <div className="space-y-5">
      {/* 1. Encabezado de Página */}
      <PageHeader
        title="Inicio"
        description={pageDescription}
        badge={esAlmacenero ? 'Panel Almacén' : esCajero ? 'Panel Cajero' : 'Panel General'}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={refetchAll}
          disabled={isLoading}
          className="h-8 px-3 gap-1.5 text-xs font-medium rounded-md"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </Button>
      </PageHeader>

      {/* 2. Indicadores Clave del Negocio (4 KPIs ejecutivos o KPIs operativos de almacén) */}
      <DashboardKpiCards metrics={metrics} isLoading={isLoading} />

      {/* 4. Gráficos de Tendencias y Alertas */}
      {esAlmacenero ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <StockAlertsCard alerts={stockAlerts} isLoading={isLoading} />
          </div>

          <Card className="rounded-lg border-border bg-card shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">
                Accesos de Almacén
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Navegación directa para la administración física del stock
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Link
                to="/inventario?tab=kardex"
                className="p-3 rounded-lg border border-border bg-background hover:bg-muted/40 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">Kardex de entradas y salidas</p>
                  <p className="text-muted-foreground">Historial de movimientos y transferencias</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>

              <Link
                to="/inventario?tab=stock"
                className="p-3 rounded-lg border border-border bg-background hover:bg-muted/40 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">Control de stock y ajustes</p>
                  <p className="text-muted-foreground">Comparación de stock real vs sistema</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>

              <Link
                to="/compras?tab=recepcion"
                className="p-3 rounded-lg border border-border bg-background hover:bg-muted/40 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">Recepción de mercadería</p>
                  <p className="text-muted-foreground">Ingreso de compras físicas al inventario</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <SalesTrendChart data={salesTrend} isLoading={isLoading} />
          </div>
          <div>
            <StockAlertsCard alerts={stockAlerts} isLoading={isLoading} />
          </div>
        </div>
      )}

      {/* 5. Tabla de Últimas Ventas (oculta para almacenero) */}
      {!esAlmacenero && (
        <RecentSalesTable sales={recentSales} isLoading={isLoading} />
      )}
    </div>
  );
};

export default DashboardPage;
