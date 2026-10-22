import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { NuevaVentaPayload } from '@/features/ventas/types/ventas.types';

const KEY = 'KIPUS_ERP_STORAGE_V2';
let values: Map<string, string>;
let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> };
const venta = (cantidad = 1): NuevaVentaPayload => ({
  tipoComprobante: 'BOLETA', clienteNombre: 'Prueba E1', clienteDocumento: '00000000',
  metodoPago: 'EFECTIVO', items: [{ productoId: 'prod-1', nombre: 'Arroz', cantidad, precioUnitario: 4.8 }],
});
async function load() { vi.resetModules(); return import('./erpStore'); }
beforeEach(() => {
  values = new Map();
  storage = { getItem: vi.fn((key: string) => values.get(key) ?? null), setItem: vi.fn((key: string, value: string) => { values.set(key, value); }) };
  vi.stubGlobal('window', { addEventListener: vi.fn() });
  vi.stubGlobal('localStorage', storage);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.resetModules(); });

it.each(['venta', 'compra', 'gasto', 'ajuste', 'caja'] as const)('H01: %s revierte todo y permite un reintento tras fallo de escritura', async tipo => {
  const { erpStore: s, subscribeToErp } = await load();
  const before = values.get(KEY);
  const snapshot = () => JSON.stringify([s.getProductos(), s.getVentas(), s.getCompras(), s.getGastos(), s.getKardex(), s.getEstadoCaja(), s.getMovimientosCaja()]);
  const memory = snapshot();
  const listener = vi.fn(); subscribeToErp(listener);
  const operation = () => {
    if (tipo === 'venta') return s.emitirVenta(venta());
    if (tipo === 'compra') return s.registrarCompra({ proveedorNombre: 'Prueba', proveedorRuc: '20100055237', serieFactura: 'E1-001', metodoPago: 'EFECTIVO', total: 2, itemsCount: 1, items: [{ productoId: 'prod-1', sku: 'ARR-COS-01', nombre: 'Arroz', cantidad: 1, precioUnitario: 2, subtotal: 2 }] });
    if (tipo === 'gasto') return s.registrarGasto({ categoria: 'OTROS', descripcion: 'Prueba E1', monto: 2, metodoPago: 'EFECTIVO', beneficiario: 'Prueba', comprobante: '' });
    if (tipo === 'ajuste') return s.registrarAjusteInventario({ productoId: 'prod-1', nuevoStock: 4, motivo: 'Prueba E1' });
    return s.registrarOperacionCaja({ tipo: 'INGRESO', concepto: 'Prueba E1', metodo: 'EFECTIVO', monto: 2 });
  };
  storage.setItem.mockImplementationOnce(() => { throw new Error('Quota E1'); });
  expect(operation).toThrow('No se pudo guardar');
  expect(snapshot()).toBe(memory); expect(values.get(KEY)).toBe(before); expect(listener).not.toHaveBeenCalled();
  operation(); expect(listener).toHaveBeenCalledTimes(1);
  const committed = snapshot(); const reloaded = (await load()).erpStore;
  expect(JSON.stringify([reloaded.getProductos(), reloaded.getVentas(), reloaded.getCompras(), reloaded.getGastos(), reloaded.getKardex(), reloaded.getEstadoCaja(), reloaded.getMovimientosCaja()])).toBe(committed);
});
it.each([0, -1, NaN, Infinity, 46])('H02: rechaza cantidad %s sin efectos', async cantidad => {
  const { erpStore: s } = await load(); const before = values.get(KEY);
  expect(() => s.emitirVenta(venta(cantidad))).toThrow(); expect(values.get(KEY)).toBe(before);
});
it('valida stock acumulado y producto activo/existente', async () => {
  const { erpStore: s } = await load();
  const payload = venta(30); payload.items.push({ ...payload.items[0] });
  expect(() => s.emitirVenta(payload)).toThrow();
  s.toggleEstadoProducto('prod-1'); expect(() => s.emitirVenta(venta())).toThrow();
  payload.items[0].productoId = 'no-existe'; expect(() => s.emitirVenta(payload)).toThrow();
});
it('mixto registra cada componente una vez y crédito no registra cobro', async () => {
  const { erpStore: s } = await load(); const before = s.getEstadoCaja();
  const v = s.emitirVenta({ ...venta(), metodoPago: 'MIXTO', desglosePagoMixto: { efectivo: 2, yape: 2.8 } });
  const movimientos = s.getMovimientosCaja().filter(m => m.comprobanteRef === v.serieCorrelativo);
  expect(movimientos.map(m => [m.metodo, m.monto])).toEqual(expect.arrayContaining([['EFECTIVO', 2], ['YAPE', 2.8]])); expect(movimientos).toHaveLength(2);
  expect(s.getEstadoCaja().saldoEfectivoEsperado - before.saldoEfectivoEsperado).toBeCloseTo(2);
  const digital = s.getEstadoCaja().totalVentasDigitales; const count = s.getMovimientosCaja().length;
  s.emitirVenta({ ...venta(), metodoPago: 'CREDITO' });
  expect(s.getMovimientosCaja()).toHaveLength(count); expect(s.getEstadoCaja().totalVentasDigitales).toBe(digital);
});
it('rechaza caja cerrada y desglose inválido; identificadores rápidos son únicos', async () => {
  const { erpStore: s } = await load();
  expect(() => s.emitirVenta({ ...venta(), metodoPago: 'MIXTO', desglosePagoMixto: { efectivo: -1, yape: 5.8 } })).toThrow();
  const ids = Array.from({ length: 10 }, () => s.emitirVenta(venta()).id); expect(new Set(ids).size).toBe(10);
  s.cerrarCaja({ saldoContado: 0, diferencia: 0 }); expect(() => s.emitirVenta(venta())).toThrow();
});
it('conversión anidada confirma una vez y revierte el pedido ante fallo', async () => {
  const { erpStore: s, subscribeToErp } = await load();
  const p = s.crearPedido({ clienteNombre: 'E1', estado: 'PENDIENTE', total: 4.8, items: [{ ...venta().items[0], subtotal: 4.8 }], sucursal: 'Prueba' });
  const before = values.get(KEY); const listener = vi.fn(); subscribeToErp(listener); storage.setItem.mockClear();
  storage.setItem.mockImplementationOnce(() => { throw new Error('Quota'); });
  expect(() => s.convertirPedidoAVenta(p.id)).toThrow(); expect(values.get(KEY)).toBe(before); expect(s.getPedidos().find(x => x.id === p.id)?.estado).toBe('PENDIENTE');
  storage.setItem.mockClear(); s.convertirPedidoAVenta(p.id); expect(storage.setItem).toHaveBeenCalledTimes(1); expect(listener).toHaveBeenCalledTimes(1);
  expect(() => s.convertirPedidoAVenta(p.id)).toThrow();
});

