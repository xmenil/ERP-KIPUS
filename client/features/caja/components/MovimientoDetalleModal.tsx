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
import { MovimientoCaja } from '../types/caja.types';
import { formatCurrency } from '@/utils/formatters';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  User,
  Store,
  CreditCard,
  Tag,
  ExternalLink,
  FileText,
  FileCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MovimientoDetalleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimiento: MovimientoCaja | null;
}

export const MovimientoDetalleModal: React.FC<MovimientoDetalleModalProps> = ({
  open,
  onOpenChange,
  movimiento,
}) => {
  const navigate = useNavigate();

  if (!movimiento) return null;

  const esIngreso = movimiento.tipo === 'INGRESO';

  const handleIrAVenta = () => {
    onOpenChange(false);
    navigate('/ventas');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Cabecera */}
        <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                esIngreso
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {esIngreso ? (
                <ArrowDownCircle className="h-3.5 w-3.5" />
              ) : (
                <ArrowUpCircle className="h-3.5 w-3.5" />
              )}
              {esIngreso ? 'Ingreso a caja' : 'Egreso / Salida de caja'}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {movimiento.id}
            </span>
          </div>

          <DialogTitle className="text-lg font-semibold pt-1">
            Detalle de Movimiento
          </DialogTitle>
          <DialogDescription className="text-xs">
            {movimiento.concepto}
          </DialogDescription>
        </DialogHeader>

        {/* Monto Destacado */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="p-4 rounded-xl bg-card border border-border text-center space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Monto del movimiento
            </span>
            <div
              className={`text-2xl font-semibold tabular-nums ${
                esIngreso ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {esIngreso ? '+' : '-'} {formatCurrency(movimiento.monto)}
            </div>
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground pt-1">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Método: {movimiento.metodo}</span>
            </div>
          </div>

          {/* Información Contextual */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 text-xs space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Fecha y Hora:
              </span>
              <span className="font-medium text-foreground">
                {movimiento.fecha} a las {movimiento.hora}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Registrado por:
              </span>
              <span className="font-medium text-foreground">{movimiento.usuario}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" /> Sucursal:
              </span>
              <span className="font-medium text-foreground">
                {movimiento.sucursal || 'Sede Central'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Origen:
              </span>
              <span className="font-medium text-foreground">
                {movimiento.origenTipo || 'OPERACIÓN MANUAL'}
              </span>
            </div>

            {movimiento.categoria && (
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Categoría:</span>
                <span className="font-medium text-foreground">
                  {movimiento.categoria}
                </span>
              </div>
            )}

            {movimiento.observaciones && (
              <div className="pt-1 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground block">Observación:</span>
                <p className="mt-0.5 italic">{movimiento.observaciones}</p>
              </div>
            )}
          </div>

          {/* Si proviene de una Venta (Regla 10) */}
          {movimiento.origenTipo === 'VENTA' && (
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-primary" />
                  Venta asociada: {movimiento.comprobanteRef || 'Comprobante'}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Cobro registrado automáticamente desde el Terminal POS.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs font-medium gap-1 text-primary hover:text-primary shrink-0"
                onClick={handleIrAVenta}
              >
                <span>Ver venta</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/60 bg-muted/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs"
          >
            Cerrar detalle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
