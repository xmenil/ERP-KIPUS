import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calcularReporte,
  rangoPeriodo,
  reportesService,
  type DatosReporte,
} from "./reportesService";
import type { Venta, Devolucion } from "@/features/ventas/types/ventas.types";
import type { Compra } from "@/features/compras/types/compras.types";
import type { Gasto } from "@/features/gastos/types/gastos.types";
import type { MovimientoCaja } from "@/features/caja/types/caja.types";
import { erpStore } from "@/services/erp/erpStore";

const rango = rangoPeriodo("ESTE_MES", new Date("2026-10-21T10:00:00Z"));
export const ventaPrueba = (overrides: Partial<Venta> = {}): Venta => ({
  id: "v1",
  fecha: "2026-10-01 00:00",
  estado: "COMPLETADA",
  tipoComprobante: "BOLETA",
  serieCorrelativo: "B001-000001",
  clienteNombre: "María Peña",
  clienteDocumento: "12345678",
  metodoPago: "EFECTIVO",
  subtotal: 100,
  igv: 18,
  descuento: 0,
  total: 118,
  items: [
    {
      productoId: "p1",
      sku: "AR-01",
      nombre: "Arroz",
      cantidad: 2,
      precioUnitario: 59,
      subtotal: 118,
    },
  ],
  ...overrides,
});
const devolver = (overrides: Partial<Devolucion> = {}): Devolucion => ({
  id: "d1",
  ventaId: "v1",
  productoId: "p1",
  fecha: "2026-10-21 23:59",
  serieCorrelativo: "B001-000001",
  productoNombre: "Arroz",
  sku: "AR-01",
  cantidad: 1,
  montoDevuelto: 59,
  retornaAInventario: true,
  afectaCaja: true,
  usuario: "Ana",
  motivo: "Cambio",
  ...overrides,
});
const compra = (overrides: Partial<Compra> = {}): Compra => ({
  id: "c1",
  fecha: "2026-09-20",
  fechaRecepcion: "2026-10-02",
  estado: "RECIBIDO",
  proveedorNombre: "Proveedor",
  proveedorRuc: "20123456789",
  serieFactura: "F001-01",
  total: 118,
  itemsCount: 1,
  metodoPago: "EFECTIVO",
  ...overrides,
});
const gasto = (overrides: Partial<Gasto> = {}): Gasto => ({
  id: "g1",
  fecha: "2026-10-10",
  categoria: "OTROS",
  descripcion: "Movilidad",
  beneficiario: "",
  comprobante: "",
  monto: 90,
  metodoPago: "YAPE",
  ...overrides,
});
const movimiento = (
  overrides: Partial<MovimientoCaja> = {},
): MovimientoCaja => ({
  id: "mc1",
  fecha: "2026-10-01",
  hora: "10:00",
  tipo: "INGRESO",
  concepto: "Cobro B001-000001",
  comprobanteRef: "B001-000001",
  metodo: "EFECTIVO",
  monto: 118,
  usuario: "Ana",
  origenTipo: "VENTA",
  ...overrides,
});
export function datosPrueba(): DatosReporte {
  return {
    ventas: [ventaPrueba()],
    devoluciones: [],
    gastos: [],
    compras: [],
    productos: [{ id: "p1", sku: "AR-01", nombre: "Arroz", precioCompra: 20 }],
    movimientos: [],
  };
}
afterEach(() => vi.restoreAllMocks());

