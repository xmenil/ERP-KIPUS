import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productosService } from './productosService';
import { apiClient } from '@/services/api/apiClient';
import { NuevoProductoPayload, Producto } from '../types/productos.types';

describe('Productos Service — Integración REST', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('permite registrar un producto nuevo llamando a POST /productos', async () => {
    const payload: NuevoProductoPayload = {
      sku: 'TEST-SKU-999',
      nombre: 'Leche Gloria Evaporada 400g Test',
      categoria: 'Lácteos y Desayuno',
      precioCompra: 3.5,
      precioVenta: 4.5,
      stock: 24,
      stockMinimo: 6,
      unidadMedida: 'LATA',
    };

    const mockResponse: Producto = {
      ...payload,
      id: 'uuid-prod-999',
      activo: true,
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

    const nuevo = await productosService.crearProducto(payload);
    expect(postSpy).toHaveBeenCalledWith('/productos', payload);
    expect(nuevo.id).toBe('uuid-prod-999');
    expect(nuevo.sku).toBe('TEST-SKU-999');
  });

  it('permite actualizar un producto existente por ID llamando a PUT /productos/:id', async () => {
    const mockActualizado: Producto = {
      id: 'uuid-1',
      sku: 'ARR-COS-01',
      nombre: 'Arroz Costeño Modificado',
      categoria: 'Abarrotes y Granos',
      precioCompra: 4.0,
      precioVenta: 5.5,
      stock: 60,
      stockMinimo: 10,
      unidadMedida: 'BOLSA',
      activo: true,
    };

    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValueOnce(mockActualizado);

    const actualizado = await productosService.actualizarProducto('uuid-1', {
      precioVenta: 5.5,
      stock: 60,
    });

    expect(putSpy).toHaveBeenCalledWith('/productos/uuid-1', {
      precioVenta: 5.5,
      stock: 60,
    });
    expect(actualizado.precioVenta).toBe(5.5);
    expect(actualizado.stock).toBe(60);
  });

  it('upsertProducto llama a POST /productos/upsert con o sin ID', async () => {
    const payload: NuevoProductoPayload = {
      sku: 'ARR-COS-01',
      nombre: 'Arroz Modificado Especial',
      categoria: 'Abarrotes y Granos',
      precioCompra: 4.0,
      precioVenta: 6.0,
      stock: 80,
      stockMinimo: 10,
      unidadMedida: 'BOLSA',
    };

    const mockUpsertRes = {
      producto: {
        ...payload,
        id: 'uuid-1',
        activo: true,
      },
      esNuevo: false,
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockUpsertRes);

    const res = await productosService.upsertProducto(payload, 'uuid-1');
    expect(postSpy).toHaveBeenCalledWith('/productos/upsert?id=uuid-1', payload);
    expect(res.esNuevo).toBe(false);
    expect(res.producto.id).toBe('uuid-1');
  });

  it('permite eliminar un producto llamando a DELETE /productos/:id', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      eliminado: true,
    });

    const res = await productosService.eliminarProducto('uuid-1');
    expect(deleteSpy).toHaveBeenCalledWith('/productos/uuid-1');
    expect(res).toBe(true);
  });

  it('permite alternar el estado del producto llamando a PATCH /productos/:id/estado', async () => {
    const mockToggled: Producto = {
      id: 'uuid-1',
      sku: 'ARR-COS-01',
      nombre: 'Arroz Costeño',
      categoria: 'Abarrotes',
      precioCompra: 3.8,
      precioVenta: 4.8,
      stock: 40,
      stockMinimo: 10,
      unidadMedida: 'BOLSA',
      activo: false,
    };

    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce(mockToggled);

    const res = await productosService.toggleEstadoProducto('uuid-1');
    expect(patchSpy).toHaveBeenCalledWith('/productos/uuid-1/estado');
    expect(res.activo).toBe(false);
  });
});
