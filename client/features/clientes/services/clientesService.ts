import { Cliente, NuevoClientePayload } from '../types/clientes.types';
import { apiClient } from '@/services/api/apiClient';

export const clientesService = {
  /**
   * Obtiene la cartera de clientes registrada en PostgreSQL
   */
  async getClientes(busqueda?: string): Promise<Cliente[]> {
    const query = busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : '';
    const clientes = await apiClient.get<Cliente[]>(`/clientes${query}`);
    return Array.isArray(clientes) ? clientes : [];
  },

  /**
   * Busca un cliente por DNI o RUC
   */
  async buscarPorDocumento(documento: string): Promise<Cliente | null> {
    try {
      const cliente = await apiClient.get<Cliente | null>(
        `/clientes/buscar?documento=${encodeURIComponent(documento)}`
      );
      return cliente;
    } catch {
      return null;
    }
  },

  /**
   * Registra un nuevo cliente
   */
  async registrarCliente(payload: NuevoClientePayload): Promise<Cliente> {
    return apiClient.post<Cliente>('/clientes', payload);
  },

  /**
   * Actualiza los datos de un cliente existente
   */
  async actualizarCliente(id: string, payload: Partial<NuevoClientePayload>): Promise<Cliente> {
    return apiClient.put<Cliente>(`/clientes/${id}`, payload);
  },
};
