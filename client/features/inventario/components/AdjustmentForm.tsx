import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmationDialog } from './ConfirmationDialog';
import { ItemStockDetalle, NuevoAjustePayload } from '../types/inventario.types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AdjustmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: ItemStockDetalle[];
  onGuardarAjuste: (payload: NuevoAjustePayload) => Promise<void>;
  productoInicialId?: string;
}

const MOTIVOS_AJUSTE = [
  'Conteo físico',
  'Merma / daño de envase',
  'Vencimiento de producto',
  'Error de conteo previo',
  'Devolución de cliente no registrada',
  'Consumo o muestra interna',
  'Otro motivo',
];

/**
 * Formulario guiado y minimalista para nuevo ajuste de inventario.
 * Incorpora cálculo en vivo de diferencia y confirmación paso a paso de dos fases (Nielsen: prevención de errores).
 */
export const AdjustmentForm: React.FC<AdjustmentFormProps> = ({
  open,
  onOpenChange,
  productos,
  onGuardarAjuste,
  productoInicialId,
}) => {
  const [productoId, setProductoId] = useState<string>(productoInicialId || '');
  const [nuevoStockInput, setNuevoStockInput] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('Conteo físico');
  const [observacion, setObservacion] = useState<string>('');
  const [errorInput, setErrorInput] = useState<string | null>(null);

  // Estado del diálogo de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sincronizar producto si se pasa prop inicial
  React.useEffect(() => {
    if (productoInicialId) {
      setProductoId(productoInicialId);
    } else if (productos.length > 0 && !productoId) {
      setProductoId(productos[0].id);
    }
  }, [productoInicialId, productos]);

  const productoSeleccionado = productos.find((p) => p.id === productoId);
  const stockActual = productoSeleccionado ? productoSeleccionado.stock : 0;

  const nuevoStockNum = nuevoStockInput === '' ? stockActual : Number(nuevoStockInput);
  const diferencia = nuevoStockNum - stockActual;

  const handleOpenConfirm = () => {
    setErrorInput(null);
    if (!productoId) {
      setErrorInput('Debes seleccionar un producto.');
      return;
    }
    if (nuevoStockInput === '') {
      setErrorInput('Ingresa el nuevo stock real del producto.');
      return;
    }
    const val = Number(nuevoStockInput);
    if (isNaN(val) || val < 0) {
      setErrorInput('La cantidad debe ser un número mayor o igual a 0.');
      return;
    }
    if (diferencia === 0) {
      setErrorInput('El nuevo stock es idéntico al actual (diferencia 0). No requiere ajuste.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmarYGuardar = async () => {
    if (!productoSeleccionado) return;
    setSaving(true);
    try {
      await onGuardarAjuste({
        productoId: productoSeleccionado.id,
        nuevoStock: Math.max(0, nuevoStockNum),
        motivo,
        observacion: observacion.trim() || undefined,
        almacen: productoSeleccionado.almacen || 'Almacén Principal',
      });

      toast.success(
        `Ajuste realizado correctamente. El stock de ${productoSeleccionado.nombre} se actualizó de ${stockActual} a ${nuevoStockNum} unidades.`
      );

      setShowConfirmModal(false);
      onOpenChange(false);
      setNuevoStockInput('');
      setObservacion('');
    } catch {
      toast.error('No se pudo guardar el ajuste. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-5 gap-4 rounded-lg">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-semibold text-foreground">
              Nuevo ajuste de inventario
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Registra una corrección puntual cuando el stock físico no coincide con el sistema.
            </p>
          </DialogHeader>

          <div className="space-y-3.5 py-1">
            {/* 1. Selector de Producto */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Producto</Label>
              <Select value={productoId} onValueChange={(val) => {
                setProductoId(val);
                setNuevoStockInput('');
                setErrorInput(null);
              }}>
                <SelectTrigger className="h-9 text-xs border-border bg-card">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {productos.map((prod) => (
                    <SelectItem key={prod.id} value={prod.id} className="text-xs">
                      {prod.nombre} ({prod.sku}) — Stock: {prod.stock} {(prod.unidadMedida || 'unidades').toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Comparación Visual: Stock Actual vs Nuevo Stock */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-md bg-muted/40 border border-border">
              <div>
                <span className="text-xs text-muted-foreground block">Stock registrado actual</span>
                <span className="text-base font-semibold font-mono text-foreground tabular-nums block mt-0.5">
                  {stockActual} {(productoSeleccionado?.unidadMedida || 'unidades').toLowerCase()}
                </span>
                <span className="text-[11px] text-muted-foreground block">Automático del sistema</span>
              </div>

              <div>
                <Label htmlFor="input-nuevo-stock" className="text-xs font-medium text-foreground block">
                  Nuevo stock real
                </Label>
                <Input
                  id="input-nuevo-stock"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder={String(stockActual)}
                  value={nuevoStockInput}
                  onChange={(e) => {
                    setNuevoStockInput(e.target.value);
                    setErrorInput(null);
                  }}
                  className="h-9 text-sm font-mono mt-1 border-border bg-card focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Diferencia calculada en tiempo real */}
            {nuevoStockInput !== '' && (
              <div
                className={cn(
                  'flex items-center justify-between p-2.5 rounded border text-xs',
                  diferencia < 0 && 'bg-danger-soft text-danger-text border-destructive/20',
                  diferencia > 0 && 'bg-success-soft text-success-text border-success/20',
                  diferencia === 0 && 'bg-muted/50 text-muted-foreground border-border'
                )}
              >
                <span className="font-medium">Diferencia resultante:</span>
                <span className="font-mono font-semibold tabular-nums text-sm">
                  {diferencia > 0 ? `+${diferencia}` : diferencia} unidades
                </span>
              </div>
            )}

            {/* 3. Motivo del ajuste */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Motivo del ajuste</Label>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger className="h-9 text-xs border-border bg-card">
                  <SelectValue placeholder="Selecciona el motivo" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_AJUSTE.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Observación (opcional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="input-observacion" className="text-xs font-medium text-foreground">
                  Observación o detalle
                </Label>
                <span className="text-[11px] text-muted-foreground">(opcional)</span>
              </div>
              <Textarea
                id="input-observacion"
                rows={2}
                placeholder="Ej. Envase dañado en traslado, conteo mensual verificado..."
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                className="text-xs resize-none border-border bg-card"
              />
            </div>

            {/* Error accesible */}
            {errorInput && (
              <div className="flex items-center gap-1.5 text-xs text-danger-text">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errorInput}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-row items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleOpenConfirm}
              className="text-xs h-9 font-semibold bg-primary text-primary-foreground"
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación estricta de 2da fase para evitar errores accidentales */}
      <ConfirmationDialog
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        title="¿Confirmar ajuste de inventario?"
        description={`Estás a punto de modificar el stock registrado de "${productoSeleccionado?.nombre}".`}
        confirmLabel="Confirmar y aplicar"
        cancelLabel="Volver y revisar"
        loading={saving}
        onConfirm={handleConfirmarYGuardar}
      >
        <div className="p-3.5 rounded-md bg-muted/40 border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Stock actual:</span>
            <strong className="text-foreground font-mono tabular-nums">{stockActual}</strong>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Nuevo stock:</span>
            <strong className="text-foreground font-mono tabular-nums">{nuevoStockNum}</strong>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border font-medium">
            <span>Diferencia:</span>
            <span
              className={cn(
                'font-mono font-semibold tabular-nums text-sm',
                diferencia < 0 ? 'text-danger-text' : 'text-success-text'
              )}
            >
              {diferencia > 0 ? `+${diferencia}` : diferencia} unidades
            </span>
          </div>
          <div className="pt-1 text-[11px] text-muted-foreground">
            Motivo: <strong className="text-foreground">{motivo}</strong>
          </div>
        </div>
      </ConfirmationDialog>
    </>
  );
};
