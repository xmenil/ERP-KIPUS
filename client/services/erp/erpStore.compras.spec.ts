import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { NuevaCompraPayload } from '@/features/compras/types/compras.types';

const KEY = 'KIPUS_ERP_STORAGE_V2';
let values: Map<string, string>;
let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> };

async function load() {
  vi.resetModules();
  return import('./erpStore');
}

beforeEach(() => {
  values = new Map();
  storage = {
    getItem: vi.fn((k: string) => values.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => { values.set(k, v); }),
  };
  vi.stubGlobal('window', { addEventListener: vi.fn() });
  vi.stubGlobal('localStorage', storage);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetModules();
});

const compraBase = (overrides?: Partial<NuevaCompraPayload>): NuevaCompraPayload => ({
  proveedorNombre: 'Alicorp S.A.A.',
  proveedorRuc: '20100055237',
  serieFactura: 'F001-999001',
  metodoPago: 'TRANSFERENCIA',
  total: 38,
  itemsCount: 10,
  items: [
    {
      productoId: 'prod-1',
      sku: 'ARR-COS-01',
      nombre: 'Arroz Costeño Extra 1 kg',
      cantidad: 10,
      precioUnitario: 3.8,
      subtotal: 38,
    },
  ],
  ...overrides,
});

it('E4-01: registrar compra PENDIENTE no incrementa stock ni crea asientos de Kardex', async () => {
  const { erpStore: s } = await load();
  const prodAntes = s.getProductos().find(p => p.id === 'prod-1')!;
  const kardexAntes = s.getKardex().length;

  const compra = s.registrarCompra({
    ...compraBase({ serieFactura: 'F001-PEND-01' }),
    estado: 'PENDIENTE',
  });

  expect(compra.estado).toBe('PENDIENTE');
  const prodDespues = s.getProductos().find(p => p.id === 'prod-1')!;
  expect(prodDespues.stock).toBe(prodAntes.stock);
  expect(s.getKardex().length).toBe(kardexAntes);
});

it('E4-02: recepcionarCompra aplica stock y kardex exactamente una vez', async () => {
  const { erpStore: s } = await load();
  const compra = s.registrarCompra({
    ...compraBase({ serieFactura: 'F001-PEND-02' }),
    estado: 'PENDIENTE',
  });

  const prodAntes = s.getProductos().find(p => p.id === 'prod-1')!;
  const kardexAntes = s.getKardex().length;

  const recibida = s.recepcionarCompra(compra.id);
  expect(recibida.estado).toBe('RECIBIDO');
  expect(recibida.fechaRecepcion).toBeDefined();

  const prodDespues = s.getProductos().find(p => p.id === 'prod-1')!;
  expect(prodDespues.stock).toBe(prodAntes.stock + 10);
  expect(s.getKardex().length).toBe(kardexAntes + 1);

  const asientoKardex = s.getKardex()[0];
  expect(asientoKardex.tipo).toBe('ENTRADA');
  expect(asientoKardex.motivo).toBe('COMPRA');
  expect(asientoKardex.cantidad).toBe(10);
  expect(asientoKardex.stockResultante).toBe(prodDespues.stock);
  expect(asientoKardex.referencia).toContain('F001-PEND-02');

  // Segunda recepción debe fallar y no sumar stock de nuevo
  expect(() => s.recepcionarCompra(compra.id)).toThrow('Esta compra ya fue recibida.');
  expect(s.getProductos().find(p => p.id === 'prod-1')!.stock).toBe(prodDespues.stock);
});

it('E4-03: recepcionarCompra con pago EFECTIVO descuenta caja en el momento de la recepción', async () => {
  const { erpStore: s } = await load();
  const cajaAntes = s.getEstadoCaja().saldoEfectivoEsperado;
  const compra = s.registrarCompra({
    ...compraBase({ serieFactura: 'F001-PEND-03', metodoPago: 'EFECTIVO' }),
    estado: 'PENDIENTE',
  });

  // Al estar pendiente no debe haber descontado caja
  expect(s.getEstadoCaja().saldoEfectivoEsperado).toBe(cajaAntes);

  // Al recepcionar debe descontar caja y registrar movimiento
  s.recepcionarCompra(compra.id);
  expect(s.getEstadoCaja().saldoEfectivoEsperado).toBeCloseTo(cajaAntes - 38);
  const mov = s.getMovimientosCaja().find(m => m.comprobanteRef === 'F001-PEND-03');
  expect(mov).toBeDefined();
  expect(mov?.monto).toBe(38);
  expect(mov?.tipo).toBe('EGRESO');
});

it('E4-04: fallo de persistencia en recepcionarCompra revierte estado, stock, kardex y caja', async () => {
  const { erpStore: s } = await load();
  const compra = s.registrarCompra({
    ...compraBase({ serieFactura: 'F001-PEND-04', metodoPago: 'EFECTIVO' }),
    estado: 'PENDIENTE',
  });

  const snapshot = () => JSON.stringify([s.getProductos(), s.getCompras(), s.getKardex(), s.getEstadoCaja()]);
  const antes = snapshot();

  storage.setItem.mockImplementationOnce(() => { throw new Error('Quota error'); });
  expect(() => s.recepcionarCompra(compra.id)).toThrow('No se pudo guardar');
  expect(snapshot()).toBe(antes);
});

