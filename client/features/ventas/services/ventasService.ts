import { simulateDelay } from '@/services/mock/mockUtils';
import {
  Venta,
  NuevaVentaPayload,
  Pedido,
  Cotizacion,
  Devolucion,
  ResumenVentasKpis,
  MetodoPago,
} from '../types/ventas.types';
import { erpStore } from '@/services/erp/erpStore';

export const ventasService = {
  async getVentas(): Promise<Venta[]> {
    return simulateDelay(erpStore.getVentas());
  },

  async crearVenta(payload: NuevaVentaPayload): Promise<Venta> {
    const venta = erpStore.emitirVenta(payload);
    return simulateDelay(venta);
  },

  async anularVenta(id: string, motivo: string): Promise<Venta> {
    const venta = erpStore.anularVenta(id, motivo);
    return simulateDelay(venta);
  },

  async getPedidos(): Promise<Pedido[]> {
    return simulateDelay(erpStore.getPedidos());
  },

  async crearPedido(payload: Omit<Pedido, 'id' | 'codigo' | 'fecha'>): Promise<Pedido> {
    const pedido = erpStore.crearPedido(payload);
    return simulateDelay(pedido);
  },

  async cambiarEstadoPedido(id: string, nuevoEstado: Pedido['estado']): Promise<void> {
    erpStore.cambiarEstadoPedido(id, nuevoEstado);
    return simulateDelay(undefined);
  },

  async convertirPedidoAVenta(pedidoId: string): Promise<Venta> {
    const venta = erpStore.convertirPedidoAVenta(pedidoId);
    return simulateDelay(venta);
  },

  async getCotizaciones(): Promise<Cotizacion[]> {
    return simulateDelay(erpStore.getCotizaciones());
  },

  async crearCotizacion(payload: Omit<Cotizacion, 'id' | 'numero' | 'fecha'>): Promise<Cotizacion> {
    const cot = erpStore.crearCotizacion(payload);
    return simulateDelay(cot);
  },

  async convertirCotizacionAVenta(cotizacionId: string): Promise<Venta> {
    const venta = erpStore.convertirCotizacionAVenta(cotizacionId);
    return simulateDelay(venta);
  },

  async getDevoluciones(): Promise<Devolucion[]> {
    return simulateDelay(erpStore.getDevoluciones());
  },

  async registrarDevolucion(payload: {
    ventaId: string;
    productoId: string;
    cantidad: number;
    motivo: string;
    retornaAInventario: boolean;
    afectaCaja: boolean;
  }): Promise<Devolucion> {
    const dev = erpStore.registrarDevolucion(payload);
    return simulateDelay(dev);
  },

  async getKpisVentas(): Promise<ResumenVentasKpis> {
    const ventas = erpStore.getVentas().filter((v) => v.estado !== 'ANULADA');
    const totalVendidoHoy = ventas.reduce((acc, v) => acc + v.total, 0);
    const transaccionesHoy = ventas.length;
    const ticketPromedioHoy = transaccionesHoy > 0 ? +(totalVendidoHoy / transaccionesHoy).toFixed(2) : 0;
    const articulosDespachadosHoy = ventas.reduce(
      (acc, v) => acc + v.items.reduce((sum, it) => sum + it.cantidad, 0),
      0
    );

    const metodoMap: Record<MetodoPago, number> = {
      EFECTIVO: 0,
      YAPE: 0,
      PLIN: 0,
      TARJETA: 0,
      TRANSFERENCIA: 0,
      MIXTO: 0,
      CREDITO: 0,
    };

    ventas.forEach((v) => {
      metodoMap[v.metodoPago] = (metodoMap[v.metodoPago] || 0) + v.total;
    });

    const ventasPorMetodo = (Object.keys(metodoMap) as MetodoPago[])
      .filter((m) => metodoMap[m] > 0)
      .map((metodo) => ({
        metodo,
        total: metodoMap[metodo],
        porcentaje: totalVendidoHoy > 0 ? +((metodoMap[metodo] / totalVendidoHoy) * 100).toFixed(1) : 0,
      }));

    return simulateDelay({
      totalVendidoHoy,
      transaccionesHoy,
      ticketPromedioHoy,
      articulosDespachadosHoy,
      ventasPorMetodo,
      comparativaAyerPorcentaje: 12.4, // Crecimiento positivo vs ayer
    });
  },
};
