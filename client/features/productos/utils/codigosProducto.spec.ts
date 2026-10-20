import { describe, expect, it } from 'vitest';
import { normalizarCodigo, buscarProductoPorCodigo, validarCodigoUnico } from './codigosProducto';
import { Producto } from '../types/productos.types';

const productos: Producto[] = [
  { id: 'a', sku: 'SKU-A', nombre: 'Arroz', codigoBarras: '001234', categoria: 'Granos', precioCompra: 3, precioVenta: 4, stock: 5, stockMinimo: 1, unidadMedida: 'UNIDAD', activo: false },
  { id: 'b', sku: 'SKU-B', nombre: 'Azúcar', categoria: 'Granos', precioCompra: 3, precioVenta: 4, stock: 5, stockMinimo: 1, unidadMedida: 'UNIDAD', activo: true },
];

describe('códigos de productos', () => {
  it('preserva ceros, mayúsculas y espacios internos', () => {
    expect(normalizarCodigo('  001234  ')).toBe('001234');
    expect(normalizarCodigo(' Ab C ')).toBe('Ab C');
  });
  it('rechaza controles, varias líneas y códigos excesivos', () => {
    for (const codigo of ['abc\n', 'a\tb', '\u0000abc', 'a'.repeat(257)]) {
      expect(() => normalizarCodigo(codigo)).toThrow();
    }
    expect(normalizarCodigo('a'.repeat(256))).toHaveLength(256);
  });
  it('busca coincidencias exactas incluyendo inactivos, sin recurrir al SKU', () => {
    expect(buscarProductoPorCodigo(productos, ' 001234 ')).toEqual(productos[0]);
    for (const codigo of ['', '1234', '001', 'SKU-B']) expect(buscarProductoPorCodigo(productos, codigo)).toBeUndefined();
  });
  it('reserva los códigos de inactivos y permite conservar el propio', () => {
    expect(() => validarCodigoUnico(productos, '001234', 'b')).toThrow();
    expect(validarCodigoUnico(productos, '001234', 'a')).toBe('001234');
    expect(validarCodigoUnico(productos, '')).toBeUndefined();
  });
});
