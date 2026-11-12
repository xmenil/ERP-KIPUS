import { describe, it, expect, vi, beforeEach } from 'vitest';
import { comprasService } from './comprasService';
import { apiClient } from '@/services/api/apiClient';
import { Compra, NuevaCompraPayload } from '../types/compras.types';

describe('Compras Service — Integración REST', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtiene la lista de compras llamando a GET /compras con query params normalizados', async () => {
    const mockCompras: Compra[] = [
      {
        id: 'c-1',
        fecha: '2026-11-12T10:00:00.000Z',
        proveedorNombre: 'ALICORP S.A.A.',
        proveedorRuc: '20100055237',
        serieFactura: 'F001-9872',
        total: 76.0,
        estado: 'RECIBIDO',
        metodoPago: 'TRANSFERENCIA',
        itemsCount: 1,
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockCompras);

    const result = await comprasService.getCompras({ estado: 'RECIBIDO' });
    expect(getSpy).toHaveBeenCalledWith('/compras?estado=RECIBIDO');
    expect(result).toHaveLength(1);
    expect(result[0].serieFactura).toBe('F001-9872');
  });

  it('permite registrar una compra llamando a POST /compras', async () => {
    const payload: NuevaCompraPayload = {
      proveedorNombre: 'LECHE GLORIA S.A.',
      proveedorRuc: '20100190797',
      serieFactura: 'F002-1234',
      total: 120.0,
      metodoPago: 'EFECTIVO',
      itemsCount: 2,
      items: [
        {
          productoId: 'prod-uuid-1',
          sku: 'GLO-EVP-01',
          nombre: 'Leche Gloria Evaporada',
          cantidad: 24,
          precioUnitario: 3.5,
          subtotal: 84.0,
        },
      ],
    };

    const mockResponse: Compra = {
      ...payload,
      id: 'c-new',
      fecha: '2026-11-12T11:00:00.000Z',
      estado: 'RECIBIDO',
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

    const res = await comprasService.registrarCompra(payload);
    expect(postSpy).toHaveBeenCalledWith('/compras', payload);
    expect(res.id).toBe('c-new');
    expect(res.total).toBe(120.0);
  });

  it('obtiene sugerencias de compra llamando a GET /compras/sugerencias', async () => {
    const mockSugerencias = {
      items: [],
      totalProductosSugeridos: 0,
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockSugerencias);

    const res = await comprasService.getSugerencias();
    expect(getSpy).toHaveBeenCalledWith('/compras/sugerencias');
    expect(res).toBeDefined();
  });
});

