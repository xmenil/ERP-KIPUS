import { useState, useEffect, useCallback } from 'react';
import { comprasService } from '../services/comprasService';
import { sugerenciaComprasService, ResumenSugerenciaCompras } from '../services/sugerenciaComprasService';
import { Compra, NuevaCompraPayload, EstadoCompra } from '../types/compras.types';
import { subscribeToErp } from '@/services/erp/erpStore';
import { toast } from 'sonner';

export function useComprasData() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [sugerencias, setSugerencias] = useState<ResumenSugerenciaCompras>({
    items: [],
    totalProductosSugeridos: 0,
    totalUnidadesSugeridas: 0,
    inversionTotalEstimada: 0,
    conteoAgotados: 0,
    conteoCriticos: 0,
    conteoAltaRotacion: 0,
  });

  const fetchCompras = useCallback(async () => {
    setLoading(true);
    try {
      const data = await comprasService.getCompras();
      setCompras(data);
      const sug = await sugerenciaComprasService.fetchSugerencias();
      setSugerencias(sug);
    } catch {
      toast.error('Error al cargar la información de compras.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompras();
    return subscribeToErp(() => fetchCompras());
  }, [fetchCompras]);

  const registrarCompra = async (payload: NuevaCompraPayload): Promise<void> => {
    try {
      const nueva = await comprasService.registrarCompra(payload);
      setCompras((prev) => [nueva, ...prev]);
      const sug = await sugerenciaComprasService.fetchSugerencias();
      setSugerencias(sug);
      toast.success(`Compra con factura ${nueva.serieFactura} registrada correctamente.`);
    } catch {
      toast.error('No se pudo registrar la compra.');
      throw new Error('Error al registrar compra');
    }
  };

  const actualizarEstado = async (id: string, nuevoEstado: EstadoCompra) => {
    await comprasService.actualizarEstado(id, nuevoEstado);
    setCompras((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c))
    );
  };

  return {
    compras,
    loading,
    sugerencias,
    fetchCompras,
    registrarCompra,
    actualizarEstado,
  };
}
