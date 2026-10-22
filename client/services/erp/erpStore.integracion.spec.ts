import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  rmdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { NuevaCompraPayload } from "@/features/compras/types/compras.types";
import type { NuevaVentaPayload } from "@/features/ventas/types/ventas.types";

const KEY = "KIPUS_ERP_STORAGE_V2";
let values: Map<string, string>;
let sessionValues: Map<string, string>;
let storage: ReturnType<typeof memoryStorage>;
function memoryStorage(map: Map<string, string>) {
  return {
    getItem: vi.fn((key: string) => map.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      map.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      map.delete(key);
    }),
  };
}
async function load() {
  vi.resetModules();
  const [
    { erpStore, subscribeToErp },
    { configuracionService },
    { reportesService },
    { kipusIaService },
    exports,
    { sugerenciaComprasService },
    { AuthService },
    { usuariosService },
    permissions,
  ] = await Promise.all([
    import("./erpStore"),
    import("@/features/configuracion/services/configuracionService"),
    import("@/features/reportes/services/reportesService"),
    import("@/features/kipus-ia/services/kipusIaService"),
    import("@/features/reportes/utils/reporteExport"),
    import("@/features/compras/services/sugerenciaComprasService"),
    import("@/features/auth/services/authService"),
    import("@/features/usuarios/services/usuariosService"),
    import("@/features/auth/permissions/rolePermissions"),
  ]);
  return {
    s: erpStore,
    subscribeToErp,
    configuracionService,
    reportesService,
    kipusIaService,
    exports,
    sugerenciaComprasService,
    AuthService,
    usuariosService,
    ...permissions,
  };
}
type App = Awaited<ReturnType<typeof load>>;
function proveedor(s: App["s"]) {
  return s.crearProveedor({
    ruc: "20100055237",
    razonSocial: "Distribuidora E10",
    contacto: "Ana Torres",
    telefono: "",
    correo: "",
    rubro: "Abarrotes",
    condicionPago: "Contado",
  });
}
function compra(
  serie: string,
  estado: NuevaCompraPayload["estado"] = "RECIBIDO",
): NuevaCompraPayload {
  return {
    proveedorNombre: "Distribuidora E10",
    proveedorRuc: "20100055237",
    serieFactura: serie,
    metodoPago: "EFECTIVO",
    estado,
    total: 12,
    itemsCount: 6,
    items: [
      {
        productoId: "prod-1",
        sku: "ARR-COS-01",
        nombre: "Arroz",
        cantidad: 6,
        precioUnitario: 2,
        subtotal: 12,
      },
    ],
  };
}
function venta(extra: Partial<NuevaVentaPayload> = {}): NuevaVentaPayload {
  return {
    tipoComprobante: "BOLETA",
    clienteNombre: "Consumidor Final",
    clienteDocumento: "00000000",
    metodoPago: "EFECTIVO",
    items: [
      {
        productoId: "prod-1",
        nombre: "Arroz",
        cantidad: 1,
        precioUnitario: 4.8,
      },
    ],
    ...extra,
  };
}
function snapshot(s: App["s"]) {
  return JSON.stringify([
    s.getProductos(),
    s.getVentas(),
    s.getCompras(),
    s.getGastos(),
    s.getEstadoCaja(),
    s.getMovimientosCaja(),
    s.getKardex(),
    s.getClientes(),
    s.getProveedores(),
  ]);
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-21T15:00:00Z"));
  values = new Map([["E10-otra-clave", "conservar"]]);
  sessionValues = new Map();
  storage = memoryStorage(values);
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("sessionStorage", memoryStorage(sessionValues));
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
  await load();
  // Isolated test fixture; never reads or resets a real browser profile.
  const seed = JSON.parse(values.get(KEY)!);
  for (const key of [
    "ventas",
    "compras",
    "gastos",
    "movimientosKardex",
    "movimientosCaja",
    "clientes",
    "proveedores",
    "pedidos",
    "cotizaciones",
    "devoluciones",
    "ajustesInventario",
    "cierresCaja",
    "auditoriaCaja",
  ])
    seed[key] = [];
  seed.productos = seed.productos
    .slice(0, 2)
    .map((p) => ({ ...p, stock: 100, stockMinimo: 10, activo: true }));
  seed.estadoCaja = {
    ...seed.estadoCaja,
    abierta: true,
    estado: "ABIERTA",
    saldoInicial: 1000,
    saldoEfectivoEsperado: 1000,
    ventasEfectivo: 0,
    otrosIngresosEfectivo: 0,
    egresosEfectivo: 0,
    ventasDigitales: { yape: 0, plin: 0, tarjeta: 0, transferencia: 0 },
    totalVentasDigitales: 0,
    totalVentasGeneral: 0,
  };
  values.set(KEY, JSON.stringify(seed));
});
afterEach(() => {
  expect(values.get("E10-otra-clave")).toBe("conservar");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.resetModules();
});

