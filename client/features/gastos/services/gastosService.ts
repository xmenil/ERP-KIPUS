import { simulateDelay } from '@/services/mock/mockUtils';
import { Gasto, NuevoGastoPayload } from '../types/gastos.types';
import { erpStore } from '@/services/erp/erpStore';

export const gastosService = {
  async getGastos(): Promise<Gasto[]> {
    return simulateDelay(erpStore.getGastos());
  },

  async registrarGasto(payload: NuevoGastoPayload): Promise<Gasto> {
    const gasto = erpStore.registrarGasto(payload);
    return simulateDelay(gasto);
  },

  async anularGasto(id: string, motivo?: string): Promise<Gasto> {
    const gasto = erpStore.anularGasto(id, motivo);
    return simulateDelay(gasto);
  },
};
