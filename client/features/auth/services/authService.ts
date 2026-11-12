import { AuthUser, LoginCredentials } from '../types/auth.types';
import { SessionStore } from './sessionStore';
import { apiClient } from '@/services/api/apiClient';

// Usuarios de demostración (se conservan para facilitar el autocompletado en el formulario de login)
export const DEMO_USERS: (AuthUser & { password: string; descripcion: string })[] = [
  {
    id: 'user-admin',
    username: 'admin',
    email: 'admin@kipus.pe',
    password: 'admin123',
    nombreCompleto: 'Darwin Namuche (Administrador)',
    rol: 'ADMINISTRADOR',
    sucursal: 'Sede Central - Tingo María',
    avatarInitials: 'DN',
    descripcion: 'Acceso total a todos los módulos y configuración',
  },
  {
    id: 'user-caja',
    username: 'caja',
    email: 'caja@kipus.pe',
    password: 'caja123',
    nombreCompleto: 'Pierina Ramirez (Caja & Ventas)',
    rol: 'CAJERO',
    sucursal: 'Punto de Venta 01 - Rupa Rupa',
    avatarInitials: 'PR',
    descripcion: 'Operaciones de ventas, caja chica y comprobantes',
  },
  {
    id: 'user-almacen',
    username: 'almacen',
    email: 'almacen@kipus.pe',
    password: 'almacen123',
    nombreCompleto: 'Terry Pastor (Almacenero / Kardex)',
    rol: 'ALMACENERO',
    sucursal: 'Almacén 01 - Tingo María',
    avatarInitials: 'TP',
    descripcion: 'Control de inventario, stock y recepción de compras',
  },
  {
    id: 'user-super',
    username: 'supervisor',
    email: 'supervisor@kipus.pe',
    password: 'super123',
    nombreCompleto: 'Terry Pastor (Supervisor General)',
    rol: 'SUPERVISOR',
    sucursal: 'Almacén 01 - Tingo María',
    avatarInitials: 'TP',
    descripcion: 'Control de inventario, stock y recepción de compras',
  },
];

interface LoginApiResponse {
  user: AuthUser;
  token: string;
}

export class AuthService {
  private session: SessionStore | null = null;
  private currentUser: AuthUser | null = null;

  constructor() {
    try {
      this.session = new SessionStore(localStorage, sessionStorage);
    } catch {
      // No persistent authentication when browser storage is unavailable.
    }
  }

  public getCurrentUser(): AuthUser | null {
    if (!this.currentUser) {
      this.currentUser = this.session?.read() ?? null;
    }
    return this.currentUser;
  }

  public get sessionExpired(): boolean {
    return this.session?.expired ?? false;
  }

  public registerActivity(): AuthUser | null {
    return this.session?.touch() ?? null;
  }

  public remainingIdleTime(): number {
    return this.session?.remaining() ?? 0;
  }

  /**
   * Inicia sesión autenticando contra el backend REST (NestJS /auth/login)
   * y guarda el token JWT en el SessionStore.
   */
  public async login(credentials: LoginCredentials): Promise<AuthUser> {
    const cleanId = credentials.identifier.trim();
    const cleanPass = credentials.password.trim();

    if (!cleanId || !cleanPass) {
      throw new Error('Por favor ingresa usuario y contraseña.');
    }

    const payload = {
      identifier: cleanId,
      password: cleanPass,
      recordar: credentials.recordar ?? true,
    };

    // Petición real al backend
    const response = await apiClient.post<LoginApiResponse>('/auth/login', payload);

    if (!response || !response.user || !response.token) {
      throw new Error('Respuesta inválida del servidor de autenticación.');
    }

    const { user, token } = response;
    this.currentUser = user;

    if (!this.session) {
      throw new Error('Permite el almacenamiento del navegador para iniciar sesión.');
    }

    this.session.save(user, credentials.recordar ?? true, token);
    return user;
  }

  /**
   * Consulta el usuario autenticado actualmente desde el backend mediante el Bearer Token.
   */
  public async fetchCurrentUser(): Promise<AuthUser | null> {
    try {
      const user = await apiClient.get<AuthUser>('/auth/me');
      this.currentUser = user;
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Cierra sesión notificando al backend y limpiando el almacenamiento local.
   */
  public async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Si la red falla, aseguramos el cierre de sesión local de todas formas
    } finally {
      this.currentUser = null;
      this.session?.clear();
    }
  }

  public getDemoUsers() {
    return DEMO_USERS;
  }
}

export const authService = new AuthService();
