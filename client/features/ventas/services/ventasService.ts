import {
  Venta,
  NuevaVentaPayload,
  Pedido,
  Cotizacion,
  Devolucion,
  ResumenVentasKpis,
} from '../types/ventas.types';
import { apiClient } from '@/services/api/apiClient';

export interface ListVentasQuery {
  fecha?: string;
  estado?: string;
  tipoComprobante?: string;
  search?: string;
}

export const ventasService = {
  /**
   * Obtiene la lista de comprobantes de venta emitidos
   */
  async getVentas(query?: ListVentasQuery): Promise<Venta[]> {
    const qs = new URLSearchParams();
    if (query?.fecha) qs.append('fecha', query.fecha);
    if (query?.estado && query.estado !== 'TODOS') qs.append('estado', query.estado);
    if (query?.tipoComprobante && query.tipoComprobante !== 'TODOS') {
      qs.append('tipoComprobante', query.tipoComprobante);
    }
    if (query?.search) qs.append('search', query.search);

    const q = qs.toString();
    const data = await apiClient.get<Venta[]>(`/ventas${q ? `?${q}` : ''}`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Emite una nueva venta en el POS (descuenta stock en BD, registra Kardex y suma a Caja)
   */
  async crearVenta(payload: NuevaVentaPayload): Promise<Venta> {
    const backendPayload = {
      tipoComprobante: payload.tipoComprobante,
      clienteNombre: payload.clienteNombre,
      clienteDocumento: payload.clienteDocumento,
      metodoPago: payload.metodoPago,
      desglosePagoMixto: payload.desglosePagoMixto,
      montoRecibido: payload.montoRecibido,
      vuelto: payload.vuelto,
      descuento: payload.descuento,
      sucursal: payload.sucursal,
      caja: payload.caja,
      vendedor: payload.vendedor,
      items: payload.items.map((it) => ({
        productoId: it.productoId,
        sku: it.sku,
        nombre: it.nombre,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        descuentoUnitario: it.descuentoUnitario ?? 0,
      })),
    };
    return apiClient.post<Venta>('/ventas', backendPayload);
  },

  /**
   * Anula un comprobante de venta revirtiendo el stock en inventario y generando nota de ajuste
   */
  async anularVenta(id: string, motivo: string): Promise<Venta> {
    return apiClient.post<Venta>(`/ventas/${id}/anular`, { motivo });
  },

  /**
   * Obtiene la lista de pedidos de clientes
   */
  async getPedidos(estado?: string): Promise<Pedido[]> {
    const query = estado && estado !== 'TODOS' ? `?estado=${encodeURIComponent(estado)}` : '';
    const data = await apiClient.get<Pedido[]>(`/pedidos${query}`);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Registra un nuevo pedido comercial
   */
  async crearPedido(payload: Omit<Pedido, 'id' | 'codigo' | 'fecha'>): Promise<Pedido> {
    return apiClient.post<Pedido>('/pedidos', payload);
  },

  /**
   * Actualiza el estado operativo de un pedido (ej: PENDIENTE -> PREPARANDO -> ENTREGADO)
   */
  async cambiarEstadoPedido(id: string, nuevoEstado: Pedido['estado']): Promise<void> {
    await apiClient.patch(`/pedidos/${id}/estado`, { nuevoEstado });
  },

  /**
   * Convierte un pedido a comprobante de pago final (Boleta/Factura)
   */
  async convertirPedidoAVenta(pedidoId: string): Promise<Venta> {
    return apiClient.post<Venta>(`/pedidos/${pedidoId}/convertir-a-venta`);
  },

  /**
   * Obtiene la lista de cotizaciones emitidas
   */
  async getCotizaciones(): Promise<Cotizacion[]> {
    const data = await apiClient.get<Cotizacion[]>('/cotizaciones');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Registra una cotización o presupuesto para un cliente
   */
  async crearCotizacion(payload: Omit<Cotizacion, 'id' | 'numero' | 'fecha'>): Promise<Cotizacion> {
    return apiClient.post<Cotizacion>('/cotizaciones', payload);
  },

  /**
   * Convierte una cotización aprobada directamente a comprobante de venta
   */
  async convertirCotizacionAVenta(cotizacionId: string): Promise<Venta> {
    return apiClient.post<Venta>(`/cotizaciones/${cotizacionId}/convertir-a-venta`);
  },

  /**
   * Obtiene el historial de notas de crédito y devoluciones
   */
  async getDevoluciones(): Promise<Devolucion[]> {
    const data = await apiClient.get<Devolucion[]>('/devoluciones');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Registra una devolución de producto con reingreso facultativo al Kardex
   */
  async registrarDevolucion(payload: {
    ventaId: string;
    productoId: string;
    cantidad: number;
    motivo: string;
    retornaAInventario: boolean;
    afectaCaja: boolean;
  }): Promise<Devolucion> {
    return apiClient.post<Devolucion>('/devoluciones', payload);
  },

  /**
   * Obtiene los indicadores ejecutivos de ventas de la jornada
   */
  async getKpisVentas(): Promise<ResumenVentasKpis> {
    return apiClient.get<ResumenVentasKpis>('/ventas/kpis');
  },
};
