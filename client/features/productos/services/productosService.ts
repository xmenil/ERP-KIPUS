import { simulateDelay } from '@/services/mock/mockUtils';
import { Producto, NuevoProductoPayload } from '../types/productos.types';
import { erpStore } from '@/services/erp/erpStore';
import { buscarProductoPorCodigo } from '../utils/codigosProducto';

export const productosService = {
  buscarPorCodigo(codigo: string): Producto | undefined {
    return buscarProductoPorCodigo(erpStore.getProductos(), codigo);
  },
  async getProductos(): Promise<Producto[]> {
    return simulateDelay(erpStore.getProductos());
  },

  async crearProducto(payload: NuevoProductoPayload): Promise<Producto> {
    const nuevo = erpStore.crearProducto(payload);
    return simulateDelay(nuevo);
  },

  async actualizarProducto(id: string, payload: Partial<NuevoProductoPayload>): Promise<Producto> {
    const actualizado = erpStore.actualizarProducto(id, payload);
    return simulateDelay(actualizado);
  },

  async eliminarProducto(id: string): Promise<boolean> {
    const res = erpStore.eliminarProducto(id);
    return simulateDelay(res);
  },

  async toggleEstadoProducto(id: string): Promise<Producto> {
    const res = erpStore.toggleEstadoProducto(id);
    return simulateDelay(res);
  },
};
