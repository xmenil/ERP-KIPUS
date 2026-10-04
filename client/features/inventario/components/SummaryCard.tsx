import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  label: string;
  value: string | number;
  description?: string;
  variant?: 'default' | 'warning' | 'danger' | 'success';
  className?: string;
}

/**
 * Indicador superior discreto y de alta legibilidad para el control de inventario.
 * Cumple con las directrices de KIPU'S ERP: tipografía Inter, tabular-nums, sin degradados ni iconos decorativos.
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  description,
  variant = 'default',
  className,
}) => {
  return (
    <Card
      className={cn(
        'border border-border bg-card shadow-xs rounded-md transition-colors',
        variant === 'warning' && 'border-warning/40',
        variant === 'danger' && 'border-destructive/40',
        className
      )}
    >
      <CardContent className="p-4 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              'text-2xl font-semibold tracking-tight tabular-nums',
              variant === 'default' && 'text-foreground',
              variant === 'warning' && 'text-warning-text',
              variant === 'danger' && 'text-danger-text',
              variant === 'success' && 'text-success-text'
            )}
          >
            {value}
          </span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground leading-normal">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};
