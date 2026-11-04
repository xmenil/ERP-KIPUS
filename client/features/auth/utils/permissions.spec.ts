import { describe, it, expect } from 'vitest';
import {
  isRoleAdmin,
  isRoleAlmacenero,
  isRoleCajero,
  getRoleDisplayName,
  canAccessRoute,
} from './permissions';
import { getNavigationItemsForRole, APP_ROUTES } from '@/constants/routes';

describe('Permisos y Roles de Usuario en KIPU\'S ERP', () => {
  it('identifica correctamente al rol Administrador / Dueño', () => {
    expect(isRoleAdmin('ADMINISTRADOR')).toBe(true);
    expect(isRoleAdmin('CAJERO')).toBe(false);
    expect(isRoleAdmin('ALMACENERO')).toBe(false);
    expect(isRoleAdmin(undefined)).toBe(false);
  });

  it('identifica correctamente al rol Almacenero', () => {
    expect(isRoleAlmacenero('ALMACENERO')).toBe(true);
    expect(isRoleAlmacenero('SUPERVISOR')).toBe(true);
    expect(isRoleAlmacenero('ADMINISTRADOR')).toBe(false);
    expect(isRoleAlmacenero('CAJERO')).toBe(false);
  });

  it('identifica correctamente al rol Cajero', () => {
    expect(isRoleCajero('CAJERO')).toBe(true);
    expect(isRoleCajero('ADMINISTRADOR')).toBe(false);
    expect(isRoleCajero('ALMACENERO')).toBe(false);
  });

  it('obtiene nombres amigables de roles', () => {
    expect(getRoleDisplayName('ADMINISTRADOR')).toBe('Dueño / Administrador');
    expect(getRoleDisplayName('ALMACENERO')).toBe('Almacenero');
    expect(getRoleDisplayName('CAJERO')).toBe('Cajero');
  });

  describe('Control de acceso a rutas canAccessRoute', () => {
    it('permite al Administrador acceder a todos los módulos', () => {
      expect(canAccessRoute(APP_ROUTES.DASHBOARD, 'ADMINISTRADOR')).toBe(true);
      expect(canAccessRoute(APP_ROUTES.VENTAS, 'ADMINISTRADOR')).toBe(true);
      expect(canAccessRoute(APP_ROUTES.INVENTARIO, 'ADMINISTRADOR')).toBe(true);
      expect(canAccessRoute(APP_ROUTES.COMPRAS, 'ADMINISTRADOR')).toBe(true);
      expect(canAccessRoute(APP_ROUTES.GASTOS, 'ADMINISTRADOR')).toBe(true);
      expect(canAccessRoute(APP_ROUTES.REPORTES, 'ADMINISTRADOR')).toBe(true);
      expect(canAccessRoute(APP_ROUTES.ADMINISTRACION, 'ADMINISTRADOR')).toBe(true);
    });

    it('restringe las rutas del Almacenero a Inicio, Inventario, Compras y Reportes', () => {
      expect(canAccessRoute(APP_ROUTES.DASHBOARD, 'ALMACENERO')).toBe(true);
      expect(canAccessRoute(APP_ROUTES.INVENTARIO, 'ALMACENERO')).toBe(true);
      expect(canAccessRoute(APP_ROUTES.COMPRAS, 'ALMACENERO')).toBe(true);
      expect(canAccessRoute(APP_ROUTES.REPORTES, 'ALMACENERO')).toBe(true);

      // Rutas prohibidas para almacenero
      expect(canAccessRoute(APP_ROUTES.VENTAS, 'ALMACENERO')).toBe(false);
      expect(canAccessRoute(APP_ROUTES.GASTOS, 'ALMACENERO')).toBe(false);
      expect(canAccessRoute(APP_ROUTES.CLIENTES, 'ALMACENERO')).toBe(false);
      expect(canAccessRoute(APP_ROUTES.ADMINISTRACION, 'ALMACENERO')).toBe(false);
    });

    it('restringe las rutas del Cajero a Inicio, Ventas y Clientes', () => {
      expect(canAccessRoute(APP_ROUTES.DASHBOARD, 'CAJERO')).toBe(true);
      expect(canAccessRoute(APP_ROUTES.VENTAS, 'CAJERO')).toBe(true);
      expect(canAccessRoute(APP_ROUTES.CLIENTES, 'CAJERO')).toBe(true);

      // Rutas prohibidas para cajero
      expect(canAccessRoute(APP_ROUTES.INVENTARIO, 'CAJERO')).toBe(false);
      expect(canAccessRoute(APP_ROUTES.COMPRAS, 'CAJERO')).toBe(false);
      expect(canAccessRoute(APP_ROUTES.GASTOS, 'CAJERO')).toBe(false);
      expect(canAccessRoute(APP_ROUTES.REPORTES, 'CAJERO')).toBe(false);
      expect(canAccessRoute(APP_ROUTES.ADMINISTRACION, 'CAJERO')).toBe(false);
    });
  });

  describe('Menú dinámico según el rol (getNavigationItemsForRole)', () => {
    it('genera exactamente 7 opciones para Dueño / Administrador', () => {
      const items = getNavigationItemsForRole('ADMINISTRADOR');
      expect(items).toHaveLength(7);
      const names = items.map((i) => i.name);
      expect(names).toEqual([
        'Inicio',
        'Ventas y caja',
        'Inventario',
        'Compras y proveedores',
        'Gastos y clientes',
        'Reportes',
        'Administración',
      ]);
    });

    it('genera exactamente 4 opciones para Almacenero', () => {
      const items = getNavigationItemsForRole('ALMACENERO');
      expect(items).toHaveLength(4);
      const names = items.map((i) => i.name);
      expect(names).toEqual([
        'Inicio',
        'Inventario',
        'Compras y proveedores',
        'Reportes de inventario',
      ]);
    });

    it('genera exactamente 3 opciones para Cajero', () => {
      const items = getNavigationItemsForRole('CAJERO');
      expect(items).toHaveLength(3);
      const names = items.map((i) => i.name);
      expect(names).toEqual(['Inicio', 'Ventas y caja', 'Clientes']);
    });
  });
});
