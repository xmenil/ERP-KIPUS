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
import { NuevaCompraPayload } from '../types/compras.types';
import { productosService } from '@/features/productos/services/productosService';
import { Producto } from '@/features/productos/types/productos.types';
import { pluralizeUnit } from '@/utils/formatters';
import { Truck, AlertCircle } from 'lucide-react';

interface NuevaCompraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompraRegistrada: (payload: NuevaCompraPayload & { productoId?: string }) => Promise<void>;
}

export const NuevaCompraDialog: React.FC<NuevaCompraDialogProps> = ({
  open,
  onOpenChange,
  onCompraRegistrada,
}) => {
  const [proveedorNombre, setProveedorNombre] = useState('Importadora y Distribuidora PetroPerú Repuestos');
  const [proveedorRuc, setProveedorRuc] = useState('20100128211');
  const [serieFactura, setSerieFactura] = useState('');
  const [total, setTotal] = useState<string>('550');
  const [metodoPago, setMetodoPago] = useState('TRANSFERENCIA');
  const [itemsCount, setItemsCount] = useState<string>('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorInput, setErrorInput] = useState<string | null>(null);

  const [catalogo, setCatalogo] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');

  useEffect(() => {
    if (open) {
      productosService.getProductos().then((prods) => {
        setCatalogo(prods);
        if (prods.length > 0 && !productoSeleccionado) {
          setProductoSeleccionado(prods[0].id);
        }
      });
    }
  }, [open, productoSeleccionado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInput(null);

    const totalNum = Number(total);
    const countNum = Number(itemsCount);

    if (!proveedorNombre.trim()) {
      setErrorInput('Ingresa la razón social del proveedor.');
      return;
    }
    if (isNaN(totalNum) || totalNum <= 0) {
      setErrorInput('El monto total de la factura debe ser mayor a S/ 0.00.');
      return;
    }
    if (isNaN(countNum) || countNum <= 0) {
      setErrorInput('La cantidad de ítems a ingresar debe ser al menos 1.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCompraRegistrada({
        proveedorNombre: proveedorNombre.trim(),
        proveedorRuc: proveedorRuc.trim() || '20000000001',
        serieFactura: serieFactura.trim() || `F001-${Math.floor(1000 + Math.random() * 9000)}`,
        total: totalNum,
        metodoPago,
        itemsCount: countNum,
        productoId: productoSeleccionado || undefined,
      });
      onOpenChange(false);
      setSerieFactura('');
      setTotal('550');
      setErrorInput(null);
    } catch {
      setErrorInput('Ocurrió un error al registrar la compra. Inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[92vh] flex flex-col p-4 sm:p-5 gap-4 overflow-hidden rounded-lg">
        <DialogHeader className="space-y-1 text-left shrink-0">
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary shrink-0" />
            <span>Registrar factura o compra</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Ingresa la recepción de mercadería. El stock del almacén se incrementará automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1 overflow-y-auto flex-1 pr-0.5">
          {/* Producto a Abastecer */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Producto a abastecer</Label>
            <Select value={productoSeleccionado} onValueChange={setProductoSeleccionado}>
              <SelectTrigger className="h-9 text-xs border-border bg-card">
                <SelectValue placeholder="Seleccionar producto del catálogo..." />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {catalogo.map((prod) => (
                  <SelectItem key={prod.id} value={prod.id} className="text-xs">
                    {prod.nombre} (Stock actual: {prod.stock} {pluralizeUnit(prod.stock, 'unidad')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Razón Social del Proveedor */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Proveedor (Razón Social)</Label>
            <Input
              value={proveedorNombre}
              onChange={(e) => {
                setProveedorNombre(e.target.value);
                if (errorInput) setErrorInput(null);
              }}
              placeholder="Ej. Distribuidora Automotriz S.A.C."
              required
              className="h-9 text-xs border-border bg-card"
            />
          </div>

          {/* RUC y N° Factura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">RUC del Proveedor</Label>
              <Input
                value={proveedorRuc}
                onChange={(e) => setProveedorRuc(e.target.value)}
                placeholder="20XXXXXXXXX"
                maxLength={11}
                className="h-9 text-xs font-mono border-border bg-card"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">N° Factura / Serie</Label>
              <Input
                value={serieFactura}
                onChange={(e) => setSerieFactura(e.target.value)}
                placeholder="F001-002492"
                className="h-9 text-xs font-mono uppercase border-border bg-card"
              />
            </div>
          </div>

          {/* Monto Total y Cantidad de Ítems */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Total Facturado (S/)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono font-semibold text-muted-foreground">
                  S/
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.10"
                  inputMode="decimal"
                  value={total}
                  onChange={(e) => {
                    setTotal(e.target.value);
                    if (errorInput) setErrorInput(null);
                  }}
                  required
                  className="pl-8 h-9 text-sm font-mono font-semibold tabular-nums border-border bg-card focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Cantidad a ingresar</Label>
              <Input
                type="number"
                min="1"
                inputMode="numeric"
                value={itemsCount}
                onChange={(e) => {
                  setItemsCount(e.target.value);
                  if (errorInput) setErrorInput(null);
                }}
                required
                className="h-9 text-sm font-mono text-center tabular-nums border-border bg-card focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Condición de Pago */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Condición / Medio de pago</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger className="h-9 text-xs border-border bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRANSFERENCIA" className="text-xs">Transferencia bancaria (Contado)</SelectItem>
                <SelectItem value="EFECTIVO" className="text-xs">Efectivo de caja (Descuenta de arqueo)</SelectItem>
                <SelectItem value="CREDITO_30_DIAS" className="text-xs">Crédito comercial a 30 días</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error accesible */}
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
              disabled={isSubmitting}
              className="text-xs h-9 font-semibold bg-primary text-primary-foreground"
            >
              {isSubmitting ? 'Registrando compra...' : 'Confirmar compra'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
