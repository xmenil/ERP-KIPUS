import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { inventarioService } from '../services/inventarioService';
import {
  ItemStockDetalle,
  AjusteInventario,
  AlmacenResumen,
  NuevoAjustePayload,
} from '../types/inventario.types';
import { AdjustmentForm } from './AdjustmentForm';
import { AdjustmentTable } from './AdjustmentTable';
import { ModuloAuditoriaFisica } from './ModuloAuditoriaFisica';
import { SummaryCard } from './SummaryCard';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  Search,
  AlertTriangle,
  Boxes,
  Plus,
  ClipboardCheck,
  RotateCw,
  History,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

export const ControlStockView: React.FC = () => {
  const { user } = useAuth();
  const puedeVerCostos = user?.rol !== 'CAJERO';

  const [productos, setProductos] = useState<ItemStockDetalle[]>([]);
  const [ajustes, setAjustes] = useState<AjusteInventario[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<'TODOS' | 'SUFICIENTE' | 'STOCK_BAJO' | 'AGOTADO'>('TODOS');
  const [almacenFiltro, setAlmacenFiltro] = useState('TODOS');

  // Sub-vistas dentro de Control de Stock: 'existencias' | 'historial-ajustes' | 'auditoria'
  const [subVista, setSubVista] = useState<'existencias' | 'historial-ajustes' | 'auditoria'>('existencias');

  // Modal para registrar un nuevo ajuste
  const [ajusteModalOpen, setAjusteModalOpen] = useState(false);
  const [productoParaAjuste, setProductoParaAjuste] = useState<ItemStockDetalle | null>(null);

  const cargarDatos = async (silencioso: boolean = false) => {
    if (!silencioso) setLoading(true);
    try {
      const [prodsData, ajustesData, almacenesData] = await Promise.all([
        inventarioService.getProductosStock(),
        inventarioService.getAjustes(),
        inventarioService.getAlmacenes(),
      ]);
      setProductos(prodsData || []);
      setAjustes(ajustesData || []);
      setAlmacenes(almacenesData || []);
    } catch {
      toast.error('Error al sincronizar el control de stock');
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const metricas = useMemo(() => {
    const total = productos.length;
    const suficiente = productos.filter((p) => p.estadoNivel === 'SUFICIENTE').length;
    const stockBajo = productos.filter((p) => p.estadoNivel === 'STOCK_BAJO' || p.estadoNivel === 'POR_AGOTARSE').length;
    const agotado = productos.filter((p) => p.estadoNivel === 'AGOTADO').length;
    const valorTotal = productos.reduce((acc, p) => acc + (p.valorizadoCosto || 0), 0);

    return { total, suficiente, stockBajo, agotado, valorTotal };
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch =
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.ubicacion && p.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchNivel = true;
      if (filtroNivel === 'SUFICIENTE') {
        matchNivel = p.estadoNivel === 'SUFICIENTE';
      } else if (filtroNivel === 'STOCK_BAJO') {
        matchNivel = p.estadoNivel === 'STOCK_BAJO' || p.estadoNivel === 'POR_AGOTARSE';
      } else if (filtroNivel === 'AGOTADO') {
        matchNivel = p.estadoNivel === 'AGOTADO';
      }

      const matchAlmacen =
        almacenFiltro === 'TODOS' || (p.almacen && p.almacen.includes(almacenFiltro));

      return matchSearch && matchNivel && matchAlmacen;
    });
  }, [productos, searchTerm, filtroNivel, almacenFiltro]);

  const handleGuardarAjuste = async (payload: NuevoAjustePayload) => {
    try {
      await inventarioService.registrarAjuste(payload);
      toast.success('Ajuste de inventario registrado correctamente');
      setAjusteModalOpen(false);
      setProductoParaAjuste(null);
      await cargarDatos(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el ajuste';
      toast.error(msg);
    }
  };

  const handleAbrirAjusteParaProducto = (prod: ItemStockDetalle) => {
    setProductoParaAjuste(prod);
    setAjusteModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Indicadores Superiores de Existencias y Nivel de Stock */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Total de existencias"
          value={metricas.total}
          description="ítems monitoreados"
        />
        <SummaryCard
          label="Stock bajo / crítico"
          value={metricas.stockBajo}
          description={metricas.stockBajo > 0 ? 'requieren reposición inmediata' : 'niveles en regla'}
          variant={metricas.stockBajo > 0 ? 'warning' : 'default'}
        />
        <SummaryCard
          label="Agotados"
          value={metricas.agotado}
          description={metricas.agotado > 0 ? 'quiebre de inventario' : 'cero agotados'}
          variant={metricas.agotado > 0 ? 'danger' : 'default'}
        />
        <SummaryCard
          label="Valorizado de existencias"
          value={puedeVerCostos ? formatCurrency(metricas.valorTotal) : 'S/ ****'}
          description="calculado al costo de almacén"
        />
      </div>

      {/* Selector de Modos / Sub-vistas */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1 border-b border-border">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={subVista === 'existencias' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSubVista('existencias')}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              subVista === 'existencias' && 'bg-primary text-primary-foreground'
            )}
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Control de Existencias</span>
          </Button>

          <Button
            type="button"
            variant={subVista === 'historial-ajustes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSubVista('historial-ajustes')}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              subVista === 'historial-ajustes' && 'bg-primary text-primary-foreground'
            )}
          >
            <History className="h-3.5 w-3.5" />
            <span>Historial de Ajustes ({ajustes.length})</span>
          </Button>

          <Button
            type="button"
            variant={subVista === 'auditoria' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSubVista('auditoria')}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              subVista === 'auditoria' && 'bg-primary text-primary-foreground'
            )}
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>Inventario Físico / Conteo</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => cargarDatos()}
            className="h-8 text-xs border-border"
            title="Refrescar existencias"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              setProductoParaAjuste(null);
              setAjusteModalOpen(true);
            }}
            className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nuevo ajuste de stock</span>
          </Button>
        </div>
      </div>

      {/* Sub-vista 1: Control de Existencias */}
      {subVista === 'existencias' && (
        <div className="space-y-3.5">
          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between bg-card p-3 rounded-lg border border-border shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por producto, SKU, categoría o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFiltroNivel('TODOS')}
                className={cn(
                  'px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer font-medium',
                  filtroNivel === 'TODOS'
                    ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                )}
              >
                Todos ({productos.length})
              </button>

              <button
                type="button"
                onClick={() => setFiltroNivel('SUFICIENTE')}
                className={cn(
                  'px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer font-medium flex items-center gap-1',
                  filtroNivel === 'SUFICIENTE'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'bg-card border-border text-muted-foreground hover:text-emerald-600'
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Suficiente ({metricas.suficiente})</span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroNivel('STOCK_BAJO')}
                className={cn(
                  'px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer font-medium flex items-center gap-1',
                  filtroNivel === 'STOCK_BAJO'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold'
                    : 'bg-card border-border text-muted-foreground hover:text-amber-600'
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Stock bajo ({metricas.stockBajo})</span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroNivel('AGOTADO')}
                className={cn(
                  'px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer font-medium flex items-center gap-1',
                  filtroNivel === 'AGOTADO'
                    ? 'bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-400 font-bold'
                    : 'bg-card border-border text-muted-foreground hover:text-red-600'
                )}
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Agotados ({metricas.agotado})</span>
              </button>
            </div>
          </div>

          {/* Tabla de Existencias */}
          <div className="rounded-md border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[760px]">
                <TableHeader className="bg-muted/40 border-b border-border">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold py-2.5 px-3 text-foreground w-[32%]">
                      Producto
                    </TableHead>
                    <TableHead className="text-xs font-semibold py-2.5 px-3 text-foreground w-[16%]">
                      Código / SKU
                    </TableHead>
                    <TableHead className="text-xs font-semibold py-2.5 px-3 text-foreground w-[16%]">
                      Ubicación
                    </TableHead>
                    <TableHead className="text-xs font-semibold py-2.5 px-3 text-right text-foreground w-[12%]">
                      Stock Mínimo
                    </TableHead>
                    <TableHead className="text-xs font-semibold py-2.5 px-3 text-right text-foreground w-[12%]">
                      Stock Actual
                    </TableHead>
                    <TableHead className="text-xs font-semibold py-2.5 px-3 text-center text-foreground w-[12%]">
                      Ajuste Rápido
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6} className="h-10 text-center text-xs text-muted-foreground">
                          Cargando existencias...
                        </TableCell>
                      </TableRow>
                    ))
                  ) : productosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-28 text-center text-xs text-muted-foreground">
                        No hay productos que coincidan con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    productosFiltrados.map((prod) => {
                      const estaAgotado = prod.estadoNivel === 'AGOTADO' || prod.stock === 0;
                      const estaCritico =
                        prod.estadoNivel === 'STOCK_BAJO' ||
                        prod.estadoNivel === 'POR_AGOTARSE' ||
                        (prod.stock <= prod.stockMinimo && prod.stock > 0);

                      return (
                        <TableRow key={prod.id} className="text-xs hover:bg-muted/30 transition-colors">
                          <TableCell className="py-2.5 px-3 font-semibold text-foreground">
                            <div>{prod.nombre}</div>
                            <div className="text-[10.5px] text-muted-foreground font-normal">
                              {prod.categoria}
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                            {prod.sku}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-muted-foreground text-[11px]">
                            {prod.ubicacion || 'Sin asignar'}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                            {prod.stockMinimo} {prod.unidadMedida ? prod.unidadMedida.toLowerCase() : 'und'}
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right">
                            <span
                              className={cn(
                                'font-mono font-bold px-2 py-0.5 rounded text-[11px]',
                                estaAgotado
                                  ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30'
                                  : estaCritico
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                  : 'text-emerald-700 dark:text-emerald-400 font-semibold'
                              )}
                            >
                              {prod.stock} {prod.unidadMedida ? prod.unidadMedida.toLowerCase() : 'und'}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAbrirAjusteParaProducto(prod)}
                              className="h-7 px-2 text-[11px] font-medium border-border hover:bg-muted"
                              title="Registrar ajuste rápido para este producto"
                            >
                              <SlidersHorizontal className="h-3 w-3 mr-1 text-primary" />
                              Ajustar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-vista 2: Historial de Ajustes */}
      {subVista === 'historial-ajustes' && (
        <div className="space-y-3">
          <AdjustmentTable
            ajustes={ajustes}
            onNuevoAjuste={() => {
              setProductoParaAjuste(null);
              setAjusteModalOpen(true);
            }}
          />
        </div>
      )}

      {/* Sub-vista 3: Auditoría Física y Conteo */}
      {subVista === 'auditoria' && (
        <div className="space-y-3">
          <ModuloAuditoriaFisica
            productos={productos}
            onAjustar={async (payload) => {
              await inventarioService.registrarAjuste({
                productoId: payload.productoId,
                nuevoStock: payload.stockReal,
                motivo: payload.motivo,
                observacion: payload.observacion,
                almacen: payload.almacen,
              });
              await cargarDatos(true);
            }}
          />
        </div>
      )}

      {/* Formulario Modal para Ajuste de Stock */}
      <AdjustmentForm
        open={ajusteModalOpen}
        onOpenChange={setAjusteModalOpen}
        productos={productos}
        productoInicialId={productoParaAjuste?.id}
        onGuardarAjuste={handleGuardarAjuste}
      />
    </div>
  );
};
