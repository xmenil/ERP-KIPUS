import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-success-soft text-success-text border-success/30',
  warning: 'bg-warning-soft text-warning-text border-warning/30',
  danger: 'bg-danger-soft text-danger-text border-destructive/30',
  info: 'bg-primary-soft text-primary border-primary/30',
  neutral: 'bg-muted text-muted-foreground border-border',
};

/**
 * Badge semántico para representar estados de comprobantes, pedidos, cajas e inventario.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'neutral',
  className,
}) => {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium text-xs border capitalize', variantStyles[variant], className)}
    >
      {status}
    </Badge>
  );
};
