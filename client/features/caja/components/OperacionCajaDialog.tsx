import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TipoOperacionCaja, MetodoCaja, NuevaOperacionCajaPayload } from '../types/caja.types';
import { DollarSign } from 'lucide-react';

interface OperacionCajaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOperacionRegistrada: (payload: NuevaOperacionCajaPayload) => Promise<void>;
  tipoInicial?: TipoOperacionCaja;
}

export const OperacionCajaDialog: React.FC<OperacionCajaDialogProps> = ({
  open,
  onOpenChange,
  onOperacionRegistrada,
  tipoInicial = 'INGRESO',
}) => {
  const [tipo, setTipo] = useState<TipoOperacionCaja>(tipoInicial);
  const [concepto, setConcepto] = useState('');
  const [metodo, setMetodo] = useState<MetodoCaja>('EFECTIVO');
  const [monto, setMonto] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    setTipo(tipoInicial);
  }, [tipoInicial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim() || monto <= 0) return;

    setIsSubmitting(true);
    try {
      await onOperacionRegistrada({
        tipo,
        concepto,
        metodo,
        monto: Number(monto),
      });
      onOpenChange(false);
      setConcepto('');
      setMonto(50);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {tipo === 'INGRESO' ? 'Registrar Ingreso a Caja' : 'Registrar Salida / Retiro de Efectivo'}
          </DialogTitle>
          <DialogDescription>
            {tipo === 'INGRESO'
              ? 'Ingreso manual por sencillo adicional, cobranza extraordinaria o aporte.'
              : 'Retiro para compras menores, viáticos o pagos de emergencia en efectivo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Movimiento</Label>
              <Select value={tipo} onValueChange={(val: TipoOperacionCaja) => setTipo(val)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INGRESO">Ingreso (+)</SelectItem>
                  <SelectItem value="EGRESO">Egreso / Retiro (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Medio de Pago</Label>
              <Select value={metodo} onValueChange={(val: MetodoCaja) => setMetodo(val)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EFECTIVO">Efectivo en Mano</SelectItem>
                  <SelectItem value="YAPE">Yape</SelectItem>
                  <SelectItem value="PLIN">Plin</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferencia Bancaria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Motivo o Concepto</Label>
            <Input
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej. Compra de útiles de limpieza o aporte de cambio"
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Monto (S/)</Label>
            <Input
              type="number"
              step="0.1"
              min="0.5"
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              required
              className="h-8 text-xs font-bold text-lg"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !concepto.trim()}>
              {isSubmitting ? 'Guardando...' : 'Confirmar Operación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
