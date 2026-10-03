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
import { MetodoPago, TipoComprobante, PagoMixtoDesglose } from '../types/ventas.types';
import { formatCurrency } from '@/utils/formatters';
import {
  Banknote,
  Smartphone,
  CreditCard,
  Building,
  Coins,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface CobroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  tipoComprobante: TipoComprobante;
  onTipoComprobanteChange: (tipo: TipoComprobante) => void;
  clienteNombre: string;
  clienteDocumento: string;
  onConfirmarCobro: (datos: {
    metodoPago: MetodoPago;
    montoRecibido: number;
    vuelto: number;
    desglosePagoMixto?: PagoMixtoDesglose;
  }) => Promise<void>;
}

export const CobroModal: React.FC<CobroModalProps> = ({
  open,
  onOpenChange,
  total,
  tipoComprobante,
  onTipoComprobanteChange,
  clienteNombre,
  clienteDocumento,
  onConfirmarCobro,
}) => {
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState<number>(total);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pago Mixto
  const [pagoEfectivoMixto, setPagoEfectivoMixto] = useState<number>(Math.floor(total / 2));
  const [pagoDigitalMixto, setPagoDigitalMixto] = useState<number>(Math.ceil(total / 2));

  // Billetes peruanos sugeridos
  const billetesSugeridos = [10, 20, 50, 100, 200].filter((b) => b >= total);

  // Vuelto calculado
  const vuelto = metodoPago === 'EFECTIVO' ? Math.max(0, +(montoRecibido - total).toFixed(2)) : 0;

  const handleSetMontoExacto = () => {
    setMontoRecibido(total);
  };

  const handleSelectBillete = (monto: number) => {
    setMontoRecibido(monto);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (metodoPago === 'EFECTIVO' && montoRecibido < total) {
      toast.error(`El monto recibido (S/ ${montoRecibido}) es menor al total a cobrar (S/ ${total})`);
      return;
    }

    if (metodoPago === 'MIXTO') {
      const sumaMixta = Number(pagoEfectivoMixto) + Number(pagoDigitalMixto);
      if (Math.abs(sumaMixta - total) > 0.05) {
        toast.error(`La suma del pago mixto (S/ ${sumaMixta.toFixed(2)}) debe coincidir con el total (S/ ${total.toFixed(2)})`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onConfirmarCobro({
        metodoPago,
        montoRecibido: metodoPago === 'EFECTIVO' ? Number(montoRecibido) : total,
        vuelto,
        desglosePagoMixto:
          metodoPago === 'MIXTO'
            ? { efectivo: Number(pagoEfectivoMixto), yape: Number(pagoDigitalMixto) }
            : undefined,
      });
      onOpenChange(false);
    } catch {
      toast.error('Ocurrió un error al procesar el cobro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const metodosConfig = [
    { id: 'EFECTIVO', nombre: 'Efectivo', icon: Banknote, desc: 'Billetes y monedas' },
    { id: 'YAPE', nombre: 'Yape', icon: Smartphone, desc: 'Billetera digital BCP' },
    { id: 'PLIN', nombre: 'Plin', icon: Smartphone, desc: 'Billetera BBVA/Interbank' },
    { id: 'TARJETA', nombre: 'Tarjeta', icon: CreditCard, desc: 'Débito o Crédito (POS)' },
    { id: 'TRANSFERENCIA', nombre: 'Transferencia', icon: Building, desc: 'Depósito a cuenta' },
    { id: 'MIXTO', nombre: 'Pago Mixto', icon: Coins, desc: 'Efectivo + Digital' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-2 border-b border-border/70">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-foreground">
              ¿Cómo desea pagar el cliente?
            </DialogTitle>
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground block">Total a Cobrar</span>
              <span className="text-xl font-bold font-mono tabular-nums text-primary">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Cliente: <span className="font-semibold text-foreground">{clienteNombre}</span> ({clienteDocumento})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Tipo de Comprobante SUNAT */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Tipo de Comprobante a emitir</Label>
            <Select
              value={tipoComprobante}
              onValueChange={(val: TipoComprobante) => onTipoComprobanteChange(val)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOLETA" className="text-xs">
                  Boleta de Venta Electrónica (Consumidor Final)
                </SelectItem>
                <SelectItem value="FACTURA" className="text-xs">
                  Factura Electrónica con RUC (Crédito Fiscal)
                </SelectItem>
                <SelectItem value="NOTA_VENTA" className="text-xs">
                  Nota de Venta Rápida de Mostrador
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selector visual de Métodos de Pago */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Seleccionar medio de pago</Label>
            <div className="grid grid-cols-3 gap-2">
              {metodosConfig.map((m) => {
                const Icon = m.icon;
                const isSelected = metodoPago === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMetodoPago(m.id as MetodoPago);
                      if (m.id === 'EFECTIVO') setMontoRecibido(total);
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-md border text-center transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'border-primary bg-primary-soft text-primary font-semibold ring-1 ring-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5 mb-1 shrink-0" />
                    <span className="text-xs leading-none">{m.nombre}</span>
                    <span className="text-[10px] opacity-80 mt-0.5 leading-tight truncate">
                      {m.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formulario específico según el método */}
          {metodoPago === 'EFECTIVO' && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3 animate-in fade-in-50 duration-150">
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Monto recibido (S/)</Label>
                  <Input
                    type="number"
                    step="0.10"
                    min={total}
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(Number(e.target.value))}
                    className="h-10 text-base font-bold font-mono text-center tabular-nums bg-card"
                    required
                  />
                </div>

                <div className="rounded border border-border/80 bg-card p-2 text-right">
                  <span className="text-[10px] text-muted-foreground font-medium block">
                    Vuelto a entregar:
                  </span>
                  <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(vuelto)}
                  </span>
                </div>
              </div>

              {/* Botones de billetes rápidos */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground mr-1">Atajos:</span>
                <button
                  type="button"
                  onClick={handleSetMontoExacto}
                  className="px-2 py-0.5 rounded text-xs border border-border bg-card hover:bg-muted font-medium text-foreground cursor-pointer"
                >
                  Exacto (S/ {total.toFixed(2)})
                </button>
                {billetesSugeridos.slice(0, 4).map((billete) => (
                  <button
                    key={billete}
                    type="button"
                    onClick={() => handleSelectBillete(billete)}
                    className="px-2 py-0.5 rounded text-xs border border-border bg-card hover:bg-muted font-medium text-foreground font-mono cursor-pointer"
                  >
                    S/ {billete}
                  </button>
                ))}
              </div>
            </div>
          )}

          {metodoPago === 'YAPE' && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center space-y-1.5 animate-in fade-in-50 duration-150">
              <Smartphone className="h-6 w-6 text-primary mx-auto" />
              <p className="text-xs font-semibold text-foreground">
                Cobro con Yape: S/ {total.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Verifica la confirmación en el celular del comercio o solicita el código de aprobación.
              </p>
            </div>
          )}

          {metodoPago === 'PLIN' && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center space-y-1.5 animate-in fade-in-50 duration-150">
              <Smartphone className="h-6 w-6 text-primary mx-auto" />
              <p className="text-xs font-semibold text-foreground">
                Cobro con Plin: S/ {total.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Solicita al cliente la confirmación de envío en pantalla.
              </p>
            </div>
          )}

          {metodoPago === 'TARJETA' && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center space-y-1.5 animate-in fade-in-50 duration-150">
              <CreditCard className="h-6 w-6 text-primary mx-auto" />
              <p className="text-xs font-semibold text-foreground">
                Cobro con Tarjeta en POS Físico: S/ {total.toFixed(2)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Pasa la tarjeta por el POS inalámbrico (Visa, Mastercard, etc.) antes de confirmar.
              </p>
            </div>
          )}

          {metodoPago === 'MIXTO' && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2.5 animate-in fade-in-50 duration-150">
              <span className="text-xs font-medium text-foreground block">
                Dividir monto en dos medios de pago:
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">En Efectivo (S/)</Label>
                  <Input
                    type="number"
                    step="0.50"
                    min="0"
                    max={total}
                    value={pagoEfectivoMixto}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPagoEfectivoMixto(val);
                      setPagoDigitalMixto(Math.max(0, +(total - val).toFixed(2)));
                    }}
                    className="h-8 text-xs font-mono font-bold bg-card"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">En Digital / Yape (S/)</Label>
                  <Input
                    type="number"
                    step="0.50"
                    min="0"
                    max={total}
                    value={pagoDigitalMixto}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPagoDigitalMixto(val);
                      setPagoEfectivoMixto(Math.max(0, +(total - val).toFixed(2)));
                    }}
                    className="h-8 text-xs font-mono font-bold bg-card"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || total <= 0}
              className="gap-2 bg-primary text-primary-foreground font-semibold h-9"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isSubmitting ? 'Procesando...' : 'Confirmar Cobro y Emitir'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
