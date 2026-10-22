import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SeccionReporte } from "../utils/reporteExport";
import { formatMoney } from "@/utils/formatters";

export function TablaReporte({ titulo, columnas, filas }: SeccionReporte) {
  const [pagina, setPagina] = useState(0);
  useEffect(() => setPagina(0), [filas]);
  const inicio = Math.min(
    pagina * 20,
    Math.max(0, Math.ceil(filas.length / 20) - 1) * 20,
  );
  return (
    <section className="space-y-3 min-w-0" aria-label={titulo}>
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <p className="text-xs text-muted-foreground sm:hidden">
        Desliza la tabla para consultar todas las columnas.
      </p>
      <div
        className="max-h-96 overflow-auto rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&>div]:overflow-visible"
        tabIndex={0}
        role="region"
        aria-label={`Tabla: ${titulo}`}
      >
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              {columnas.map((col, i) => (
                <TableHead
                  key={col}
                  className={
                    filas.some(
                      (row) => typeof row[i] === "number" || row[i] === null,
                    )
                      ? "text-right whitespace-nowrap"
                      : "text-left"
                  }
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.length ? (
              filas.slice(inicio, inicio + 20).map((row, index) => (
                <TableRow key={inicio + index} className="h-11">
                  {row.map((value, i) => (
                    <TableCell
                      key={i}
                      className={
                        typeof value === "number" || value === null
                          ? "py-2 text-right tabular-nums whitespace-nowrap"
                          : "py-2 break-words"
                      }
                    >
                      {value === null
                        ? "No disponible"
                        : typeof value === "number"
                          ? columnas[i]?.includes("PEN")
                            ? formatMoney(value)
                            : value.toLocaleString("es-PE", {
                                maximumFractionDigits: 2,
                              })
                          : value}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnas.length}
                  className="py-8 text-center text-muted-foreground"
                >
                  Sin operaciones en este periodo. Registra operaciones o elige
                  otro periodo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {filas.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            Mostrando {inicio + 1}–{Math.min(inicio + 20, filas.length)} de{" "}
            {filas.length}
          </span>
          {filas.length > 20 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-11 md:h-9"
                disabled={inicio === 0}
                onClick={() => setPagina(Math.max(0, pagina - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                className="h-11 md:h-9"
                disabled={inicio + 20 >= filas.length}
                onClick={() => setPagina(pagina + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
