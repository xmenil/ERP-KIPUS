import { apiClient } from '@/services/api/apiClient';
import { Compra, NuevaCompraPayload } from '../types/compras.types';

export interface ListComprasQuery {
  estado?: string;
  periodo?: string;
  busqueda?: string;
}

export const comprasService = {
  /**
   * Obtiene la lista de órdenes y compras a proveedores
   */
  async getCompras(params?: ListComprasQuery): Promise<Compra[]> {
    const qs = new URLSearchParams();
    if (params?.estado && params.estado !== 'TODAS') qs.append('estado', params.estado);
    if (params?.periodo && params.periodo !== 'TODOS') qs.append('periodo', params.periodo);
    if (params?.busqueda) qs.append('busqueda', params.busqueda);

    const q = qs.toString();
    const data = await apiClient.get<Compra[]>(`/compras${q ? `?${q}` : ''}`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Registra una nueva compra a proveedor, actualizando existencias en almacén y registrando Kardex
   */
  async registrarCompra(payload: NuevaCompraPayload & { productoId?: string }): Promise<Compra> {
    return apiClient.post<Compra>('/compras', payload);
  },

  /**
   * Obtiene las sugerencias automáticas de abastecimiento
   */
  async getSugerencias(): Promise<any> {
    return apiClient.get('/compras/sugerencias');
  },
};
