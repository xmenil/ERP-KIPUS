import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cajaService } from './cajaService';
import { apiClient } from '@/services/api/apiClient';
import { EstadoCaja, MovimientoCaja, AperturaCajaPayload } from '../types/caja.types';

describe('Caja Service — Integración REST', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtiene el estado de la caja activa llamando a GET /caja/estado', async () => {
    const mockEstado: EstadoCaja = {
      abierta: true,
      saldoInicial: 100,
      totalIngresos: 500,
      totalEgresos: 50,
      saldoEsperado: 550,
      ventasEfectivo: 400,
      ventasDigitales: 100,
      aperturaFecha: '2026-11-12T08:00:00.000Z',
      cajero: 'Cajero Principal',
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockEstado);

    const estado = await cajaService.getEstado();
    expect(getSpy).toHaveBeenCalledWith('/caja/estado');
    expect(estado.abierta).toBe(true);
    expect(estado.saldoEsperado).toBe(550);
  });

  it('obtiene el historial de movimientos llamando a GET /caja/movimientos con filtros', async () => {
    const mockMovimientos: MovimientoCaja[] = [
      {
        id: 'mov-1',
        cajaId: 'caja-1',
        tipo: 'INGRESO',
        concepto: 'Venta B001-001',
        monto: 35.5,
        fecha: '2026-11-12T10:00:00.000Z',
        usuario: 'admin',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockMovimientos);

    const result = await cajaService.getMovimientos({ tipo: 'INGRESO' });
    expect(getSpy).toHaveBeenCalledWith('/caja/movimientos?tipo=INGRESO');
    expect(result).toHaveLength(1);
    expect(result[0].monto).toBe(35.5);
  });

  it('permite abrir caja enviando POST /caja/abrir', async () => {
    const payload: AperturaCajaPayload = {
      montoInicial: 150,
      observaciones: 'Apertura turno mañana',
    };

    const mockEstado: EstadoCaja = {
      abierta: true,
      saldoInicial: 150,
      totalIngresos: 0,
      totalEgresos: 0,
      saldoEsperado: 150,
      ventasEfectivo: 0,
      ventasDigitales: 0,
      aperturaFecha: '2026-11-12T08:00:00.000Z',
      cajero: 'admin',
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockEstado);

    const res = await cajaService.abrirCaja(payload);
    expect(postSpy).toHaveBeenCalledWith('/caja/abrir', payload);
    expect(res.abierta).toBe(true);
    expect(res.saldoInicial).toBe(150);
  });

  it('permite registrar una operacion manual de egreso llamando a POST /caja/operacion', async () => {
    const payload = {
      tipo: 'EGRESO' as const,
      concepto: 'Pago de flete local',
      monto: 25.0,
      categoria: 'OPERATIVO',
    };

    const mockRes: MovimientoCaja = {
      id: 'mov-2',
      cajaId: 'caja-1',
      tipo: 'EGRESO',
      concepto: 'Pago de flete local',
      monto: 25.0,
      fecha: '2026-11-12T11:00:00.000Z',
      usuario: 'admin',
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockRes);

    const res = await cajaService.registrarOperacion(payload);
    expect(postSpy).toHaveBeenCalledWith('/caja/operacion', payload);
    expect(res.monto).toBe(25.0);
  });
});

