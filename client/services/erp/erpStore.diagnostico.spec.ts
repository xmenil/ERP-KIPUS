import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NuevoProductoPayload } from '@/features/productos/types/productos.types';

// Regresiones detectadas en fase 1; almacenamiento exclusivo de prueba.
const KEY = 'KIPUS_ERP_STORAGE_V2';
const payload: NuevoProductoPayload = {
  sku: 'DIAG-001', nombre: 'Arroz de diagnóstico', categoria: 'Otros',
  precioCompra: 2, precioVenta: 3, stock: 5, stockMinimo: 1, unidadMedida: 'UNIDAD',
};
let values: Map<string, string>;
let storage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn>; removeItem: ReturnType<typeof vi.fn> };
async function reload() {
  vi.resetModules();
  return import('./erpStore');
}
beforeEach(() => {
  values = new Map();
  storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
    removeItem: vi.fn((key: string) => { values.delete(key); }),
  };
  vi.stubGlobal('window', { addEventListener: vi.fn() });
  vi.stubGlobal('localStorage', storage);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.resetModules(); });

describe('persistencia local del catálogo', () => {
  it('conserva alta y edición al reinicializar el módulo con almacenamiento disponible', async () => {
    let { erpStore } = await reload();
    const product = erpStore.crearProducto(payload);
    erpStore.actualizarProducto(product.id, { nombre: 'Arroz editado', precioVenta: 4 });
    ({ erpStore } = await reload());
    expect(erpStore.getProductos().find(p => p.id === product.id)).toMatchObject({ nombre: 'Arroz editado', precioVenta: 4 });
  });
  it('INC-001: rechaza el alta si falla la escritura, sin modificar memoria ni notificar', async () => {
    const { erpStore, subscribeToErp } = await reload();
    const before = erpStore.getProductos();
    const listener = vi.fn();
    subscribeToErp(listener);
    storage.setItem.mockImplementation(() => { throw new DOMException('Simulado', 'QuotaExceededError'); });
    expect(() => erpStore.crearProducto(payload)).toThrow('No se pudo guardar');
    expect(erpStore.getProductos()).toEqual(before);
    expect(listener).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
    const reloaded = await reload();
    expect(reloaded.erpStore.getProductos()).toEqual(before);
  });
  it('INC-003: conserva un catálogo vacío después de recargar', async () => {
    const { erpStore } = await reload();
    erpStore.getProductos().forEach(p => erpStore.eliminarProducto(p.id));
    expect(JSON.parse(values.get(KEY)!).productos).toEqual([]);
    const reloaded = await reload();
    expect(reloaded.erpStore.getProductos()).toEqual([]);
  });
  it('INC-004: conserva JSON inválido y rechaza guardar encima', async () => {
    values.set(KEY, '{invalido');
    const { erpStore } = await reload();
    expect(console.warn).toHaveBeenCalled();
    expect(() => erpStore.crearProducto(payload)).toThrow('No se pudieron leer');
    expect(values.get(KEY)).toBe('{invalido');
  });
  it('conserva la edición previa si falla guardar y permite reintentar', async () => {
    const { erpStore } = await reload();
    const product = erpStore.crearProducto(payload);
    const stored = values.get(KEY);
    storage.setItem.mockImplementationOnce(() => { throw new Error('Almacenamiento bloqueado'); });
    expect(() => erpStore.actualizarProducto(product.id, { nombre: 'Cambio' })).toThrow();
    expect(erpStore.getProductos().find(p => p.id === product.id)?.nombre).toBe(payload.nombre);
    expect(values.get(KEY)).toBe(stored);
    erpStore.actualizarProducto(product.id, { nombre: 'Cambio' });
    const reloaded = await reload();
    expect(reloaded.erpStore.getProductos().find(p => p.id === product.id)?.nombre).toBe('Cambio');
  });
  it('conserva el catálogo al fallar una baja o cambio de estado', async () => {
    const { erpStore } = await reload();
    const product = erpStore.crearProducto(payload);
    storage.setItem.mockImplementation(() => { throw new Error('Sin espacio'); });
    expect(() => erpStore.eliminarProducto(product.id)).toThrow();
    expect(() => erpStore.toggleEstadoProducto(product.id)).toThrow();
    expect(erpStore.getProductos().find(p => p.id === product.id)).toEqual(product);
  });
  it('el rechazo de un SKU duplicado no cambia el estado persistido', async () => {
    const { erpStore } = await reload();
    erpStore.crearProducto(payload);
    const before = values.get(KEY);
    expect(() => erpStore.crearProducto({ ...payload, sku: ' diag-001 ' })).toThrow();
    expect(values.get(KEY)).toBe(before);
  });
  it('la baja de una suscripción evita notificaciones posteriores', async () => {
    const { erpStore, subscribeToErp } = await reload();
    const listener = vi.fn();
    const unsubscribe = subscribeToErp(listener);
    erpStore.crearProducto(payload);
    unsubscribe();
    erpStore.actualizarProducto(erpStore.getProductos()[0].id, { precioVenta: 5 });
    expect(listener).toHaveBeenCalledTimes(1);
  });
  it('diez recorridos de alta, consulta y edición no acumulan suscriptores', async () => {
    const { erpStore, subscribeToErp } = await reload();
    const previousListeners: ReturnType<typeof vi.fn>[] = [];
    for (let round = 0; round < 10; round++) {
      const listener = vi.fn();
      const unsubscribe = subscribeToErp(listener);
      const product = erpStore.crearProducto({ ...payload, sku: `RECORRIDO-${round}` });
      erpStore.actualizarProducto(product.id, { precioVenta: 4 });
      expect(erpStore.getProductos().find(p => p.id === product.id)?.precioVenta).toBe(4);
      expect(listener).toHaveBeenCalledTimes(2);
      previousListeners.forEach(previous => expect(previous).toHaveBeenCalledTimes(2));
      unsubscribe();
      previousListeners.push(listener);
    }
  });
});
