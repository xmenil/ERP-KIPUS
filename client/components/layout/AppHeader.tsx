import React, { useEffect, useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
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
  Bell,
  HelpCircle,
  TrendingUp,
  RotateCw,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

export const AppHeader: React.FC = () => {
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
      })
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
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur shadow-xs">
      {/* Lado izquierdo: Botón colapsar menú y Sede */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-8 w-8 text-foreground hover:bg-muted border border-border/80 rounded" />
        
        <div className="hidden sm:flex items-center gap-2 text-xs text-foreground bg-muted/50 px-2.5 py-1 rounded border border-border">
          <Building className="h-3.5 w-3.5 text-primary" />
          <span className="font-bold text-foreground">Sucursal:</span>
          <span className="text-muted-foreground">Sede Central (Almacén 01)</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span className="capitalize">{fechaActual}</span>
        </div>
      </div>

      {/* Lado derecho: Tipo de cambio, acciones y usuario */}
      <div className="flex items-center gap-2">
        {/* TC SUNAT */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted/40 border border-border text-xs text-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          <span className="font-semibold text-muted-foreground">T.C.:</span>
          <span className="font-mono font-bold">C: 3.74 | V: 3.76</span>
        </div>

        {/* Refrescar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded"
          title="Refrescar aplicación"
        >
          <RotateCw className="h-4 w-4" />
        </Button>

        {/* Notificaciones */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground rounded"
          title="Notificaciones del sistema"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>

        {/* Alternar tema */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded"
          title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Perfil de Usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 pl-2 pr-3 py-1 h-8 rounded border-border/90 bg-background text-xs font-semibold hover:bg-muted"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-[11px]">
                A
              </div>
              <span className="hidden sm:inline-block text-foreground">Administrador</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal py-1.5">
              <div className="flex flex-col space-y-0.5">
                <p className="text-xs font-bold text-foreground">Administrador General</p>
                <p className="text-[11px] text-muted-foreground">admin@comerciallosandes.pe</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
              <User className="h-3.5 w-3.5" />
              <span>Mi Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Manual de Usuario</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs text-rose-600 focus:text-rose-600">
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
