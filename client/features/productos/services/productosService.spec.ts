import { describe, it, expect, beforeEach } from 'vitest';
import { erpStore } from '@/services/erp/erpStore';
import { productosService } from './productosService';
import { NuevoProductoPayload } from '../types/productos.types';

describe('Productos Service y ERP Store — Flujo de Registro y Actualización', () => {
  beforeEach(() => {
    erpStore.restablecerDatosMinimarket();
  });

  it('permite registrar un producto nuevo con éxito', async () => {
    const payload: NuevoProductoPayload = {
      sku: 'TEST-SKU-999',
      nombre: 'Leche Gloria Evaporada 400g Test',
      categoria: 'Lácteos y Desayuno',
      precioCompra: 3.50,
      precioVenta: 4.50,
      stock: 24,
      stockMinimo: 6,
      unidadMedida: 'LATA',
    };

    const nuevo = await productosService.crearProducto(payload);
    expect(nuevo.id).toBeDefined();
    expect(nuevo.sku).toBe('TEST-SKU-999');
    expect(nuevo.nombre).toBe(payload.nombre);

    const prods = await productosService.getProductos();
    const encontrado = prods.find((p) => p.sku === 'TEST-SKU-999');
    expect(encontrado).toBeDefined();
    expect(encontrado?.stock).toBe(24);
  });

  it('permite actualizar un producto existente por ID', async () => {
    const prods = await productosService.getProductos();
    const primero = prods[0];

    const actualizado = await productosService.actualizarProducto(primero.id, {
      precioVenta: 99.90,
      stock: 50,
    });

    expect(actualizado.id).toBe(primero.id);
    expect(actualizado.precioVenta).toBe(99.90);
    expect(actualizado.stock).toBe(50);
    expect(actualizado.nombre).toBe(primero.nombre); // Mantiene los demás campos
  });

  it('upsertProducto actualiza el producto si el SKU ya existe en lugar de fallar', async () => {
    // Usar un producto existente del catálogo base
    const prods = await productosService.getProductos();
    const existente = prods[0];

    const payload: NuevoProductoPayload = {
      sku: existente.sku, // Mismo SKU
      nombre: 'Arroz Modificado Especial',
      categoria: existente.categoria,
      precioCompra: 4.00,
      precioVenta: 6.00,
      stock: 80,
      stockMinimo: 10,
      unidadMedida: 'BOLSA',
    };

    // Intentar upsert sin pasar ID pero con SKU existente
    const { producto, esNuevo } = await productosService.upsertProducto(payload);
    expect(esNuevo).toBe(false);
    expect(producto.id).toBe(existente.id);
    expect(producto.precioVenta).toBe(6.00);
    expect(producto.stock).toBe(80);
    expect(producto.nombre).toBe('Arroz Modificado Especial');
  });

  it('upsertProducto crea un producto nuevo si el SKU no existe', async () => {
    const payload: NuevoProductoPayload = {
      sku: 'SKU-NUEVO-100%_UNICO',
      nombre: 'Galletas Soda Field Test',
      categoria: 'Snacks y Golosinas',
      precioCompra: 0.80,
      precioVenta: 1.20,
      stock: 50,
      stockMinimo: 10,
      unidadMedida: 'PAQUETE',
    };

    const { producto, esNuevo } = await productosService.upsertProducto(payload);
    expect(esNuevo).toBe(true);
    expect(producto.sku).toBe('SKU-NUEVO-100%_UNICO');

    const todos = await productosService.getProductos();
    expect(todos.some((p) => p.sku === 'SKU-NUEVO-100%_UNICO')).toBe(true);
  });
});
