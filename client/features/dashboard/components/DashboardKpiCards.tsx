import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardMetrics } from '../types/dashboard.types';
import { formatCurrency } from '@/utils/formatters';
import { ArrowUpRight, TrendingUp, TrendingDown, AlertTriangle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '@/constants/routes';

interface DashboardKpiCardsProps {
  metrics?: DashboardMetrics;
  isLoading?: boolean;
}

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = ({
  metrics,
  isLoading,
}) => {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-28 rounded-md bg-muted/50 border border-border animate-pulse" />
          <div className="h-28 rounded-md bg-muted/50 border border-border animate-pulse" />
        </div>
        <div className="h-28 rounded-md bg-muted/50 border border-border animate-pulse" />
      </div>
    );
  }

  const isVentasPositive = (metrics.variacionVentas ?? 0) >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Bloque 1: Resumen de Dinero (Ventas y Caja) */}
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ventas de hoy */}
        <Card className="rounded-md border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <span className="text-xs font-medium text-muted-foreground block">
                Ventas de hoy
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums text-foreground">
                  {formatCurrency(metrics.ventasHoy)}
                </span>
                {metrics.variacionVentas !== undefined && (
                  <span
                    className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded-sm ${
                      isVentasPositive
                        ? 'bg-success-soft text-success-text'
                        : 'bg-danger-soft text-danger-text'
                    }`}
                  >
                    {isVentasPositive ? (
                      <TrendingUp className="mr-0.5 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-0.5 h-3 w-3" />
                    )}
                    {isVentasPositive
                      ? `+${metrics.variacionVentas}%`
                      : `${metrics.variacionVentas}%`}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border">
              Comprobantes emitidos en el día
            </p>
          </CardContent>
        </Card>

        {/* Saldo en caja */}
        <Card className="rounded-md border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Efectivo en caja chica
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-sm bg-primary-soft text-primary">
                  Caja abierta
                </span>
              </div>
              <div className="mt-1">
                <span className="text-2xl font-semibold tabular-nums text-foreground">
                  {formatCurrency(metrics.saldoCaja)}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Turno mañana activo</span>
              <Link
                to={APP_ROUTES.CAJA}
                className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
              >
                Arqueo
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bloque 2: Panel de Urgencias y Atención */}
      <Card className="rounded-md border-border bg-card shadow-xs flex flex-col justify-between">
        <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-2.5">
              Atención inmediata
            </span>

            <div className="space-y-2">
              {/* Alerta de Stock */}
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-danger-text" />
                  Stock bajo o crítico
                </span>
                <span className="font-mono text-xs font-medium px-1.5 py-0.5 rounded-sm bg-danger-soft text-danger-text">
                  {metrics.productosBajoStock} ítems
                </span>
              </div>

              {/* Comprobantes pendientes */}
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Clock className="h-3.5 w-3.5 text-warning-text" />
                  Pendientes de cobro
                </span>
                <span className="font-mono text-xs font-medium px-1.5 py-0.5 rounded-sm bg-warning-soft text-warning-text">
                  {metrics.pedidosPendientes} doc.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Requiere revisión</span>
            <Link
              to={APP_ROUTES.INVENTARIO}
              className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
            >
              Ver inventario
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
