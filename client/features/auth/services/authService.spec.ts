import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './authService';
import { usuariosService } from '@/features/usuarios/services/usuariosService';
import { USUARIOS_STORAGE_KEY } from '@/features/usuarios/services/usuariosStorage';

function storage() {
  const map = new Map<string, string>();
  return { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); }, removeItem: (key: string) => { map.delete(key); }, clear: () => map.clear() };
}

function setup() {
  const local = storage(); const session = storage();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: local });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: session });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { dispatchEvent: vi.fn() } });
  return { local, session };
}

afterEach(() => vi.restoreAllMocks());

describe('AuthService con el directorio local', () => {
  it('permite alta e ingreso; aplica cambios de rol y desactivación a la sesión abierta', async () => {
    setup();
    const created = await usuariosService.crearUsuario({ nombreCompleto: 'Ana Torres', username: 'ana.t', email: 'ana@example.pe', rol: 'CAJERO', sucursal: 'Central', password: 'secreto1' });
    const auth = new AuthService();
    const signedIn = await auth.login({ identifier: ' ANA@EXAMPLE.PE ', password: 'secreto1', recordar: false });
    expect(signedIn.id).toBe(created.id);
    expect(signedIn.rol).toBe('CAJERO');
    await usuariosService.actualizarUsuario(created.id, { rol: 'SUPERVISOR' });
    expect(auth.getCurrentUser()?.rol).toBe('SUPERVISOR');
    await usuariosService.actualizarUsuario(created.id, { estado: 'INACTIVO' });
    expect(auth.getCurrentUser()).toBeNull();
  });

  it('no acepta contraseñas genéricas ni habilita una cuenta demo desactivada', async () => {
    const { local } = setup();
    local.setItem(USUARIOS_STORAGE_KEY, JSON.stringify([
      { id: 'user-admin', username: 'admin', email: 'admin@kipus.pe', password: 'admin123', nombreCompleto: 'Admin', rol: 'ADMINISTRADOR', sucursal: 'Central', avatarInitials: 'AD', estado: 'ACTIVO', createdAt: '2026-01-01' },
      { id: 'user-caja', username: 'caja', email: 'caja@kipus.pe', password: 'caja123', nombreCompleto: 'Caja', rol: 'CAJERO', sucursal: 'Central', avatarInitials: 'CA', estado: 'INACTIVO', createdAt: '2026-01-01' },
    ]));
    const auth = new AuthService();
    await expect(auth.login({ identifier: 'desconocido', password: 'admin123' })).rejects.toThrow(/incorrectos/);
    await expect(auth.login({ identifier: 'caja', password: 'caja123' })).rejects.toThrow(/desactivada/);
  });
});
