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
import { TipoComprobante, MetodoPago, NuevaVentaPayload } from '../types/ventas.types';
import { productosService } from '@/features/productos/services/productosService';
import { Producto } from '@/features/productos/types/productos.types';
import { formatCurrency } from '@/utils/formatters';
import { Plus, Trash2, ShoppingCart, CheckCircle2 } from 'lucide-react';

interface NuevaVentaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVentaCreada: (payload: NuevaVentaPayload) => Promise<void>;
}

export const NuevaVentaDialog: React.FC<NuevaVentaDialogProps> = ({
  open,
  onOpenChange,
  onVentaCreada,
}) => {
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('BOLETA');
  const [clienteNombre, setClienteNombre] = useState('Público General');
  const [clienteDocumento, setClienteDocumento] = useState('00000000');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [catalogo, setCatalogo] = useState<Producto[]>([]);
  const [items, setItems] = useState<
    { productoId: string; nombre: string; cantidad: number; precioUnitario: number; stockMax: number }[]
  >([]);

  useEffect(() => {
    if (open) {
      productosService.getProductos().then((prods) => {
        setCatalogo(prods);
        if (prods.length > 0 && items.length === 0) {
          const first = prods[0];
          setItems([
            {
              productoId: first.id,
              nombre: first.nombre,
              cantidad: 1,
              precioUnitario: first.precioVenta,
              stockMax: first.stock,
            },
          ]);
        }
      });
    }
  }, [open]);

  const handleSelectProduct = (index: number, prodId: string) => {
    const prod = catalogo.find((p) => p.id === prodId);
    if (!prod) return;
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              productoId: prod.id,
              nombre: prod.nombre,
              precioUnitario: prod.precioVenta,
              cantidad: 1,
              stockMax: prod.stock,
            }
          : item
      )
    );
  };

  const handleAddItem = () => {
    const defaultProd = catalogo[0] || {
      id: `p-${Date.now()}`,
      nombre: 'Artículo General',
      precioVenta: 35.0,
      stock: 10,
    };
    setItems((prev) => [
      ...prev,
      {
        productoId: defaultProd.id,
        nombre: defaultProd.nombre,
        cantidad: 1,
        precioUnitario: defaultProd.precioVenta,
        stockMax: defaultProd.stock,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCantidad = (index: number, cant: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, cantidad: Math.max(1, cant) } : item))
    );
  };

  const total = items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
  const subtotal = tipoComprobante === 'NOTA_VENTA' ? total : +(total / 1.18).toFixed(2);
  const igv = +(total - subtotal).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setIsSubmitting(true);
    try {
      await onVentaCreada({
        tipoComprobante,
        clienteNombre,
        clienteDocumento,
        metodoPago,
        items,
      });
      onOpenChange(false);
      // Reset
      setClienteNombre('Público General');
      setClienteDocumento('00000000');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Emitir Nuevo Comprobante de Venta
          </DialogTitle>
          <DialogDescription>
            Selecciona los productos del catálogo. El stock y la caja se actualizarán automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Tipo de Comprobante y Medio de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo de Comprobante</Label>
              <Select
                value={tipoComprobante}
                onValueChange={(val: TipoComprobante) => setTipoComprobante(val)}
              >
                <SelectTrigger className="h-8 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOLETA">Boleta de Venta Electrónica</SelectItem>
                  <SelectItem value="FACTURA">Factura con RUC (Empresas)</SelectItem>
                  <SelectItem value="NOTA_VENTA">Nota de Venta Rápida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Método de Cobro</Label>
              <Select value={metodoPago} onValueChange={(val: MetodoPago) => setMetodoPago(val)}>
                <SelectTrigger className="h-8 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EFECTIVO">Efectivo en Caja (Suma al arqueo)</SelectItem>
                  <SelectItem value="YAPE">Billetera Yape</SelectItem>
                  <SelectItem value="PLIN">Billetera Plin</SelectItem>
                  <SelectItem value="TARJETA">Tarjeta Débito/Crédito (POS)</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferencia Bancaria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs font-semibold">Cliente / Razón Social</Label>
              <Input
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                required
                className="h-8 text-xs"
                placeholder="Público General o Nombre del cliente"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">DNI o RUC</Label>
              <Input
                value={clienteDocumento}
                onChange={(e) => setClienteDocumento(e.target.value)}
                required
                className="h-8 text-xs"
                placeholder="00000000"
              />
            </div>
          </div>

          {/* Detalle de Productos Interactivo */}
          <div className="border border-border/80 rounded-lg p-3 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                Artículos a Despachar ({items.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Agregar Producto</span>
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 rounded-md bg-card border border-border/60"
                >
                  <div className="flex-1 w-full">
                    <Select
                      value={item.productoId}
                      onValueChange={(val) => handleSelectProduct(idx, val)}
                    >
                      <SelectTrigger className="h-8 text-xs font-medium">
                        <SelectValue placeholder="Seleccionar producto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogo.map((prod) => (
                          <SelectItem key={prod.id} value={prod.id}>
                            {prod.nombre} — {formatCurrency(prod.precioVenta)} (Stock: {prod.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-1">
                      <Label className="text-[11px] text-muted-foreground sm:hidden">Cant:</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => handleUpdateCantidad(idx, Number(e.target.value))}
                        className="h-8 text-xs w-16 text-center font-semibold"
                      />
                    </div>

                    <div className="w-24 text-right">
                      <span className="text-xs font-semibold text-foreground">
                        {formatCurrency(item.cantidad * item.precioUnitario)}
                      </span>
                    </div>

                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(idx)}
                        className="h-7 w-7 text-danger-text hover:bg-danger-soft"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="border-t border-border/60 pt-2 flex flex-col items-end gap-1 text-xs">
              {tipoComprobante !== 'NOTA_VENTA' && (
                <>
                  <div className="flex justify-between w-52 text-muted-foreground">
                    <span>Op. Gravada:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between w-52 text-muted-foreground">
                    <span>IGV (18%):</span>
                    <span>{formatCurrency(igv)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between w-52 text-sm font-bold text-foreground pt-1 border-t border-border/60">
                <span>Total a Cobrar:</span>
                <span className="text-primary text-base">{formatCurrency(total)}</span>
              </div>
            </div>
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
              disabled={isSubmitting || items.length === 0}
              className="gap-2 bg-primary text-primary-foreground font-semibold"
            >
              {isSubmitting ? 'Emitiendo...' : 'Confirmar y Emitir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
