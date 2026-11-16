/**
 * Tipos e interfaces del módulo Super Administrador de KIPU'S ERP.
 * Define la estructura para la gestión multi-tienda, propietarios y métricas de plataforma.
 */

export interface TiendaDueno {
  id: string;
  nombreCompleto: string;
  username: string;
  email: string;
  telefono?: string;
  estado: string;
  ultimoAcceso?: string | null;
}

export interface TiendaItem {
  id: string;
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  direccionFiscal?: string;
  telefono?: string;
  correo?: string;
  estado: 'ACTIVO' | 'SUSPENDIDO';
  createdAt: string;
  totalSucursales: number;
  totalCajas: number;
  totalUsuarios: number;
  totalVentas: number;
  dueno: TiendaDueno | null;
}

export interface SuperAdminMetricas {
  totalTiendas: number;
  tiendasActivas: number;
  tiendasSuspendidas: number;
  totalUsuarios: number;
  totalVentasGlobal: number;
}

export interface CrearTiendaPayload {
  nombreComercial: string;
  razonSocial: string;
  ruc: string;
  direccionFiscal?: string;
  telefono?: string;
  correo?: string;
  nombreDueno: string;
  usernameDueno: string;
  emailDueno: string;
  passwordDueno: string;
  telefonoDueno?: string;
}

export interface UpdateTiendaPayload {
  nombreComercial?: string;
  razonSocial?: string;
  ruc?: string;
  direccionFiscal?: string;
  telefono?: string;
  correo?: string;
  nombreDueno?: string;
  emailDueno?: string;
  telefonoDueno?: string;
}

export interface CambiarEstadoTiendaPayload {
  estado: 'ACTIVO' | 'SUSPENDIDO';
}

export interface CambiarPasswordDuenoPayload {
  newPassword: string;
}
