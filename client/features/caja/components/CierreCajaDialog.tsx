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
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Cabecera */}
        <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700">
            <LockKeyhole className="h-4 w-4" />
            <span>Finalización de turno operativo</span>
          </div>
          <DialogTitle className="text-xl font-bold pt-1">
            Cierre de turno de caja
          </DialogTitle>
          <DialogDescription className="text-xs">
            {estadoCaja.nombre} • {estadoCaja.sucursal}
          </DialogDescription>
        </DialogHeader>

        {!pasoConfirmacion ? (
          /* PASO 1: Resumen financiero claro (Regla 17) */
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Tarjeta de Resumen Operativo */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">Saldo inicial (Sencillo):</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatCurrency(estadoCaja.saldoInicial)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-emerald-700 font-medium">+ Ventas en efectivo:</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  + {formatCurrency(estadoCaja.ventasEfectivo)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-emerald-700 font-medium">+ Otros ingresos de efectivo:</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  + {formatCurrency(estadoCaja.otrosIngresosEfectivo)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border pb-2">
                <span className="text-rose-600 font-medium">- Egresos y retiros:</span>
                <span className="font-bold text-rose-600 tabular-nums">
                  - {formatCurrency(estadoCaja.egresosEfectivo)}
                </span>
              </div>

              {/* Saldo Esperado */}
              <div className="flex justify-between items-center pt-1 font-bold text-sm">
                <span className="text-foreground">SALDO ESPERADO:</span>
                <span className="text-foreground tabular-nums">
                  {formatCurrency(saldoEsperado)}
                </span>
              </div>
            </div>

            {/* Saldo Contado Input */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-card border border-border">
              <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Efectivo contado final en gaveta</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  (Billetes + monedas)
                </span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  S/
                </span>
                <Input
                  type="number"
                  step="0.1"
                  value={saldoContado}
                  onChange={(e) => setSaldoContado(Number(e.target.value))}
                  className="h-10 pl-9 text-lg font-bold tabular-nums"
                  required
                />
              </div>
            </div>

            {/* Estado de Cuadre / Diferencia */}
            {estaCuadrada ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900 text-xs">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">🟢 Caja cuadrada</span>
                  <span className="text-[11px] text-emerald-700">
                    El efectivo físico coincide exactamente con el saldo esperado (Diferencia S/ 0.00).
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5 text-xs text-amber-950">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <span className="font-bold">
                    ⚠ Diferencia detectada: {formatCurrency(diferencia)}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Puedes cerrar la caja registrando esta diferencia. Selecciona el motivo para el informe de cierre:
                </p>

                <div className="space-y-1">
                  <Select value={motivoDiferencia} onValueChange={setMotivoDiferencia}>
                    <SelectTrigger className="h-8 text-xs bg-white border-amber-200">
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
                  className="h-8 text-xs bg-white border-amber-200"
                />
              </div>
            )}
          </div>
        ) : (
          /* PASO 2: Confirmación Breve (Regla 18 / 19) */
          <div className="p-6 space-y-5 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-foreground">
              <LockKeyhole className="h-7 w-7 text-primary stroke-[2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                ¿Deseas cerrar esta caja?
              </h3>
              <p className="text-xs text-muted-foreground">
                Al confirmar el cierre, el turno actual se dará por terminado y se emitirá el resumen oficial de operaciones.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Responsable:</span>
                <span className="font-semibold text-foreground">{estadoCaja.responsable}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Efectivo entregado / contado:</span>
                <span className="font-bold text-foreground tabular-nums">
                  {formatCurrency(saldoContado)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resultado del arqueo:</span>
                <span
                  className={`font-bold tabular-nums ${
                    estaCuadrada ? 'text-emerald-700' : 'text-amber-700'
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
              >
                Volver
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleProcederPaso}
                className={`font-semibold ${
                  estaCuadrada
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
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
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleEjecutarCierre}
                disabled={isSubmitting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
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
