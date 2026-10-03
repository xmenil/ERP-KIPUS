import React, { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  children?: ReactNode; // Botones de acción directa
}

/**
 * Encabezado de página estilo software de escritorio:
 * Título claro, conciso, de alta legibilidad y botones de acción inmediatos.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  children,
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            {title}
          </h1>
          {badge && (
            <Badge variant="outline" className="font-semibold text-[11px] bg-muted/60 text-foreground border-border">
              {badge}
            </Badge>
          )}
        </div>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
};
