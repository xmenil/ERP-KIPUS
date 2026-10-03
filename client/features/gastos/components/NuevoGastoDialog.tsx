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
import { Receipt } from 'lucide-react';

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
  const [monto, setMonto] = useState<number>(100);
  const [metodoPago, setMetodoPago] = useState('TRANSFERENCIA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim() || monto <= 0) return;

    setIsSubmitting(true);
    try {
      await onGastoRegistrado({
        categoria,
        descripcion,
        beneficiario: beneficiario || 'Proveedor Varios',
        comprobante: comprobante || 'Sin Comprobante',
        monto: Number(monto),
        metodoPago,
      });
      onOpenChange(false);
      setDescripcion('');
      setBeneficiario('');
      setComprobante('');
      setMonto(100);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Registrar Egreso / Gasto Operativo
          </DialogTitle>
          <DialogDescription>
            Registra los gastos del negocio para alimentar el estado de pérdidas y ganancias.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Categoría de Gasto</Label>
              <Select value={categoria} onValueChange={(val: CategoriaGasto) => setCategoria(val)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALQUILER">Alquiler de Local</SelectItem>
                  <SelectItem value="SERVICIOS_BASICOS">Servicios (Luz / Agua / Internet)</SelectItem>
                  <SelectItem value="PLANILLA">Planilla / Sueldos</SelectItem>
                  <SelectItem value="LOGISTICA">Combustible & Envíos</SelectItem>
                  <SelectItem value="MANTENIMIENTO">Mantenimiento & Reparación</SelectItem>
                  <SelectItem value="MARKETING">Publicidad & Marketing</SelectItem>
                  <SelectItem value="OTROS">Otros Gastos Menores</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Medio de Pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRANSFERENCIA">Transferencia Bancaria</SelectItem>
                  <SelectItem value="EFECTIVO">Efectivo de Caja</SelectItem>
                  <SelectItem value="YAPE">Yape / Plin</SelectItem>
                  <SelectItem value="TARJETA">Tarjeta de Débito/Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Concepto / Descripción del Gasto</Label>
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Recibo de luz mes de octubre"
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Proveedor / Beneficiario</Label>
              <Input
                value={beneficiario}
                onChange={(e) => setBeneficiario(e.target.value)}
                placeholder="Ej. Enel, Propietario local"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">N° Comprobante / Recibo</Label>
              <Input
                value={comprobante}
                onChange={(e) => setComprobante(e.target.value)}
                placeholder="Factura / Recibo"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Monto Total (S/)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.5"
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              required
              className="h-8 text-xs font-bold text-base"
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
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
