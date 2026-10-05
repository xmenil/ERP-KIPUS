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
import { Producto, NuevoProductoPayload } from '../types/productos.types';
import { formatCurrency } from '@/utils/formatters';
import {
  Package,
  AlertTriangle,
  Loader2,
  TrendingUp,
  Tag,
  Hash,
  Scale,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: (payload: NuevoProductoPayload, id?: string) => Promise<void>;
  productoAEditar?: Producto | null;
  categoriasExistentes?: string[];
}

const CATEGORIAS_PREDEFINIDAS = [
  'Abarrotes y Granos',
  'Lácteos y Desayuno',
  'Bebidas y Licores',
  'Snacks y Golosinas',
  'Limpieza del Hogar',
  'Cuidado Personal',
  'Panadería y Pastelería',
  'Congelados y Embutidos',
  'Ferretería y Bazar',
  'Otros',
];

const UNIDADES_MEDIDA = [
  { value: 'UNIDAD', label: 'Unidad (und)' },
  { value: 'KILO', label: 'Kilogramo (kg)' },
  { value: 'PAQUETE', label: 'Paquete (pqt)' },
  { value: 'LATA', label: 'Lata (lat)' },
  { value: 'BOTELLA', label: 'Botella (bot)' },
  { value: 'BOLSA', label: 'Bolsa (bls)' },
  { value: 'CAJA', label: 'Caja (cja)' },
  { value: 'LITRO', label: 'Litro (L)' },
];