describe("E8: periodos reales y reglas operativas", () => {
  it("E8-01 calcula límites inclusivos UTC, cambio de año, febrero bisiesto y acumulado", () => {
    expect(
      rangoPeriodo("MES_ANTERIOR", new Date("2026-01-15T01:00Z")),
    ).toMatchObject({ desde: "2025-12-01", hasta: "2025-12-31" });
    expect(
      rangoPeriodo("MES_ANTERIOR", new Date("2024-03-01T01:00Z")),
    ).toMatchObject({ desde: "2024-02-01", hasta: "2024-02-29" });
    expect(
      rangoPeriodo("ANIO_ACTUAL", new Date("2026-10-21T23:30:00-05:00")),
    ).toMatchObject({ desde: "2026-01-01", hasta: "2026-10-22" });
  });
  it("E8-02 incluye extremos y excluye fechas fuera, futuras, inválidas, pendientes y anuladas", () => {
    const datos = datosPrueba();
    datos.ventas.push(
      ventaPrueba({ id: "fin", fecha: "2026-10-21T23:59:59Z" }),
      ...["2026-09-30", "2026-10-22", "2026-02-30"].map((fecha) =>
        ventaPrueba({ fecha }),
      ),
      ventaPrueba({ estado: "PENDIENTE" }),
      ventaPrueba({ estado: "ANULADA" }),
    );
    const r = calcularReporte(datos, rango);
    expect(r.financiero.ventasTotales).toBe(236);
    expect(r.operaciones).toHaveLength(2);
  });
  it("E8-03 conserva una pérdida y no cuenta gastos anulados ni de otro periodo", () => {
    const datos = datosPrueba();
    datos.gastos = [
      gasto(),
      gasto({ estado: "ANULADO" }),
      gasto({ fecha: "2026-09-30" }),
    ];
    const r = calcularReporte(datos, rango);
    expect(r.financiero).toMatchObject({
      ventasTotales: 118,
      costoVentas: 40,
      gastosOperativos: 90,
      utilidadNeta: -12,
    });
    expect(r.financiero.desgloseMensual).toEqual([
      {
        periodo: "2026-10",
        ingresos: 118,
        costos: 40,
        gastos: 90,
        utilidad: -12,
      },
    ]);
  });
  it("E8-04 vacío no inventa ventas, productos, costos, meses ni crédito fiscal", () => {
    const datos = datosPrueba();
    datos.ventas = [];
    const r = calcularReporte(datos, rango);
    expect(r.financiero).toMatchObject({
      ventasTotales: 0,
      costoVentas: 0,
      utilidadNeta: 0,
      desgloseMensual: [],
    });
    expect(r.productos).toEqual([]);
    expect(r.operaciones).toEqual([]);
    expect(r.sunat.igvPagar).toBe(0);
  });
  it("E8-05 productos eliminados conservan el historial y el resultado queda sin costo disponible", () => {
    const datos = datosPrueba();
    datos.productos = [];
    const r = calcularReporte(datos, rango);
    expect(r.productos[0]).toMatchObject({
      nombre: "Arroz",
      totalRecaudado: 118,
    });
    expect(r.financiero).toMatchObject({
      costoVentas: null,
      utilidadNeta: null,
      itemsSinCosto: 1,
    });
    expect(r.financiero.desgloseMensual[0].utilidad).toBeNull();
  });
  it("E8-06 aplica devolución en su fecha y revierte costo al retornar al inventario", () => {
    const datos = datosPrueba();
    datos.devoluciones = [
      devolver(),
      devolver({ id: "fuera", fecha: "2026-11-01" }),
    ];
    const r = calcularReporte(datos, rango);
    expect(r.financiero).toMatchObject({
      ventasTotales: 59,
      costoVentas: 20,
      utilidadNeta: 39,
    });
    expect(r.productos[0]).toMatchObject({
      unidadesVendidas: 1,
      totalRecaudado: 59,
    });
    expect(r.sunat).toMatchObject({
      ventasConBoleta: 59,
      baseImponibleVentas: 50,
      igvVentasDebito: 9,
    });
    datos.devoluciones[0].retornaAInventario = false;
    expect(calcularReporte(datos, rango).financiero.costoVentas).toBe(40);
  });
  it("E8-07 una devolución de venta anterior reduce el periodo actual y conserva importes negativos", () => {
    const datos = datosPrueba();
    datos.ventas[0].fecha = "2026-09-12";
    datos.devoluciones = [devolver()];
    const r = calcularReporte(datos, rango);
    expect(r.financiero).toMatchObject({
      ventasBrutas: 0,
      ventasTotales: -59,
      costoVentas: -20,
      utilidadNeta: -39,
    });
    expect(r.productos[0].unidadesVendidas).toBe(-1);
  });
  it("E8-08 crédito es venta y no cobro; cobros se reconstruyen de movimientos incluidos los reembolsos", () => {
    const datos = datosPrueba();
    datos.ventas[0].metodoPago = "CREDITO";
    expect(calcularReporte(datos, rango).financiero).toMatchObject({
      ventasCredito: 118,
      cobrosRegistrados: 0,
    });
    datos.movimientos = [
      movimiento(),
      movimiento({ tipo: "EGRESO", origenTipo: "DEVOLUCION", monto: 59 }),
      movimiento({ origenTipo: "APERTURA", monto: 500 }),
      movimiento({ fecha: "2026-09-30" }),
    ];
    expect(calcularReporte(datos, rango).financiero.cobrosRegistrados).toBe(59);
    datos.ventas[0].estado = "ANULADA";
    expect(calcularReporte(datos, rango).financiero).toMatchObject({
      ventasTotales: 0,
      cobrosRegistrados: 59,
    });
  });
  it("E8-09 compras recibidas se incluyen por recepción, sin duplicar costo de ventas ni usar pendientes", () => {
    const datos = datosPrueba();
    datos.compras = [
      compra(),
      compra({ estado: "PENDIENTE" }),
      compra({ estado: "ANULADO" }),
      compra({ fechaRecepcion: "2026-11-01" }),
    ];
    const r = calcularReporte(datos, rango);
    expect(r.sunat).toMatchObject({
      comprasConFactura: 118,
      baseImponibleCompras: 100,
      igvComprasCredito: 18,
      igvPagar: 0,
    });
    expect(r.financiero.costoVentas).toBe(40);
    expect(r.operaciones.filter((o) => o.tipo === "COMPRA")).toHaveLength(1);
  });
  it("E8-10 documentos reales usan su tipo y el IGV guardado; notas de venta no inventan IGV", () => {
    const datos = datosPrueba();
    datos.ventas.push(
      ventaPrueba({
        id: "f1",
        tipoComprobante: "FACTURA",
        total: 59,
        subtotal: 50,
        igv: 9,
      }),
      ventaPrueba({
        id: "nv1",
        tipoComprobante: "NOTA_VENTA",
        total: 30,
        subtotal: 30,
        igv: 0,
      }),
    );
    expect(calcularReporte(datos, rango).sunat).toMatchObject({
      ventasConBoleta: 118,
      ventasConFactura: 59,
      baseImponibleVentas: 150,
      igvVentasDebito: 27,
    });
  });
  it("E8-11 prorratea descuentos y mantiene todo el ranking, sin limitar a diez productos", () => {
    const datos = datosPrueba();
    datos.ventas[0].total = 108;
    datos.ventas[0].descuento = 10;
    expect(calcularReporte(datos, rango).productos[0].totalRecaudado).toBe(108);
    datos.ventas = Array.from({ length: 12 }, (_, n) =>
      ventaPrueba({
        id: `v${n}`,
        items: [
          {
            productoId: `p${n}`,
            nombre: `Producto ${n}`,
            cantidad: 1,
            precioUnitario: 118,
            subtotal: 118,
          },
        ],
      }),
    );
    expect(calcularReporte(datos, rango).productos).toHaveLength(12);
  });
  it("E8-12 no modifica el origen al calcular y lee los getters sin ocultar errores", async () => {
    const datos = datosPrueba();
    const antes = structuredClone(datos);
    calcularReporte(datos, rango);
    expect(datos).toEqual(antes);
    vi.spyOn(erpStore, "getVentas").mockImplementation(() => {
      throw new Error("Datos guardados ilegibles");
    });
    await expect(reportesService.getReporte()).rejects.toThrow(
      "Datos guardados ilegibles",
    );
  });
  it("E8-20 reparte los céntimos del descuento sin discrepancia entre ranking y total de ventas", () => {
    const datos = datosPrueba();
    datos.ventas[0].total = 0.01;
    datos.ventas[0].items = ["a", "b", "c"].map((productoId) => ({
      productoId,
      nombre: productoId,
      cantidad: 1,
      precioUnitario: 1,
      subtotal: 1,
    }));
    const r = calcularReporte(datos, rango);
    expect(r.productos.reduce((sum, p) => sum + p.totalRecaudado, 0)).toBe(
      0.01,
    );
    datos.ventas[0].total = 0.03;
    datos.ventas[0].items = ["a", "b", "c", "d", "e", "f"].map(
      (productoId) => ({
        productoId,
        nombre: productoId,
        cantidad: 1,
        precioUnitario: 1,
        subtotal: 1,
      }),
    );
    const muchos = calcularReporte(datos, rango);
    expect(muchos.productos.every((p) => p.totalRecaudado >= 0)).toBe(true);
    expect(muchos.productos.reduce((sum, p) => sum + p.totalRecaudado, 0)).toBe(
      0.03,
    );
  });
});
