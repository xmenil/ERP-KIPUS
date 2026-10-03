import { simulateDelay } from '@/services/mock/mockUtils';
import { Cliente, NuevoClientePayload } from '../types/clientes.types';
import { erpStore } from '@/services/erp/erpStore';

export const clientesService = {
  async getClientes(): Promise<Cliente[]> {
    return simulateDelay(erpStore.getClientes());
  },

  async registrarCliente(payload: NuevoClientePayload): Promise<Cliente> {
    const cliente = erpStore.crearCliente(payload);
    return simulateDelay(cliente);
  },
};
