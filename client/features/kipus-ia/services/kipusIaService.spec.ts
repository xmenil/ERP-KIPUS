import { afterEach, expect, it, vi } from "vitest";
import {
  responderPregunta,
  rangoConsulta,
  stockCritico,
  clientesConSaldo,
  kipusIaService,
  type DatosAsistente,
} from "./kipusIaService";
import { DEFAULT_ESTADO_CAJA, erpStore } from "@/services/erp/erpStore";
import type { Producto } from "@/features/productos/types/productos.types";
import type { Cliente } from "@/features/clientes/types/clientes.types";
import type { Venta, Devolucion } from "@/features/ventas/types/ventas.types";
import { calcularReporte } from "@/features/reportes/services/reportesService";
import { formatMoney } from "@/utils/formatters";

const ahora = new Date("2026-10-21T12:00:00Z");
const producto = (id: string, stock = 5, stockMinimo = 10): Producto => ({
  id,
  sku: id,
  nombre: `Producto ${id}`,
  categoria: "Abarrotes",
  stock,
  stockMinimo,
  activo: true,
  precioCompra: 2,
  precioVenta: 5,
  unidadMedida: "UNIDAD",
});
const cliente = (id: string, saldoPendiente: number): Cliente => ({
  id,
  nombre: id,
  saldoPendiente,
  documentoTipo: "DNI",
  numeroDocumento: "12345678",
  telefono: "",
  correo: "",
  direccion: "",
  totalCompras: 0,
  activo: true,
});
const venta = (
  id: string,
  fecha: string,
  cantidad = 2,
  productoId = "p2",
): Venta => ({
  id,
  fecha,
  estado: "COMPLETADA",
  tipoComprobante: "BOLETA",
  serieCorrelativo: id,
  clienteNombre: "Ana",
  clienteDocumento: "12345678",
  metodoPago: "EFECTIVO",
  subtotal: 10,
  igv: 1.8,
  descuento: 0,
  total: 11.8,
  items: [
    {
      productoId,
      sku: productoId,
      nombre: `Producto ${productoId}`,
      cantidad,
      precioUnitario: 5.9,
      subtotal: 11.8,
    },
  ],
});
const devolver = (
  ventaId: string,
  cantidad: number,
  monto = 5.9,
): Devolucion => ({
  id: "dev",
  ventaId,
  cantidad,
  fecha: "2026-10-21",
  productoId: "p2",
  sku: "p2",
  serieCorrelativo: ventaId,
  productoNombre: "Producto p2",
  montoDevuelto: monto,
  retornaAInventario: true,
  afectaCaja: false,
  usuario: "Ana",
  motivo: "Cambio",
});
function datos(): DatosAsistente {
  return {
    ventas: [venta("v1", "2026-10-21")],
    devoluciones: [],
    gastos: [],
    compras: [],
    productos: [producto("p1"), producto("p2")],
    clientes: [],
    movimientos: [],
    caja: structuredClone(DEFAULT_ESTADO_CAJA),
  };
}
const preguntar = (texto: string, origen = datos()) =>
  responderPregunta(texto, origen, "ESTE_MES", ahora);
afterEach(() => vi.restoreAllMocks());

