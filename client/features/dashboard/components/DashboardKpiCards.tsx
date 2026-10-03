import React from 'react';
import { MetricCard } from '@/components/common/MetricCard';
import { DashboardMetrics } from '../types/dashboard.types';
import { formatCurrency } from '@/utils/formatters';
import { ShoppingCart, DollarSign, Clock, AlertTriangle } from 'lucide-react';

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-muted/40 animate-pulse border border-border/60"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Ventas del Día"
        value={formatCurrency(metrics.ventasHoy)}
        subtitle="18 comprobantes emitidos"
        change={metrics.variacionVentas}
        changeLabel="vs día anterior"
        icon={ShoppingCart}
        iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400"
      />

      <MetricCard
        title="Saldo en Caja"
        value={formatCurrency(metrics.saldoCaja)}
        subtitle="Caja Turno Mañana Abierta"
        icon={DollarSign}
        iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400"
      />

      <MetricCard
        title="Comprobantes Pendientes"
        value={`${metrics.pedidosPendientes}`}
        subtitle="Por cobrar o entregar"
        icon={Clock}
        iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400"
      />

      <MetricCard
        title="Alertas de Stock"
        value={`${metrics.productosBajoStock} ítems`}
        subtitle="Por debajo del mínimo"
        icon={AlertTriangle}
        iconColor="text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400"
      />
    </div>
  );
};
