import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Warehouse,
  Truck,
  Receipt,
  BarChart3,
  ShieldCheck,
  Users,
  Settings,
  DollarSign,
  Package,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { APP_ROUTES, getNavigationItemsForRole } from '@/constants/routes';
import { useAuth } from '@/features/auth/context/AuthContext';
import { getRoleDisplayName } from '@/features/auth/utils/permissions';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ShoppingCart,
  Warehouse,
  Truck,
  Receipt,
  BarChart3,
  ShieldCheck,
  Users,
  Settings,
  DollarSign,
  Package,
};

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const currentTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'pos';
  }, [location.search]);

  const navItems = useMemo(() => {
    return getNavigationItemsForRole(user?.rol);
  }, [user?.rol]);

  const isItemActive = (itemPath: string) => {
    const current = location.pathname;

    if (itemPath === APP_ROUTES.DASHBOARD) {
      return current === APP_ROUTES.DASHBOARD || current === APP_ROUTES.HOME;
    }

    if (itemPath === APP_ROUTES.VENTAS) {
      return current === APP_ROUTES.VENTAS || current === APP_ROUTES.CAJA;
    }

    if (itemPath === APP_ROUTES.INVENTARIO) {
      return current === APP_ROUTES.INVENTARIO || current === APP_ROUTES.PRODUCTOS;
    }

    if (itemPath === APP_ROUTES.COMPRAS) {
      return current === APP_ROUTES.COMPRAS || current === APP_ROUTES.PROVEEDORES;
    }

    if (itemPath === APP_ROUTES.GASTOS) {
      return current === APP_ROUTES.GASTOS;
    }

    if (itemPath === APP_ROUTES.ADMINISTRACION) {
      return (
        current === APP_ROUTES.ADMINISTRACION ||
        current === APP_ROUTES.USUARIOS ||
        current === APP_ROUTES.CONFIGURACION
      );
    }

    if (itemPath === APP_ROUTES.REPORTES) {
      return current === APP_ROUTES.REPORTES || current === APP_ROUTES.KIPUS_IA;
    }

    if (itemPath === APP_ROUTES.CLIENTES) {
      return current === APP_ROUTES.CLIENTES;
    }

    return current === itemPath || current.startsWith(`${itemPath}/`);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar select-none">
      {/* Encabezado del ERP estilo Desktop Software */}
      <SidebarHeader className="border-b border-border p-3">
        {/* Vista expandida: Logo oficial Kipus + ERP PRO */}
        <div className="flex flex-col gap-1 items-center group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
            <img
              src="/kipus-logo.png"
              alt="Kipu's"
              className="h-10 w-auto object-contain shrink-0 dark:brightness-110"
            />
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
              PRO
            </span>
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-medium text-muted-foreground">Rol:</span>
            <span className="text-[10px] font-semibold text-primary px-1.5 py-0.2 rounded bg-primary/10">
              {getRoleDisplayName(user?.rol)}
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

      {/* Menú de Navegación según Rol Autenticado */}
      <SidebarContent className="px-1 py-2 space-y-0.5 overflow-y-auto">
        <SidebarGroup className="py-0 px-2">
          <SidebarGroupLabel className="text-[10.5px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold px-2 h-6 select-none">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
                const isActive = isItemActive(item.path);
                const hasSubItems = Boolean(item.subItems && item.subItems.length > 0);

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      className={`h-9 px-2.5 rounded-md font-medium text-[13px] transition-colors ${
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

                    {/* Sub-opciones debajo del botón principal */}
                    {hasSubItems && (isActive || location.pathname === APP_ROUTES.VENTAS) && (
                      <SidebarMenuSub className="mt-1 ml-3 border-l-2 border-primary/30 pl-2 space-y-0.5">
                        {item.subItems!.map((sub) => {
                          const SubIcon = ICON_MAP[sub.iconName || ''] || ShoppingCart;
                          const isSubActive =
                            (location.pathname === APP_ROUTES.VENTAS || (sub.tabKey === 'caja' && location.pathname === APP_ROUTES.CAJA)) &&
                            (sub.tabKey === 'pos'
                              ? currentTab === 'pos' || (!location.search.includes('tab=') && location.pathname === APP_ROUTES.VENTAS)
                              : currentTab === sub.tabKey);

                          return (
                            <SidebarMenuSubItem key={sub.path}>
                              <SidebarMenuSubButton
                                asChild
                                size="sm"
                                isActive={isSubActive}
                                className={`h-7 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                  isSubActive
                                    ? '!bg-primary/15 !text-primary font-bold dark:!bg-primary/25'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                                }`}
                              >
                                <Link to={sub.path} className="flex items-center gap-2 w-full">
                                  <SubIcon
                                    className={`h-3.5 w-3.5 shrink-0 ${
                                      isSubActive ? 'text-primary font-bold' : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                  />
                                  <span className="truncate">{sub.name}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Pie de Panel: Empresa activa y Sucursal asignada */}
      <SidebarFooter className="border-t border-border p-2">
        <div className="flex items-center gap-2 rounded p-1.5 bg-muted/40 border border-border/60">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-[10px]">
            {user?.avatarInitials || 'KC'}
          </div>
          <div className="flex flex-col overflow-hidden text-left text-xs">
            <span className="font-bold text-foreground text-[11px] truncate">
              {user?.nombreCompleto?.split(' ')[0] || 'Comercial Los Andes'}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {user?.sucursal || 'Sede Central'}
            </span>
          </div>
          <ShieldCheck className="ml-auto h-3.5 w-3.5 text-emerald-600 shrink-0" />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};
