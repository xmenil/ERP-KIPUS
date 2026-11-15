import React from 'react';
import { Button } from '@/components/ui/button';
import { ResumenSugerenciaCompras } from '../services/sugerenciaComprasService';
import { formatCurrency } from '@/utils/formatters';
import { AlertTriangle, Sparkles } from 'lucide-react';

interface ReabastecimientoAlertCardProps {
  sugerencias: ResumenSugerenciaCompras;
  onAbrirSugerencias: () => void;
}

export const ReabastecimientoAlertCard: React.FC<ReabastecimientoAlertCardProps> = ({
  sugerencias,
  onAbrirSugerencias,
}) => {
  if (sugerencias.totalProductosSugeridos <= 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/20 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-foreground">
              Asistente de Reabastecimiento KIPU'S
            </span>
            <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 px-2 py-0.5 rounded-full">
              {sugerencias.conteoAgotados} agotados · {sugerencias.conteoCriticos} en stock crítico
            </span>
            {sugerencias.conteoAltaRotacion > 0 && (
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full">
                {sugerencias.conteoAltaRotacion} alta rotación
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Se detectaron {sugerencias.totalProductosSugeridos} productos que requieren reposición para evitar quiebres de mostrador. Puedes generar la orden de compra sugerida en un clic.
          </p>
        </div>
      </div>

      <Button
        size="sm"
        onClick={onAbrirSugerencias}
        className="h-9 text-xs bg-primary text-primary-foreground font-semibold hover:bg-primary-hover shrink-0 gap-1.5 shadow-xs"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>Generar Orden Sugerida ({formatCurrency(sugerencias.inversionTotalEstimada)})</span>
      </Button>
    </div>
  );
};
