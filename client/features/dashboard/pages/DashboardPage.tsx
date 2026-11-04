import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '../hooks/useDashboard';
import { DashboardKpiCards } from '../components/DashboardKpiCards';
import { SalesTrendChart } from '../components/SalesTrendChart';
import { RecentSalesTable } from '../components/RecentSalesTable';
import { StockAlertsCard } from '../components/StockAlertsCard';
import { RefreshCw, ShoppingCart, DollarSign, Sparkles, Truck, Warehouse, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { APP_ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/context/AuthContext';
import { isRoleAlmacenero, isRoleCajero, isRoleAdmin } from '@/features/auth/utils/permissions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { metrics, recentSales, stockAlerts, salesTrend, isLoading, refetchAll } =
    useDashboardData();

  const esAlmacenero = isRoleAlmacenero(user?.rol);
  const esCajero = isRoleCajero(user?.rol);
  const esAdmin = isRoleAdmin(user?.rol);

  const getPageTitle = () => {
    return 'Inicio';
  };

  const getPageDescription = () => {
    if (esAlmacenero) {
      return 'Resumen de stock, existencias y requerimientos de abastecimiento de almacén.';
    }
    if (esCajero) {
      return 'Resumen de turno, punto de venta y control de caja diaria.';
    }
    return 'Resumen general del negocio: ventas, caja, inventario y alertas del día.';
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal adaptado por Rol */}
      <PageHeader
        title={getPageTitle()}
        description={getPageDescription()}
        badge={esAlmacenero ? 'Panel Almacén' : esCajero ? 'Panel Cajero' : 'Panel General'}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={refetchAll}
          disabled={isLoading}
          className="h-9 px-3 gap-1.5 text-xs font-medium rounded-md"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </Button>

        {/* Acciones para Dueño / Admin y Cajero */}
        {!esAlmacenero && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/ventas?tab=caja')}
              className="h-9 px-3 gap-1.5 text-xs font-medium rounded-md"
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Cuadre de caja</span>
            </Button>

            <Button
              size="sm"
              onClick={() => navigate(APP_ROUTES.VENTAS)}
              className="h-9 px-3.5 gap-1.5 bg-primary text-primary-foreground font-medium text-xs rounded-md shadow-xs hover:bg-primary/90"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Registrar venta</span>
            </Button>
          </>
        )}

        {/* KIPU'S IA integrado en Inicio para Dueño / Admin */}
        {esAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/reportes?tab=ia')}
            className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-md border-primary/30 text-primary hover:bg-primary/5"
            title="Consultar al Asistente KIPU'S IA"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>KIPU'S IA</span>
          </Button>
        )}

        {/* Acciones para Almacenero */}
        {esAlmacenero && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(APP_ROUTES.COMPRAS)}
              className="h-9 px-3 gap-1.5 text-xs font-medium rounded-md"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Recepción de compras</span>
            </Button>

            <Button
              size="sm"
              onClick={() => navigate(APP_ROUTES.INVENTARIO)}
              className="h-9 px-3.5 gap-1.5 bg-primary text-primary-foreground font-medium text-xs rounded-md shadow-xs hover:bg-primary/90"
            >
              <Warehouse className="h-3.5 w-3.5" />
              <span>Ver existencias</span>
            </Button>
          </>
        )}
      </PageHeader>

      {/* Bloque 1: Resumen de Indicadores Clave */}
      <DashboardKpiCards metrics={metrics} isLoading={isLoading} />

      {/* Bloque 2: Gráficos y Alertas */}
      {esAlmacenero ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StockAlertsCard alerts={stockAlerts} isLoading={isLoading} />
          </div>

          <Card className="rounded-md border-border bg-card shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">
                Accesos de Almacén
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Flujos directos para la administración física del stock
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Link
                to="/inventario?tab=entradas-salidas"
                className="p-3 rounded-md border border-border bg-background hover:bg-muted/40 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">Kardex de entradas y salidas</p>
                  <p className="text-muted-foreground">Historial de movimientos y transferencias</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>

              <Link
                to="/inventario?tab=inventario-fisico"
                className="p-3 rounded-md border border-border bg-background hover:bg-muted/40 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">Inventario físico y conteo</p>
                  <p className="text-muted-foreground">Comparación de stock real vs sistema</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>

              <Link
                to="/compras"
                className="p-3 rounded-md border border-border bg-background hover:bg-muted/40 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">Órdenes de compra por ingresar</p>
                  <p className="text-muted-foreground">Recepción de mercadería de proveedores</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesTrendChart data={salesTrend} isLoading={isLoading} />
          </div>
          <div>
            <StockAlertsCard alerts={stockAlerts} isLoading={isLoading} />
          </div>
        </div>
      )}

      {/* Bloque 3: Tabla de Últimas Ventas (oculta para almacenero) */}
      {!esAlmacenero && (
        <RecentSalesTable sales={recentSales} isLoading={isLoading} />
      )}
    </div>
  );
};

export default DashboardPage;
