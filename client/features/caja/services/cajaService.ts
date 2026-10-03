import { simulateDelay } from '@/services/mock/mockUtils';
import { EstadoCaja, MovimientoCaja, NuevaOperacionCajaPayload } from '../types/caja.types';
import { erpStore } from '@/services/erp/erpStore';

export const cajaService = {
  async getEstado(): Promise<EstadoCaja> {
    return simulateDelay(erpStore.getEstadoCaja());
  },

  async getMovimientos(): Promise<MovimientoCaja[]> {
    return simulateDelay(erpStore.getMovimientosCaja());
  },

  async registrarOperacion(payload: NuevaOperacionCajaPayload): Promise<MovimientoCaja> {
    const op = erpStore.registrarOperacionCaja(payload);
    return simulateDelay(op);
  },

  async cerrarTurno(): Promise<EstadoCaja> {
    const estado = erpStore.getEstadoCaja();
    estado.abierta = false;
    return simulateDelay(estado);
  },
};
