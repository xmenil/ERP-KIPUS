export type UserRole = 'SUPER_ADMIN' | 'ADMINISTRADOR' | 'CAJERO' | 'ALMACENERO' | 'SUPERVISOR';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  nombreCompleto: string;
  rol: UserRole;
  sucursal: string;
  avatarInitials: string;
}

export interface LoginCredentials {
  identifier: string; // Usuario o Correo electrónico
  password: string;
  recordar?: boolean;
}

export interface RegisterPayload {
  nombreTienda: string;
  nombreCompleto: string;
  username: string;
  email: string;
  password: string;
  telefono?: string;
  ruc?: string;
  recordar?: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  logout: () => void;
}