export const ProductoFormDialog: React.FC<ProductoFormDialogProps> = ({
  open,
  onOpenChange,
  onGuardar,
  productoAEditar,
  categoriasExistentes = [],
}) => {
  const esEdicion = Boolean(productoAEditar);

  // Estados del formulario
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS_PREDEFINIDAS[0]);
  const [precioCompra, setPrecioCompra] = useState<number | string>(0);
  const [precioVenta, setPrecioVenta] = useState<number | string>(0);
  const [stock, setStock] = useState<number | string>(10);
  const [stockMinimo, setStockMinimo] = useState<number | string>(5);
  const [unidadMedida, setUnidadMedida] = useState('UNIDAD');
  const [ubicacion, setUbicacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combinar categorías existentes y predefinidas sin duplicados
  const listaCategorias = Array.from(
    new Set([...categoriasExistentes.filter((c) => c !== 'TODAS'), ...CATEGORIAS_PREDEFINIDAS])
  );

  useEffect(() => {
    if (productoAEditar) {
      setSku(productoAEditar.sku || '');
      setNombre(productoAEditar.nombre || '');
      setCategoria(productoAEditar.categoria || CATEGORIAS_PREDEFINIDAS[0]);
      setPrecioCompra(productoAEditar.precioCompra ?? 0);
      setPrecioVenta(productoAEditar.precioVenta ?? 0);
      setStock(productoAEditar.stock ?? 0);
      setStockMinimo(productoAEditar.stockMinimo ?? 5);
      setUnidadMedida(productoAEditar.unidadMedida || 'UNIDAD');
      setUbicacion(productoAEditar.ubicacion || '');
    } else {
      // Valores por defecto para nuevo producto
      setSku(`SKU-${Math.floor(10000 + Math.random() * 90000)}`);
      setNombre('');
      setCategoria(CATEGORIAS_PREDEFINIDAS[0]);
      setPrecioCompra(0);
      setPrecioVenta(0);
      setStock(10);
      setStockMinimo(5);
      setUnidadMedida('UNIDAD');
      setUbicacion('');
    }
  }, [productoAEditar, open]);

  // Cálculos financieros en tiempo real
  const numCompra = Number(precioCompra) || 0;
  const numVenta = Number(precioVenta) || 0;
  const margenSoles = +(numVenta - numCompra).toFixed(2);
  const margenPorcentaje = numVenta > 0 ? +((margenSoles / numVenta) * 100).toFixed(1) : 0;
  const esVentaMenorQueCosto = numVenta > 0 && numCompra > 0 && numVenta < numCompra;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || nombre.trim().length < 2) {
      toast.error('Ingresa una descripción clara para el producto');
      return;
    }

    if (numVenta <= 0) {
      toast.error('El precio de venta debe ser mayor a S/ 0.00');
      return;
    }

    if (numCompra < 0) {
      toast.error('El precio de costo no puede ser negativo');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: NuevoProductoPayload = {
        sku: sku.trim() || `SKU-${Math.floor(10000 + Math.random() * 90000)}`,
        nombre: nombre.trim(),
        categoria,
        precioCompra: numCompra,
        precioVenta: numVenta,
        stock: Math.max(0, Number(stock) || 0),
        stockMinimo: Math.max(1, Number(stockMinimo) || 1),
        unidadMedida,
        ubicacion: ubicacion.trim() || undefined,
      };

      await onGuardar(payload, productoAEditar?.id);
      onOpenChange(false);
    } catch {
      // El error lo maneja la función padre
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-4 sm:p-6 pb-3 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                {esEdicion ? `Editar Producto · ${productoAEditar?.sku}` : 'Nuevo Producto en Catálogo'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {esEdicion
                  ? 'Modifica los precios, datos descriptivos o existencias de este artículo.'
                  : 'Registra un nuevo producto para ventas en POS, inventario y kardex.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Fila 1: Código SKU y Descripción */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sku" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                Código SKU
              </Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="ej. SKU-001"
                className="h-9 text-xs font-mono font-bold bg-background"
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nombre" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Descripción del Producto
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="ej. Arroz Costeño Extra 1 kg"
                className="h-9 text-xs bg-background"
                required
              />
            </div>
          </div>

          {/* Fila 2: Categoría y Unidad de Medida */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Categoría</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {listaCategorias.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                Unidad de Medida
              </Label>
              <Select value={unidadMedida} onValueChange={setUnidadMedida}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Selecciona la unidad" />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_MEDIDA.map((u) => (
                    <SelectItem key={u.value} value={u.value} className="text-xs">
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fila 3: Precios de Costo y Venta */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-muted/15 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-primary" />
                Precios y Rentabilidad Comercial
              </span>
              <span className="text-[11px] text-muted-foreground">Moneda: Soles (S/)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="precioCompra" className="text-xs font-medium text-foreground">
                  Precio de Costo (Compra)
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs font-bold text-muted-foreground">
                    S/
                  </span>
                  <Input
                    id="precioCompra"
                    type="number"
                    step="0.01"
                    min="0"
                    value={precioCompra}
                    onChange={(e) => setPrecioCompra(e.target.value)}
                    className="h-9 pl-8 text-xs font-mono font-bold bg-background tabular-nums"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">Costo de adquisición al proveedor</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="precioVenta" className="text-xs font-medium text-foreground">
                  Precio de Venta al Público *
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs font-bold text-primary">
                    S/
                  </span>
                  <Input
                    id="precioVenta"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(e.target.value)}
                    className="h-9 pl-8 text-xs font-mono font-bold bg-background text-primary tabular-nums"
                    required
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">Precio final al cliente en mostrador</span>
              </div>
            </div>

            {/* Vista previa de margen de ganancia */}
            <div className="flex items-center justify-between p-2.5 rounded-md bg-card border border-border text-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-muted-foreground">Margen de ganancia:</span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(margenSoles)}
                </span>
              </div>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                  margenPorcentaje >= 20
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : margenPorcentaje > 0
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                }`}
              >
                {margenPorcentaje}% de margen
              </span>
            </div>

            {esVentaMenorQueCosto && (
              <div className="flex items-center gap-2 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>¡Atención! El precio de venta es menor al costo. Venderías a pérdida.</span>
              </div>
            )}
          </div>

          {/* Fila 4: Control de Existencias (Stock) y Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="stock" className="text-xs font-semibold text-foreground">
                Stock {esEdicion ? 'Actual' : 'Inicial'}
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="h-9 text-xs font-mono font-bold bg-background tabular-nums"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stockMinimo" className="text-xs font-semibold text-foreground">
                Stock Mínimo (Alerta)
              </Label>
              <Input
                id="stockMinimo"
                type="number"
                min="1"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                className="h-9 text-xs font-mono font-bold bg-background tabular-nums"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ubicacion" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Ubicación (Opcional)
              </Label>
              <Input
                id="ubicacion"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="ej. Pasillo 2, Estante B"
                className="h-9 text-xs bg-background"
              />
            </div>
          </div>
        </form>

        <DialogFooter className="p-4 sm:p-6 pt-3 border-t border-border bg-muted/10 shrink-0 gap-2">
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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-9 text-xs bg-primary text-primary-foreground font-semibold min-w-32 shadow-xs"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Guardando…</span>
              </span>
            ) : esEdicion ? (
              'Guardar Cambios'
            ) : (
              'Registrar Producto'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
