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
};
