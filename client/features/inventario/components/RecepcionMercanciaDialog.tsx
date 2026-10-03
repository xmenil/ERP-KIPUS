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
import { RecepcionMercanciaPayload, ItemStockDetalle } from '../types/inventario.types';
import { Truck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface RecepcionMercanciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: ItemStockDetalle[];
  onRecepcionar: (payload: RecepcionMercanciaPayload) => Promise<void>;
  almacenesNombres?: string[];
}

export const RecepcionMercanciaDialog: React.FC<RecepcionMercanciaDialogProps> = ({
  open,
  onOpenChange,
  productos,
  onRecepcionar,
  almacenesNombres = ['Almacén Principal (Sede Central)', 'Tienda Mostrador (Atención al Público)'],
}) => {
  const [productoId, setProductoId] = useState(productos[0]?.id || '');
  const [cantidad, setCantidad] = useState(10);
  const [proveedorNombre, setProveedorNombre] = useState('Importadora y Distribuidora PetroPerú Repuestos');
  const [guiaFactura, setGuiaFactura] = useState('GR-001-002891');
  const [almacen, setAlmacen] = useState(almacenesNombres[0] || 'Almacén Principal');
  const [costoUnitario, setCostoUnitario] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Al seleccionar producto, cargar su costo actual
  const handleSelectProducto = (id: string) => {
    setProductoId(id);
    const prod = productos.find((p) => p.id === id);
    if (prod) {
      setCostoUnitario(prod.precioCompra);
    }
  };

  const productoSeleccionado = productos.find((p) => p.id === productoId) || productos[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionado) {
      toast.error('Selecciona un producto para la recepción');
      return;
    }
    if (cantidad <= 0) {
      toast.error('La cantidad recibida debe ser mayor a 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRecepcionar({
        productoId: productoSeleccionado.id,
        sku: productoSeleccionado.sku,
        productoNombre: productoSeleccionado.nombre,
        cantidad: Number(cantidad),
        proveedorNombre: proveedorNombre.trim() || 'Proveedor Local',
        guiaFactura: guiaFactura.trim() || 'S/N',
        almacen,
        costoUnitario: Number(costoUnitario) > 0 ? Number(costoUnitario) : undefined,
      });

      toast.success(
        `Recepción registrada: +${cantidad} unid. de ${productoSeleccionado.nombre}`
      );
      onOpenChange(false);
    } catch {
      toast.error('No se pudo registrar la recepción de mercadería');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Truck className="h-5 w-5 text-primary" />
            <span>Recepción de Mercancía</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Paso 1 del ciclo: Registra la mercadería que te entregó el proveedor para sumar unidades al stock y actualizar el Kardex.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          {/* Selector de producto */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Producto a ingresar</Label>
            <Select
              value={productoId || productos[0]?.id || ''}
              onValueChange={handleSelectProducto}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Selecciona un artículo..." />
              </SelectTrigger>
              <SelectContent>
                {productos.map((prod) => (
                  <SelectItem key={prod.id} value={prod.id} className="text-xs">
                    {prod.nombre} (Stock actual: {prod.stock} {prod.unidadMedida.toLowerCase()})
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

          {/* Cantidad y Almacén */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Cantidad que llegó</Label>
              <Input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                className="h-9 text-xs font-semibold tabular-nums"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Costo unitario (S/)</Label>
              <Input
                type="number"
                step="0.10"
                min="0"
                value={costoUnitario || ''}
                onChange={(e) => setCostoUnitario(Number(e.target.value))}
                placeholder="Precio de compra"
                className="h-9 text-xs tabular-nums"
              />
            </div>
          </div>

          {/* Proveedor */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Proveedor que entrega</Label>
            <Input
              value={proveedorNombre}
              onChange={(e) => setProveedorNombre(e.target.value)}
              placeholder="Ej. Distribuidora San Juan, PetroPerú, etc."
              className="h-9 text-xs"
              required
            />
          </div>

          {/* N° Guía / Factura y Almacén */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">N° Guía de Remisión o Factura</Label>
              <Input
                value={guiaFactura}
                onChange={(e) => setGuiaFactura(e.target.value)}
                placeholder="Ej. GR-001-4821"
                className="h-9 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Almacén destino</Label>
              <Select value={almacen} onValueChange={setAlmacen}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {almacenesNombres.map((alm) => (
                    <SelectItem key={alm} value={alm} className="text-xs">
                      {alm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resumen del impacto en el negocio */}
          {productoSeleccionado && (
            <div className="rounded border border-border/80 bg-muted/40 p-2.5 text-xs space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Impacto automático al confirmar:
              </span>
              <p className="text-[11px] text-muted-foreground">
                El stock de <strong>{productoSeleccionado.nombre}</strong> subirá de{' '}
                <span className="tabular-nums font-medium">{productoSeleccionado.stock}</span> a{' '}
                <span className="tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                  {productoSeleccionado.stock + (Number(cantidad) || 0)} unid.
                </span>{' '}
                y se generará la entrada en el Kardex.
              </p>
            </div>
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
            <Button type="submit" size="sm" disabled={isSubmitting} className="font-semibold">
              {isSubmitting ? 'Guardando entrada...' : 'Ingresar a almacén'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
