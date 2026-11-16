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
import { Store, User, Lock, Mail, Phone, MapPin, Building, Key, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { CrearTiendaPayload } from '../types/superAdmin.types';

interface CrearTiendaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CrearTiendaPayload) => Promise<void>;
}

export const CrearTiendaModal: React.FC<CrearTiendaModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CrearTiendaPayload>({
    nombreComercial: '',
    razonSocial: '',
    ruc: '',
    direccionFiscal: '',
    telefono: '',
    correo: '',
    nombreDueno: '',
    usernameDueno: '',
    emailDueno: '',
    passwordDueno: '',
    telefonoDueno: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.nombreComercial.trim()) {
      errs.nombreComercial = 'El nombre comercial es obligatorio';
    }
    if (!formData.razonSocial.trim()) {
      errs.razonSocial = 'La razón social es obligatoria';
    }
    if (!formData.ruc.trim()) {
      errs.ruc = 'El RUC o documento es obligatorio';
    } else if (formData.ruc.trim().length !== 11 && formData.ruc.trim().length !== 8) {
      errs.ruc = 'El RUC debe tener 11 dígitos (o DNI de 8 dígitos)';
    }

    if (!formData.nombreDueno.trim()) {
      errs.nombreDueno = 'El nombre completo del dueño es obligatorio';
    }
    if (!formData.usernameDueno.trim()) {
      errs.usernameDueno = 'El usuario de acceso es obligatorio';
    } else if (/\s/.test(formData.usernameDueno)) {
      errs.usernameDueno = 'El usuario no puede contener espacios';
    }
    if (!formData.emailDueno.trim()) {
      errs.emailDueno = 'El correo del dueño es obligatorio';
    } else if (!formData.emailDueno.includes('@')) {
      errs.emailDueno = 'Ingrese un correo electrónico válido';
    }
    if (!formData.passwordDueno || formData.passwordDueno.length < 6) {
      errs.passwordDueno = 'La contraseña debe tener mínimo 6 caracteres';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Por favor complete los campos obligatorios requeridos');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      toast.success(`Tienda "${formData.nombreComercial}" y usuario dueño creados exitosamente`);
      onOpenChange(false);
      // Reset form
      setFormData({
        nombreComercial: '',
        razonSocial: '',
        ruc: '',
        direccionFiscal: '',
        telefono: '',
        correo: '',
        nombreDueno: '',
        usernameDueno: '',
        emailDueno: '',
        passwordDueno: '',
        telefonoDueno: '',
      });
      setErrors({});
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear la tienda en el servidor');
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
              <DialogTitle className="text-lg font-bold">Registrar Nueva Tienda y Dueño</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Crea una nueva organización independiente con sucursal principal y acceso para su administrador.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* SECCIÓN 1: DATOS DE LA TIENDA / EMPRESA */}
          <div className="space-y-3 rounded-lg border border-border/80 bg-slate-50/50 dark:bg-muted/30 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
              <Building className="w-3.5 h-3.5" />
              1. Datos de la Tienda (Empresa)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  Nombre Comercial <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Ej. Minimarket La Esquina"
                  value={formData.nombreComercial}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      nombreComercial: val,
                      razonSocial: prev.razonSocial ? prev.razonSocial : val.toUpperCase(),
                    }));
                  }}
                  className="h-8 text-xs"
                />
                {errors.nombreComercial && (
                  <p className="text-[11px] text-destructive">{errors.nombreComercial}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  RUC o DNI <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="20601234567"
                  value={formData.ruc}
                  onChange={(e) => setFormData({ ...formData, ruc: e.target.value.replace(/\D/g, '') })}
                  maxLength={11}
                  className="h-8 text-xs font-mono"
                />
                {errors.ruc && <p className="text-[11px] text-destructive">{errors.ruc}</p>}
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-medium">
                  Razón Social <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Ej. COMERCIAL LA ESQUINA S.A.C."
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                  className="h-8 text-xs"
                />
                {errors.razonSocial && (
                  <p className="text-[11px] text-destructive">{errors.razonSocial}</p>
                )}
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-medium">Dirección Fiscal / Ubicación</Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Ej. Jr. Ucayali 245, Tingo María, Huánuco"
                    value={formData.direccionFiscal}
                    onChange={(e) => setFormData({ ...formData, direccionFiscal: e.target.value })}
                    className="h-8 text-xs pl-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Teléfono / WhatsApp Tienda</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="962123456"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="h-8 text-xs pl-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Correo Electrónico Tienda</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="ventas@laesquina.pe"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    className="h-8 text-xs pl-8"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DATOS DEL DUEÑO / ADMINISTRADOR */}
          <div className="space-y-3 rounded-lg border border-border/80 bg-purple-50/40 dark:bg-purple-950/20 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                <User className="w-3.5 h-3.5" />
                2. Usuario Dueño / Administrador de la Tienda
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-medium">
                Rol: Dueño / Administrador
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs font-medium">
                  Nombre Completo del Dueño <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Ej. Carlos Mendoza Vásquez"
                  value={formData.nombreDueno}
                  onChange={(e) => setFormData({ ...formData, nombreDueno: e.target.value })}
                  className="h-8 text-xs"
                />
                {errors.nombreDueno && (
                  <p className="text-[11px] text-destructive">{errors.nombreDueno}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  Usuario para Iniciar Sesión <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="cmendoza"
                    value={formData.usernameDueno}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usernameDueno: e.target.value.toLowerCase().replace(/\s/g, ''),
                      })
                    }
                    className="h-8 text-xs pl-8 font-mono"
                  />
                </div>
                {errors.usernameDueno && (
                  <p className="text-[11px] text-destructive">{errors.usernameDueno}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  Contraseña Inicial <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Key className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.passwordDueno}
                    onChange={(e) => setFormData({ ...formData, passwordDueno: e.target.value })}
                    className="h-8 text-xs pl-8"
                  />
                </div>
                {errors.passwordDueno && (
                  <p className="text-[11px] text-destructive">{errors.passwordDueno}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  Correo Electrónico <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="cmendoza@gmail.com"
                    value={formData.emailDueno}
                    onChange={(e) => setFormData({ ...formData, emailDueno: e.target.value })}
                    className="h-8 text-xs pl-8"
                  />
                </div>
                {errors.emailDueno && (
                  <p className="text-[11px] text-destructive">{errors.emailDueno}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Teléfono / WhatsApp Personal</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="999888777"
                    value={formData.telefonoDueno}
                    onChange={(e) => setFormData({ ...formData, telefonoDueno: e.target.value })}
                    className="h-8 text-xs pl-8"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
              Al crearse, este usuario podrá ingresar al sistema para gestionar su tienda y crear sus propios cajeros y almaceneros.
            </p>
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
              Crear Tienda y Habilitar Acceso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
