import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gastosService } from './gastosService';
import { apiClient } from '@/services/api/apiClient';
import { Gasto, NuevoGastoPayload } from '../types/gastos.types';

describe('Gastos Service — Integración REST', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtiene la lista de gastos operativos llamando a GET /gastos con filtros', async () => {
    const mockGastos: Gasto[] = [
      {
        id: 'g-1',
        fecha: '2026-11-12T10:00:00.000Z',
        categoria: 'SERVICIOS_BASICOS',
        descripcion: 'Pago de luz Electrocentro',
        beneficiario: 'Electrocentro S.A.',
        comprobante: 'REC-0982341',
        monto: 185.5,
        metodoPago: 'EFECTIVO',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockGastos);

    const result = await gastosService.getGastos({ categoria: 'SERVICIOS_BASICOS' });
    expect(getSpy).toHaveBeenCalledWith('/gastos?categoria=SERVICIOS_BASICOS');
    expect(result).toHaveLength(1);
    expect(result[0].monto).toBe(185.5);
  });

  it('permite registrar un nuevo gasto operativo enviando POST /gastos', async () => {
    const payload: NuevoGastoPayload = {
      categoria: 'LOGISTICA',
      descripcion: 'Flete de sacos de azúcar desde almacén mayorista',
      beneficiario: 'Transportes Huánuco Express',
      comprobante: 'BOL-1102',
      monto: 45.0,
      metodoPago: 'EFECTIVO',
    };

    const mockResponse: Gasto = {
      ...payload,
      id: 'g-created',
      fecha: '2026-11-12T11:00:00.000Z',
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

    const res = await gastosService.registrarGasto(payload);
    expect(postSpy).toHaveBeenCalledWith('/gastos', payload);
    expect(res.id).toBe('g-created');
    expect(res.monto).toBe(45.0);
  });
});

