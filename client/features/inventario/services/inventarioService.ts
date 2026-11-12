import { apiClient } from '@/services/api/apiClient';
import {
  MovimientoStock,
  MovimientoKardex,
  AlmacenResumen,
  ItemStockDetalle,
  AjusteInventario,
  NuevoAjustePayload,
  NuevoMovimientoPayload,
  RecepcionMercanciaPayload,
  AjusteAuditoriaPayload,
  ResumenIndicadoresInventario,
  FiltrosExistencias,
  FiltrosMovimientos,
} from '../types/inventario.types';

export const inventarioService = {
  /**
   * Obtiene la lista unificada de existencias actuales con sus niveles de stock y costos.
   */
  async getProductosStock(filtros?: Partial<FiltrosExistencias>): Promise<ItemStockDetalle[]> {
    const qs = new URLSearchParams();
    if (filtros?.almacen && filtros.almacen !== 'TODOS') qs.append('almacenId', filtros.almacen);
    if (filtros?.categoria && filtros.categoria !== 'TODAS') qs.append('categoria', filtros.categoria);
    if (filtros?.estado && filtros.estado !== 'TODOS') qs.append('estado', filtros.estado);
    if (filtros?.busqueda) qs.append('busqueda', filtros.busqueda);

    const q = qs.toString();
    const data = await apiClient.get<ItemStockDetalle[]>(`/inventario/existencias${q ? `?${q}` : ''}`);
    const items = Array.isArray(data) ? data : [];
    return items.map((it) => ({
      ...it,
      precioCompra: it.precioCompra ?? 0,
      valorizadoCosto: it.valorizadoCosto ?? 0,
      valorizadoVenta: it.valorizadoVenta ?? +(it.stock * (it.precioVenta || 0)).toFixed(2),
    }));
  },

  /**
   * Obtiene los indicadores / KPIs de inventario.
   */
  async getIndicadores(almacenId?: string): Promise<ResumenIndicadoresInventario> {
    const query = almacenId && almacenId !== 'TODOS' ? `?almacenId=${encodeURIComponent(almacenId)}` : '';
    return apiClient.get<ResumenIndicadoresInventario>(`/inventario/indicadores${query}`);
  },

  /**
   * Obtiene el historial de entradas, salidas y ajustes de stock.
   */
  async getMovimientos(filtros?: Partial<FiltrosMovimientos> & { almacenId?: string }): Promise<MovimientoStock[]> {
    const qs = new URLSearchParams();
    if (filtros?.tipo && filtros.tipo !== 'TODOS') qs.append('tipo', filtros.tipo);
    if (filtros?.periodo && filtros.periodo !== 'TODOS') qs.append('periodo', filtros.periodo);
    if (filtros?.busqueda) qs.append('busqueda', filtros.busqueda);
    if (filtros?.almacenId && filtros.almacenId !== 'TODOS') qs.append('almacenId', filtros.almacenId);

    const q = qs.toString();
    const data = await apiClient.get<MovimientoStock[]>(`/inventario/kardex${q ? `?${q}` : ''}`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Alias de getMovimientos para compatibilidad hacia atrás.
   */
  async getMovimientosKardex(filtros?: Partial<FiltrosMovimientos> & { almacenId?: string }): Promise<MovimientoKardex[]> {
    return this.getMovimientos(filtros);
  },

  /**
   * Consulta el Kardex específico de un producto por su ID.
   */
  async getKardexPorProducto(productoId: string): Promise<MovimientoKardex[]> {
    const data = await apiClient.get<MovimientoKardex[]>(`/inventario/kardex/producto/${productoId}`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Obtiene el listado de ajustes de inventario realizados.
   */
  async getAjustes(almacenId?: string): Promise<AjusteInventario[]> {
    const query = almacenId && almacenId !== 'TODOS' ? `?almacenId=${encodeURIComponent(almacenId)}` : '';
    const data = await apiClient.get<AjusteInventario[]>(`/inventario/ajustes${query}`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Registra un nuevo ajuste individual de stock con confirmación previa.
   */
  async registrarAjuste(payload: NuevoAjustePayload): Promise<AjusteInventario> {
    return apiClient.post<AjusteInventario>('/inventario/ajustes', {
      productoId: payload.productoId,
      nuevoStock: payload.nuevoStock,
      motivo: payload.motivo,
      observacion: payload.observacion,
      almacenId: (payload as any).almacenId || payload.almacen,
    });
  },

  /**
   * Aplica ajustes masivos provenientes del conteo físico.
   */
  async aplicarAjustesFisicos(
    items: { productoId: string; stockFisico: number; motivo?: string }[]
  ): Promise<AjusteInventario[]> {
    const data = await apiClient.post<AjusteInventario[]>('/inventario/ajustes/masivo', { items });
    return Array.isArray(data) ? data : [];
  },

  /**
   * Almacenes disponibles en el sistema.
   */
  async getAlmacenes(): Promise<AlmacenResumen[]> {
    const data = await apiClient.get<AlmacenResumen[]>('/almacenes');
    const items = Array.isArray(data) ? data : [];
    return items.map((a) => ({
      ...a,
      zonas: a.zonas || ['Zona General', 'Góndola Central'],
    }));
  },

  // Métodos de compatibilidad previa
  async registrarMovimiento(payload: NuevoMovimientoPayload & { productoId?: string }): Promise<MovimientoKardex> {
    return apiClient.post<MovimientoKardex>('/inventario/movimientos', payload);
  },

  async recepcionarMercancia(payload: RecepcionMercanciaPayload): Promise<MovimientoKardex> {
    return apiClient.post<MovimientoKardex>('/inventario/recepcion', payload);
  },

  async registrarAjusteAuditoria(payload: AjusteAuditoriaPayload): Promise<MovimientoKardex> {
    return apiClient.post<MovimientoKardex>('/inventario/ajustes', {
      productoId: payload.productoId,
      nuevoStock: payload.stockReal,
      motivo: payload.motivo || 'Auditoría de almacén',
      observacion: payload.observacion,
      almacenId: payload.almacen,
    });
  },
};
