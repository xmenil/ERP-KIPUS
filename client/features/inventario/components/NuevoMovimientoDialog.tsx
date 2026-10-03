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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TipoMovimiento, MotivoMovimiento, NuevoMovimientoPayload, AlmacenResumen } from '../types/inventario.types';
import { productosService } from '@/features/productos/services/productosService';
import { Producto } from '@/features/productos/types/productos.types';
import { AlertCircle, Loader2 } from 'lucide-react';

interface NuevoMovimientoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMovimientoCreado: (payload: NuevoMovimientoPayload) => Promise<void>;
  almacenes?: AlmacenResumen[];
}

export const NuevoMovimientoDialog: React.FC<NuevoMovimientoDialogProps> = ({
  open,
  onOpenChange,
  onMovimientoCreado,
  almacenes = [],
}) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [selectedProductoId, setSelectedProductoId] = useState<string>('');

  const [tipo, setTipo] = useState<TipoMovimiento>('ENTRADA');
  const [motivo, setMotivo] = useState<MotivoMovimiento>('COMPRA');
  const [almacen, setAlmacen] = useState<string>('Almacén Principal (Sede Central)');
  const [cantidad, setCantidad] = useState<number>(1);
  const [referencia, setReferencia] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Cargar lista de productos activos al abrir el diálogo
  useEffect(() => {
    if (open) {
      setLoadingProductos(true);
      setErrorValidacion(null);
      productosService
        .getProductos()
        .then((items) => {
          setProductos(items);
          if (items.length > 0 && !selectedProductoId) {
            setSelectedProductoId(items[0].id);
          }
        })
        .finally(() => setLoadingProductos(false));
    }
  }, [open, selectedProductoId]);

  // Sincronizar almacén por defecto si se reciben almacenes
  useEffect(() => {
    if (almacenes.length > 0 && !almacen) {
      setAlmacen(almacenes[0].nombre);
    }
  }, [almacenes, almacen]);

  // Cambiar el motivo predeterminado según el tipo de movimiento
  const handleTipoChange = (val: TipoMovimiento) => {
    setTipo(val);
    setErrorValidacion(null);
    if (val === 'ENTRADA') {
      setMotivo('COMPRA');
    } else if (val === 'SALIDA') {
      setMotivo('VENTA');
    } else {
      setMotivo('INVENTARIO_INICIAL');
    }
  };

  const selectedProducto = productos.find((p) => p.id === selectedProductoId);
  const stockActual = selectedProducto?.stock ?? 0;

  // Cálculo del nuevo stock proyectado
  let stockProyectado = stockActual;
  if (tipo === 'ENTRADA') {
    stockProyectado = stockActual + cantidad;
  } else if (tipo === 'SALIDA') {
    stockProyectado = Math.max(0, stockActual - cantidad);
  } else {
    stockProyectado = cantidad;
  }

  const advertenciaSalida = tipo === 'SALIDA' && cantidad > stockActual;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProducto) {
      setErrorValidacion('Debes seleccionar un producto válido');
      return;
    }
    if (cantidad <= 0) {
      setErrorValidacion('La cantidad debe ser mayor a 0');
      return;
    }

    setIsSubmitting(true);
    setErrorValidacion(null);
    try {
      await onMovimientoCreado({
        tipo,
        motivo,
        productoNombre: selectedProducto.nombre,
        sku: selectedProducto.sku,
        almacen: almacen || 'Almacén Principal',
        cantidad: Number(cantidad),
        referencia: referencia.trim() || 'Ajuste interno de almacén',
      });
      onOpenChange(false);
      setReferencia('');
      setCantidad(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Registrar movimiento de almacén</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Actualiza las existencias físicas y genera trazabilidad en el Kardex.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Selector de Producto */}
          <div className="space-y-1.5">
            <Label htmlFor="producto-select" className="text-xs font-medium text-foreground">
              Producto
            </Label>
            {loadingProductos ? (
              <div className="h-9 rounded-md border border-input bg-muted/30 px-3 flex items-center text-xs text-muted-foreground">
                Cargando catálogo de productos…
              </div>
            ) : (
              <Select value={selectedProductoId} onValueChange={setSelectedProductoId}>
                <SelectTrigger id="producto-select" className="h-9 text-sm">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {productos.map((prod) => (
                    <SelectItem key={prod.id} value={prod.id} className="text-sm">
                      {prod.nombre} (SKU: {prod.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedProducto && (
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                <span>
                  SKU: <span className="font-mono font-medium text-foreground">{selectedProducto.sku}</span>
                </span>
                <span>
                  Stock en sistema:{' '}
                  <span className="font-medium text-foreground tabular-nums">{stockActual} unid.</span>
                </span>
              </div>
            )}
          </div>

          {/* Tipo de movimiento y Motivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tipo-movimiento" className="text-xs font-medium text-foreground">
                Tipo de movimiento
              </Label>
              <Select value={tipo} onValueChange={(val: TipoMovimiento) => handleTipoChange(val)}>
                <SelectTrigger id="tipo-movimiento" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada (Ingreso)</SelectItem>
                  <SelectItem value="SALIDA">Salida (Despacho)</SelectItem>
                  <SelectItem value="AJUSTE">Ajuste por conteo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="motivo-movimiento" className="text-xs font-medium text-foreground">
                Motivo
              </Label>
              <Select value={motivo} onValueChange={(val: MotivoMovimiento) => setMotivo(val)}>
                <SelectTrigger id="motivo-movimiento" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipo === 'ENTRADA' && (
                    <>
                      <SelectItem value="COMPRA">Recepción por compra</SelectItem>
                      <SelectItem value="INVENTARIO_INICIAL">Inventario inicial</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferencia recibida</SelectItem>
                    </>
                  )}
                  {tipo === 'SALIDA' && (
                    <>
                      <SelectItem value="VENTA">Despacho por venta</SelectItem>
                      <SelectItem value="MERMA">Merma o daño físico</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferencia a otra sede</SelectItem>
                    </>
                  )}
                  {tipo === 'AJUSTE' && (
                    <>
                      <SelectItem value="INVENTARIO_INICIAL">Ajuste por auditoría física</SelectItem>
                      <SelectItem value="MERMA">Corrección por faltante</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Almacén y Cantidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="almacen-select" className="text-xs font-medium text-foreground">
                Sede o Almacén
              </Label>
              <Select value={almacen} onValueChange={setAlmacen}>
                <SelectTrigger id="almacen-select" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {almacenes.length > 0 ? (
                    almacenes.map((alm) => (
                      <SelectItem key={alm.id} value={alm.nombre} className="text-sm">
                        {alm.nombre}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Almacén Principal (Sede Central)">Almacén Principal</SelectItem>
                      <SelectItem value="Tienda Mostrador (Surco)">Tienda Mostrador</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="cantidad-input" className="text-xs font-medium text-foreground">
                  {tipo === 'AJUSTE' ? 'Nuevo saldo físico' : 'Cantidad de unidades'}
                </Label>
              </div>
              <Input
                id="cantidad-input"
                type="number"
                min="1"
                inputMode="numeric"
                value={cantidad || ''}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="h-9 text-sm text-right font-medium tabular-nums"
                required
              />
            </div>
          </div>

          {/* Proyección del resultado en Kardex */}
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Resultado en Kardex:</span>
              <span className="font-medium text-foreground tabular-nums">
                {tipo === 'ENTRADA' && `+${cantidad} unidades → Saldo final: ${stockProyectado} unid.`}
                {tipo === 'SALIDA' && `-${cantidad} unidades → Saldo final: ${stockProyectado} unid.`}
                {tipo === 'AJUSTE' && `Ajuste directo → Saldo final: ${cantidad} unid.`}
              </span>
            </div>
            {advertenciaSalida && (
              <div className="mt-1.5 flex items-center gap-1.5 text-warning-text">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Atención: la cantidad a despachar es mayor al stock disponible ({stockActual} unid.).</span>
              </div>
            )}
          </div>

          {/* Documento de referencia */}
          <div className="space-y-1.5">
            <Label htmlFor="referencia-input" className="text-xs font-medium text-foreground">
              Documento de sustento / Referencia <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="referencia-input"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej. Guía de remisión 001-0482, Factura o Acta de conteo"
              className="h-9 text-sm"
            />
          </div>

          {errorValidacion && (
            <div className="rounded-md border border-destructive/30 bg-danger-soft px-3 py-2 text-xs text-danger-text">
              {errorValidacion}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting || !selectedProducto}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                'Guardar movimiento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

