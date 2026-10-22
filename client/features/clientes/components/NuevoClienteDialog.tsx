import React, { useEffect, useRef, useState } from 'react';
import { Controller, Resolver, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormError } from '@/components/common/FormError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Cliente, NuevoClientePayload } from '../types/clientes.types';
import { clienteSchema } from '../utils/clienteValidation';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClienteRegistrado: (payload: NuevoClientePayload) => Promise<void>;
  cliente?: Cliente;
  onClienteActualizado?: (id: string, payload: NuevoClientePayload) => Promise<void>;
}

const emptyValues: NuevoClientePayload = { documentoTipo: 'DNI', numeroDocumento: '', nombre: '', telefono: '', correo: '', direccion: '' };

export const NuevoClienteDialog: React.FC<Props> = ({ open, onOpenChange, onClienteRegistrado, cliente, onClienteActualizado }) => {
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const submitting = useRef(false);
  const form = useForm<NuevoClientePayload>({
    resolver: zodResolver(clienteSchema) as Resolver<NuevoClientePayload>,
    mode: 'onBlur',
    defaultValues: emptyValues,
  });
  const { reset } = form;

  useEffect(() => {
    if (!open) return;
    reset(cliente ? {
      documentoTipo: cliente.documentoTipo,
      numeroDocumento: cliente.numeroDocumento,
      nombre: cliente.nombre,
      telefono: cliente.telefono === '-' ? '' : cliente.telefono,
      correo: cliente.correo === '-' ? '' : cliente.correo,
      direccion: cliente.direccion === 'Mostrador Tienda' ? '' : cliente.direccion,
    } : emptyValues);
    setErrorGeneral(null);
  }, [open, cliente, reset]);

  const solicitarCierre = (siguiente: boolean) => {
    if (!siguiente && form.formState.isDirty && !guardando) setConfirmarDescarte(true);
    else if (!guardando) onOpenChange(siguiente);
  };

  const guardar = async (payload: NuevoClientePayload) => {
    if (submitting.current) return;
    submitting.current = true;
    setGuardando(true);
    setErrorGeneral(null);
    try {
      if (cliente && onClienteActualizado) await onClienteActualizado(cliente.id, payload);
      else await onClienteRegistrado(payload);
      form.reset(emptyValues);
      onOpenChange(false);
    } catch (error) {
      setErrorGeneral(error instanceof Error ? error.message : 'No se pudo guardar el cliente. Conserva los datos e inténtalo de nuevo.');
    } finally {
      submitting.current = false;
      setGuardando(false);
    }
  };

  const errorField = (name: keyof NuevoClientePayload) => form.formState.errors[name]?.message;

  return <>
    <Dialog open={open} onOpenChange={solicitarCierre}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-xl max-h-[92dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold">{cliente ? 'Editar cliente' : 'Registrar cliente'}</DialogTitle>
          <DialogDescription>{cliente ? 'Actualiza la ficha. Las ventas anteriores conservarán los datos del comprobante.' : 'Guarda los datos de contacto y facturación para encontrarlos al vender.'}</DialogDescription>
        </DialogHeader>
        <form id="cliente-form" onSubmit={form.handleSubmit(guardar)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cliente-tipo-documento">Tipo de documento</Label>
              <Controller control={form.control} name="documentoTipo" render={({ field }) => <Select value={field.value} onValueChange={field.onChange} disabled={guardando}>
                <SelectTrigger id="cliente-tipo-documento" className="h-11 text-base md:h-9 md:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="DNI">DNI</SelectItem><SelectItem value="RUC">RUC</SelectItem></SelectContent>
              </Select>} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cliente-documento">Número de documento</Label>
              <Input id="cliente-documento" inputMode="numeric" autoComplete="off" maxLength={14} aria-invalid={!!errorField('numeroDocumento')} aria-describedby={errorField('numeroDocumento') ? 'cliente-documento-error' : undefined} {...form.register('numeroDocumento')} className="h-11 font-mono text-base md:h-9 md:text-sm" />
              {errorField('numeroDocumento') && <p id="cliente-documento-error" className="text-sm text-danger-text">{errorField('numeroDocumento')}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente-nombre">{form.watch('documentoTipo') === 'DNI' ? 'Nombres y apellidos' : 'Razón social'}</Label>
            <Input id="cliente-nombre" autoComplete="name" aria-invalid={!!errorField('nombre')} aria-describedby={errorField('nombre') ? 'cliente-nombre-error' : undefined} {...form.register('nombre')} className="h-11 text-base md:h-9 md:text-sm" />
            {errorField('nombre') && <p id="cliente-nombre-error" className="text-sm text-danger-text">{errorField('nombre')}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="cliente-telefono">Teléfono (opcional)</Label><Input id="cliente-telefono" type="tel" autoComplete="tel" aria-invalid={!!errorField('telefono')} {...form.register('telefono')} className="h-11 text-base md:h-9 md:text-sm" />{errorField('telefono') && <p className="text-sm text-danger-text">{errorField('telefono')}</p>}</div>
            <div className="space-y-2"><Label htmlFor="cliente-correo">Correo (opcional)</Label><Input id="cliente-correo" type="email" autoComplete="email" aria-invalid={!!errorField('correo')} {...form.register('correo')} className="h-11 text-base md:h-9 md:text-sm" />{errorField('correo') && <p className="text-sm text-danger-text">{errorField('correo')}</p>}</div>
          </div>
          <div className="space-y-2"><Label htmlFor="cliente-direccion">Dirección (opcional)</Label><Input id="cliente-direccion" autoComplete="street-address" aria-invalid={!!errorField('direccion')} {...form.register('direccion')} className="h-11 text-base md:h-9 md:text-sm" />{errorField('direccion') && <p className="text-sm text-danger-text">{errorField('direccion')}</p>}</div>
          <FormError message={errorGeneral} />
        </form>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="h-11 sm:h-9" disabled={guardando} onClick={() => solicitarCierre(false)}>Cancelar</Button>
          <Button type="submit" form="cliente-form" className="h-11 sm:h-9" disabled={guardando}>{guardando ? 'Guardando…' : cliente ? 'Guardar cambios' : 'Registrar cliente'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <AlertDialog open={confirmarDescarte} onOpenChange={setConfirmarDescarte}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>¿Descartar los cambios?</AlertDialogTitle><AlertDialogDescription>Los datos que escribiste en esta ficha se perderán.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Seguir editando</AlertDialogCancel><AlertDialogAction onClick={() => { form.reset(emptyValues); setConfirmarDescarte(false); onOpenChange(false); }}>Descartar cambios</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
};
