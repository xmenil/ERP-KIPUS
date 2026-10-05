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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EstadoCaja, CierreCajaPayload, ArqueoConteo } from '../types/caja.types';
import { formatCurrency } from '@/utils/formatters';
import {
  LockKeyhole,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calculator,
  Store,
  User,
  Clock,
} from 'lucide-react';

interface CierreCajaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estadoCaja: EstadoCaja;
  arqueoPrevio?: ArqueoConteo | null;
  onCierreConfirmado: (payload: CierreCajaPayload) => Promise<void>;
}

const MOTIVOS_CIERRE_DIFERENCIA = [
  'Diferencia en vuelto a clientes durante el día',
  'Redondeo de céntimos en operaciones en efectivo',
  'Egreso menor de emergencia pendiente de comprobante',
  'Ajuste aprobado por administración',
  'Otro motivo registrado en observaciones',
];

export const CierreCajaDialog: React.FC<CierreCajaDialogProps> = ({
  open,
  onOpenChange,
  estadoCaja,
  arqueoPrevio,
  onCierreConfirmado,
}) => {
  const saldoEsperado = estadoCaja.saldoEfectivoEsperado;

  // Si hubo un arqueo previo usamos ese conteo, sino por defecto el saldo esperado
  const [saldoContado, setSaldoContado] = useState<number>(
    arqueoPrevio ? arqueoPrevio.efectivoContado : saldoEsperado
  );
  const [motivoDiferencia, setMotivoDiferencia] = useState(
    arqueoPrevio?.motivoDiferencia || MOTIVOS_CIERRE_DIFERENCIA[0]
  );
  const [observaciones, setObservaciones] = useState(
    arqueoPrevio?.observaciones || ''
  );
  const [pasoConfirmacion, setPasoConfirmacion] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Diferencia calculada en tiempo real
  const diferencia = +(Number(saldoContado || 0) - saldoEsperado).toFixed(2);
  const estaCuadrada = Math.abs(diferencia) < 0.05;

  const handleProcederPaso = () => {
    setPasoConfirmacion(true);
  };

  const handleEjecutarCierre = async () => {
    setIsSubmitting(true);
    try {
      await onCierreConfirmado({
        saldoContado: Number(saldoContado),
        diferencia,
        motivoDiferencia: estaCuadrada ? undefined : motivoDiferencia,
        observaciones: observaciones.trim() || undefined,
        desglose: arqueoPrevio?.desglose,
      });
      setPasoConfirmacion(false);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md p-0 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabecera */}
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium text-danger-text">
            <LockKeyhole className="h-3.5 w-3.5" />
            <span>Finalización de turno operativo</span>
          </div>
          <DialogTitle className="text-lg font-semibold pt-1">
            Cierre de turno de caja
          </DialogTitle>
          <DialogDescription className="text-xs">
            {estadoCaja.nombre} • {estadoCaja.sucursal}
          </DialogDescription>
        </DialogHeader>

        {!pasoConfirmacion ? (
          /* PASO 1: Resumen financiero claro (Regla 17) */
          <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
            {/* Tarjeta de Resumen Operativo */}
            <div className="p-4 rounded-md bg-muted/40 border border-border space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Saldo inicial (Sencillo):</span>
                <span className="font-medium text-foreground tabular-nums">
                  {formatCurrency(estadoCaja.saldoInicial)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-success-text font-medium">+ Ventas en efectivo:</span>
                <span className="font-semibold text-success-text tabular-nums">
                  + {formatCurrency(estadoCaja.ventasEfectivo)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-success-text font-medium">+ Otros ingresos de efectivo:</span>
                <span className="font-semibold text-success-text tabular-nums">
                  + {formatCurrency(estadoCaja.otrosIngresosEfectivo)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border pb-2">
                <span className="text-danger-text font-medium">- Egresos y retiros:</span>
                <span className="font-semibold text-danger-text tabular-nums">
                  - {formatCurrency(estadoCaja.egresosEfectivo)}
                </span>
              </div>

              {/* Saldo Esperado */}
              <div className="flex justify-between items-center pt-1 font-semibold text-xs">
                <span className="text-foreground">Saldo esperado:</span>
                <span className="text-foreground tabular-nums">
                  {formatCurrency(saldoEsperado)}
                </span>
              </div>
            </div>

            {/* Saldo Contado Input */}
            <div className="space-y-1.5 p-3.5 rounded-md bg-card border border-border">
              <Label className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>Efectivo contado final en gaveta</span>
                <span className="text-xs font-normal text-muted-foreground">
                  (Billetes + monedas)
                </span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                  S/
                </span>
                <Input
                  type="number"
                  step="0.1"
                  value={saldoContado}
                  onChange={(e) => setSaldoContado(Number(e.target.value))}
                  className="h-9 pl-8 text-base font-semibold tabular-nums"
                  required
                />
              </div>
            </div>

            {/* Estado de Cuadre / Diferencia */}
            {estaCuadrada ? (
              <div className="p-3.5 rounded-md bg-success-soft border border-success/30 flex items-center gap-3 text-success-text text-xs">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                <div>
                  <span className="font-medium block">Caja cuadrada</span>
                  <span className="text-xs text-success-text">
                    El efectivo físico coincide exactamente con el saldo esperado (Diferencia S/ 0.00).
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-md bg-warning-soft border border-warning/30 space-y-2.5 text-xs text-warning-text">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                  <span className="font-medium">
                    Diferencia detectada: {formatCurrency(diferencia)}
                  </span>
                </div>
                <p className="text-xs text-warning-text">
                  Puedes cerrar la caja registrando esta diferencia. Selecciona el motivo para el informe de cierre:
                </p>

                <div className="space-y-1">
                  <Select value={motivoDiferencia} onValueChange={setMotivoDiferencia}>
                    <SelectTrigger className="h-8 text-xs bg-card border-warning/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOTIVOS_CIERRE_DIFERENCIA.map((mot) => (
                        <SelectItem key={mot} value={mot}>
                          {mot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalle u observación opcional"
                  className="h-8 text-xs bg-card border-warning/30"
                />
              </div>
            )}
          </div>
        ) : (
          /* PASO 2: Confirmación Breve (Regla 18 / 19) */
          <div className="p-6 space-y-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-lg bg-muted/60 border border-border flex items-center justify-center text-foreground">
              <LockKeyhole className="h-6 w-6 text-primary stroke-[2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                ¿Deseas cerrar esta caja?
              </h3>
              <p className="text-xs text-muted-foreground">
                Al confirmar el cierre, el turno actual se dará por terminado y se emitirá el resumen oficial de operaciones.
              </p>
            </div>

            <div className="p-3.5 rounded-md bg-muted/30 border border-border/80 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Responsable:</span>
                <span className="font-medium text-foreground">{estadoCaja.responsable}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Efectivo entregado / contado:</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(saldoContado)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resultado del arqueo:</span>
                <span
                  className={`font-semibold tabular-nums ${
                    estaCuadrada ? 'text-success-text' : 'text-warning-text'
                  }`}
                >
                  {estaCuadrada ? 'Cuadrada (S/ 0.00)' : `Diferencia de ${formatCurrency(diferencia)}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer con botones */}
        <DialogFooter className="p-4 border-t border-border/60 bg-muted/10 gap-2 sm:gap-0">
          {!pasoConfirmacion ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs font-medium"
              >
                Volver
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleProcederPaso}
                className="h-9 text-xs font-medium"
              >
                {estaCuadrada ? 'Cerrar caja' : 'Registrar diferencia y cerrar'}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPasoConfirmacion(false)}
                disabled={isSubmitting}
                className="h-9 text-xs font-medium"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleEjecutarCierre}
                disabled={isSubmitting}
                className="h-9 text-xs font-medium"
              >
                {isSubmitting ? 'Cerrando turno...' : 'Confirmar cierre definitivo'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
