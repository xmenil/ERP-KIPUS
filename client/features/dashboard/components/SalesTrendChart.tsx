import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SalesTrendItem } from '../types/dashboard.types';
import { formatCurrency } from '@/utils/formatters';
import { Clock, Calendar } from 'lucide-react';

interface SalesTrendChartProps {
  data: SalesTrendItem[];
  isLoading?: boolean;
}

const mockHourlyData = [
  { hora: '08:00', ventas: 120, transacciones: 6 },
  { hora: '10:00', ventas: 280, transacciones: 14 },
  { hora: '12:00', ventas: 540, transacciones: 26 },
  { hora: '14:00', ventas: 390, transacciones: 19 },
  { hora: '16:00', ventas: 310, transacciones: 15 },
  { hora: '18:00', ventas: 680, transacciones: 32 },
  { hora: '20:00', ventas: 850, transacciones: 41 },
  { hora: '22:00', ventas: 220, transacciones: 11 },
];

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data, isLoading }) => {
  const [vista, setVista] = useState<'semanal' | 'horario'>('semanal');

  if (isLoading) {
    return (
      <Card className="rounded-lg border-border bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="h-5 w-52 bg-muted/50 rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted/30 rounded animate-pulse mt-1" />
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full bg-muted/20 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const isEmpty = !data || data.length === 0;

  return (
    <Card className="rounded-lg border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            {vista === 'semanal' ? 'Ventas y gastos diarios (últimos 7 días)' : 'Picos de afluencia de clientes (Tendencia horaria)'}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {vista === 'semanal'
              ? 'Comparativa de ingresos cobrados frente a egresos operativos'
              : 'Horas de mayor volumen de ventas y concurrencia en mostrador'}
          </CardDescription>
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md border border-border">
          <Button
            variant={vista === 'semanal' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setVista('semanal')}
            className={`h-7 px-2.5 text-xs font-medium ${
              vista === 'semanal' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
            }`}
          >
            <Calendar className="h-3 w-3 mr-1" />
            Semanal
          </Button>
          <Button
            variant={vista === 'horario' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setVista('horario')}
            className={`h-7 px-2.5 text-xs font-medium ${
              vista === 'horario' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
            }`}
          >
            <Clock className="h-3 w-3 mr-1" />
            Horario
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {vista === 'semanal' ? (
          isEmpty ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-lg">
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
          )
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHourlyData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentasHora" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="hora"
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
                  formatter={(value: number, name: string) => [
                    name === 'Venta S/' ? formatCurrency(value) : `${value} tickets`,
                    name,
                  ]}
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
                <Area
                  type="monotone"
                  name="Venta S/"
                  dataKey="ventas"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVentasHora)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesTrendChart;
