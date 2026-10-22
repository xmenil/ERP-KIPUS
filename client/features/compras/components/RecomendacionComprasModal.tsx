import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  RecomendacionCompraItem,
  ResumenSugerenciaCompras,
} from "../services/sugerenciaComprasService";
import type { CompraItemDetalle } from "../types/compras.types";
import { formatMoney, formatDate } from "@/utils/formatters";

interface Props {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  sugerencias: ResumenSugerenciaCompras;
  onProcederOrden: (
    items: CompraItemDetalle[],
    proveedor?: { razonSocial: string; ruc: string },
  ) => void;
}
export function RecomendacionComprasModal({
  open,
  onOpenChange,
  sugerencias,
  onProcederOrden,
}: Props) {
  const [items, setItems] = useState<RecomendacionCompraItem[]>([]);
  const [error, setError] = useState("");
  const [pagina, setPagina] = useState(0);
  useEffect(() => {
    if (open) {
      setItems(sugerencias.items);
      setPagina(0);
      setError("");
    }
  }, [open, sugerencias]);
  const seleccionados = items.filter((i) => i.seleccionado);
  const total = seleccionados.reduce(
    (sum, i) => sum + i.cantidadSugerida * i.precioCompraUnitario,
    0,
  );
  const revisar = () => {
    if (
      !seleccionados.length ||
      seleccionados.some(
        (i) => !Number.isInteger(i.cantidadSugerida) || i.cantidadSugerida <= 0,
      )
    ) {
      setError(
        "Selecciona productos y escribe cantidades enteras mayores que cero.",
      );
      return;
    }
    const proveedor = seleccionados.every(
      (i) => i.proveedorId && i.proveedorId === seleccionados[0].proveedorId,
    )
      ? {
          razonSocial: seleccionados[0].proveedorNombre,
          ruc: seleccionados[0].proveedorRuc,
        }
      : undefined;
    onProcederOrden(
      seleccionados.map((i) => ({
        productoId: i.productoId,
        sku: i.sku,
        nombre: i.nombre,
        cantidad: i.cantidadSugerida,
        precioUnitario: i.precioCompraUnitario,
        subtotal:
          Math.round(i.cantidadSugerida * i.precioCompraUnitario * 100) / 100,
      })),
      proveedor,
    );
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar reposición</DialogTitle>
          <DialogDescription>
            Stock actual y ventas netas del{" "}
            {formatDate(`${sugerencias.desde}T00:00:00`)} al{" "}
            {formatDate(`${sugerencias.hasta}T00:00:00`)} (UTC). Es una
            sugerencia local; todavía no hay una compra registrada.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Ventas completadas menos devoluciones, sin duplicar Kardex. Cantidad
          orientativa: reponer hasta el mayor entre dos veces el mínimo y 15
          días al ritmo observado de los últimos 30 días. No es un pronóstico.
          Revisa cantidades, costo y proveedor antes de guardar.
        </p>
        {!items.length ? (
          <p className="py-6 text-sm">
            No hay productos activos que requieran reposición con estas reglas.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {items.slice(pagina * 10, pagina * 10 + 10).map((item) => (
                <li key={item.productoId} className="space-y-3 py-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row">
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={item.seleccionado}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((i) =>
                              i.productoId === item.productoId
                                ? { ...i, seleccionado: e.target.checked }
                                : i,
                            ),
                          )
                        }
                        className="h-5 w-5 accent-primary"
                      />
                      <span>
                        {item.nombre}{" "}
                        <span className="font-mono text-xs text-muted-foreground">
                          {item.sku}
                        </span>
                      </span>
                    </label>
                    <p className="text-sm text-warning-text">
                      {item.motivoEtiqueta}
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    {[
                      [
                        "Stock / mínimo",
                        `${item.stockActual} / ${item.stockMinimo} ${item.unidadMedida.toLowerCase()}`,
                      ],
                      ["Unidades netas, 30 días", `${item.unidadesVendidas}`],
                      [
                        "Cobertura observada",
                        item.diasCoberturaRestante === null
                          ? "Sin ritmo de venta positivo"
                          : `${item.diasCoberturaRestante} días`,
                      ],
                      ["Costo actual", formatMoney(item.precioCompraUnitario)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-muted-foreground">
                          {label}
                        </dt>
                        <dd className="tabular-nums">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div className="space-y-2">
                      <Label htmlFor={`reposicion-${item.productoId}`}>
                        Cantidad a revisar
                      </Label>
                      <Input
                        id={`reposicion-${item.productoId}`}
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={item.cantidadSugerida || ""}
                        onChange={(e) => {
                          const cantidad = Number(e.target.value);
                          setItems((prev) =>
                            prev.map((i) =>
                              i.productoId === item.productoId
                                ? { ...i, cantidadSugerida: cantidad }
                                : i,
                            ),
                          );
                        }}
                        className="h-11 w-40 text-base md:h-9 md:text-sm"
                      />
                      {!item.cantidadSugerida && (
                        <p className="text-xs text-muted-foreground">
                          Sin base para sugerir cantidad. Define el mínimo o
                          escribe una cantidad.
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.proveedorNombre}
                      <br />
                      <span className="tabular-nums">
                        Subtotal:{" "}
                        {formatMoney(
                          item.cantidadSugerida * item.precioCompraUnitario,
                        )}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Mostrando {pagina * 10 + 1}–
                {Math.min(pagina * 10 + 10, items.length)} de {items.length}
              </span>
              {items.length > 10 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="h-11 md:h-9"
                    disabled={!pagina}
                    onClick={() => setPagina(pagina - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 md:h-9"
                    disabled={(pagina + 1) * 10 >= items.length}
                    onClick={() => setPagina(pagina + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-danger-text">
            {error}
          </p>
        )}
        <p className="text-sm tabular-nums">
          {seleccionados.length} productos seleccionados · Estimación:{" "}
          {formatMoney(total)}
        </p>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="h-11 md:h-9"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="h-11 md:h-9"
            disabled={!seleccionados.length}
            onClick={revisar}
          >
            Revisar en formulario de compra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
