import { simulateDelay } from '@/services/mock/mockUtils';
import { Proveedor, NuevoProveedorPayload } from '../types/proveedores.types';
import { erpStore } from '@/services/erp/erpStore';

export const proveedoresService = {
  async getProveedores(): Promise<Proveedor[]> {
    return simulateDelay(erpStore.getProveedores());
  },

  async registrarProveedor(payload: NuevoProveedorPayload): Promise<Proveedor> {
    const prov = erpStore.crearProveedor(payload);
    return simulateDelay(prov);
  },

  async actualizarProveedor(id: string, payload: Partial<NuevoProveedorPayload>): Promise<Proveedor> {
    const prov = erpStore.actualizarProveedor(id, payload);
    return simulateDelay(prov);
  },

  async eliminarProveedor(id: string): Promise<boolean> {
    const res = erpStore.eliminarProveedor(id);
    return simulateDelay(res);
  },

  async toggleEstadoProveedor(id: string): Promise<Proveedor> {
    const prov = erpStore.toggleEstadoProveedor(id);
    return simulateDelay(prov);
  },
};

