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
import { TipoMovimiento, MotivoMovimiento, NuevoMovimientoPayload } from '../types/inventario.types';
import { ArrowLeftRight } from 'lucide-react';

interface NuevoMovimientoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMovimientoCreado: (payload: NuevoMovimientoPayload) => Promise<void>;
}

export const NuevoMovimientoDialog: React.FC<NuevoMovimientoDialogProps> = ({
  open,
  onOpenChange,
  onMovimientoCreado,
}) => {
  const [tipo, setTipo] = useState<TipoMovimiento>('ENTRADA');
  const [motivo, setMotivo] = useState<MotivoMovimiento>('COMPRA');
  const [productoNombre, setProductoNombre] = useState('Aceite Motor Sintético 5W-30 (Galón)');
  const [sku, setSku] = useState('LUB-5W30-01');
  const [almacen, setAlmacen] = useState('Almacén Principal');
  const [cantidad, setCantidad] = useState(5);
  const [referencia, setReferencia] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onMovimientoCreado({
        tipo,
        motivo,
        productoNombre,
        sku,
        almacen,
        cantidad: Number(cantidad),
        referencia: referencia || 'Movimiento de Almacén',
      });
      onOpenChange(false);
      setReferencia('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Registrar Movimiento de Almacén
          </DialogTitle>
          <DialogDescription>
            Ingreso, salida o ajuste manual para actualizar las existencias en Kardex.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Operación</Label>
              <Select value={tipo} onValueChange={(val: TipoMovimiento) => setTipo(val)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada (Ingreso)</SelectItem>
                  <SelectItem value="SALIDA">Salida (Egreso)</SelectItem>
                  <SelectItem value="AJUSTE">Ajuste de Auditoría</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Motivo</Label>
              <Select value={motivo} onValueChange={(val: MotivoMovimiento) => setMotivo(val)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPRA">Recepción por Compra</SelectItem>
                  <SelectItem value="VENTA">Despacho por Venta</SelectItem>
                  <SelectItem value="MERMA">Merma / Deterioro</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferencia entre Sedes</SelectItem>
                  <SelectItem value="INVENTARIO_INICIAL">Inventario Inicial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Producto</Label>
            <Input
              value={productoNombre}
              onChange={(e) => setProductoNombre(e.target.value)}
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Almacén Destino/Origen</Label>
              <Select value={almacen} onValueChange={setAlmacen}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Almacén Principal">Almacén Principal</SelectItem>
                  <SelectItem value="Tienda Mostrador (Surco)">Tienda Mostrador</SelectItem>
                  <SelectItem value="Almacén Huancayo">Almacén Huancayo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                className="h-8 text-xs text-center font-bold"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Comprobante de Referencia / Motivo</Label>
            <Input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej. Guía 001-492 o Acta de ajuste"
              className="h-8 text-xs"
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
              {isSubmitting ? 'Registrando...' : 'Registrar en Kardex'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
