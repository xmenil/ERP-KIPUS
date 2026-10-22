import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Reporte } from "../types/reportes.types";
import {
  crearCsvReporte,
  crearHtmlReporte,
  descargarCsvReporte,
  imprimirReporte,
  type SeccionReporte,
} from "../utils/reporteExport";

export function ExportarReporteModal({
  open,
  onOpenChange,
  reporte,
  secciones,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  reporte: Reporte;
  secciones: SeccionReporte[];
}) {
  const ocupado = useRef(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const exportar = (formato: "CSV" | "IMPRIMIR") => {
    if (ocupado.current) return;
    ocupado.current = true;
    setGuardando(true);
    setError("");
    try {
      if (formato === "CSV") {
        descargarCsvReporte(
          crearCsvReporte(secciones),
          `kipus-reporte-${reporte.rango.desde}-${reporte.rango.hasta}.csv`,
        );
        toast.success(
          "Descarga CSV iniciada. Revisa las descargas del navegador.",
        );
      } else imprimirReporte(crearHtmlReporte(secciones, reporte.rango.label));
      onOpenChange(false);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo exportar. Vuelve a intentarlo.",
      );
    } finally {
      ocupado.current = false;
      setGuardando(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!guardando) {
          setError("");
          onOpenChange(value);
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Exportar reporte</DialogTitle>
          <DialogDescription>
            {reporte.rango.label}. Incluye finanzas, detalle mensual,
            demostración tributaria, productos con la búsqueda actual y
            operaciones de respaldo. Se exportan todas las filas, incluidas las
            de otras páginas.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          CSV compatible con hojas de cálculo, en español y soles. Para PDF se
          abrirá la vista imprimible: elige «Guardar como PDF» en tu navegador.
          El contenido tributario es de demostración.
        </p>
        {error && (
          <p role="alert" className="text-sm text-danger-text">
            {error}
          </p>
        )}
        <DialogFooter className="gap-2 sm:flex-wrap">
          <Button
            variant="outline"
            className="h-11 md:h-9"
            onClick={() => onOpenChange(false)}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            className="h-11 md:h-9"
            disabled={guardando}
            onClick={() => exportar("IMPRIMIR")}
          >
            Imprimir / guardar como PDF
          </Button>
          <Button
            className="h-11 md:h-9"
            disabled={guardando}
            onClick={() => exportar("CSV")}
          >
            {guardando ? "Preparando…" : "Descargar CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
