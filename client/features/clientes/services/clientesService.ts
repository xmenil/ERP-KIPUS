import { simulateDelay } from '@/services/mock/mockUtils';
import { ActualizarClientePayload, Cliente, NuevoClientePayload } from '../types/clientes.types';
import { erpStore } from '@/services/erp/erpStore';
import { clienteSchema } from '../utils/clienteValidation';

export const clientesService = {
  async getClientes(): Promise<Cliente[]> {
    const clientes = erpStore.getClientes();
    for (const cliente of clientes) {
      const validacion = clienteSchema.safeParse(cliente);
      if (!validacion.success || typeof cliente.id !== 'string' || typeof cliente.activo !== 'boolean'
        || !Number.isFinite(cliente.totalCompras) || !Number.isFinite(cliente.saldoPendiente)) {
        throw new Error('No se puede leer el directorio de clientes porque contiene datos inválidos. Se conservaron los datos guardados.');
      }
    }
    return simulateDelay(clientes);
  },

  async registrarCliente(payload: NuevoClientePayload): Promise<Cliente> {
    const cliente = erpStore.crearCliente(payload);
    return simulateDelay(cliente);
  },

  async actualizarCliente(id: string, payload: ActualizarClientePayload): Promise<Cliente> {
    const cliente = erpStore.actualizarCliente(id, payload);
    return simulateDelay(cliente);
  },

  async cambiarEstadoCliente(id: string): Promise<Cliente> {
    const cliente = erpStore.toggleEstadoCliente(id);
    return simulateDelay(cliente);
  },
};
