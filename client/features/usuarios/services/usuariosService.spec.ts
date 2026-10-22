import { afterEach, describe, expect, it, vi } from 'vitest';
import { usuariosService } from './usuariosService';
import { readUsers, USUARIOS_STORAGE_KEY } from './usuariosStorage';

function useMemoryStorage() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
  };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { dispatchEvent: vi.fn() } });
  return { storage, values };
}

const payload = { nombreCompleto: 'María Torres', username: '  MARIA.T  ', email: ' Maria@Kipus.pe ', rol: 'CAJERO' as const, sucursal: 'Sede Central', password: 'clave123' };

afterEach(() => { vi.restoreAllMocks(); });

describe('usuariosService', () => {
  it('usa cuentas demo si no existe clave y conserva el contenido ilegible', () => {
    const { storage, values } = useMemoryStorage();
    expect(readUsers()).toHaveLength(3);
    storage.setItem(USUARIOS_STORAGE_KEY, '{ilegible');
    expect(() => readUsers()).toThrow(/Se conservaron/);
    expect(values.get(USUARIOS_STORAGE_KEY)).toBe('{ilegible');
  });

  it('normaliza cuentas nuevas, oculta contraseñas en consultas y rechaza duplicados', async () => {
    useMemoryStorage();
    const created = await usuariosService.crearUsuario(payload);
    expect(created.username).toBe('maria.t');
    expect(created.email).toBe('maria@kipus.pe');
    expect(created.password).toBeUndefined();
    await expect(usuariosService.crearUsuario({ ...payload, username: 'MARIA.T' })).rejects.toThrow(/ya está registrado/);
  });

  it('propaga fallo de escritura y no anuncia ni publica el nuevo usuario', async () => {
    const { storage, values } = useMemoryStorage();
    storage.setItem(USUARIOS_STORAGE_KEY, JSON.stringify(readUsers()));
    const before = values.get(USUARIOS_STORAGE_KEY);
    vi.spyOn(storage, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    await expect(usuariosService.crearUsuario(payload)).rejects.toThrow(/No se pudieron guardar/);
    expect(values.get(USUARIOS_STORAGE_KEY)).toBe(before);
  });

  it('impide desactivar o retirar al último administrador activo', async () => {
    const { storage } = useMemoryStorage();
    storage.setItem(USUARIOS_STORAGE_KEY, JSON.stringify([{
      id: 'only-admin', username: 'root', email: 'root@example.pe', password: 'secret1', nombreCompleto: 'Admin Uno', rol: 'ADMINISTRADOR', sucursal: 'Central', avatarInitials: 'AU', estado: 'ACTIVO', createdAt: '2026-01-01T00:00:00Z',
    }]));
    await expect(usuariosService.toggleEstadoUsuario('only-admin')).rejects.toThrow(/al menos un administrador/);
    await expect(usuariosService.eliminarUsuario('only-admin')).rejects.toThrow(/al menos un administrador/);
  });
});