it("E9-01 mayor saldo se ordena, conserva empates e inactivos y advierte falta de conciliación", () => {
  const d = datos();
  d.clientes = [
    cliente("Ana", 10),
    { ...cliente("Luis", 90), activo: false },
    cliente("Rosa", 90),
  ];
  expect(clientesConSaldo(d.clientes).map((c) => c.nombre)).toEqual([
    "Luis",
    "Rosa",
    "Ana",
  ]);
  const r = preguntar("¿Qué cliente tiene la mayor deuda?", d);
  expect(r.content).toContain("Luis, Rosa");
  expect(r.content).toContain(formatMoney(90));
  expect(r.content).toContain("no están conciliados");
  expect(r.dataPoints[0].label).toContain("(inactivo)");
});
it("E9-02 producto más vendido surge de unidades, no del primer producto del catálogo", () => {
  const r = preguntar("¿Cuál es el producto más vendido del mes?");
  expect(r.content).toContain("Producto p2");
  expect(r.content).not.toContain("Producto p1");
  expect(r.alcance).toContain("oct");
  expect(r.fuente).toContain("Reportes");
});
it("E9-03 ranking descuenta devoluciones y excluye ventas pendientes/anuladas y de otro periodo", () => {
  const d = datos();
  d.ventas.push(
    { ...venta("x", "2026-10-20", 50, "p1"), estado: "ANULADA" },
    { ...venta("y", "2026-10-20", 40, "p1"), estado: "PENDIENTE" },
    venta("z", "2026-09-30", 100, "p1"),
  );
  d.devoluciones = [devolver("v1", 1)];
  const r = preguntar("producto más vendido del mes", d);
  expect(r.content).toContain("con 1 unidades");
  expect(r.dataPoints).toHaveLength(1);
});
it("E9-04 ventas y devoluciones coinciden con Reportes y crédito no se considera cobro", () => {
  const d = datos();
  d.ventas[0].metodoPago = "CREDITO";
  d.devoluciones = [devolver("v1", 1)];
  const fin = calcularReporte(d, rangoConsulta("HOY", ahora)).financiero;
  const r = preguntar("¿Cuánto vendí hoy?", d);
  expect(
    r.dataPoints.find((p) => p.label === "Ventas menos devoluciones").value,
  ).toBe(formatMoney(fin.ventasTotales));
  expect(
    r.dataPoints.find((p) => p.label === "Cobros netos registrados").value,
  ).toBe(formatMoney(0));
  expect(
    r.dataPoints.find((p) => p.label === "Ventas a crédito registradas").value,
  ).toBe(formatMoney(11.8));
});
it("E9-05 respeta hoy/ayer, selector y periodos de cambio de mes/año con extremos inclusivos", () => {
  const d = datos();
  d.ventas.push(venta("ayer", "2026-10-20"));
  const r = responderPregunta("¿Cuánto vendí?", d, "AYER", ahora);
  expect(r.alcance).toContain("20 oct");
  expect(r.dataPoints[0].value).toBe(formatMoney(11.8));
  expect(preguntar("¿Cuánto vendí hoy?", d).dataPoints[0].value).toBe(
    formatMoney(11.8),
  );
  expect(
    rangoConsulta("ULTIMOS_7_DIAS", new Date("2026-01-03T01:00:00Z")),
  ).toMatchObject({ desde: "2025-12-28", hasta: "2026-01-03" });
  expect(rangoConsulta("ULTIMOS_30_DIAS", ahora)).toMatchObject({
    desde: "2026-09-22",
    hasta: "2026-10-21",
  });
});
it("E9-06 fechas no admitidas o ambiguas piden precisión, sin asumir otro periodo", () => {
  for (const texto of [
    "ventas de 2025",
    "ventas de la semana pasada",
    "ventas últimos quince días",
    "ventas hoy y ayer",
    "ventas mañana",
    "ventas del año pasado",
  ])
    expect(preguntar(texto).content).toContain("Precisa un solo periodo");
});
it("E9-07 stock crítico prioriza agotados y luego proporción del mínimo, excluye inactivos", () => {
  const d = datos();
  d.productos = [
    producto("moderado", 5, 10),
    producto("critico", 8, 100),
    producto("agotado", 0),
    { ...producto("inactivo", 0), activo: false },
  ];
  expect(stockCritico(d.productos).map((p) => p.id)).toEqual([
    "agotado",
    "critico",
    "moderado",
  ]);
  const r = preguntar("¿Qué stock debo reponer?", d);
  expect(r.dataPoints[0].label).toContain("agotado");
  expect(r.content).toContain("no se ha generado ninguna orden");
});
it("E9-08 saldo de clientes y stock no simulan históricos aunque el selector sea otro", () => {
  expect(preguntar("stock ayer").content).toContain(
    "No dispongo de una reconstrucción histórica",
  );
  expect(preguntar("deuda del mes anterior").content).toContain(
    "No dispongo de una reconstrucción histórica",
  );
  expect(
    responderPregunta("stock actual", datos(), "MES_ANTERIOR", ahora).alcance,
  ).toContain("Estado actual");
});
it("E9-09 caja cerrada informa último turno e incluye otros ingresos en la explicación", () => {
  const d = datos();
  d.caja.abierta = false;
  const r = preguntar("efectivo de caja", d);
  expect(r.content).toContain("cerrada");
  expect(r.content).toContain("último turno");
  expect(r.content).toContain("otros ingresos");
  expect(
    r.dataPoints.find((p) => p.label === "Efectivo esperado guardado").value,
  ).toBe(formatMoney(d.caja.saldoEfectivoEsperado));
});
it("E9-10 consultas sin datos no inventan productos, deuda ni actividad normal", () => {
  const d = datos();
  d.ventas = [];
  d.productos = [];
  d.clientes = [];
  expect(preguntar("producto más vendido", d).content).toContain(
    "No hay productos",
  );
  expect(preguntar("stock", d).content).toContain("No hay productos activos");
  expect(preguntar("mayor deuda", d).content).toContain("No hay clientes");
  expect(preguntar("¿Cuánto vendí?", d).dataPoints[0].value).toBe(
    formatMoney(0),
  );
});
it("E9-11 desconocidas y predicciones piden una consulta admitida, sin afirmar operación normal", () => {
  expect(preguntar("¿Va a llover?").content).toContain("Haz una consulta");
  expect(preguntar("Pronostica ventas").content).toContain(
    "No realizo predicciones",
  );
  expect(preguntar("ventas y gastos").content).toContain(
    "una consulta a la vez",
  );
});
it("E9-12 ninguna consulta o solicitud de compra cambia datos y solo devuelve enlace al formulario", () => {
  const d = datos();
  const antes = structuredClone(d);
  const r = preguntar("Genera una compra", d);
  expect(r.content).toContain("no ha creado ni cambiado");
  expect(r.enlace.ruta).toBe("/compras");
  preguntar("stock", d);
  preguntar("ventas", d);
  expect(d).toEqual(antes);
});
it("E9-13 consulta gastos por fecha y excluye anulados, con tildes y verbo gasté", () => {
  const d = datos();
  d.gastos = [
    {
      id: "g1",
      fecha: "2026-10-21",
      categoria: "OTROS",
      descripcion: "Pasaje",
      beneficiario: "",
      comprobante: "",
      monto: 15,
      metodoPago: "YAPE",
    },
    {
      id: "g2",
      fecha: "2026-10-21",
      categoria: "OTROS",
      descripcion: "Anulado",
      beneficiario: "",
      comprobante: "",
      monto: 40,
      metodoPago: "YAPE",
      estado: "ANULADO",
    },
  ];
  expect(preguntar("¿Cuánto gasté hoy?", d).dataPoints[0].value).toBe(
    formatMoney(15),
  );
});
it("E9-14 fallos de lectura se rechazan para permitir reintento, sin fabricar respuesta", async () => {
  vi.spyOn(erpStore, "getVentas").mockImplementation(() => {
    throw new Error("Datos ilegibles");
  });
  await expect(kipusIaService.responderConsulta("ventas")).rejects.toThrow(
    "Datos ilegibles",
  );
});
it("E9-15 no tener saldo positivo en fichas no acredita cuentas conciliadas", () => {
  const d = datos();
  d.clientes = [cliente("Ana", 0)];
  const r = preguntar("mayor deuda", d);
  expect(r.content).toContain("No hay saldos positivos");
  expect(r.content).toContain("no son un estado de cuenta conciliado");
});
