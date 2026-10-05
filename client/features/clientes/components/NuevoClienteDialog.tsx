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
import { NuevoClientePayload } from '../types/clientes.types';
import { UserPlus, AlertCircle } from 'lucide-react';

interface NuevoClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClienteRegistrado: (payload: NuevoClientePayload) => Promise<void>;
}

export const NuevoClienteDialog: React.FC<NuevoClienteDialogProps> = ({
  open,
  onOpenChange,
  onClienteRegistrado,
}) => {
  const [documentoTipo, setDocumentoTipo] = useState<'DNI' | 'RUC'>('DNI');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorInput, setErrorInput] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInput(null);

    const docLimpio = numeroDocumento.trim();
    if (!docLimpio) {
      setErrorInput('Ingresa el número de documento.');
      return;
    }

    if (documentoTipo === 'DNI' && docLimpio.length !== 8) {
      setErrorInput('El DNI debe tener 8 dígitos numéricos.');
      return;
    }

    if (documentoTipo === 'RUC' && docLimpio.length !== 11) {
      setErrorInput('El RUC debe tener 11 dígitos numéricos.');
      return;
    }

    if (!nombre.trim()) {
      setErrorInput('Ingresa el nombre completo o razón social del cliente.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onClienteRegistrado({
        documentoTipo,
        numeroDocumento: docLimpio,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        correo: correo.trim(),
        direccion: direccion.trim(),
      });
      onOpenChange(false);
      setNumeroDocumento('');
      setNombre('');
      setTelefono('');
      setCorreo('');
      setDireccion('');
      setErrorInput(null);
    } catch {
      setErrorInput('Ocurrió un error al registrar el cliente. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] flex flex-col p-4 sm:p-5 gap-4 overflow-hidden rounded-lg">
        <DialogHeader className="space-y-1 text-left shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <UserPlus className="h-4 w-4 text-primary shrink-0" />
            <span>Registrar nuevo cliente</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Registra los datos de facturación y contacto para emisión de comprobantes en caja y ventas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1 overflow-y-auto flex-1 pr-0.5">
          {/* Tipo y Número de Documento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-xs font-medium text-foreground">Tipo Doc.</Label>
              <Select
                value={documentoTipo}
                onValueChange={(val: 'DNI' | 'RUC') => {
                  setDocumentoTipo(val);
                  setErrorInput(null);
                }}
              >
                <SelectTrigger className="h-9 text-xs border-border bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI" className="text-xs">DNI (8 dígitos)</SelectItem>
                  <SelectItem value="RUC" className="text-xs">RUC (11 dígitos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium text-foreground">Número de Documento</Label>
              <Input
                value={numeroDocumento}
                onChange={(e) => {
                  setNumeroDocumento(e.target.value);
                  if (errorInput) setErrorInput(null);
                }}
                placeholder={documentoTipo === 'DNI' ? '8 dígitos (ej. 45892134)' : '11 dígitos (ej. 20100128211)'}
                required
                maxLength={documentoTipo === 'DNI' ? 8 : 11}
                inputMode="numeric"
                className="h-9 text-xs font-mono border-border bg-card"
              />
            </div>
          </div>

          {/* Nombre o Razón Social */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {documentoTipo === 'DNI' ? 'Nombres y Apellidos' : 'Razón Social Oficial'}
            </Label>
            <Input
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errorInput) setErrorInput(null);
              }}
              placeholder={documentoTipo === 'DNI' ? 'Ej. Juan Carlos Mendoza Pérez' : 'Ej. Distribuciones Comerciales S.A.C.'}
              required
              className="h-9 text-xs border-border bg-card"
            />
          </div>

          {/* Teléfono y Correo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Teléfono / Celular</Label>
              <Input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. 987 654 321"
                inputMode="tel"
                className="h-9 text-xs font-mono border-border bg-card"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Correo electrónico</Label>
              <Input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="h-9 text-xs border-border bg-card"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Dirección fiscal o domicilio</Label>
            <Input
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej. Av. Los Próceres 450, Urb. Las Flores"
              className="h-9 text-xs border-border bg-card"
            />
          </div>

          {/* Alerta de error accesible */}
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
              disabled={isSubmitting || !nombre.trim() || !numeroDocumento.trim()}
              className="text-xs h-9 font-semibold bg-primary text-primary-foreground"
            >
              {isSubmitting ? 'Registrando cliente...' : 'Guardar cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
