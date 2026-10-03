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
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
          <span>Caja actualmente cerrada</span>
        </div>

        {/* Icono Principal */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground shadow-inner">
          <LockKeyhole className="h-10 w-10 text-muted-foreground/80 stroke-[1.75]" />
        </div>

        {/* Mensaje Claro y Cotidiano */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Tu caja está cerrada
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para comenzar a atender clientes, registrar cobros y emitir ventas necesitas abrir un turno en esta caja indicando el sencillo inicial.
          </p>
        </div>

        {/* Datos de contexto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left p-4 rounded-xl bg-muted/40 border border-border/60 text-xs">
          <div className="flex items-center gap-2.5">
            <Store className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="text-muted-foreground block text-[11px]">Sucursal asignada:</span>
              <span className="font-semibold text-foreground">{sucursal}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <div>
              <span className="text-muted-foreground block text-[11px]">Caja operativa:</span>
              <span className="font-semibold text-foreground">{cajaNombre}</span>
            </div>
          </div>
        </div>

        {/* Botón de Acción Principal */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={onAbrirCajaClick}
            className="w-full sm:w-auto px-8 font-semibold text-sm h-11 shadow-sm gap-2"
          >
            <Sparkles className="h-4 w-4" />
            ABRIR CAJA AHORA
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          No necesitas conocimientos contables. Solo ingresa el efectivo inicial con el que empiezas tu turno.
        </p>
      </CardContent>
    </Card>
  );
};
