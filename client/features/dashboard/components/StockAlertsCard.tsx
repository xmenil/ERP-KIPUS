import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StockAlert } from '../types/dashboard.types';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '@/constants/routes';

interface StockAlertsCardProps {
  alerts: StockAlert[];
  isLoading?: boolean;
}

export const StockAlertsCard: React.FC<StockAlertsCardProps> = ({ alerts, isLoading }) => {
  return (
    <Card className="rounded-md border-border bg-card shadow-xs h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            Alertas de reabastecimiento
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Artículos por debajo del stock mínimo
          </CardDescription>
        </div>
        <Link
          to={APP_ROUTES.INVENTARIO}
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5"
        >
          Ver inventario
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted/40 rounded-md animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-md">
            <CheckCircle2 className="h-5 w-5 text-success-text mb-1" />
            <p className="text-sm font-medium text-foreground">Stock en orden</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Todos los artículos tienen stock suficiente.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 4).map((item) => {
              const isCritico = item.urgencia === 'CRITICO';

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-md border border-border bg-background hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.producto}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {item.sku} · {item.almacen}
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <span className="text-xs font-medium font-mono tabular-nums text-danger-text block">
                        {item.stockActual} unid.
                      </span>
                      <span className="text-xs text-muted-foreground font-mono block">
                        Mín: {item.stockMinimo}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded-sm ${
                        isCritico
                          ? 'bg-danger-soft text-danger-text'
                          : 'bg-warning-soft text-warning-text'
                      }`}
                    >
                      {isCritico ? 'Crítico' : 'Bajo'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockAlertsCard;
