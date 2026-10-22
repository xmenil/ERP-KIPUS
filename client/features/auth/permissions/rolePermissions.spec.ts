import { describe, expect, it } from 'vitest';
import { canAccessPath, defaultRouteForRole } from './rolePermissions';
import { APP_ROUTES } from '@/constants/routes';

describe('permisos locales por rol', () => {
  it('permite rutas del rol y bloquea tanto URL directa como navegación no autorizada', () => {
    expect(canAccessPath('CAJERO', APP_ROUTES.VENTAS)).toBe(true);
    expect(canAccessPath('CAJERO', APP_ROUTES.USUARIOS)).toBe(false);
    expect(canAccessPath('SUPERVISOR', APP_ROUTES.COMPRAS)).toBe(true);
    expect(canAccessPath('SUPERVISOR', APP_ROUTES.GASTOS)).toBe(false);
    expect(canAccessPath('ADMINISTRADOR', APP_ROUTES.CONFIGURACION)).toBe(true);
  });
  it('dirige a cada rol a una ruta permitida', () => {
    expect(canAccessPath('CAJERO', defaultRouteForRole('CAJERO'))).toBe(true);
    expect(canAccessPath('SUPERVISOR', defaultRouteForRole('SUPERVISOR'))).toBe(true);
    expect(canAccessPath('ADMINISTRADOR', defaultRouteForRole('ADMINISTRADOR'))).toBe(true);
  });
});