it.each(['compras', 'ventas', 'gastos', 'movimientosCaja'])('conserva contenido ilegible en %s sin sobrescribir', async key => {
  await load(); const saved = JSON.parse(values.get(KEY)!); saved[key] = 'ilegible'; const raw = JSON.stringify(saved); values.set(KEY, raw);
  const { erpStore: s } = await load(); expect(() => s.emitirVenta(venta())).toThrow('No se pudieron leer'); expect(values.get(KEY)).toBe(raw);
});
it.each([NaN, Infinity, -1, 0])('gasto y caja rechazan importe %s', async monto => {
  const { erpStore: s } = await load(); const before = values.get(KEY);
  expect(() => s.registrarGasto({ categoria: 'OTROS', descripcion: 'E1', beneficiario: 'E1', comprobante: '', metodoPago: 'EFECTIVO', monto })).toThrow();
  expect(() => s.registrarOperacionCaja({ tipo: 'INGRESO', concepto: 'E1', metodo: 'EFECTIVO', monto })).toThrow(); expect(values.get(KEY)).toBe(before);
});
it('una compra sin detalle o con importes contradictorios no usa el primer producto', async () => {
  const { erpStore: s } = await load(); const before = values.get(KEY);
  const payload = { proveedorNombre: 'E1', proveedorRuc: '20100055237', serieFactura: 'E1-002', metodoPago: 'TRANSFERENCIA', total: 2, itemsCount: 1 };
  expect(() => s.registrarCompra(payload)).toThrow();
  expect(() => s.registrarCompra({ ...payload, items: [{ productoId: 'prod-1', sku: 'ARR-COS-01', nombre: 'E1', cantidad: 2, precioUnitario: 2, subtotal: 4 }] })).toThrow(); expect(values.get(KEY)).toBe(before);
});
it('pago digital no modifica efectivo; caja cerrada rechaza compra/gasto/ingreso efectivo', async () => {
  const { erpStore: s } = await load(); const before = s.getEstadoCaja();
  s.emitirVenta({ ...venta(), metodoPago: 'YAPE' }); expect(s.getEstadoCaja().saldoEfectivoEsperado).toBe(before.saldoEfectivoEsperado); expect(s.getEstadoCaja().ventasDigitales.yape - before.ventasDigitales.yape).toBeCloseTo(4.8);
  s.cerrarCaja({ saldoContado: 0, diferencia: 0 });
  expect(() => s.registrarGasto({ categoria: 'OTROS', descripcion: 'E1', beneficiario: 'E1', comprobante: '', metodoPago: 'EFECTIVO', monto: 1 })).toThrow('Abre la caja');
  expect(() => s.registrarOperacionCaja({ tipo: 'INGRESO', concepto: 'E1', metodo: 'EFECTIVO', monto: 1 })).toThrow('Abre la caja');
});
it('el correlativo continúa desde el máximo de su serie y no de la cantidad de ventas', async () => {
  await load(); const saved = JSON.parse(values.get(KEY)!); saved.ventas[0].serieCorrelativo = 'B001-000999'; values.set(KEY, JSON.stringify(saved));
  const { erpStore: s } = await load(); expect(s.emitirVenta(venta()).serieCorrelativo).toBe('B001-001000');
});
it('los getters no permiten modificar registros ni saldos sin guardar', async () => {
  const { erpStore: s } = await load(); const original = s.getProductos()[0].stock; s.getProductos()[0].stock = 9999;
  const digital = s.getEstadoCaja().ventasDigitales.yape; s.getEstadoCaja().ventasDigitales.yape = 9999;
  expect(s.getProductos()[0].stock).toBe(original); expect(s.getEstadoCaja().ventasDigitales.yape).toBe(digital);
});
it.each(['descuento', 'montoRecibido', 'vuelto'] as const)('rechaza %s no finito y conserva todos los registros', async campo => {
  const { erpStore: s } = await load(); const before = values.get(KEY);
  expect(() => s.emitirVenta({ ...venta(), [campo]: NaN })).toThrow(); expect(values.get(KEY)).toBe(before);
});
