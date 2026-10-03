import { simulateDelay } from '@/services/mock/mockUtils';
import { Producto, NuevoProductoPayload } from '../types/productos.types';
import { erpStore } from '@/services/erp/erpStore';

export const productosService = {
  async getProductos(): Promise<Producto[]> {
    return simulateDelay(erpStore.getProductos());
  },

  async crearProducto(payload: NuevoProductoPayload): Promise<Producto> {
    const nuevo = erpStore.crearProducto(payload);
    return simulateDelay(nuevo);
  },
};
