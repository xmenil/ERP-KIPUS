import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from './EmptyState';
import { AjusteInventario } from '../types/inventario.types';
import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface AdjustmentTableProps {
  ajustes: AjusteInventario[];
  onNuevoAjuste: () => void;
}

/**
 * Tabla del historial de ajustes de inventario realizados.
 * Muestra Producto, Stock actual (o previo), Nuevo stock, Diferencia, Motivo, Fecha y Usuario.
 */
export const AdjustmentTable: React.FC<AdjustmentTableProps> = ({
  ajustes,
  onNuevoAjuste,
}) => {
  if (ajustes.length === 0) {
    return (
      <EmptyState
        title="No hay ajustes de inventario registrados"
        description="Los ajustes se utilizan exclusivamente cuando sea necesario corregir diferencias entre el stock registrado y el stock real."
        actionLabel="+ Realizar primer ajuste"
        onAction={onNuevoAjuste}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Vista Escritorio: Tabla */}
      <div className="hidden md:block overflow-x-auto rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold py-3 px-4 text-foreground w-40">
                Fecha
              </TableHead>
              <TableHead className="text-xs font-semibold py-3 px-4 text-foreground">
                Producto
              </TableHead>
              <TableHead className="text-xs font-semibold py-3 px-3 text-right text-foreground w-28">
                Stock anterior
              </TableHead>
              <TableHead className="text-xs font-semibold py-3 px-3 text-right text-foreground w-28">
                Nuevo stock
              </TableHead>
              <TableHead className="text-xs font-semibold py-3 px-3 text-right text-foreground w-28">
                Diferencia
              </TableHead>
              <TableHead className="text-xs font-semibold py-3 px-4 text-foreground w-52">
                Motivo
              </TableHead>
              <TableHead className="text-xs font-semibold py-3 px-4 text-foreground w-36">
                Usuario
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ajustes.map((aj) => {
              const esPositivo = aj.diferencia > 0;
              const esNegativo = aj.diferencia < 0;

              return (
                <TableRow
                  key={aj.id}
                  className="border-b border-border/70 hover:bg-muted/30 transition-colors h-12"
                >
                  {/* Fecha */}
                  <TableCell className="py-2.5 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(aj.fecha)}
                  </TableCell>

                  {/* Producto */}
                  <TableCell className="py-2.5 px-4">
                    <span className="font-medium text-sm text-foreground block leading-tight">
                      {aj.productoNombre}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{aj.sku}</span>
                  </TableCell>

                  {/* Stock anterior */}
                  <TableCell className="py-2.5 px-3 text-right font-mono text-xs text-muted-foreground tabular-nums">
                    {aj.stockAnterior.toLocaleString('es-PE')}
                  </TableCell>

                  {/* Nuevo stock */}
                  <TableCell className="py-2.5 px-3 text-right font-mono text-sm font-semibold text-foreground tabular-nums">
                    {aj.nuevoStock.toLocaleString('es-PE')}
                  </TableCell>

                  {/* Diferencia */}
                  <TableCell className="py-2.5 px-3 text-right">
                    <span
                      className={cn(
                        'font-mono text-xs font-semibold px-2 py-0.5 rounded tabular-nums inline-block',
                        esPositivo && 'text-success-text bg-success-soft border border-success/20',
                        esNegativo && 'text-danger-text bg-danger-soft border border-destructive/20',
                        !esPositivo && !esNegativo && 'text-muted-foreground bg-muted'
                      )}
                    >
                      {esPositivo ? `+${aj.diferencia}` : aj.diferencia}
                    </span>
                  </TableCell>

                  {/* Motivo */}
                  <TableCell className="py-2.5 px-4 text-xs">
                    <span className="font-medium text-foreground block">{aj.motivo}</span>
                    {aj.observacion && (
                      <span className="text-xs text-muted-foreground block truncate max-w-xs">
                        {aj.observacion}
                      </span>
                    )}
                  </TableCell>

                  {/* Usuario */}
                  <TableCell className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                    {aj.usuario}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Vista Móvil: Tarjetas compactas */}
      <div className="block md:hidden space-y-2.5">
        {ajustes.map((aj) => {
          const esPositivo = aj.diferencia > 0;
          const esNegativo = aj.diferencia < 0;

          return (
            <Card key={`m-aj-${aj.id}`} className="border-border bg-card shadow-2xs">
              <CardContent className="p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm text-foreground leading-snug">
                      {aj.productoNombre}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono">{aj.sku}</p>
                  </div>
                  <span
                    className={cn(
                      'font-mono text-xs font-semibold px-2 py-0.5 rounded tabular-nums inline-block shrink-0',
                      esPositivo && 'text-success-text bg-success-soft border border-success/20',
                      esNegativo && 'text-danger-text bg-danger-soft border border-destructive/20',
                      !esPositivo && !esNegativo && 'text-muted-foreground bg-muted'
                    )}
                  >
                    {esPositivo ? `+${aj.diferencia}` : aj.diferencia}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 px-2.5 rounded bg-muted/30 border border-border/50">
                  <div>
                    <span className="text-muted-foreground block text-xs">Stock anterior</span>
                    <span className="font-mono text-sm text-muted-foreground tabular-nums">
                      {aj.stockAnterior.toLocaleString('es-PE')}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Nuevo stock</span>
                    <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                      {aj.nuevoStock.toLocaleString('es-PE')}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{aj.motivo}</span>
                    <span className="font-mono text-[11px]">{formatDateTime(aj.fecha)}</span>
                  </div>
                  {aj.observacion && <p className="text-[11px] truncate">{aj.observacion}</p>}
                  <p className="text-[11px]">Por: {aj.usuario}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
