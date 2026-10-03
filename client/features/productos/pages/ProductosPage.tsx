import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { NuevoProductoDialog } from '../components/NuevoProductoDialog';
import { productosService } from '../services/productosService';
import { Producto, NuevoProductoPayload } from '../types/productos.types';
import { subscribeToErp } from '@/services/erp/erpStore';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import {
  PlusCircle,
  Search,
  Package,
  AlertTriangle,
  BadgeDollarSign,
  Boxes,
} from 'lucide-react';
import { toast } from 'sonner';

export const ProductosPage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [openModal, setOpenModal] = useState(false);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const data = await productosService.getProductos();
      setProductos(data);
    } catch {
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
      toast.success(`Producto "${nuevo.nombre}" registrado exitosamente`);
    } catch {
      toast.error('No se pudo registrar el producto');
    }
  };

  const categorias = ['TODAS', ...Array.from(new Set(productos.map((p) => p.categoria)))];

  const filteredProductos = productos.filter((p) => {
    const matchSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory =
      selectedCategoria === 'TODAS' || p.categoria === selectedCategoria;
    return matchSearch && matchCategory;
  });

  const totalValorizadoVenta = productos.reduce((acc, p) => acc + p.stock * p.precioVenta, 0);
  const stockCriticoCount = productos.filter((p) => p.stock <= p.stockMinimo).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de Productos y Precios"
        description="Gestión de artículos, precios por mayor/menor, control de márgenes y stock"
        badge="Catálogo Activo"
      >
        <Button
          size="sm"
          onClick={() => setOpenModal(true)}
          className="gap-2 bg-primary text-primary-foreground font-semibold shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Nuevo Producto</span>
        </Button>
      </PageHeader>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Artículos en Catálogo"
          value={formatNumber(productos.length)}
          subtitle="Productos y servicios registrados"
          icon={Boxes}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40"
        />
        <MetricCard
          title="Valorización en Venta"
          value={formatCurrency(totalValorizadoVenta)}
          subtitle="Stock disponible valorizado a PVP"
          icon={BadgeDollarSign}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
        />
        <MetricCard
          title="Alertas de Stock Mínimo"
          value={`${stockCriticoCount} productos`}
          subtitle="Requieren reposición inmediata"
          icon={AlertTriangle}
          iconColor="text-rose-600 bg-rose-50 dark:bg-rose-950/40"
        />
      </div>

      {/* Filtros y Tabla */}
      <Card className="border-border/80">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por SKU o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Categorías pill selector */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoria(cat)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    selectedCategoria === cat
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-slate-100/90 dark:bg-slate-800/90 border-b border-border">
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Código SKU</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Descripción del Artículo</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Categoría</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-right py-2.5">P. Costo</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-right py-2.5">PVP Venta</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-center py-2.5">Stock en Almacén</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-center py-2.5">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      Cargando catálogo...
                    </TableCell>
                  </TableRow>
                ) : filteredProductos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      No se encontraron artículos que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProductos.map((prod) => {
                    const isLowStock = prod.stock <= prod.stockMinimo;
                    return (
                      <TableRow key={prod.id} className="text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-border/70 transition-colors">
                        <TableCell className="font-mono font-bold text-primary py-2.5">
                          {prod.sku}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground py-2.5">
                          {prod.nombre}
                          <span className="block text-[11px] text-muted-foreground font-normal">
                            Unidad de medida: {prod.unidadMedida}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="px-2 py-0.5 rounded text-xs bg-muted font-medium border border-border/60">
                            {prod.categoria}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground font-mono tabular-nums py-2.5 text-xs">
                          {formatCurrency(prod.precioCompra)}
                        </TableCell>
                        <TableCell className="text-right font-black font-mono text-foreground py-2.5 text-[14px] tabular-nums">
                          {formatCurrency(prod.precioVenta)}
                        </TableCell>
                        <TableCell className="text-center font-bold py-2.5">
                          <span
                            className={
                              isLowStock
                                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800'
                                : 'text-foreground'
                            }
                          >
                            {prod.stock} {prod.unidadMedida.toLowerCase()}s
                          </span>
                          <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">
                            Mín: {prod.stockMinimo}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2.5">
                          <StatusBadge
                            status={isLowStock ? 'Stock Bajo' : 'Normal'}
                            variant={isLowStock ? 'danger' : 'success'}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
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
