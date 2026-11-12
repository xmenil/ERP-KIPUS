import { Proveedor, NuevoProveedorPayload } from '../types/proveedores.types';
import { apiClient } from '@/services/api/apiClient';

export interface ListSuppliersQuery {
  busqueda?: string;
  rubro?: string;
}

export const proveedoresService = {
  /**
   * Obtiene la lista de proveedores desde PostgreSQL
   */
  async getProveedores(query?: ListSuppliersQuery): Promise<Proveedor[]> {
    const params = new URLSearchParams();
    if (query?.busqueda) params.append('busqueda', query.busqueda);
    if (query?.rubro && query.rubro !== 'TODOS') params.append('rubro', query.rubro);

    const qs = params.toString();
    const proveedores = await apiClient.get<Proveedor[]>(`/proveedores${qs ? `?${qs}` : ''}`);
    return Array.isArray(proveedores) ? proveedores : [];
  },

  /**
   * Obtiene un proveedor por su ID
   */
  async getProveedorPorId(id: string): Promise<Proveedor> {
    return apiClient.get<Proveedor>(`/proveedores/${id}`);
  },

  /**
   * Registra un nuevo proveedor en la base de datos
   */
  async registrarProveedor(payload: NuevoProveedorPayload): Promise<Proveedor> {
    return apiClient.post<Proveedor>('/proveedores', payload);
  },

  /**
   * Actualiza los datos de un proveedor
   */
  async actualizarProveedor(
    id: string,
    payload: Partial<NuevoProveedorPayload>
  ): Promise<Proveedor> {
    return apiClient.put<Proveedor>(`/proveedores/${id}`, payload);
  },

  /**
   * Elimina un proveedor (o lo desactiva si tiene historial de compras)
   */
  async eliminarProveedor(id: string): Promise<boolean> {
    const res = await apiClient.delete<{ eliminado: boolean; desactivado?: boolean }>(
      `/proveedores/${id}`
    );
    return res?.eliminado || Boolean(res?.desactivado);
  },

  /**
   * Alterna el estado activo de un proveedor
   */
  async toggleEstadoProveedor(id: string, activoActual = true): Promise<Proveedor> {
    return apiClient.put<Proveedor>(`/proveedores/${id}`, { activo: !activoActual });
  },
};
