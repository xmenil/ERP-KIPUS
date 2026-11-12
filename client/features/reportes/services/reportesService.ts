import { apiClient } from '@/services/api/apiClient';
import {
  ResumenFinanciero,
  LiquidacionSunat,
  TopProductoReporte,
  PeriodoReporte,
} from '../types/reportes.types';

export const reportesService = {
  /**
   * Obtiene el Estado de Resultados (P&L), margen bruto, neto y estructura de rubros
   */
  async getResumenFinanciero(periodo: PeriodoReporte = 'ESTE_MES'): Promise<ResumenFinanciero> {
    return apiClient.get<ResumenFinanciero>(`/reportes/financiero?periodo=${encodeURIComponent(periodo)}`);
  },

  /**
   * Obtiene la liquidación impositiva estimada de IGV para SUNAT (Débito vs Crédito)
   */
  async getLiquidacionSunat(periodo: PeriodoReporte = 'ESTE_MES'): Promise<LiquidacionSunat> {
    return apiClient.get<LiquidacionSunat>(`/reportes/sunat?periodo=${encodeURIComponent(periodo)}`);
  },

  /**
   * Obtiene el ranking de productos con mayor recaudación y unidades vendidas
   */
  async getTopProductos(periodo: PeriodoReporte = 'ESTE_MES'): Promise<TopProductoReporte[]> {
    const data = await apiClient.get<TopProductoReporte[]>(
      `/reportes/top-productos?periodo=${encodeURIComponent(periodo)}`
    );
    return Array.isArray(data) ? data : [];
  },
};
