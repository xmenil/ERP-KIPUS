/**
 * Definición centralizada de rutas para KIPU'S ERP.
 * Evita cadenas mágicas (magic strings) dispersas por el código.
 */

export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  VENTAS: '/ventas',
  PRODUCTOS: '/productos',
  INVENTARIO: '/inventario',
  COMPRAS: '/compras',
  CLIENTES: '/clientes',
  PROVEEDORES: '/proveedores',
  GASTOS: '/gastos',
  CAJA: '/caja',
  REPORTES: '/reportes',
  KIPUS_IA: '/kipus-ia',
  USUARIOS: '/usuarios',
  CONFIGURACION: '/configuracion',
} as const;

export type AppRoute = typeof APP_ROUTES[keyof typeof APP_ROUTES];

export interface NavigationItem {
  name: string;
  path: string;
  iconName: string;
  badge?: string;
  description?: string;
  category?: 'operaciones' | 'gestion' | 'inteligencia' | 'sistema';
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    name: 'Dashboard',
    path: APP_ROUTES.DASHBOARD,
    iconName: 'LayoutDashboard',
    category: 'gestion',
    description: 'Resumen ejecutivo y métricas del negocio',
  },
  {
    name: 'Ventas',
    path: APP_ROUTES.VENTAS,
    iconName: 'ShoppingCart',
    category: 'operaciones',
    description: 'Comprobantes, POS y control de facturación',
  },
  {
    name: 'Productos',
    path: APP_ROUTES.PRODUCTOS,
    iconName: 'Package',
    category: 'gestion',
    description: 'Catálogo de artículos, precios y categorías',
  },
  {
    name: 'Inventario',
    path: APP_ROUTES.INVENTARIO,
    iconName: 'Warehouse',
    category: 'gestion',
    description: 'Stock por almacén, kardex y alertas',
  },
  {
    name: 'Caja',
    path: APP_ROUTES.CAJA,
    iconName: 'DollarSign',
    category: 'operaciones',
    description: 'Apertura, cierre y control de efectivo diario',
  },
  {
    name: 'Gastos',
    path: APP_ROUTES.GASTOS,
    iconName: 'Receipt',
    category: 'operaciones',
    description: 'Egresos operativos y comprobantes de gasto',
  },
  {
    name: 'Compras',
    path: APP_ROUTES.COMPRAS,
    iconName: 'Truck',
    category: 'operaciones',
    description: 'Órdenes de compra y recepción de mercadería',
  },
  {
    name: 'Clientes',
    path: APP_ROUTES.CLIENTES,
    iconName: 'Users',
    category: 'gestion',
    description: 'Directorio y cuentas corrientes comerciales',
  },
  {
    name: 'Proveedores',
    path: APP_ROUTES.PROVEEDORES,
    iconName: 'Building2',
    category: 'gestion',
    description: 'Gestión y contactos de abastecimiento',
  },
  {
    name: 'Reportes',
    path: APP_ROUTES.REPORTES,
    iconName: 'BarChart3',
    category: 'gestion',
    description: 'Análisis de rentabilidad y reportes tributarios',
  },
  {
    name: 'KIPU\'S IA',
    path: APP_ROUTES.KIPUS_IA,
    iconName: 'Sparkles',
    badge: 'Beta',
    category: 'inteligencia',
    description: 'Asistente predictivo de abastecimiento y ventas',
  },
  {
    name: 'Usuarios',
    path: APP_ROUTES.USUARIOS,
    iconName: 'ShieldCheck',
    category: 'sistema',
    description: 'Gestión de cuentas, roles de acceso y credenciales',
  },
  {
    name: 'Configuración',
    path: APP_ROUTES.CONFIGURACION,
    iconName: 'Settings',
    category: 'sistema',
    description: 'Datos de la empresa, series y preferencias',
  },
];
