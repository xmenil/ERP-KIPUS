export type UserRole = 'ADMINISTRADOR' | 'CAJERO' | 'SUPERVISOR';

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

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
}
