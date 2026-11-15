import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/common/MetricCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResumenFinanciero, TopProductoReporte } from '../types/reportes.types';
import { formatCurrency, formatMoney, formatNumber } from '@/utils/formatters';
import {
  TrendingUp,
  PiggyBank,
  ArrowDownCircle,
  Percent,
  Sparkles,
  Layers,
  Award,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReporteVentasRentabilidadViewProps {
  financiero: ResumenFinanciero | null;
  topProductos: TopProductoReporte[];
  periodoLabel: string;
}

type PeriodoRapido = 'HOY' | 'AYER' | 'SEMANA' | 'ESTE_MES' | 'ANIO';

export const ReporteVentasRentabilidadView: React.FC<ReporteVentasRentabilidadViewProps> = ({
  financiero,
  topProductos,
  periodoLabel,
}) => {
  const [periodoRapido, setPeriodoRapido] = useState<PeriodoRapido>('ESTE_MES');

  // Cálculo de productos Pareto (Top que acumula el ~80% de ventas)
  const productosPareto = useMemo(() => {
    if (!topProductos || topProductos.length === 0) return [];
    const totalRecaudadoVentas = topProductos.reduce((s, p) => s + p.totalRecaudado, 0);
    let acumulado = 0;

    return topProductos.map((p) => {
      acumulado += p.totalRecaudado;
      const pctAcumulado = totalRecaudadoVentas > 0 ? (acumulado / totalRecaudadoVentas) * 100 : 0;
      const esPareto80 = pctAcumulado <= 80;

      return {
        ...p,
        pctAcumulado: Math.round(pctAcumulado),
        esPareto: esPareto80,
      };
    });
  }, [topProductos]);

  const countPareto = useMemo(() => productosPareto.filter((p) => p.esPareto).length, [productosPareto]);

  const chartData = financiero?.desgloseMensual || [];

  return (
    <div className="space-y-4">
      {/* 1. Selector de Período Rápido */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-muted/40 rounded-lg border border-border/60">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full sm:w-auto">
          {[
            { id: 'HOY', label: 'Hoy' },
            { id: 'AYER', label: 'Ayer' },
            { id: 'SEMANA', label: 'Esta semana' },
            { id: 'ESTE_MES', label: 'Mes actual' },
            { id: 'ANIO', label: 'Año 2026' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriodoRapido(item.id as PeriodoRapido)}
              className={cn(
                'px-3 py-1 rounded text-xs font-semibold transition-all whitespace-nowrap',
                periodoRapido === item.id
                  ? 'bg-card text-foreground shadow-xs border border-border font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground font-medium px-2">
          {periodoLabel}
        </span>
      </div>

      {/* 2. Tarjetas KPI de Margen y Rentabilidad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Ventas Netas Totales"
          value={formatMoney(financiero?.ventasTotales ?? 0)}
          subtitle="Facturación por ventas del período"
          icon={TrendingUp}
          iconColor="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
        />
        <MetricCard
          title="Utilidad Bruta"
          value={formatMoney(financiero?.utilidadBruta ?? 0)}
          subtitle={`Margen comercial: ${(financiero?.margenBrutoPorcentaje ?? 38).toFixed(1)}%`}
          icon={PiggyBank}
          iconColor="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
        />
        <MetricCard
          title="Egresos Operativos"
          value={formatMoney(financiero?.gastosOperativos ?? 0)}
          subtitle="Alquiler, planilla, servicios y logística"
          icon={ArrowDownCircle}
          iconColor="text-danger-text bg-danger-soft"
        />
        <MetricCard
          title="Utilidad Neta Real"
          value={formatMoney(financiero?.utilidadNeta ?? 0)}
          subtitle={`Margen neto final: ${(financiero?.margenNetoPorcentaje ?? 27).toFixed(1)}%`}
          icon={Percent}
          iconColor="text-primary bg-primary/10"
        />
      </div>

      {/* 3. Gráfico de Evolución Semestral y Desglose P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-7 border border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Evolución de Ingresos vs. Costos y Utilidad
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Facturación bruta frente a costo de mercadería y utilidad neta
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[11px] bg-muted/40">
                Últimos 6 meses
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="periodo"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(val) => `S/${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: number) => [formatMoney(val), '']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      fontSize: '12px',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="ingresos" name="Ventas" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="costos" name="Costo Mercadería" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="utilidad" name="Utilidad Neta" fill="#10b981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Resumen P&L en cascada */}
        <Card className="lg:col-span-5 border border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-bold text-foreground">
              Estado de Resultados (P&L Condensado)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Desglose contable paso a paso
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="font-semibold text-foreground">(+) Ventas Brutas Totales:</span>
              <span className="font-mono font-bold text-foreground">
                {formatCurrency(financiero?.ventasTotales ?? 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/50 text-amber-700 dark:text-amber-400">
              <span>(-) Costo de Mercadería Vendida:</span>
              <span className="font-mono font-semibold">
                -{formatCurrency(financiero?.costoVentas ?? 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 px-2.5 rounded-md bg-muted/50 font-bold border border-border/70">
              <span>(=) Utilidad Bruta Operativa:</span>
              <span className="font-mono text-primary text-sm">
                {formatCurrency(financiero?.utilidadBruta ?? 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/50 text-danger-text">
              <span>(-) Gastos Operativos de Administración:</span>
              <span className="font-mono font-semibold">
                -{formatCurrency(financiero?.gastosOperativos ?? 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
              <span>(=) Utilidad Neta en Bolsillo:</span>
              <span className="font-mono text-base">
                {formatCurrency(financiero?.utilidadNeta ?? 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Tabla de Productos Pareto (Top 20% que genera el 80% de ingresos) */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Award className="h-4 w-4 text-primary" />
                <span>Productos Clave bajo Principio de Pareto (80 / 20)</span>
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Los {countPareto} artículos que concentran el 80% de la facturación comercial de tu negocio.
              </p>
            </div>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 w-fit">
              Top Pareto: {countPareto} productos líderes
            </Badge>
          </div>

          <div className="overflow-x-auto rounded border border-border bg-card">
            <Table className="w-full min-w-[700px]">
              <TableHeader className="bg-muted/50">
                <TableRow className="text-xs">
                  <TableHead className="py-2.5">Producto & SKU</TableHead>
                  <TableHead className="py-2.5 text-center w-28">Unidades Vendidas</TableHead>
                  <TableHead className="py-2.5 text-right w-36">Total Recaudado</TableHead>
                  <TableHead className="py-2.5 text-center w-32">% Venta</TableHead>
                  <TableHead className="py-2.5 text-center w-36">Clasificación Pareto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosPareto.slice(0, 10).map((p, idx) => (
                  <TableRow key={idx} className="text-xs hover:bg-muted/20">
                    <TableCell className="py-2.5">
                      <span className="font-semibold text-foreground block">{p.nombre}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        SKU: {p.sku} {p.categoria ? `· ${p.categoria}` : ''}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums font-semibold py-2.5">
                      {p.unidadesVendidas} un.
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground py-2.5">
                      {formatCurrency(p.totalRecaudado)}
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums py-2.5">
                      {p.porcentajeVenta}%
                    </TableCell>
                    <TableCell className="text-center py-2.5">
                      {p.esPareto ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300">
                          Pareto · 80/20
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                          Complementario
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
