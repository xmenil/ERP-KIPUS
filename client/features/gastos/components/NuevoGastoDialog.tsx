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
import { CategoriaGasto, NuevoGastoPayload } from '../types/gastos.types';
import { Receipt, AlertCircle } from 'lucide-react';

interface NuevoGastoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGastoRegistrado: (payload: NuevoGastoPayload) => Promise<void>;
}

export const NuevoGastoDialog: React.FC<NuevoGastoDialogProps> = ({
  open,
  onOpenChange,
  onGastoRegistrado,
}) => {
  const [categoria, setCategoria] = useState<CategoriaGasto>('SERVICIOS_BASICOS');
  const [descripcion, setDescripcion] = useState('');
  const [beneficiario, setBeneficiario] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [monto, setMonto] = useState<string>('50');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorInput, setErrorInput] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInput(null);

    const montoNum = Number(monto);
    if (!descripcion.trim()) {
      setErrorInput('Ingresa el concepto o descripción del gasto.');
      return;
    }
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorInput('El monto debe ser mayor a S/ 0.00.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onGastoRegistrado({
        categoria,
        descripcion: descripcion.trim(),
        beneficiario: beneficiario.trim() || 'Proveedor varios',
        comprobante: comprobante.trim() || 'Sin comprobante',
        monto: montoNum,
        metodoPago,
      });
      onOpenChange(false);
      setDescripcion('');
      setBeneficiario('');
      setComprobante('');
      setMonto('50');
      setErrorInput(null);
    } catch {
      setErrorInput('Ocurrió un error al registrar el gasto. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] flex flex-col p-4 sm:p-5 gap-4 overflow-hidden rounded-lg">
        <DialogHeader className="space-y-1 text-left shrink-0">
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary shrink-0" />
            <span>Registrar egreso o gasto operativo</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Registra los gastos del negocio para alimentar el control de costos y flujo de caja.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1 overflow-y-auto flex-1 pr-0.5">
          {/* Categoría y Medio de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Categoría de gasto</Label>
              <Select value={categoria} onValueChange={(val: CategoriaGasto) => setCategoria(val)}>
                <SelectTrigger className="h-9 text-xs border-border bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="ALQUILER" className="text-xs">Alquiler de local</SelectItem>
                  <SelectItem value="SERVICIOS_BASICOS" className="text-xs">Servicios (luz, agua, internet)</SelectItem>
                  <SelectItem value="PLANILLA" className="text-xs">Planilla / Sueldos</SelectItem>
                  <SelectItem value="LOGISTICA" className="text-xs">Combustible & Envíos</SelectItem>
                  <SelectItem value="MANTENIMIENTO" className="text-xs">Mantenimiento y refacción</SelectItem>
                  <SelectItem value="MARKETING" className="text-xs">Publicidad y marketing</SelectItem>
                  <SelectItem value="OTROS" className="text-xs">Otros gastos menores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Medio de pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger className="h-9 text-xs border-border bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EFECTIVO" className="text-xs">Efectivo de caja</SelectItem>
                  <SelectItem value="TRANSFERENCIA" className="text-xs">Transferencia bancaria</SelectItem>
                  <SelectItem value="YAPE" className="text-xs">Yape / Plin</SelectItem>
                  <SelectItem value="TARJETA" className="text-xs">Tarjeta débito/crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Concepto / Descripción */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Concepto / Descripción</Label>
            <Input
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                if (errorInput) setErrorInput(null);
              }}
              placeholder="Ej. Recibo de luz Enel - Mes de octubre"
              required
              className="h-9 text-xs border-border bg-card"
            />
          </div>

          {/* Proveedor y N° Comprobante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Beneficiario / Proveedor</Label>
              <Input
                value={beneficiario}
                onChange={(e) => setBeneficiario(e.target.value)}
                placeholder="Ej. Enel, Propietario local"
                className="h-9 text-xs border-border bg-card"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">N° Comprobante / Recibo</Label>
              <Input
                value={comprobante}
                onChange={(e) => setComprobante(e.target.value)}
                placeholder="Ej. F001-002492 o s/n"
                className="h-9 text-xs border-border bg-card"
              />
            </div>
          </div>

          {/* Monto Total */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Monto pagado (S/)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-mono font-semibold text-muted-foreground">
                S/
              </span>
              <Input
                type="number"
                step="0.01"
                min="0.10"
                inputMode="decimal"
                value={monto}
                onChange={(e) => {
                  setMonto(e.target.value);
                  if (errorInput) setErrorInput(null);
                }}
                required
                className="pl-8 h-9 text-sm font-mono font-semibold tabular-nums border-border bg-card focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Mensaje de error accesible */}
          {errorInput && (
            <div className="flex items-center gap-1.5 text-xs text-danger-text p-2 rounded bg-danger-soft border border-destructive/20">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorInput}</span>
            </div>
          )}

          <DialogFooter className="shrink-0 pt-3 border-t border-border flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs h-9 font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs h-9 font-semibold bg-primary text-primary-foreground"
            >
              {isSubmitting ? 'Guardando egreso...' : 'Registrar gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
