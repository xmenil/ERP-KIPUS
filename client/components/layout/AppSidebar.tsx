import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  DollarSign,
  Receipt,
  Truck,
  Users,
  Building2,
  BarChart3,
  Sparkles,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { APP_ROUTES } from '@/constants/routes';

interface NavItemConfig {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const gestionItems: NavItemConfig[] = [
  { name: 'Dashboard', path: APP_ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: 'Ventas', path: APP_ROUTES.VENTAS, icon: ShoppingCart },
  { name: 'Productos', path: APP_ROUTES.PRODUCTOS, icon: Package },
  { name: 'Inventario', path: APP_ROUTES.INVENTARIO, icon: Warehouse },
];

const operacionesItems: NavItemConfig[] = [
  { name: 'Caja', path: APP_ROUTES.CAJA, icon: DollarSign },
  { name: 'Gastos', path: APP_ROUTES.GASTOS, icon: Receipt },
  { name: 'Compras', path: APP_ROUTES.COMPRAS, icon: Truck },
  { name: 'Proveedores', path: APP_ROUTES.PROVEEDORES, icon: Building2 },
  { name: 'Clientes', path: APP_ROUTES.CLIENTES, icon: Users },
];

const inteligenciaItems: NavItemConfig[] = [
  { name: 'Reportes', path: APP_ROUTES.REPORTES, icon: BarChart3 },
  { name: 'KIPU\'S IA', path: APP_ROUTES.KIPUS_IA, icon: Sparkles, badge: 'IA' },
];

const sistemaItems: NavItemConfig[] = [
  { name: 'Usuarios', path: APP_ROUTES.USUARIOS, icon: ShieldCheck },
  { name: 'Configuración', path: APP_ROUTES.CONFIGURACION, icon: Settings },
];

export const AppSidebar: React.FC = () => {
  const location = useLocation();

  const renderNavGroup = (title: string, items: NavItemConfig[]) => (
    <SidebarGroup className="py-1 px-2">
      <SidebarGroupLabel className="text-[10.5px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold px-2 h-6 select-none">
        {title}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== APP_ROUTES.DASHBOARD && location.pathname.startsWith(item.path));

            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.name}
                  className={`h-8 px-2.5 rounded font-medium text-[13px] transition-colors ${
                    isActive
                      ? '!bg-primary !text-primary-foreground font-semibold shadow-xs'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 hover:text-slate-900'
                  }`}
                >
                  <Link to={item.path} className="flex items-center gap-2.5 w-full">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <SidebarMenuBadge className="ml-auto bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-[10px] px-1.5 py-0.2 rounded border border-amber-500/30">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar select-none">
      {/* Encabezado del ERP estilo Desktop Software */}
      <SidebarHeader className="border-b border-border p-3">
        {/* Vista expandida: Logo oficial Kipus + ERP PRO */}
        <div className="flex flex-col gap-1 items-center group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-center gap-1 whitespace-nowrap">
            <img
              src="/kipus-logo.png"
              alt="Kipu's"
              className="h-11 w-auto object-contain shrink-0 dark:brightness-110"
            />

            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
              PRO
            </span>
          </div>
        </div>

        {/* Vista colapsada (icon mode): Isotipo centrado */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center">
          <div className="flex h-8 w-10 items-center justify-center rounded-lg dark:bg-muted/40 border border-border/80 p-1 shadow-xs">
            <img
              src="/kipus-icon.png"
              alt="KIPU'S"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </SidebarHeader>

      {/* Menú de Navegación */}
      <SidebarContent className="px-1 py-1 space-y-0.5 overflow-y-auto">
        {renderNavGroup('Gestión Principal', gestionItems)}
        {renderNavGroup('Operaciones', operacionesItems)}
        {renderNavGroup('Inteligencia', inteligenciaItems)}
        {renderNavGroup('Sistema', sistemaItems)}
      </SidebarContent>

      {/* Pie de Panel: Empresa activa */}
      <SidebarFooter className="border-t border-border p-2">
        <div className="flex items-center gap-2 rounded p-1.5 bg-muted/40 border border-border/60">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-[10px]">
            KC
          </div>
          <div className="flex flex-col overflow-hidden text-left text-xs">
            <span className="font-bold text-foreground text-[11px] truncate">
              Comercial Los Andes S.A.C.
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              RUC: 20608821941
            </span>
          </div>
          <ShieldCheck className="ml-auto h-3.5 w-3.5 text-emerald-600 shrink-0" />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};
