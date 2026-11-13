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
      id: 'caja-1',
      nombre: 'Caja Principal',
      sucursal: 'Sede Central',
      responsable: 'Cajero Principal',
      abierta: true,
      estado: 'ABIERTA',
      turno: 'Mañana',
      fechaApertura: '2026-11-12',
      horaApertura: '08:00',
      saldoInicial: 100,
      ventasEfectivo: 400,
      otrosIngresosEfectivo: 100,
      egresosEfectivo: 50,
      saldoEfectivoEsperado: 550,
      ventasDigitales: { yape: 50, plin: 50, tarjeta: 0, transferencia: 0 },
      totalVentasDigitales: 100,
      totalVentasGeneral: 500,
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockEstado);

    const estado = await cajaService.getEstado();
    expect(getSpy).toHaveBeenCalledWith('/caja/estado');
    expect(estado.abierta).toBe(true);
    expect(estado.saldoEfectivoEsperado).toBe(550);
  });

  it('obtiene el historial de movimientos llamando a GET /caja/movimientos con filtros', async () => {
    const mockMovimientos: MovimientoCaja[] = [
      {
        id: 'mov-1',
        fecha: '2026-11-12',
        hora: '10:00',
        tipo: 'INGRESO',
        concepto: 'Venta B001-001',
        metodo: 'EFECTIVO',
        monto: 35.5,
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
      cajaId: 'caja-1',
      sucursal: 'Sede Central',
      responsable: 'admin',
      saldoInicial: 150,
      observaciones: 'Apertura turno mañana',
    };

    const mockEstado: EstadoCaja = {
      id: 'caja-1',
      nombre: 'Caja Principal',
      sucursal: 'Sede Central',
      responsable: 'admin',
      abierta: true,
      estado: 'ABIERTA',
      turno: 'Mañana',
      fechaApertura: '2026-11-12',
      horaApertura: '08:00',
      saldoInicial: 150,
      ventasEfectivo: 0,
      otrosIngresosEfectivo: 0,
      egresosEfectivo: 0,
      saldoEfectivoEsperado: 150,
      ventasDigitales: { yape: 0, plin: 0, tarjeta: 0, transferencia: 0 },
      totalVentasDigitales: 0,
      totalVentasGeneral: 0,
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
      metodo: 'EFECTIVO' as const,
      categoria: 'OPERATIVO',
    };

    const mockRes: MovimientoCaja = {
      id: 'mov-2',
      fecha: '2026-11-12',
      hora: '11:00',
      tipo: 'EGRESO',
      concepto: 'Pago de flete local',
      metodo: 'EFECTIVO',
      monto: 25.0,
      usuario: 'admin',
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockRes);

    const res = await cajaService.registrarOperacion(payload);
    expect(postSpy).toHaveBeenCalledWith('/caja/operacion', payload);
    expect(res.monto).toBe(25.0);
  });
});


