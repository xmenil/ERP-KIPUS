import { afterEach, describe, expect, it } from 'vitest';
import { erpStore } from './erpStore';
import { NuevoProductoPayload } from '@/features/productos/types/productos.types';

const creados: string[] = [];
let secuencia = 0;
function crear(codigoBarras?: string) {
  const payload: NuevoProductoPayload = { sku: `TEST-LECTOR-${++secuencia}`, nombre: 'Producto de prueba', categoria: 'Otros', precioCompra: 2, precioVenta: 3, stock: 0, stockMinimo: 1, unidadMedida: 'UNIDAD', codigoBarras };
  const producto = erpStore.crearProducto(payload);
  creados.push(producto.id);
  return producto;
}
afterEach(() => { creados.splice(0).forEach(id => erpStore.eliminarProducto(id)); });

describe('guardado de códigos en el catálogo', () => {
  it('normaliza y evita duplicados incluso en productos inactivos', () => {
    const producto = crear(' 000123 ');
    expect(producto.codigoBarras).toBe('000123');
    erpStore.toggleEstadoProducto(producto.id);
    expect(() => crear('000123')).toThrow();
  });
  it('permite conservar, reemplazar, omitir y quitar código al editar', () => {
    const producto = crear('000123');
    expect(erpStore.actualizarProducto(producto.id, { codigoBarras: '000123' }).codigoBarras).toBe('000123');
    expect(erpStore.actualizarProducto(producto.id, { codigoBarras: ' QR-A ' }).codigoBarras).toBe('QR-A');
    expect(erpStore.actualizarProducto(producto.id, { nombre: 'Otro nombre' }).codigoBarras).toBe('QR-A');
    expect(erpStore.actualizarProducto(producto.id, { codigoBarras: undefined }).codigoBarras).toBeUndefined();
  });
  it('rechaza conflictos al editar sin modificar el producto', () => {
    crear('000123');
    const otro = crear('QR-B');
    expect(() => erpStore.actualizarProducto(otro.id, { codigoBarras: '000123', nombre: 'Cambio inválido' })).toThrow();
    expect(erpStore.getProductos().find(p => p.id === otro.id)?.codigoBarras).toBe('QR-B');
    expect(erpStore.getProductos().find(p => p.id === otro.id)?.nombre).toBe('Producto de prueba');
  });
  it('acepta varios productos sin código con identificadores distintos', () => {
    const uno = crear();
    const dos = crear();
    expect(uno.id).not.toBe(dos.id);
    expect(uno.codigoBarras).toBeUndefined();
    expect(dos.codigoBarras).toBeUndefined();
  });
});
