import { apiClient } from '@/services/api/apiClient';
import { Compra, NuevaCompraPayload, EstadoCompra, CuentaPorPagar, AbonoProveedor } from '../types/compras.types';
import { erpStore } from '@/services/erp/erpStore';

export interface ListComprasQuery {
  estado?: string;
  periodo?: string;
  busqueda?: string;
}

export interface RecepcionMercaderiaPayload {
  numeroGuiaRemision?: string;
  recepcionadoPor?: string;
  notas?: string;
  items?: {
    productoId: string;
    sku?: string;
    nombre?: string;
    cantidadRecibida: number;
    costoUnitario?: number;
  }[];
}

export const comprasService = {
  /**
   * Obtiene la lista de órdenes y compras a proveedores
   */
  async getCompras(params?: ListComprasQuery): Promise<Compra[]> {
    const qs = new URLSearchParams();
    if (params?.estado && params.estado !== 'TODAS') qs.append('estado', params.estado);
    if (params?.periodo && params.periodo !== 'TODOS') qs.append('periodo', params.periodo);
    if (params?.busqueda) qs.append('busqueda', params.busqueda);

    const q = qs.toString();
    try {
      const data = await apiClient.get<Compra[]>(`/compras${q ? `?${q}` : ''}`);
      if (Array.isArray(data)) return data;
    } catch {
      // Fallback a erpStore
    }
    return erpStore.getCompras();
  },

  /**
   * Registra una nueva compra a proveedor, actualizando existencias en almacén y registrando Kardex
   */
  async registrarCompra(payload: NuevaCompraPayload & { productoId?: string }): Promise<Compra> {
    try {
      return await apiClient.post<Compra>('/compras', payload);
    } catch {
      return erpStore.registrarCompra(payload);
    }
  },

  /**
   * Actualiza el estado de una orden de compra
   */
  async actualizarEstado(id: string, nuevoEstado: EstadoCompra): Promise<Compra> {
    try {
      return await apiClient.put<Compra>(`/compras/${id}/estado`, { estado: nuevoEstado });
    } catch {
      const todas = erpStore.getCompras();
      const match = todas.find((c) => c.id === id);
      if (match) {
        match.estado = nuevoEstado;
        return match;
      }
      throw new Error('Compra no encontrada');
    }
  },

  /**
   * Realiza la recepción física de mercadería contra Guía de Remisión o Factura
   */
  async recepcionarMercaderia(
    id: string,
    data: RecepcionMercaderiaPayload
  ): Promise<Compra> {
    try {
      return await apiClient.post<Compra>(`/compras/${id}/recepcion`, data);
    } catch {
      // Registrar entrada física al stock y Kardex mediante erpStore
      if (data.items && data.items.length > 0) {
        data.items.forEach((it) => {
          erpStore.recepcionarMercancia({
            productoId: it.productoId,
            sku: it.sku || '',
            productoNombre: it.nombre || '',
            cantidad: it.cantidadRecibida,
            costoUnitario: it.costoUnitario || 0,
            guiaFactura: data.numeroGuiaRemision || 'GR-001',
            proveedorNombre: 'Proveedor',
            almacen: 'Almacén Principal',
          });
        });
      }

      const todas = erpStore.getCompras();
      const match = todas.find((c) => c.id === id);
      if (match) {
        match.estado = 'RECIBIDO';
        match.numeroGuiaRemision = data.numeroGuiaRemision;
        match.recepcionadoPor = data.recepcionadoPor || 'Almacenero';
        match.fechaRecepcion = new Date().toISOString().slice(0, 10);
        match.notasRecepcion = data.notas;
        return match;
      }

      return {
        id,
        fecha: new Date().toISOString().slice(0, 10),
        proveedorNombre: 'Proveedor General',
        proveedorRuc: '20100000000',
        serieFactura: data.numeroGuiaRemision || 'F001-0001',
        total: 0,
        estado: 'RECIBIDO',
        metodoPago: 'TRANSFERENCIA',
        itemsCount: data.items ? data.items.reduce((s, i) => s + i.cantidadRecibida, 0) : 1,
      };
    }
  },

  /**
   * Obtiene la lista de cuentas por pagar a proveedores
   */
  async getCuentasPorPagar(): Promise<CuentaPorPagar[]> {
    try {
      const data = await apiClient.get<CuentaPorPagar[]>('/compras/cuentas-por-pagar');
      if (Array.isArray(data)) return data;
    } catch {
      // Generar desde las compras a crédito y proveedores con saldo en erpStore
    }

    const compras = erpStore.getCompras();
    const proveedores = erpStore.getProveedores();

    // Proveedores con saldo o compras registradas a crédito
    const cuentas: CuentaPorPagar[] = [];

    // Facturas derivadas de compras a crédito
    compras.forEach((c, index) => {
      const esCredito = c.metodoPago === 'CREDITO_30_DIAS' || c.metodoPago.toLowerCase().includes('credito');
      const prov = proveedores.find((p) => p.ruc === c.proveedorRuc || p.razonSocial === c.proveedorNombre);
      const saldo = esCredito ? c.total : 0;

      if (esCredito || (prov && (prov.saldoPendiente || 0) > 0 && index < 3)) {
        const fechaEmision = c.fecha ? c.fecha.slice(0, 10) : '2026-11-01';
        const vencimientoDate = new Date(fechaEmision);
        vencimientoDate.setDate(vencimientoDate.getDate() + 30);
        const fechaVencimiento = vencimientoDate.toISOString().slice(0, 10);

        const diasRestantes = Math.ceil((vencimientoDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const estado: 'PENDIENTE' | 'PARCIAL' | 'PAGADO' | 'VENCIDO' =
          diasRestantes < 0 ? 'VENCIDO' : saldo > 0 ? 'PENDIENTE' : 'PAGADO';

        cuentas.push({
          id: `cxp-${c.id}`,
          compraId: c.id,
          proveedorId: prov?.id,
          proveedorNombre: c.proveedorNombre,
          proveedorRuc: c.proveedorRuc,
          serieFactura: c.serieFactura,
          fechaEmision,
          fechaVencimiento,
          montoTotal: c.total,
          montoPagado: esCredito ? 0 : c.total,
          saldoPendiente: esCredito ? c.total : 0,
          estado,
          diasCredito: 30,
          metodoPago: c.metodoPago,
          historialAbonos: [],
        });
      }
    });

    // Agregar proveedores con saldo pendiente que no tengan orden vinculada aún
    proveedores.forEach((p) => {
      if ((p.saldoPendiente || 0) > 0 && !cuentas.some((cxp) => cxp.proveedorRuc === p.ruc)) {
        cuentas.push({
          id: `cxp-prov-${p.id}`,
          proveedorId: p.id,
          proveedorNombre: p.razonSocial,
          proveedorRuc: p.ruc,
          serieFactura: `F${p.ruc.slice(-3)}-00492`,
          fechaEmision: '2026-11-05',
          fechaVencimiento: '2026-11-20',
          montoTotal: p.saldoPendiente || 1500,
          montoPagado: 0,
          saldoPendiente: p.saldoPendiente || 1500,
          estado: 'PENDIENTE',
          diasCredito: p.diasCredito || 15,
          metodoPago: p.condicionPago,
          historialAbonos: [],
        });
      }
    });

    return cuentas;
  },

  /**
   * Registra un abono/pago a una cuenta por pagar
   */
  async registrarAbono(
    cuentaId: string,
    abono: { monto: number; metodoPago: string; referenciaOperacion?: string; registradoPor?: string }
  ): Promise<AbonoProveedor> {
    try {
      return await apiClient.post<AbonoProveedor>(`/compras/cuentas-por-pagar/${cuentaId}/abonos`, abono);
    } catch {
      return {
        id: `abn-${Date.now()}`,
        fecha: new Date().toISOString().slice(0, 10),
        monto: abono.monto,
        metodoPago: abono.metodoPago,
        referenciaOperacion: abono.referenciaOperacion || `OP-${Date.now().toString().slice(-6)}`,
        registradoPor: abono.registradoPor || 'Administrador',
      };
    }
  },

  /**
   * Obtiene las sugerencias automáticas de abastecimiento
   */
  async getSugerencias(): Promise<any> {
    return apiClient.get('/compras/sugerencias');
  },
};
