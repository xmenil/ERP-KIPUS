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
import { NuevoProductoPayload } from '../types/productos.types';
import { PackagePlus } from 'lucide-react';

interface NuevoProductoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductoCreado: (payload: NuevoProductoPayload) => Promise<void>;
}

export const NuevoProductoDialog: React.FC<NuevoProductoDialogProps> = ({
  open,
  onOpenChange,
  onProductoCreado,
}) => {
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Lubricantes');
  const [precioCompra, setPrecioCompra] = useState(0);
  const [precioVenta, setPrecioVenta] = useState(0);
  const [stock, setStock] = useState(10);
  const [stockMinimo, setStockMinimo] = useState(5);
  const [unidadMedida, setUnidadMedida] = useState('UNIDAD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setIsSubmitting(true);
    try {
      await onProductoCreado({
        sku: sku || `SKU-${Date.now().toString().slice(-5)}`,
        nombre,
        categoria,
        precioCompra: Number(precioCompra),
        precioVenta: Number(precioVenta),
        stock: Number(stock),
        stockMinimo: Number(stockMinimo),
        unidadMedida,
      });
      onOpenChange(false);
      // Reset
      setSku('');
      setNombre('');
      setPrecioCompra(0);
      setPrecioVenta(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" />
            Registrar Nuevo Producto o Servicio
          </DialogTitle>
          <DialogDescription>
            Ingresa los datos comerciales, precios y límites de stock del artículo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Código / SKU</Label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej. REP-001"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Categoría</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lubricantes">Lubricantes</SelectItem>
                  <SelectItem value="Filtros">Filtros</SelectItem>
                  <SelectItem value="Frenos">Frenos</SelectItem>
                  <SelectItem value="Eléctrico">Eléctrico</SelectItem>
                  <SelectItem value="Químicos">Químicos</SelectItem>
                  <SelectItem value="Encendido">Encendido</SelectItem>
                  <SelectItem value="Servicios">Servicios / M.O.</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Descripción del Producto</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Batería 12V 70Ah Libre Mantenimiento"
              required
              className="h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Precio de Costo (S/)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={precioCompra}
                onChange={(e) => setPrecioCompra(Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Precio de Venta (S/)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(Number(e.target.value))}
                required
                className="h-8 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Stock Inicial</Label>
              <Input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="h-8 text-xs text-center"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Stock Mínimo</Label>
              <Input
                type="number"
                min="1"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(Number(e.target.value))}
                className="h-8 text-xs text-center"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">U. Medida</Label>
              <Select value={unidadMedida} onValueChange={setUnidadMedida}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNIDAD">Unidad</SelectItem>
                  <SelectItem value="GALON">Galón</SelectItem>
                  <SelectItem value="JUEGO">Juego</SelectItem>
                  <SelectItem value="KILO">Kilo</SelectItem>
                </SelectContent>
              </Select>
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
            <Button type="submit" size="sm" disabled={isSubmitting || !nombre.trim()}>
              {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
