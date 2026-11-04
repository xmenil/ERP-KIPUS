import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { MetricCard } from '@/components/common/MetricCard';
import { reportesService } from '../services/reportesService';
import { inventarioService } from '@/features/inventario/services/inventarioService';
import { ItemStockDetalle } from '@/features/inventario/types/inventario.types';
import {
  ResumenFinanciero,
  LiquidacionSunat,
  TopProductoReporte,
  PeriodoReporte,
} from '../types/reportes.types';
import { formatMoney, formatCurrency, formatNumber } from '@/utils/formatters';
import { useAuth } from '@/features/auth/context/AuthContext';
import { isRoleAlmacenero } from '@/features/auth/utils/permissions';
import { KipusIaPage } from '@/features/kipus-ia/pages/KipusIaPage';
import { APP_ROUTES } from '@/constants/routes';

// Componentes modulares
import { ReportesSkeleton } from '../components/ReportesSkeleton';
import { ResumenFinancieroTab } from '../components/ResumenFinancieroTab';
import { LiquidacionSunatTab } from '../components/LiquidacionSunatTab';
import { TopProductosTab } from '../components/TopProductosTab';
import { ExportarReporteModal } from '../components/ExportarReporteModal';

// Iconos
import {
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Coins,
  RefreshCw,
  Download,
  AlertCircle,
  PiggyBank,
  ArrowDownCircle,
  Warehouse,
  Sparkles,
  Package,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';

export const ReportesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const esAlmacenero = isRoleAlmacenero(user?.rol);

  // Pestaña inicial según rol o URL
  const [tabActiva, setTabActiva] = useState<string>(() => {
    if (tabParam) return tabParam;
    return esAlmacenero ? 'inventario' : 'rentabilidad';
  });

  useEffect(() => {
    if (tabParam && tabParam !== tabActiva) {
      setTabActiva(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (val: string) => {
    setTabActiva(val);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if ((!esAlmacenero && val === 'rentabilidad') || (esAlmacenero && val === 'inventario')) {
          next.delete('tab');
        } else {
          next.set('tab', val);
        }
        return next;
      },
      { replace: true }
    );
  };

  const [periodo, setPeriodo] = useState<PeriodoReporte>('ESTE_MES');
  const [financiero, setFinanciero] = useState<ResumenFinanciero | null>(null);
  const [sunat, setSunat] = useState<LiquidacionSunat | null>(null);
  const [topProductos, setTopProductos] = useState<TopProductoReporte[]>([]);
  const [productosStock, setProductosStock] = useState<ItemStockDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalExportarOpen, setModalExportarOpen] = useState(false);

  const periodoLabels: Record<PeriodoReporte, string> = {
    ESTE_MES: 'Mes actual (Octubre 2026)',
    MES_ANTERIOR: 'Mes anterior (Setiembre 2026)',
    ANIO_ACTUAL: 'Año 2026 acumulado',
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fin, sun, top, prods] = await Promise.all([
        reportesService.getResumenFinanciero(periodo),
        reportesService.getLiquidacionSunat(periodo),
        reportesService.getTopProductos(periodo),
        inventarioService.getProductosStock(),
      ]);
      setFinanciero(fin);
      setSunat(sun);
      setTopProductos(top);
      setProductosStock(prods || []);
    } catch {
      setError('No se pudieron calcular los indicadores de reportes. Revisa la conectividad e inténtalo nuevamente.');
      toast.error('Error al sincronizar reportes gerenciales');
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cálculos de inventario para reportes
  const totalStockValorizado = productosStock.reduce((acc, p) => acc + (p.valorizadoCosto || 0), 0);
  const totalItemsBajoStock = productosStock.filter((p) => p.estadoNivel === 'STOCK_BAJO').length;
  const totalItemsAgotados = productosStock.filter((p) => p.estadoNivel === 'AGOTADO').length;

  return (
    <div className="space-y-6">
      {/* Encabezado con selector de período y acción primaria única */}
      <PageHeader
        title={esAlmacenero ? 'Reportes de Inventario y Stock' : 'Reportes e Indicadores del Negocio'}
        description={
          esAlmacenero
            ? 'Rotación de artículos, existencias valorizadas y alertas de reposición de almacén.'
            : 'Estados de resultados, liquidación SUNAT, rotación de mercadería y asistente KIPU\'S IA.'
        }
        badge={periodoLabels[periodo]}
      >
        {!esAlmacenero && (
          <div className="w-full sm:w-56">
            <Select
              value={periodo}
              onValueChange={(val) => setPeriodo(val as PeriodoReporte)}
            >
              <SelectTrigger className="h-9 text-xs bg-card">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ESTE_MES" className="text-xs">
                  Mes actual (Octubre)
                </SelectItem>
                <SelectItem value="MES_ANTERIOR" className="text-xs">
                  Mes anterior (Setiembre)
                </SelectItem>
                <SelectItem value="ANIO_ACTUAL" className="text-xs">
                  Año actual (2026)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Botón secundario: Actualizar */}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="h-9 gap-1.5 text-xs"
          title="Actualizar datos"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>

        {/* Acción Primaria Única: Exportar Reporte */}
        <Button
          variant="default"
          size="sm"
          onClick={() => setModalExportarOpen(true)}
          className="h-9 gap-1.5 text-xs font-medium"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar reporte</span>
        </Button>
      </PageHeader>

      {/* Estado de Error */}
      {error && !loading && (
        <Card className="rounded-md border-destructive/30 bg-danger-soft p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-danger-text shrink-0" />
              <p className="text-xs text-danger-text font-medium">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="h-8 text-xs border-destructive/30 text-danger-text hover:bg-destructive/10"
            >
              Reintentar carga
            </Button>
          </div>
        </Card>
      )}

      {/* Estado de Carga: Skeletons */}
      {loading ? (
        <ReportesSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Métricas Superiores: Diferenciadas según rol */}
          {esAlmacenero ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Artículos en Catálogo"
                value={formatNumber(productosStock.length)}
                subtitle="Productos con SKU registrado"
                icon={Package}
                iconColor="text-primary bg-primary-soft"
              />
              <MetricCard
                title="Stock Valorizado Total"
                value={formatMoney(totalStockValorizado)}
                subtitle="Costo acumulado en almacén"
                icon={Warehouse}
                iconColor="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
              />
              <MetricCard
                title="Productos con Stock Bajo"
                value={totalItemsBajoStock}
                subtitle="Por debajo del stock mínimo"
                icon={AlertTriangle}
                iconColor="text-amber-700 bg-amber-50 dark:bg-amber-950/40"
              />
              <MetricCard
                title="Artículos Agotados"
                value={totalItemsAgotados}
                subtitle="Sin stock disponible en almacén"
                icon={AlertCircle}
                iconColor="text-danger-text bg-danger-soft"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Ventas netas facturadas"
                value={formatMoney(financiero?.ventasTotales ?? 0)}
                subtitle="Ingresos brutos por comprobantes"
                icon={TrendingUp}
                iconColor="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
              />
              <MetricCard
                title="Utilidad operativa bruta"
                value={formatMoney(financiero?.utilidadBruta ?? 0)}
                subtitle={
                  financiero?.margenBrutoPorcentaje
                    ? `Margen comercial: ${financiero.margenBrutoPorcentaje.toFixed(1)}%`
                    : 'Margen comercial consolidado'
                }
                icon={PiggyBank}
                iconColor="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
              />
              <MetricCard
                title="Egresos operativos del mes"
                value={formatMoney(financiero?.gastosOperativos ?? 0)}
                subtitle="Gastos fijos, servicios y logística"
                icon={ArrowDownCircle}
                iconColor="text-danger-text bg-danger-soft"
              />
              <MetricCard
                title="IGV estimado a SUNAT"
                value={formatMoney(sunat?.igvPagar ?? 0)}
                subtitle={
                  (sunat?.creditoFiscalRemanente ?? 0) > 0
                    ? `Crédito fiscal a favor: ${formatMoney(sunat?.creditoFiscalRemanente ?? 0)}`
                    : 'Saldo a declarar en Form. 621'
                }
                icon={Receipt}
                iconColor="text-primary bg-primary-soft"
              />
            </div>
          )}

          {/* Pestañas de Detalle según Rol */}
          <Tabs value={tabActiva} onValueChange={handleTabChange} className="w-full space-y-4">
            <TabsList className="bg-muted/70 p-1 flex overflow-x-auto flex-nowrap sm:flex-wrap h-auto gap-1 border border-border/60 max-w-full scrollbar-none justify-start">
              {!esAlmacenero && (
                <>
                  <TabsTrigger value="rentabilidad" className="text-xs font-semibold py-1.5 px-3 gap-1.5 shrink-0">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Rentabilidad & P&L</span>
                  </TabsTrigger>
                  <TabsTrigger value="sunat" className="text-xs font-medium py-1.5 px-3 gap-1.5 shrink-0">
                    <Receipt className="h-3.5 w-3.5" />
                    <span>Liquidación IGV SUNAT</span>
                  </TabsTrigger>
                </>
              )}

              <TabsTrigger value="top-productos" className="text-xs font-medium py-1.5 px-3 gap-1.5 shrink-0">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Ranking de Rotación</span>
              </TabsTrigger>

              <TabsTrigger value="inventario" className="text-xs font-medium py-1.5 px-3 gap-1.5 shrink-0">
                <Warehouse className="h-3.5 w-3.5" />
                <span>Reportes de Inventario</span>
              </TabsTrigger>

              {!esAlmacenero && (
                <TabsTrigger value="ia" className="text-xs font-medium py-1.5 px-3 gap-1.5 shrink-0 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>KIPU'S IA (Predictivo)</span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Pestaña 1: Rentabilidad & Estado de Resultados (Solo Dueño/Admin) */}
            {!esAlmacenero && (
              <TabsContent value="rentabilidad" className="space-y-4 m-0 focus-visible:outline-none">
                <ResumenFinancieroTab
                  financiero={financiero}
                  periodoLabel={periodoLabels[periodo]}
                />
              </TabsContent>
            )}

            {/* Pestaña 2: Liquidación SUNAT (Solo Dueño/Admin) */}
            {!esAlmacenero && (
              <TabsContent value="sunat" className="space-y-4 m-0 focus-visible:outline-none">
                <LiquidacionSunatTab
                  sunat={sunat}
                  periodoLabel={periodoLabels[periodo]}
                />
              </TabsContent>
            )}

            {/* Pestaña 3: Ranking de Artículos */}
            <TabsContent value="top-productos" className="space-y-4 m-0 focus-visible:outline-none">
              <TopProductosTab
                productos={topProductos}
                periodoLabel={periodoLabels[periodo]}
              />
            </TabsContent>

            {/* Pestaña 4: Reportes de Inventario */}
            <TabsContent value="inventario" className="space-y-4 m-0 focus-visible:outline-none">
              <Card className="border border-border/80 shadow-xs">
                <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Estado y Valorizado de Existencias</h3>
                    <p className="text-xs text-muted-foreground">
                      Resumen del inventario por nivel de stock y rotación de mercadería.
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                    <Link to={APP_ROUTES.INVENTARIO}>
                      <span>Ir a inventario</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
                <CardContent className="p-4 space-y-4">
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 border-b border-border">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold text-foreground">Producto</th>
                          <th className="py-2.5 px-3 font-semibold text-foreground">SKU</th>
                          <th className="py-2.5 px-3 font-semibold text-foreground">Categoría</th>
                          <th className="py-2.5 px-3 font-semibold text-right text-foreground">Stock actual</th>
                          <th className="py-2.5 px-3 font-semibold text-right text-foreground">Stock mínimo</th>
                          <th className="py-2.5 px-3 font-semibold text-right text-foreground">Valorizado costo</th>
                          <th className="py-2.5 px-3 font-semibold text-center text-foreground">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {productosStock.slice(0, 15).map((prod) => (
                          <tr key={prod.id} className="hover:bg-muted/20">
                            <td className="py-2 px-3 font-medium text-foreground">{prod.nombre}</td>
                            <td className="py-2 px-3 font-mono text-muted-foreground">{prod.sku}</td>
                            <td className="py-2 px-3 text-muted-foreground">{prod.categoria}</td>
                            <td className="py-2 px-3 text-right font-mono font-medium">{prod.stock}</td>
                            <td className="py-2 px-3 text-right font-mono text-muted-foreground">{prod.stockMinimo}</td>
                            <td className="py-2 px-3 text-right font-mono font-medium">{formatCurrency(prod.valorizadoCosto)}</td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  prod.estadoNivel === 'SUFICIENTE'
                                    ? 'bg-success-soft text-success-text'
                                    : prod.estadoNivel === 'STOCK_BAJO'
                                    ? 'bg-warning-soft text-warning-text'
                                    : 'bg-danger-soft text-danger-text'
                                }`}
                              >
                                {prod.estadoNivel === 'SUFICIENTE'
                                  ? 'Suficiente'
                                  : prod.estadoNivel === 'STOCK_BAJO'
                                  ? 'Stock Bajo'
                                  : 'Agotado'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pestaña 5: Asistente KIPU'S IA (Solo Dueño/Admin) */}
            {!esAlmacenero && (
              <TabsContent value="ia" className="space-y-4 m-0 focus-visible:outline-none">
                <KipusIaPage embedded={true} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      {/* Modal de Exportación */}
      <ExportarReporteModal
        open={modalExportarOpen}
        onOpenChange={setModalExportarOpen}
        periodoLabel={periodoLabels[periodo]}
      />
    </div>
  );
};

export default ReportesPage;
