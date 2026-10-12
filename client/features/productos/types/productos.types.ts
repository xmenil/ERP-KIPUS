export interface Producto {
  codigoBarras?: string;
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  unidadMedida: string; // UNIDAD, GALON, KILO, PAQUETE
  activo: boolean;
  ubicacion?: string; // Estante, pasillo o vitrina de almacenamiento
}

export interface NuevoProductoPayload {
  codigoBarras?: string;
  sku: string;
  nombre: string;
  categoria: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  unidadMedida: string;
  ubicacion?: string;
}

