import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inventarioService } from './inventarioService';
import { apiClient } from '@/services/api/apiClient';
import {
  ItemStockDetalle,
  MovimientoStock,
  AjusteInventario,
  AlmacenResumen,
  NuevoAjustePayload,
} from '../types/inventario.types';

describe('Inventario Service — Integración REST', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtiene las existencias unificadas llamando a GET /inventario/existencias con filtros normalizados', async () => {
    const mockExistencias: ItemStockDetalle[] = [
      {
        id: 'prod-1',
        sku: 'SKU-001',
        nombre: 'Arroz Costeño Extra 1kg',
        categoria: 'Abarrotes',
        stock: 50,
        stockMinimo: 10,
        unidadMedida: 'BOLSA',
        precioCompra: 3.8,
        precioVenta: 4.8,
        ubicacion: 'Estante 1',
        estadoNivel: 'DISPONIBLE',
        valorizadoCosto: 190,
        valorizadoVenta: 240,
        almacen: 'Almacén Principal',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockExistencias);

    const data = await inventarioService.getProductosStock({ categoria: 'Abarrotes', estado: 'DISPONIBLE' });
    expect(getSpy).toHaveBeenCalledWith('/inventario/existencias?categoria=Abarrotes&estado=DISPONIBLE');
    expect(data).toHaveLength(1);
    expect(data[0].stock).toBe(50);
    expect(data[0].valorizadoVenta).toBe(240);
  });

  it('obtiene el historial de kardex llamando a GET /inventario/kardex', async () => {
    const mockKardex: MovimientoStock[] = [
      {
        id: 'k-1',
        fecha: '2026-11-12T10:00:00.000Z',
        productoId: 'prod-1',
        productoNombre: 'Arroz Costeño Extra 1kg',
        sku: 'SKU-001',
        tipo: 'ENTRADA',
        motivo: 'COMPRA',
        cantidad: 50,
        stockResultante: 50,
        referencia: 'Factura F001-100',
        usuario: 'admin',
        almacen: 'Almacén Principal',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockKardex);

    const movimientos = await inventarioService.getMovimientos({ tipo: 'ENTRADA' });
    expect(getSpy).toHaveBeenCalledWith('/inventario/kardex?tipo=ENTRADA');
    expect(movimientos).toHaveLength(1);
    expect(movimientos[0].cantidad).toBe(50);
  });

  it('permite registrar un ajuste de inventario llamando a POST /inventario/ajustes', async () => {
    const payload: NuevoAjustePayload = {
      productoId: 'prod-1',
      nuevoStock: 45,
      motivo: 'Conteo físico',
      observacion: 'Diferencia de 5 unidades por merma',
      almacen: 'alm-1',
    };

    const mockAjuste: AjusteInventario = {
      id: 'aj-1',
      productoId: 'prod-1',
      productoNombre: 'Arroz Costeño Extra 1kg',
      sku: 'SKU-001',
      stockAnterior: 50,
      nuevoStock: 45,
      diferencia: -5,
      motivo: 'Conteo físico',
      observacion: 'Diferencia de 5 unidades por merma',
      fecha: '2026-11-12T11:00:00.000Z',
      usuario: 'admin',
      almacen: 'Almacén Principal',
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockAjuste);

    const ajuste = await inventarioService.registrarAjuste(payload);
    expect(postSpy).toHaveBeenCalledWith('/inventario/ajustes', {
      productoId: 'prod-1',
      nuevoStock: 45,
      motivo: 'Conteo físico',
      observacion: 'Diferencia de 5 unidades por merma',
      almacenId: 'alm-1',
    });
    expect(ajuste.diferencia).toBe(-5);
  });

  it('obtiene los almacenes llamando a GET /almacenes con zonas por defecto', async () => {
    const mockAlmacenes: AlmacenResumen[] = [
      {
        id: 'alm-1',
        nombre: 'Almacén Central',
        direccion: 'Jr. Tito Jaime 450',
        totalProductos: 30,
        stockTotalUnidades: 745,
        responsable: 'Carlos Vega',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockAlmacenes);

    const almacenes = await inventarioService.getAlmacenes();
    expect(getSpy).toHaveBeenCalledWith('/almacenes');
    expect(almacenes).toHaveLength(1);
    expect(almacenes[0].zonas).toBeDefined();
    expect(almacenes[0].zonas?.length).toBeGreaterThan(0);
  });
});

