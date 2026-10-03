import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { NuevoProductoDialog } from '../components/NuevoProductoDialog';
import { productosService } from '../services/productosService';
import { Producto, NuevoProductoPayload } from '../types/productos.types';
import { subscribeToErp } from '@/services/erp/erpStore';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { Plus, Search, X, RotateCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 12;

export const ProductosPage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);

  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productosService.getProductos();
      setProductos(data);
    } catch {
      setError('No se pudo cargar el catálogo de productos. Revisa tu conexión a internet o el estado del sistema.');
      toast.error('Error al cargar la lista de productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
    const unsubscribe = subscribeToErp(() => {
      fetchProductos();
    });
    return unsubscribe;
  }, []);

  const handleCrearProducto = async (payload: NuevoProductoPayload) => {
    try {
      const nuevo = await productosService.crearProducto(payload);
      setProductos((prev) => [nuevo, ...prev]);
      toast.success(`Producto "${nuevo.nombre}" registrado exitosamente · SKU: ${nuevo.sku}`);
    } catch {
      toast.error('No se pudo registrar el producto');
      throw new Error('Error al registrar producto');
    }
  };

  const categorias = useMemo(() => {
    return ['TODAS', ...Array.from(new Set(productos.map((p) => p.categoria)))];
  }, [productos]);

  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory =
        selectedCategoria === 'TODAS' || p.categoria === selectedCategoria;
      return matchSearch && matchCategory;
    });
  }, [productos, searchTerm, selectedCategoria]);

  // Reiniciar a la primera página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoria]);

  const totalPages = Math.max(1, Math.ceil(filteredProductos.length / PAGE_SIZE));
  const paginatedProductos = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProductos.slice(start, start + PAGE_SIZE);
  }, [filteredProductos, currentPage]);

  const totalValorizadoVenta = useMemo(() => {
    return productos.reduce((acc, p) => acc + p.stock * p.precioVenta, 0);
  }, [productos]);

  const stockCriticoCount = useMemo(() => {
    return productos.filter((p) => p.stock <= p.stockMinimo).length;
  }, [productos]);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Productos y precios
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            Catálogo de artículos, precios de venta y control de existencias.
          </p>
        </div>
        <Button
          onClick={() => setOpenModal(true)}
          className="h-9 gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo producto</span>
        </Button>
      </div>

      {/* Resumen métrico operativo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Total en catálogo
            </p>
            {loading ? (
              <Skeleton className="h-7 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums mt-0.5">
                {formatNumber(productos.length)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              Artículos y servicios activos
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Valorizado en venta
            </p>
            {loading ? (
              <Skeleton className="h-7 w-32 mt-1" />
            ) : (
              <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums mt-0.5">
                {formatCurrency(totalValorizadoVenta)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              Stock actual valorizado a PVP
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Stock por agotarse
            </p>
            {loading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <div className="flex items-baseline gap-2 mt-0.5">
                <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                  {stockCriticoCount}
                </p>
                {stockCriticoCount > 0 && (
                  <span className="text-xs font-medium text-danger-text">
                    en nivel crítico
                  </span>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {stockCriticoCount === 0
                ? 'Todas las existencias en nivel óptimo'
                : 'Requieren orden de reposición'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bloque principal: Filtros y Tabla */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 space-y-4">
          {/* Barra de Filtros en 2 filas limpias */}
          <div className="flex flex-col gap-3">
            {/* Buscador */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por SKU o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 h-9 text-base md:text-sm w-full"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Selector de categorías con botones que no rompen texto */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoria(cat)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0',
                    selectedCategoria === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  )}
                >
                  {cat === 'TODAS' ? 'Todas las categorías' : cat}
                </button>
              ))}
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
                className="h-8 text-xs gap-1.5 bg-card text-foreground shrink-0 self-start sm:self-auto"
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
                      <TableHead className="text-xs font-medium text-muted-foreground py-2.5 px-3 whitespace-nowrap">Código SKU</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-2.5 px-3 whitespace-nowrap min-w-48">Descripción del artículo</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-2.5 px-3 whitespace-nowrap">Categoría</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-right py-2.5 px-3 whitespace-nowrap">P. Costo</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-right py-2.5 px-3 whitespace-nowrap">PVP Venta</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-right py-2.5 px-3 whitespace-nowrap">Stock en almacén</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-center py-2.5 px-3 whitespace-nowrap">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <TableRow key={index} className="border-b border-border/60">
                        <TableCell className="py-3 px-3 whitespace-nowrap"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="py-3 px-3 min-w-48">
                          <Skeleton className="h-4 w-48 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap"><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                        <TableCell className="py-3 px-3 text-right whitespace-nowrap"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="py-3 px-3 text-right whitespace-nowrap"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                        <TableCell className="py-3 px-3 text-right whitespace-nowrap">
                          <Skeleton className="h-4 w-16 ml-auto mb-1" />
                          <Skeleton className="h-3 w-12 ml-auto" />
                        </TableCell>
                        <TableCell className="py-3 px-3 text-center whitespace-nowrap"><Skeleton className="h-5 w-16 mx-auto rounded-md" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Skeletons Mobile */}
              <div className="block lg:hidden space-y-2.5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="p-3.5 rounded-md border border-border bg-card space-y-2.5">
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
          {!loading && !error && filteredProductos.length === 0 && (
            <div className="py-12 px-4 text-center border border-border rounded-md bg-muted/10 space-y-3">
              {productos.length === 0 ? (
                <>
                  <p className="text-base font-medium text-foreground">
                    Aún no registraste productos
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Agrega el primer producto o servicio a tu catálogo para empezar a vender y controlar tus existencias.
                  </p>
                  <Button
                    onClick={() => setOpenModal(true)}
                    className="h-9 gap-1.5"
                  >
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
                    No hay resultados para {searchTerm ? `«${searchTerm}»` : 'la categoría seleccionada'}. Revisa el código SKU o la descripción.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategoria('TODAS');
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
          {!loading && !error && filteredProductos.length > 0 && (
            <>
              {/* Tabla Desktop (>= lg) */}
              <div className="hidden lg:block rounded-md border border-border bg-card overflow-x-auto">
                <Table className="w-full min-w-table">
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow className="bg-muted/40 border-b border-border hover:bg-muted/40">
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide py-2.5 px-3 whitespace-nowrap">Código SKU</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide py-2.5 px-3 whitespace-nowrap min-w-48">Descripción del artículo</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide py-2.5 px-3 whitespace-nowrap">Categoría</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right py-2.5 px-3 whitespace-nowrap">P. Costo</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right py-2.5 px-3 whitespace-nowrap">PVP Venta</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right py-2.5 px-3 whitespace-nowrap">Stock en almacén</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center py-2.5 px-3 whitespace-nowrap">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProductos.map((prod) => {
                      const isLowStock = prod.stock <= prod.stockMinimo;
                      return (
                        <TableRow
                          key={prod.id}
                          className="hover:bg-muted/40 border-b border-border/70 transition-colors"
                        >
                          <TableCell className="font-mono text-xs font-medium text-foreground py-2.5 px-3 whitespace-nowrap">
                            {prod.sku}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 min-w-48">
                            <span className="font-medium text-foreground text-sm block leading-snug">
                              {prod.nombre}
                            </span>
                            <span className="text-xs text-muted-foreground block">
                              Unidad: {prod.unidadMedida.toLowerCase()}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                              {prod.categoria}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground tabular-nums py-2.5 px-3 text-xs whitespace-nowrap">
                            {formatCurrency(prod.precioCompra)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-foreground py-2.5 px-3 text-sm tabular-nums whitespace-nowrap">
                            {formatCurrency(prod.precioVenta)}
                          </TableCell>
                          <TableCell className="text-right py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={cn(
                                'inline-block text-sm tabular-nums',
                                isLowStock
                                  ? 'font-medium text-danger-text bg-danger-soft px-1.5 py-0.5 rounded-md border border-destructive/20'
                                  : 'font-medium text-foreground'
                              )}
                            >
                              {prod.stock} {prod.unidadMedida.toLowerCase()}s
                            </span>
                            <span className="block text-xs text-muted-foreground mt-0.5 tabular-nums">
                              Mín. {prod.stockMinimo}
                            </span>
                          </TableCell>
                          <TableCell className="text-center py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
                                isLowStock
                                  ? 'bg-danger-soft text-danger-text border-destructive/30'
                                  : 'bg-success-soft text-success-text border-success/30'
                              )}
                            >
                              {isLowStock ? 'Stock bajo' : 'Normal'}
                            </span>
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
                  const isLowStock = prod.stock <= prod.stockMinimo;
                  return (
                    <div
                      key={prod.id}
                      className="p-3.5 rounded-md border border-border bg-card space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-medium text-muted-foreground">
                          {prod.sku}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
                            isLowStock
                              ? 'bg-danger-soft text-danger-text border-destructive/30'
                              : 'bg-success-soft text-success-text border-success/30'
                          )}
                        >
                          {isLowStock ? 'Stock bajo' : 'Normal'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-foreground leading-snug">
                          {prod.nombre}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {prod.categoria} · {prod.unidadMedida.toLowerCase()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-xs">PVP Venta</span>
                          <span className="text-sm font-semibold text-foreground tabular-nums">
                            {formatCurrency(prod.precioVenta)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-muted-foreground block text-xs">Disponible</span>
                          <span
                            className={cn(
                              'text-sm font-medium tabular-nums',
                              isLowStock ? 'text-danger-text font-semibold' : 'text-foreground'
                            )}
                          >
                            {prod.stock} {prod.unidadMedida.toLowerCase()}s
                          </span>
                        </div>
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
                    {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProductos.length)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium text-foreground tabular-nums">
                    {filteredProductos.length}
                  </span>{' '}
                  productos
                </p>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="h-8 text-xs"
                    >
                      Anterior
                    </Button>
                    <span className="px-2 font-medium tabular-nums text-foreground">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 text-xs"
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

      <NuevoProductoDialog
        open={openModal}
        onOpenChange={setOpenModal}
        onProductoCreado={handleCrearProducto}
      />
    </div>
  );
};

export default ProductosPage;
