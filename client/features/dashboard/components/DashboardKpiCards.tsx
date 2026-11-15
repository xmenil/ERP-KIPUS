import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardMetrics } from '../types/dashboard.types';
import { formatCurrency } from '@/utils/formatters';
import {
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Package,
  Truck,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { isRoleAlmacenero } from '@/features/auth/utils/permissions';

interface DashboardKpiCardsProps {
  metrics?: DashboardMetrics;
  isLoading?: boolean;
}

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = ({
  metrics,
  isLoading,
}) => {
  const { user } = useAuth();
  const esAlmacenero = isRoleAlmacenero(user?.rol);

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-lg bg-muted/40 border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  // Vista exclusiva para rol Almacenero (operativa física sin saldos financieros)
  if (esAlmacenero) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Catálogo */}
        <Card className="rounded-lg border-border bg-card shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Artículos en Almacén
              </span>
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {metrics.totalProductosActivos ?? 142}
              </span>
              <span className="text-xs text-muted-foreground ml-1 font-medium">ítems activos</span>
            </div>
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Catálogo total</span>
              <Link
                to="/inventario?tab=catalogo"
                className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
              >
                Ver catálogo
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 2. Stock Bajo / Crítico */}
        <Card className="rounded-lg border-border bg-card shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Stock Bajo o Crítico
              </span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tabular-nums text-danger-text">
                {metrics.productosBajoStock}
              </span>
              <span className="text-xs text-danger-text/80 ml-1 font-medium">por reponer</span>
            </div>
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Quiebres inminentes</span>
              <Link
                to="/inventario?tab=stock"
                className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
              >
                Revisar alertas
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 3. Recepciones de compra pendientes */}
        <Card className="rounded-lg border-border bg-card shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Recepción de Compras
              </span>
              <Truck className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {metrics.comprasPendientes ?? metrics.pedidosPendientes ?? 3}
              </span>
              <span className="text-xs text-muted-foreground ml-1 font-medium">órdenes pendientes</span>
            </div>
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Por ingresar</span>
              <Link
                to="/compras?tab=recepcion"
                className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
              >
                Recepcionar
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 4. Kardex y conteos */}
        <Card className="rounded-lg border-border bg-card shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Kardex y Conteos
              </span>
              <ArrowLeftRight className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2">
              <span className="text-base font-semibold text-foreground">
                Auditoría Activa
              </span>
              <p className="text-[11px] text-muted-foreground">Movimientos en tiempo real</p>
            </div>
            <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Historial físico</span>
              <Link
                to="/inventario?tab=kardex"
                className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
              >
                Ver kardex
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista Ejecutiva de 4 KPIs para Dueño / Admin y Cajero
  const isVentasPositive = (metrics.variacionVentas ?? 0) >= 0;
  const gananciaEstimada = metrics.gananciaEstimada ?? Math.round(metrics.ventasHoy * 0.30 * 100) / 100;
  const totalAlertas = (metrics.productosBajoStock || 0) + (metrics.pedidosPendientes || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* KPI 1: Ventas del día */}
      <Card className="rounded-lg border-border bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Ventas del día
              </span>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {formatCurrency(metrics.ventasHoy)}
              </span>
              {metrics.variacionVentas !== undefined && (
                <span
                  className={`inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                    isVentasPositive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  }`}
                  title="Comparativo vs. jornada anterior"
                >
                  {isVentasPositive ? (
                    <TrendingUp className="mr-0.5 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-0.5 h-3 w-3" />
                  )}
                  {isVentasPositive ? `+${metrics.variacionVentas}%` : `${metrics.variacionVentas}%`}
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Jornada actual</span>
            <Link
              to="/ventas?tab=pos"
              className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
            >
              Ir a POS (F2)
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* KPI 2: Ganancia estimada (Margen Bruto) */}
      <Card className="rounded-lg border-border bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Ganancia estimada
              </span>
              <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(gananciaEstimada)}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase px-1 py-0.5 rounded bg-muted">
                ~30% margen
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Margen bruto proyectado</span>
            <Link
              to="/reportes?tab=ventas"
              className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
            >
              Ver análisis
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* KPI 3: Estado de Caja */}
      <Card className="rounded-lg border-border bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Efectivo en caja
              </span>
              <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {formatCurrency(metrics.saldoCaja)}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Abierta
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Turno activo</span>
            <Link
              to="/ventas?tab=caja"
              className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
            >
              Arqueo de caja
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* KPI 4: Alertas Críticas */}
      <Card className="rounded-lg border-border bg-card shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Alertas críticas
              </span>
              <AlertTriangle className={`h-4 w-4 ${totalAlertas > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold tabular-nums ${totalAlertas > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                {totalAlertas}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                ({metrics.productosBajoStock} stock · {metrics.pedidosPendientes} fiados)
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Atención prioritaria</span>
            <Link
              to="/inventario?tab=stock"
              className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
            >
              Resolver
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardKpiCards;
