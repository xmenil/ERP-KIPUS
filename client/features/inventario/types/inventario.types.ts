export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export type MotivoMovimiento =
  | 'COMPRA'
  | 'VENTA'
  | 'INVENTARIO_INICIAL'
  | 'MERMA'
  | 'TRANSFERENCIA'
  | 'AUDITORIA_CONTEO';

export type EstadoStock = 'DISPONIBLE' | 'STOCK_BAJO' | 'AGOTADO';
export type EstadoNivelStock = 'DISPONIBLE' | 'STOCK_BAJO' | 'AGOTADO' | 'SUFICIENTE' | 'POR_AGOTARSE';

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
  almacen?: string;
  imagenUrl?: string;
}

export interface MovimientoStock {
  id: string;
  fecha: string;
  productoId?: string;
  productoNombre: string;
  sku: string;
  tipo: TipoMovimiento;
  motivo?: MotivoMovimiento;
  cantidad: number;
  stockResultante: number;
  origen?: string; // 'Compra', 'Venta', 'Ajuste de inventario', 'Inventario inicial', etc.
  referencia: string; // ej. 'Boleta B001-000482', 'Factura F001-000129'
  usuario: string;
  almacen: string;
}

// Mantener compatibilidad con MovimientoKardex
export type MovimientoKardex = MovimientoStock;

export interface AjusteInventario {
  id: string;
  productoId: string;
  productoNombre: string;
  sku: string;
  stockAnterior: number;
  nuevoStock: number;
  diferencia: number;
  motivo: string; // 'Conteo físico', 'Merma / daño', 'Vencimiento', 'Error de registro', 'Devolución de cliente', 'Otro'
  observacion?: string;
  fecha: string;
  usuario: string;
  almacen: string;
}

export interface NuevoAjustePayload {
  productoId: string;
  nuevoStock: number;
  motivo: string;
  observacion?: string;
  almacen?: string;
}

export interface ConteoFisicoItem {
  productoId: string;
  sku: string;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  stockSistema: number;
  stockFisico: number | null;
  diferencia: number | null;
  revisado: boolean;
  ubicacion?: string;
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

export interface ResumenIndicadoresInventario {
  totalProductos: number;
  stockBajo: number;
  agotados: number;
  valorAproximado: number;
}

export interface FiltrosExistencias {
  busqueda: string;
  categoria: string;
  estado: string; // 'TODOS' | 'DISPONIBLE' | 'STOCK_BAJO' | 'AGOTADO'
  almacen: string; // 'TODOS' | string
}

export interface FiltrosMovimientos {
  busqueda: string;
  tipo: string; // 'TODOS' | 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  periodo: string; // 'TODOS' | 'HOY' | '7_DIAS' | 'ESTE_MES'
}

// Compatibilidad hacia atrás si algún otro archivo los importa
export interface NuevoMovimientoPayload {
  tipo: TipoMovimiento;
  motivo?: MotivoMovimiento;
  productoNombre: string;
  sku: string;
  almacen: string;
  cantidad: number;
  referencia: string;
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
