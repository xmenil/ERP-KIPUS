import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LockKeyhole, Sparkles, Store, Clock, ArrowRight } from 'lucide-react';

interface CajaCerradaEmptyStateProps {
  onAbrirCajaClick: () => void;
  sucursal?: string;
  cajaNombre?: string;
}

export const CajaCerradaEmptyState: React.FC<CajaCerradaEmptyStateProps> = ({
  onAbrirCajaClick,
  sucursal = 'Sede Central (Tingo María)',
  cajaNombre = 'Caja 01 - Mostrador Principal',
}) => {
  return (
    <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
      <CardContent className="p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
        {/* Indicador de Estado */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-danger-soft border border-destructive/30 text-danger-text text-xs font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
          <span>Caja actualmente cerrada</span>
        </div>

        {/* Icono Principal */}
        <div className="mx-auto w-14 h-14 rounded-lg bg-muted/60 border border-border flex items-center justify-center text-muted-foreground shadow-xs">
          <LockKeyhole className="h-7 w-7 text-muted-foreground/80 stroke-[1.75]" />
        </div>

        {/* Mensaje Claro y Cotidiano */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Tu caja está cerrada
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Para comenzar a atender clientes, registrar cobros y emitir ventas necesitas abrir un turno en esta caja indicando el sencillo inicial.
          </p>
        </div>

        {/* Datos de contexto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left p-3.5 rounded-md bg-muted/40 border border-border/60 text-xs">
          <div className="flex items-center gap-2.5">
            <Store className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="text-muted-foreground block text-xs">Sucursal asignada:</span>
              <span className="font-medium text-foreground">{sucursal}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="text-muted-foreground block text-xs">Caja operativa:</span>
              <span className="font-medium text-foreground">{cajaNombre}</span>
            </div>
          </div>
        </div>

        {/* Botón de Acción Principal */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="sm"
            onClick={onAbrirCajaClick}
            className="w-full sm:w-auto px-5 font-medium text-xs h-9 shadow-xs gap-2"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Abrir turno de caja
            <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Ingresa el efectivo inicial con el que empiezas tu turno en el mostrador.
        </p>
      </CardContent>
    </Card>
  );
};
