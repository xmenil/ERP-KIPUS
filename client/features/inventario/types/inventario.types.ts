export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE';
export type MotivoMovimiento =
  | 'COMPRA'
  | 'VENTA'
  | 'INVENTARIO_INICIAL'
  | 'MERMA'
  | 'TRANSFERENCIA'
  | 'AUDITORIA_CONTEO';

export interface MovimientoKardex {
  id: string;
  fecha: string;
  tipo: TipoMovimiento;
  motivo: MotivoMovimiento;
  productoNombre: string;
  sku: string;
  almacen: string;
  cantidad: number;
  stockResultante: number;
  referencia: string; // Factura, Guía de Remisión o Ticket
  usuario: string;
}

export interface AlmacenResumen {
  id: string;
  nombre: string;
  direccion: string;
  totalProductos: number;
  stockTotalUnidades: number;
  responsable?: string;
  zonas?: string[];
}

export interface NuevoMovimientoPayload {
  tipo: TipoMovimiento;
  motivo: MotivoMovimiento;
  productoNombre: string;
  sku: string;
  almacen: string;
  cantidad: number;
  referencia: string;
}

export type EstadoNivelStock = 'SUFICIENTE' | 'POR_AGOTARSE' | 'AGOTADO';

export interface ItemStockDetalle {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  stock: number;
  stockMinimo: number;
  unidadMedida: string;
  precioCompra: number;
  precioVenta: number;
  ubicacion: string;
  estadoNivel: EstadoNivelStock;
  valorizadoCosto: number;
  valorizadoVenta: number;
}

export interface RecepcionMercanciaPayload {
  productoId: string;
  sku: string;
  productoNombre: string;
  cantidad: number;
  proveedorNombre: string;
  guiaFactura: string;
  almacen: string;
  costoUnitario?: number;
}

export interface ConteoFisicoItem {
  productoId: string;
  sku: string;
  nombre: string;
  categoria: string;
  ubicacion: string;
  stockSistema: number;
  stockFisico: number;
  diferencia: number;
  costoUnitario: number;
}

export interface AjusteAuditoriaPayload {
  productoId: string;
  stockReal: number;
  motivo: string;
  observacion?: string;
  almacen: string;
}

export type EtapaFlujoInventario =
  | 'RECEPCION'
  | 'CLASIFICACION'
  | 'MOVIMIENTOS'
  | 'CONTROL_STOCK'
  | 'AUDITORIA'
  | 'ANALISIS';

