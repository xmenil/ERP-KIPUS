import { afterEach, expect, it, vi } from "vitest";
import { calcularReporte, rangoPeriodo } from "../services/reportesService";
import {
  crearCsvReporte,
  crearHtmlReporte,
  descargarCsvReporte,
  filtrarProductos,
  imprimirReporte,
  seccionesReporte,
} from "./reporteExport";
import type { TopProductoReporte } from "../types/reportes.types";

function ejemplo() {
  const reporte = calcularReporte(
    {
      ventas: [],
      gastos: [],
      compras: [],
      productos: [],
      devoluciones: [],
      movimientos: [],
    },
    rangoPeriodo("ESTE_MES", new Date("2026-10-21T12:00:00Z")),
  );
  reporte.productos = [
    {
      productoId: "1",
      nombre: 'Café "Peña", Huánuco\nTingo María',
      sku: "CAF-1",
      unidadesVendidas: 4,
      totalRecaudado: 120,
      porcentajeVenta: 80,
    },
    {
      productoId: "2",
      nombre: "Arroz",
      sku: "ARR-2",
      unidadesVendidas: 8,
      totalRecaudado: 30,
      porcentajeVenta: 20,
    },
  ];
  return reporte;
}
/** Read back exported CSV including escaped quotes and multiline fields. */
function leerCsv(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    value = "",
    quoted = false;
  const text = csv.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && c === ",") {
      row.push(value);
      value = "";
    } else if (!quoted && c === "\r" && text[i + 1] === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      i++;
    } else value += c;
  }
  return rows;
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it("E8-13 archivo releído conserva español, comas, comillas, saltos, periodo y totales de las secciones usadas por pantalla", () => {
  const r = ejemplo();
  const secciones = seccionesReporte(r, r.productos, "", "IMPORTE");
  const csv = crearCsvReporte(secciones);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  const rows = leerCsv(csv);
  expect(rows.every((row) => row.length === 8)).toBe(true);
  expect(rows.some((row) => row.includes(r.productos[0].nombre))).toBe(true);
  expect(rows.some((row) => row.includes(r.rango.desde))).toBe(true);
  for (const fila of r.financiero.filas)
    expect(rows).toContainEqual([
      "Finanzas (PEN)",
      "Dato",
      fila.concepto,
      String(fila.monto),
      "",
      "",
      "",
      "",
    ]);
});
it("E8-14 búsqueda y orden del ranking se conservan en CSV e impresión sin alterar los totales", () => {
  const r = ejemplo();
  expect(filtrarProductos(r.productos, "", "UNIDADES")[0].sku).toBe("ARR-2");
  const seleccion = filtrarProductos(r.productos, "PEÑA", "IMPORTE");
  const secciones = seccionesReporte(r, seleccion, "PEÑA", "IMPORTE");
  const rows = leerCsv(crearCsvReporte(secciones));
  const ranking = rows.filter(
    (row) => row[0].startsWith("Productos") && row[1] === "Dato",
  );
  expect(ranking).toHaveLength(1);
  expect(ranking[0][3]).toBe("CAF-1");
  const html = crearHtmlReporte(secciones, r.rango.label);
  expect(html).toContain("PEÑA");
  expect(html).not.toContain("ARR-2");
  expect(html).toContain("120.00");
  expect(r.financiero.ventasTotales).toBe(0);
});
it("E8-15 preserva números negativos y neutraliza fórmulas y HTML de los textos del usuario", () => {
  const secciones = [
    {
      titulo: "Prueba",
      columnas: ["Texto", "Monto"],
      filas: [
        ["=1+1", -12],
        [" @SUM(1)", null],
        ["<script>alert(1)</script>", 0],
        ["+51999", 2],
      ],
    },
  ];
  const rows = leerCsv(crearCsvReporte(secciones));
  expect(rows[2][2]).toBe("'=1+1");
  expect(rows[2][3]).toBe("-12");
  expect(rows[3][2]).toBe("' @SUM(1)");
  expect(rows[3][3]).toBe("No disponible");
  const html = crearHtmlReporte(secciones, "<img src=x>");
  expect(html).not.toContain("<script>");
  expect(html).not.toContain("<img");
  expect(html).toContain("&lt;script&gt;");
});
it("E8-16 exporta todas las páginas y un vacío explícito sin datos de respaldo inventados", () => {
  const r = ejemplo();
  r.productos = Array.from(
    { length: 43 },
    (_, n): TopProductoReporte => ({
      ...r.productos[0],
      sku: `SKU-${n}`,
      productoId: `${n}`,
    }),
  );
  const rows = leerCsv(
    crearCsvReporte(seccionesReporte(r, r.productos, "", "IMPORTE")),
  );
  expect(
    rows.filter((row) => row[0].startsWith("Productos") && row[1] === "Dato"),
  ).toHaveLength(43);
  expect(
    rows.some(
      (row) => row[0].startsWith("Operaciones") && row[1] === "Sin datos",
    ),
  ).toBe(true);
});
it("E8-17 entrega un Blob CSV al enlace de descarga con extensión real y libera el recurso", () => {
  vi.useFakeTimers();
  const click = vi.fn(),
    remove = vi.fn();
  const link = { href: "", download: "", click, remove };
  const create = vi.fn((_blob: Blob) => "blob:reporte"),
    revoke = vi.fn();
  vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
  vi.stubGlobal("document", {
    createElement: () => link,
    body: { appendChild: vi.fn() },
  });
  descargarCsvReporte(
    '\uFEFF"Concepto","Monto"\r\n"Café",12\r\n',
    "reporte.csv",
  );
  expect(create.mock.calls[0][0]).toBeInstanceOf(Blob);
  expect((create.mock.calls[0][0] as Blob).type).toBe(
    "text/csv;charset=utf-8;",
  );
  expect(link.download).toBe("reporte.csv");
  expect(click).toHaveBeenCalledOnce();
  expect(remove).toHaveBeenCalledOnce();
  vi.runAllTimers();
  expect(revoke).toHaveBeenCalledWith("blob:reporte");
});
it("E8-18 propaga fallo de descarga y bloqueo de impresión, sin anunciar archivos generados", () => {
  vi.stubGlobal("URL", {
    createObjectURL: () => {
      throw new Error("Descarga no disponible");
    },
  });
  expect(() => descargarCsvReporte("csv", "reporte.csv")).toThrow(
    "Descarga no disponible",
  );
  vi.stubGlobal("window", { open: () => null });
  expect(() => imprimirReporte("html")).toThrow("Permite abrir");
});
it("E8-19 la impresión recibe el HTML con los mismos datos y solicita el diálogo de imprimir", () => {
  const write = vi.fn(),
    print = vi.fn();
  vi.stubGlobal("window", {
    open: () => ({
      document: { open: vi.fn(), close: vi.fn(), write },
      focus: vi.fn(),
      print,
    }),
  });
  const r = ejemplo();
  const html = crearHtmlReporte(
    seccionesReporte(r, r.productos, "", "IMPORTE"),
    r.rango.label,
  );
  imprimirReporte(html);
  expect(write).toHaveBeenCalledWith(html);
  expect(print).toHaveBeenCalledOnce();
});
