import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StockStatus } from './StockStatus';
import { ItemStockDetalle } from '../types/inventario.types';
import { EmptyState } from './EmptyState';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryTableProps {
  productos: ItemStockDetalle[];
  onVerDetalle: (producto: ItemStockDetalle) => void;
  onResetFilters?: () => void;
  isFiltered?: boolean;
}

/**
 * Tabla principal de existencias de inventario de KIPU'S ERP.
 * Presenta únicamente las columnas esenciales requeridas:
 * Producto, Código, Stock actual, Stock mínimo, Estado y Acción "Ver detalle".
 */
export const InventoryTable: React.FC<InventoryTableProps> = ({
  productos,
  onVerDetalle,
  onResetFilters,
  isFiltered = false,
}) => {
  if (productos.length === 0) {
    return (
      <EmptyState
        title={isFiltered ? 'Sin coincidencias para los filtros aplicados' : 'No hay productos registrados'}
        description={
          isFiltered
            ? 'Intenta cambiar el término de búsqueda, la categoría o el estado seleccionado.'
            : 'Los productos registrados en el catálogo aparecerán automáticamente en esta vista.'
        }
        actionLabel={isFiltered ? 'Limpiar filtros' : undefined}
        onAction={isFiltered ? onResetFilters : undefined}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Vista de Escritorio: Tabla limpia y densa */}
      <div className="hidden md:block overflow-x-auto rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold py-3 px-4 text-foreground">
                Producto
              </TableHead>
              <TableHead className="text-xs font-semibold py-3 px-3 text-foreground w-36">
                Código
              </TableHead>
              <TableHead className="text-xs font-semibold py-3 px-4 text-right text-foreground w-32">
                Stock actual
              </TableHead>
              <TableHead className="text-xs font-semibold py-3 px-4 text-right text-foreground w-32">
                Stock mínimo
              </TableHead>
              <TableHead className="text-xs font-semibold py-3 px-4 text-foreground w-36">
                Estado
              </TableHead>
              <TableHead className="text-xs font-semibold py-3 px-4 text-right text-foreground w-28">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.map((prod) => (
              <TableRow
                key={prod.id}
                className="border-b border-border/70 hover:bg-muted/30 transition-colors h-12"
              >
                {/* Producto */}
                <TableCell className="py-2.5 px-4">
                  <span className="font-medium text-sm text-foreground block leading-tight">
                    {prod.nombre}
                  </span>
                  <span className="text-xs text-muted-foreground">{prod.categoria}</span>
                </TableCell>

                {/* Código */}
                <TableCell className="py-2.5 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {prod.sku}
                </TableCell>

                {/* Stock actual */}
                <TableCell className="py-2.5 px-4 text-right">
                  <span
                    className={cn(
                      'font-semibold font-mono text-sm tabular-nums',
                      (prod.stock ?? 0) <= 0
                        ? 'text-danger-text'
                        : (prod.stock ?? 0) <= (prod.stockMinimo ?? 0)
                        ? 'text-warning-text'
                        : 'text-foreground'
                    )}
                  >
                    {(prod.stock ?? 0).toLocaleString('es-PE')}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1 font-sans">
                    {(prod.unidadMedida || 'unidades').toLowerCase()}
                  </span>
                </TableCell>

                {/* Stock mínimo */}
                <TableCell className="py-2.5 px-4 text-right font-mono text-xs text-muted-foreground tabular-nums">
                  {(prod.stockMinimo ?? 0).toLocaleString('es-PE')} {(prod.unidadMedida || 'unidades').toLowerCase()}
                </TableCell>

                {/* Estado */}
                <TableCell className="py-2.5 px-4 whitespace-nowrap">
                  <StockStatus status={prod.estadoNivel} />
                </TableCell>

                {/* Acciones */}
                <TableCell className="py-2.5 px-4 text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onVerDetalle(prod)}
                    className="h-8 px-2.5 text-xs font-medium gap-1.5 border-border hover:bg-muted"
                  >
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Ver detalle</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Vista Móvil: Tarjetas compactas de alta densidad */}
      <div className="block md:hidden space-y-2.5">
        {productos.map((prod) => (
          <Card key={`m-${prod.id}`} className="border-border bg-card shadow-2xs">
            <CardContent className="p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-sm text-foreground leading-snug">
                    {prod.nombre}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono">{prod.sku}</span>
                    <span>•</span>
                    <span>{prod.categoria}</span>
                  </div>
                </div>
                <StockStatus status={prod.estadoNivel} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 px-2.5 rounded bg-muted/30 border border-border/50">
                <div>
                  <span className="text-muted-foreground block text-xs">Stock actual</span>
                  <span
                    className={cn(
                      'font-semibold font-mono text-sm tabular-nums',
                      (prod.stock ?? 0) <= 0
                        ? 'text-danger-text'
                        : (prod.stock ?? 0) <= (prod.stockMinimo ?? 0)
                        ? 'text-warning-text'
                        : 'text-foreground'
                    )}
                  >
                    {(prod.stock ?? 0).toLocaleString('es-PE')} {(prod.unidadMedida || 'unidades').toLowerCase()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Stock mínimo</span>
                  <span className="font-medium font-mono text-sm text-muted-foreground tabular-nums">
                    {(prod.stockMinimo ?? 0).toLocaleString('es-PE')} {(prod.unidadMedida || 'unidades').toLowerCase()}
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onVerDetalle(prod)}
                  className="w-full text-xs h-8 font-medium gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Ver detalle</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
