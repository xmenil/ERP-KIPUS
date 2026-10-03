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
import { AjusteAuditoriaPayload, ItemStockDetalle } from '../types/inventario.types';
import { ClipboardCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface AuditoriaConteoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: ItemStockDetalle[];
  productoInicialId?: string;
  onAjustar: (payload: AjusteAuditoriaPayload) => Promise<void>;
  almacenActual?: string;
}

export const AuditoriaConteoDialog: React.FC<AuditoriaConteoDialogProps> = ({
  open,
  onOpenChange,
  productos,
  productoInicialId,
  onAjustar,
  almacenActual = 'Almacén Principal',
}) => {
  const [productoId, setProductoId] = useState(
    productoInicialId || productos[0]?.id || ''
  );

  const productoSeleccionado =
    productos.find((p) => p.id === (productoId || productoInicialId)) || productos[0];

  const stockSistema = productoSeleccionado?.stock ?? 0;
  const [stockFisico, setStockFisico] = useState<number>(stockSistema);
  const [motivo, setMotivo] = useState('Diferencia por conteo físico');
  const [observacion, setObservacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizar stock cuando cambia el producto
  const handleSelectProducto = (id: string) => {
    setProductoId(id);
    const prod = productos.find((p) => p.id === id);
    if (prod) {
      setStockFisico(prod.stock);
    }
  };

  const diferencia = (stockFisico ?? 0) - stockSistema;
  const costoDiferencia = Math.abs(diferencia * (productoSeleccionado?.precioCompra || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionado) {
      toast.error('Selecciona un producto para auditar');
      return;
    }

    if (diferencia === 0) {
      toast.info('El conteo físico coincide con el sistema, no requiere ajuste');
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAjustar({
        productoId: productoSeleccionado.id,
        stockReal: Number(stockFisico),
        motivo,
        observacion: observacion.trim() || undefined,
        almacen: almacenActual,
      });

      toast.success(
        `Auditoría registrada: Stock de ${productoSeleccionado.nombre} ajustado a ${stockFisico} unid.`
      );
      onOpenChange(false);
      setObservacion('');
    } catch {
      toast.error('No se pudo registrar el ajuste de inventario');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <span>Auditoría y Recuento Físico</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Paso 5 del ciclo: Coteja lo que contaste físicamente en tu local con lo que dice la computadora y ajusta la diferencia.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          {/* Selector de producto */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Producto a auditar</Label>
            <Select
              value={productoSeleccionado?.id || ''}
              onValueChange={handleSelectProducto}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Selecciona un artículo..." />
              </SelectTrigger>
              <SelectContent>
                {productos.map((prod) => (
                  <SelectItem key={prod.id} value={prod.id} className="text-xs">
                    {prod.nombre} · Sistema: {prod.stock} {prod.unidadMedida.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {productoSeleccionado && (
              <span className="text-[11px] text-muted-foreground block font-mono">
                SKU: {productoSeleccionado.sku} · Ubicación: {productoSeleccionado.ubicacion}
              </span>
            )}
          </div>

          {/* Comparativo: Sistema vs Físico */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-md border border-border bg-muted/30">
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">
                Stock según sistema
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-mono tabular-nums text-foreground">
                  {stockSistema}
                </span>
                <span className="text-xs text-muted-foreground">
                  {productoSeleccionado?.unidadMedida.toLowerCase()}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-foreground">
                ¿Cuánto contaste físicamente?
              </Label>
              <Input
                type="number"
                min="0"
                value={stockFisico}
                onChange={(e) => setStockFisico(Number(e.target.value))}
                className="h-8 text-xs font-bold font-mono text-center tabular-nums bg-card"
                required
              />
            </div>
          </div>

          {/* Indicador de Descuadre / Diferencia */}
          <div
            className={`p-2.5 rounded border text-xs flex items-start gap-2.5 ${
              diferencia === 0
                ? 'bg-success-soft text-success-text border-success/30'
                : diferencia < 0
                ? 'bg-danger-soft text-danger-text border-destructive/30'
                : 'bg-primary-soft text-primary border-primary/30'
            }`}
          >
            {diferencia === 0 ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
            )}
            <div className="space-y-0.5">
              <span className="font-semibold block">
                {diferencia === 0
                  ? 'Conteo exacto: Físico y sistema coinciden'
                  : diferencia < 0
                  ? `Faltante de ${Math.abs(diferencia)} unid. (Pérdida en costo: S/ ${costoDiferencia.toFixed(2)})`
                  : `Sobrante de ${diferencia} unid. (Valor adicional: S/ ${costoDiferencia.toFixed(2)})`}
              </span>
              <p className="text-[11px] opacity-90 leading-tight">
                {diferencia === 0
                  ? 'No hay descuadre en almacén.'
                  : diferencia < 0
                  ? 'Se generará una salida en Kardex por merma/ajuste para corregir el saldo a lo real.'
                  : 'Se generará una entrada en Kardex por sobrante para corregir el saldo a lo real.'}
              </p>
            </div>
          </div>

          {/* Motivo del descuadre */}
          {diferencia !== 0 && (
            <>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Motivo de la diferencia</Label>
                <Select value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diferencia por conteo físico periódico">
                      Conteo físico rutinario de inventario
                    </SelectItem>
                    <SelectItem value="Merma por producto deteriorado o roto">
                      Merma por rotura, daño o vencimiento
                    </SelectItem>
                    <SelectItem value="Despacho o venta no anotada en el turno">
                      Despacho no anotado en el sistema
                    </SelectItem>
                    <SelectItem value="Ingreso de proveedor no registrado oportunamente">
                      Ingreso no registrado de mercadería
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Observación detallada (opcional)</Label>
                <Input
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Ej. Se encontraron 2 botellas rajadas en el anaquel B-2"
                  className="h-8 text-xs"
                />
              </div>
            </>
          )}

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
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || diferencia === 0}
              className="font-semibold"
            >
              {isSubmitting ? 'Ajustando saldo...' : 'Guardar ajuste de auditoría'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
