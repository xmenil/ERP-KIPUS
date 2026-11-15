import { Cliente, NuevoClientePayload, AbonoCliente } from '../types/clientes.types';
import { apiClient } from '@/services/api/apiClient';
import { erpStore } from '@/services/erp/erpStore';

export const clientesService = {
  /**
   * Obtiene la cartera de clientes registrada en PostgreSQL o erpStore
   */
  async getClientes(busqueda?: string): Promise<Cliente[]> {
    const query = busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : '';
    try {
      const clientes = await apiClient.get<Cliente[]>(`/clientes${query}`);
      if (Array.isArray(clientes)) return clientes;
    } catch {
      // Fallback a erpStore
    }
    const storeClientes = erpStore.getClientes();
    if (busqueda?.trim()) {
      const q = busqueda.toLowerCase();
      return storeClientes.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.numeroDocumento.includes(q) ||
          c.telefono.includes(q)
      );
    }
    return storeClientes;
  },

  /**
   * Busca un cliente por DNI o RUC
   */
  async buscarPorDocumento(documento: string): Promise<Cliente | null> {
    try {
      const cliente = await apiClient.get<Cliente | null>(
        `/clientes/buscar?documento=${encodeURIComponent(documento)}`
      );
      if (cliente) return cliente;
    } catch {
      // Fallback a erpStore
    }
    const storeClientes = erpStore.getClientes();
    return storeClientes.find((c) => c.numeroDocumento === documento) || null;
  },

  /**
   * Registra un nuevo cliente
   */
  async registrarCliente(payload: NuevoClientePayload): Promise<Cliente> {
    try {
      return await apiClient.post<Cliente>('/clientes', payload);
    } catch {
      return erpStore.crearCliente(payload);
    }
  },

  /**
   * Actualiza los datos de un cliente existente
   */
  async actualizarCliente(id: string, payload: Partial<NuevoClientePayload>): Promise<Cliente> {
    try {
      return await apiClient.put<Cliente>(`/clientes/${id}`, payload);
    } catch {
      const clientes = erpStore.getClientes();
      const match = clientes.find((c) => c.id === id);
      if (match) {
        Object.assign(match, payload);
        return match;
      }
      throw new Error('Cliente no encontrado');
    }
  },

  /**
   * Registra un abono para reducir la deuda o saldo pendiente de fiado
   */
  async registrarAbonoCliente(
    clienteId: string,
    payload: {
      monto: number;
      metodoPago: string;
      referenciaComprobante?: string;
      cajero?: string;
    }
  ): Promise<AbonoCliente> {
    try {
      return await apiClient.post<AbonoCliente>(`/clientes/${clienteId}/abonos`, payload);
    } catch {
      const clientes = erpStore.getClientes();
      const match = clientes.find((c) => c.id === clienteId);
      const saldoPrevio = match?.saldoPendiente || 0;
      const nuevoSaldo = Math.max(0, +(saldoPrevio - payload.monto).toFixed(2));

      if (match) {
        match.saldoPendiente = nuevoSaldo;
      }

      const ahora = new Date();
      return {
        id: `abn-cli-${Date.now()}`,
        fecha: ahora.toISOString().slice(0, 10),
        hora: ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        clienteId,
        clienteNombre: match?.nombre || 'Cliente General',
        clienteDocumento: match?.numeroDocumento || '00000000',
        montoAbonado: payload.monto,
        saldoAnterior: saldoPrevio,
        saldoRestante: nuevoSaldo,
        metodoPago: payload.metodoPago,
        referenciaComprobante: payload.referenciaComprobante || `REC-${Date.now().toString().slice(-6)}`,
        cajero: payload.cajero || 'Cajero de Turno',
      };
    }
  },

  /**
   * Obtiene el historial de comprobantes de venta emitidos a un cliente
   */
  async getHistorialCompras(documentoCliente: string) {
    try {
      const ventas = erpStore.getVentas();
      return ventas.filter(
        (v) =>
          v.clienteDocumento === documentoCliente ||
          v.clienteNombre.toLowerCase().includes(documentoCliente.toLowerCase())
      );
    } catch {
      return [];
    }
  },
};
