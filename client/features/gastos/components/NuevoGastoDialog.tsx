import React, { useState, useRef, useEffect } from 'react';
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
import { FormError } from '@/components/common/FormError';
import { CategoriaGasto, NuevoGastoPayload } from '../types/gastos.types';
import {
  CATEGORIAS_VALIDAS,
  CATEGORIA_LABELS,
  METODO_PAGO_LABELS,
  validarGastoPayload,
} from '../utils/gastoValidation';
import { erpStore } from '@/services/erp/erpStore';
import { formatCurrency } from '@/utils/formatters';
import { Receipt, AlertCircle, Info, Wallet } from 'lucide-react';

interface NuevoGastoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGastoRegistrado: (payload: NuevoGastoPayload) => Promise<void>;
}

export const NuevoGastoDialog: React.FC<NuevoGastoDialogProps> = ({
  open,
  onOpenChange,
  onGastoRegistrado,
}) => {
  const [categoria, setCategoria] = useState<CategoriaGasto>('SERVICIOS_BASICOS');
  const [descripcion, setDescripcion] = useState('');
  const [beneficiario, setBeneficiario] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [monto, setMonto] = useState<string>('50.00');
  const [metodoPago, setMetodoPago] = useState<string>('EFECTIVO');
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const [errorInput, setErrorInput] = useState<string | null>(null);

  // Leer estado de caja para informar saldo disponible en efectivo
  const [saldoCaja, setSaldoCaja] = useState<number>(0);
  const [cajaAbierta, setCajaAbierta] = useState<boolean>(true);

  useEffect(() => {
    if (open) {
      try {
        const estado = erpStore.getEstadoCaja();
        setSaldoCaja(estado.saldoEfectivoEsperado);
        setCajaAbierta(estado.abierta);
      } catch {
        // Fallback en caso de lectura no disponible
      }
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    setErrorInput(null);

    const montoNum = Number(monto);

    try {
      const payloadValidado = validarGastoPayload({
        categoria,
        descripcion,
        beneficiario,
        comprobante,
        monto: montoNum,
        metodoPago,
        fecha,
      });

      // Validar caja si el medio es efectivo
      if (payloadValidado.metodoPago === 'EFECTIVO') {
        if (!cajaAbierta) {
          setErrorInput('No puedes registrar egresos en efectivo con la caja cerrada. Abre la caja primero en el módulo Caja o elige un medio digital (Transferencia / Yape).');
          return;
        }
        if (saldoCaja < payloadValidado.monto) {
          setErrorInput(
            `El saldo disponible en caja en efectivo (${formatCurrency(saldoCaja)}) es menor al monto a desembolsar (${formatCurrency(payloadValidado.monto)}). Reduce el monto o utiliza transferencia bancaria.`
          );
          return;
        }
      }

      submitting.current = true;
      setIsSubmitting(true);

      await onGastoRegistrado(payloadValidado);

      // Limpiar campos solo ante éxito
      onOpenChange(false);
      setDescripcion('');
      setBeneficiario('');
      setComprobante('');
      setMonto('50.00');
      setErrorInput(null);
    } catch (error) {
      setErrorInput(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el gasto. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!submitting.current) onOpenChange(value);
      }}
    >
      <DialogContent className="w-[95vw] sm:max-w-lg max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-muted/20 shrink-0 text-left">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Registrar Egreso o Gasto Operativo
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Registra los costos del negocio. Si es en efectivo, se descuenta de la caja registradora.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          id="gasto-form"
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
        >
          {/* Sección 1: Categoría, Medio de Pago y Fecha */}
          <div className="rounded-lg border border-border bg-card p-3.5 space-y-3">
            <div className="text-xs font-bold text-foreground">Clasificación y Medio de Pago</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="gasto-categoria" className="text-xs font-medium text-foreground">
                  Categoría del egreso
                </Label>
                <Select
                  value={categoria}
                  onValueChange={(val: CategoriaGasto) => {
                    setCategoria(val);
                    if (errorInput) setErrorInput(null);
                  }}
                >
                  <SelectTrigger
                    id="gasto-categoria"
                    className="h-11 md:h-9 text-base md:text-xs border-border bg-background"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {CATEGORIAS_VALIDAS.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {CATEGORIA_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="gasto-pago" className="text-xs font-medium text-foreground">
                  Medio de desembolso
                </Label>
                <Select
                  value={metodoPago}
                  onValueChange={(val) => {
                    setMetodoPago(val);
                    if (errorInput) setErrorInput(null);
                  }}
                >
                  <SelectTrigger
                    id="gasto-pago"
                    className="h-11 md:h-9 text-base md:text-xs border-border bg-background"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EFECTIVO" className="text-xs">
                      Efectivo de caja registradora
                    </SelectItem>
                    <SelectItem value="TRANSFERENCIA" className="text-xs">
                      Transferencia bancaria
                    </SelectItem>
                    <SelectItem value="YAPE" className="text-xs">
                      Yape / Plin
                    </SelectItem>
                    <SelectItem value="TARJETA" className="text-xs">
                      Tarjeta de débito/crédito
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Aviso informativo de saldo de caja si es efectivo */}
            {metodoPago === 'EFECTIVO' && (
              <div
                className={`p-2.5 rounded-md text-[11px] flex items-center justify-between gap-2 border ${
                  !cajaAbierta
                    ? 'bg-danger-soft text-danger-text border-danger/30'
                    : saldoCaja < Number(monto)
                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-muted/40 text-muted-foreground border-border/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {!cajaAbierta
                      ? 'La caja está cerrada actualmente.'
                      : 'Saldo disponible en caja:'}
                  </span>
                </div>
                <span className="font-mono font-bold tabular-nums">
                  {formatCurrency(saldoCaja)}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="gasto-fecha" className="text-xs font-medium text-foreground">
                Fecha del comprobante
              </Label>
              <Input
                id="gasto-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="h-11 md:h-8 text-base md:text-xs font-mono border-border bg-background"
              />
            </div>
          </div>

          {/* Sección 2: Concepto y Comprobante */}
          <div className="rounded-lg border border-border bg-card p-3.5 space-y-3">
            <div className="text-xs font-bold text-foreground">Concepto y Comprobante</div>

            <div className="space-y-1">
              <Label htmlFor="gasto-concepto" className="text-xs font-medium text-foreground">
                Concepto o descripción del egreso <span className="text-danger-text">*</span>
              </Label>
              <Input
                id="gasto-concepto"
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value);
                  if (errorInput) setErrorInput(null);
                }}
                placeholder="Ej. Recibo de luz Electro Oriente - Mes actual"
                required
                className="h-11 md:h-9 text-base md:text-xs border-border bg-background"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="gasto-beneficiario" className="text-xs font-medium text-foreground">
                  Beneficiario / Proveedor <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="gasto-beneficiario"
                  value={beneficiario}
                  onChange={(e) => setBeneficiario(e.target.value)}
                  placeholder="Ej. Electro Oriente, Propietario..."
                  className="h-11 md:h-8 text-base md:text-xs border-border bg-background"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="gasto-comprobante" className="text-xs font-medium text-foreground">
                  N° Comprobante / Recibo <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input
                  id="gasto-comprobante"
                  value={comprobante}
                  onChange={(e) => setComprobante(e.target.value)}
                  placeholder="Ej. F001-002492 o S-882194"
                  className="h-11 md:h-8 text-base md:text-xs font-mono uppercase border-border bg-background"
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Importe a Desembolsar */}
          <div className="rounded-lg border border-border bg-card p-3.5 space-y-2">
            <Label htmlFor="gasto-monto" className="text-xs font-bold text-foreground">
              Monto a desembolsar <span className="text-danger-text">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 md:top-2 text-xs font-mono font-bold text-muted-foreground">
                S/
              </span>
              <Input
                id="gasto-monto"
                type="number"
                step="0.01"
                min="0.10"
                inputMode="decimal"
                value={monto}
                onChange={(e) => {
                  setMonto(e.target.value);
                  if (errorInput) setErrorInput(null);
                }}
                required
                className="pl-9 h-11 md:h-9 text-base md:text-sm font-mono font-bold tabular-nums border-border bg-background text-foreground"
              />
            </div>
          </div>

          {/* Mensaje de error accesible */}
          <FormError message={errorInput} />
        </form>

        <DialogFooter className="p-3 sm:p-4 border-t border-border bg-muted/20 shrink-0 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs h-9 font-medium"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="gasto-form"
            disabled={isSubmitting || !descripcion.trim() || Number(monto) <= 0}
            className="text-xs h-9 font-semibold bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs gap-1.5"
          >
            {isSubmitting ? (
              'Guardando egreso…'
            ) : (
              <span>Registrar gasto ({formatCurrency(Number(monto) || 0)})</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
