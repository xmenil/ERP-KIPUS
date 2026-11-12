import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './authService';
import { apiClient } from '@/services/api/apiClient';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
    key: (index) => [...values.keys()][index] ?? null,
  };
}

describe('AuthService Integration & Methods', () => {
  let authService: AuthService;

  beforeEach(() => {
    (globalThis as any).localStorage = memoryStorage();
    (globalThis as any).sessionStorage = memoryStorage();
    vi.restoreAllMocks();
    authService = new AuthService();
  });

  it('debe autenticar correctamente con el backend y persistir sesión y token', async () => {
    const fakeUser = {
      id: 'uuid-1234',
      username: 'admin',
      email: 'admin@kipus.pe',
      nombreCompleto: 'Darwin Namuche (Administrador)',
      rol: 'ADMINISTRADOR' as const,
      sucursal: 'Sede Central - Tingo María',
      avatarInitials: 'DN',
    };
    const fakeToken = 'jwt.header.payload';

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      user: fakeUser,
      token: fakeToken,
    });

    const user = await authService.login({
      identifier: 'admin',
      password: 'admin123',
      recordar: true,
    });

    expect(postSpy).toHaveBeenCalledWith('/auth/login', {
      identifier: 'admin',
      password: 'admin123',
      recordar: true,
    });
    expect(user).toEqual(fakeUser);
    expect(authService.getCurrentUser()).toEqual(fakeUser);
  });

  it('debe rechazar credenciales vacías antes de llamar a la red', async () => {
    const postSpy = vi.spyOn(apiClient, 'post');

    await expect(
      authService.login({ identifier: '', password: '' })
    ).rejects.toThrow('Por favor ingresa usuario y contraseña.');

    expect(postSpy).not.toHaveBeenCalled();
  });

  it('debe cerrar sesión y limpiar sesión local', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({});
    await authService.logout();

    expect(postSpy).toHaveBeenCalledWith('/auth/logout');
    expect(authService.getCurrentUser()).toBeNull();
  });
});
