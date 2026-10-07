import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Venta } from '../types/ventas.types';
import { formatCurrency } from '@/utils/formatters';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  FileText,
  Printer,
  Download,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Building,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface VentaDetalleModalProps {
  venta: Venta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnularVenta?: (id: string, motivo: string) => Promise<void>;
  onIniciarDevolucion?: (venta: Venta) => void;
}

export const VentaDetalleModal: React.FC<VentaDetalleModalProps> = ({
  venta,
  open,
  onOpenChange,
  onAnularVenta,
  onIniciarDevolucion,
}) => {
  const [mostrarAnulacion, setMostrarAnulacion] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [isAnulando, setIsAnulando] = useState(false);

  if (!venta) return null;

  const handleConfirmarAnulacion = async () => {
    if (!motivoAnulacion.trim()) {
      toast.error('Indica el motivo de la anulación');
      return;
    }

    if (!onAnularVenta) return;

    setIsAnulando(true);
    try {
      await onAnularVenta(venta.id, motivoAnulacion.trim());
      toast.success(`Comprobante ${venta.serieCorrelativo} anulado correctamente`);
      setMostrarAnulacion(false);
      onOpenChange(false);
    } catch {
      toast.error('No se pudo anular la venta');
    } finally {
      setIsAnulando(false);
    }
  };

  const handlePrint = () => {
    toast.info(`Imprimiendo copia de ${venta.serieCorrelativo}...`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-border/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  Detalle de Comprobante {venta.serieCorrelativo}
                </DialogTitle>
                <p className="text-xs text-muted-foreground font-mono">
                  {venta.tipoComprobante} Electrónica
                </p>
              </div>
            </div>
            <StatusBadge
              status={venta.estado}
              variant={venta.estado === 'COMPLETADA' ? 'success' : venta.estado === 'PENDIENTE' ? 'warning' : 'danger'}
            />
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Ficha de datos generales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Fecha y Hora</span>
              <span className="font-mono text-foreground font-medium">{venta.fecha}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Cliente</span>
              <span className="font-semibold text-foreground truncate block">{venta.clienteNombre}</span>
              <span className="text-[10px] text-muted-foreground font-mono">Doc: {venta.clienteDocumento}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Medio de Pago</span>
              <span className="font-medium text-foreground">{venta.metodoPago}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground font-medium block">Sucursal / Caja</span>
              <span className="text-foreground truncate block">{venta.sucursal || 'Sede Central'}</span>
              <span className="text-[10px] text-muted-foreground">{venta.caja || 'Caja 01'}</span>
            </div>
          </div>

          {/* Tabla de ítems vendidos */}
          <div className="space-y-1.5">
            <span className="font-semibold text-foreground block">
              Productos despachados ({venta.items.length})
            </span>
            <div className="rounded border border-border overflow-x-auto">
              <Table className="min-w-[420px]">
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b border-border text-[11px]">
                    <TableHead className="py-2 whitespace-nowrap min-w-[140px]">Producto</TableHead>
                    <TableHead className="py-2 text-center w-16 whitespace-nowrap">Cant.</TableHead>
                    <TableHead className="py-2 text-right w-24 whitespace-nowrap">Precio Unit.</TableHead>
                    <TableHead className="py-2 text-right w-24 whitespace-nowrap">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venta.items.map((it, idx) => (
                    <TableRow key={idx} className="border-b border-border/60 hover:bg-muted/20">
                      <TableCell className="py-2 min-w-[140px]">
                        <span className="font-medium text-foreground block">{it.nombre}</span>
                      </TableCell>
                      <TableCell className="py-2 text-center font-mono font-semibold tabular-nums whitespace-nowrap">
                        {it.cantidad}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                        {formatCurrency(it.precioUnitario)}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono font-semibold tabular-nums text-foreground whitespace-nowrap">
                        {formatCurrency(it.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Totales desglosados */}
          <div className="flex flex-col items-end gap-1 p-3 rounded-lg border border-border bg-card">
            <div className="flex justify-between w-56 text-muted-foreground">
              <span>Op. Gravada:</span>
              <span className="font-mono tabular-nums">{formatCurrency(venta.subtotal)}</span>
            </div>
            <div className="flex justify-between w-56 text-muted-foreground">
              <span>IGV (18%):</span>
              <span className="font-mono tabular-nums">{formatCurrency(venta.igv)}</span>
            </div>
            {venta.descuento > 0 && (
              <div className="flex justify-between w-56 text-emerald-700 dark:text-emerald-400 font-medium">
                <span>Descuento aplicado:</span>
                <span className="font-mono tabular-nums">-{formatCurrency(venta.descuento)}</span>
              </div>
            )}
            <div className="flex justify-between w-56 text-sm font-bold text-foreground pt-1.5 border-t border-border/80">
              <span>Total Cobrado:</span>
              <span className="text-primary text-base font-mono tabular-nums">
                {formatCurrency(venta.total)}
              </span>
            </div>
          </div>

          {/* Formulario de anulación con motivo */}
          {mostrarAnulacion && (
            <div className="rounded-lg border border-destructive/40 bg-danger-soft/40 p-3 space-y-2 animate-in fade-in-50 duration-150">
              <div className="flex items-center gap-1.5 text-danger-text font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Confirmar Anulación de Comprobante</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Al anular, los productos retornarán automáticamente al stock en inventario (Kardex) y el dinero se registrará como egreso de caja si se cobró en efectivo.
              </p>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-foreground">
                  Motivo de anulación (requerido para SUNAT y auditoría):
                </Label>
                <Input
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Ej. Error en RUC del cliente, venta duplicada..."
                  className="h-8 text-xs bg-card"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMostrarAnulacion(false)}
                  className="h-7 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isAnulando || !motivoAnulacion.trim()}
                  onClick={handleConfirmarAnulacion}
                  className="h-7 text-xs font-semibold"
                >
                  {isAnulando ? 'Anulando...' : 'Confirmar Anulación'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-border/70">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir</span>
            </Button>

            {onIniciarDevolucion && venta.estado === 'COMPLETADA' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onIniciarDevolucion(venta);
                  onOpenChange(false);
                }}
                className="text-xs gap-1.5 hover:text-primary"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Devolución</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto ml-auto">
            {venta.estado === 'COMPLETADA' && !mostrarAnulacion && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMostrarAnulacion(true)}
                className="text-xs text-danger-text hover:bg-danger-soft"
              >
                Anular venta
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
