import { AuthUser, LoginCredentials } from '../types/auth.types';
import { SessionStore } from './sessionStore';
import { DEMO_ACCOUNTS, normalizeLogin, readUsers } from '@/features/usuarios/services/usuariosStorage';

export const DEMO_USERS = DEMO_ACCOUNTS.map(user => ({ ...user, password: user.password || '', descripcion: user.descripcion || '' }));

export class AuthService {
  private session: SessionStore | null = null;
  private currentUser: AuthUser | null = null;
  constructor() {
    try { this.session = new SessionStore(localStorage, sessionStorage); } catch { /* Browser storage is unavailable. */ }
  }
  public getCurrentUser(): AuthUser | null {
    const sessionUser = this.session?.read() ?? null;
    if (!sessionUser) { this.currentUser = null; return null; }
    try {
      const users = readUsers();
      const current = users.find(user => user.id === sessionUser.id);
      if (!current || current.estado !== 'ACTIVO') { this.logout(); return null; }
      const refreshed: AuthUser = { id: current.id, username: current.username, email: current.email, nombreCompleto: current.nombreCompleto, rol: current.rol, sucursal: current.sucursal, avatarInitials: current.avatarInitials };
      this.session?.replaceUser(refreshed);
      this.currentUser = refreshed;
      return refreshed;
    } catch {
      this.logout();
      return null;
    }
  }
  public get sessionExpired(): boolean { return this.session?.expired ?? false; }
  public registerActivity(): AuthUser | null { return this.session?.touch() ?? null; }
  public remainingIdleTime(): number { return this.session?.remaining() ?? 0; }
  public async login(credentials: LoginCredentials): Promise<AuthUser> {
    await new Promise(resolve => setTimeout(resolve, 250));
    const identifier = normalizeLogin(credentials.identifier);
    let users;
    try { users = readUsers(); }
    catch (error) { throw error instanceof Error ? error : new Error('No se pudo leer el directorio de usuarios.'); }
    const matched = users.find(user => normalizeLogin(user.username) === identifier || normalizeLogin(user.email) === identifier);
    if (matched && matched.estado !== 'ACTIVO') throw new Error('Esta cuenta está desactivada. Pide al administrador que revise su estado.');
    if (!matched || !matched.password || matched.password !== credentials.password) throw new Error('Usuario o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.');
    const { password: _password, descripcion: _descripcion, telefono: _telefono, estado: _estado, ultimoAcceso: _ultimoAcceso, createdAt: _createdAt, ...authUser } = matched;
    this.saveSession(authUser, credentials.recordar);
    return authUser;
  }
  public logout(): void { this.currentUser = null; this.session?.clear(); }
  private saveSession(user: AuthUser, remember = true): void {
    this.currentUser = user;
    const token = `kipus-local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (!this.session) throw new Error('Permite el almacenamiento del navegador para iniciar sesión.');
    this.session.save(user, remember, token);
  }
  public getDemoUsers() { return DEMO_USERS; }
}

export const authService = new AuthService();
