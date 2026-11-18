/**
 * Sistema centralizado de roles y permisos para KIPU'S ERP.
 * Define las reglas de acceso a rutas y módulos según el rol del usuario autenticado.
 */

import { APP_ROUTES } from '@/constants/routes';

export type UserRole = 'SUPER_ADMIN' | 'ADMINISTRADOR' | 'CAJERO' | 'ALMACENERO' | 'SUPERVISOR';

export const isRoleSuperAdmin = (rol?: string): boolean => {
  return rol === 'SUPER_ADMIN';
};

export const isRoleAdmin = (rol?: string): boolean => {
  return rol === 'ADMINISTRADOR';
};

export const isRoleAlmacenero = (rol?: string): boolean => {
  return rol === 'ALMACENERO' || rol === 'SUPERVISOR';
};

export const isRoleCajero = (rol?: string): boolean => {
  return rol === 'CAJERO';
};

export const getRoleDisplayName = (rol?: string): string => {
  if (isRoleSuperAdmin(rol)) return 'Super Administrador';
  if (isRoleAdmin(rol)) return 'Dueño / Administrador';
  if (isRoleAlmacenero(rol)) return 'Almacenero';
  if (isRoleCajero(rol)) return 'Cajero';
  return 'Usuario';
};

/**
 * Valida si un rol tiene autorización para acceder a una ruta determinada.
 */
export const canAccessRoute = (pathname: string, rol?: string): boolean => {
  // Normalizar ruta quitando barras finales y parámetros
  const cleanPath = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';

  // Rutas públicas o universales (incluso sin sesión iniciada)
  if (cleanPath === APP_ROUTES.LOGIN || cleanPath === APP_ROUTES.REGISTER) return true;

  if (!rol) return false;

  // Ruta exclusiva de Super Admin
  if (cleanPath === APP_ROUTES.SUPER_ADMIN) {
    return isRoleSuperAdmin(rol);
  }

  // Si es Super Admin, tiene acceso total a la plataforma
  if (isRoleSuperAdmin(rol)) {
    return true;
  }

  if (cleanPath === APP_ROUTES.HOME || cleanPath === APP_ROUTES.DASHBOARD) return true;

  // 1. DUEÑO / ADMINISTRADOR: Acceso completo a todos los módulos autorizados de la tienda
  if (isRoleAdmin(rol)) {
    return true;
  }

  // 2. ALMACENERO:
  // Permitido: Inicio, Inventario, Compras y proveedores (recepción y consulta), Reportes de inventario
  // Bloqueado: Ventas, Caja, Gastos, Clientes, Administración, Configuración, Usuarios
  if (isRoleAlmacenero(rol)) {
    const allowedRoots = [
      APP_ROUTES.INVENTARIO,
      APP_ROUTES.PRODUCTOS, // Redirige a /inventario
      APP_ROUTES.COMPRAS,
      APP_ROUTES.PROVEEDORES, // Redirige a /compras?tab=proveedores
      APP_ROUTES.REPORTES,
    ];

    return allowedRoots.some(
      (root) => cleanPath === root || cleanPath.startsWith(`${root}/`)
    );
  }

  // 3. CAJERO:
  // Permitido: Inicio, Ventas y caja, Clientes (registro y consulta básica)
  // Bloqueado: Inventario, Productos, Compras, Proveedores, Gastos, Reportes, Administración, Usuarios, Configuración
  if (isRoleCajero(rol)) {
    const allowedRoots = [
      APP_ROUTES.VENTAS,
      APP_ROUTES.CAJA, // Redirige a /ventas?tab=caja
      APP_ROUTES.CLIENTES,
    ];

    return allowedRoots.some(
      (root) => cleanPath === root || cleanPath.startsWith(`${root}/`)
    );
  }

  return false;
};

