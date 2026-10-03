import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Venta } from '../types/ventas.types';
import { formatCurrency } from '@/utils/formatters';
import { CheckCircle2, Printer, Share2, PlusCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface VentaCompletadaModalProps {
  venta: Venta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNuevaVenta: () => void;
}

export const VentaCompletadaModal: React.FC<VentaCompletadaModalProps> = ({
  venta,
  open,
  onOpenChange,
  onNuevaVenta,
}) => {
  if (!venta) return null;

  const handlePrint = () => {
    toast.success(`Enviando a impresora térmica: ${venta.serieCorrelativo}`);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(
      `Comprobante KIPU'S: ${venta.serieCorrelativo} por ${formatCurrency(venta.total)} a nombre de ${venta.clienteNombre}`
    );
    toast.success('Enlace de comprobante copiado al portapapeles');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center sm:text-left">
        <DialogHeader className="items-center sm:items-start text-center sm:text-left pb-2 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success-soft text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                ¡Venta registrada con éxito!
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-mono">
                {venta.tipoComprobante}: {venta.serieCorrelativo}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Resumen de cobro */}
        <div className="space-y-3 py-2">
          {/* Tarjeta de Total y Vuelto */}
          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-2.5">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-muted-foreground font-medium">Total cobrado:</span>
              <span className="text-xl font-bold font-mono tabular-nums text-foreground">
                {formatCurrency(venta.total)}
              </span>
            </div>

            {venta.metodoPago === 'EFECTIVO' && venta.vuelto !== undefined && (
              <div className="flex justify-between items-baseline text-xs pt-2 border-t border-border/60">
                <span className="text-muted-foreground font-medium">Vuelto al cliente:</span>
                <span className="text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(venta.vuelto)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <span>Medio de pago:</span>
              <span className="font-semibold text-foreground">{venta.metodoPago}</span>
            </div>

            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Cliente:</span>
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {venta.clienteNombre} ({venta.clienteDocumento})
              </span>
            </div>
          </div>

          {/* Impacto automático en el ERP */}
          <div className="rounded border border-border/80 bg-card p-2.5 text-[11px] text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Inventario y Caja actualizados en tiempo real</span>
            </div>
            <p className="leading-tight">
              Se descontaron {venta.items.reduce((acc, it) => acc + it.cantidad, 0)} unidades de existencias y se anotó el ingreso en caja de hoy.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-border/70">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial text-xs gap-1.5 h-9"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir Ticket</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex-1 sm:flex-initial text-xs gap-1.5 h-9"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Compartir</span>
            </Button>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={onNuevaVenta}
            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground font-semibold h-9 shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Siguiente Venta</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
