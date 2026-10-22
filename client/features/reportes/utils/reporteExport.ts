import type { Reporte, TopProductoReporte } from "../types/reportes.types";

export const NOTAS_REPORTE = [
  "Prototipo local. Moneda: PEN. Fechas de calendario UTC, límites inclusivos.",
  "Ventas completadas menos devoluciones en su fecha. Ventas pendientes y anuladas excluidas; gastos anulados excluidos según su estado actual.",
  "Costo y resultado estimados con precios de compra actuales, sin costo histórico. Los importes financieros incluyen IGV y no representan utilidad contable ni efectivo disponible.",
  "Las devoluciones revierten costo solo si retornan al inventario. Las compras se incluyen al recibirlas; no se descuentan además como costo de venta.",
  "Cobros netos: ingresos menos reembolsos registrados en Caja con origen venta/devolución, en su fecha, incluso reembolsos de ventas anuladas. No se infieren pagos sin movimiento ni saldos de crédito.",
  "Resumen tributario de demostración: IGV de ventas guardado, devoluciones prorrateadas y compras recibidas simuladas al 18%, sin validar tipo de comprobante, exoneración ni derecho a crédito fiscal. Notas de venta y gastos no generan crédito en esta simulación. No es declaración ni archivo oficial SUNAT.",
];
export type OrdenProducto = "IMPORTE" | "UNIDADES";
export function filtrarProductos(
  productos: TopProductoReporte[],
  busqueda: string,
  orden: OrdenProducto,
) {
  const q = busqueda.trim().toLocaleLowerCase("es-PE");
  return productos
    .filter((p) =>
      `${p.nombre} ${p.sku} ${p.categoria || ""}`
        .toLocaleLowerCase("es-PE")
        .includes(q),
    )
    .sort(
      (a, b) =>
        (orden === "UNIDADES"
          ? b.unidadesVendidas - a.unidadesVendidas
          : b.totalRecaudado - a.totalRecaudado) ||
        a.productoId.localeCompare(b.productoId),
    );
}
export interface SeccionReporte {
  titulo: string;
  columnas: string[];
  filas: (string | number | null)[][];
}
export function seccionesReporte(
  reporte: Reporte,
  productos: TopProductoReporte[],
  busqueda: string,
  orden: OrdenProducto,
): SeccionReporte[] {
  return [
    {
      titulo: "Alcance y filtros",
      columnas: ["Dato", "Valor"],
      filas: [
        ["Desde (UTC)", reporte.rango.desde],
        ["Hasta (UTC)", reporte.rango.hasta],
        ["Búsqueda de productos (solo ranking)", busqueda || "Sin filtro"],
        ["Orden de productos", orden],
        ...NOTAS_REPORTE.map((n) => ["Nota", n]),
      ],
    },
    {
      titulo: "Finanzas (PEN)",
      columnas: ["Concepto", "Monto PEN"],
      filas: reporte.financiero.filas.map((f) => [f.concepto, f.monto]),
    },
    {
      titulo: "Detalle mensual (PEN)",
      columnas: [
        "Mes UTC",
        "Ventas menos devoluciones PEN",
        "Costo estimado PEN",
        "Gastos PEN",
        "Resultado estimado PEN",
      ],
      filas: reporte.financiero.desgloseMensual.map((m) => [
        m.periodo,
        m.ingresos,
        m.costos,
        m.gastos,
        m.utilidad,
      ]),
    },
    {
      titulo: "Resumen tributario de demostración (PEN)",
      columnas: ["Concepto", "Monto PEN"],
      filas: reporte.sunat.filas.map((f) => [f.concepto, f.monto]),
    },
    {
      titulo: "Productos (filtro aplicado solo a esta sección)",
      columnas: [
        "Producto",
        "SKU",
        "Categoría",
        "Unidades netas",
        "Importe neto PEN",
        "% ventas netas",
      ],
      filas: productos.map((p) => [
        p.nombre,
        p.sku,
        p.categoria || "",
        p.unidadesVendidas,
        p.totalRecaudado,
        p.porcentajeVenta,
      ]),
    },
    {
      titulo: "Operaciones de respaldo (PEN)",
      columnas: ["Fecha UTC", "Tipo", "Referencia", "Concepto", "Monto PEN"],
      filas: reporte.operaciones.map((o) => [
        o.fecha,
        o.tipo,
        o.referencia,
        o.concepto,
        o.monto,
      ]),
    },
  ];
}
function csvCell(value: string | number | null) {
  if (typeof value === "number") return value.toString();
  let text = value === null ? "No disponible" : value;
  if (/^\s*[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function crearCsvReporte(secciones: SeccionReporte[]) {
  // A fixed-width CSV with section, row kind and six data columns.
  const rows: (string | number | null)[][] = [
    [
      "Sección",
      "Tipo de fila",
      "Dato 1",
      "Dato 2",
      "Dato 3",
      "Dato 4",
      "Dato 5",
      "Dato 6",
    ],
  ];
  for (const s of secciones) {
    rows.push([s.titulo, "Encabezado", ...s.columnas]);
    if (!s.filas.length) rows.push([s.titulo, "Sin datos"]);
    for (const row of s.filas) rows.push([s.titulo, "Dato", ...row]);
  }
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        [...row, ...Array(Math.max(0, 8 - row.length)).fill("")]
          .map(csvCell)
          .join(","),
      )
      .join("\r\n") +
    "\r\n"
  );
}
const html = (value: string | number | null) =>
  String(value ?? "No disponible").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function crearHtmlReporte(secciones: SeccionReporte[], periodo: string) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Reporte KIPU'S ERP</title><style>body{font:14px system-ui;margin:24px;color:#111}table{width:100%;border-collapse:collapse;margin-bottom:24px}th,td{border:1px solid #bbb;padding:8px;text-align:left;overflow-wrap:anywhere}h1{font-size:24px}h2{font-size:18px}tr{break-inside:avoid}thead{display:table-header-group}@page{size:A4 landscape;margin:12mm}</style></head><body><h1>Reporte KIPU'S ERP</h1><p>${html(periodo)} · Demostración local · PEN</p>${secciones.map((s) => `<h2>${html(s.titulo)}</h2><table><thead><tr>${s.columnas.map((c) => `<th scope="col">${html(c)}</th>`).join("")}</tr></thead><tbody>${s.filas.length ? s.filas.map((row) => `<tr>${row.map((value) => `<td>${html(typeof value === "number" ? value.toFixed(2) : value)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${s.columnas.length}">Sin datos</td></tr>`}</tbody></table>`).join("")}</body></html>`;
}
export function descargarCsvReporte(contenido: string, nombre: string) {
  const url = URL.createObjectURL(
    new Blob([contenido], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = nombre;
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
export function imprimirReporte(contenido: string) {
  const ventana = window.open("", "_blank");
  if (!ventana)
    throw new Error(
      "Permite abrir la vista de impresión y vuelve a intentarlo.",
    );
  try {
    ventana.document.open();
    ventana.document.write(contenido);
    ventana.document.close();
    ventana.focus();
    ventana.print();
  } catch (error) {
    ventana.close();
    throw error;
  }
}
