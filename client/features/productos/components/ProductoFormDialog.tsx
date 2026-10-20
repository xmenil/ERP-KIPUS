import React, { useState, useEffect, useRef } from 'react';
import { productosService } from '../services/productosService';
import { normalizarCodigo } from '../utils/codigosProducto';
import { CameraCodeReader } from './CameraCodeReader';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: (payload: NuevoProductoPayload, id?: string) => Promise<void>;
  productoAEditar?: Producto | null;
  categoriasExistentes?: string[];
  onEditarCoincidencia?: (producto: Producto) => void;
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

export const ProductoFormDialog: React.FC<ProductoFormDialogProps> = ({
  open,
  onOpenChange,
  onGuardar,
  productoAEditar,
  categoriasExistentes = [],
  onEditarCoincidencia,
  productosExistentes = [],
  valoresIniciales,
}) => {
  const esEdicion = Boolean(productoAEditar);

  // Estados del formulario
  const [sku, setSku] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [errorCodigo, setErrorCodigo] = useState('');
  const [errorGuardar, setErrorGuardar] = useState('');
  const [codigoDisponible, setCodigoDisponible] = useState(false);
  const [coincidencia, setCoincidencia] = useState<Producto>();
  const codigoRef = useRef<HTMLInputElement>(null);
  const enviandoRef = useRef(false);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS_PREDEFINIDAS[0]);
  const [precioCompra, setPrecioCompra] = useState<number | string>(0);
  const [precioVenta, setPrecioVenta] = useState<number | string>(0);
  const [stock, setStock] = useState<number | string>(10);
  const [stockMinimo, setStockMinimo] = useState<number | string>(5);
  const [unidadMedida, setUnidadMedida] = useState('UNIDAD');
  const [ubicacion, setUbicacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Errores de validación visibles
  const [errores, setErrores] = useState<{
    nombre?: string;
    precioVenta?: string;
    precioCompra?: string;
    general?: string;
  }>({});

  // Detectar si el SKU ingresado ya pertenece a otro producto del catálogo
  const productoCoincidente = React.useMemo(() => {
    const sNorm = sku.trim().toLowerCase();
    if (!sNorm) return null;
    return productosExistentes.find(
      (p) => p.sku.trim().toLowerCase() === sNorm && p.id !== productoAEditar?.id
    );
  }, [sku, productosExistentes, productoAEditar]);

  // Combinar categorías existentes y predefinidas sin duplicados
  const listaCategorias = Array.from(
    new Set([...categoriasExistentes.filter((c) => c !== 'TODAS'), ...CATEGORIAS_PREDEFINIDAS])
  );

  useEffect(() => {
    setErrores({});
    setCodigoBarras(productoAEditar ? productoAEditar.codigoBarras ?? '' : valoresIniciales?.codigoBarras ?? '');
    setErrorCodigo('');
    setErrorGuardar('');
    setCoincidencia(undefined);
    setCodigoDisponible(false);
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
    } else if (valoresIniciales) {
      setSku(valoresIniciales.sku || `SKU-${Math.floor(10000 + Math.random() * 90000)}`);
      setNombre(valoresIniciales.nombre ?? '');
      setCategoria(valoresIniciales.categoria ?? CATEGORIAS_PREDEFINIDAS[0]);
      setPrecioCompra(valoresIniciales.precioCompra ?? 0);
      setPrecioVenta(valoresIniciales.precioVenta ?? 0);
      setStock(valoresIniciales.stock ?? 0);
      setStockMinimo(valoresIniciales.stockMinimo ?? 5);
      setUnidadMedida(valoresIniciales.unidadMedida ?? 'UNIDAD');
      setUbicacion(valoresIniciales.ubicacion ?? '');
    } else {
      // Valores por defecto para nuevo producto
      setSku(`SKU-${Math.floor(10000 + Math.random() * 90000)}`);
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

  // Generar un código SKU nuevo si el usuario no desea sobreescribir el coincidente
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
      setErrorCodigo(conflicto ? 'Este código ya está registrado. Edita el producto existente o usa otro código.' : '');
      setCodigoDisponible(Boolean(codigo) && !conflicto);
      if (!codigo && moverFoco) {
        setErrorCodigo('Escanea o escribe un código para buscar.');
        return false;
      }
      if (conflicto) return false;
      if (moverFoco) document.getElementById('nombre')?.focus();
      return true;
    } catch (error) {
      setErrorCodigo(error instanceof Error ? error.message : 'Revisa el código ingresado.');
      setCoincidencia(undefined);
      setCodigoDisponible(false);
      return false;
    }
  };

  // Cálculos financieros en tiempo real
  const numCompra = Number(precioCompra) || 0;
  const numVenta = Number(precioVenta) || 0;
  const margenSoles = +(numVenta - numCompra).toFixed(2);
  const margenPorcentaje = numVenta > 0 ? +((margenSoles / numVenta) * 100).toFixed(1) : 0;
  const esVentaMenorQueCosto = numVenta > 0 && numCompra > 0 && numVenta < numCompra;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviandoRef.current) return;
    setErrorGuardar('');
    if (!comprobarCodigo()) {
      codigoRef.current?.focus();
      return;
    }

    const nuevosErrores: typeof errores = {};
    if (!nombre.trim() || nombre.trim().length < 2) {
      nuevosErrores.nombre = 'Ingresa una descripción para el producto (mínimo 2 caracteres).';
    }
    if (numVenta <= 0) {
      nuevosErrores.precioVenta = 'El precio de venta debe ser mayor a S/ 0.00.';
    }
    if (numCompra < 0) {
      nuevosErrores.precioCompra = 'El precio de costo no puede ser negativo.';
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

      // Si estamos editando o si el SKU ya pertenece a un producto existente, pasamos su id para actualizar
      const targetId = productoAEditar?.id || (productoCoincidente ? productoCoincidente.id : undefined);
      await onGuardar(payload, targetId);
      onOpenChange(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No se pudo guardar. Revisa los datos e inténtalo de nuevo.';
      setErrorGuardar(msg);
      setErrores({ general: msg });
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
      enviandoRef.current = false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!enviandoRef.current) onOpenChange(next); }}>
      <DialogContent onOpenAutoFocus={(event) => { if (!esEdicion) { event.preventDefault(); codigoRef.current?.focus(); } }} className="w-[95vw] sm:max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-lg">
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

        <form id="producto-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <fieldset disabled={isSubmitting} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="codigoBarras">Código de barras / QR (opcional)</Label>
            <div className="flex gap-2">
              <Input
                ref={codigoRef}
                id="codigoBarras"
                value={codigoBarras}
                disabled={isSubmitting}
                className="font-mono text-base md:text-sm"
                aria-invalid={Boolean(errorCodigo)}
                aria-describedby="codigo-ayuda codigo-estado"
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => {
                  setCodigoBarras(e.target.value);
                  setErrorCodigo('');
                  setCoincidencia(undefined);
                  setCodigoDisponible(false);
                }}
                onBlur={() => { if (codigoBarras) comprobarCodigo(); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); comprobarCodigo(true); } }}
              />
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => comprobarCodigo(true)}>
                Buscar código
              </Button>
            </div>
            <p id="codigo-ayuda" className="text-xs text-muted-foreground">
              Escanea el producto o escribe su código y presiona Enter. La lectura no guarda el producto.
            </p>
            {open && (
              <CameraCodeReader
                disabled={isSubmitting}
                key={productoAEditar?.id ?? 'nuevo'}
                onRead={(code) => {
                  setCodigoBarras(code);
                  comprobarCodigo(false, code);
                }}
              />
            )}
            <div id="codigo-estado" aria-live="polite" className="text-sm">
              {errorCodigo && <p role="alert" className="text-danger-text">{errorCodigo}</p>}
              {codigoDisponible && <p className="text-muted-foreground">Código disponible. Completa los datos del producto.</p>}
              {coincidencia && (
                <div className="space-y-2">
                  <p>{coincidencia.nombre} · <span className="font-mono">{coincidencia.sku}</span> · {coincidencia.activo ? 'Activo' : 'Inactivo'}</p>
                  {onEditarCoincidencia && (
                    <Button type="button" variant="outline" onClick={() => onEditarCoincidencia(coincidencia)}>
                      Editar producto registrado (reemplaza el borrador)
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Aviso de coincidencia automática con producto existente por SKU */}
          {productoCoincidente && !esEdicion && (
            <div className="flex items-start justify-between gap-3 p-3 rounded-md bg-primary-soft border border-primary/25 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-primary">
                    Código SKU ya asignado: {productoCoincidente.nombre}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Al guardar se actualizarán el precio y stock de este producto en el catálogo.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerarNuevoSku}
                className="h-7 px-2 text-[11px] text-primary border-primary/30 hover:bg-primary-soft shrink-0 font-medium"
              >
                Nuevo SKU
              </Button>
            </div>
          )}

          {/* Aviso de error general si ocurre al guardar */}
          {errores.general && (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-danger-soft border border-destructive/30 text-xs text-danger-text">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errores.general}</span>
            </div>
          )}

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
                onChange={(e) => {
                  setSku(e.target.value);
                  if (errores.general) setErrores((prev) => ({ ...prev, general: undefined }));
                }}
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
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (errores.nombre) setErrores((prev) => ({ ...prev, nombre: undefined }));
                }}
                placeholder="ej. Arroz Costeño Extra 1 kg"
                className={cn('h-9 text-xs bg-background', errores.nombre && 'border-destructive focus-visible:ring-destructive')}
                required
              />
              {errores.nombre && (
                <p className="text-xs text-danger-text font-medium mt-0.5">{errores.nombre}</p>
              )}
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
                  <SelectValue placeholder="Unidad de medida" />
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

          {/* Fila 3: Precios Financieros */}
          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                Estructura de Precios (PEN)
              </span>
              {numVenta > 0 && (
                <span
                  className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded tabular-nums flex items-center gap-1',
                    esVentaMenorQueCosto
                      ? 'bg-danger-soft text-danger-text'
                      : margenPorcentaje >= 20
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                  )}
                >
                  <TrendingUp className="h-3 w-3" />
                  Margen: {formatCurrency(margenSoles)} ({margenPorcentaje}%)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="precioCompra" className="text-xs text-muted-foreground">
                  Precio de Costo / Compra (S/)
                </Label>
                <Input
                  id="precioCompra"
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioCompra}
                  onChange={(e) => {
                    setPrecioCompra(e.target.value);
                    if (errores.precioCompra) setErrores((prev) => ({ ...prev, precioCompra: undefined }));
                  }}
                  className={cn('h-9 text-xs font-mono bg-background', errores.precioCompra && 'border-destructive')}
                />
                {errores.precioCompra && (
                  <p className="text-xs text-danger-text font-medium">{errores.precioCompra}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="precioVenta" className="text-xs font-semibold text-foreground">
                  Precio de Venta Público (S/) *
                </Label>
                <Input
                  id="precioVenta"
                  type="number"
                  step="0.01"
                  min="0"
                  value={precioVenta}
                  onChange={(e) => {
                    setPrecioVenta(e.target.value);
                    if (errores.precioVenta) setErrores((prev) => ({ ...prev, precioVenta: undefined }));
                  }}
                  className={cn('h-9 text-xs font-mono font-bold bg-background', errores.precioVenta && 'border-destructive focus-visible:ring-destructive')}
                  required
                />
                {errores.precioVenta && (
                  <p className="text-xs text-danger-text font-medium">{errores.precioVenta}</p>
                )}
              </div>
            </div>

            {esVentaMenorQueCosto && (
              <div className="flex items-center gap-1.5 text-[11px] text-danger-text bg-danger-soft p-2 rounded">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Atención: El precio de venta es menor al precio de costo (venta con pérdida).</span>
              </div>
            )}
          </div>

          {/* Fila 4: Inventario y Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="stock" className="text-xs font-semibold text-foreground">
                Stock Actual
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="h-9 text-xs font-mono bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stockMinimo" className="text-xs text-muted-foreground">
                Stock Mínimo Alerta
              </Label>
              <Input
                id="stockMinimo"
                type="number"
                min="1"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                className="h-9 text-xs font-mono bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ubicacion" className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Ubicación Física
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
          {errorGuardar && <p role="alert" className="text-sm text-danger-text">{errorGuardar}</p>}
          </fieldset>
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
            type="submit"
            form="producto-form"
            disabled={isSubmitting || Boolean(coincidencia)}
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
