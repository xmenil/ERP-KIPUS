import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { NuevoProveedorPayload } from "@/features/proveedores/types/proveedores.types";
const KEY = "KIPUS_ERP_STORAGE_V2";
let values: Map<string, string>;
let setItem: ReturnType<typeof vi.fn>;
const draft = (): NuevoProveedorPayload => ({
  ruc: "20987654321",
  razonSocial: "Proveedor E3",
  contacto: "Ana Pérez",
  telefono: "",
  correo: "",
  rubro: "Abarrotes",
  condicionPago: "Contado",
  diasCredito: 0,
  limiteCredito: 0,
});
async function load() {
  vi.resetModules();
  return import("./erpStore");
}
beforeEach(() => {
  values = new Map();
  setItem = vi.fn((key: string, value: string) => {
    values.set(key, value);
  });
  vi.stubGlobal("window", { addEventListener: vi.fn() });
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem,
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetModules();
});

it("un formulario antiguo no registra compras después de desactivar al proveedor", async () => {
  const { erpStore: s } = await load();
  const p = s.crearProveedor(draft());
  s.toggleEstadoProveedor(p.id);
  const before = values.get(KEY);
  expect(() =>
    s.registrarCompra({
      proveedorNombre: p.razonSocial,
      proveedorRuc: p.ruc,
      serieFactura: "E3-INACTIVO",
      total: 2,
      itemsCount: 1,
      metodoPago: "TRANSFERENCIA",
      items: [
        {
          productoId: "prod-1",
          sku: "ARR-COS-01",
          nombre: "Arroz",
          cantidad: 1,
          precioUnitario: 2,
          subtotal: 2,
        },
      ],
    }),
  ).toThrow("inactivo");
  expect(values.get(KEY)).toBe(before);
});
it("no repite códigos de proveedores existentes después de borrar otro registro", async () => {
  const { erpStore: s } = await load();
  const p = s.crearProveedor(draft());
  s.crearProveedor({ ...draft(), ruc: "20123456789" });
  s.eliminarProveedor(p.id);
  s.crearProveedor({ ...draft(), ruc: "20111111111" });
  const codes = s.getProveedores().map((p) => p.codigo);
  expect(new Set(codes).size).toBe(codes.length);
});
it("el servicio no convierte un proveedor ilegible en directorio vacío ni modifica los datos", async () => {
  await load();
  const saved = JSON.parse(values.get(KEY)!);
  saved.proveedores[0].ruc = "ilegible";
  const raw = JSON.stringify(saved);
  values.set(KEY, raw);
  await load();
  const service = (
    await import("@/features/proveedores/services/proveedoresService")
  ).proveedoresService;
  await expect(service.getProveedores()).rejects.toThrow("no se pueden leer");
  expect(values.get(KEY)).toBe(raw);
});
it("normaliza RUC y rechaza duplicados incluidos los inactivos", async () => {
  const { erpStore: s } = await load();
  const p = s.crearProveedor({ ...draft(), ruc: " 20-987 654321 " });
  expect(p.ruc).toBe("20987654321");
  s.toggleEstadoProveedor(p.id);
  const before = values.get(KEY);
  expect(() => s.crearProveedor(draft())).toThrow("RUC");
  expect(values.get(KEY)).toBe(before);
});
it("no permite borrar proveedor referenciado por una compra ni cambiar su RUC", async () => {
  const { erpStore: s } = await load();
  const compra = s.getCompras()[0];
  const p = s.getProveedores().find((p) => p.ruc === compra.proveedorRuc)!;
  expect(p).toBeDefined();
  expect(() => s.eliminarProveedor(p.id)).toThrow();
  expect(() => s.actualizarProveedor(p.id, { ruc: "20987654321" })).toThrow();
  s.actualizarProveedor(p.id, { razonSocial: "Razón social nueva E3" });
  expect(s.getCompras()[0]).toEqual(compra);
});
it.each(["crear", "editar", "estado", "borrar"] as const)(
  "%s conserva memoria/persistencia al fallar y permite reintentar",
  async (operation) => {
    const { erpStore: s, subscribeToErp } = await load();
    const p = s.crearProveedor(draft());
    const before = values.get(KEY);
    const memory = s.getProveedores();
    const listener = vi.fn();
    subscribeToErp(listener);
    const execute = () =>
      operation === "crear"
        ? s.crearProveedor({ ...draft(), ruc: "20123456789" })
        : operation === "editar"
          ? s.actualizarProveedor(p.id, { razonSocial: "Editado E3" })
          : operation === "estado"
            ? s.toggleEstadoProveedor(p.id)
            : s.eliminarProveedor(p.id);
    setItem.mockImplementationOnce(() => {
      throw new Error("Quota E3");
    });
    expect(execute).toThrow();
    expect(values.get(KEY)).toBe(before);
    expect(s.getProveedores()).toEqual(memory);
    expect(listener).not.toHaveBeenCalled();
    execute();
    expect(listener).toHaveBeenCalledTimes(1);
    const after = s.getProveedores();
    expect((await load()).erpStore.getProveedores()).toEqual(after);
  },
);
it.each([
  { ruc: "ABC12345678" },
  { correo: "invalido" },
  { razonSocial: "" },
  { limiteCredito: -1 },
  { diasCredito: NaN },
])("rechaza datos inválidos %j sin efectos", async (change) => {
  const { erpStore: s } = await load();
  const before = values.get(KEY);
  expect(() => s.crearProveedor({ ...draft(), ...change })).toThrow();
  expect(values.get(KEY)).toBe(before);
});
