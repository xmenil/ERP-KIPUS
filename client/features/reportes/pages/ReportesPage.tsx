import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/context/AuthContext';
import { isRoleAlmacenero } from '@/features/auth/utils/permissions';
import { PeriodoReporte } from '../types/reportes.types';
import { useReportesData } from '../hooks/useReportesData';
import { ReportesSkeleton } from '../components/ReportesSkeleton';
import { ReporteVentasRentabilidadView } from '../components/ReporteVentasRentabilidadView';
import { ReporteSunatTributarioView } from '../components/ReporteSunatTributarioView';
import { ValorizacionStockView } from '../components/ValorizacionStockView';
import { KipusIaAssistantView } from '../components/KipusIaAssistantView';
import { ExportarReporteModal } from '../components/ExportarReporteModal';
import { RefreshCw, Download, AlertCircle } from 'lucide-react';

type ReportesTab = 'ventas' | 'sunat' | 'valorizacion' | 'ia';

const TAB_TITLES: Record<ReportesTab, string> = {
  ventas: 'Ventas y Rentabilidad',
  sunat: 'Reportes SUNAT (Form. 621)',
  valorizacion: 'Valorización de Stock (ABC)',
  ia: "KIPU'S IA (Predictivo)",
};

export const ReportesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as ReportesTab | null;
  const esAlmacenero = isRoleAlmacenero(user?.rol);

  const activeTab: ReportesTab = (() => {
    if (tabParam && ['ventas', 'sunat', 'valorizacion', 'ia'].includes(tabParam)) {
      return tabParam;
    }
    return esAlmacenero ? 'valorizacion' : 'ventas';
  })();

  const {
    periodo,
    setPeriodo,
    financiero,
    sunat,
    topProductos,
    productosStock,
    loading,
    error,
    fetchData,
    periodoLabel,
  } = useReportesData();

  const [modalExportarOpen, setModalExportarOpen] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader
        title={esAlmacenero ? 'Reportes de Inventario y Stock' : "Reportes e Inteligencia KIPU'S IA"}
        description={
          esAlmacenero
            ? 'Valorización de existencias, rotación de artículos y alertas de inventario.'
            : 'Ventas, rentabilidad comercial, liquidación tributaria SUNAT e inteligencia predictiva.'
        }
        badge={TAB_TITLES[activeTab] || periodoLabel}
      >
        {!esAlmacenero && (
          <div className="w-full sm:w-44">
            <Select value={periodo} onValueChange={(val) => setPeriodo(val as PeriodoReporte)}>
              <SelectTrigger className="h-8 text-xs bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ESTE_MES" className="text-xs">Mes actual</SelectItem>
                <SelectItem value="MES_ANTERIOR" className="text-xs">Mes anterior</SelectItem>
                <SelectItem value="ANIO_ACTUAL" className="text-xs">Año 2026 acumulado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-8 gap-1.5 text-xs font-semibold">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>

        <Button size="sm" onClick={() => setModalExportarOpen(true)} className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-xs">
          <Download className="h-3.5 w-3.5" />
          <span>Exportar</span>
        </Button>
      </PageHeader>

      {error && !loading && (
        <Card className="rounded-lg border-destructive/30 bg-danger-soft p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-danger-text shrink-0" />
            <p className="text-xs text-danger-text font-medium">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="h-8 text-xs">
            Reintentar
          </Button>
        </Card>
      )}

      {loading ? (
        <ReportesSkeleton />
      ) : (
        <div className="pt-0">
          {!esAlmacenero && activeTab === 'ventas' && (
            <ReporteVentasRentabilidadView financiero={financiero} topProductos={topProductos} periodoLabel={periodoLabel} />
          )}

          {!esAlmacenero && activeTab === 'sunat' && (
            <ReporteSunatTributarioView sunat={sunat} periodoLabel={periodoLabel} />
          )}

          {activeTab === 'valorizacion' && (
            <ValorizacionStockView productos={productosStock} loading={loading} />
          )}

          {!esAlmacenero && activeTab === 'ia' && (
            <KipusIaAssistantView embedded={true} />
          )}
        </div>
      )}

      <ExportarReporteModal open={modalExportarOpen} onOpenChange={setModalExportarOpen} periodoLabel={periodoLabel} />
    </div>
  );
};

export default ReportesPage;
