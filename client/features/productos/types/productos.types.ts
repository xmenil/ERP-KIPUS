export interface Producto {
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
}

export interface NuevoProductoPayload {
  sku: string;
  nombre: string;
  categoria: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  unidadMedida: string;
}
