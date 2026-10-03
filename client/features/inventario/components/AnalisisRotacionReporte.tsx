import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ItemStockDetalle, MovimientoKardex } from '../types/inventario.types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingUp, AlertCircle, Coins, ArrowUpRight } from 'lucide-react';

interface AnalisisRotacionReporteProps {
  productos: ItemStockDetalle[];
  movimientos: MovimientoKardex[];
}

export const AnalisisRotacionReporte: React.FC<AnalisisRotacionReporteProps> = ({
  productos,
  movimientos,
}) => {
  // Totales valorizados
  const totalCosto = productos.reduce((sum, p) => sum + p.valorizadoCosto, 0);
  const totalVenta = productos.reduce((sum, p) => sum + p.valorizadoVenta, 0);
  const gananciaPotencial = totalVenta - totalCosto;
  const margenPromedio = totalVenta > 0 ? (gananciaPotencial / totalVenta) * 100 : 0;

  // Inversión por categoría
  const categoriaMap: Record<string, { categoria: string; inversion: number; unidades: number }> = {};
  productos.forEach((p) => {
    if (!categoriaMap[p.categoria]) {
      categoriaMap[p.categoria] = { categoria: p.categoria, inversion: 0, unidades: 0 };
    }
    categoriaMap[p.categoria].inversion += p.valorizadoCosto;
    categoriaMap[p.categoria].unidades += p.stock;
  });

  const datosCategorias = Object.values(categoriaMap).sort((a, b) => b.inversion - a.inversion);

  // Conteo de salidas por producto en el Kardex para ver rotación
  const salidasPorProducto: Record<string, number> = {};
  movimientos
    .filter((m) => m.tipo === 'SALIDA')
    .forEach((m) => {
      salidasPorProducto[m.productoNombre] =
        (salidasPorProducto[m.productoNombre] || 0) + m.cantidad;
    });

  // Top productos de mayor rotación (más vendidos)
  const productosRotacion = [...productos]
    .map((p) => ({
      ...p,
      unidadesVendidas: salidasPorProducto[p.nombre] || 0,
    }))
    .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas);

  const topVendidos = productosRotacion.slice(0, 3);
  const estancados = productosRotacion.filter((p) => p.unidadesVendidas === 0 && p.stock > 0);

  return (
    <div className="space-y-4">
      {/* Tarjetas resumen de valorización */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-primary" />
              Capital Invertido en Mercadería
            </span>
            <div className="text-xl font-bold font-mono tabular-nums text-foreground">
              S/ {totalCosto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Costo total pagado por el stock existente
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              Valor Proyectado de Venta
            </span>
            <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
              S/ {totalVenta.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Si se vende el 100% al precio actual de mostrador
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
              Margen de Ganancia Estimado
            </span>
            <div className="text-xl font-bold font-mono tabular-nums text-foreground">
              {margenPromedio.toFixed(1)}%
              <span className="text-xs font-normal text-muted-foreground ml-1.5">
                (S/ {gananciaPotencial.toLocaleString('es-PE', { minimumFractionDigits: 2 })})
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Utilidad bruta proyectada sobre compras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico y listas de rotación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico de barras: Inversión en soles por categoría */}
        <Card className="border-border/80">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Distribución de Capital por Categoría (en S/)
            </CardTitle>
            <CardDescription className="text-xs">
              Muestra dónde está concentrado el dinero de tu negocio actualmente.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosCategorias} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="categoria"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(val) => `S/ ${val}`}
                  />
                  <Tooltip
                    formatter={(val: number) => [
                      `S/ ${val.toFixed(2)}`,
                      'Inversión en stock',
                    ]}
                    labelStyle={{ fontSize: 12, fontWeight: 600 }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="inversion"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Diagnóstico de Rotación */}
        <div className="space-y-3">
          {/* Productos de Mayor Demanda */}
          <Card className="border-border/80">
            <CardHeader className="p-3.5 pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                Productos con Mayor Salida (Rotación Rápida)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-2">
              {topVendidos.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/50 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground block">{p.nombre}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      SKU: {p.sku} · Stock actual: {p.stock} unid.
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono block">
                      {p.unidadesVendidas} unid. despachadas
                    </span>
                    <span className="text-[10px] text-muted-foreground">Demanda activa</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Productos Estancados o Sin Venta */}
          <Card className="border-border/80">
            <CardHeader className="p-3.5 pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                Artículos sin Movimiento Reciente (Dinero Estancado)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-2">
              {estancados.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  Todos tus artículos han tenido movimiento recientemente.
                </p>
              ) : (
                estancados.slice(0, 2).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/50 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-foreground block">{p.nombre}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Ubicación: {p.ubicacion} · {p.stock} unid. guardadas
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-warning-text font-semibold block text-xs">
                        S/ {p.valorizadoCosto.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Inmovilizado</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
