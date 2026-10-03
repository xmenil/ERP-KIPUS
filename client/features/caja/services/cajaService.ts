import { simulateDelay } from '@/services/mock/mockUtils';
import {
  EstadoCaja,
  MovimientoCaja,
  NuevaOperacionCajaPayload,
  CajaInfo,
  CierreCaja,
  AuditoriaCaja,
  ArqueoConteo,
  AperturaCajaPayload,
  CierreCajaPayload,
} from '../types/caja.types';
import { erpStore } from '@/services/erp/erpStore';

export const cajaService = {
  async getEstado(): Promise<EstadoCaja> {
    return simulateDelay(erpStore.getEstadoCaja());
  },

  async getMovimientos(): Promise<MovimientoCaja[]> {
    return simulateDelay(erpStore.getMovimientosCaja());
  },

  async getCajas(): Promise<CajaInfo[]> {
    return simulateDelay(erpStore.getCajas());
  },

  async getCierres(): Promise<CierreCaja[]> {
    return simulateDelay(erpStore.getCierresCaja());
  },

  async getAuditoria(): Promise<AuditoriaCaja[]> {
    return simulateDelay(erpStore.getAuditoriaCaja());
  },

  async abrirCaja(payload: AperturaCajaPayload): Promise<EstadoCaja> {
    const estado = erpStore.abrirCaja(payload);
    return simulateDelay(estado);
  },

  async cerrarCaja(payload: CierreCajaPayload): Promise<CierreCaja> {
    const cierre = erpStore.cerrarCaja(payload);
    return simulateDelay(cierre);
  },

  async registrarOperacion(payload: NuevaOperacionCajaPayload): Promise<MovimientoCaja> {
    const op = erpStore.registrarOperacionCaja(payload);
    return simulateDelay(op);
  },

  async registrarArqueo(arqueo: ArqueoConteo): Promise<void> {
    erpStore.registrarArqueo(arqueo);
    return simulateDelay(undefined);
  },
};

