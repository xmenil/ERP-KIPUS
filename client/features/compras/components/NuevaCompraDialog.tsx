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
import { Truck } from 'lucide-react';

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
  const [total, setTotal] = useState<number>(550);
  const [metodoPago, setMetodoPago] = useState('TRANSFERENCIA');
  const [itemsCount, setItemsCount] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [catalogo, setCatalogo] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');

  useEffect(() => {
    if (open) {
      productosService.getProductos().then((prods) => {
        setCatalogo(prods);
        if (prods.length > 0) {
          setProductoSeleccionado(prods[0].id);
        }
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorNombre.trim() || total <= 0) return;

    setIsSubmitting(true);
    try {
      await onCompraRegistrada({
        proveedorNombre,
        proveedorRuc: proveedorRuc || '20000000001',
        serieFactura: serieFactura || `F001-${Math.floor(Math.random() * 10000)}`,
        total: Number(total),
        metodoPago,
        itemsCount: Number(itemsCount),
        productoId: productoSeleccionado,
      });
      onOpenChange(false);
      setSerieFactura('');
      setTotal(550);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Registrar Factura de Compra
          </DialogTitle>
          <DialogDescription>
            Ingresa la compra. El inventario se incrementará en el almacén de forma inmediata.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Producto a Abastecer</Label>
            <Select value={productoSeleccionado} onValueChange={setProductoSeleccionado}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Seleccionar producto..." />
              </SelectTrigger>
              <SelectContent>
                {catalogo.map((prod) => (
                  <SelectItem key={prod.id} value={prod.id}>
                    {prod.nombre} (Stock actual: {prod.stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Proveedor (Razón Social)</Label>
            <Input
              value={proveedorNombre}
              onChange={(e) => setProveedorNombre(e.target.value)}
              placeholder="Ej. Distribuidora Automotriz S.A.C."
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">RUC del Proveedor</Label>
              <Input
                value={proveedorRuc}
                onChange={(e) => setProveedorRuc(e.target.value)}
                placeholder="20XXXXXXXXX"
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">N° Factura Proveedor</Label>
              <Input
                value={serieFactura}
                onChange={(e) => setSerieFactura(e.target.value)}
                placeholder="F001-00249"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Monto Total de Factura (S/)</Label>
              <Input
                type="number"
                step="0.01"
                min="1"
                value={total}
                onChange={(e) => setTotal(Number(e.target.value))}
                required
                className="h-8 text-xs font-bold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Cantidad a Ingresar</Label>
              <Input
                type="number"
                min="1"
                value={itemsCount}
                onChange={(e) => setItemsCount(Number(e.target.value))}
                required
                className="h-8 text-xs text-center font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Condición de Pago</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRANSFERENCIA">Transferencia Bancaria (Contado)</SelectItem>
                <SelectItem value="EFECTIVO">Efectivo de Caja (Descuenta del arqueo)</SelectItem>
                <SelectItem value="CREDITO_30_DIAS">Crédito a 30 días</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              disabled={isSubmitting || !proveedorNombre.trim()}
              className="gap-2 bg-primary text-primary-foreground font-semibold"
            >
              {isSubmitting ? 'Guardando...' : 'Confirmar Compra'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