it('E4-05: normalización de comprobante evita duplicados con espacios o diferente mayúscula', async () => {
  const { erpStore: s } = await load();
  // 'F001-008921' ya existe para Alicorp en DEFAULT_COMPRAS
  expect(() => s.registrarCompra(compraBase({ serieFactura: ' f001-008921 ' }))).toThrow('Ese comprobante ya está registrado para el proveedor.');
});

it('E4-06: rechaza compras con proveedor inactivo o comprobante vacío', async () => {
  const { erpStore: s } = await load();
  s.toggleEstadoProveedor('prov-1'); // Desactivar Alicorp
  expect(() => s.registrarCompra(compraBase())).toThrow('El proveedor está inactivo');

  expect(() => s.registrarCompra(compraBase({ serieFactura: '   ' }))).toThrow('Completa el proveedor, RUC de 11 dígitos y comprobante.');
});

it('E4-07: rechaza cantidades contradictorias o subtotales erróneos sin alterar stock ni caja', async () => {
  const { erpStore: s } = await load();
  const snapshot = () => JSON.stringify([s.getProductos(), s.getCompras(), s.getEstadoCaja()]);
  const antes = snapshot();

  // Subtotal no coincide con cant * precio
  expect(() => s.registrarCompra(compraBase({
    items: [{ productoId: 'prod-1', sku: 'ARR', nombre: 'Arr', cantidad: 5, precioUnitario: 3.8, subtotal: 10 }],
    total: 10,
    itemsCount: 5,
  }))).toThrow('Revisa los subtotales');

  // Total no coincide con suma de subtotales
  expect(() => s.registrarCompra(compraBase({
    total: 999,
  }))).toThrow('El total y las cantidades deben coincidir');

  // itemsCount no coincide con suma de cantidades
  expect(() => s.registrarCompra(compraBase({
    itemsCount: 999,
  }))).toThrow('El total y las cantidades deben coincidir');

  expect(snapshot()).toBe(antes);
});

it('E4-08: recepcionar con caja cerrada rechaza si el pago es en efectivo', async () => {
  const { erpStore: s } = await load();
  const compra = s.registrarCompra({
    ...compraBase({ serieFactura: 'F001-PEND-08', metodoPago: 'EFECTIVO' }),
    estado: 'PENDIENTE',
  });

  s.cerrarCaja({ saldoContado: 0, diferencia: 0 });
  expect(() => s.recepcionarCompra(compra.id)).toThrow('Abre la caja');
  expect(s.getCompras().find(c => c.id === compra.id)!.estado).toBe('PENDIENTE');
});

it('E4-09: no recibe ni descuenta compra en efectivo si la caja no tiene saldo suficiente', async () => {
  const { erpStore: s } = await load();
  const compra = s.registrarCompra({
    ...compraBase({
      serieFactura: 'F001-SALDO-01',
      metodoPago: 'EFECTIVO',
      total: 500000,
      itemsCount: 1,
      items: [{ productoId: 'prod-1', sku: 'ARR-COS-01', nombre: 'Arroz Costeño Extra 1 kg', cantidad: 1, precioUnitario: 500000, subtotal: 500000 }],
    }),
    estado: 'PENDIENTE',
  });
  const before = JSON.stringify([s.getProductos(), s.getCompras(), s.getKardex(), s.getMovimientosCaja(), s.getEstadoCaja()]);
  expect(() => s.recepcionarCompra(compra.id)).toThrow(/Saldo de caja insuficiente/);
  expect(JSON.stringify([s.getProductos(), s.getCompras(), s.getKardex(), s.getMovimientosCaja(), s.getEstadoCaja()])).toBe(before);
});

it('E4-10: compra recibida y pagada en efectivo también respeta el saldo disponible', async () => {
  const { erpStore: s } = await load();
  const before = JSON.stringify([s.getProductos(), s.getCompras(), s.getKardex(), s.getMovimientosCaja(), s.getEstadoCaja()]);
  expect(() => s.registrarCompra({
    ...compraBase({
      serieFactura: 'F001-SALDO-02',
      metodoPago: 'EFECTIVO',
      total: 500000,
      itemsCount: 1,
      items: [{ productoId: 'prod-1', sku: 'ARR-COS-01', nombre: 'Arroz Costeño Extra 1 kg', cantidad: 1, precioUnitario: 500000, subtotal: 500000 }],
    }),
    estado: 'RECIBIDO',
  })).toThrow(/Saldo de caja insuficiente/);
  expect(JSON.stringify([s.getProductos(), s.getCompras(), s.getKardex(), s.getMovimientosCaja(), s.getEstadoCaja()])).toBe(before);
});
