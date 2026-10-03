import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StockAlert } from '../types/dashboard.types';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '@/constants/routes';

interface StockAlertsCardProps {
  alerts: StockAlert[];
  isLoading?: boolean;
}

export const StockAlertsCard: React.FC<StockAlertsCardProps> = ({ alerts, isLoading }) => {
  return (
    <Card className="border-border/80">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500" />
            Alertas de Reabastecimiento
          </CardTitle>
          <CardDescription className="text-xs">
            Artículos por debajo del stock de seguridad
          </CardDescription>
        </div>
        <Link
          to={APP_ROUTES.INVENTARIO}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          Ir a Inventario
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-muted/40 rounded animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No hay alertas de stock pendientes.
          </p>
        ) : (
          <div className="space-y-3">
            {alerts.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-card hover:bg-muted/40 transition-colors shadow-2xs"
              >
                <div className="space-y-0.5">
                  <p className="text-[13px] font-semibold text-foreground line-clamp-1">
                    {item.producto}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    SKU: {item.sku} • {item.almacen}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <span className="text-[13px] font-bold text-rose-600 dark:text-rose-400 block font-mono tabular-nums">
                      {item.stockActual} en stock
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      Mín: {item.stockMinimo}
                    </span>
                  </div>
                  <StatusBadge
                    status={item.urgencia}
                    variant={item.urgencia === 'CRITICO' ? 'danger' : 'warning'}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
