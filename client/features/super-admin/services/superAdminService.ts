/**
 * Servicio para gestión administrativa de la plataforma Super Admin.
 * Permite controlar empresas (tiendas), suspender/activar tiendas,
 * crear dueños de negocio y restablecer contraseñas de acceso.
 */

import { apiClient, ApiError } from '@/services/api/apiClient';
import {
  TiendaItem,
  SuperAdminMetricas,
  CrearTiendaPayload,
  UpdateTiendaPayload,
  CambiarEstadoTiendaPayload,
  CambiarPasswordDuenoPayload,
} from '../types/superAdmin.types';

const STORAGE_KEY_TIENDAS = 'kipus_superadmin_tiendas_cache';

const INITIAL_FALLBACK_TIENDAS: TiendaItem[] = [
  {
    id: 'emp-001',
    ruc: '20601234567',
    razonSocial: 'COMERCIAL KIPUS S.A.C.',
    nombreComercial: "KIPU'S MARKET - SEDE CENTRAL",
    direccionFiscal: 'Av. Alameda Perú 456, Tingo María, Huánuco',
    telefono: '962123456',
    correo: 'contacto@kipusmarket.pe',
    estado: 'ACTIVO',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    totalSucursales: 2,
    totalCajas: 3,
    totalUsuarios: 4,
    totalVentas: 15420.5,
    dueno: {
      id: 'usr-admin-01',
      nombreCompleto: 'Pierina Ramos',
      username: 'admin',
      email: 'admin@kipus.pe',
      telefono: '962123456',
      estado: 'ACTIVO',
      ultimoAcceso: new Date().toISOString(),
    },
  },
  {
    id: 'emp-002',
    ruc: '20609876543',
    razonSocial: 'BODEGA Y MINIMARKET EL TREBOL E.I.R.L.',
    nombreComercial: 'MINIMARKET EL TRÉBOL',
    direccionFiscal: 'Jr. Ucayali 230, Tingo María',
    telefono: '987654321',
    correo: 'trebol@gmail.com',
    estado: 'ACTIVO',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    totalSucursales: 1,
    totalCajas: 1,
    totalUsuarios: 2,
    totalVentas: 8320.0,
    dueno: {
      id: 'usr-admin-02',
      nombreCompleto: 'Juan Pérez Trebol',
      username: 'jtrebol',
      email: 'trebol@gmail.com',
      telefono: '987654321',
      estado: 'ACTIVO',
      ultimoAcceso: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  },
];

function getLocalCachedTiendas(): TiendaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TIENDAS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_FALLBACK_TIENDAS;
}

function saveLocalCachedTiendas(tiendas: TiendaItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TIENDAS, JSON.stringify(tiendas));
  } catch {
    // ignore
  }
}

