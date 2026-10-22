import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  CONFIGURACION_KEY,
  DEFAULT_CONFIGURACION,
} from "./configuracionStorage";
import { configuracionService } from "./configuracionService";

let values: Map<string, string>;
let storage: {
  getItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
};
beforeEach(() => {
  values = new Map();
  storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
  vi.stubGlobal("window", {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("localStorage", storage);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it("ausencia inicial ofrece valores de ejemplo sin escribir ni modificar otras claves", async () => {
  expect(await configuracionService.getConfiguracion()).toEqual(
    DEFAULT_CONFIGURACION,
  );
  expect(storage.setItem).not.toHaveBeenCalled();
});
it("guarda datos normalizados y los conserva al reinicializar el servicio", async () => {
  values.set("otra-clave", "conservar");
  const draft = structuredClone(DEFAULT_CONFIGURACION);
  draft.empresa.nombreComercial = "  Bodega E2  ";
  draft.empresa.correo = "";
  await configuracionService.guardarConfiguracion(draft);
  vi.resetModules();
  const service = (await import("./configuracionService")).configuracionService;
  expect((await service.getConfiguracion()).empresa.nombreComercial).toBe(
    "Bodega E2",
  );
  expect(values.get("otra-clave")).toBe("conservar");
});
it("fallo de escritura conserva la configuración vigente, no notifica y permite reintentar", async () => {
  const { subscribeToConfiguracion } = await import("./configuracionStorage");
  const service = (await import("./configuracionService")).configuracionService;
  const saved = await service.guardarConfiguracion(DEFAULT_CONFIGURACION);
  const before = values.get(CONFIGURACION_KEY);
  const listener = vi.fn();
  const unsubscribe = subscribeToConfiguracion(listener);
  const draft = structuredClone(saved);
  draft.empresa.nombreComercial = "Cambio E2";
  storage.setItem.mockImplementationOnce(() => {
    throw new Error("Quota E2");
  });
  await expect(service.guardarConfiguracion(draft)).rejects.toThrow(
    "No se pudo guardar",
  );
  expect(values.get(CONFIGURACION_KEY)).toBe(before);
  expect(await service.getConfiguracion()).toEqual(saved);
  expect(listener).not.toHaveBeenCalled();
  await service.guardarConfiguracion(draft);
  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
});
it.each([
  "{ilegible",
  "null",
  "{}",
  JSON.stringify({ ...DEFAULT_CONFIGURACION, monedaPrincipal: "USD" }),
])("conserva contenido inválido y bloquea sobrescritura: %s", async (raw) => {
  values.set(CONFIGURACION_KEY, raw);
  await expect(configuracionService.getConfiguracion()).rejects.toThrow(
    "no es legible",
  );
  await expect(
    configuracionService.guardarConfiguracion(DEFAULT_CONFIGURACION),
  ).rejects.toThrow("no es legible");
  expect(values.get(CONFIGURACION_KEY)).toBe(raw);
});
it("un error de lectura no se confunde con ausencia inicial", async () => {
  storage.getItem.mockImplementation(() => {
    throw new Error("Blocked");
  });
  await expect(configuracionService.getConfiguracion()).rejects.toThrow(
    "No se pudo leer",
  );
  expect(storage.setItem).not.toHaveBeenCalled();
});
it.each([
  "ruc",
  "correo",
  "razonSocial",
  "direccionFiscal",
  "nombreSede",
] as const)("rechaza %s inválido sin guardar", async (field) => {
  const draft = structuredClone(DEFAULT_CONFIGURACION);
  draft.empresa[field] = field === "correo" ? "sin-arroba" : "";
  await expect(
    configuracionService.guardarConfiguracion(draft),
  ).rejects.toThrow();
  expect(storage.setItem).not.toHaveBeenCalled();
});
it("no permite modificar parámetros sin soporte operativo", async () => {
  for (const change of [
    { tasaIgv: NaN },
    { tasaIgv: 20 },
    { monedaPrincipal: "USD" },
    { permitirVentaSinStock: true },
    {
      series: [{ tipo: "Boleta de Venta", serie: "B001", siguienteNumero: -1 }],
    },
  ]) {
    await expect(
      configuracionService.guardarConfiguracion({
        ...DEFAULT_CONFIGURACION,
        ...change,
      } as typeof DEFAULT_CONFIGURACION),
    ).rejects.toThrow();
  }
  expect(storage.setItem).not.toHaveBeenCalled();
});
it("nuevas ventas conservan emisor histórico y usan el próximo número mostrado", async () => {
  const { erpStore: s } = await import("@/services/erp/erpStore");
  const draft = structuredClone(DEFAULT_CONFIGURACION);
  draft.empresa.razonSocial = "Emisor E2";
  draft.empresa.nombreSede = "Sede E2";
  await configuracionService.guardarConfiguracion(draft);
  const before = s
    .getSeriesComprobantes()
    .find((x) => x.serie === "B001")!.siguienteNumero;
  const sale = s.emitirVenta({
    tipoComprobante: "BOLETA",
    clienteNombre: "E2",
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
  });
  expect(sale.serieCorrelativo).toBe(`B001-${String(before).padStart(6, "0")}`);
  expect(sale.emisor?.razonSocial).toBe("Emisor E2");
  expect(sale.sucursal).toBe("Sede E2");
  draft.empresa.razonSocial = "Otro emisor";
  await configuracionService.guardarConfiguracion(draft);
  vi.resetModules();
  const reloaded = (await import("@/services/erp/erpStore")).erpStore;
  expect(
    reloaded.getVentas().find((v) => v.id === sale.id)?.emisor?.razonSocial,
  ).toBe("Emisor E2");
  expect(
    reloaded.getSeriesComprobantes().find((x) => x.serie === "B001")!
      .siguienteNumero,
  ).toBe(before + 1);
});
it("restablecer el ERP conserva configuración y cuentas, y un fallo revierte los registros", async () => {
  await configuracionService.guardarConfiguracion(DEFAULT_CONFIGURACION);
  values.set("kipus_erp_users_list", '[{"id":"E2-conservar"}]');
  const { erpStore: s } = await import("@/services/erp/erpStore");
  s.registrarOperacionCaja({
    tipo: "INGRESO",
    metodo: "EFECTIVO",
    monto: 2,
    concepto: "E2 antes de restablecer",
  });
  const erpBefore = values.get("KIPUS_ERP_STORAGE_V2");
  const configBefore = values.get(CONFIGURACION_KEY);
  storage.setItem.mockImplementationOnce(() => {
    throw new Error("Quota E2");
  });
  expect(() => s.restablecerDatosMinimarket()).toThrow("No se pudo guardar");
  expect(values.get("KIPUS_ERP_STORAGE_V2")).toBe(erpBefore);
  expect(
    s
      .getMovimientosCaja()
      .some((m) => m.concepto === "E2 antes de restablecer"),
  ).toBe(true);
  s.restablecerDatosMinimarket();
  expect(
    s
      .getMovimientosCaja()
      .some((m) => m.concepto === "E2 antes de restablecer"),
  ).toBe(false);
  expect(values.get(CONFIGURACION_KEY)).toBe(configBefore);
  expect(values.get("kipus_erp_users_list")).toBe('[{"id":"E2-conservar"}]');
});
