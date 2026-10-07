import React, { useState, useEffect, useCallback } from 'react';
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
import {
  ResumenFinanciero,
  LiquidacionSunat,
  TopProductoReporte,
  PeriodoReporte,
} from '../types/reportes.types';
import { formatMoney } from '@/utils/formatters';

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
} from 'lucide-react';
import { toast } from 'sonner';

export const ReportesPage: React.FC = () => {
  const [periodo, setPeriodo] = useState<PeriodoReporte>('ESTE_MES');
  const [financiero, setFinanciero] = useState<ResumenFinanciero | null>(null);
  const [sunat, setSunat] = useState<LiquidacionSunat | null>(null);
  const [topProductos, setTopProductos] = useState<TopProductoReporte[]>([]);
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
      const [fin, sun, top] = await Promise.all([
        reportesService.getResumenFinanciero(periodo),
        reportesService.getLiquidacionSunat(periodo),
        reportesService.getTopProductos(periodo),
      ]);
      setFinanciero(fin);
      setSunat(sun);
      setTopProductos(top);
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

  return (
    <div className="space-y-6">
      {/* Encabezado con selector de período y acción primaria única */}
      <PageHeader
        title="Reportes gerenciales y tributarios"
        description="Estado de resultados, liquidación mensual de IGV SUNAT y ranking de rotación de mercadería"
        badge={periodoLabels[periodo]}
      >
        {/* Selector de Período */}
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
          {/* Métricas KPI Gerenciales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Ventas netas facturadas"
              value={formatMoney(financiero?.ventasTotales ?? 0)}
              subtitle="Ingresos brutos por comprobantes"
              icon={TrendingUp}
              iconColor="text-primary bg-primary-soft"
            />
            <MetricCard
              title="Costo de compras & gastos"
              value={formatMoney(
                (financiero?.costoVentas ?? 0) + (financiero?.gastosOperativos ?? 0)
              )}
              subtitle="Costo de adquisición + egresos fijos"
              icon={ArrowDownCircle}
              iconColor="text-muted-foreground bg-muted"
            />
            <MetricCard
              title="Utilidad neta estimada"
              value={formatMoney(financiero?.utilidadNeta ?? 0)}
              subtitle={`Margen de ganancia neto: ${financiero?.margenNetoPorcentaje ?? 0}%`}
              icon={PiggyBank}
              iconColor="text-success-text bg-success-soft"
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

          {/* Pestañas de Detalle Gerencial */}
          <Tabs defaultValue="rentabilidad" className="w-full space-y-4">
            <TabsList className="bg-muted/50 p-1 border border-border">
              <TabsTrigger value="rentabilidad" className="text-xs">
                Rentabilidad & P&L
              </TabsTrigger>
              <TabsTrigger value="sunat" className="text-xs">
                Liquidación IGV SUNAT
              </TabsTrigger>
              <TabsTrigger value="top-productos" className="text-xs">
                Ranking de rotación
              </TabsTrigger>
            </TabsList>

            {/* Pestaña 1: Rentabilidad & Estado de Resultados */}
            <TabsContent value="rentabilidad" className="space-y-4">
              <ResumenFinancieroTab
                financiero={financiero}
                periodoLabel={periodoLabels[periodo]}
              />
            </TabsContent>

            {/* Pestaña 2: Liquidación SUNAT */}
            <TabsContent value="sunat" className="space-y-4">
              <LiquidacionSunatTab
                sunat={sunat}
                periodoLabel={periodoLabels[periodo]}
              />
            </TabsContent>

            {/* Pestaña 3: Ranking de Artículos */}
            <TabsContent value="top-productos" className="space-y-4">
              <TopProductosTab
                productos={topProductos}
                periodoLabel={periodoLabels[periodo]}
              />
            </TabsContent>
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
