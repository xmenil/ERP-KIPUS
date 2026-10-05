import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CierreCaja } from '../types/caja.types';
import { formatCurrency } from '@/utils/formatters';
import {
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
  ArrowRight,
  Store,
  User,
  Clock,
  Receipt,
} from 'lucide-react';

interface CierreResultadoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cierre: CierreCaja | null;
  onNuevaAperturaClick: () => void;
}

export const CierreResultadoModal: React.FC<CierreResultadoModalProps> = ({
  open,
  onOpenChange,
  cierre,
  onNuevaAperturaClick,
}) => {
  if (!cierre) return null;

  const estaCuadrada = Math.abs(cierre.diferencia) < 0.05;

  const handleImprimir = () => {
    window.print();
  };

  const handleNuevaApertura = () => {
    onOpenChange(false);
    onNuevaAperturaClick();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabecera */}
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/60 bg-muted/20 text-center shrink-0">
          <div className="mx-auto w-12 h-12 rounded-lg bg-success-soft border border-success/30 flex items-center justify-center text-success-text mb-2 shadow-xs">
            <Receipt className="h-6 w-6 stroke-[2]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-success-soft text-success-text border border-success/30 text-xs font-medium mx-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Caja cerrada
          </div>
          <DialogTitle className="text-lg font-semibold pt-1 text-center">
            Comprobante de Cierre de Turno
          </DialogTitle>
          <DialogDescription className="text-xs text-center">
            Resumen oficial de liquidación y entrega de fondos.
          </DialogDescription>
        </DialogHeader>

        {/* Cuerpo del Comprobante */}
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto print:p-0">
          {/* Datos Generales */}
          <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-md bg-muted/30 border border-border/70">
            <div>
              <span className="text-muted-foreground block text-xs">Caja & Sucursal:</span>
              <span className="font-semibold text-foreground">
                {cierre.cajaNombre}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Responsable:</span>
              <span className="font-semibold text-foreground">{cierre.responsable}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Fecha y Hora Cierre:</span>
              <span className="font-semibold text-foreground">
                {cierre.fechaCierre} {cierre.horaCierre}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Total Operaciones:</span>
              <span className="font-semibold text-foreground">
                {cierre.totalOperaciones} movimientos
              </span>
            </div>
          </div>

          {/* Desglose de Números */}
          <div className="p-4 rounded-md bg-card border border-border text-xs space-y-2">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-muted-foreground">Saldo inicial (Sencillo):</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatCurrency(cierre.saldoInicial)}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 text-success-text">
              <span className="font-medium">+ Ventas en efectivo:</span>
              <span className="font-semibold tabular-nums font-mono">
                + {formatCurrency(cierre.ventasEfectivo)}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 text-success-text">
              <span className="font-medium">+ Otros ingresos:</span>
              <span className="font-semibold tabular-nums font-mono">
                + {formatCurrency(cierre.otrosIngresos)}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 text-danger-text border-b border-border pb-2">
              <span className="font-medium">- Egresos y retiros:</span>
              <span className="font-semibold tabular-nums font-mono">
                - {formatCurrency(cierre.egresos)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 font-medium text-foreground">
              <span>Saldo esperado en sistema:</span>
              <span className="tabular-nums font-semibold font-mono">{formatCurrency(cierre.saldoEsperado)}</span>
            </div>

            <div className="flex justify-between items-center font-medium text-xs bg-muted/40 p-2.5 rounded-md">
              <span className="text-foreground">Efectivo final entregado:</span>
              <span className="text-primary tabular-nums font-semibold font-mono text-sm">
                {formatCurrency(cierre.saldoContado)}
              </span>
            </div>

            {/* Diferencia */}
            <div className="flex justify-between items-center pt-1 text-xs font-medium">
              <span className="text-muted-foreground">Diferencia registrada:</span>
              <span
                className={`tabular-nums font-semibold font-mono ${
                  estaCuadrada ? 'text-success-text' : 'text-warning-text'
                }`}
              >
                {estaCuadrada ? 'S/ 0.00 (Cuadrada)' : formatCurrency(cierre.diferencia)}
              </span>
            </div>

            {cierre.motivoDiferencia && (
              <div className="mt-2 p-2 bg-warning-soft rounded-md border border-warning/30 text-xs text-warning-text">
                <span className="font-medium">Motivo diferencia:</span> {cierre.motivoDiferencia}
              </div>
            )}
          </div>
        </div>

        {/* Botones de Acción */}
        <DialogFooter className="p-4 border-t border-border/60 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImprimir}
            className="w-full sm:w-auto text-xs font-medium h-9 gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir ticket
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto text-xs font-medium h-9"
            >
              Volver
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleNuevaApertura}
              className="w-full sm:w-auto text-xs font-medium h-9 gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Nueva apertura
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
