import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SummaryStrip } from "@/components/common/SummaryStrip";
import { QueryError } from "@/components/common/QueryError";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useErpQuery } from "@/hooks/useErpQuery";
import { reportesService } from "../services/reportesService";
import type { PeriodoReporte } from "../types/reportes.types";
import { formatMoney } from "@/utils/formatters";
import { ReportesSkeleton } from "../components/ReportesSkeleton";
import { ResumenFinancieroTab } from "../components/ResumenFinancieroTab";
import { LiquidacionSunatTab } from "../components/LiquidacionSunatTab";
import { TopProductosTab } from "../components/TopProductosTab";
import { ExportarReporteModal } from "../components/ExportarReporteModal";
import { TablaReporte } from "../components/TablaReporte";
import {
  filtrarProductos,
  seccionesReporte,
  NOTAS_REPORTE,
  type OrdenProducto,
} from "../utils/reporteExport";

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState<PeriodoReporte>("ESTE_MES");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<OrdenProducto>("IMPORTE");
  const [exportar, setExportar] = useState(false);
  const load = useCallback(
    async () => [await reportesService.getReporte(periodo)],
    [periodo],
  );
  const { data, loading, error, refresh } = useErpQuery(load);
  const reporte = data[0];
  const productos = useMemo(
    () => filtrarProductos(reporte?.productos || [], busqueda, orden),
    [reporte, busqueda, orden],
  );
  const secciones = useMemo(
    () =>
      reporte ? seccionesReporte(reporte, productos, busqueda, orden) : [],
    [reporte, productos, busqueda, orden],
  );
  const fin = reporte?.financiero;
  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        title="Reportes"
        description="Ventas, gastos y cobros del periodo, con sus operaciones de respaldo."
      >
        <Button
          variant="outline"
          className="h-11 md:h-9"
          onClick={() => void refresh()}
          disabled={loading}
        >
          Actualizar
        </Button>
        <Button
          className="h-11 md:h-9"
          onClick={() => setExportar(true)}
          disabled={loading || !!error || !reporte}
        >
          Exportar reporte
        </Button>
      </PageHeader>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-2 sm:w-64">
          <Label htmlFor="reporte-periodo">Periodo</Label>
          <Select
            value={periodo}
            onValueChange={(value) => {
              setExportar(false);
              setPeriodo(value as PeriodoReporte);
            }}
          >
            <SelectTrigger id="reporte-periodo" className="h-11 md:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ESTE_MES">Mes actual, hasta hoy</SelectItem>
              <SelectItem value="MES_ANTERIOR">
                Mes anterior completo
              </SelectItem>
              <SelectItem value="ANIO_ACTUAL">Año actual, hasta hoy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {reporte && !loading && !error && (
          <p className="text-xs text-muted-foreground pb-2" role="status">
            {reporte.rango.label} · Fechas inclusivas · Soles (PEN)
          </p>
        )}
      </div>
      {loading ? (
        <ReportesSkeleton />
      ) : error ? (
        <QueryError message={error} retry={() => void refresh()} />
      ) : reporte && fin ? (
        <>
          <SummaryStrip
            items={[
              {
                label: "Ventas menos devoluciones",
                value: formatMoney(fin.ventasTotales),
                description:
                  "Incluye crédito e IGV; excluye pendientes y anuladas",
              },
              {
                label: "Cobros netos en Caja",
                value: formatMoney(fin.cobrosRegistrados),
                description: "Solo movimientos registrados, menos reembolsos",
              },
              {
                label: "Gastos activos del periodo",
                value: formatMoney(fin.gastosOperativos),
                description: "Todos los medios de pago",
              },
              {
                label: "Resultado estimado con IGV",
                value:
                  fin.utilidadNeta === null
                    ? "No disponible"
                    : formatMoney(fin.utilidadNeta),
                description: "Costos de compra actuales; sin costo histórico",
                tone:
                  fin.utilidadNeta !== null && fin.utilidadNeta < 0
                    ? "danger"
                    : undefined,
              },
            ]}
          />
          <Tabs defaultValue="finanzas" className="space-y-6 min-w-0">
            <TabsList className="grid h-auto w-full grid-cols-3 sm:w-fit">
              <TabsTrigger value="finanzas" className="min-h-11 md:min-h-9">
                Finanzas
              </TabsTrigger>
              <TabsTrigger value="productos" className="min-h-11 md:min-h-9">
                Productos
              </TabsTrigger>
              <TabsTrigger
                value="tributario"
                className="min-h-11 whitespace-normal md:min-h-9"
              >
                Tributario demo
              </TabsTrigger>
            </TabsList>
            <TabsContent value="finanzas">
              <ResumenFinancieroTab
                financiero={fin}
                periodoLabel={reporte.rango.label}
                secciones={secciones}
              />
            </TabsContent>
            <TabsContent value="productos">
              <TopProductosTab
                seccion={secciones[4]}
                busqueda={busqueda}
                orden={orden}
                onBusqueda={setBusqueda}
                onOrden={setOrden}
              />
            </TabsContent>
            <TabsContent value="tributario">
              <LiquidacionSunatTab seccion={secciones[3]} />
            </TabsContent>
          </Tabs>
          <details className="rounded-md border border-border p-4">
            <summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Operaciones de respaldo ({reporte.operaciones.length})
            </summary>
            <div className="mt-4">
              <p className="mb-4 text-sm text-muted-foreground">
                Los cobros son movimientos de dinero y se muestran separados de
                las ventas. No sumes todas las clases como un único total.
              </p>
              <TablaReporte {...secciones[5]} />
            </div>
          </details>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Cómo se calcula este reporte
            </summary>
            <ul className="mt-3 space-y-2 list-disc pl-5 text-muted-foreground">
              {NOTAS_REPORTE.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </details>
          <ExportarReporteModal
            open={exportar}
            onOpenChange={setExportar}
            reporte={reporte}
            secciones={secciones}
          />
        </>
      ) : null}
    </div>
  );
}
