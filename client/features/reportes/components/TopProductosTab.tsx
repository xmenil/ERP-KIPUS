import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrdenProducto, SeccionReporte } from "../utils/reporteExport";
import { TablaReporte } from "./TablaReporte";
export function TopProductosTab({
  seccion,
  busqueda,
  orden,
  onBusqueda,
  onOrden,
}: {
  seccion: SeccionReporte;
  busqueda: string;
  orden: OrdenProducto;
  onBusqueda: (value: string) => void;
  onOrden: (value: OrdenProducto) => void;
}) {
  return (
    <div className="space-y-4 min-w-0">
      <p className="text-sm text-muted-foreground">
        Importes de venta después de descuentos y devoluciones, incluidos los
        créditos. No equivalen a cobros. Una devolución de una venta anterior
        puede generar unidades e importes negativos.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2 sm:w-80">
          <Label htmlFor="reporte-busqueda">
            Buscar producto, SKU o categoría
          </Label>
          <Input
            id="reporte-busqueda"
            value={busqueda}
            onChange={(e) => onBusqueda(e.target.value)}
            className="h-11 md:h-9 text-base md:text-sm"
          />
        </div>
        <div className="space-y-2 sm:w-56">
          <Label htmlFor="reporte-orden">Ordenar productos</Label>
          <Select
            value={orden}
            onValueChange={(value) => onOrden(value as OrdenProducto)}
          >
            <SelectTrigger id="reporte-orden" className="h-11 md:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IMPORTE">Importe neto</SelectItem>
              <SelectItem value="UNIDADES">Unidades netas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        La búsqueda y el orden se aplican al ranking y a su exportación. Los
        totales financieros conservan todo el periodo.
      </p>
      {busqueda && !seccion.filas.length ? (
        <p role="status" className="py-6 text-sm">
          No hay productos que coincidan con la búsqueda. Borra el texto para
          ver todo el periodo.
        </p>
      ) : (
        <TablaReporte {...seccion} />
      )}
    </div>
  );
}
