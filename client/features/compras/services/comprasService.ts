import { simulateDelay } from '@/services/mock/mockUtils';
import { Compra, NuevaCompraPayload } from '../types/compras.types';
import { erpStore } from '@/services/erp/erpStore';

export const comprasService = {
  async getCompras(): Promise<Compra[]> {
    return simulateDelay(erpStore.getCompras());
  },

  async registrarCompra(payload: NuevaCompraPayload & { productoId?: string }): Promise<Compra> {
    const compra = erpStore.registrarCompra(payload);
    return simulateDelay(compra);
  },
};
