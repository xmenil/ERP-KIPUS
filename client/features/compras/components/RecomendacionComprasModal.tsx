import React, { useState, useMemo } from 'react';
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
  RecomendacionCompraItem,
  ResumenSugerenciaCompras,
} from '../services/sugerenciaComprasService';
import { CompraItemDetalle } from '../types/compras.types';
import { formatCurrency, formatNumber, pluralizeUnit } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  PackageCheck,
  Building2,
  Coins,
  ArrowRight,
  Filter,
  CheckSquare,
  Square,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

interface RecomendacionComprasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sugerencias: ResumenSugerenciaCompras;
  onProcederOrden: (
    items: CompraItemDetalle[],
    proveedorSugerido?: { razonSocial: string; ruc: string }
  ) => void;
}

type TabFiltro = 'TODOS' | 'AGOTADOS' | 'CRITICOS' | 'ROTACION';

export const RecomendacionComprasModal: React.FC<RecomendacionComprasModalProps> = ({
  open,
  onOpenChange,
  sugerencias,
  onProcederOrden,
}) => {
  // Estado local para cantidades editables y selecciones
  const [itemsEstado, setItemsEstado] = useState<RecomendacionCompraItem[]>(sugerencias.items);
  const [filtroTab, setFiltroTab] = useState<TabFiltro>('TODOS');
  const [proveedorFiltro, setProveedorFiltro] = useState<string>('TODOS');

  // Sincronizar cuando se abra o cambien las sugerencias base
  React.useEffect(() => {
    setItemsEstado(sugerencias.items);
  }, [sugerencias, open]);

  // Lista única de proveedores en las sugerencias
  const proveedoresDisponibles = useMemo(() => {
    const map = new Map<string, string>();
    itemsEstado.forEach((i) => {
      if (i.proveedorNombre) {
        map.set(i.proveedorNombre, i.proveedorRuc);
      }
    });
    return Array.from(map.entries()).map(([nombre, ruc]) => ({ nombre, ruc }));
  }, [itemsEstado]);

  // Filtrado de ítems
  const itemsFiltrados = useMemo(() => {
    return itemsEstado.filter((item) => {
      // Filtro por tab de motivo
      if (filtroTab === 'AGOTADOS' && item.motivo !== 'AGOTADO') return false;
      if (filtroTab === 'CRITICOS' && item.motivo !== 'STOCK_CRITICO') return false;
      if (filtroTab === 'ROTACION' && item.motivo !== 'ALTA_ROTACION') return false;

      // Filtro por proveedor
      if (proveedorFiltro !== 'TODOS' && item.proveedorNombre !== proveedorFiltro) {
        return false;
      }

      return true;
    });
  }, [itemsEstado, filtroTab, proveedorFiltro]);

  // Manejar cambio de cantidad sugerida
  const handleCambiarCantidad = (productoId: string, nuevaCantidad: number) => {
    const cantLimpia = Math.max(1, Math.floor(nuevaCantidad || 1));
    setItemsEstado((prev) =>
      prev.map((i) => {
        if (i.productoId === productoId) {
          const subtotal = +(cantLimpia * i.precioCompraUnitario).toFixed(2);
          return { ...i, cantidadSugerida: cantLimpia, subtotalEstimado: subtotal };
        }
        return i;
      })
    );
  };

  // Alternar selección individual
  const handleToggleSeleccion = (productoId: string) => {
    setItemsEstado((prev) =>
      prev.map((i) => (i.productoId === productoId ? { ...i, seleccionado: !i.seleccionado } : i))
    );
  };

  // Seleccionar / Deseleccionar todos los visibles
  const todosSeleccionados =
    itemsFiltrados.length > 0 && itemsFiltrados.every((i) => i.seleccionado);

  const handleToggleTodos = () => {
    const nuevoValor = !todosSeleccionados;
    const idsVisibles = new Set(itemsFiltrados.map((i) => i.productoId));
    setItemsEstado((prev) =>
      prev.map((i) => (idsVisibles.has(i.productoId) ? { ...i, seleccionado: nuevoValor } : i))
    );
  };

  // Totales de los ítems seleccionados
  const seleccionados = useMemo(() => itemsEstado.filter((i) => i.seleccionado), [itemsEstado]);
  const totalItemsSeleccionados = seleccionados.length;
  const totalUnidadesSeleccionadas = seleccionados.reduce((sum, i) => sum + i.cantidadSugerida, 0);
  const inversionTotalSeleccionada = +seleccionados
    .reduce((sum, i) => sum + i.subtotalEstimado, 0)
    .toFixed(2);

  // Proceder a generar la orden de compra
  const handleGenerarOrden = () => {
    if (seleccionados.length === 0) {
      toast.error('Selecciona al menos un producto para generar la orden de compra.');
      return;
    }

    const itemsCompra: CompraItemDetalle[] = seleccionados.map((s) => ({
      productoId: s.productoId,
      sku: s.sku,
      nombre: s.nombre,
      cantidad: s.cantidadSugerida,
      precioUnitario: s.precioCompraUnitario,
      subtotal: s.subtotalEstimado,
    }));

    // Determinar proveedor dominante o el seleccionado en el filtro
    let prov = { razonSocial: 'Alicorp S.A.A.', ruc: '20100055237' };
    if (proveedorFiltro !== 'TODOS') {
      const match = proveedoresDisponibles.find((p) => p.nombre === proveedorFiltro);
      if (match) prov = { razonSocial: match.nombre, ruc: match.ruc };
    } else if (seleccionados[0]?.proveedorNombre) {
      prov = {
        razonSocial: seleccionados[0].proveedorNombre,
        ruc: seleccionados[0].proveedorRuc || '20100055237',
      };
    }

    onProcederOrden(itemsCompra, prov);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-xl">
        {/* Cabecera del Modal */}
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <span>Recomendación Inteligente de Compra</span>
                <span className="text-[10px] uppercase font-semibold bg-primary-soft text-primary px-2 py-0.5 rounded">
                  Por Ventas y Stock
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                El sistema detectó productos con rotación activa o faltantes en almacén para reponer el stock antes de que se agoten.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Resumen Métrico de Reposición */}
        <div className="p-4 sm:p-5 pb-0 shrink-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="border-border/80 bg-card shadow-2xs">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Productos a Reponer</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-bold font-mono tabular-nums text-foreground">
                    {formatNumber(sugerencias.totalProductosSugeridos)}
                  </span>
                  <span className="text-[11px] font-medium text-danger-text">
                    {sugerencias.conteoAgotados} agotados · {sugerencias.conteoCriticos} en alerta
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card shadow-2xs">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Unidades Sugeridas</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-bold font-mono tabular-nums text-foreground">
                    {formatNumber(sugerencias.totalUnidadesSugeridas)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Para 15 a 30 días de venta</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card shadow-2xs">
              <CardContent className="p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Inversión Estimada</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-bold font-mono tabular-nums text-primary">
                    {formatCurrency(sugerencias.inversionTotalEstimada)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">A costo de compra</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros: Tabs de Estado y Filtro por Proveedor */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-b border-border/60 pb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                type="button"
                variant={filtroTab === 'TODOS' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFiltroTab('TODOS')}
                className={cn(
                  'h-7 px-2.5 text-xs',
                  filtroTab === 'TODOS' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                )}
              >
                Todos ({sugerencias.totalProductosSugeridos})
              </Button>

              <Button
                type="button"
                variant={filtroTab === 'AGOTADOS' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFiltroTab('AGOTADOS')}
                className={cn(
                  'h-7 px-2.5 text-xs gap-1',
                  filtroTab === 'AGOTADOS'
                    ? 'bg-rose-600 text-white font-semibold'
                    : 'text-danger-text hover:bg-rose-50'
                )}
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Agotados ({sugerencias.conteoAgotados})</span>
              </Button>

              <Button
                type="button"
                variant={filtroTab === 'CRITICOS' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFiltroTab('CRITICOS')}
                className={cn(
                  'h-7 px-2.5 text-xs gap-1',
                  filtroTab === 'CRITICOS'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-warning-text hover:bg-amber-50'
                )}
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Stock bajo ({sugerencias.conteoCriticos})</span>
              </Button>

              <Button
                type="button"
                variant={filtroTab === 'ROTACION' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFiltroTab('ROTACION')}
                className={cn(
                  'h-7 px-2.5 text-xs gap-1',
                  filtroTab === 'ROTACION'
                    ? 'bg-primary-soft text-primary font-semibold'
                    : 'text-primary hover:bg-primary-soft'
                )}
              >
                <Flame className="h-3 w-3" />
                <span>Alta rotación ({sugerencias.conteoAltaRotacion})</span>
              </Button>
            </div>

            {/* Selector de filtro por proveedor */}
            {proveedoresDisponibles.length > 1 && (
              <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <select
                  value={proveedorFiltro}
                  onChange={(e) => setProveedorFiltro(e.target.value)}
                  className="h-7 text-xs rounded border border-border bg-background px-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="TODOS">Todos los proveedores</option>
                  {proveedoresDisponibles.map((p) => (
                    <option key={p.nombre} value={p.nombre}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Tabla Interactiva de Productos Recomendados */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-2">
          {itemsFiltrados.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/10 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-semibold text-foreground">
                ¡Todas las existencias en este filtro están abastecidas!
              </p>
              <p className="text-[11px] text-muted-foreground">
                No hay productos en nivel crítico para el criterio seleccionado.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-border">
                    <TableHead className="w-10 text-center py-2 px-2">
                      <button
                        type="button"
                        onClick={handleToggleTodos}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                        title={todosSeleccionados ? 'Deseleccionar todos' : 'Seleccionar todos'}
                      >
                        {todosSeleccionados ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground py-2 px-2.5">
                      Producto
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground py-2 px-2.5 whitespace-nowrap">
                      Alerta de Abastecimiento
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground py-2 px-2.5 text-right whitespace-nowrap">
                      Stock / Mínimo
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground py-2 px-2.5 text-right whitespace-nowrap">
                      Ventas Recientes
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground py-2 px-2.5 text-center w-28 whitespace-nowrap">
                      Sugerido Compra
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground py-2 px-2.5 text-right whitespace-nowrap">
                      Costo Unit.
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground py-2 px-2.5 text-right whitespace-nowrap">
                      Subtotal
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground py-2 px-2.5 whitespace-nowrap">
                      Proveedor Sugerido
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsFiltrados.map((item) => (
                    <TableRow
                      key={item.productoId}
                      className={cn(
                        'border-border/60 hover:bg-muted/30 transition-colors',
                        item.seleccionado ? 'bg-primary-soft/20' : 'opacity-70'
                      )}
                    >
                      {/* Checkbox */}
                      <TableCell className="text-center py-2 px-2">
                        <input
                          type="checkbox"
                          checked={item.seleccionado}
                          onChange={() => handleToggleSeleccion(item.productoId)}
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        />
                      </TableCell>

                      {/* Producto */}
                      <TableCell className="py-2 px-2.5">
                        <div className="font-semibold text-xs text-foreground line-clamp-1">
                          {item.nombre}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                          <span>{item.sku}</span>
                          <span>·</span>
                          <span className="font-sans">{item.categoria}</span>
                        </div>
                      </TableCell>

                      {/* Motivo / Alerta */}
                      <TableCell className="py-2 px-2.5">
                        {item.motivo === 'AGOTADO' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800 whitespace-nowrap">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Agotado (0 stock)</span>
                          </span>
                        )}
                        {item.motivo === 'STOCK_CRITICO' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Stock bajo alerta</span>
                          </span>
                        )}
                        {item.motivo === 'ALTA_ROTACION' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-soft text-primary border border-primary/25 whitespace-nowrap">
                            <Flame className="h-3 w-3" />
                            <span>Alta rotación</span>
                          </span>
                        )}
                      </TableCell>

                      {/* Stock Actual vs Mínimo */}
                      <TableCell className="text-right py-2 px-2.5 font-mono text-xs tabular-nums">
                        <span
                          className={cn(
                            'font-bold',
                            item.stockActual === 0
                              ? 'text-danger-text'
                              : item.stockActual <= item.stockMinimo
                              ? 'text-warning-text'
                              : 'text-foreground'
                          )}
                        >
                          {item.stockActual}
                        </span>
                        <span className="text-muted-foreground"> / {item.stockMinimo} {item.unidadMedida.toLowerCase()}</span>
                      </TableCell>

                      {/* Ventas Recientes */}
                      <TableCell className="text-right py-2 px-2.5 font-mono text-xs tabular-nums">
                        <span className="font-semibold text-foreground">
                          {item.unidadesVendidas}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">und</span>
                      </TableCell>

                      {/* Cantidad Sugerida (Editable) */}
                      <TableCell className="py-1 px-2 text-center">
                        <div className="flex items-center justify-center">
                          <Input
                            type="number"
                            min="1"
                            value={item.cantidadSugerida}
                            onChange={(e) =>
                              handleCambiarCantidad(item.productoId, Number(e.target.value))
                            }
                            className="h-7 w-20 text-xs font-mono font-bold text-center tabular-nums bg-background border-border"
                          />
                        </div>
                      </TableCell>

                      {/* Costo Unitario */}
                      <TableCell className="text-right py-2 px-2.5 font-mono text-xs tabular-nums text-muted-foreground">
                        {formatCurrency(item.precioCompraUnitario)}
                      </TableCell>

                      {/* Subtotal */}
                      <TableCell className="text-right py-2 px-2.5 font-mono text-xs font-bold tabular-nums text-foreground">
                        {formatCurrency(item.subtotalEstimado)}
                      </TableCell>

                      {/* Proveedor Sugerido */}
                      <TableCell className="py-2 px-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        <span className="font-medium text-foreground">{item.proveedorNombre}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer con Resumen de Selección y Botón Primario */}
        <DialogFooter className="p-3 sm:p-4 border-t border-border bg-muted/20 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground">
              {totalItemsSeleccionados} de {sugerencias.totalProductosSugeridos} seleccionados:
            </span>
            <span className="font-mono font-bold text-primary tabular-nums">
              {totalUnidadesSeleccionadas} unidades
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono font-bold text-foreground tabular-nums">
              Total: {formatCurrency(inversionTotalSeleccionada)}
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleGenerarOrden}
              disabled={totalItemsSeleccionados === 0}
              className="h-9 text-xs bg-primary text-primary-foreground font-semibold hover:bg-primary-hover gap-1.5 shadow-xs"
            >
              <PackageCheck className="h-4 w-4" />
              <span>
                Generar Orden de Compra ({totalItemsSeleccionados} {totalItemsSeleccionados === 1 ? 'ítem' : 'ítems'})
              </span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
