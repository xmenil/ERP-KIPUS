export type UserRole = 'ADMINISTRADOR' | 'CAJERO' | 'SUPERVISOR';

export interface Usuario {
  id: string;
  username: string;
  email: string;
  nombreCompleto: string;
  rol: UserRole;
  sucursal: string;
  avatarInitials: string;
  password?: string;
  telefono?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  ultimoAcceso?: string;
  createdAt: string;
  descripcion?: string;
}

export interface NuevoUsuarioPayload {
  username: string;
  email: string;
  nombreCompleto: string;
  rol: UserRole;
  sucursal: string;
  password?: string;
  telefono?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
  descripcion?: string;
}
