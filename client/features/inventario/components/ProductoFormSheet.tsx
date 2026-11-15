import React, { useState, useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Producto, NuevoProductoPayload } from '@/features/productos/types/productos.types';
import { productosService } from '@/features/productos/services/productosService';
import { normalizarCodigo } from '@/features/productos/utils/codigosProducto';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
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
  CheckCircle2,
  RefreshCw,
  Barcode,
  Boxes,
} from 'lucide-react';
import { toast } from 'sonner';

export interface ProductoFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: (payload: NuevoProductoPayload, id?: string) => Promise<void>;
  productoAEditar?: Producto | null;
  categoriasExistentes?: string[];
  productosExistentes?: Producto[];
  valoresIniciales?: Partial<NuevoProductoPayload> | null;
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

export const ProductoFormSheet: React.FC<ProductoFormSheetProps> = ({
  open,
  onOpenChange,
  onGuardar,
  productoAEditar,
  categoriasExistentes = [],
  productosExistentes = [],
  valoresIniciales,
}) => {
  const esEdicion = Boolean(productoAEditar);

  // Estados del formulario
  const [sku, setSku] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [errorCodigo, setErrorCodigo] = useState('');
  const [codigoDisponible, setCodigoDisponible] = useState(false);
  const [coincidencia, setCoincidencia] = useState<Producto>();
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS_PREDEFINIDAS[0]);
  const [precioCompra, setPrecioCompra] = useState<number | string>(0);
  const [precioVenta, setPrecioVenta] = useState<number | string>(0);
  const [stock, setStock] = useState<number | string>(10);
  const [stockMinimo, setStockMinimo] = useState<number | string>(5);
  const [unidadMedida, setUnidadMedida] = useState('UNIDAD');
  const [ubicacion, setUbicacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const codigoRef = useRef<HTMLInputElement>(null);
  const enviandoRef = useRef(false);

  // Detectar colisión con SKU existente
  const productoCoincidente = React.useMemo(() => {
    const sNorm = sku.trim().toLowerCase();
    if (!sNorm) return null;
    return productosExistentes.find(
      (p) => p.sku.trim().toLowerCase() === sNorm && p.id !== productoAEditar?.id
    );
  }, [sku, productosExistentes, productoAEditar]);

  const listaCategorias = Array.from(
    new Set([...categoriasExistentes.filter((c) => c !== 'TODAS'), ...CATEGORIAS_PREDEFINIDAS])
  );

  useEffect(() => {
    setErrores({});
    setErrorCodigo('');
    setCoincidencia(undefined);
    setCodigoDisponible(false);

    if (productoAEditar) {
      setSku(productoAEditar.sku || '');
      setCodigoBarras(productoAEditar.codigoBarras || '');
      setNombre(productoAEditar.nombre || '');
      setCategoria(productoAEditar.categoria || CATEGORIAS_PREDEFINIDAS[0]);
      setPrecioCompra(productoAEditar.precioCompra ?? 0);
      setPrecioVenta(productoAEditar.precioVenta ?? 0);
      setStock(productoAEditar.stock ?? 0);
      setStockMinimo(productoAEditar.stockMinimo ?? 5);
      setUnidadMedida(productoAEditar.unidadMedida || 'UNIDAD');
      setUbicacion(productoAEditar.ubicacion || '');
    } else if (valoresIniciales) {
      setSku(valoresIniciales.sku || `SKU-${Math.floor(10000 + Math.random() * 90000)}`);
      setCodigoBarras(valoresIniciales.codigoBarras || '');
      setNombre(valoresIniciales.nombre ?? '');
      setCategoria(valoresIniciales.categoria ?? CATEGORIAS_PREDEFINIDAS[0]);
      setPrecioCompra(valoresIniciales.precioCompra ?? 0);
      setPrecioVenta(valoresIniciales.precioVenta ?? 0);
      setStock(valoresIniciales.stock ?? 0);
      setStockMinimo(valoresIniciales.stockMinimo ?? 5);
      setUnidadMedida(valoresIniciales.unidadMedida ?? 'UNIDAD');
      setUbicacion(valoresIniciales.ubicacion ?? '');
    } else {
      setSku(`SKU-${Math.floor(10000 + Math.random() * 90000)}`);
      setCodigoBarras('');
      setNombre('');
      setCategoria(CATEGORIAS_PREDEFINIDAS[0]);
      setPrecioCompra(0);
      setPrecioVenta(0);
      setStock(0);
      setStockMinimo(5);
      setUnidadMedida('UNIDAD');
      setUbicacion('');
    }
  }, [productoAEditar, valoresIniciales, open]);

  const handleGenerarNuevoSku = () => {
    const nuevoSku = `SKU-${Math.floor(10000 + Math.random() * 90000)}`;
    setSku(nuevoSku);
    toast.info(`Nuevo SKU asignado: ${nuevoSku}`);
  };

  const comprobarCodigo = (moverFoco = false, lectura = codigoBarras): boolean => {
    try {
      const codigo = normalizarCodigo(lectura);
      setCodigoBarras(codigo);
      const existente = productosService.buscarPorCodigo(codigo);
      const conflicto = existente && existente.id !== productoAEditar?.id ? existente : undefined;
      setCoincidencia(conflicto);
      setErrorCodigo(conflicto ? 'Este código ya está asignado a otro producto.' : '');
      setCodigoDisponible(Boolean(codigo) && !conflicto);

      if (!codigo && moverFoco) {
        setErrorCodigo('Ingresa o escanea un código.');
        return false;
      }
      if (conflicto) return false;
      return true;
    } catch (error) {
      setErrorCodigo(error instanceof Error ? error.message : 'Código inválido.');
      setCoincidencia(undefined);
      setCodigoDisponible(false);
      return false;
    }
  };

  // Cálculos financieros
  const numCompra = Number(precioCompra) || 0;
  const numVenta = Number(precioVenta) || 0;
  const margenSoles = +(numVenta - numCompra).toFixed(2);
  const margenPorcentaje = numVenta > 0 ? +((margenSoles / numVenta) * 100).toFixed(1) : 0;
  const esVentaMenorQueCosto = numVenta > 0 && numCompra > 0 && numVenta < numCompra;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviandoRef.current) return;

    if (!comprobarCodigo()) {
      codigoRef.current?.focus();
      return;
    }

    const nuevosErrores: Record<string, string> = {};
    if (!nombre.trim() || nombre.trim().length < 2) {
      nuevosErrores.nombre = 'Ingresa el nombre del producto (mínimo 2 letras).';
    }
    if (numVenta <= 0) {
      nuevosErrores.precioVenta = 'El precio de venta debe ser mayor a S/ 0.00.';
    }
    if (numCompra < 0) {
      nuevosErrores.precioCompra = 'El costo de compra no puede ser negativo.';
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      const primerError = Object.values(nuevosErrores)[0];
      if (primerError) toast.error(primerError);
      return;
    }

    setErrores({});
    setIsSubmitting(true);
    enviandoRef.current = true;

    try {
      const payload: NuevoProductoPayload = {
        sku: sku.trim() || `SKU-${Math.floor(10000 + Math.random() * 90000)}`,
        codigoBarras: normalizarCodigo(codigoBarras) || undefined,
        nombre: nombre.trim(),
        categoria,
        precioCompra: numCompra,
        precioVenta: numVenta,
        stock: Math.max(0, Number(stock) || 0),
        stockMinimo: Math.max(1, Number(stockMinimo) || 1),
        unidadMedida,
        ubicacion: ubicacion.trim() || undefined,
      };

      const targetId = productoAEditar?.id || (productoCoincidente ? productoCoincidente.id : undefined);
      await onGuardar(payload, targetId);
      onOpenChange(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al guardar el producto.';
      setErrores({ general: msg });
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
      enviandoRef.current = false;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 flex flex-col justify-between"
      >
        {/* Cabecera del Sheet */}
        <div className="p-6 border-b border-border bg-muted/20">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold">
                  {esEdicion ? 'Editar Producto' : 'Nuevo Producto en Catálogo'}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {esEdicion
                    ? `Modifica los datos del producto SKU: ${productoAEditar?.sku}`
                    : 'Ingresa los datos del producto, precios e inventario para el retail.'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Cuerpo del Formulario con Secciones Ergonómicas */}
        <form id="producto-form-sheet" onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
          {errores.general && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errores.general}</span>
            </div>
          )}

          {/* Sección 1: Datos Básicos y Códigos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span>1. Identificación del Producto</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Obligatorio</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-nombre" className="text-xs font-semibold">
                Nombre o Descripción Comercial <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prod-nombre"
                placeholder="Ej. Arroz Costeño Extra 1kg"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={cn('h-9 text-xs', errores.nombre && 'border-destructive focus-visible:ring-destructive')}
                autoFocus
              />
              {errores.nombre && <p className="text-[11px] text-destructive">{errores.nombre}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prod-sku" className="text-xs font-semibold">
                    Código SKU
                  </Label>
                  <button
                    type="button"
                    onClick={handleGenerarNuevoSku}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    title="Generar nuevo SKU aleatorio"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                    <span>Autogenerar</span>
                  </button>
                </div>
                <div className="relative">
                  <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="prod-sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="pl-8 h-9 text-xs font-mono"
                    placeholder="SKU-10023"
                  />
                </div>
                {productoCoincidente && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ SKU coincide con &quot;{productoCoincidente.nombre}&quot;. Al guardar se actualizará.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prod-barcode" className="text-xs font-semibold">
                    Código de Barras (EAN-13 / UPC)
                  </Label>
                  {codigoDisponible && (
                    <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Disponible
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={codigoRef}
                    id="prod-barcode"
                    value={codigoBarras}
                    onChange={(e) => {
                      setCodigoBarras(e.target.value);
                      comprobarCodigo(false, e.target.value);
                    }}
                    onBlur={() => comprobarCodigo()}
                    className={cn('pl-8 h-9 text-xs font-mono', errorCodigo && 'border-destructive')}
                    placeholder="7750123456789"
                  />
                </div>
                {errorCodigo && <p className="text-[11px] text-destructive">{errorCodigo}</p>}
                {coincidencia && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    En uso por: &quot;{coincidencia.nombre}&quot; (SKU: {coincidencia.sku})
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="prod-categoria" className="text-xs font-semibold">
                  Categoría
                </Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger id="prod-categoria" className="h-9 text-xs">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {listaCategorias.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-unidad" className="text-xs font-semibold">
                  Unidad de Medida
                </Label>
                <Select value={unidadMedida} onValueChange={setUnidadMedida}>
                  <SelectTrigger id="prod-unidad" className="h-9 text-xs">
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
          </div>

          {/* Sección 2: Precios, Impuestos y Rentabilidad */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                <span>2. Precios y Rentabilidad</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Moneda: Soles (S/)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="prod-costo" className="text-xs font-semibold">
                  Costo de Compra (S/)
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-mono">S/</span>
                  <Input
                    id="prod-costo"
                    type="number"
                    step="0.01"
                    min="0"
                    value={precioCompra}
                    onChange={(e) => setPrecioCompra(e.target.value)}
                    className={cn('pl-8 h-9 text-xs font-mono', errores.precioCompra && 'border-destructive')}
                    placeholder="0.00"
                  />
                </div>
                {errores.precioCompra && <p className="text-[11px] text-destructive">{errores.precioCompra}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-venta" className="text-xs font-semibold">
                  Precio de Venta al Público (S/) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-mono">S/</span>
                  <Input
                    id="prod-venta"
                    type="number"
                    step="0.01"
                    min="0"
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(e.target.value)}
                    className={cn('pl-8 h-9 text-xs font-mono font-bold text-foreground', errores.precioVenta && 'border-destructive')}
                    placeholder="0.00"
                  />
                </div>
                {errores.precioVenta && <p className="text-[11px] text-destructive">{errores.precioVenta}</p>}
              </div>
            </div>

            {/* Widget dinámico de rentabilidad estimada */}
            <div
              className={cn(
                'p-3 rounded-lg border text-xs flex items-center justify-between transition-colors',
                esVentaMenorQueCosto
                  ? 'bg-destructive/10 border-destructive/30 text-destructive'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              )}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 shrink-0" />
                <div>
                  <span className="font-semibold">
                    {esVentaMenorQueCosto ? 'Margen Negativo (Pérdida)' : 'Margen Estimado por Unidad:'}
                  </span>
                  <p className="text-[11px] opacity-80">
                    {formatCurrency(margenSoles)} ganancia bruta ({margenPorcentaje}%)
                  </p>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-sm">
                {margenPorcentaje > 0 ? `+${margenPorcentaje}%` : `${margenPorcentaje}%`}
              </div>
            </div>
          </div>

          {/* Sección 3: Control de Stock y Almacén */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                <Boxes className="h-3.5 w-3.5 text-indigo-600" />
                <span>3. Control de Stock y Ubicación</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Alertas de Reposición</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="prod-stock" className="text-xs font-semibold">
                  {esEdicion ? 'Stock Actual' : 'Stock Inicial'}
                </Label>
                <Input
                  id="prod-stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="h-9 text-xs font-mono font-semibold"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prod-stock-min" className="text-xs font-semibold">
                  Stock Mínimo de Alerta
                </Label>
                <Input
                  id="prod-stock-min"
                  type="number"
                  min="1"
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value)}
                  className="h-9 text-xs font-mono"
                  placeholder="5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-ubicacion" className="text-xs font-semibold">
                Ubicación Física en Almacén / Tienda (Opcional)
              </Label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="prod-ubicacion"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="pl-8 h-9 text-xs"
                  placeholder="Pasillo 2, Estante B-4"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Pie del Sheet con Acciones */}
        <div className="p-4 border-t border-border bg-muted/20">
          <SheetFooter className="flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="producto-form-sheet"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{esEdicion ? 'Actualizar Producto' : 'Guardar Producto'}</span>
              )}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};