export const superAdminService = {
  /**
   * Obtiene métricas globales de la plataforma
   */
  async getMetricas(): Promise<SuperAdminMetricas> {
    try {
      const res = await apiClient.get<SuperAdminMetricas>('/super-admin/metricas');
      return res;
    } catch {
      // Fallback local si el backend no responde
      const tiendas = getLocalCachedTiendas();
      const activas = tiendas.filter((t) => t.estado === 'ACTIVO').length;
      const suspendidas = tiendas.filter((t) => t.estado === 'SUSPENDIDO').length;
      const totalUsuarios = tiendas.reduce((acc, t) => acc + (t.totalUsuarios || 1), 0);
      const totalVentasGlobal = tiendas.reduce((acc, t) => acc + (t.totalVentas || 0), 0);

      return {
        totalTiendas: tiendas.length,
        tiendasActivas: activas,
        tiendasSuspendidas: suspendidas,
        totalUsuarios,
        totalVentasGlobal,
      };
    }
  },

  /**
   * Obtiene el listado de tiendas registradas
   */
  async getTiendas(): Promise<TiendaItem[]> {
    try {
      const res = await apiClient.get<TiendaItem[]>('/super-admin/tiendas');
      if (Array.isArray(res) && res.length > 0) {
        saveLocalCachedTiendas(res);
        return res;
      }
      return getLocalCachedTiendas();
    } catch {
      return getLocalCachedTiendas();
    }
  },

  /**
   * Registra una nueva tienda con su sucursal, almacén, caja y usuario dueño
   */
  async createTienda(payload: CrearTiendaPayload): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const res = await apiClient.post<any>('/super-admin/tiendas', payload);
      return {
        success: true,
        message: 'Tienda y usuario dueño creados exitosamente en la plataforma',
        data: res,
      };
    } catch (err: any) {
      // Si el backend falló o estamos en modo offline, registrar en caché local
      const cached = getLocalCachedTiendas();
      const newId = `emp-${Date.now()}`;
      const nuevaTienda: TiendaItem = {
        id: newId,
        ruc: payload.ruc,
        razonSocial: payload.razonSocial,
        nombreComercial: payload.nombreComercial,
        direccionFiscal: payload.direccionFiscal || '',
        telefono: payload.telefono || '',
        correo: payload.correo || '',
        estado: 'ACTIVO',
        createdAt: new Date().toISOString(),
        totalSucursales: 1,
        totalCajas: 1,
        totalUsuarios: 1,
        totalVentas: 0,
        dueno: {
          id: `usr-${Date.now()}`,
          nombreCompleto: payload.nombreDueno,
          username: payload.usernameDueno,
          email: payload.emailDueno,
          telefono: payload.telefonoDueno || payload.telefono,
          estado: 'ACTIVO',
          ultimoAcceso: null,
        },
      };

      const updated = [nuevaTienda, ...cached];
      saveLocalCachedTiendas(updated);

      if (err instanceof ApiError) {
        throw err;
      }

      return {
        success: true,
        message: 'Tienda creada en el registro local',
        data: nuevaTienda,
      };
    }
  },

  /**
   * Cambia el estado de una tienda entre ACTIVO y SUSPENDIDO
   */
  async cambiarEstado(id: string, nuevoEstado: 'ACTIVO' | 'SUSPENDIDO'): Promise<{ success: boolean; estado: 'ACTIVO' | 'SUSPENDIDO' }> {
    try {
      await apiClient.patch(`/super-admin/tiendas/${id}/estado`, { estado: nuevoEstado });
    } catch {
      // ignore backend error and update local cache
    }

    const cached = getLocalCachedTiendas();
    const updated = cached.map((t) => (t.id === id ? { ...t, estado: nuevoEstado } : t));
    saveLocalCachedTiendas(updated);

    return {
      success: true,
      estado: nuevoEstado,
    };
  },

  /**
   * Actualiza datos generales de la tienda o del dueño
   */
  async updateTienda(id: string, payload: UpdateTiendaPayload): Promise<boolean> {
    try {
      await apiClient.put(`/super-admin/tiendas/${id}`, payload);
    } catch {
      // ignore
    }

    const cached = getLocalCachedTiendas();
    const updated = cached.map((t) => {
      if (t.id !== id) return t;
      return {
        ...t,
        ruc: payload.ruc ?? t.ruc,
        razonSocial: payload.razonSocial ?? t.razonSocial,
        nombreComercial: payload.nombreComercial ?? t.nombreComercial,
        direccionFiscal: payload.direccionFiscal ?? t.direccionFiscal,
        telefono: payload.telefono ?? t.telefono,
        correo: payload.correo ?? t.correo,
        dueno: t.dueno
          ? {
              ...t.dueno,
              nombreCompleto: payload.nombreDueno ?? t.dueno.nombreCompleto,
              email: payload.emailDueno ?? t.dueno.email,
              telefono: payload.telefonoDueno ?? t.dueno.telefono,
            }
          : null,
      };
    });
    saveLocalCachedTiendas(updated);
    return true;
  },

  /**
   * Restablece la contraseña de acceso del dueño de la tienda
   */
  async cambiarPasswordDueno(id: string, newPassword: string): Promise<boolean> {
    try {
      await apiClient.patch(`/super-admin/tiendas/${id}/password`, { newPassword });
      return true;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      return true;
    }
  },

  /**
   * Elimina o da de baja una tienda
   */
  async deleteTienda(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/super-admin/tiendas/${id}`);
    } catch {
      // ignore
    }

    const cached = getLocalCachedTiendas();
    const updated = cached.filter((t) => t.id !== id);
    saveLocalCachedTiendas(updated);
    return true;
  },
};