it("A01/A05: empresa y cliente → venta → cambios de fichas → reinicialización conserva comprobante histórico", async () => {
  let app = await load();
  const config = await app.configuracionService.getConfiguracion();
  config.empresa.razonSocial = "Comercial Peña E10";
  config.empresa.nombreSede = "Local E10";
  await app.configuracionService.guardarConfiguracion(config);
  const cliente = app.s.crearCliente({
    documentoTipo: "DNI",
    numeroDocumento: "12345678",
    nombre: "María Torres",
    telefono: "",
    correo: "",
    direccion: "",
  });
  app = await load();
  expect(
    (await app.configuracionService.getConfiguracion()).empresa.razonSocial,
  ).toBe("Comercial Peña E10");
  const v = app.s.emitirVenta(
    venta({
      clienteNombre: cliente.nombre,
      clienteDocumento: cliente.numeroDocumento,
    }),
  );
  expect(v.emisor.razonSocial).toBe("Comercial Peña E10");
  expect(v.sucursal).toBe("Local E10");
  app.s.actualizarCliente(cliente.id, { nombre: "María Torres Editada" });
  config.empresa.razonSocial = "Otra razón E10";
  await app.configuracionService.guardarConfiguracion(config);
  app = await load();
  const historica = app.s.getVentas().find((x) => x.id === v.id)!;
  expect(historica.clienteNombre).toBe("María Torres");
  expect(historica.emisor.razonSocial).toBe("Comercial Peña E10");
  expect(app.s.getClientes().find((c) => c.id === cliente.id).nombre).toBe(
    "María Torres Editada",
  );
});

it("A02: proveedor nuevo → compra recibida → stock/Kardex/Caja → Reportes sin doble efecto al consultar o reinicializar", async () => {
  let app = await load();
  proveedor(app.s);
  const stock = app.s.getProductos()[0].stock,
    efectivo = app.s.getEstadoCaja().saldoEfectivoEsperado;
  const c = app.s.registrarCompra(compra("F001-E10-A02"));
  expect(app.s.getProductos()[0].stock).toBe(stock + 6);
  expect(app.s.getKardex()).toEqual([
    expect.objectContaining({
      tipo: "ENTRADA",
      cantidad: 6,
      stockResultante: stock + 6,
      referencia: expect.stringContaining(c.serieFactura),
    }),
  ]);
  expect(app.s.getMovimientosCaja()).toHaveLength(1);
  expect(app.s.getMovimientosCaja()[0].monto).toBe(12);
  expect(app.s.getEstadoCaja().saldoEfectivoEsperado).toBe(efectivo - 12);
  expect((await app.reportesService.getReporte()).sunat.comprasConFactura).toBe(
    12,
  );
  expect(() => app.s.registrarCompra(compra("F001-E10-A02"))).toThrow();
  const guardado = snapshot(app.s);
  app = await load();
  await app.reportesService.getReporte();
  await app.kipusIaService.responderConsulta("ventas");
  expect(snapshot(app.s)).toBe(guardado);
});

it("A03/A10: pendiente → consulta → recepción → reinicialización; segundo intento no duplica stock ni caja", async () => {
  let app = await load();
  proveedor(app.s);
  const before = snapshot(app.s);
  const c = app.s.registrarCompra(compra("F001-E10-A03", "PENDIENTE"));
  expect(app.s.getProductos()[0].stock).toBe(100);
  expect(app.s.getKardex()).toHaveLength(0);
  expect(app.s.getEstadoCaja().saldoEfectivoEsperado).toBe(1000);
  expect((await app.reportesService.getReporte()).sunat.comprasConFactura).toBe(
    0,
  );
  app = await load();
  app.s.recepcionarCompra(c.id);
  const recibido = snapshot(app.s);
  expect(() => app.s.recepcionarCompra(c.id)).toThrow();
  expect(snapshot(app.s)).toBe(recibido);
  expect(recibido).not.toBe(before);
  expect(app.s.getKardex()).toHaveLength(1);
  expect(app.s.getMovimientosCaja()).toHaveLength(1);
  app = await load();
  expect(snapshot(app.s)).toBe(recibido);
});

