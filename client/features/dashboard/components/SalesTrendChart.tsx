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
import { SalesTrendItem } from '../types/dashboard.types';
import { formatCurrency } from '@/utils/formatters';

interface SalesTrendChartProps {
  data: SalesTrendItem[];
  isLoading?: boolean;
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="rounded-md border-border bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="h-5 w-52 bg-muted/50 rounded-md animate-pulse" />
          <div className="h-4 w-72 bg-muted/30 rounded-md animate-pulse mt-1" />
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full bg-muted/20 rounded-md animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const isEmpty = !data || data.length === 0;

  return (
    <Card className="rounded-md border-border bg-card shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Ventas y gastos diarios (últimos 7 días)
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Comparativa de ingresos cobrados frente a egresos operativos y compras
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-md">
            <p className="text-sm text-muted-foreground">
              Aún no hay suficientes movimientos en la semana para graficar tendencias.
            </p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="dia"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickMargin={8}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={46}
                  fontSize={11}
                  tickFormatter={(val) => `S/ ${val}`}
                  stroke="hsl(var(--muted-foreground))"
                  className="tabular-nums font-mono"
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.375rem',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  name="Ventas"
                  dataKey="ventas"
                  fill="hsl(var(--primary))"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  name="Gastos"
                  dataKey="gastos"
                  fill="hsl(var(--danger-text))"
                  radius={[3, 3, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesTrendChart;
