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
import { proveedoresService } from '@/features/proveedores/services/proveedoresService';
import { Producto } from '@/features/productos/types/productos.types';
import { Proveedor } from '@/features/proveedores/types/proveedores.types';
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
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorSeleccionadoId, setProveedorSeleccionadoId] = useState<string>('');
  const [proveedorNombre, setProveedorNombre] = useState('Alicorp S.A.A.');
  const [proveedorRuc, setProveedorRuc] = useState('20100055237');
  const [serieFactura, setSerieFactura] = useState('');
  const [total, setTotal] = useState<string>('240');
  const [metodoPago, setMetodoPago] = useState('TRANSFERENCIA');
  const [itemsCount, setItemsCount] = useState<string>('24');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorInput, setErrorInput] = useState<string | null>(null);

  const [catalogo, setCatalogo] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');

  useEffect(() => {
    if (open) {
      Promise.all([
        productosService.getProductos(),
        proveedoresService.getProveedores(),
      ]).then(([prods, provs]) => {
        setCatalogo(prods);
        setProveedores(provs);
        if (prods.length > 0 && !productoSeleccionado) {
          setProductoSeleccionado(prods[0].id);
        }
        if (provs.length > 0 && !proveedorSeleccionadoId) {
          setProveedorSeleccionadoId(provs[0].id);
          setProveedorNombre(provs[0].razonSocial);
          setProveedorRuc(provs[0].ruc);
        }
      });
    }
  }, [open, productoSeleccionado, proveedorSeleccionadoId]);

  const handleSelectProveedor = (provId: string) => {
    setProveedorSeleccionadoId(provId);
    const prov = proveedores.find((p) => p.id === provId);
    if (prov) {
      setProveedorNombre(prov.razonSocial);
      setProveedorRuc(prov.ruc);
    }
  };

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
        proveedorRuc: proveedorRuc.trim() || '20100055237',
        serieFactura: serieFactura.trim() || `F001-${Math.floor(1000 + Math.random() * 9000)}`,
        total: totalNum,
        metodoPago,
        itemsCount: countNum,
        productoId: productoSeleccionado || undefined,
      });
      onOpenChange(false);
      setSerieFactura('');
      setTotal('240');
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
            Ingresa la recepción de mercadería de tu proveedor. El stock en inventario se incrementará automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1 overflow-y-auto flex-1 pr-0.5">
          {/* Producto a Abastecer */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Producto a abastecer en el minimarket</Label>
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

          {/* Selector de Proveedor */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Proveedor Registrado</Label>
            <Select value={proveedorSeleccionadoId} onValueChange={handleSelectProveedor}>
              <SelectTrigger className="h-9 text-xs border-border bg-card">
                <SelectValue placeholder="Elegir proveedor registrado..." />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {proveedores.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.razonSocial} (RUC: {p.ruc})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Razón Social del Proveedor Manual/Editable */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Razón Social del Proveedor</Label>
            <Input
              value={proveedorNombre}
              onChange={(e) => {
                setProveedorNombre(e.target.value);
                if (errorInput) setErrorInput(null);
              }}
              placeholder="Ej. Alicorp S.A.A."
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
                placeholder="F001-008921"
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
                  value={total}
                  onChange={(e) => {
                    setTotal(e.target.value);
                    if (errorInput) setErrorInput(null);
                  }}
                  placeholder="0.00"
                  required
                  className="h-9 pl-8 text-xs font-mono tabular-nums border-border bg-card"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Cantidad Unidades</Label>
              <Input
                type="number"
                min="1"
                value={itemsCount}
                onChange={(e) => {
                  setItemsCount(e.target.value);
                  if (errorInput) setErrorInput(null);
                }}
                placeholder="Ej. 24"
                required
                className="h-9 text-xs font-mono tabular-nums border-border bg-card"
              />
            </div>
          </div>

          {/* Condición de Pago */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Medio de Pago</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger className="h-9 text-xs border-border bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRANSFERENCIA" className="text-xs">
                  Transferencia Bancaria (BCP / BBVA / Interbank)
                </SelectItem>
                <SelectItem value="EFECTIVO" className="text-xs">
                  Efectivo (Descuenta automáticamente de Caja)
                </SelectItem>
                <SelectItem value="CREDITO_30_DIAS" className="text-xs">
                  Crédito a 30 días
                </SelectItem>
                <SelectItem value="TARJETA" className="text-xs">
                  Tarjeta Débito / Crédito
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error inline */}
          {errorInput && (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorInput}</span>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-0 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-9 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 text-xs bg-primary text-primary-foreground hover:bg-primary-hover"
            >
              {isSubmitting ? 'Guardando ingreso...' : 'Ingresar a almacén'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