it("A04: gasto efectivo → Caja/Reportes/asistente → reinicialización → anulación sin doble egreso", async () => {
  let app = await load();
  const gasto = app.s.registrarGasto({
    categoria: "LOGISTICA",
    descripcion: "Flete E10",
    beneficiario: "Transportes Peña",
    monto: 18,
    metodoPago: "EFECTIVO",
  });
  expect(app.s.getEstadoCaja().saldoEfectivoEsperado).toBe(982);
  expect(app.s.getMovimientosCaja()).toHaveLength(1);
  const r = await app.reportesService.getReporte();
  expect(r.financiero.gastosOperativos).toBe(18);
  expect(r.financiero.utilidadNeta).toBe(-18);
  const respuesta =
    await app.kipusIaService.responderConsulta("¿Cuánto gasté hoy?");
  expect(respuesta.dataPoints[0].value).toBe("S/ 18.00");
  app = await load();
  expect(
    (await app.reportesService.getReporte()).financiero.gastosOperativos,
  ).toBe(18);
  app.s.anularGasto(gasto.id, "Prueba E10");
  expect(app.s.getEstadoCaja().saldoEfectivoEsperado).toBe(1000);
  expect(
    (await app.reportesService.getReporte()).financiero.gastosOperativos,
  ).toBe(0);
  expect(() => app.s.anularGasto(gasto.id, "Otra vez")).toThrow();
  expect(app.s.getEstadoCaja().saldoEfectivoEsperado).toBe(1000);
});

it("A06/A11: alta/login → rol efectivo y acceso por ruta → logout/reinicio → desactivación sin alterar negocio", async () => {
  let app = await load();
  const before = values.get(KEY);
  const user = await app.usuariosService.crearUsuario({
    nombreCompleto: "Ana Torres E10",
    username: "ana.e10",
    email: "ana.e10@example.pe",
    rol: "CAJERO",
    sucursal: "Central",
    password: "e10clave",
  });
  let auth = new app.AuthService();
  await auth.login({
    identifier: "ANA.E10",
    password: "e10clave",
    recordar: true,
  });
  expect(app.canAccessPath(auth.getCurrentUser().rol, "/ventas")).toBe(true);
  expect(app.canAccessPath(auth.getCurrentUser().rol, "/usuarios")).toBe(false);
  await app.usuariosService.actualizarUsuario(user.id, { rol: "SUPERVISOR" });
  expect(app.canAccessPath(auth.getCurrentUser().rol, "/compras")).toBe(true);
  expect(app.canAccessPath(auth.getCurrentUser().rol, "/caja")).toBe(false);
  auth.logout();
  app = await load();
  auth = new app.AuthService();
  expect(auth.getCurrentUser()).toBeNull();
  await auth.login({
    identifier: "ana.e10",
    password: "e10clave",
    recordar: true,
  });
  await app.usuariosService.actualizarUsuario(user.id, { estado: "INACTIVO" });
  expect(auth.getCurrentUser()).toBeNull();
  await expect(
    auth.login({ identifier: "ana.e10", password: "e10clave" }),
  ).rejects.toThrow("desactivada");
  expect(values.get(KEY)).toBe(before);
});

it("A07: periodo → operaciones reales → CSV escrito/reabierto conserva filas, español, filtros y totales", async () => {
  const app = await load();
  const v = app.s.emitirVenta(
    venta({ clienteNombre: 'María "Peña", E10\nTingo María' }),
  );
  const r = await app.reportesService.getReporte("ESTE_MES");
  expect(r.financiero.ventasTotales).toBe(v.total);
  const previo = await app.reportesService.getReporte("MES_ANTERIOR");
  expect(previo.financiero.ventasTotales).toBe(0);
  expect(previo.productos).toEqual([]);
  const productos = app.exports.filtrarProductos(
    r.productos,
    "Arroz",
    "UNIDADES",
  );
  const secciones = app.exports.seccionesReporte(
    r,
    productos,
    "Arroz",
    "UNIDADES",
  );
  const csv = app.exports.crearCsvReporte(secciones);
  const directorio = mkdtempSync(join(tmpdir(), "kipus-e10-"));
  const archivo = join(directorio, "reporte.csv");
  try {
    writeFileSync(archivo, csv, "utf8");
    const abierto = readFileSync(archivo, "utf8");
    expect(abierto).toBe(csv);
    expect(abierto.charCodeAt(0)).toBe(0xfeff);
    expect(abierto).toContain('"María ""Peña"", E10\nTingo María"');
    expect(abierto).toContain('"Ventas menos devoluciones",4.8');
    expect(abierto).toContain('"Arroz"');
    expect(abierto).toContain(r.rango.desde);
    expect(app.exports.crearHtmlReporte(secciones, r.rango.label)).toContain(
      "4.80",
    );
  } finally {
    unlinkSync(archivo);
    rmdirSync(directorio);
  }
});

