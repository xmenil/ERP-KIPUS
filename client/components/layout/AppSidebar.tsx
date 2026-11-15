import React, { useMemo, useState } from 'react';
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
  Building,
  FileCheck,
  Printer,
  Settings,
  DollarSign,
  Package,
  ChevronDown,
  Boxes,
  ArrowLeftRight,
  Tags,
  ClipboardList,
  PackageCheck,
  CreditCard,
  TrendingUp,
  Sparkles,
  FileText,
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
  Building,
  FileCheck,
  Printer,
  Settings,
  DollarSign,
  Package,
  Boxes,
  ArrowLeftRight,
  Tags,
  ClipboardList,
  PackageCheck,
  CreditCard,
  TrendingUp,
  Sparkles,
  FileText,
};

const SIDEBAR_STORAGE_KEY = 'kipus_sidebar_open_submenus';

const getInitialOpenSubMenus = (): Record<string, boolean> => {
  try {
    const raw = sessionStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignorar error de parseo
  }
  return {};
};

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const currentTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab');
  }, [location.search]);

  const navItems = useMemo(() => {
    return getNavigationItemsForRole(user?.rol);
  }, [user?.rol]);

  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>(getInitialOpenSubMenus);

  const saveSubMenusState = (updated: Record<string, boolean>) => {
    try {
      sessionStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignorar en entornos sin acceso a storage
    }
  };

  const isSubMenuOpen = (path: string, isActive: boolean) => {
    if (openSubMenus[path] !== undefined) {
      return openSubMenus[path];
    }
    return isActive;
  };

  const toggleSubMenu = (path: string, defaultOpen: boolean) => {
    setOpenSubMenus((prev) => {
      const nextState = {
        ...prev,
        [path]: prev[path] !== undefined ? !prev[path] : !defaultOpen,
      };
      saveSubMenusState(nextState);
      return nextState;
    });
  };

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
                const isOpen = hasSubItems && isSubMenuOpen(item.path, isActive);

                return (
                  <SidebarMenuItem key={item.path}>
                    <div className="relative flex items-center w-full">
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.name}
                        className={`h-9 px-2.5 rounded-md font-medium text-[13px] transition-colors w-full ${
                          hasSubItems ? 'pr-8' : ''
                        } ${
                          isActive
                            ? '!bg-primary !text-primary-foreground font-semibold shadow-xs'
                            : 'text-slate-800 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 hover:text-slate-900'
                        }`}
                      >
                        <Link
                          to={hasSubItems && !isActive ? item.subItems![0].path : item.path}
                          onClick={() => {
                            if (hasSubItems) {
                              if (isActive) {
                                toggleSubMenu(item.path, true);
                              } else {
                                setOpenSubMenus((prev) => {
                                  const nextState = { ...prev, [item.path]: true };
                                  saveSubMenusState(nextState);
                                  return nextState;
                                });
                              }
                            }
                          }}
                          className="flex items-center gap-2.5 w-full"
                        >
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive
                                ? 'text-primary-foreground'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                          {item.badge && (
                            <SidebarMenuBadge className="ml-auto mr-5 bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-[10px] px-1.5 py-0.2 rounded border border-amber-500/30">
                              {item.badge}
                            </SidebarMenuBadge>
                          )}
                        </Link>
                      </SidebarMenuButton>

                      {hasSubItems && (
                        <button
                          type="button"
                          title={isOpen ? `Plegar submenú de ${item.name}` : `Desplegar submenú de ${item.name}`}
                          aria-label={isOpen ? `Plegar submenú de ${item.name}` : `Desplegar submenú de ${item.name}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleSubMenu(item.path, isActive);
                          }}
                          className={`absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded transition-colors cursor-pointer z-10 group-data-[collapsible=icon]:hidden ${
                            isActive
                              ? 'text-primary-foreground/90 hover:bg-white/20'
                              : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-400'
                          }`}
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${
                              isOpen ? 'rotate-0' : '-rotate-90'
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Sub-opciones debajo del botón principal */}
                    {hasSubItems && isOpen && (
                      <SidebarMenuSub className="mt-1 ml-3 border-l-2 border-primary/30 pl-2 space-y-0.5 animate-in fade-in-50 duration-150">
                        {item.subItems!.map((sub) => {
                          const SubIcon = ICON_MAP[sub.iconName || ''] || ShoppingCart;
                          let isSubActive = false;

                          if (isActive) {
                            if (item.path === APP_ROUTES.VENTAS) {
                              const activeTab = currentTab || 'pos';
                              isSubActive = sub.tabKey === activeTab;
                            } else if (item.path === APP_ROUTES.ADMINISTRACION) {
                              const activeTab = currentTab || 'usuarios';
                              isSubActive =
                                sub.tabKey === activeTab ||
                                (sub.tabKey === 'empresa' && currentTab === 'sucursales');
                            } else if (item.path === APP_ROUTES.INVENTARIO) {
                              const activeTab = currentTab || 'catalogo';
                              isSubActive = sub.tabKey === activeTab;
                            } else if (item.path === APP_ROUTES.COMPRAS) {
                              const activeTab = currentTab || 'ordenes';
                              isSubActive = sub.tabKey === activeTab;
                            } else if (item.path === APP_ROUTES.GASTOS) {
                              const activeTab = currentTab || 'gastos';
                              isSubActive = sub.tabKey === activeTab;
                            } else if (item.path === APP_ROUTES.REPORTES) {
                              const activeTab = currentTab || 'ventas';
                              isSubActive = sub.tabKey === activeTab;
                            } else {
                              isSubActive = currentTab
                                ? sub.tabKey === currentTab
                                : sub === item.subItems![0];
                            }
                          }

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
                                  {sub.badge && (
                                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                      {sub.badge}
                                    </span>
                                  )}
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
