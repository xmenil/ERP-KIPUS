import { describe, it, expect } from 'vitest';
import { pluralizeUnit } from './formatters';
import { erpStore } from '@/services/erp/erpStore';

describe('pluralizeUnit', () => {
  it('pluraliza correctamente GALON', () => {
    expect(pluralizeUnit(1, 'GALON')).toBe('galón');
    expect(pluralizeUnit(2, 'GALON')).toBe('galones');
    expect(pluralizeUnit(0, 'GALON')).toBe('galones');
  });

  it('pluraliza correctamente UNIDAD', () => {
    expect(pluralizeUnit(1, 'UNIDAD')).toBe('unidad');
    expect(pluralizeUnit(5, 'UNIDAD')).toBe('unidades');
    expect(pluralizeUnit(0, 'UNIDAD')).toBe('unidades');
  });

  it('pluraliza correctamente KILO', () => {
    expect(pluralizeUnit(1, 'KILO')).toBe('kilo');
    expect(pluralizeUnit(10, 'KILO')).toBe('kilos');
  });

  it('pluraliza correctamente LITRO', () => {
    expect(pluralizeUnit(1, 'LITRO')).toBe('litro');
    expect(pluralizeUnit(3, 'LITRO')).toBe('litros');
  });

  it('pluraliza correctamente JUEGO', () => {
    expect(pluralizeUnit(1, 'JUEGO')).toBe('juego');
    expect(pluralizeUnit(4, 'JUEGO')).toBe('juegos');
  });

  it('pluraliza correctamente PAQUETE', () => {
    expect(pluralizeUnit(1, 'PAQUETE')).toBe('paquete');
    expect(pluralizeUnit(6, 'PAQUETE')).toBe('paquetes');
  });
});

describe('Validación de SKU único en erpStore', () => {
  it('rechaza la creación de un producto con SKU duplicado (sin distinguir mayúsculas)', () => {
    const existing = erpStore.getProductos()[0];
    expect(existing).toBeDefined();

    expect(() => {
      erpStore.crearProducto({
        sku: existing.sku.toLowerCase(),
        nombre: 'Producto Duplicado',
        categoria: 'Lubricantes',
        precioCompra: 50,
        precioVenta: 80,
        stock: 10,
        stockMinimo: 5,
        unidadMedida: 'UNIDAD',
      });
    }).toThrowError(/ya se encuentra registrado/i);
  });
});
