import React, { useEffect, useState } from 'react';
import { useConfiguracion } from '@/features/configuracion/hooks/useConfiguracion';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sun,
  Moon,
  Building,
  User,
  LogOut,
  HelpCircle,
  RotateCw,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

export const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { config } = useConfiguracion();
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark');
  });

  const [fechaActual, setFechaActual] = useState<string>('');

  useEffect(() => {
    const ahora = new Date();
    setFechaActual(
      ahora.toLocaleDateString('es-PE', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    );
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleRefresh = () => {
    toast.info('Sincronizando datos del sistema...');
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      {/* Lado izquierdo: Botón colapsar menú y Sede */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-11 w-11 md:h-9 md:w-9 text-foreground hover:bg-muted border border-border/80 rounded" />

        <div className="hidden sm:flex items-center gap-2 text-xs text-foreground bg-muted/50 px-2.5 py-1 rounded border border-border">
          <Building className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-semibold text-foreground">Sucursal:</span>
          <span className="text-muted-foreground">
            {config?.empresa.nombreSede || 'Revisa Configuración'}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="capitalize">{fechaActual}</span>
        </div>
      </div>

      {/* Lado derecho: Tipo de cambio, acciones y usuario */}
      <div className="flex items-center gap-2">
        {/* Refrescar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          className="h-11 w-11 md:h-9 md:w-9 text-muted-foreground hover:text-foreground rounded"
          title="Refrescar aplicación"
        >
          <RotateCw className="h-4 w-4" />
        </Button>

        {/* Alternar tema */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-11 w-11 md:h-9 md:w-9 text-muted-foreground hover:text-foreground rounded"
          title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-foreground" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Perfil de Usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 pl-2 pr-3 py-1 h-8 rounded border-border/90 bg-background text-xs font-semibold hover:bg-muted"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground font-semibold text-xs">
                {user?.avatarInitials || 'A'}
              </div>
              <span className="hidden sm:inline-block text-foreground max-w-[120px] truncate">
                {user?.nombreCompleto
                  ? user.nombreCompleto.split(' ')[0]
                  : 'Administrador'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal py-1.5">
              <div className="flex flex-col space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  {user?.nombreCompleto || 'Administrador'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {user?.email || 'admin@kipus.pe'}
                </p>
                <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-muted-foreground w-fit">
                  {user?.rol || 'ADMINISTRADOR'}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
              <User className="h-3.5 w-3.5" />
              <span>Mi Perfil ({user?.sucursal || 'Sede Central'})</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Manual de Usuario</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer gap-2 text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
