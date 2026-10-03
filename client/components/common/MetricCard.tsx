import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
}

/**
 * Tarjeta de métrica/KPI estilo software de escritorio con números tabulares de alta legibilidad.
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  changeLabel = 'vs período anterior',
  icon: Icon,
  iconColor = 'text-primary bg-primary/10',
  className,
}) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className={cn('overflow-hidden border-border bg-card shadow-sm hover:border-border/80 transition-colors', className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div className={cn('p-2 rounded-md flex items-center justify-center', iconColor)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="mt-2">
          <h3 className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        {change !== undefined && (
          <div className="mt-3 flex items-center text-xs text-muted-foreground pt-2 border-t border-border/60">
            <span
              className={cn(
                'inline-flex items-center font-medium mr-1.5 px-1.5 py-0.5 rounded text-xs tabular-nums',
                isPositive
                  ? 'text-success-text bg-success-soft'
                  : 'text-danger-text bg-danger-soft'
              )}
            >
              {isPositive ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {isPositive ? `+${change}%` : `${change}%`}
            </span>
            <span className="text-xs">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
