import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Gasto } from '../types/gastos.types';
import { CATEGORIA_LABELS, METODO_PAGO_LABELS } from '../utils/gastoValidation';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  Receipt,
  Building2,
  Calendar,
  Clock,
  CreditCard,
  User,
  MapPin,
  Ban,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface GastoDetalleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gasto: Gasto | null;
  onAnularGasto?: (id: string, motivo: string) => Promise<void>;
}

export const GastoDetalleModal: React.FC<GastoDetalleModalProps> = ({
  open,
  onOpenChange,
  gasto,
  onAnularGasto,
}) => {
  const [confirmAnulacionOpen, setConfirmAnulacionOpen] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [isAnulando, setIsAnulando] = useState(false);

  if (!gasto) return null;

  const isAnulado = gasto.estado === 'ANULADO';

  const handleConfirmarAnulacion = async () => {
    if (!onAnularGasto) return;
    setIsAnulando(true);
    try {
      await onAnularGasto(gasto.id, motivoAnulacion.trim() || 'Anulado por error de registro');
      setConfirmAnulacionOpen(false);
      setMotivoAnulacion('');
      onOpenChange(false);
    } finally {
      setIsAnulando(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-xl">
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-muted/20 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                      Egreso {gasto.comprobante !== 'Sin comprobante' ? gasto.comprobante : `#${gasto.id}`}
                    </DialogTitle>
                    <StatusBadge
                      status={isAnulado ? 'ANULADO' : 'ACTIVO'}
                      variant={isAnulado ? 'danger' : 'neutral'}
                    />
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(gasto.fecha)}</span>
                    </span>
                    {gasto.hora && (
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="h-3 w-3" />
                        <span>{gasto.hora}</span>
                      </span>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            {/* Banner si el gasto está anulado */}
            {isAnulado && (
              <div className="p-3 rounded-lg border border-danger/30 bg-danger-soft text-danger-text space-y-1">
                <div className="flex items-center gap-2 font-semibold text-xs">
                  <Ban className="h-4 w-4 shrink-0" />
                  <span>Este comprobante de gasto fue anulado</span>
                </div>
                {gasto.motivoAnulacion && (
                  <p className="text-[11px] opacity-90 pl-6">
                    Motivo: {gasto.motivoAnulacion}
                  </p>
                )}
                {gasto.metodoPago === 'EFECTIVO' && (
                  <p className="text-[11px] font-medium pl-6">
                    El monto de {formatCurrency(gasto.monto)} fue reintegrado a la caja registradora.
                  </p>
                )}
              </div>
            )}

            {/* Monto Principal */}
            <div className="p-3.5 rounded-lg border border-border bg-card flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Monto total desembolsado
                </span>
                <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                  {formatCurrency(gasto.monto)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-medium text-muted-foreground block">Medio de pago</span>
                <span className="inline-flex items-center gap-1 font-semibold text-foreground text-xs">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{METODO_PAGO_LABELS[gasto.metodoPago] || gasto.metodoPago}</span>
                </span>
              </div>
            </div>

            {/* Detalle y Concepto */}
            <div className="rounded-lg border border-border bg-card p-3.5 space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  Concepto o descripción
                </span>
                <p className="text-xs font-semibold text-foreground mt-0.5 leading-relaxed">
                  {gasto.descripcion}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    Categoría de egreso
                  </span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-medium bg-muted border border-border/60 text-foreground">
                    {CATEGORIA_LABELS[gasto.categoria] || gasto.categoria}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    N° Comprobante / Recibo
                  </span>
                  <span className="font-mono text-xs font-semibold text-foreground block mt-0.5">
                    {gasto.comprobante}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    Beneficiario / Proveedor
                  </span>
                  <span className="text-xs font-medium text-foreground block mt-0.5 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                    <span>{gasto.beneficiario}</span>
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    Registrado por
                  </span>
                  <span className="text-xs font-medium text-foreground block mt-0.5 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                    <span>{gasto.usuario || 'Administrador'}</span>
                  </span>
                </div>
              </div>

              {(gasto.sucursal || gasto.cajaNombre) && (
                <div className="pt-2 border-t border-border/60 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {gasto.sucursal || 'Sede Central'} · {gasto.cajaNombre || 'Caja Principal'}
                  </span>
                </div>
              )}
            </div>

            {/* Información sobre impacto en caja */}
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-[11px] text-muted-foreground flex items-start gap-2">
              <FileText className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <div>
                {gasto.metodoPago === 'EFECTIVO' ? (
                  <span>
                    Este egreso fue descontado del saldo de la caja registradora en el arqueo del día.
                  </span>
                ) : (
                  <span>
                    Este egreso fue pagado por canal digital/bancario ({METODO_PAGO_LABELS[gasto.metodoPago] || gasto.metodoPago}). No afectó el efectivo de la caja física.
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-3 sm:p-4 border-t border-border bg-muted/20 shrink-0 flex items-center justify-between gap-2">
            {!isAnulado && onAnularGasto ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmAnulacionOpen(true)}
                className="h-8 text-xs text-danger-text border-danger/30 hover:bg-danger-soft gap-1"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Anular egreso</span>
              </Button>
            ) : (
              <div />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación para Anulación */}
      <AlertDialog open={confirmAnulacionOpen} onOpenChange={setConfirmAnulacionOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5 text-danger-text">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle className="text-base font-semibold">
                ¿Anular este comprobante de gasto?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2 pt-1">
              <span>
                Esta acción marcará el egreso como anulado.
                {gasto.metodoPago === 'EFECTIVO' && (
                  <strong className="block text-foreground font-semibold pt-1">
                    Se devolverán {formatCurrency(gasto.monto)} al saldo disponible de la caja registradora.
                  </strong>
                )}
              </span>
              <div className="space-y-1 pt-2">
                <Label htmlFor="motivo-anulacion" className="text-xs font-medium text-foreground">
                  Motivo de anulación (opcional):
                </Label>
                <Input
                  id="motivo-anulacion"
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Ej. Comprobante duplicado, error en monto..."
                  className="h-8 text-xs"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAnulando} className="h-9 text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isAnulando}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmarAnulacion();
              }}
              className="h-9 text-xs bg-danger-text text-white hover:bg-danger-text/90 font-semibold"
            >
              {isAnulando ? 'Anulando…' : 'Confirmar anulación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
