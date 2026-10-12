import { AuthUser, LoginCredentials } from '../types/auth.types';
import { SessionStore } from './sessionStore';


// Usuarios predefinidos de prueba alineados con el proyecto de innovación
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
    id: 'user-super',
    username: 'supervisor',
    email: 'supervisor@kipus.pe',
    password: 'super123',
    nombreCompleto: 'Terry Pastor (Almacén & Kardex)',
    rol: 'SUPERVISOR',
    sucursal: 'Almacén 01 - Tingo María',
    avatarInitials: 'TP',
    descripcion: 'Control de inventario, stock y recepción de compras',
  },
];

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
    this.currentUser = this.session?.read() ?? null;
    return this.currentUser;
  }

  public get sessionExpired(): boolean { return this.session?.expired ?? false; }

  public registerActivity(): AuthUser | null { return this.session?.touch() ?? null; }

  public remainingIdleTime(): number { return this.session?.remaining() ?? 0; }

  public async login(credentials: LoginCredentials): Promise<AuthUser> {
    // Simulación de latencia de red para experiencia realista
    await new Promise((resolve) => setTimeout(resolve, 600));

    const cleanId = credentials.identifier.trim().toLowerCase();
    const cleanPass = credentials.password.trim();

    // Consultar lista dinámica de usuarios guardados en localStorage
    let storedUsers: any[] = [];
    try {
      const stored = localStorage.getItem('kipus_erp_users_list');
      if (stored) {
        storedUsers = JSON.parse(stored);
      }
    } catch {
      storedUsers = [];
    }

    const allUsers = [...storedUsers, ...DEMO_USERS];

    const matched = allUsers.find(
      (u) =>
        (u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId) &&
        u.password === cleanPass
    );

    if (!matched) {
      // También permitir acceso si usa credenciales genéricas (para que nadie se quede bloqueado)
      if (cleanPass === 'admin123' || cleanPass === '123456') {
        const fallbackUser: AuthUser = {
          id: 'user-custom',
          username: cleanId || 'usuario',
          email: `${cleanId || 'usuario'}@kipus.pe`,
          nombreCompleto: 'Usuario Administrador',
          rol: 'ADMINISTRADOR',
          sucursal: 'Sede Central - Tingo María',
          avatarInitials: 'US',
        };
        this.saveSession(fallbackUser, credentials.recordar);
        return fallbackUser;
      }
      throw new Error('Credenciales incorrectas. Verifica tu usuario y contraseña.');
    }

    if (matched.estado === 'INACTIVO') {
      throw new Error('Esta cuenta de usuario ha sido desactivada por el administrador.');
    }

    const { password, descripcion, ...authUser } = matched;
    this.saveSession(authUser, credentials.recordar);
    return authUser;
  }

  public logout(): void {
    this.currentUser = null;
    this.session?.clear();
  }

  private saveSession(user: AuthUser, recordar: boolean = true): void {
    this.currentUser = user;
    const dummyToken = `kipus-token-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    if (!this.session) throw new Error('Permite el almacenamiento del navegador para iniciar sesión.');
    this.session.save(user, recordar, dummyToken);
  }

  public getDemoUsers() {
    return DEMO_USERS;
  }
}

export const authService = new AuthService();
