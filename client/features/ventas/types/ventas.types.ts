export type TipoComprobante = 'BOLETA' | 'FACTURA' | 'NOTA_VENTA';
export type EstadoVenta = 'COMPLETADA' | 'PENDIENTE' | 'ANULADA';
export type MetodoPago =
  | 'EFECTIVO'
  | 'YAPE'
  | 'PLIN'
  | 'TARJETA'
  | 'TRANSFERENCIA'
  | 'MIXTO'
  | 'CREDITO';

export type NivelComplejidadNegocio =
  | 'TIENDA_PEQUENA'      // Bodegas, quioscos, negocios familiares: foco en POS rápido
  | 'COMERCIO_MEDIANO'    // Tiendas con pedidos, cotizaciones, vendedores y clientes
  | 'CADENA_EMPRESARIAL'; // Multi-sucursales, multi-caja, devoluciones y reportes avanzados

export interface ItemVenta {
  productoId: string;
  sku?: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuentoUnitario?: number;
  subtotal: number;
}

export interface PagoMixtoDesglose {
  efectivo?: number;
  yape?: number;
  plin?: number;
  tarjeta?: number;
  transferencia?: number;
}

export interface Venta {
  id: string;
  tipoComprobante: TipoComprobante;
  serieCorrelativo: string; // ej. B001-000482
  clienteNombre: string;
  clienteDocumento: string; // DNI o RUC
  fecha: string;
  metodoPago: MetodoPago;
  desglosePagoMixto?: PagoMixtoDesglose;
  montoRecibido?: number;
  vuelto?: number;
  estado: EstadoVenta;
  subtotal: number;
  descuento: number;
  igv: number;
  total: number;
  items: ItemVenta[];
  sucursal?: string;
  caja?: string;
  vendedor?: string;
  motivoAnulacion?: string;
}

export interface NuevaVentaPayload {
  tipoComprobante: TipoComprobante;
  clienteNombre: string;
  clienteDocumento: string;
  metodoPago: MetodoPago;
  desglosePagoMixto?: PagoMixtoDesglose;
  montoRecibido?: number;
  vuelto?: number;
  descuento?: number;
  items: {
    productoId: string;
    sku?: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
  }[];
  sucursal?: string;
  caja?: string;
  vendedor?: string;
}

export type EstadoPedido =
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'PREPARANDO'
  | 'LISTO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface Pedido {
  id: string;
  codigo: string; // ej. PED-0041
  clienteNombre: string;
  clienteTelefono?: string;
  fecha: string;
  fechaEntrega?: string;
  estado: EstadoPedido;
  total: number;
  items: ItemVenta[];
  sucursal: string;
  notas?: string;
}

export type EstadoCotizacion =
  | 'VIGENTE'
  | 'ACEPTADA'
  | 'VENCIDA'
  | 'CONVERTIDA';

export interface Cotizacion {
  id: string;
  numero: string; // ej. COT-0012
  clienteNombre: string;
  clienteDocumento: string;
  fecha: string;
  fechaVencimiento: string;
  validezDias: number;
  estado: EstadoCotizacion;
  subtotal: number;
  igv: number;
  total: number;
  items: ItemVenta[];
  vendedor: string;
}

export interface Devolucion {
  id: string;
  ventaId: string;
  serieCorrelativo: string;
  fecha: string;
  productoNombre: string;
  sku: string;
  cantidad: number;
  motivo: string;
  montoDevuelto: number;
  retornaAInventario: boolean;
  afectaCaja: boolean;
  usuario: string;
}

export interface ResumenVentasKpis {
  totalVendidoHoy: number;
  transaccionesHoy: number;
  ticketPromedioHoy: number;
  articulosDespachadosHoy: number;
  ventasPorMetodo: { metodo: MetodoPago; total: number; porcentaje: number }[];
  comparativaAyerPorcentaje: number;
}
