import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MetricCard } from '@/components/common/MetricCard';
import { reportesService } from '../services/reportesService';
import {
  ResumenFinanciero,
  LiquidacionSunat,
  TopProductoReporte,
} from '../types/reportes.types';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  FileSpreadsheet,
  Coins,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

export const ReportesPage: React.FC = () => {
  const [financiero, setFinanciero] = useState<ResumenFinanciero | null>(null);
  const [sunat, setSunat] = useState<LiquidacionSunat | null>(null);
  const [topProductos, setTopProductos] = useState<TopProductoReporte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fin, sun, top] = await Promise.all([
          reportesService.getResumenFinanciero(),
          reportesService.getLiquidacionSunat(),
          reportesService.getTopProductos(),
        ]);
        setFinanciero(fin);
        setSunat(sun);
        setTopProductos(top);
      } catch {
        toast.error('Error al cargar reportes');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExport = (tipo: 'Excel' | 'PDF') => {
    toast.success(`Generando exportación de reporte en formato ${tipo}...`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes Gerenciales y Tributarios"
        description="Estado de resultados, liquidación estimada de IGV mensual y ranking de productos más rentables"
        badge="Cierre Mensual"
      >
        <Button variant="outline" size="sm" onClick={() => handleExport('PDF')} className="gap-2">
          <Download className="h-4 w-4" />
          <span>Exportar PDF</span>
        </Button>
        <Button
          size="sm"
          onClick={() => handleExport('Excel')}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Descargar Excel</span>
        </Button>
      </PageHeader>

      <Tabs defaultValue="rentabilidad" className="w-full space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="rentabilidad" className="text-xs">
            Rentabilidad & Pérdidas y Ganancias
          </TabsTrigger>
          <TabsTrigger value="sunat" className="text-xs">
            Liquidación IGV SUNAT
          </TabsTrigger>
          <TabsTrigger value="top-productos" className="text-xs">
            Productos Más Vendidos
          </TabsTrigger>
        </TabsList>

        {/* Pestaña 1: Rentabilidad */}
        <TabsContent value="rentabilidad" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Ventas Facturadas"
              value={formatCurrency(financiero?.ventasTotales ?? 0)}
              subtitle="Ingresos brutos del período"
              icon={TrendingUp}
              iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40"
            />
            <MetricCard
              title="Utilidad Neta del Período"
              value={formatCurrency(financiero?.utilidadNeta ?? 0)}
              subtitle={`Margen de ganancia: ${financiero?.margenNetoPorcentaje ?? 0}%`}
              icon={Coins}
              iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
            />
            <MetricCard
              title="Costos & Gastos Operativos"
              value={formatCurrency(
                (financiero?.costoVentas ?? 0) + (financiero?.gastosOperativos ?? 0)
              )}
              subtitle="Costo de mercadería + gastos fijos"
              icon={BarChart3}
              iconColor="text-rose-600 bg-rose-50 dark:bg-rose-950/40"
            />
          </div>

          <Card className="border-border/80">
            <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
              <CardTitle className="text-base font-bold text-foreground">
                Estructura del Estado de Resultados (P&L)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Desglose analítico de ingresos brutos, costo de adquisición y gastos fijos/variables
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="divide-y divide-border/60 text-sm">
                <div className="flex justify-between py-3 font-bold text-foreground text-sm">
                  <span>(+) Ventas Netas Totales Facturadas</span>
                  <span className="font-mono text-base tabular-nums">{formatCurrency(financiero?.ventasTotales ?? 0)}</span>
                </div>
                <div className="flex justify-between py-3 text-slate-600 dark:text-slate-400 font-medium">
                  <span>(-) Costo de Mercadería Vendida (Costo de Compra/Adquisición)</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono font-bold tabular-nums">
                    -{formatCurrency(financiero?.costoVentas ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between py-3 font-bold text-foreground bg-muted/40 px-3 rounded border border-border/40">
                  <span>(=) Utilidad Bruta Operativa</span>
                  <span className="font-mono text-base tabular-nums text-primary">{formatCurrency(financiero?.utilidadBruta ?? 0)}</span>
                </div>
                <div className="flex justify-between py-3 text-slate-600 dark:text-slate-400 font-medium">
                  <span>(-) Gastos Operativos (Alquileres, Servicios, Planilla, Logística)</span>
                  <span className="text-rose-600 dark:text-rose-400 font-mono font-bold tabular-nums">
                    -{formatCurrency(financiero?.gastosOperativos ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between py-3.5 font-black text-base text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 rounded-lg border border-emerald-200 dark:border-emerald-800 mt-3 shadow-xs">
                  <span>(=) UTILIDAD NETA ESTIMADA DEL NEGOCIO</span>
                  <span className="font-mono text-xl tabular-nums">{formatCurrency(financiero?.utilidadNeta ?? 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña 2: SUNAT */}
        <TabsContent value="sunat" className="space-y-4">
          <Card className="border-border/80">
            <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <Coins className="h-5 w-5 text-primary" />
                Resumen Preliminar de Impuesto General a las Ventas (IGV 18%)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Cálculo estimativo para la declaración mensual de SUNAT (Formulario Virtual 621)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border/80 bg-card space-y-2.5">
                  <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                    Ventas Emitidas (Débito Fiscal)
                  </h4>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Base Imponible Gravada:</span>
                    <span className="font-bold text-foreground font-mono tabular-nums">
                      {formatCurrency(sunat?.baseImponibleVentas ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-blue-700 dark:text-blue-400 pt-2 border-t border-border/60 font-mono tabular-nums">
                    <span>IGV Facturado a Cobrar (18%):</span>
                    <span>{formatCurrency(sunat?.igvVentasDebito ?? 0)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border/80 bg-card space-y-2.5">
                  <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">
                    Compras con Factura (Crédito Fiscal)
                  </h4>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Base Imponible Compras:</span>
                    <span className="font-bold text-foreground font-mono tabular-nums">
                      {formatCurrency(sunat?.baseImponibleCompras ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 pt-2 border-t border-border/60 font-mono tabular-nums">
                    <span>Crédito Fiscal IGV a Favor (18%):</span>
                    <span>{formatCurrency(sunat?.igvComprasCredito ?? 0)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/25 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-foreground">
                    Saldo Estimado de IGV a Pagar a SUNAT:
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Diferencia entre Débito Fiscal facturado y Crédito Fiscal deducible de facturas de compras.
                  </p>
                </div>
                <div className="text-2xl font-black text-primary font-mono tabular-nums">
                  {formatCurrency(sunat?.igvPagar ?? 0)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña 3: Top Productos */}
        <TabsContent value="top-productos" className="space-y-4">
          <Card className="border-border/80">
            <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
              <CardTitle className="text-base font-bold text-foreground">
                Ranking de Artículos Más Demandados
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Productos con mayor rotación e impacto en la facturación del negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-slate-100/90 dark:bg-slate-800/90 border-b border-border">
                      <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Ranking</TableHead>
                      <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Producto / SKU</TableHead>
                      <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-center py-2.5">
                        Unidades Vendidas
                      </TableHead>
                      <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-right py-2.5">
                        Recaudación Total
                      </TableHead>
                      <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-right py-2.5">
                        % Facturación
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProductos.map((p, idx) => (
                      <TableRow key={p.sku} className="text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-border/70 transition-colors">
                        <TableCell className="font-mono font-bold text-primary py-2.5">
                          #{idx + 1}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground py-2.5 text-[13px]">
                          {p.nombre}
                          <span className="block text-[11px] text-muted-foreground font-mono font-normal">
                            SKU: {p.sku}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-bold font-mono text-foreground py-2.5 text-[13px] tabular-nums">
                          {p.unidadesVendidas} unid.
                        </TableCell>
                        <TableCell className="text-right font-black font-mono text-foreground py-2.5 text-[14px] tabular-nums">
                          {formatCurrency(p.totalRecaudado)}
                        </TableCell>
                        <TableCell className="text-right font-bold font-mono text-primary py-2.5 text-[13px] tabular-nums">
                          {p.porcentajeVenta}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportesPage;
