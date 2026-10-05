import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/constants/routes';
import {
  LayoutDashboard,
  ArrowLeft,
  ShoppingCart,
  Warehouse,
  DollarSign,
  Copy,
  Check,
  FileQuestion,
} from 'lucide-react';
import { toast } from 'sonner';

export const NotFound: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(location.pathname);
    setCopied(true);
    toast.success('Ruta copiada al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const quickLinks = [
    { name: 'Dashboard', path: APP_ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'Punto de Venta', path: APP_ROUTES.VENTAS, icon: ShoppingCart },
    { name: 'Inventario', path: APP_ROUTES.INVENTARIO, icon: Warehouse },
    { name: 'Caja del Día', path: APP_ROUTES.CAJA, icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-lg space-y-6">
        {/* Cabecera con Logotipo Oficial */}
        <div className="flex justify-center">
          <Link to={APP_ROUTES.DASHBOARD} className="inline-block transition-opacity hover:opacity-90">
            <img
              src="/kipus-logo.png"
              alt="KIPU'S ERP"
              className="h-10 w-auto object-contain dark:brightness-110"
            />
          </Link>
        </div>

        {/* Tarjeta de Error Principal */}
        <div className="rounded-lg border border-border bg-card p-6 sm:p-8 shadow-xs text-center space-y-5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary mx-auto">
            <FileQuestion className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <div className="inline-block">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-muted text-muted-foreground border border-border">
                ERROR 404
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Página no encontrada
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              La dirección a la que intentas ingresar no existe, fue renombrada o no está disponible temporalmente.
            </p>
          </div>

          {/* Caja con la ruta solicitada */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded bg-muted/60 border border-border text-left">
            <div className="overflow-hidden">
              <span className="block text-[11px] text-muted-foreground font-medium">
                Ruta solicitada:
              </span>
              <span className="font-mono text-xs text-foreground truncate block">
                {location.pathname}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyPath}
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 rounded"
              title="Copiar ruta"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* Acciones principales */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto h-9 px-4 text-xs font-medium gap-2 rounded border-border"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver atrás
            </Button>
            <Link to={APP_ROUTES.DASHBOARD} className="w-full sm:w-auto">
              <Button
                variant="default"
                className="w-full sm:w-auto h-9 px-5 text-xs font-medium gap-2 rounded"
              >
                <LayoutDashboard className="h-4 w-4" />
                Ir al Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Accesos rápidos sugeridos */}
        <div className="rounded-lg border border-border bg-card/60 p-4 shadow-2xs space-y-3">
          <span className="text-xs font-semibold text-muted-foreground block text-center sm:text-left">
            Módulos principales del sistema:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-2 p-2 rounded border border-border/60 bg-background/50 hover:bg-muted/80 text-xs font-medium text-foreground transition-colors group"
                >
                  <Icon className="h-4 w-4 text-primary shrink-0 transition-transform group-hover:scale-105" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pie informativo sobrio */}
        <p className="text-center text-xs text-muted-foreground">
          KIPU'S ERP — Gestión Comercial & Servicios
        </p>
      </div>
    </div>
  );
};

export default NotFound;
