import React from 'react';
import { PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Estado vacío sobrio para inventario según kipus-ui:
 * Sin ilustraciones genéricas ni blobs. Muestra qué pasó y cómo resolverlo.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No se encontraron resultados',
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-md border border-dashed border-border bg-card/50',
        className
      )}
    >
      <div className="p-2.5 rounded-md bg-muted text-muted-foreground mb-3">
        <PackageSearch className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm leading-relaxed mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAction}
          className="text-xs h-8 font-medium"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
