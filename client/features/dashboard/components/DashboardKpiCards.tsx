import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardMetrics } from '../types/dashboard.types';
import { formatCurrency } from '@/utils/formatters';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '@/constants/routes';

interface DashboardKpiCardsProps {
  metrics?: DashboardMetrics;
  isLoading?: boolean;
}

export function DashboardKpiCards({
  metrics,
  isLoading,
}: DashboardKpiCardsProps) {
  if (isLoading || !metrics)
    return (
      <Card className="shadow-none">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32 max-w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );

  return (
    <Card className="border-border bg-card shadow-none">
      <CardContent className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Ventas registradas
          </h2>
          <p className="text-3xl font-semibold tabular-nums">
            {formatCurrency(metrics.ventasHoy)}
          </p>
          <Link
            to={APP_ROUTES.VENTAS}
            className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline md:min-h-9"
          >
            Consultar ventas
          </Link>
        </div>
        <div className="space-y-2 lg:border-l lg:border-border lg:pl-6">
          <h2 className="text-sm font-medium text-muted-foreground">
            Efectivo en caja
          </h2>
          <p className="text-2xl font-semibold tabular-nums">
            {formatCurrency(metrics.saldoCaja)}
          </p>
          <Link
            to={APP_ROUTES.CAJA}
            className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline md:min-h-9"
          >
            Consultar caja
          </Link>
        </div>
        <div className="space-y-3 lg:border-l lg:border-border lg:pl-6">
          <h2 className="text-sm font-medium">Pendientes de revisión</h2>
          <Link
            to={APP_ROUTES.INVENTARIO}
            className="flex min-h-11 items-center justify-between gap-4 text-sm hover:underline md:min-h-9"
          >
            <span className="text-muted-foreground">Stock bajo o agotado</span>
            <span className="font-semibold tabular-nums">
              {metrics.productosBajoStock}
            </span>
          </Link>
          <Link
            to={APP_ROUTES.VENTAS}
            className="flex min-h-11 items-center justify-between gap-4 text-sm hover:underline md:min-h-9"
          >
            <span className="text-muted-foreground">Ventas pendientes</span>
            <span className="font-semibold tabular-nums">
              {metrics.pedidosPendientes}
            </span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
