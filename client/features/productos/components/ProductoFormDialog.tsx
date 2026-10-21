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
import {
  AlertTriangle,
  Loader2,
  TrendingUp,
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

  // Combinar categorías existentes y predefinidas sin duplicados
  const listaCategorias = Array.from(
    new Set([
      ...categoriasExistentes.filter((c) => c !== 'TODAS'),
      ...CATEGORIAS_PREDEFINIDAS,
    ]),
  );

  useEffect(() => {
    setCodigoBarras(
      productoAEditar
        ? (productoAEditar.codigoBarras ?? '')
        : (valoresIniciales?.codigoBarras ?? ''),
    );
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
      setSku(
        valoresIniciales.sku ||
          `SKU-${Math.floor(10000 + Math.random() * 90000)}`,
      );
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

  const comprobarCodigo = (
    moverFoco = false,
    lectura = codigoBarras,
  ): boolean => {
    try {
      const codigo = normalizarCodigo(lectura);
      setCodigoBarras(codigo);
      const existente = productosService.buscarPorCodigo(codigo);
      const conflicto =
        existente && existente.id !== productoAEditar?.id
          ? existente
          : undefined;
      setCoincidencia(conflicto);
      setErrorCodigo(
        conflicto
          ? 'Este código ya está registrado. Edita el producto existente o usa otro código.'
          : '',
      );
      setCodigoDisponible(Boolean(codigo) && !conflicto);
      if (!codigo && moverFoco) {
        setErrorCodigo('Escanea o escribe un código para buscar.');
        return false;
      }
      if (conflicto) return false;
      if (moverFoco) document.getElementById('nombre')?.focus();
      return true;
    } catch (error) {
      setErrorCodigo(
        error instanceof Error ? error.message : 'Revisa el código ingresado.',
      );
      setCoincidencia(undefined);
      setCodigoDisponible(false);
      return false;
    }
  };

  // Cálculos financieros en tiempo real
  const numCompra = Number(precioCompra) || 0;
  const numVenta = Number(precioVenta) || 0;
  const margenSoles = +(numVenta - numCompra).toFixed(2);
  const margenPorcentaje =
    numVenta > 0 ? +((margenSoles / numVenta) * 100).toFixed(1) : 0;
  const esVentaMenorQueCosto =
    numVenta > 0 && numCompra > 0 && numVenta < numCompra;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviandoRef.current) return;
    setErrorGuardar('');
    if (!comprobarCodigo()) {
      codigoRef.current?.focus();
      return;
    }

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

      await onGuardar(payload, productoAEditar?.id);
      onOpenChange(false);
    } catch (error) {
      setErrorGuardar(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar. Revisa los datos e inténtalo de nuevo.',
      );
      // El error lo maneja la función padre
    } finally {
      setIsSubmitting(false);
      enviandoRef.current = false;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!enviandoRef.current) onOpenChange(next);
      }}
    >
      <DialogContent
        onOpenAutoFocus={(event) => {
          if (!esEdicion) {
            event.preventDefault();
            codigoRef.current?.focus();
          }
        }}
        className="w-[95vw] sm:max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-lg"
      >
        <DialogHeader className="p-4 sm:p-6 pb-3 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                {esEdicion
                  ? `Editar producto · ${productoAEditar?.sku}`
                  : 'Nuevo producto'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {esEdicion
                  ? 'Modifica los precios, datos descriptivos o existencias de este artículo.'
                  : 'Registra un nuevo producto para ventas en POS, inventario y kardex.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          id="producto-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-6"
        >
          <fieldset disabled={isSubmitting} className="space-y-4">
            <legend className="sr-only">Datos del producto</legend>
            <div className="space-y-2">
              <Label htmlFor="codigoBarras">
                Código de barras / QR (opcional)
              </Label>
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
                  onBlur={() => {
                    if (codigoBarras) comprobarCodigo();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      comprobarCodigo(true);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => comprobarCodigo(true)}
                >
                  Buscar código
                </Button>
              </div>
              <p id="codigo-ayuda" className="text-xs text-muted-foreground">
                Escanea el producto o escribe su código y presiona Enter. La
                lectura no guarda el producto.
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
                {errorCodigo && (
                  <p role="alert" className="text-danger-text">
                    {errorCodigo}
                  </p>
                )}
                {codigoDisponible && (
                  <p className="text-muted-foreground">
                    Código disponible. Completa los datos del producto.
                  </p>
                )}
                {coincidencia && (
                  <div className="space-y-2">
                    <p>
                      {coincidencia.nombre} ·{' '}
                      <span className="font-mono">{coincidencia.sku}</span> ·{' '}
                      {coincidencia.activo ? 'Activo' : 'Inactivo'}
                    </p>
                    {onEditarCoincidencia && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onEditarCoincidencia(coincidencia)}
                      >
                        Editar producto registrado (reemplaza el borrador)
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Fila 1: Código SKU y Descripción */}
            <h2 className="border-t border-border pt-4 text-base font-medium">
              Datos del producto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="sku"
                  className="text-sm font-medium text-foreground"
                >
                  Código SKU
                </Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="ej. SKU-001"
                  className="h-11 md:h-9 text-base md:text-sm font-semibold bg-background"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label
                  htmlFor="nombre"
                  className="text-sm font-medium text-foreground"
                >
                  Nombre del producto
                </Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="ej. Arroz Costeño Extra 1 kg"
                  className="h-11 md:h-9 text-base md:text-sm bg-background"
                  required
                />
              </div>
            </div>

            {/* Fila 2: Categoría y Unidad de Medida */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="producto-categoria"
                  className="text-sm font-medium"
                >
                  Categoría
                </Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger
                    id="producto-categoria"
                    className="h-11 md:h-9 text-base md:text-sm bg-background"
                  >
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
                <Label
                  htmlFor="producto-unidad"
                  className="text-sm font-medium"
                >
                  Unidad de medida
                </Label>
                <Select value={unidadMedida} onValueChange={setUnidadMedida}>
                  <SelectTrigger
                    id="producto-unidad"
                    className="h-11 md:h-9 text-base md:text-sm bg-background"
                  >
                    <SelectValue placeholder="Selecciona la unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES_MEDIDA.map((u) => (
                      <SelectItem
                        key={u.value}
                        value={u.value}
                        className="text-xs"
                      >
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fila 3: Precios de Costo y Venta */}
            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Precios
                </span>
                <span className="text-xs text-muted-foreground">
                  Moneda: soles (S/)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="precioCompra"
                    className="text-sm font-medium text-foreground"
                  >
                    Precio de compra
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs font-semibold text-muted-foreground">
                      S/
                    </span>
                    <Input
                      id="precioCompra"
                      type="number"
                      step="0.01"
                      min="0"
                      value={precioCompra}
                      onChange={(e) => setPrecioCompra(e.target.value)}
                      inputMode="decimal"
                      className="h-11 md:h-9 pl-8 text-base md:text-sm bg-background tabular-nums"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Costo de adquisición al proveedor
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="precioVenta"
                    className="text-sm font-medium text-foreground"
                  >
                    Precio de venta
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs font-semibold text-primary">
                      S/
                    </span>
                    <Input
                      id="precioVenta"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={precioVenta}
                      onChange={(e) => setPrecioVenta(e.target.value)}
                      inputMode="decimal"
                      className="h-11 md:h-9 pl-8 text-base md:text-sm bg-background tabular-nums"
                      required
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Precio final al cliente en mostrador
                  </span>
                </div>
              </div>

              {/* Vista previa de margen de ganancia */}
              <div className="flex items-center justify-between p-2.5 rounded-md bg-card border border-border text-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success-text" />
                  <span className="text-muted-foreground">
                    Margen de ganancia:
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(margenSoles)}
                  </span>
                </div>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-xs ${
                    margenPorcentaje >= 20
                      ? 'bg-success-soft text-success-text'
                      : margenPorcentaje > 0
                        ? 'bg-warning-soft text-warning-text'
                        : 'bg-danger-soft text-danger-text'
                  }`}
                >
                  {margenPorcentaje}% de margen
                </span>
              </div>

              {esVentaMenorQueCosto && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-warning-soft border border-border text-sm text-warning-text">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    ¡Atención! El precio de venta es menor al costo. Venderías a
                    pérdida.
                  </span>
                </div>
              )}
            </div>

            {/* Fila 4: Control de Existencias (Stock) y Ubicación */}
            <h2 className="border-t border-border pt-4 text-base font-medium">
              Existencias y ubicación
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="stock"
                  className="text-xs font-semibold text-foreground"
                >
                  Stock {esEdicion ? 'Actual' : 'Inicial'}
                </Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="h-11 md:h-9 text-base md:text-sm font-semibold bg-background tabular-nums"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="stockMinimo"
                  className="text-xs font-semibold text-foreground"
                >
                  Stock mínimo
                </Label>
                <Input
                  id="stockMinimo"
                  type="number"
                  min="1"
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value)}
                  className="h-11 md:h-9 text-base md:text-sm font-semibold bg-background tabular-nums"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="ubicacion"
                  className="text-sm font-medium text-foreground"
                >
                  Ubicación (opcional)
                </Label>
                <Input
                  id="ubicacion"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="ej. Pasillo 2, Estante B"
                  className="h-11 md:h-9 text-base md:text-sm bg-background"
                />
              </div>
            </div>
            {errorGuardar && (
              <p role="alert" className="text-sm text-danger-text">
                {errorGuardar}
              </p>
            )}
          </fieldset>
        </form>

        <DialogFooter className="p-4 sm:p-6 pt-3 border-t border-border bg-muted/10 shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-11 md:h-9 text-base md:text-sm"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="producto-form"
            disabled={isSubmitting || Boolean(coincidencia)}
            className="h-11 md:h-9 text-base md:text-sm bg-primary text-primary-foreground font-semibold min-w-32 shadow-xs"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Guardando…</span>
              </span>
            ) : esEdicion ? (
              'Guardar cambios'
            ) : (
              'Guardar producto'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
