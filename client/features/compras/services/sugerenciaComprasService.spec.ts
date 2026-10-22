import { expect, it } from "vitest";
import {
  calcularSugerencias,
  type DatosSugerencias,
} from "./sugerenciaComprasService";
import {
  DEFAULT_PRODUCTOS,
  DEFAULT_PROVEEDORES,
  DEFAULT_VENTAS,
} from "@/services/erp/erpStore";

const ahora = new Date("2026-10-21T12:00:00Z");
function datos(): DatosSugerencias {
  const p = structuredClone(DEFAULT_PRODUCTOS[0]);
  p.stock = 0;
  p.stockMinimo = 5;
  p.activo = true;
  const v = structuredClone(DEFAULT_VENTAS[0]);
  v.fecha = "2026-10-21";
  v.estado = "COMPLETADA";
  v.items = [
    {
      productoId: p.id,
      sku: p.sku,
      nombre: p.nombre,
      cantidad: 10,
      precioUnitario: 5,
      subtotal: 50,
    },
  ];
  return { productos: [p], ventas: [v], proveedores: [], devoluciones: [] };
}
it("E9-16 reposición usa ventana real de 30 días, sin pendientes, anuladas, futuro ni Kardex duplicado", () => {
  const d = datos();
  const v = d.ventas[0];
  d.ventas.push(
    { ...v, id: "pend", estado: "PENDIENTE" },
    { ...v, id: "anul", estado: "ANULADA" },
    { ...v, id: "viejo", fecha: "2026-09-21" },
    { ...v, id: "futuro", fecha: "2026-10-22" },
  );
  const r = calcularSugerencias(d, ahora);
  expect(r).toMatchObject({ desde: "2026-09-22", hasta: "2026-10-21" });
  expect(r.items[0].unidadesVendidas).toBe(10);
  expect(r.items[0].velocidadVentaDiaria).toBeCloseTo(10 / 30);
  expect(r.items[0].cantidadSugerida).toBe(10);
});
it("E9-17 devoluciones reducen unidades sin inventar ritmo mínimo y no se fabrica cantidad ni costo", () => {
  const d = datos();
  const v = d.ventas[0];
  d.productos[0].stockMinimo = 0;
  d.productos[0].precioCompra = 0;
  d.devoluciones = [
    {
      id: "dev",
      ventaId: v.id,
      productoId: d.productos[0].id,
      serieCorrelativo: v.serieCorrelativo,
      fecha: "2026-10-21",
      productoNombre: "",
      sku: "",
      cantidad: 10,
      montoDevuelto: 50,
      retornaAInventario: true,
      afectaCaja: false,
      usuario: "",
      motivo: "",
    },
  ];
  const item = calcularSugerencias(d, ahora).items[0];
  expect(item).toMatchObject({
    unidadesVendidas: 0,
    velocidadVentaDiaria: 0,
    diasCoberturaRestante: null,
    cantidadSugerida: 0,
    precioCompraUnitario: 0,
    seleccionado: false,
  });
});
it("E9-18 no inventa proveedor y solo ofrece el único activo cuando no hay ambigüedad", () => {
  const d = datos();
  expect(calcularSugerencias(d, ahora).items[0].proveedorRuc).toBe("");
  d.proveedores = [
    structuredClone(DEFAULT_PROVEEDORES[0]),
    structuredClone(DEFAULT_PROVEEDORES[1]),
  ];
  d.proveedores.forEach((p) => (p.activo = true));
  expect(calcularSugerencias(d, ahora).items[0].proveedorId).toBeUndefined();
  d.proveedores[1].activo = false;
  expect(calcularSugerencias(d, ahora).items[0].proveedorId).toBe(
    d.proveedores[0].id,
  );
});
it("E9-19 catálogos vacíos e inactivos no generan recomendaciones ni escrituras", () => {
  const d = datos();
  d.productos[0].activo = false;
  const antes = structuredClone(d);
  expect(calcularSugerencias(d, ahora).items).toEqual([]);
  expect(d).toEqual(antes);
  expect(
    calcularSugerencias({ ...d, productos: [] }, ahora).inversionTotalEstimada,
  ).toBe(0);
});
it("E9-20 cobertura se basa en unidades positivas observadas y regla de 15 días se puede reconstruir", () => {
  const d = datos();
  d.productos[0].stock = 6;
  d.productos[0].stockMinimo = 1;
  d.ventas[0].items[0].cantidad = 60;
  const r = calcularSugerencias(d, ahora);
  expect(r.items[0]).toMatchObject({
    motivo: "ALTA_ROTACION",
    diasCoberturaRestante: 3,
    cantidadSugerida: 24,
  });
  expect(r.inversionTotalEstimada).toBe(
    Math.round(24 * d.productos[0].precioCompra * 100) / 100,
  );
});
