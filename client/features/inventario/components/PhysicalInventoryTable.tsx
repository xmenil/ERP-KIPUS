import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchBar } from './SearchBar';
import { ConfirmationDialog } from './ConfirmationDialog';
import { EmptyState } from './EmptyState';
import { ItemStockDetalle, AlmacenResumen } from '../types/inventario.types';
import { Check, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PhysicalInventoryTableProps {
  productos: ItemStockDetalle[];
  almacenes: AlmacenResumen[];
  onAplicarAjustes: (
    ajustes: { productoId: string; stockFisico: number; motivo?: string }[]
  ) => Promise<void>;
}

/**
 * Pantalla sencilla para conteos e inventario físico.
 * Permite registrar la cantidad física real y calcula en tiempo real la discrepancia.
 */
export const PhysicalInventoryTable: React.FC<PhysicalInventoryTableProps> = ({
  productos,
  almacenes,
  onAplicarAjustes,
}) => {
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState<string>(
    almacenes[0]?.nombre || 'Almacén Principal (Sede Central)'
  );
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState<string>('');

  // Diccionario de valores ingresados: { [productoId]: string }
  const [valoresFisicos, setValoresFisicos] = useState<Record<string, string>>({});

  // Diálogo de confirmación
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);
  const [aplicando, setAplicando] = useState<boolean>(false);

  // Lista de categorías únicas
  const categorias = useMemo(() => {
    return Array.from(new Set(productos.map((p) => p.categoria))).filter(Boolean);
  }, [productos]);

  // Manejo de cambio en el input de stock físico
  const handleStockFisicoChange = (id: string, valor: string) => {
    setValoresFisicos((prev) => ({
      ...prev,
      [id]: valor,
    }));
  };

  // Restablecer conteos ingresados
  const handleResetConteo = () => {
    setValoresFisicos({});
    toast.info('Se han limpiado los valores del conteo físico actual.');
  };

  // Filtrado de productos
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchBusqueda =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.sku.toLowerCase().includes(busqueda.toLowerCase());
      const matchCat =
        categoriaSeleccionada === 'TODAS' || p.categoria === categoriaSeleccionada;
      return matchBusqueda && matchCat;
    });
  }, [productos, busqueda, categoriaSeleccionada]);

  // Resumen del conteo
  const { revisados, sinDiferencia, conDiferencia, itemsConDiferencia } = useMemo(() => {
    let revisadosCount = 0;
    let sinDifCount = 0;
    let conDifCount = 0;
    const conDifList: {
      productoId: string;
      productoNombre: string;
      sku: string;
      stockSistema: number;
      stockFisico: number;
      diferencia: number;
    }[] = [];

    productosFiltrados.forEach((p) => {
      const valorStr = valoresFisicos[p.id];
      if (valorStr !== undefined && valorStr !== '') {
        const fisicoNum = Number(valorStr);
        if (!isNaN(fisicoNum) && fisicoNum >= 0) {
          revisadosCount++;
          const dif = fisicoNum - p.stock;
          if (dif === 0) {
            sinDifCount++;
          } else {
            conDifCount++;
            conDifList.push({
              productoId: p.id,
              productoNombre: p.nombre,
              sku: p.sku,
              stockSistema: p.stock,
              stockFisico: fisicoNum,
              diferencia: dif,
            });
          }
        }
      }
    });

    return {
      revisados: revisadosCount,
      sinDiferencia: sinDifCount,
      conDiferencia: conDifCount,
      itemsConDiferencia: conDifList,
    };
  }, [productosFiltrados, valoresFisicos]);

  const handleConfirmarAplicar = async () => {
    if (itemsConDiferencia.length === 0) return;
    setAplicando(true);
    try {
      await onAplicarAjustes(
        itemsConDiferencia.map((it) => ({
          productoId: it.productoId,
          stockFisico: it.stockFisico,
          motivo: 'Inventario físico',
        }))
      );

      toast.success(
        `Ajustes aplicados correctamente. Se corrigió el stock de ${itemsConDiferencia.length} ${
          itemsConDiferencia.length === 1 ? 'producto' : 'productos'
        }.`
      );

      setOpenConfirm(false);
      setValoresFisicos({});
    } catch {
      toast.error('No se pudieron aplicar los ajustes. Inténtalo nuevamente.');
    } finally {
      setAplicando(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controles de Selección: Almacén, Categoría y Búsqueda */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Selector de Almacén */}
            <div className="w-full sm:w-56 shrink-0">
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Almacén a inventariar
              </label>
              <Select value={almacenSeleccionado} onValueChange={setAlmacenSeleccionado}>
                <SelectTrigger className="h-9 text-xs border-border bg-card">
                  <SelectValue placeholder="Selecciona almacén" />
                </SelectTrigger>
                <SelectContent>
                  {almacenes.map((alm) => (
                    <SelectItem key={alm.id} value={alm.nombre} className="text-xs">
                      {alm.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Categoría (opcional) */}
            <div className="w-full sm:w-48 shrink-0">
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Categoría (opcional)
              </label>
              <Select value={categoriaSeleccionada} onValueChange={setCategoriaSeleccionada}>
                <SelectTrigger className="h-9 text-xs border-border bg-card">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS" className="text-xs">
                    Todas las categorías
                  </SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Buscador dentro del conteo */}
            <div className="flex-1">
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Buscar en la lista
              </label>
              <SearchBar
                value={busqueda}
                onChange={setBusqueda}
                placeholder="Buscar producto por nombre o SKU…"
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Conteo Físico */}
      {productosFiltrados.length === 0 ? (
        <EmptyState
          title="No hay productos en esta selección"
          description="Selecciona otra categoría o almacén para comenzar el conteo."
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 border-b border-border hover:bg-transparent">
                  <TableHead className="text-xs font-semibold py-3 px-4 text-foreground">
                    Producto
                  </TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-4 text-right text-foreground w-40">
                    Stock del sistema
                  </TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-4 text-center text-foreground w-44">
                    Stock físico (real)
                  </TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-4 text-right text-foreground w-36">
                    Diferencia
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosFiltrados.map((prod) => {
                  const valorStr = valoresFisicos[prod.id];
                  const hasInput = valorStr !== undefined && valorStr !== '';
                  const fisicoNum = hasInput ? Number(valorStr) : null;
                  const diferencia =
                    fisicoNum !== null && !isNaN(fisicoNum) ? fisicoNum - prod.stock : null;

                  return (
                    <TableRow
                      key={prod.id}
                      className={cn(
                        'border-b border-border/70 hover:bg-muted/30 transition-colors h-14',
                        hasInput && diferencia !== 0 && 'bg-warning-soft/20'
                      )}
                    >
                      {/* Producto */}
                      <TableCell className="py-2.5 px-4">
                        <span className="font-medium text-sm text-foreground block leading-tight">
                          {prod.nombre}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span className="font-mono">{prod.sku}</span>
                          <span>•</span>
                          <span>{prod.categoria}</span>
                        </div>
                      </TableCell>

                      {/* Stock del sistema */}
                      <TableCell className="py-2.5 px-4 text-right font-mono font-semibold text-sm text-foreground tabular-nums">
                        {(prod.stock ?? 0).toLocaleString('es-PE')}{' '}
                        <span className="text-xs font-sans font-normal text-muted-foreground">
                          {(prod.unidadMedida || 'unidades').toLowerCase()}
                        </span>
                      </TableCell>

                      {/* Input Stock físico */}
                      <TableCell className="py-2.5 px-4">
                        <div className="flex items-center justify-center">
                          <div className="relative w-32">
                            <Input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              placeholder="Cantidad..."
                              value={valorStr ?? ''}
                              onChange={(e) => handleStockFisicoChange(prod.id, e.target.value)}
                              className="h-9 text-center font-mono font-semibold text-sm border-border bg-card focus-visible:ring-1 focus-visible:ring-primary"
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Diferencia calculada automáticamente */}
                      <TableCell className="py-2.5 px-4 text-right">
                        {diferencia === null ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : diferencia === 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-muted-foreground px-2 py-0.5 rounded bg-muted">
                            <Check className="h-3 w-3 text-success-text" />
                            0 (Coincide)
                          </span>
                        ) : (
                          <span
                            className={cn(
                              'font-mono text-xs font-semibold px-2 py-0.5 rounded tabular-nums inline-block',
                              diferencia < 0
                                ? 'text-danger-text bg-danger-soft border border-destructive/20'
                                : 'text-success-text bg-success-soft border border-success/20'
                            )}
                          >
                            {diferencia > 0 ? `+${diferencia}` : diferencia} unid.
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Barra Resumen Persistente al Pie */}
          <Card className="border-border bg-card shadow-xs">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="grid grid-cols-3 gap-4 w-full sm:w-auto text-center sm:text-left">
                {/* Productos revisados */}
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground block">Productos revisados</span>
                  <span className="text-lg font-semibold font-mono text-foreground tabular-nums">
                    {revisados} <span className="text-xs font-sans text-muted-foreground">de {productosFiltrados.length}</span>
                  </span>
                </div>

                {/* Productos sin diferencia */}
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground block">Sin diferencia</span>
                  <span className="text-lg font-semibold font-mono text-success-text tabular-nums">
                    {sinDiferencia}
                  </span>
                </div>

                {/* Productos con diferencia */}
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground block">Con diferencia</span>
                  <span className="text-lg font-semibold font-mono text-danger-text tabular-nums">
                    {conDiferencia}
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {revisados > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetConteo}
                    className="text-xs h-9 text-muted-foreground hover:text-foreground font-normal"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Limpiar conteo
                  </Button>
                )}

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={conDiferencia === 0}
                  onClick={() => setOpenConfirm(true)}
                  className="text-xs h-9 font-semibold bg-primary text-primary-foreground gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Aplicar ajustes ({conDiferencia})</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diálogo de Confirmación antes de aplicar cambios */}
      <ConfirmationDialog
        open={openConfirm}
        onOpenChange={setOpenConfirm}
        title="¿Confirmar y aplicar ajustes de inventario físico?"
        description="Se actualizará el stock en el sistema de los siguientes productos detectados con diferencias:"
        confirmLabel="Aplicar ajustes en el stock"
        cancelLabel="Revisar de nuevo"
        loading={aplicando}
        onConfirm={handleConfirmarAplicar}
      >
        <div className="max-h-60 overflow-y-auto rounded-md border border-border divide-y divide-border/60 text-xs">
          {itemsConDiferencia.map((it) => (
            <div key={it.productoId} className="p-2.5 px-3 flex items-center justify-between">
              <div>
                <span className="font-medium text-foreground block">{it.productoNombre}</span>
                <span className="text-muted-foreground text-[11px] font-mono">{it.sku}</span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground text-[11px] block">
                  Sistema: {it.stockSistema} → Físico: {it.stockFisico}
                </span>
                <span
                  className={cn(
                    'font-mono font-semibold tabular-nums text-xs',
                    it.diferencia < 0 ? 'text-danger-text' : 'text-success-text'
                  )}
                >
                  {it.diferencia > 0 ? `+${it.diferencia}` : it.diferencia} unid.
                </span>
              </div>
            </div>
          ))}
        </div>
      </ConfirmationDialog>
    </div>
  );
};
