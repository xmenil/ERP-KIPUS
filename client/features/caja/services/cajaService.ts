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
import { apiClient } from '@/services/api/apiClient';

export interface ListMovimientosQuery {
  cajaId?: string;
  tipo?: 'INGRESO' | 'EGRESO';
  fecha?: string;
}

export const cajaService = {
  /**
   * Obtiene el estado actual de la caja activa y su balance en tiempo real
   */
  async getEstado(cajaId?: string): Promise<EstadoCaja> {
    const query = cajaId ? `?cajaId=${encodeURIComponent(cajaId)}` : '';
    return apiClient.get<EstadoCaja>(`/caja/estado${query}`);
  },

  /**
   * Alias de compatibilidad
   */
  async getEstadoCaja(cajaId?: string): Promise<EstadoCaja> {
    return this.getEstado(cajaId);
  },

  /**
   * Obtiene el historial de movimientos de ingresos y egresos de caja
   */
  async getMovimientos(params?: ListMovimientosQuery): Promise<MovimientoCaja[]> {
    const qs = new URLSearchParams();
    if (params?.cajaId) qs.append('cajaId', params.cajaId);
    if (params?.tipo) qs.append('tipo', params.tipo);
    if (params?.fecha) qs.append('fecha', params.fecha);
    const q = qs.toString();
    const data = await apiClient.get<MovimientoCaja[]>(`/caja/movimientos${q ? `?${q}` : ''}`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Obtiene el listado de cajas físicas y su estado operativo
   */
  async getCajas(sucursalId?: string): Promise<CajaInfo[]> {
    const query = sucursalId ? `?sucursalId=${encodeURIComponent(sucursalId)}` : '';
    const data = await apiClient.get<CajaInfo[]>(`/caja/cajas${query}`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Obtiene el historial de cierres de caja y arqueos conciliados
   */
  async getCierres(fecha?: string): Promise<CierreCaja[]> {
    const query = fecha ? `?fecha=${encodeURIComponent(fecha)}` : '';
    const data = await apiClient.get<CierreCaja[]>(`/caja/cierres${query}`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Consulta la bitácora de auditoría de caja
   */
  async getAuditoria(): Promise<AuditoriaCaja[]> {
    const data = await apiClient.get<AuditoriaCaja[]>('/caja/auditoria');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Abre un turno de caja con saldo inicial en efectivo
   */
  async abrirCaja(payload: AperturaCajaPayload): Promise<EstadoCaja> {
    return apiClient.post<EstadoCaja>('/caja/abrir', payload);
  },

  /**
   * Cierra el turno de caja y concilia el arqueo físico
   */
  async cerrarCaja(payload: CierreCajaPayload, cajaId?: string): Promise<CierreCaja> {
    const query = cajaId ? `?cajaId=${encodeURIComponent(cajaId)}` : '';
    return apiClient.post<CierreCaja>(`/caja/cerrar${query}`, payload);
  },

  /**
   * Registra un movimiento manual de ingreso o egreso en efectivo
   */
  async registrarOperacion(
    payload: NuevaOperacionCajaPayload,
    cajaId?: string
  ): Promise<MovimientoCaja> {
    const query = cajaId ? `?cajaId=${encodeURIComponent(cajaId)}` : '';
    return apiClient.post<MovimientoCaja>(`/caja/operacion${query}`, payload);
  },

  /**
   * Registra el conteo de arqueo con desglose de billetes y monedas
   */
  async registrarArqueo(arqueo: ArqueoConteo): Promise<void> {
    await apiClient.post('/caja/arqueo', arqueo);
  },
};
