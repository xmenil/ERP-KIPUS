import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductoFormSheet } from './ProductoFormSheet';
import { EscanerProductoModal } from '@/features/productos/components/EscanerProductoModal';
import { ProductoDetalleModal } from '@/features/productos/components/ProductoDetalleModal';
import { productosService } from '@/features/productos/services/productosService';
import { Producto, NuevoProductoPayload } from '@/features/productos/types/productos.types';
import { subscribeToErp } from '@/services/erp/erpStore';
import { formatCurrency, formatNumber, formatPercentage, pluralizeUnit } from '@/utils/formatters';
import { useAuth } from '@/features/auth/context/AuthContext';
import { cn } from '@/lib/utils';
import { useVoiceSearch } from '@/features/ventas/hooks/useVoiceSearch';
import {
  Plus,
  Search,
  X,
  RotateCw,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  Filter,
  Package,
  ScanBarcode,
  Mic,
  MicOff,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 12;

type EstadoFiltro = 'TODOS' | 'STOCK_BAJO' | 'AGOTADO';
type SortField = 'sku' | 'nombre' | 'precioCompra' | 'precioVenta' | 'stock';

interface CatalogoProductosViewProps {
  onNuevoProductoClick?: () => void;
}

export const CatalogoProductosView: React.FC<CatalogoProductosViewProps> = () => {
  const { user } = useAuth();
  const puedeVerCostos = user?.rol !== 'CAJERO';

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [selectedEstado, setSelectedEstado] = useState<EstadoFiltro>('TODOS');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Búsqueda por voz
  const handleVoiceTranscript = useCallback((texto: string) => {
    setSearchTerm(texto);
  }, []);

  const { isListening, toggleListening } = useVoiceSearch({
    lang: 'es-PE',
    onTranscript: handleVoiceTranscript,
  });

  // Modales y Sheets
  const [sheetOpen, setSheetOpen] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  const [valoresInicialesForm, setValoresInicialesForm] = useState<Partial<NuevoProductoPayload> | null>(null);
  const [escanerModalOpen, setEscanerModalOpen] = useState(false);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  const fetchProductos = async (isInitial: boolean = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    try {
      const data = await productosService.getProductos();
      setProductos(data);
    } catch {
      setError('No se pudo cargar el catálogo de productos. Revisa tu conexión a internet.');
      toast.error('Error al sincronizar productos');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos(true);
    const unsubscribe = subscribeToErp(() => {
      fetchProductos(false);
    });
    return unsubscribe;
  }, []);

  const handleGuardarProducto = async (payload: NuevoProductoPayload, id?: string) => {
    try {
      const { producto: guardado, esNuevo } = await productosService.upsertProducto(payload, id);
      if (esNuevo) {
        toast.success(`Producto "${guardado.nombre}" registrado exitosamente · SKU: ${guardado.sku}`);
      } else {
        toast.success(`Producto "${guardado.nombre}" actualizado correctamente`);
      }
      fetchProductos(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el producto';
      toast.error(msg);
      throw err;
    }
  };

  const handleEliminarProducto = async (prod: Producto) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de eliminar el producto "${prod.nombre}" (SKU: ${prod.sku})?\n\nEsta acción quitará el producto del catálogo y de la lista de ventas.`
    );
    if (!confirmacion) return;

    try {
      await productosService.eliminarProducto(prod.id);
      toast.success(`Producto "${prod.nombre}" eliminado del catálogo`);
      if (detalleModalOpen && productoSeleccionado?.id === prod.id) {
        setDetalleModalOpen(false);
        setProductoSeleccionado(null);
      }
      fetchProductos();
    } catch {
      toast.error('No se pudo eliminar el producto');
    }
  };

  const handleNuevoProducto = () => {
    setProductoAEditar(null);
    setValoresInicialesForm(null);
    setSheetOpen(true);
  };

  const handleEditarProducto = (prod: Producto) => {
    setProductoAEditar(prod);
    setSheetOpen(true);
  };

  const handleVerDetalles = (prod: Producto) => {
    setProductoSeleccionado(prod);
    setDetalleModalOpen(true);
  };

  const categorias = useMemo(() => {
    return ['TODAS', ...Array.from(new Set(productos.map((p) => p.categoria)))];
  }, [productos]);

  const stockCriticoCount = useMemo(() => {
    return productos.filter((p) => p.stock <= p.stockMinimo && p.stock > 0).length;
  }, [productos]);

  const agotadosCount = useMemo(() => {
    return productos.filter((p) => p.stock === 0).length;
  }, [productos]);

  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.codigoBarras && p.codigoBarras.includes(searchTerm));

      const matchCategoria =
        selectedCategoria === 'TODAS' || p.categoria === selectedCategoria;

      let matchEstado = true;
      if (selectedEstado === 'STOCK_BAJO') {
        matchEstado = p.stock <= p.stockMinimo && p.stock > 0;
      } else if (selectedEstado === 'AGOTADO') {
        matchEstado = p.stock === 0;
      }

      return matchSearch && matchCategoria && matchEstado;
    });
  }, [productos, searchTerm, selectedCategoria, selectedEstado]);

  const sortedProductos = useMemo(() => {
    if (!sortField) return filteredProductos;

    return [...filteredProductos].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredProductos, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedProductos.length / PAGE_SIZE));
  const paginatedProductos = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedProductos.slice(start, start + PAGE_SIZE);
  }, [sortedProductos, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/60 ml-1" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-primary ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary ml-1" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Barra de Acciones y Filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card p-3 rounded-lg border border-border shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          {/* Input de Búsqueda Reactivo con Voz */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, SKU o código de barras (F2)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-14 h-9 text-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-7 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleListening}
              className={cn(
                'absolute right-2 top-2 p-0.5 rounded transition-colors cursor-pointer',
                isListening
                  ? 'bg-red-500/10 text-red-600 animate-pulse'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title={isListening ? 'Detener dictado' : 'Búsqueda por voz'}
            >
              {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
          </div>

          {/* Selector de Categoría */}
          <div className="w-48 hidden sm:block">
            <select
              value={selectedCategoria}
              onChange={(e) => {
                setSelectedCategoria(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
            >
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'TODAS' ? 'Todas las categorías' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEscanerModalOpen(true)}
            className="gap-1.5 text-xs font-medium border-border"
            title="Escanear con cámara o lector USB"
          >
            <ScanBarcode className="h-4 w-4" />
            <span className="hidden sm:inline">Escanear</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchProductos(false)}
            className="text-xs border-border"
            title="Refrescar catálogo"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleNuevoProducto}
            className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo producto</span>
          </Button>
        </div>
      </div>

      {/* Chips de Estado y Conteo Rápido */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => {
            setSelectedEstado('TODOS');
            setCurrentPage(1);
          }}
          className={cn(
            'px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer',
            selectedEstado === 'TODOS'
              ? 'bg-primary/10 border-primary/30 text-primary font-bold'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          )}
        >
          Todos ({productos.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedEstado('STOCK_BAJO');
            setCurrentPage(1);
          }}
          className={cn(
            'px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1',
            selectedEstado === 'STOCK_BAJO'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400 font-bold'
              : 'bg-card border-border text-muted-foreground hover:text-amber-600'
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Stock bajo ({stockCriticoCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedEstado('AGOTADO');
            setCurrentPage(1);
          }}
          className={cn(
            'px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1',
            selectedEstado === 'AGOTADO'
              ? 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-400 font-bold'
              : 'bg-card border-border text-muted-foreground hover:text-red-600'
          )}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Agotados ({agotadosCount})</span>
        </button>

        <span className="ml-auto text-muted-foreground text-[11px]">
          Mostrando {filteredProductos.length} producto{filteredProductos.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabla Compacta de Alta Densidad */}
      <div className="rounded-md border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[800px]">
            <TableHeader className="bg-muted/40 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead
                  onClick={() => handleSort('nombre')}
                  className="text-xs font-semibold py-2.5 px-3 cursor-pointer select-none text-foreground w-[32%]"
                >
                  <div className="flex items-center">
                    <span>Producto</span>
                    {getSortIcon('nombre')}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('sku')}
                  className="text-xs font-semibold py-2.5 px-3 cursor-pointer select-none text-foreground w-[16%]"
                >
                  <div className="flex items-center">
                    <span>SKU / Barras</span>
                    {getSortIcon('sku')}
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold py-2.5 px-3 text-foreground w-[16%]">
                  Categoría
                </TableHead>
                {puedeVerCostos && (
                  <TableHead
                    onClick={() => handleSort('precioCompra')}
                    className="text-xs font-semibold py-2.5 px-3 text-right cursor-pointer select-none text-foreground w-[12%]"
                  >
                    <div className="flex items-center justify-end">
                      <span>Costo</span>
                      {getSortIcon('precioCompra')}
                    </div>
                  </TableHead>
                )}
                <TableHead
                  onClick={() => handleSort('precioVenta')}
                  className="text-xs font-semibold py-2.5 px-3 text-right cursor-pointer select-none text-foreground w-[12%]"
                >
                  <div className="flex items-center justify-end">
                    <span>Precio Venta</span>
                    {getSortIcon('precioVenta')}
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort('stock')}
                  className="text-xs font-semibold py-2.5 px-3 text-right cursor-pointer select-none text-foreground w-[12%]"
                >
                  <div className="flex items-center justify-end">
                    <span>Stock</span>
                    {getSortIcon('stock')}
                  </div>
                </TableHead>
                <TableHead className="text-xs font-semibold py-2.5 px-3 text-center text-foreground w-[10%]">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    {puedeVerCostos && <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>}
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedProductos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={puedeVerCostos ? 7 : 6} className="h-36 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Package className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-xs font-semibold">No se encontraron productos</p>
                      <p className="text-[11px] text-muted-foreground">
                        Prueba ajustando los filtros de búsqueda o agrega un nuevo producto al catálogo.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProductos.map((p) => {
                  const estaAgotado = p.stock === 0;
                  const estaCritico = p.stock > 0 && p.stock <= p.stockMinimo;

                  return (
                    <TableRow key={p.id} className="text-xs hover:bg-muted/30 transition-colors">
                      <TableCell className="py-2 px-3">
                        <div className="font-semibold text-foreground leading-snug">{p.nombre}</div>
                        {p.ubicacion && (
                          <div className="text-[10px] text-muted-foreground">{p.ubicacion}</div>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-3 font-mono text-[11px]">
                        <div>{p.sku}</div>
                        {p.codigoBarras && (
                          <div className="text-[10px] text-muted-foreground">{p.codigoBarras}</div>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-muted-foreground">
                        <span className="px-1.5 py-0.5 rounded bg-muted text-[10.5px]">
                          {p.categoria}
                        </span>
                      </TableCell>
                      {puedeVerCostos && (
                        <TableCell className="py-2 px-3 text-right font-mono text-muted-foreground">
                          {formatCurrency(p.precioCompra)}
                        </TableCell>
                      )}
                      <TableCell className="py-2 px-3 text-right font-mono font-bold text-foreground">
                        {formatCurrency(p.precioVenta)}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right">
                        <span
                          className={cn(
                            'font-mono font-bold px-2 py-0.5 rounded text-[11px]',
                            estaAgotado
                              ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30'
                              : estaCritico
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              : 'text-foreground'
                          )}
                        >
                          {p.stock} {p.unidadMedida ? p.unidadMedida.toLowerCase() : 'und'}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerDetalles(p)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Ver detalles del producto"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditarProducto(p)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Editar producto"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEliminarProducto(p)}
                            className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                            title="Eliminar producto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border bg-muted/20 text-xs">
            <span className="text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="h-7 px-2 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="h-7 px-2 text-xs"
              >
                Siguiente <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sheet Lateral para Nuevo / Editar Producto */}
      <ProductoFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onGuardar={handleGuardarProducto}
        productoAEditar={productoAEditar}
        categoriasExistentes={categorias}
        productosExistentes={productos}
        valoresIniciales={valoresInicialesForm}
      />

      {/* Modal de Escáner */}
      <EscanerProductoModal
        open={escanerModalOpen}
        onOpenChange={setEscanerModalOpen}
        productosExistentes={productos}
        onGuardarProducto={handleGuardarProducto}
        onAbrirFormularioCompleto={(payload) => {
          setValoresInicialesForm(payload);
          setProductoAEditar(null);
          setSheetOpen(true);
          setEscanerModalOpen(false);
        }}
        onEditarProducto={(prod) => {
          handleEditarProducto(prod);
          setEscanerModalOpen(false);
        }}
      />

      {/* Modal de Detalles */}
      <ProductoDetalleModal
        open={detalleModalOpen}
        onOpenChange={setDetalleModalOpen}
        producto={productoSeleccionado}
        onEditarClick={(prod) => {
          handleEditarProducto(prod);
          setDetalleModalOpen(false);
        }}
        onEliminarClick={(prod) => {
          handleEliminarProducto(prod);
        }}
        puedeVerCostos={puedeVerCostos}
      />
    </div>
  );
};
