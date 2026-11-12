import { apiClient } from '@/services/api/apiClient';
import { Gasto, NuevoGastoPayload, CategoriaGasto } from '../types/gastos.types';

export interface ListGastosQuery {
  categoria?: CategoriaGasto | 'TODAS';
  fecha?: string;
}

export const gastosService = {
  /**
   * Obtiene la lista de egresos y gastos operativos
   */
  async getGastos(query?: ListGastosQuery): Promise<Gasto[]> {
    const qs = new URLSearchParams();
    if (query?.categoria && query.categoria !== 'TODAS') qs.append('categoria', query.categoria);
    if (query?.fecha) qs.append('fecha', query.fecha);
    const q = qs.toString();
    const data = await apiClient.get<Gasto[]>(`/gastos${q ? `?${q}` : ''}`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Registra un nuevo gasto operativo, afectando la caja chica
   */
  async registrarGasto(payload: NuevoGastoPayload): Promise<Gasto> {
    return apiClient.post<Gasto>('/gastos', payload);
  },
};
