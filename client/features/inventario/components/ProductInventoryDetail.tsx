import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StockStatus } from './StockStatus';
import { ItemStockDetalle, MovimientoStock } from '../types/inventario.types';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { Package, ArrowRight, ArrowDownRight, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductInventoryDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto: ItemStockDetalle | null;
  movimientosProducto: MovimientoStock[];
  onIrAEntradasSalidas: (sku: string, nombre: string) => void;
}

/**
 * Modal de Detalle de Producto en Inventario.
 * Muestra información clave del stock y las últimas entradas y salidas registradas.
 */
export const ProductInventoryDetail: React.FC<ProductInventoryDetailProps> = ({
  open,
  onOpenChange,
  producto,
  movimientosProducto,
  onIrAEntradasSalidas,
}) => {
  if (!producto) return null;

  const ultimosMovimientos = movimientosProducto.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden rounded-lg">
        {/* Cabecera del Producto */}
        <DialogHeader className="p-5 border-b border-border bg-muted/20 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {/* Imagen o Contenedor representativo sobrio */}
              <div className="h-12 w-12 rounded-md border border-border bg-card flex items-center justify-center text-muted-foreground shrink-0 shadow-2xs">
                {producto.imagenUrl ? (
                  <img
                    src={producto.imagenUrl}
                    alt={producto.nombre}
                    className="h-full w-full object-cover rounded-md"
                  />
                ) : (
                  <Package className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              <div>
                <DialogTitle className="text-base font-semibold text-foreground leading-snug">
                  {producto.nombre}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="font-mono">{producto.sku}</span>
                  <span>•</span>
                  <span>{producto.categoria}</span>
                </div>
              </div>
            </div>

            <StockStatus status={producto.estadoNivel} />
          </div>
        </DialogHeader>

        {/* Datos Principales de Stock y Precios */}
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-md bg-muted/30 border border-border">
              <span className="text-xs text-muted-foreground block">Stock actual</span>
              <span
                className={cn(
                  'text-lg font-semibold font-mono tabular-nums block mt-0.5',
                  producto.stock <= 0
                    ? 'text-danger-text'
                    : producto.stock <= producto.stockMinimo
                    ? 'text-warning-text'
                    : 'text-foreground'
                )}
              >
                {producto.stock.toLocaleString('es-PE')}
              </span>
              <span className="text-xs text-muted-foreground">
                {producto.unidadMedida.toLowerCase()}
              </span>
            </div>

            <div className="p-3 rounded-md bg-muted/30 border border-border">
              <span className="text-xs text-muted-foreground block">Stock mínimo</span>
              <span className="text-lg font-semibold font-mono text-foreground tabular-nums block mt-0.5">
                {producto.stockMinimo.toLocaleString('es-PE')}
              </span>
              <span className="text-xs text-muted-foreground">
                {producto.unidadMedida.toLowerCase()}
              </span>
            </div>

            <div className="p-3 rounded-md bg-muted/30 border border-border">
              <span className="text-xs text-muted-foreground block">Precio venta</span>
              <span className="text-lg font-semibold text-foreground tabular-nums block mt-0.5">
                {formatCurrency(producto.precioVenta)}
              </span>
              <span className="text-xs text-muted-foreground">por unidad</span>
            </div>

            <div className="p-3 rounded-md bg-muted/30 border border-border">
              <span className="text-xs text-muted-foreground block">Ubicación / Sede</span>
              <span className="text-sm font-medium text-foreground block mt-0.5 truncate" title={producto.ubicacion}>
                {producto.ubicacion || 'General'}
              </span>
              <span className="text-xs text-muted-foreground truncate block">
                {producto.almacen || 'Almacén Principal'}
              </span>
            </div>
          </div>

          {/* Sección: Últimas entradas y salidas */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Últimas entradas y salidas
              </h4>
              <span className="text-xs text-muted-foreground">
                Mostrando {ultimosMovimientos.length} de {movimientosProducto.length}
              </span>
            </div>

            {ultimosMovimientos.length === 0 ? (
              <div className="p-4 rounded-md border border-dashed border-border text-center text-xs text-muted-foreground">
                Este producto aún no registra entradas ni salidas recientes.
              </div>
            ) : (
              <div className="rounded-md border border-border overflow-hidden">
                <div className="divide-y divide-border/60">
                  {ultimosMovimientos.map((mov) => {
                    const isEntrada = mov.tipo === 'ENTRADA';
                    const isSalida = mov.tipo === 'SALIDA';

                    return (
                      <div
                        key={mov.id}
                        className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isEntrada ? (
                            <ArrowDownRight className="h-4 w-4 text-success-text shrink-0" />
                          ) : isSalida ? (
                            <ArrowUpRight className="h-4 w-4 text-danger-text shrink-0" />
                          ) : (
                            <ArrowLeftRight className="h-4 w-4 text-warning-text shrink-0" />
                          )}
                          <div>
                            <span className="font-medium text-foreground block">
                              {mov.origen || mov.referencia}
                            </span>
                            <span className="text-muted-foreground text-[11px]">
                              {formatDateTime(mov.fecha)} • Por: {mov.usuario}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={cn(
                              'font-semibold font-mono tabular-nums block',
                              isEntrada
                                ? 'text-success-text'
                                : isSalida
                                ? 'text-danger-text'
                                : 'text-warning-text'
                            )}
                          >
                            {isEntrada ? `+${mov.cantidad}` : isSalida ? `-${mov.cantidad}` : mov.cantidad} unid.
                          </span>
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            Saldo: {mov.stockResultante} unid.
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pie con Botón de Navegación "Ver entradas y salidas" */}
        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex flex-row items-center justify-between gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-9 text-muted-foreground hover:text-foreground"
          >
            Cerrar
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onIrAEntradasSalidas(producto.sku, producto.nombre);
            }}
            className="text-xs h-9 font-medium gap-1.5 bg-primary text-primary-foreground"
          >
            <span>Ver entradas y salidas</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
