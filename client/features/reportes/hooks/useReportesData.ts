import { useState, useEffect, useCallback } from 'react';
import { reportesService } from '../services/reportesService';
import { inventarioService } from '@/features/inventario/services/inventarioService';
import { ItemStockDetalle } from '@/features/inventario/types/inventario.types';
import {
  ResumenFinanciero,
  LiquidacionSunat,
  TopProductoReporte,
  PeriodoReporte,
} from '../types/reportes.types';
import { toast } from 'sonner';

export const PERIODO_LABELS: Record<PeriodoReporte, string> = {
  ESTE_MES: 'Mes actual',
  MES_ANTERIOR: 'Mes anterior',
  ANIO_ACTUAL: 'Año acumulado',
};

export function useReportesData() {
  const [periodo, setPeriodo] = useState<PeriodoReporte>('ESTE_MES');
  const [financiero, setFinanciero] = useState<ResumenFinanciero | null>(null);
  const [sunat, setSunat] = useState<LiquidacionSunat | null>(null);
  const [topProductos, setTopProductos] = useState<TopProductoReporte[]>([]);
  const [productosStock, setProductosStock] = useState<ItemStockDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fin, sun, top, prods] = await Promise.all([
        reportesService.getResumenFinanciero(periodo),
        reportesService.getLiquidacionSunat(periodo),
        reportesService.getTopProductos(periodo),
        inventarioService.getProductosStock(),
      ]);
      setFinanciero(fin);
      setSunat(sun);
      setTopProductos(top);
      setProductosStock(prods || []);
    } catch {
      setError('No se pudieron calcular los indicadores de reportes.');
      toast.error('Error al sincronizar reportes');
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    periodo,
    setPeriodo,
    financiero,
    sunat,
    topProductos,
    productosStock,
    loading,
    error,
    fetchData,
    periodoLabel: PERIODO_LABELS[periodo],
  };
}
