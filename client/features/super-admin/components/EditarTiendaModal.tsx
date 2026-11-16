import React, { useState, useEffect } from 'react';
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
import { Store, User, Mail, Phone, MapPin, Building, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TiendaItem, UpdateTiendaPayload } from '../types/superAdmin.types';

interface EditarTiendaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tienda: TiendaItem | null;
  onSubmit: (id: string, payload: UpdateTiendaPayload) => Promise<void>;
}

export const EditarTiendaModal: React.FC<EditarTiendaModalProps> = ({
  open,
  onOpenChange,
  tienda,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<UpdateTiendaPayload>({
    nombreComercial: '',
    razonSocial: '',
    ruc: '',
    direccionFiscal: '',
    telefono: '',
    correo: '',
    nombreDueno: '',
    emailDueno: '',
    telefonoDueno: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tienda) {
      setFormData({
        nombreComercial: tienda.nombreComercial || '',
        razonSocial: tienda.razonSocial || '',
        ruc: tienda.ruc || '',
        direccionFiscal: tienda.direccionFiscal || '',
        telefono: tienda.telefono || '',
        correo: tienda.correo || '',
        nombreDueno: tienda.dueno?.nombreCompleto || '',
        emailDueno: tienda.dueno?.email || '',
        telefonoDueno: tienda.dueno?.telefono || '',
      });
    }
  }, [tienda]);

  if (!tienda) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombreComercial?.trim() || !formData.razonSocial?.trim() || !formData.ruc?.trim()) {
      toast.error('Complete los datos obligatorios de la tienda');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(tienda.id, formData);
      toast.success('Datos de la tienda actualizados exitosamente');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar la tienda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Editar Información de la Tienda</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Actualiza los datos fiscales de la empresa y la información de contacto del propietario.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* SECCIÓN 1: DATOS DE LA EMPRESA */}
          <div className="space-y-3 rounded-lg border border-border/80 bg-slate-50/50 dark:bg-muted/30 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
              <Building className="w-3.5 h-3.5" />
              Datos de la Tienda
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Nombre Comercial</Label>
                <Input
                  value={formData.nombreComercial}
                  onChange={(e) => setFormData({ ...formData, nombreComercial: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">RUC o DNI</Label>
                <Input
                  value={formData.ruc}
                  onChange={(e) => setFormData({ ...formData, ruc: e.target.value.replace(/\D/g, '') })}
                  className="h-8 text-xs font-mono"
                  maxLength={11}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-medium">Razón Social</Label>
                <Input
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-medium">Dirección Fiscal</Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={formData.direccionFiscal}
                    onChange={(e) => setFormData({ ...formData, direccionFiscal: e.target.value })}
                    className="h-8 text-xs pl-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Teléfono Tienda</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="h-8 text-xs pl-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Correo Tienda</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    className="h-8 text-xs pl-8"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DATOS DEL DUEÑO */}
          <div className="space-y-3 rounded-lg border border-border/80 bg-purple-50/40 dark:bg-purple-950/20 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              Contacto del Dueño / Administrador
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-medium">Nombre Completo del Dueño</Label>
                <Input
                  value={formData.nombreDueno}
                  onChange={(e) => setFormData({ ...formData, nombreDueno: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Correo Personal / Administrador</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={formData.emailDueno}
                    onChange={(e) => setFormData({ ...formData, emailDueno: e.target.value })}
                    className="h-8 text-xs pl-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Teléfono / WhatsApp Dueño</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={formData.telefonoDueno}
                    onChange={(e) => setFormData({ ...formData, telefonoDueno: e.target.value })}
                    className="h-8 text-xs pl-8"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
