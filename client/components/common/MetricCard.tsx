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
    <Card className={cn('overflow-hidden border-border bg-card shadow-2xs hover:border-slate-400 transition-colors', className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
          {Icon && (
            <div className={cn('p-2 rounded flex items-center justify-center', iconColor)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="mt-2">
          <h3 className="text-2xl font-black tracking-tight text-foreground tabular-nums">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        {change !== undefined && (
          <div className="mt-3 flex items-center text-xs text-muted-foreground pt-2 border-t border-border/60">
            <span
              className={cn(
                'inline-flex items-center font-bold mr-1.5 px-1.5 py-0.2 rounded text-[11px]',
                isPositive
                  ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400'
              )}
            >
              {isPositive ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {isPositive ? `+${change}%` : `${change}%`}
            </span>
            <span className="text-[11px]">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
