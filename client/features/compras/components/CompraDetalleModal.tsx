import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Compra } from '../types/compras.types';
import { formatCurrency, formatDate, formatNumber, pluralizeUnit } from '@/utils/formatters';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  PackageCheck,
  Receipt,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';

interface CompraDetalleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compra: Compra | null;
  onRecepcionar?: (compraId: string) => Promise<void>;
}

const CONDICION_PAGO_LABELS: Record<string, string> = {
  TRANSFERENCIA: 'Transferencia bancaria',
  EFECTIVO: 'Efectivo (caja)',
  CREDITO_30_DIAS: 'Crédito a 30 días',
  TARJETA: 'Tarjeta débito / crédito',
};

export const CompraDetalleModal: React.FC<CompraDetalleModalProps> = ({
  open,
  onOpenChange,
  compra,
  onRecepcionar,
}) => {
  const [recepcionando, setRecepcionando] = useState(false);

  if (!compra) return null;

  const handleRecepcionar = async () => {
    if (!onRecepcionar || recepcionando) return;
    setRecepcionando(true);
    try {
      await onRecepcionar(compra.id);
      toast.success(`Compra ${compra.serieFactura} recepcionada. El stock se actualizó en almacén.`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo recepcionar la compra.');
    } finally {
      setRecepcionando(false);
    }
  };

  const isPendiente = compra.estado === 'PENDIENTE';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-muted/20 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-base sm:text-lg font-bold font-mono text-primary">
                    {compra.serieFactura}
                  </DialogTitle>
                  <StatusBadge
                    status={compra.estado}
                    variant={compra.estado === 'RECIBIDO' ? 'success' : 'warning'}
                  />
                  {compra.origenSugerencia && (
                    <span className="text-[10px] font-semibold bg-primary-soft text-primary px-2 py-0.5 rounded">
                      Generada por sugerencia
                    </span>
                  )}
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Emisión: {formatDate(compra.fecha)}</span>
                  </span>
                  {compra.fechaRecepcion && (
                    <span className="flex items-center gap-1 text-success-text">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Recepción: {formatDate(compra.fechaRecepcion)}</span>
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Banner de estado */}
          {isPendiente ? (
            <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-warning-text shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Mercadería en tránsito (pendiente de recepción)</p>
                  <p className="text-muted-foreground mt-0.5">
                    Los productos aún no han ingresado a tu inventario físico ni al Kardex. Confirma la recepción cuando la mercadería llegue al almacén.
                  </p>
                </div>
              </div>
              {onRecepcionar && (
                <Button
                  size="sm"
                  onClick={handleRecepcionar}
                  disabled={recepcionando}
                  className="h-8 text-xs bg-primary text-primary-foreground font-semibold hover:bg-primary-hover shrink-0 gap-1.5"
                >
                  <PackageCheck className="h-3.5 w-3.5" />
                  <span>{recepcionando ? 'Recepcionando…' : 'Marcar como recibida'}</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-success/30 bg-success-soft p-3 flex items-center gap-2.5 text-success-text">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                Mercadería recibida en almacén e ingresada en el Kardex de existencias.
              </span>
            </div>
          )}

          {/* Datos del Proveedor y Pago */}
          <div className="rounded-lg border border-border bg-card p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span>Proveedor</span>
              </span>
              <p className="font-semibold text-foreground text-xs">{compra.proveedorNombre}</p>
              <p className="text-muted-foreground font-mono text-[11px]">RUC: {compra.proveedorRuc}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Truck className="h-3 w-3" />
                <span>Condición de pago</span>
              </span>
              <p className="font-semibold text-foreground text-xs">
                {CONDICION_PAGO_LABELS[compra.metodoPago] || compra.metodoPago}
              </p>
              <p className="text-muted-foreground text-[11px]">
                {compra.metodoPago === 'EFECTIVO' ? 'Efectivo en caja' : 'Medio bancario / crédito'}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Receipt className="h-3 w-3" />
                <span>Total de la factura</span>
              </span>
              <p className="text-base font-bold font-mono text-primary tabular-nums">
                {formatCurrency(compra.total)}
              </p>
              <p className="text-muted-foreground text-[11px] font-mono tabular-nums">
                {formatNumber(compra.itemsCount)} {pluralizeUnit(compra.itemsCount, 'unidad')} en total
              </p>
            </div>
          </div>

          {/* Observaciones si existen */}
          {compra.observaciones && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-1">
              <span className="text-[11px] font-semibold text-foreground">Observaciones / Notas</span>
              <p className="text-muted-foreground">{compra.observaciones}</p>
            </div>
          )}

          {/* Detalle de Productos */}
          <div className="rounded-lg border border-border bg-card p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">
                Detalle de productos ({compra.items?.length || 0})
              </span>
              <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                {compra.itemsCount} {pluralizeUnit(compra.itemsCount, 'unidad')}
              </span>
            </div>

            {compra.items && compra.items.length > 0 ? (
              <div className="border border-border/70 rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-border">
                      <TableHead className="text-xs font-semibold py-2 px-2.5">Producto</TableHead>
                      <TableHead className="text-xs font-semibold py-2 px-2.5 text-center w-28">
                        Cantidad
                      </TableHead>
                      <TableHead className="text-xs font-semibold py-2 px-2.5 text-right w-28">
                        Costo Unit.
                      </TableHead>
                      <TableHead className="text-xs font-semibold py-2 px-2.5 text-right w-28">
                        Subtotal
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compra.items.map((item, index) => (
                      <TableRow key={`${item.productoId}-${index}`} className="border-border/60">
                        <TableCell className="py-2 px-2.5">
                          <p className="font-medium text-foreground text-xs">{item.nombre}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{item.sku}</p>
                        </TableCell>
                        <TableCell className="text-center py-2 px-2.5 font-mono tabular-nums text-foreground">
                          {formatNumber(item.cantidad)}
                        </TableCell>
                        <TableCell className="text-right py-2 px-2.5 font-mono tabular-nums text-foreground">
                          {formatCurrency(item.precioUnitario)}
                        </TableCell>
                        <TableCell className="text-right py-2 px-2.5 font-mono font-semibold tabular-nums text-foreground">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground italic py-3 text-center">
                Sin detalle de ítems registrado para este comprobante.
              </p>
            )}

            {/* Totalizador */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="font-medium text-foreground">Total comprobante:</span>
              <span className="text-sm font-bold font-mono text-foreground tabular-nums">
                {formatCurrency(compra.total)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-3 sm:p-4 border-t border-border bg-muted/20 shrink-0 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 text-xs"
          >
            Cerrar
          </Button>

          {isPendiente && onRecepcionar && (
            <Button
              onClick={handleRecepcionar}
              disabled={recepcionando}
              className="h-9 text-xs bg-primary text-primary-foreground font-semibold hover:bg-primary-hover gap-1.5 shadow-xs"
            >
              <PackageCheck className="h-4 w-4" />
              <span>{recepcionando ? 'Recepcionando…' : 'Recepcionar mercadería en almacén'}</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
