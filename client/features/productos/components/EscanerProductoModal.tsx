import React, { useState, useTransition, useEffect, useRef } from 'react';
import { normalizarCodigo } from '../utils/codigosProducto';
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
import { BarcodeCameraScanner } from './BarcodeCameraScanner';
import {
  buscarProductoPorCodigo,
  BarcodeLookupResult,
} from '../services/barcodeCatalogService';
import { Producto, NuevoProductoPayload } from '../types/productos.types';
import { formatCurrency } from '@/utils/formatters';
import {
  ScanBarcode,
  PackageCheck,
  AlertCircle,
  Loader2,
  TrendingUp,
  Plus,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface EscanerProductoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productosExistentes: Producto[];
  onGuardarProducto: (payload: NuevoProductoPayload) => Promise<void>;
  onAbrirFormularioCompleto: (payload: Partial<NuevoProductoPayload>) => void;
  onEditarProducto: (producto: Producto) => void;
}

const CATEGORIAS = [
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

const UNIDADES = [
  { value: 'UNIDAD', label: 'Unidad (und)' },
  { value: 'KILO', label: 'Kilogramo (kg)' },
  { value: 'PAQUETE', label: 'Paquete (pqt)' },
  { value: 'LATA', label: 'Lata (lat)' },
  { value: 'BOTELLA', label: 'Botella (bot)' },
  { value: 'BOLSA', label: 'Bolsa (bls)' },
  { value: 'CAJA', label: 'Caja (cja)' },
  { value: 'LITRO', label: 'Litro (L)' },
];

export const EscanerProductoModal: React.FC<EscanerProductoModalProps> = ({
  open,
  onOpenChange,
  productosExistentes,
  onGuardarProducto,
  onAbrirFormularioCompleto,
  onEditarProducto,
}) => {
  const [, startTransition] = useTransition();

  const [loadingLookup, setLoadingLookup] = useState(false);
  const [resultado, setResultado] = useState<BarcodeLookupResult | null>(null);

  // Campos del producto detectado
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [unidadMedida, setUnidadMedida] = useState('UNIDAD');
  const [precioCompra, setPrecioCompra] = useState<number | string>(0);
  const [precioVenta, setPrecioVenta] = useState<number | string>(0);
  const [stock, setStock] = useState<number | string>(10);
  const [modoContinuo, setModoContinuo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codigoBarras, setCodigoBarras] = useState('');
  const solicitudRef = useRef(0);
  const guardandoRef = useRef(false);
  useEffect(() => {
    solicitudRef.current++;
    setResultado(null);
    setCodigoBarras('');
    setLoadingLookup(false);
    return () => { solicitudRef.current++; };
  }, [open]);

  // Manejar cuando se detecta un código por cámara o pistola
  const handleCodigoEscaneado = async (codigo: string) => {
    if (guardandoRef.current) return;
    const solicitud = ++solicitudRef.current;
    setLoadingLookup(true);
    try {
      const normalizado = normalizarCodigo(codigo);
      const res = await buscarProductoPorCodigo(normalizado, productosExistentes);
      if (solicitud !== solicitudRef.current) return;
      setCodigoBarras(normalizado);
      setResultado(res);

      if (res.status === 'existente_en_catalogo') {
        setSku(res.producto.sku);
        setNombre(res.producto.nombre);
        setCategoria(res.producto.categoria);
        setUnidadMedida(res.producto.unidadMedida);
        setPrecioCompra(res.producto.precioCompra);
        setPrecioVenta(res.producto.precioVenta);
        setStock(res.producto.stock);
        toast.info(`El producto "${res.producto.nombre}" ya existe en el catálogo.`);
      } else if (res.status === 'encontrado') {
        setSku(`SKU-${Math.floor(10000 + Math.random() * 90000)}`);
        setNombre(res.datos.nombre);
        setCategoria(res.datos.categoria);
        setUnidadMedida(res.datos.unidadMedida);
        setPrecioCompra(res.datos.precioCompra);
        setPrecioVenta(res.datos.precioVenta);
        setStock(0);
        toast.success(`Datos extraídos: ${res.datos.nombre}`);
      } else {
        setSku(`SKU-${Math.floor(10000 + Math.random() * 90000)}`);
        setNombre('');
        setCategoria('Abarrotes y Granos');
        setUnidadMedida('UNIDAD');
        setPrecioCompra(0);
        setPrecioVenta(0);
        setStock(0);
        toast('Código nuevo detectado. Completa la descripción para agregarlo.');
      }
    } catch {
      toast.error('Error al consultar el código');
    } finally {
      if (solicitud === solicitudRef.current) setLoadingLookup(false);
    }
  };

  // Cálculos de margen
  const numCompra = Number(precioCompra) || 0;
  const numVenta = Number(precioVenta) || 0;
  const margenSoles = +(numVenta - numCompra).toFixed(2);
  const margenPorcentaje = numVenta > 0 ? +((margenSoles / numVenta) * 100).toFixed(1) : 0;

  // Registrar producto de forma ultra-rápida
  const handleAgregarRapido = async () => {
    if (guardandoRef.current || loadingLookup || !resultado || resultado.status === 'existente_en_catalogo') return;
    if (!nombre.trim()) {
      toast.error('Ingresa una descripción para el producto');
      return;
    }
    if (numVenta <= 0) {
      toast.error('El precio de venta debe ser mayor a S/ 0.00');
      return;
    }
    if (!Number.isFinite(numCompra) || numCompra < 0 || !Number.isFinite(numVenta) || !Number.isFinite(Number(stock)) || Number(stock) < 0) {
      toast.error('Revisa los precios y el stock: deben ser números válidos y no negativos.');
      return;
    }

    setIsSubmitting(true);
    guardandoRef.current = true;
    try {
      const payload: NuevoProductoPayload = {
        sku: sku.trim(),
        codigoBarras,
        nombre: nombre.trim(),
        categoria,
        unidadMedida,
        precioCompra: numCompra,
        precioVenta: numVenta,
        stock: Math.max(0, Number(stock) || 0),
        stockMinimo: 5,
      };

      await onGuardarProducto(payload);
      toast.success(`"${nombre}" añadido al catálogo exitosamente.`);

      if (modoContinuo) {
        // En modo continuo, limpiar para seguir escaneando el siguiente
        startTransition(() => {
          setResultado(null);
          setCodigoBarras('');
          setSku('');
          setNombre('');
          setPrecioCompra(0);
          setPrecioVenta(0);
          setStock(0);
        });
      } else {
        onOpenChange(false);
      }
    } catch {
      // Manejado en el callback superior
    } finally {
      setIsSubmitting(false);
      guardandoRef.current = false;
    }
  };

  const handlePersonalizar = () => {
    onAbrirFormularioCompleto({
      sku,
      codigoBarras,
      nombre,
      categoria,
      unidadMedida,
      precioCompra: numCompra,
      precioVenta: numVenta,
      stock: Number(stock) || 0,
      stockMinimo: 5,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setResultado(null);
    setCodigoBarras('');
    setSku('');
    setNombre('');
    setPrecioCompra(0);
    setPrecioVenta(0);
    setStock(0);
  };

  return (
    <Dialog open={open} onOpenChange={value => { if (!guardandoRef.current) onOpenChange(value); }}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <ScanBarcode className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <span>Escáner Rápido de Productos</span>
                  <span className="text-[10px] uppercase font-semibold bg-primary-soft text-primary px-1.5 py-0.5 rounded">
                    Kipu Scan
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Escanea con la cámara o pistola para extraer los datos del producto y agregarlo en 1 clic.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Módulo de Escaneo (Cámara / Pistola / Demos) */}
          {open && <BarcodeCameraScanner
            onScan={handleCodigoEscaneado}
            isScanning={!loadingLookup && !resultado && !isSubmitting}
          />}

          {/* Loader de búsqueda */}
          {loadingLookup && (
            <div className="flex items-center justify-center p-4 rounded-lg border border-border bg-muted/20 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Consultando datos del código de barras…</span>
            </div>
          )}

          {/* Tarjeta de Producto Detectado */}
          {resultado && !loadingLookup && (
            <div className="rounded-lg border border-primary/30 bg-primary-soft/30 p-4 space-y-3.5 animate-in fade-in-50 duration-200">
              {/* Encabezado del resultado */}
              <div className="flex items-start justify-between gap-2 border-b border-border/80 pb-2.5">
                <div className="flex items-center gap-2">
                  {resultado.status === 'existente_en_catalogo' ? (
                    <div className="h-7 w-7 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      {resultado.status === 'existente_en_catalogo'
                        ? 'Producto ya registrado en tu catálogo'
                        : resultado.status === 'encontrado'
                        ? 'Datos del producto encontrados con éxito'
                        : 'Código nuevo listo para registrar'}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {resultado.status === 'existente_en_catalogo'
                        ? `SKU: ${resultado.producto.sku} · Stock actual: ${resultado.producto.stock}`
                        : resultado.origen === 'base_peru'
                        ? 'Sugerencia del catálogo de ejemplo. Verifica nombre, precio y stock antes de guardar.'
                        : resultado.origen === 'open_food_facts'
                        ? 'Identificado en base de datos global de alimentos'
                        : 'Ingresa su nombre para guardarlo'}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Limpiar</span>
                </Button>
              </div>

              {/* Formulario rápido con datos autocompletados */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Código / SKU
                    </Label>
                    <Input
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="h-8 text-xs font-mono font-bold bg-background"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Descripción del Producto *
                    </Label>
                    <Input
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="ej. Leche Gloria Azul 400g"
                      className="h-8 text-xs bg-background"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Categoría
                    </Label>
                    <Select value={categoria} onValueChange={setCategoria}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-xs">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Unidad de Medida
                    </Label>
                    <Select value={unidadMedida} onValueChange={setUnidadMedida}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDADES.map((u) => (
                          <SelectItem key={u.value} value={u.value} className="text-xs">
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Precios y Stock Express */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Costo (S/)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={precioCompra}
                      onChange={(e) => setPrecioCompra(e.target.value)}
                      className="h-8 text-xs font-mono font-bold bg-background tabular-nums"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Venta PVP (S/) *
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={precioVenta}
                      onChange={(e) => setPrecioVenta(e.target.value)}
                      className="h-8 text-xs font-mono font-bold bg-background text-primary tabular-nums"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Stock Inicial
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="h-8 text-xs font-mono font-bold bg-background tabular-nums"
                      required
                    />
                  </div>
                </div>

                {/* Margen de ganancia en línea */}
                <div className="flex items-center justify-between text-[11px] bg-card p-2 rounded border border-border">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Margen estimado:</span>
                    <span className="font-mono font-bold text-foreground">
                      {formatCurrency(margenSoles)}
                    </span>
                  </div>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                      margenPorcentaje >= 20
                        ? 'bg-emerald-50 text-emerald-700'
                        : margenPorcentaje > 0
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {margenPorcentaje}% de ganancia
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones rápidas */}
        <DialogFooter className="p-3 sm:p-4 border-t border-border bg-muted/10 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={modoContinuo}
                onChange={(e) => setModoContinuo(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span>Modo continuo (seguir escaneando productos)</span>
            </label>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {resultado && resultado.status !== 'existente_en_catalogo' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePersonalizar}
                disabled={isSubmitting || loadingLookup}
                className="h-8 text-xs gap-1"
                title="Editar ubicación, stock mínimo y otros campos avanzados"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Formulario completo</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-8 text-xs"
            >
              Cerrar
            </Button>

            {resultado?.status === 'existente_en_catalogo' && <Button type="button" variant="outline" onClick={() => { onOpenChange(false); onEditarProducto(resultado.producto); }}>Editar producto registrado</Button>}
            {resultado && resultado.status !== 'existente_en_catalogo' && (
              <Button
                type="button"
                onClick={handleAgregarRapido}
                disabled={isSubmitting || !nombre.trim() || numVenta <= 0}
                className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1.5 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Guardando…</span>
                  </>
                ) : (
                  <>
                    <PackageCheck className="h-3.5 w-3.5" />
                    <span>Agregar al Catálogo</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
