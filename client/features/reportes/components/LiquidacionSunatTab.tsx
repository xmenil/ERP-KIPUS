import { AlertTriangle } from "lucide-react";
import type { SeccionReporte } from "../utils/reporteExport";
import { TablaReporte } from "./TablaReporte";
export function LiquidacionSunatTab({ seccion }: { seccion: SeccionReporte }) {
  return (
    <div className="space-y-6">
      <div className="flex gap-3 rounded-md border border-border bg-warning-soft p-4 text-sm text-warning-text">
        <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p>
          Demostración local. Usa el IGV guardado en las ventas y prorratea sus
          devoluciones. Simula compras recibidas al 18%, sin validar
          comprobantes, exoneraciones ni derecho a crédito fiscal. No incluye
          gastos ni notas de venta como crédito. No constituye una declaración
          ni un archivo oficial SUNAT.
        </p>
      </div>
      <TablaReporte {...seccion} />
    </div>
  );
}