it("A08: créditos/clientes → ranking/saldos reales → stock crítico y sugerencia consultados sin escribir", async () => {
  const app = await load();
  const mayor = app.s.crearCliente({
    documentoTipo: "DNI",
    numeroDocumento: "12345678",
    nombre: "María Mayor",
    telefono: "",
    correo: "",
    direccion: "",
  });
  const menor = app.s.crearCliente({
    documentoTipo: "DNI",
    numeroDocumento: "87654321",
    nombre: "Luis Menor",
    telefono: "",
    correo: "",
    direccion: "",
  });
  app.s.emitirVenta(
    venta({
      clienteNombre: mayor.nombre,
      clienteDocumento: mayor.numeroDocumento,
      metodoPago: "CREDITO",
      items: [
        {
          productoId: "prod-2",
          nombre: "Arroz Faraón",
          cantidad: 4,
          precioUnitario: 20,
        },
      ],
    }),
  );
  app.s.emitirVenta(
    venta({
      clienteNombre: menor.nombre,
      clienteDocumento: menor.numeroDocumento,
      metodoPago: "CREDITO",
    }),
  );
  app.s.registrarAjusteInventario({
    productoId: "prod-2",
    nuevoStock: 0,
    motivo: "Conteo E10",
  });
  const before = values.get(KEY);
  const deuda = await app.kipusIaService.responderConsulta("mayor deuda");
  expect(deuda.content).toContain("María Mayor");
  expect(deuda.content).toContain("S/ 80.00");
  const ranking = await app.kipusIaService.responderConsulta(
    "producto más vendido",
  );
  expect(ranking.content).toContain("Arroz Faraón");
  const stock = await app.kipusIaService.responderConsulta("stock actual");
  expect(stock.dataPoints[0].label).toContain("Arroz");
  const sugerencia = app.sugerenciaComprasService.obtenerSugerencias();
  expect(sugerencia.items[0].productoId).toBe("prod-2");
  expect(sugerencia.items[0].unidadesVendidas).toBe(4);
  expect(values.get(KEY)).toBe(before);
  expect(app.s.getCompras()).toHaveLength(0);
});

it("A09: fallo al recibir no publica efectos parciales en inventario/Caja/Reportes; reintento guarda una vez", async () => {
  const app = await load();
  proveedor(app.s);
  const c = app.s.registrarCompra(compra("F001-E10-ERROR", "PENDIENTE"));
  const before = snapshot(app.s),
    raw = values.get(KEY);
  const listener = vi.fn();
  const unsubscribe = app.subscribeToErp(listener);
  storage.setItem.mockImplementationOnce(() => {
    throw new Error("Quota E10");
  });
  expect(() => app.s.recepcionarCompra(c.id)).toThrow("No se pudo guardar");
  expect(snapshot(app.s)).toBe(before);
  expect(values.get(KEY)).toBe(raw);
  expect(listener).not.toHaveBeenCalled();
  expect((await app.reportesService.getReporte()).sunat.comprasConFactura).toBe(
    0,
  );
  app.s.recepcionarCompra(c.id);
  expect(listener).toHaveBeenCalledTimes(1);
  expect(app.s.getKardex()).toHaveLength(1);
  expect(app.s.getMovimientosCaja()).toHaveLength(1);
  unsubscribe();
});

it("A12: vacío se conserva tras reinicio; corrupción impide lectura en consumidores sin sobrescribir datos", async () => {
  let app = await load();
  expect((await app.reportesService.getReporte()).productos).toEqual([]);
  expect(
    (await app.kipusIaService.responderConsulta("mayor deuda")).content,
  ).toContain("No hay clientes");
  const vacio = values.get(KEY);
  app = await load();
  expect(app.s.getVentas()).toEqual([]);
  expect(values.get(KEY)).toBe(vacio);
  const corrupto = "{E10-datos-ilegibles";
  values.set(KEY, corrupto);
  app = await load();
  await expect(app.reportesService.getReporte()).rejects.toThrow(
    "No se pudieron leer",
  );
  await expect(app.kipusIaService.responderConsulta("ventas")).rejects.toThrow(
    "No se pudieron leer",
  );
  expect(() => app.s.emitirVenta(venta())).toThrow("No se pudieron leer");
  expect(values.get(KEY)).toBe(corrupto);
});

it("A15 parcial: diez ciclos servicio → notificación → Reportes/asistente → reinicio sin suscriptores acumulados", async () => {
  let app = await load();
  for (let n = 1; n <= 10; n++) {
    const listener = vi.fn();
    const unsubscribe = app.subscribeToErp(listener);
    app.s.registrarGasto({
      categoria: "OTROS",
      descripcion: `Gasto de ciclo E10 ${n}`,
      monto: 1,
      metodoPago: "EFECTIVO",
    });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    expect(
      (await app.reportesService.getReporte()).financiero.gastosOperativos,
    ).toBe(n);
    expect(
      (await app.kipusIaService.responderConsulta("gastos hoy")).dataPoints[0]
        .value,
    ).toBe(`S/ ${n.toFixed(2)}`);
    app = await load();
    expect(app.s.getEstadoCaja().saldoEfectivoEsperado).toBe(1000 - n);
    expect(app.s.getGastos()).toHaveLength(n);
  }
});
