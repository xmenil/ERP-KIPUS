import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SummaryStrip } from '@/components/common/SummaryStrip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProductoFormDialog } from '../components/ProductoFormDialog';
import { EscanerProductoModal } from '../components/EscanerProductoModal';
import { ProductoDetalleModal } from '../components/ProductoDetalleModal';
import { productosService } from '../services/productosService';
import { Producto, NuevoProductoPayload } from '../types/productos.types';
import { erpStore, subscribeToErp } from '@/services/erp/erpStore';
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  pluralizeUnit,
} from '@/utils/formatters';
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
} from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 12;

type EstadoFiltro = 'TODOS' | 'STOCK_BAJO' | 'AGOTADO';
type SortField = 'sku' | 'nombre' | 'precioCompra' | 'precioVenta' | 'stock';

export const ProductosPage: React.FC = () => {
  const { user } = useAuth();

  // TODO backend: ocultar esto en el servidor
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

  // Búsqueda por voz con micrófono
  const { isListening, toggleListening } = useVoiceSearch({
    lang: 'es-PE',
    onTranscript: (texto) => {
      setSearchTerm(texto);
    },
  });

  // Modales de CRUD, Escáner y Detalle
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  const [valoresInicialesForm, setValoresInicialesForm] =
    useState<Partial<NuevoProductoPayload> | null>(null);
  const [escanerModalOpen, setEscanerModalOpen] = useState(false);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(
    null,
  );
  const [eliminando, setEliminando] = useState(false);

  const requestId = useRef(0);
  const fetchProductos = async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await productosService.getProductos();
      if (currentRequest !== requestId.current) return;
      setProductos(data);
    } catch {
      if (currentRequest !== requestId.current) return;
      setError(
        'No se pudo cargar el catálogo de este navegador. Intenta cargarlo nuevamente.',
      );
      toast.error('Error al cargar la lista de productos');
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
    const unsubscribe = subscribeToErp(() => {
      ++requestId.current;
      setProductos(erpStore.getProductos());
      setLoading(false);
      setError(null);
    });
    return () => {
      ++requestId.current;
      unsubscribe();
    };
  }, []);

  // Guardar (Crear o Editar)
  const handleGuardarProducto = async (
    payload: NuevoProductoPayload,
    id?: string,
  ) => {
    try {
      if (id) {
        const actualizado = await productosService.actualizarProducto(
          id,
          payload,
        );
        toast.success(
          `Producto "${actualizado.nombre}" actualizado correctamente`,
        );
      } else {
        const nuevo = await productosService.crearProducto(payload);
        toast.success(
          `Producto "${nuevo.nombre}" registrado exitosamente · SKU: ${nuevo.sku}`,
        );
      }
      setSearchTerm(payload.sku);
      setSelectedCategoria('TODAS');
      setSelectedEstado('TODOS');
      setSortField(null);
      setCurrentPage(1);
      setProductoSeleccionado(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al guardar el producto';
      toast.error(msg);
      throw err;
    }
  };

  // Eliminar producto
  const handleEliminarProducto = (prod: Producto) => {
    setDetalleModalOpen(false);
    setProductoAEliminar(prod);
  };
  const confirmarEliminarProducto = async () => {
    if (!productoAEliminar || eliminando) return;
    const prod = productoAEliminar;
    setEliminando(true);
    try {
      await productosService.eliminarProducto(prod.id);
      toast.success(`Producto "${prod.nombre}" eliminado del catálogo`);
      setProductoAEliminar(null);
      if (detalleModalOpen && productoSeleccionado?.id === prod.id) {
        setDetalleModalOpen(false);
        setProductoSeleccionado(null);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar el producto. Inténtalo nuevamente.',
      );
    } finally {
      setEliminando(false);
    }
  };

  // Abrir modal de nuevo producto
  const handleNuevoProducto = () => {
    setProductoAEditar(null);
    setValoresInicialesForm(null);
    setFormModalOpen(true);
  };

  // Abrir modal de edición
  const handleEditarProducto = (prod: Producto) => {
    setProductoAEditar(prod);
    setFormModalOpen(true);
  };

  // Abrir modal de detalles
  const handleVerDetalles = (prod: Producto) => {
    setProductoSeleccionado(prod);
    setDetalleModalOpen(true);
  };

  const categorias = useMemo(() => {
    return ['TODAS', ...Array.from(new Set(productos.map((p) => p.categoria)))];
  }, [productos]);

  // Conteos para filtros
  const stockCriticoCount = useMemo(() => {
    return productos.filter((p) => p.stock <= p.stockMinimo && p.stock > 0)
      .length;
  }, [productos]);

  const agotadosCount = useMemo(() => {
    return productos.filter((p) => p.stock === 0).length;
  }, [productos]);

  const totalValorizadoVenta = useMemo(() => {
    return productos.reduce((acc, p) => acc + p.stock * p.precioVenta, 0);
  }, [productos]);

  const totalValorizadoCosto = useMemo(() => {
    return productos.reduce((acc, p) => acc + p.stock * p.precioCompra, 0);
  }, [productos]);

  // Filtrado compuesto: búsqueda, categoría y estado
  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Boolean(
          p.codigoBarras?.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      const matchCategory =
        selectedCategoria === 'TODAS' || p.categoria === selectedCategoria;
      const matchEstado =
        selectedEstado === 'TODOS' ||
        (selectedEstado === 'STOCK_BAJO' &&
          p.stock <= p.stockMinimo &&
          p.stock > 0) ||
        (selectedEstado === 'AGOTADO' && p.stock === 0);
      return matchSearch && matchCategory && matchEstado;
    });
  }, [productos, searchTerm, selectedCategoria, selectedEstado]);

  // Ordenamiento interactivo por cabecera
  const sortedProductos = useMemo(() => {
    if (!sortField) return filteredProductos;

    return [...filteredProductos].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'sku' || sortField === 'nombre') {
        comparison = a[sortField].localeCompare(b[sortField], 'es', {
          sensitivity: 'base',
        });
      } else {
        comparison = (a[sortField] ?? 0) - (b[sortField] ?? 0);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredProductos, sortField, sortDirection]);

  // Reiniciar a la primera página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoria, selectedEstado]);

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

  const renderProductActions = (prod: Producto) => (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEditarProducto(prod)}
        aria-label={`Editar ${prod.nombre}`}
      >
        <Edit className="h-4 w-4" />
        <span>Editar</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Más acciones de ${prod.nombre}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => handleVerDetalles(prod)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalle
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-danger-text focus:text-danger-text"
            onSelect={() => handleEliminarProducto(prod)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar producto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const renderSortableHeader = (
    field: SortField,
    label: string,
    align: 'left' | 'right' = 'left',
    extraClass?: string,
  ) => {
    const isSorted = sortField === field;
    return (
      <TableHead
        aria-sort={
          sortField === field
            ? sortDirection === 'asc'
              ? 'ascending'
              : 'descending'
            : 'none'
        }
        className={cn(
          'text-xs font-medium text-muted-foreground uppercase tracking-wide py-2.5 px-3 whitespace-nowrap',
          align === 'right' ? 'text-right' : 'text-left',
          extraClass,
        )}
      >
        <button
          type="button"
          onClick={() => handleSort(field)}
          className={cn(
            'inline-flex items-center gap-1 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded py-0.5',
            align === 'right' ? 'flex-row-reverse ml-auto' : 'flex-row',
          )}
          aria-sort={
            isSorted
              ? sortDirection === 'asc'
                ? 'ascending'
                : 'descending'
              : 'none'
          }
          aria-label={`Ordenar por ${label}`}
        >
          <span>{label}</span>
          {isSorted ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="h-3.5 w-3.5 text-primary shrink-0" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 text-primary shrink-0" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40 shrink-0" />
          )}
        </button>
      </TableHead>
    );
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Productos y precios
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            Catálogo de artículos, precios de venta y control de existencias.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => setEscanerModalOpen(true)}
            className="h-11 md:h-9 gap-2 text-sm"
          >
            <ScanBarcode className="h-4 w-4" />
            <span>Escáner rápido</span>
          </Button>

          <Button
            onClick={handleNuevoProducto}
            className="h-11 md:h-9 gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo producto</span>
          </Button>
        </div>
      </div>

      <SummaryStrip
        loading={loading}
        items={[
          {
            label: 'Productos en catálogo',
            value: formatNumber(productos.length),
          },
          {
            label: 'Stock bajo',
            value: stockCriticoCount,
            description: 'Por debajo del mínimo',
            tone: stockCriticoCount > 0 ? 'warning' : undefined,
          },
          {
            label: 'Agotados',
            value: agotadosCount,
            description: 'Sin unidades disponibles',
            tone: agotadosCount > 0 ? 'danger' : undefined,
          },
          { label: 'Categorías', value: Math.max(0, categorias.length - 1) },
        ]}
      />
      <details className="rounded-md border border-border bg-card px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Valoración del catálogo
        </summary>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {puedeVerCostos && (
            <div>
              <dt className="text-xs text-muted-foreground">
                Inversión en stock al costo
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {formatCurrency(totalValorizadoCosto)}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-muted-foreground">
              Stock valorizado al precio de venta
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">
              {formatCurrency(totalValorizadoVenta)}
            </dd>
          </div>
        </dl>
      </details>
      {/* Bloque principal: Filtros y Tabla */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 space-y-4">
          {/* Barra de Filtros */}
          <div className="space-y-3">
            {/* Buscador con micrófono */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                aria-label="Buscar productos por SKU, nombre o código de barras"
                placeholder={
                  isListening
                    ? 'Escuchando tu voz... Di el producto'
                    : 'Buscar por SKU o descripción...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  'pl-9 pr-24 h-11 text-base md:h-9 md:text-sm w-full',
                  isListening && 'border-ring ring-2 ring-ring bg-primary-soft',
                )}
              />
              <div className="absolute right-0 top-0 flex items-center">
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    aria-label="Limpiar búsqueda"
                    className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground md:h-9 md:w-9"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={cn(
                    'h-11 w-11 md:h-9 md:w-9 rounded-md flex items-center justify-center',
                    isListening
                      ? 'bg-primary-soft text-primary ring-2 ring-ring'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary-soft',
                  )}
                  title={
                    isListening
                      ? 'Detener micrófono'
                      : 'Buscar con micrófono / voz'
                  }
                  aria-label={
                    isListening ? 'Detener micrófono' : 'Buscar con micrófono'
                  }
                  aria-pressed={isListening}
                >
                  {isListening ? (
                    <MicOff className="h-3.5 w-3.5" />
                  ) : (
                    <Mic className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Fila de Filtros: Estados y Selector Limpio de Categorías */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-border/60">
              {/* Botones segmentados de estado de stock */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap shrink-0 mr-1">
                  Estado:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEstado('TODOS');
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'min-h-11 md:min-h-9 px-3 py-2 text-sm font-medium rounded-md border transition-colors whitespace-nowrap shrink-0',
                    selectedEstado === 'TODOS'
                      ? 'bg-primary-soft text-primary border-primary'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground',
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
                    'min-h-11 md:min-h-9 px-3 py-2 text-sm font-medium rounded-md border transition-colors whitespace-nowrap shrink-0',
                    selectedEstado === 'STOCK_BAJO'
                      ? 'bg-warning-soft text-warning-text border-warning/40 font-semibold'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground',
                  )}
                >
                  Stock bajo ({stockCriticoCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEstado('AGOTADO');
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'min-h-11 md:min-h-9 px-3 py-2 text-sm font-medium rounded-md border transition-colors whitespace-nowrap shrink-0',
                    selectedEstado === 'AGOTADO'
                      ? 'bg-danger-soft text-danger-text border-destructive/40 font-semibold'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground',
                  )}
                >
                  Agotado ({agotadosCount})
                </button>
              </div>

              {/* Selector Desplegable Limpio de Categorías */}
              <div className="flex items-center gap-2 w-full md:w-auto self-start md:self-auto">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap shrink-0 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5 text-primary" />
                  Categoría:
                </span>
                <div className="relative min-w-[210px] w-full md:w-64">
                  <select
                    aria-label="Filtrar por categoría"
                    value={selectedCategoria}
                    onChange={(e) => {
                      setSelectedCategoria(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full h-11 md:h-9 rounded-md border border-input bg-card text-foreground px-3 text-base md:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer shadow-2xs pr-7"
                  >
                    {categorias.map((cat) => {
                      const count =
                        cat === 'TODAS'
                          ? productos.length
                          : productos.filter((p) => p.categoria === cat).length;
                      return (
                        <option key={cat} value={cat}>
                          {cat === 'TODAS'
                            ? `Todas las categorías (${count})`
                            : `${cat} (${count})`}
                        </option>
                      );
                    })}
                  </select>
                </div>
                {selectedCategoria !== 'TODAS' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategoria('TODAS');
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
                    title="Ver todas las categorías"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Estado de Error */}
          {error && !loading && (
            <div className="p-4 rounded-md border border-destructive/20 bg-danger-soft text-danger-text flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-xs font-medium">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProductos}
                className="h-11 md:h-9 text-sm gap-1.5 bg-card text-foreground shrink-0 self-start sm:self-auto"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Reintentar</span>
              </Button>
            </div>
          )}

          {/* Estado Cargando (Skeletons) */}
          {loading && (
            <div className="space-y-3">
              {/* Skeletons Desktop */}
              <div className="hidden lg:block border border-border rounded-md overflow-x-auto">
                <Table className="w-full min-w-table">
                  <TableHeader>
                    <TableRow className="bg-muted/40 border-b border-border">
                      <TableHead className="text-xs font-medium text-muted-foreground py-2.5 px-3 whitespace-nowrap">
                        Código SKU
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-2.5 px-3 whitespace-nowrap min-w-48">
                        Descripción del artículo
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-2.5 px-3 whitespace-nowrap">
                        Categoría
                      </TableHead>
                      {puedeVerCostos && (
                        <TableHead className="text-xs font-medium text-muted-foreground text-right py-2.5 px-3 whitespace-nowrap">
                          P. Costo
                        </TableHead>
                      )}
                      <TableHead className="text-xs font-medium text-muted-foreground text-right py-2.5 px-3 whitespace-nowrap">
                        PVP Venta
                      </TableHead>
                      {puedeVerCostos && (
                        <TableHead className="text-xs font-medium text-muted-foreground text-right py-2.5 px-3 whitespace-nowrap">
                          Margen
                        </TableHead>
                      )}
                      <TableHead className="text-xs font-medium text-muted-foreground text-right py-2.5 px-3 whitespace-nowrap">
                        Stock en almacén
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-center py-2.5 px-3 whitespace-nowrap">
                        Estado
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <TableRow
                        key={index}
                        className="border-b border-border/60"
                      >
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="py-3 px-3 min-w-48">
                          <Skeleton className="h-4 w-48 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">
                          <Skeleton className="h-5 w-20 rounded-md" />
                        </TableCell>
                        {puedeVerCostos && (
                          <TableCell className="py-3 px-3 text-right whitespace-nowrap">
                            <Skeleton className="h-4 w-16 ml-auto" />
                          </TableCell>
                        )}
                        <TableCell className="py-3 px-3 text-right whitespace-nowrap">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </TableCell>
                        {puedeVerCostos && (
                          <TableCell className="py-3 px-3 text-right whitespace-nowrap">
                            <Skeleton className="h-4 w-12 ml-auto" />
                          </TableCell>
                        )}
                        <TableCell className="py-3 px-3 text-right whitespace-nowrap">
                          <Skeleton className="h-4 w-16 ml-auto mb-1" />
                          <Skeleton className="h-3 w-12 ml-auto" />
                        </TableCell>
                        <TableCell className="py-3 px-3 text-center whitespace-nowrap">
                          <Skeleton className="h-5 w-16 mx-auto rounded-md" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Skeletons Mobile */}
              <div className="block lg:hidden space-y-2.5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-md border border-border bg-card space-y-2.5"
                  >
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                    <div className="flex justify-between pt-2 border-t border-border/40">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado Vacío */}
          {!loading && !error && sortedProductos.length === 0 && (
            <div className="py-12 px-4 text-center border border-border rounded-md bg-muted/10 space-y-3">
              {productos.length === 0 ? (
                <>
                  <p className="text-base font-medium text-foreground">
                    Aún no registraste productos
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Agrega el primer producto o servicio a tu catálogo para
                    empezar a vender y controlar tus existencias.
                  </p>
                  <Button onClick={handleNuevoProducto} className="h-9 gap-1.5">
                    <Plus className="h-4 w-4" />
                    <span>Nuevo producto</span>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-base font-medium text-foreground">
                    No encontramos productos que coincidan
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    No hay resultados para los filtros seleccionados
                    {searchTerm ? ` («${searchTerm}»)` : ''}. Modifica o
                    restablece los criterios.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategoria('TODAS');
                      setSelectedEstado('TODOS');
                    }}
                    className="h-9 text-xs"
                  >
                    Limpiar filtros
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Contenido con Datos */}
          {!loading && !error && sortedProductos.length > 0 && (
            <>
              {/* Tabla Desktop (>= lg) */}
              <div className="hidden lg:block rounded-md border border-border bg-card overflow-x-auto">
                <Table className="w-full min-w-table">
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow className="bg-muted/40 border-b border-border hover:bg-muted/40">
                      {renderSortableHeader('sku', 'Código SKU')}
                      {renderSortableHeader(
                        'nombre',
                        'Producto',
                        'left',
                        'min-w-48',
                      )}
                      <TableHead className="hidden 2xl:table-cell text-xs font-medium text-muted-foreground uppercase tracking-wide py-2.5 px-3 whitespace-nowrap">
                        Categoría
                      </TableHead>
                      {puedeVerCostos &&
                        renderSortableHeader(
                          'precioCompra',
                          'Costo',
                          'right',
                          'hidden 2xl:table-cell',
                        )}
                      {renderSortableHeader(
                        'precioVenta',
                        'Precio de venta',
                        'right',
                      )}
                      {puedeVerCostos && (
                        <TableHead className="hidden 2xl:table-cell text-xs font-medium text-muted-foreground uppercase tracking-wide text-right py-2.5 px-3 whitespace-nowrap">
                          Margen
                        </TableHead>
                      )}
                      {renderSortableHeader('stock', 'Stock', 'right')}
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center py-2.5 px-3 whitespace-nowrap">
                        Estado
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right py-2.5 px-3 whitespace-nowrap">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProductos.map((prod) => {
                      const isAgotado = prod.stock === 0;
                      const isLowStock =
                        prod.stock <= prod.stockMinimo && !isAgotado;
                      const marginPct =
                        prod.precioCompra > 0
                          ? ((prod.precioVenta - prod.precioCompra) /
                              prod.precioCompra) *
                            100
                          : 100;

                      return (
                        <TableRow
                          key={prod.id}
                          className="hover:bg-muted/40 border-b border-border/70 transition-colors cursor-pointer"
                          onClick={() => handleVerDetalles(prod)}
                        >
                          <TableCell className="font-mono text-xs font-medium text-foreground py-2.5 px-3 whitespace-nowrap">
                            {prod.sku}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 min-w-48">
                            <span className="font-medium text-foreground text-sm block leading-snug hover:text-primary transition-colors">
                              {prod.nombre}
                            </span>
                            <span className="text-xs text-muted-foreground block">
                              Unidad: {prod.unidadMedida.toLowerCase()}
                            </span>
                          </TableCell>
                          <TableCell className="hidden 2xl:table-cell py-2.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                              {prod.categoria}
                            </span>
                          </TableCell>

                          {/* P. Costo - Oculto para CAJERO */}
                          {puedeVerCostos && (
                            <TableCell className="hidden 2xl:table-cell text-right text-muted-foreground tabular-nums py-2.5 px-3 text-sm whitespace-nowrap">
                              {formatCurrency(prod.precioCompra)}
                            </TableCell>
                          )}

                          <TableCell className="text-right font-semibold text-foreground py-2.5 px-3 text-sm tabular-nums whitespace-nowrap">
                            {formatCurrency(prod.precioVenta)}
                          </TableCell>

                          {/* Margen comercial - Oculto para CAJERO */}
                          {puedeVerCostos && (
                            <TableCell className="hidden 2xl:table-cell text-right tabular-nums py-2.5 px-3 text-sm whitespace-nowrap">
                              <span
                                className={cn(
                                  'font-medium',
                                  marginPct < 0
                                    ? 'text-danger-text'
                                    : marginPct < 15
                                      ? 'text-warning-text'
                                      : 'text-foreground',
                                )}
                              >
                                {formatPercentage(marginPct)}
                              </span>
                            </TableCell>
                          )}

                          <TableCell className="text-right py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={cn(
                                'inline-block text-sm tabular-nums',
                                isAgotado
                                  ? 'font-medium text-danger-text bg-danger-soft px-1.5 py-0.5 rounded-md border border-destructive/20'
                                  : isLowStock
                                    ? 'font-medium text-warning-text bg-warning-soft px-1.5 py-0.5 rounded-md border border-warning/20'
                                    : 'font-medium text-foreground',
                              )}
                            >
                              {prod.stock}{' '}
                              {pluralizeUnit(prod.stock, prod.unidadMedida)}
                            </span>
                            <span className="block text-xs text-muted-foreground mt-0.5 tabular-nums">
                              Mín. {prod.stockMinimo}
                            </span>
                          </TableCell>

                          <TableCell className="text-center py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
                                isAgotado
                                  ? 'bg-danger-soft text-danger-text border-destructive/30'
                                  : isLowStock
                                    ? 'bg-warning-soft text-warning-text border-warning/30'
                                    : 'bg-success-soft text-success-text border-success/30',
                              )}
                            >
                              {isAgotado
                                ? 'Agotado'
                                : isLowStock
                                  ? 'Stock bajo'
                                  : 'Disponible'}
                            </span>
                          </TableCell>

                          <TableCell
                            className="text-right py-2 px-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {renderProductActions(prod)}{' '}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Lista Adaptada Mobile y pantallas medianas (< lg) */}
              <div className="block lg:hidden space-y-2.5">
                {paginatedProductos.map((prod) => {
                  const isAgotado = prod.stock === 0;
                  const isLowStock =
                    prod.stock <= prod.stockMinimo && !isAgotado;
                  const marginPct =
                    prod.precioCompra > 0
                      ? ((prod.precioVenta - prod.precioCompra) /
                          prod.precioCompra) *
                        100
                      : 100;

                  return (
                    <div
                      key={prod.id}
                      className="p-3.5 rounded-md border border-border bg-card space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {prod.sku}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
                            isAgotado
                              ? 'bg-danger-soft text-danger-text border-destructive/30'
                              : isLowStock
                                ? 'bg-warning-soft text-warning-text border-warning/30'
                                : 'bg-success-soft text-success-text border-success/30',
                          )}
                        >
                          {isAgotado
                            ? 'Agotado'
                            : isLowStock
                              ? 'Stock bajo'
                              : 'Disponible'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-foreground leading-snug">
                          {prod.nombre}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {prod.categoria} · {prod.unidadMedida.toLowerCase()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-xs">
                            PVP Venta
                          </span>
                          <span className="text-sm font-semibold text-foreground tabular-nums">
                            {formatCurrency(prod.precioVenta)}
                          </span>
                          {puedeVerCostos && (
                            <span className="text-xs text-muted-foreground block font-mono mt-0.5">
                              Costo: {formatCurrency(prod.precioCompra)} ·
                              Margen: {formatPercentage(marginPct)}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground block text-xs">
                            Disponible
                          </span>
                          <span
                            className={cn(
                              'text-sm font-semibold tabular-nums',
                              isAgotado
                                ? 'text-danger-text'
                                : isLowStock
                                  ? 'text-warning-text'
                                  : 'text-foreground',
                            )}
                          >
                            {prod.stock}{' '}
                            {pluralizeUnit(prod.stock, prod.unidadMedida)}
                          </span>
                          <span className="text-xs text-muted-foreground block">
                            Mín. {prod.stockMinimo}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-border pt-2">
                        {renderProductActions(prod)}{' '}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pie de Tabla: Conteo y Paginación */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border text-xs text-muted-foreground">
                <p>
                  Mostrando{' '}
                  <span className="font-medium text-foreground tabular-nums">
                    {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, sortedProductos.length)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium text-foreground tabular-nums">
                    {sortedProductos.length}
                  </span>{' '}
                  productos
                </p>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="h-11 md:h-9 text-sm"
                    >
                      Anterior
                    </Button>
                    <span className="px-2 font-medium tabular-nums text-foreground">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="h-11 md:h-9 text-sm"
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(productoAEliminar)}
        onOpenChange={(open) => {
          if (!open && !eliminando) setProductoAEliminar(null);
        }}
      >
        <AlertDialogContent className="w-11/12 rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará «{productoAEliminar?.nombre}» del catálogo y de la
              selección de productos para nuevas ventas. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={eliminando}
              onClick={confirmarEliminarProducto}
            >
              {eliminando ? 'Eliminando…' : 'Eliminar producto'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Escáner Rápido de Productos */}
      <EscanerProductoModal
        open={escanerModalOpen}
        onOpenChange={setEscanerModalOpen}
        productosExistentes={productos}
        onEditarProducto={handleEditarProducto}
        onGuardarProducto={async (payload) => {
          await handleGuardarProducto(payload);
        }}
        onAbrirFormularioCompleto={(datos) => {
          setValoresInicialesForm(datos);
          setProductoAEditar(null);
          setFormModalOpen(true);
        }}
      />

      {/* Modal Formulario de Producto (Crear o Editar) */}
      <ProductoFormDialog
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        onGuardar={handleGuardarProducto}
        productoAEditar={productoAEditar}
        onEditarCoincidencia={handleEditarProducto}
        categoriasExistentes={categorias}
        productosExistentes={productos}
        valoresIniciales={valoresInicialesForm}
      />

      {/* Modal Detalle de Producto */}
      <ProductoDetalleModal
        open={detalleModalOpen}
        onOpenChange={setDetalleModalOpen}
        producto={productoSeleccionado}
        onEditarClick={(prod) => {
          setDetalleModalOpen(false);
          handleEditarProducto(prod);
        }}
        onEliminarClick={(prod) => {
          handleEliminarProducto(prod);
        }}
        puedeVerCostos={puedeVerCostos}
      />
    </div>
  );
};

export default ProductosPage;
