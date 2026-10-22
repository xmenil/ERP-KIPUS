import { APP_ROUTES, AppRoute } from '@/constants/routes';
import type { UserRole } from '../types/auth.types';

const routesByRole: Record<UserRole, readonly AppRoute[]> = {
  ADMINISTRADOR: Object.values(APP_ROUTES).filter((path): path is AppRoute => path !== APP_ROUTES.LOGIN),
  CAJERO: [APP_ROUTES.DASHBOARD, APP_ROUTES.VENTAS, APP_ROUTES.CAJA, APP_ROUTES.CLIENTES],
  SUPERVISOR: [APP_ROUTES.DASHBOARD, APP_ROUTES.PRODUCTOS, APP_ROUTES.INVENTARIO, APP_ROUTES.COMPRAS, APP_ROUTES.PROVEEDORES, APP_ROUTES.CLIENTES],
};

export function canAccessPath(role: UserRole | undefined, pathname: string): boolean {
  if (!role) return false;
  const path = pathname === APP_ROUTES.HOME ? APP_ROUTES.DASHBOARD : pathname;
  return routesByRole[role].some(route => path === route || (route !== APP_ROUTES.DASHBOARD && path.startsWith(`${route}/`)));
}

export function defaultRouteForRole(role: UserRole): AppRoute {
  return role === 'CAJERO' ? APP_ROUTES.VENTAS : role === 'SUPERVISOR' ? APP_ROUTES.INVENTARIO : APP_ROUTES.DASHBOARD;
}
