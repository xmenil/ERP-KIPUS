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
      <Card className="border-border/80">
        <CardHeader>
          <div className="h-5 w-40 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-60 bg-muted/40 rounded animate-pulse mt-1" />
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full bg-muted/30 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-foreground">
          Ingresos vs Egresos Semanales
        </CardTitle>
        <CardDescription className="text-xs">
          Comparativa diaria de ventas facturadas frente a egresos y compras
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="dia"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tickFormatter={(val) => `S/ ${val}`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), '']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar
                name="Ventas"
                dataKey="ventas"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                name="Gastos"
                dataKey="gastos"
                fill="hsl(var(--muted-foreground))"
                radius={[4, 4, 0, 0]}
                opacity={0.5}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
