import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportesService } from './reportesService';
import { apiClient } from '@/services/api/apiClient';
import { ResumenFinanciero, LiquidacionSunat, TopProductoReporte } from '../types/reportes.types';

describe('Reportes Service — Integración REST', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtiene el Estado de Resultados (P&L) llamando a GET /reportes/financiero con periodo', async () => {
    const mockFinanciero: ResumenFinanciero = {
      ventasTotales: 15400.0,
      costoVentas: 9548.0,
      utilidadBruta: 5852.0,
      gastosOperativos: 1650.0,
      utilidadNeta: 4202.0,
      margenNetoPorcentaje: 27.3,
      margenBrutoPorcentaje: 38.0,
      desgloseMensual: [],
      estructuraRubros: [],
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockFinanciero);

    const res = await reportesService.getResumenFinanciero('ESTE_MES');
    expect(getSpy).toHaveBeenCalledWith('/reportes/financiero?periodo=ESTE_MES');
    expect(res.ventasTotales).toBe(15400.0);
    expect(res.utilidadNeta).toBe(4202.0);
  });

  it('obtiene la liquidación de IGV para SUNAT llamando a GET /reportes/sunat', async () => {
    const mockSunat: LiquidacionSunat = {
      baseImponibleVentas: 10000,
      igvVentasDebito: 1800,
      baseImponibleCompras: 6000,
      igvComprasCredito: 1080,
      igvPagar: 720,
      creditoFiscalRemanente: 0,
      ventasConBoleta: 7000,
      ventasConFactura: 3000,
      comprasConFactura: 6000,
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockSunat);

    const res = await reportesService.getLiquidacionSunat('MES_ANTERIOR');
    expect(getSpy).toHaveBeenCalledWith('/reportes/sunat?periodo=MES_ANTERIOR');
    expect(res.igvPagar).toBe(720);
  });

  it('obtiene el ranking de los productos más vendidos llamando a GET /reportes/top-productos', async () => {
    const mockTop: TopProductoReporte[] = [
      {
        nombre: 'Arroz Costeño Extra 1kg',
        sku: 'ARR-COS-01',
        categoria: 'Abarrotes',
        unidadesVendidas: 84,
        totalRecaudado: 403.2,
        porcentajeVenta: 18.5,
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockTop);

    const res = await reportesService.getTopProductos('ESTE_MES');
    expect(getSpy).toHaveBeenCalledWith('/reportes/top-productos?periodo=ESTE_MES');
    expect(res).toHaveLength(1);
    expect(res[0].unidadesVendidas).toBe(84);
  });
});

