import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ventasService } from './ventasService';
import { apiClient } from '@/services/api/apiClient';
import { NuevaVentaPayload, Venta, Pedido, Cotizacion } from '../types/ventas.types';

describe('Ventas Service — Integración REST', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtiene la lista de ventas llamando a GET /ventas con query params normalizados', async () => {
    const mockVentas: Venta[] = [
      {
        id: 'v-1',
        serieCorrelativo: 'B001-000001',
        tipoComprobante: 'BOLETA',
        clienteNombre: 'Cliente General',
        clienteDocumento: '00000000',
        fecha: '2026-11-12T10:00:00.000Z',
        subtotal: 100,
        descuento: 0,
        igv: 18,
        total: 118,
        metodoPago: 'EFECTIVO',
        estado: 'COMPLETADA',
        items: [],
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockVentas);

    const result = await ventasService.getVentas({ tipoComprobante: 'BOLETA', estado: 'COMPLETADA' });
    expect(getSpy).toHaveBeenCalledWith('/ventas?estado=COMPLETADA&tipoComprobante=BOLETA');
    expect(result).toHaveLength(1);
    expect(result[0].serieCorrelativo).toBe('B001-000001');
  });

  it('permite emitir una venta llamando a POST /ventas', async () => {
    const payload: NuevaVentaPayload = {
      tipoComprobante: 'BOLETA',
      clienteNombre: 'Juan Perez',
      clienteDocumento: '71234567',
      metodoPago: 'EFECTIVO',
      montoRecibido: 50,
      vuelto: 10,
      items: [
        {
          productoId: 'prod-1',
          sku: 'SKU-001',
          nombre: 'Arroz Costeño',
          cantidad: 8,
          precioUnitario: 5.0,
        },
      ],
    };

    const mockVenta: Venta = {
      id: 'v-created',
      tipoComprobante: 'BOLETA',
      serieCorrelativo: 'B001-000045',
      clienteNombre: 'Juan Perez',
      clienteDocumento: '71234567',
      fecha: '2026-11-12T11:00:00.000Z',
      metodoPago: 'EFECTIVO',
      estado: 'COMPLETADA',
      subtotal: 33.9,
      descuento: 0,
      igv: 6.1,
      total: 40.0,
      items: [],
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockVenta);

    const venta = await ventasService.crearVenta(payload);
    expect(postSpy).toHaveBeenCalledWith('/ventas', expect.objectContaining({
      tipoComprobante: 'BOLETA',
      clienteNombre: 'Juan Perez',
      clienteDocumento: '71234567',
      metodoPago: 'EFECTIVO',
      montoRecibido: 50,
      vuelto: 10,
      items: [
        {
          productoId: 'prod-1',
          sku: 'SKU-001',
          nombre: 'Arroz Costeño',
          cantidad: 8,
          precioUnitario: 5.0,
          descuentoUnitario: 0,
        },
      ],
    }));
    expect(venta.id).toBe('v-created');
    expect(venta.total).toBe(40.0);
  });

  it('permite anular una venta enviando POST /ventas/:id/anular', async () => {
    const mockAnulada: Venta = {
      id: 'v-1',
      serieCorrelativo: 'B001-000001',
      tipoComprobante: 'BOLETA',
      clienteNombre: 'Cliente General',
      clienteDocumento: '00000000',
      fecha: '2026-11-12T10:00:00.000Z',
      subtotal: 100,
      descuento: 0,
      igv: 18,
      total: 118,
      metodoPago: 'EFECTIVO',
      estado: 'ANULADA',
      items: [],
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockAnulada);

    const res = await ventasService.anularVenta('v-1', 'Error de digitación en cliente');
    expect(postSpy).toHaveBeenCalledWith('/ventas/v-1/anular', {
      motivo: 'Error de digitación en cliente',
    });
    expect(res.estado).toBe('ANULADA');
  });

  it('permite consultar pedidos y cotizaciones', async () => {
    const mockPedidos: Pedido[] = [
      {
        id: 'ped-1',
        codigo: 'PED-001',
        clienteNombre: 'Restaurante Kipus',
        fecha: '2026-11-12',
        estado: 'PENDIENTE',
        total: 250,
        items: [],
        sucursal: 'Sede Central',
      },
    ];

    const mockCotizaciones: Cotizacion[] = [
      {
        id: 'cot-1',
        numero: 'COT-001',
        clienteNombre: 'Hotel Tingo',
        clienteDocumento: '20100000001',
        fecha: '2026-11-12',
        fechaVencimiento: '2026-11-27',
        validezDias: 15,
        subtotal: 423.73,
        igv: 76.27,
        total: 500,
        estado: 'VIGENTE',
        items: [],
        vendedor: 'admin',
      },
    ];

    vi.spyOn(apiClient, 'get')
      .mockResolvedValueOnce(mockPedidos)
      .mockResolvedValueOnce(mockCotizaciones);

    const pedidos = await ventasService.getPedidos('PENDIENTE');
    expect(pedidos).toHaveLength(1);

    const cotizaciones = await ventasService.getCotizaciones();
    expect(cotizaciones).toHaveLength(1);
  });
});

