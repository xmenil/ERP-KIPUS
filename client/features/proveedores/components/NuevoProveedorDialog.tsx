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
import { NuevoProveedorPayload } from '../types/proveedores.types';
import { Building2 } from 'lucide-react';

interface NuevoProveedorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProveedorRegistrado: (payload: NuevoProveedorPayload) => Promise<void>;
}

export const NuevoProveedorDialog: React.FC<NuevoProveedorDialogProps> = ({
  open,
  onOpenChange,
  onProveedorRegistrado,
}) => {
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [rubro, setRubro] = useState('Repuestos & Insumos');
  const [condicionPago, setCondicionPago] = useState('Al Contado');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruc.trim() || !razonSocial.trim()) return;

    setIsSubmitting(true);
    try {
      await onProveedorRegistrado({
        ruc,
        razonSocial,
        contacto: contacto || 'Contacto Comercial',
        telefono,
        correo,
        rubro,
        condicionPago,
      });
      onOpenChange(false);
      setRuc('');
      setRazonSocial('');
      setContacto('');
      setTelefono('');
      setCorreo('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] flex flex-col p-4 sm:p-5 gap-4 overflow-hidden rounded-lg">
        <DialogHeader className="space-y-1 text-left shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <span>Registrar Proveedor de Abastecimiento</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Registra los datos de la empresa proveedora y sus condiciones de pago.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-1 overflow-y-auto flex-1 pr-0.5">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">RUC (11 dígitos)</Label>
              <Input
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                placeholder="20XXXXXXXXX"
                required
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Razón Social</Label>
              <Input
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                placeholder="Nombre de la empresa"
                required
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Contacto / Asesor</Label>
              <Input
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Nombre del ejecutivo"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Teléfono</Label>
              <Input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="987 654 321"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Correo Electrónico</Label>
            <Input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="ventas@proveedor.pe"
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Rubro / Categoría</Label>
              <Input
                value={rubro}
                onChange={(e) => setRubro(e.target.value)}
                placeholder="Ej. Abarrotes y Alimentos"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Condición de Pago</Label>
              <Select value={condicionPago} onValueChange={setCondicionPago}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Al Contado">Al Contado / Transferencia</SelectItem>
                  <SelectItem value="Crédito a 15 días">Crédito a 15 días</SelectItem>
                  <SelectItem value="Crédito a 30 días">Crédito a 30 días</SelectItem>
                  <SelectItem value="Crédito a 45 días">Crédito a 45 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
              disabled={isSubmitting || !razonSocial.trim()}
              className="text-xs h-9 font-semibold bg-primary text-primary-foreground"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Proveedor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
