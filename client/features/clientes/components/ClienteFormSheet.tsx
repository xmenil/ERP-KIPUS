import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import {
  Cliente,
  NuevoClientePayload,
  TipoDocumentoCliente,
  TipoCliente,
} from '../types/clientes.types';
import {
  UserPlus,
  UserCheck,
  Building,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ClienteFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardarCliente: (payload: NuevoClientePayload, clienteId?: string) => Promise<void>;
  clienteAEditar?: Cliente | null;
}

export const ClienteFormSheet: React.FC<ClienteFormSheetProps> = ({
  open,
  onOpenChange,
  onGuardarCliente,
  clienteAEditar = null,
}) => {
  const [documentoTipo, setDocumentoTipo] = useState<TipoDocumentoCliente>('DNI');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipoCliente, setTipoCliente] = useState<TipoCliente>('MINORISTA');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [limiteCredito, setLimiteCredito] = useState<string>('300');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorInput, setErrorInput] = useState<string | null>(null);

  useEffect(() => {
    if (clienteAEditar) {
      setDocumentoTipo(clienteAEditar.documentoTipo);
      setNumeroDocumento(clienteAEditar.numeroDocumento);
      setNombre(clienteAEditar.nombre);
      setTipoCliente(clienteAEditar.tipoCliente || 'MINORISTA');
      setTelefono(clienteAEditar.telefono || '');
      setCorreo(clienteAEditar.correo || '');
      setDireccion(clienteAEditar.direccion || '');
      setLimiteCredito(String(clienteAEditar.limiteCredito || 300));
    } else {
      setDocumentoTipo('DNI');
      setNumeroDocumento('');
      setNombre('');
      setTipoCliente('MINORISTA');
      setTelefono('');
      setCorreo('');
      setDireccion('');
      setLimiteCredito('300');
    }
    setErrorInput(null);
  }, [clienteAEditar, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInput(null);

    const docLimpio = numeroDocumento.trim();
    if (documentoTipo === 'DNI' && docLimpio.length !== 8) {
      setErrorInput('El DNI debe tener exactamente 8 dígitos.');
      return;
    }
    if (documentoTipo === 'RUC' && docLimpio.length !== 11) {
      setErrorInput('El RUC debe tener exactamente 11 dígitos.');
      return;
    }
    if (!nombre.trim()) {
      setErrorInput('Ingresa el nombre o razón social del cliente.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onGuardarCliente(
        {
          documentoTipo,
          numeroDocumento: docLimpio,
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          correo: correo.trim(),
          direccion: direccion.trim(),
          tipoCliente,
          limiteCredito: Number(limiteCredito) || 300,
        },
        clienteAEditar?.id
      );

      onOpenChange(false);
    } catch {
      setErrorInput('Ocurrió un error al guardar el cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto flex flex-col p-6">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            {clienteAEditar ? (
              <UserCheck className="h-5 w-5 text-primary" />
            ) : (
              <UserPlus className="h-5 w-5 text-primary" />
            )}
            <span>{clienteAEditar ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</span>
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Identificación tributaria oficial (DNI/RUC), canales de contacto y línea de crédito comercial.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 py-4 text-xs">
          {errorInput && (
            <div className="p-3 rounded-lg border border-danger-soft bg-danger-soft/40 text-danger-text flex items-center gap-2 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorInput}</span>
            </div>
          )}

          {/* Tipo de Documento y Número */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1 space-y-1">
              <Label className="text-xs font-semibold text-foreground">Documento *</Label>
              <Select
                value={documentoTipo}
                onValueChange={(val) => {
                  setDocumentoTipo(val as TipoDocumentoCliente);
                  if (val === 'RUC') setTipoCliente('MAYORISTA');
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI" className="text-xs">
                    DNI (8 dígs)
                  </SelectItem>
                  <SelectItem value="RUC" className="text-xs">
                    RUC (11 dígs)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-semibold text-foreground">
                N° Documento Identidad *
              </Label>
              <Input
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value.replace(/\D/g, ''))}
                maxLength={documentoTipo === 'DNI' ? 8 : 11}
                placeholder={documentoTipo === 'DNI' ? '8 dígitos' : '11 dígitos'}
                className="h-9 text-xs font-mono font-semibold"
                required
              />
            </div>
          </div>

          {/* Nombre o Razón Social */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">
              {documentoTipo === 'RUC' ? 'Razón Social de la Empresa *' : 'Nombres y Apellidos *'}
            </Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={documentoTipo === 'RUC' ? 'Ej. Distribuciones del Oriente S.A.C.' : 'Ej. Juan Carlos Pérez'}
              className="h-9 text-xs"
              required
            />
          </div>

          {/* Tipo de Cliente */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">Tipo de Cliente Comercial *</Label>
            <Select value={tipoCliente} onValueChange={(val) => setTipoCliente(val as TipoCliente)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MINORISTA" className="text-xs">
                  Minorista (Consumidor final / Vecino)
                </SelectItem>
                <SelectItem value="MAYORISTA" className="text-xs">
                  Mayorista (Comerciante / Reventa)
                </SelectItem>
                <SelectItem value="CORPORATIVO" className="text-xs">
                  Corporativo / Institucional
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Teléfono / WhatsApp */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Teléfono / WhatsApp</span>
            </Label>
            <Input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej. +51 987 654 321"
              className="h-9 text-xs font-mono"
            />
          </div>

          {/* Correo Electrónico */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Correo Electrónico</span>
            </Label>
            <Input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="cliente@ejemplo.com"
              className="h-9 text-xs"
            />
          </div>

          {/* Dirección */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Dirección Fiscal o Domicilio</span>
            </Label>
            <Input
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej. Jr. Miraflores 450, Tingo María"
              className="h-9 text-xs"
            />
          </div>

          {/* Límite de Crédito (Fiado) */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span>Límite Autorizado para Fiados (S/)</span>
            </Label>
            <Input
              type="number"
              step="50"
              min="0"
              value={limiteCredito}
              onChange={(e) => setLimiteCredito(e.target.value)}
              placeholder="300.00"
              className="h-9 text-xs font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Monto máximo permitido para ventas al crédito antes de solicitar autorización.
            </p>
          </div>

          <SheetFooter className="pt-4 border-t border-border flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs bg-primary text-primary-foreground font-semibold gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{clienteAEditar ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
