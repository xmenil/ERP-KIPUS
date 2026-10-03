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
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Cabecera */}
        <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2 shadow-sm">
            <Receipt className="h-7 w-7 stroke-[2]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mx-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            CAJA CERRADA
          </div>
          <DialogTitle className="text-xl font-bold pt-1 text-center">
            Comprobante de Cierre de Turno
          </DialogTitle>
          <DialogDescription className="text-xs text-center">
            Resumen oficial de liquidación y entrega de fondos.
          </DialogDescription>
        </DialogHeader>

        {/* Cuerpo del Comprobante */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto print:p-0">
          {/* Datos Generales */}
          <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-lg bg-muted/30 border border-border/70">
            <div>
              <span className="text-muted-foreground block text-[10px]">Caja & Sucursal:</span>
              <span className="font-semibold text-foreground">
                {cierre.cajaNombre}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Responsable:</span>
              <span className="font-semibold text-foreground">{cierre.responsable}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Fecha y Hora Cierre:</span>
              <span className="font-semibold text-foreground">
                {cierre.fechaCierre} {cierre.horaCierre}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Total Operaciones:</span>
              <span className="font-semibold text-foreground">
                {cierre.totalOperaciones} movimientos
              </span>
            </div>
          </div>

          {/* Desglose de Números */}
          <div className="p-4 rounded-xl bg-card border border-border text-xs space-y-2">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-muted-foreground">Saldo inicial (Sencillo):</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatCurrency(cierre.saldoInicial)}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 text-emerald-700">
              <span className="font-medium">+ Ventas en efectivo:</span>
              <span className="font-bold tabular-nums">
                + {formatCurrency(cierre.ventasEfectivo)}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 text-emerald-700">
              <span className="font-medium">+ Otros ingresos:</span>
              <span className="font-bold tabular-nums">
                + {formatCurrency(cierre.otrosIngresos)}
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 text-rose-600 border-b border-border pb-2">
              <span className="font-medium">- Egresos y retiros:</span>
              <span className="font-bold tabular-nums">
                - {formatCurrency(cierre.egresos)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 font-semibold text-foreground">
              <span>Saldo esperado en sistema:</span>
              <span className="tabular-nums">{formatCurrency(cierre.saldoEsperado)}</span>
            </div>

            <div className="flex justify-between items-center font-bold text-sm bg-muted/40 p-2 rounded-lg">
              <span className="text-foreground">Efectivo final entregado:</span>
              <span className="text-primary tabular-nums">
                {formatCurrency(cierre.saldoContado)}
              </span>
            </div>

            {/* Diferencia */}
            <div className="flex justify-between items-center pt-1 text-xs font-semibold">
              <span className="text-muted-foreground">Diferencia registrada:</span>
              <span
                className={`tabular-nums ${
                  estaCuadrada ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {estaCuadrada ? 'S/ 0.00 (Cuadrada)' : formatCurrency(cierre.diferencia)}
              </span>
            </div>

            {cierre.motivoDiferencia && (
              <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900">
                <strong>Motivo diferencia:</strong> {cierre.motivoDiferencia}
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
            className="w-full sm:w-auto text-xs gap-1.5"
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
              className="w-full sm:w-auto text-xs"
            >
              Volver
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleNuevaApertura}
              className="w-full sm:w-auto text-xs font-semibold gap-1.5"
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
