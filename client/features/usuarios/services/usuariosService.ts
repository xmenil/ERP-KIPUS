import { apiClient } from '@/services/api/apiClient';
import { Usuario, NuevoUsuarioPayload, UserRole } from '../types/usuarios.types';

export interface ListUsuariosQuery {
  rol?: UserRole | 'TODOS';
  estado?: 'ACTIVO' | 'INACTIVO' | 'TODOS';
  busqueda?: string;
}

export const usuariosService = {
  /**
   * Obtiene la lista de usuarios registrados en el sistema
   */
  async getUsuarios(params?: ListUsuariosQuery): Promise<Usuario[]> {
    const qs = new URLSearchParams();
    if (params?.rol && params.rol !== 'TODOS') qs.append('rol', params.rol);
    if (params?.estado && params.estado !== 'TODOS') qs.append('estado', params.estado);
    if (params?.busqueda) qs.append('busqueda', params.busqueda);

    const q = qs.toString();
    const data = await apiClient.get<Usuario[]>(`/usuarios${q ? `?${q}` : ''}`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Obtiene el detalle de un usuario por su ID
   */
  async getUsuarioById(id: string): Promise<Usuario | null> {
    try {
      return await apiClient.get<Usuario>(`/usuarios/${id}`);
    } catch {
      return null;
    }
  },

  /**
   * Crea un nuevo usuario en la base de datos
   */
  async crearUsuario(payload: NuevoUsuarioPayload): Promise<Usuario> {
    return apiClient.post<Usuario>('/usuarios', {
      username: payload.username.trim(),
      email: payload.email.trim(),
      password: payload.password?.trim() || 'kipus123',
      nombreCompleto: payload.nombreCompleto.trim(),
      rol: payload.rol,
      sucursal: payload.sucursal?.trim() || 'Sede Central - Tingo María',
      telefono: payload.telefono?.trim() || undefined,
      estado: payload.estado || 'ACTIVO',
      descripcion: payload.descripcion?.trim() || undefined,
    });
  },

  /**
   * Actualiza la información de un usuario
   */
  async actualizarUsuario(id: string, payload: Partial<NuevoUsuarioPayload>): Promise<Usuario> {
    const body: any = {};
    if (payload.nombreCompleto) body.nombreCompleto = payload.nombreCompleto.trim();
    if (payload.email) body.email = payload.email.trim();
    if (payload.password && payload.password.trim().length >= 6) body.password = payload.password.trim();
    if (payload.rol) body.rol = payload.rol;
    if (payload.sucursal) body.sucursal = payload.sucursal.trim();
    if (payload.telefono !== undefined) body.telefono = payload.telefono.trim();
    if (payload.estado) body.estado = payload.estado;
    if (payload.descripcion !== undefined) body.descripcion = payload.descripcion.trim();

    return apiClient.put<Usuario>(`/usuarios/${id}`, body);
  },

  /**
   * Alterna el estado de una cuenta (ACTIVO <-> INACTIVO)
   */
  async toggleEstadoUsuario(id: string): Promise<Usuario> {
    return apiClient.patch<Usuario>(`/usuarios/${id}/estado`);
  },

  /**
   * Desactiva la cuenta de un usuario (baja lógica)
   */
  async eliminarUsuario(id: string): Promise<boolean> {
    await apiClient.patch<Usuario>(`/usuarios/${id}/estado`);
    return true;
  },
};
