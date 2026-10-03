import { simulateDelay } from '@/services/mock/mockUtils';
import { Venta, NuevaVentaPayload } from '../types/ventas.types';
import { erpStore } from '@/services/erp/erpStore';

export const ventasService = {
  async getVentas(): Promise<Venta[]> {
    return simulateDelay(erpStore.getVentas());
  },

  async crearVenta(payload: NuevaVentaPayload): Promise<Venta> {
    const venta = erpStore.emitirVenta(payload);
    return simulateDelay(venta);
  },
};
