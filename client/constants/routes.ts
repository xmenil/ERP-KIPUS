/**
 * Definición centralizada de rutas para KIPU'S ERP.
 * Evita cadenas mágicas (magic strings) dispersas por el código.
 */

export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  VENTAS: '/ventas',
  PRODUCTOS: '/productos', // Redirige a /inventario
  INVENTARIO: '/inventario',
  COMPRAS: '/compras',
  CLIENTES: '/clientes',
  PROVEEDORES: '/proveedores', // Redirige a /compras?tab=proveedores
  GASTOS: '/gastos',
  CAJA: '/caja', // Redirige a /ventas?tab=caja
  REPORTES: '/reportes',
  KIPUS_IA: '/kipus-ia', // Redirige a /reportes?tab=ia
  USUARIOS: '/usuarios', // Redirige a /administracion?tab=usuarios
  CONFIGURACION: '/configuracion', // Redirige a /administracion?tab=configuracion
  ADMINISTRACION: '/administracion',
} as const;

export type AppRoute = typeof APP_ROUTES[keyof typeof APP_ROUTES];

export interface NavigationItem {
  name: string;
  path: string;
  iconName: string;
  badge?: string;
  description?: string;
}

/**
 * Genera el menú de navegación específico para cada rol:
 *
 * 1. Dueño / Administrador:
 *    - Inicio
 *    - Ventas y caja
 *    - Inventario
 *    - Compras y proveedores
 *    - Gastos y clientes
 *    - Reportes
 *    - Administración
 *
 * 2. Almacenero:
 *    - Inicio
 *    - Inventario
 *    - Compras y proveedores
 *    - Reportes de inventario
 *
 * 3. Cajero:
 *    - Inicio
 *    - Ventas y caja
 *    - Clientes
 */
export const getNavigationItemsForRole = (rol?: string): NavigationItem[] => {
  if (rol === 'CAJERO') {
    return [
      {
        name: 'Inicio',
        path: APP_ROUTES.DASHBOARD,
        iconName: 'LayoutDashboard',
        description: 'Resumen de ventas y turno activo',
      },
      {
        name: 'Ventas y caja',
        path: APP_ROUTES.VENTAS,
        iconName: 'ShoppingCart',
        description: 'Punto de venta y operación de turno',
      },
      {
        name: 'Clientes',
        path: APP_ROUTES.CLIENTES,
        iconName: 'Users',
        description: 'Directorio y consulta básica de clientes',
      },
    ];
  }

  if (rol === 'ALMACENERO' || rol === 'SUPERVISOR') {
    return [
      {
        name: 'Inicio',
        path: APP_ROUTES.DASHBOARD,
        iconName: 'LayoutDashboard',
        description: 'Resumen operativo de almacén',
      },
      {
        name: 'Inventario',
        path: APP_ROUTES.INVENTARIO,
        iconName: 'Warehouse',
        description: 'Existencias, movimientos, conteos y alertas',
      },
      {
        name: 'Compras y proveedores',
        path: APP_ROUTES.COMPRAS,
        iconName: 'Truck',
        description: 'Recepción de mercadería y consulta de órdenes',
      },
      {
        name: 'Reportes de inventario',
        path: APP_ROUTES.REPORTES,
        iconName: 'BarChart3',
        description: 'Indicadores de stock, rotación y valorizado',
      },
    ];
  }

  // Por defecto: Dueño / Administrador
  return [
    {
      name: 'Inicio',
      path: APP_ROUTES.DASHBOARD,
      iconName: 'LayoutDashboard',
      description: 'Resumen general del negocio',
    },
    {
      name: 'Ventas y caja',
      path: APP_ROUTES.VENTAS,
      iconName: 'ShoppingCart',
      description: 'Registro de ventas, comprobantes y cuadre de caja',
    },
    {
      name: 'Inventario',
      path: APP_ROUTES.INVENTARIO,
      iconName: 'Warehouse',
      description: 'Catálogo de productos, existencias y movimientos',
    },
    {
      name: 'Compras y proveedores',
      path: APP_ROUTES.COMPRAS,
      iconName: 'Truck',
      description: 'Órdenes de compra y gestión de proveedores',
    },
    {
      name: 'Gastos y clientes',
      path: APP_ROUTES.GASTOS,
      iconName: 'Receipt',
      description: 'Control de gastos operativos y gestión de clientes',
    },
    {
      name: 'Reportes',
      path: APP_ROUTES.REPORTES,
      iconName: 'BarChart3',
      description: 'Reportes, indicadores e inteligencia KIPU\'S IA',
    },
    {
      name: 'Administración',
      path: APP_ROUTES.ADMINISTRACION,
      iconName: 'ShieldCheck',
      description: 'Usuarios, roles, sucursales y configuración',
    },
  ];
};

export const NAVIGATION_ITEMS = getNavigationItemsForRole('ADMINISTRADOR');
