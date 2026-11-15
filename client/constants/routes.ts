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

export interface NavigationSubItem {
  name: string;
  path: string;
  iconName?: string;
  tabKey?: string;
  badge?: string;
}

export interface NavigationItem {
  name: string;
  path: string;
  iconName: string;
  badge?: string;
  description?: string;
  subItems?: NavigationSubItem[];
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
        subItems: [
          { name: 'Punto de Venta (POS)', path: '/ventas?tab=pos', tabKey: 'pos', iconName: 'ShoppingCart' },
          { name: 'Historial de Comprobantes', path: '/ventas?tab=historial', tabKey: 'historial', iconName: 'Receipt' },
          { name: 'Caja y Turnos', path: '/ventas?tab=caja', tabKey: 'caja', iconName: 'DollarSign' },
          { name: 'Pedidos y Cotizaciones', path: '/ventas?tab=pedidos', tabKey: 'pedidos', iconName: 'FileText' },
        ],
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
        subItems: [
          { name: 'Catálogo de Productos', path: '/inventario?tab=catalogo', tabKey: 'catalogo', iconName: 'Package' },
          { name: 'Control de Stock y Ajustes', path: '/inventario?tab=stock', tabKey: 'stock', iconName: 'Warehouse' },
          { name: 'Kardex y Movimientos', path: '/inventario?tab=kardex', tabKey: 'kardex', iconName: 'ArrowLeftRight' },
          { name: 'Categorías y Unidades', path: '/inventario?tab=categorias', tabKey: 'categorias', iconName: 'Tags' },
        ],
      },
      {
        name: 'Compras y proveedores',
        path: APP_ROUTES.COMPRAS,
        iconName: 'Truck',
        description: 'Recepción de mercadería y consulta de órdenes',
        subItems: [
          { name: 'Recepción de Mercadería', path: '/compras?tab=recepcion', tabKey: 'recepcion', iconName: 'PackageCheck' },
          { name: 'Órdenes de Compra', path: '/compras?tab=ordenes', tabKey: 'ordenes', iconName: 'ClipboardList' },
        ],
      },
      {
        name: 'Reportes de inventario',
        path: APP_ROUTES.REPORTES,
        iconName: 'BarChart3',
        description: 'Indicadores de stock, rotación y valorizado',
        subItems: [
          { name: 'Valorización de Stock', path: '/reportes?tab=valorizacion', tabKey: 'valorizacion', iconName: 'BarChart3' },
          { name: 'Kardex y Movimientos', path: '/inventario?tab=kardex', tabKey: 'kardex', iconName: 'ArrowLeftRight' },
        ],
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
      subItems: [
        { name: 'Punto de Venta (POS)', path: '/ventas?tab=pos', tabKey: 'pos', iconName: 'ShoppingCart' },
        { name: 'Historial de Comprobantes', path: '/ventas?tab=historial', tabKey: 'historial', iconName: 'Receipt' },
        { name: 'Caja y Turnos', path: '/ventas?tab=caja', tabKey: 'caja', iconName: 'DollarSign' },
        { name: 'Pedidos y Cotizaciones', path: '/ventas?tab=pedidos', tabKey: 'pedidos', iconName: 'FileText' },
      ],
    },
    {
      name: 'Inventario',
      path: APP_ROUTES.INVENTARIO,
      iconName: 'Warehouse',
      description: 'Catálogo de productos, existencias y movimientos',
      subItems: [
        { name: 'Catálogo de Productos', path: '/inventario?tab=catalogo', tabKey: 'catalogo', iconName: 'Package' },
        { name: 'Control de Stock y Ajustes', path: '/inventario?tab=stock', tabKey: 'stock', iconName: 'Warehouse' },
        { name: 'Kardex y Movimientos', path: '/inventario?tab=kardex', tabKey: 'kardex', iconName: 'ArrowLeftRight' },
        { name: 'Categorías y Unidades', path: '/inventario?tab=categorias', tabKey: 'categorias', iconName: 'Tags' },
      ],
    },
    {
      name: 'Compras y proveedores',
      path: APP_ROUTES.COMPRAS,
      iconName: 'Truck',
      description: 'Órdenes de compra y gestión de proveedores',
      subItems: [
        { name: 'Órdenes de Compra', path: '/compras?tab=ordenes', tabKey: 'ordenes', iconName: 'ClipboardList' },
        { name: 'Recepción de Mercadería', path: '/compras?tab=recepcion', tabKey: 'recepcion', iconName: 'PackageCheck' },
        { name: 'Directorio de Proveedores', path: '/compras?tab=proveedores', tabKey: 'proveedores', iconName: 'Building' },
        { name: 'Cuentas por Pagar', path: '/compras?tab=cuentas-pagar', tabKey: 'cuentas-pagar', iconName: 'Receipt' },
      ],
    },
    {
      name: 'Gastos y clientes',
      path: APP_ROUTES.GASTOS,
      iconName: 'Receipt',
      description: 'Control de gastos operativos y gestión de clientes',
      subItems: [
        { name: 'Gastos Operativos', path: '/gastos?tab=gastos', tabKey: 'gastos', iconName: 'Receipt' },
        { name: 'Directorio de Clientes', path: '/gastos?tab=clientes', tabKey: 'clientes', iconName: 'Users' },
        { name: 'Cuentas por Cobrar (Fiados)', path: '/gastos?tab=cuentas-cobrar', tabKey: 'cuentas-cobrar', iconName: 'CreditCard' },
      ],
    },
    {
      name: 'Reportes',
      path: APP_ROUTES.REPORTES,
      iconName: 'BarChart3',
      description: 'Reportes, indicadores e inteligencia KIPU\'S IA',
      subItems: [
        { name: 'Ventas y Rentabilidad', path: '/reportes?tab=ventas', tabKey: 'ventas', iconName: 'TrendingUp' },
        { name: 'Reportes SUNAT', path: '/reportes?tab=sunat', tabKey: 'sunat', iconName: 'FileCheck' },
        { name: 'Valorización de Stock', path: '/reportes?tab=valorizacion', tabKey: 'valorizacion', iconName: 'BarChart3' },
        { name: 'KIPU\'S IA', path: '/reportes?tab=ia', tabKey: 'ia', iconName: 'Sparkles' },
      ],
    },
    {
      name: 'Administración',
      path: APP_ROUTES.ADMINISTRACION,
      iconName: 'ShieldCheck',
      description: 'Usuarios, roles, sucursales y configuración',
      subItems: [
        { name: 'Usuarios y Roles', path: '/administracion?tab=usuarios', tabKey: 'usuarios', iconName: 'Users' },
        { name: 'Empresa y Sucursales', path: '/administracion?tab=empresa', tabKey: 'empresa', iconName: 'Building' },
        { name: 'Facturación y SUNAT', path: '/administracion?tab=sunat', tabKey: 'sunat', iconName: 'FileCheck' },
        { name: 'Hardware y POS', path: '/administracion?tab=hardware', tabKey: 'hardware', iconName: 'Printer' },
        { name: 'Parámetros del Sistema', path: '/administracion?tab=sistema', tabKey: 'sistema', iconName: 'Settings' },
      ],
    },
  ];
};

export const NAVIGATION_ITEMS = getNavigationItemsForRole('ADMINISTRADOR');
