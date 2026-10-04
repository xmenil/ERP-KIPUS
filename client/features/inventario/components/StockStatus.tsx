import React from 'react';
import { EstadoStock } from '../types/inventario.types';
import { cn } from '@/lib/utils';

interface StockStatusProps {
  status: EstadoStock | 'DISPONIBLE' | 'STOCK_BAJO' | 'AGOTADO' | 'SUFICIENTE' | 'POR_AGOTARSE';
  className?: string;
}

/**
 * Badge de estado semántico de inventario según directrices de KIPU'S ERP.
 * Utiliza combinaciones accesibles (fondo suave + texto oscuro contrastado).
 */
export const StockStatus: React.FC<StockStatusProps> = ({ status, className }) => {
  let label = 'Disponible';
  let styles = 'bg-success-soft text-success-text border-success/30';

  if (status === 'AGOTADO') {
    label = 'Agotado';
    styles = 'bg-danger-soft text-danger-text border-destructive/30';
  } else if (status === 'STOCK_BAJO' || status === 'POR_AGOTARSE') {
    label = 'Stock bajo';
    styles = 'bg-warning-soft text-warning-text border-warning/30';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border select-none',
        styles,
        className
      )}
    >
      {label}
    </span>
  );
};
