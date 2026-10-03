export interface Proveedor {
  id: string;
  codigo?: string; // ej: "PRV-001"
  ruc: string; // DNI / CIF / RUC
  razonSocial: string;
  nombreComercial?: string; // "Nombre" en imagen
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
  ciudad: string;
  provincia?: string;
  pais?: string;
  codigoPostal?: string;
  rubro: string;
  condicionPago: string; // 'Contado' | 'Crédito a 15 días' | 'Crédito a 30 días' | 'Crédito a 60 días'
  diasCredito?: number;
  limiteCredito?: number;
  descripcion?: string; // Descripción opcional
  imagenUrl?: string; // Logo o avatar del proveedor
  totalCompras?: number;
  saldoPendiente?: number;
  activo?: boolean;
  calificacion?: number; // 1 a 5 estrellas
  fechaRegistro?: string;
}

export interface NuevoProveedorPayload {
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  contacto: string;
  telefono: string;
  correo: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  pais?: string;
  codigoPostal?: string;
  rubro: string;
  condicionPago: string;
  diasCredito?: number;
  limiteCredito?: number;
  descripcion?: string;
  imagenUrl?: string;
}

