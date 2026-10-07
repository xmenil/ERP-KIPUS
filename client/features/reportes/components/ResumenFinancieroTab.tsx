import React from 'react';
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
import { ResumenFinanciero } from '../types/reportes.types';
import { formatMoney } from '@/utils/formatters';
import { TrendingUp, ArrowDownRight, Layers, DollarSign } from 'lucide-react';

interface ResumenFinancieroTabProps {
  financiero: ResumenFinanciero | null;
  periodoLabel: string;
}

export const ResumenFinancieroTab: React.FC<ResumenFinancieroTabProps> = ({
  financiero,
  periodoLabel,
}) => {
  if (!financiero) return null;

  const chartData = financiero.desgloseMensual || [];

  return (
    <div className="space-y-6">
      {/* Gráfico y Desglose Contable */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico de Evolución Mensual */}
        <Card className="lg:col-span-7 rounded-md border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Evolución semestral de ingresos y costos
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Comparativa de facturación bruta frente al costo de mercadería y gastos operativos
                </CardDescription>
              </div>
              <Badge variant="outline" className="w-fit text-xs font-normal border-border bg-muted/40">
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
                    fontSize={12}
                    tickMargin={8}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    fontSize={11}
                    tickFormatter={(val) => `S/ ${(val / 1000).toFixed(0)}k`}
                    stroke="hsl(var(--muted-foreground))"
                    className="tabular-nums font-mono"
                  />
                  <Tooltip
                    formatter={(value: number) => [formatMoney(value), '']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.375rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    iconType="rect"
                    iconSize={10}
                  />
                  <Bar
                    name="Ingresos facturados"
                    dataKey="ingresos"
                    fill="hsl(var(--chart-1))"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    name="Costo de mercadería"
                    dataKey="costos"
                    fill="hsl(var(--chart-neutral))"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    name="Gastos fijos"
                    dataKey="gastos"
                    fill="hsl(var(--chart-2))"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Estructura del Estado de Resultados (P&L) */}
        <Card className="lg:col-span-5 rounded-md border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Estado de Resultados (P&L)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Desglose contable para {periodoLabel}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs border-border bg-card">
                Soles (PEN)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {/* 1. Ventas Netas */}
            <div className="p-2.5 rounded-md border border-border/70 bg-card">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  <span className="text-primary font-semibold">(+)</span>
                  Ventas netas facturadas
                </span>
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  {formatMoney(financiero.ventasTotales)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Total de comprobantes emitidos en el período
              </p>
            </div>

            {/* 2. Costo de Ventas */}
            <div className="p-2.5 rounded-md border border-border/70 bg-card">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                  <span className="text-danger-text font-semibold">(-)</span>
                  Costo de mercadería vendida (CMV)
                </span>
                <span className="font-mono font-medium tabular-nums text-danger-text">
                  -{formatMoney(financiero.costoVentas)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Costo de adquisición de productos despachados
              </p>
            </div>

            {/* 3. Utilidad Bruta */}
            <div className="p-2.5 rounded-md bg-muted/40 border border-border/70">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="text-primary font-semibold">(=)</span>
                  Utilidad bruta operativa
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] font-mono border-primary/30 text-primary bg-primary-soft">
                    {financiero.margenBrutoPorcentaje}%
                  </Badge>
                  <span className="font-mono font-semibold tabular-nums text-primary">
                    {formatMoney(financiero.utilidadBruta)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Gastos Operativos */}
            <div className="p-2.5 rounded-md border border-border/70 bg-card">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                  <span className="text-danger-text font-semibold">(-)</span>
                  Gastos operativos y servicios
                </span>
                <span className="font-mono font-medium tabular-nums text-danger-text">
                  -{formatMoney(financiero.gastosOperativos)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Alquiler, servicios, movilidad y planillas
              </p>
            </div>

            {/* 5. Utilidad Neta Final */}
            <div className="p-3 rounded-md bg-success-soft border border-success/30 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-success-text flex items-center gap-1.5">
                    <span className="font-semibold">(=)</span>
                    Utilidad neta estimada
                  </span>
                  <p className="text-[11px] text-success-text/80 mt-0.5">
                    Ganancia líquida disponible antes de IR
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-base font-semibold tabular-nums text-success-text">
                    {formatMoney(financiero.utilidadNeta)}
                  </div>
                  <span className="inline-block text-[11px] font-mono text-success-text">
                    Margen neto: {financiero.margenNetoPorcentaje}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
