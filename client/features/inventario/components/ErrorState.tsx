import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Estado de error de inventario: explica la causa y ofrece reintento accionable.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'No se pudo cargar la información',
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-6 rounded-md border border-destructive/20 bg-danger-soft text-danger-text space-y-3 text-center sm:text-left sm:flex sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-danger-text" aria-hidden="true" />
        <div className="space-y-0.5">
          <h4 className="text-sm font-semibold text-danger-text">{title}</h4>
          <p className="text-xs text-danger-text/90 leading-relaxed">{message}</p>
        </div>
      </div>

      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-destructive/30 bg-card hover:bg-danger-soft text-danger-text text-xs shrink-0 mt-2 sm:mt-0 font-medium"
        >
          <RotateCw className="h-3.5 w-3.5 mr-1.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
};
