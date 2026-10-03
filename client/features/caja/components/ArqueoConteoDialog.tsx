import React, { useState, useMemo } from 'react';
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
import { ArqueoConteo, EstadoCaja } from '../types/caja.types';
import { formatCurrency } from '@/utils/formatters';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Banknote,
  Smartphone,
  CreditCard,
  Building,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface ArqueoConteoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estadoCaja: EstadoCaja;
  onArqueoGuardado: (arqueo: ArqueoConteo) => Promise<void>;
  onProcederCierre?: (arqueo: ArqueoConteo) => void;
}

const BILLETES = [200, 100, 50, 20, 10];
const MONEDAS = [5, 2, 1, 0.5, 0.2, 0.1];

const MOTIVOS_DIFERENCIA = [
  'Vuelto erróneo involuntario a cliente',
  'Acumulación de redondeo de céntimos en ventas',
  'Egreso o compra menor pendiente de comprobante',
  'Cobranza no registrada en sistema',
  'Diferencia en verificación / por investigar',
  'Otro motivo justificado',
];

export const ArqueoConteoDialog: React.FC<ArqueoConteoDialogProps> = ({
  open,
  onOpenChange,
  estadoCaja,
  onArqueoGuardado,
  onProcederCierre,
}) => {
  const efectivoEsperado = estadoCaja.saldoEfectivoEsperado;

  // Modo de ingreso: 'CALCULADORA' (billetes/monedas) o 'DIRECTO' (monto total)
  const [modoConteo, setModoConteo] = useState<'CALCULADORA' | 'DIRECTO'>('CALCULADORA');
  const [montoDirecto, setMontoDirecto] = useState<number>(efectivoEsperado);

  // Conteo de billetes y monedas
  const [conteoBilletes, setConteoBilletes] = useState<{ [key: number]: number }>({});
  const [conteoMonedas, setConteoMonedas] = useState<{ [key: number]: number }>({});

  // Verificación digital opcional (Regla 16)
  const [verificarDigitales, setVerificarDigitales] = useState(false);
  const [yapeVerificado, setYapeVerificado] = useState<number>(
    estadoCaja.ventasDigitales.yape
  );
  const [plinVerificado, setPlinVerificado] = useState<number>(
    estadoCaja.ventasDigitales.plin
  );
  const [tarjetaVerificado, setTarjetaVerificado] = useState<number>(
    estadoCaja.ventasDigitales.tarjeta
  );
  const [transferenciaVerificado, setTransferenciaVerificado] = useState<number>(
    estadoCaja.ventasDigitales.transferencia
  );

  // Justificación de diferencia si existe
  const [motivoDiferencia, setMotivoDiferencia] = useState(MOTIVOS_DIFERENCIA[0]);
  const [observaciones, setObservaciones] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cálculo total del efectivo contado según el modo
  const efectivoContado = useMemo(() => {
    if (modoConteo === 'DIRECTO') {
      return Number(montoDirecto) || 0;
    }
    const sumaBilletes = Object.entries(conteoBilletes).reduce(
      (acc, [den, cant]) => acc + Number(den) * (cant || 0),
      0
    );
    const sumaMonedas = Object.entries(conteoMonedas).reduce(
      (acc, [den, cant]) => acc + Number(den) * (cant || 0),
      0
    );
    return +(sumaBilletes + sumaMonedas).toFixed(2);
  }, [modoConteo, montoDirecto, conteoBilletes, conteoMonedas]);

  const diferencia = +(efectivoContado - efectivoEsperado).toFixed(2);
  const estaCuadrada = Math.abs(diferencia) < 0.05;

  const handleSetCantidadBillete = (den: number, cant: number) => {
    setConteoBilletes((prev) => ({ ...prev, [den]: Math.max(0, cant) }));
  };

  const handleSetCantidadMoneda = (den: number, cant: number) => {
    setConteoMonedas((prev) => ({ ...prev, [den]: Math.max(0, cant) }));
  };

  const handleLlenarEsperado = () => {
    setModoConteo('DIRECTO');
    setMontoDirecto(efectivoEsperado);
  };

  const construirPayloadArqueo = (): ArqueoConteo => {
    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10);
    const hora = ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    return {
      cajaId: estadoCaja.id,
      fecha,
      hora,
      responsable: estadoCaja.responsable,
      efectivoEsperado,
      efectivoContado,
      diferencia,
      estadoCuadre: estaCuadrada ? 'CUADRADA' : 'CON_DIFERENCIA',
      motivoDiferencia: estaCuadrada ? undefined : motivoDiferencia,
      observaciones: observaciones.trim() || undefined,
      desglose:
        modoConteo === 'CALCULADORA'
          ? [
              ...BILLETES.map((d) => ({
                denominacion: d,
                cantidad: conteoBilletes[d] || 0,
                subtotal: d * (conteoBilletes[d] || 0),
              })),
              ...MONEDAS.map((d) => ({
                denominacion: d,
                cantidad: conteoMonedas[d] || 0,
                subtotal: +(d * (conteoMonedas[d] || 0)).toFixed(2),
              })),
            ].filter((it) => it.cantidad > 0)
          : undefined,
      digitalesEsperado: estadoCaja.ventasDigitales,
      digitalesVerificado: verificarDigitales
        ? {
            yape: yapeVerificado,
            plin: plinVerificado,
            tarjeta: tarjetaVerificado,
            transferencia: transferenciaVerificado,
          }
        : undefined,
    };
  };

  const handleGuardar = async () => {
    setIsSubmitting(true);
    try {
      const arqueo = construirPayloadArqueo();
      await onArqueoGuardado(arqueo);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcederCierreClick = () => {
    const arqueo = construirPayloadArqueo();
    onOpenChange(false);
    if (onProcederCierre) {
      onProcederCierre(arqueo);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Cabecera amigable sin jerga contable */}
        <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-medium text-xs">
              <Calculator className="h-4 w-4" />
              <span>Arqueo y control de efectivo</span>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {estadoCaja.nombre}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold pt-1">
            Contar dinero en caja
          </DialogTitle>
          <DialogDescription className="text-xs">
            Comprueba cuánto efectivo físico tienes en tu gaveta comparándolo con lo que el sistema espera.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Tarjeta de Comparación Superior (Saldo Esperado vs Contado vs Diferencia) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/30 border border-border">
            {/* Saldo Esperado */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Efectivo esperado
              </span>
              <div className="text-xl font-bold text-foreground tabular-nums">
                {formatCurrency(efectivoEsperado)}
              </div>
              <span className="text-[10px] text-muted-foreground">
                Sencillo + ventas - egresos
              </span>
            </div>

            {/* Efectivo Contado */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary block">
                Efectivo contado
              </span>
              <div className="text-xl font-bold text-primary tabular-nums">
                {formatCurrency(efectivoContado)}
              </div>
              <span className="text-[10px] text-muted-foreground">
                {modoConteo === 'CALCULADORA' ? 'Por conteo de gaveta' : 'Ingreso directo'}
              </span>
            </div>

            {/* Diferencia */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Diferencia
              </span>
              <div
                className={`text-xl font-bold tabular-nums flex items-center gap-1 ${
                  estaCuadrada
                    ? 'text-emerald-700'
                    : diferencia > 0
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {estaCuadrada ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>S/ 0.00</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span>
                      {diferencia > 0 ? `+${formatCurrency(diferencia)}` : formatCurrency(diferencia)}
                    </span>
                  </>
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  estaCuadrada
                    ? 'text-emerald-700'
                    : diferencia > 0
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {estaCuadrada
                  ? 'Caja cuadrada'
                  : diferencia > 0
                  ? 'Sobrante en caja'
                  : 'Faltante en caja'}
              </span>
            </div>
          </div>

          {/* Selector de Modo de Conteo */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={modoConteo === 'CALCULADORA' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setModoConteo('CALCULADORA')}
              >
                <Banknote className="h-3.5 w-3.5" />
                Contar billetes y monedas
              </Button>
              <Button
                type="button"
                variant={modoConteo === 'DIRECTO' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setModoConteo('DIRECTO')}
              >
                <Coins className="h-3.5 w-3.5" />
                Ingresar total directo
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={handleLlenarEsperado}
            >
              <RefreshCw className="h-3 w-3" />
              Rellenar esperado
            </Button>
          </div>

          {/* MODO 1: Calculadora de Billetes y Monedas */}
          {modoConteo === 'CALCULADORA' ? (
            <div className="space-y-4">
              {/* Billetes */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Banknote className="h-4 w-4 text-primary" />
                  Billetes en efectivo
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {BILLETES.map((den) => (
                    <div
                      key={den}
                      className="p-2.5 rounded-lg border border-border/80 bg-card hover:border-primary/40 transition-colors text-center space-y-1.5"
                    >
                      <div className="text-xs font-bold text-foreground">S/ {den}</div>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={conteoBilletes[den] || ''}
                        onChange={(e) =>
                          handleSetCantidadBillete(den, parseInt(e.target.value) || 0)
                        }
                        className="h-8 text-center text-xs font-semibold tabular-nums"
                      />
                      <div className="text-[10px] text-muted-foreground tabular-nums">
                        = {formatCurrency(den * (conteoBilletes[den] || 0))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monedas */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-primary" />
                  Monedas en sencillo
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {MONEDAS.map((den) => (
                    <div
                      key={den}
                      className="p-2 rounded-lg border border-border/80 bg-card hover:border-primary/40 transition-colors text-center space-y-1"
                    >
                      <div className="text-xs font-bold text-foreground">
                        {den >= 1 ? `S/ ${den}` : `${den * 100}¢`}
                      </div>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={conteoMonedas[den] || ''}
                        onChange={(e) =>
                          handleSetCantidadMoneda(den, parseInt(e.target.value) || 0)
                        }
                        className="h-8 text-center text-xs font-semibold tabular-nums"
                      />
                      <div className="text-[10px] text-muted-foreground tabular-nums">
                        = {formatCurrency(den * (conteoMonedas[den] || 0))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* MODO 2: Ingreso directo */
            <div className="p-4 rounded-xl bg-card border border-border space-y-2">
              <Label className="text-xs font-semibold text-foreground">
                ¿Cuánto dinero tienes en total en la gaveta?
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  S/
                </span>
                <Input
                  type="number"
                  step="0.10"
                  min="0"
                  value={montoDirecto}
                  onChange={(e) => setMontoDirecto(Number(e.target.value))}
                  className="h-11 pl-9 text-lg font-bold tabular-nums"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ingresa el monto global contado de todas las monedas y billetes.
              </p>
            </div>
          )}

          {/* Formulario de Justificación de Diferencia (solo si no está cuadrada) */}
          {!estaCuadrada && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-3 animate-in fade-in-50">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>
                  Hay una diferencia de {formatCurrency(Math.abs(diferencia))} ({diferencia > 0 ? 'sobrante' : 'faltante'})
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                Selecciona la causa más probable para dejar constancia en el historial de arqueos:
              </p>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-amber-950">Motivo del descuadre</Label>
                <Select value={motivoDiferencia} onValueChange={setMotivoDiferencia}>
                  <SelectTrigger className="h-8 text-xs bg-white border-amber-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS_DIFERENCIA.map((mot) => (
                      <SelectItem key={mot} value={mot}>
                        {mot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-amber-950">Detalle / Observación (Opcional)</Label>
                <Input
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej. Revisado junto al supervisor"
                  className="h-8 text-xs bg-white border-amber-200"
                />
              </div>
            </div>
          )}

          {/* Vista Avanzada Opcional: Arqueo por Método de Pago (Regla 16) */}
          <div className="border border-border/80 rounded-xl overflow-hidden">
            <button
              type="button"
              className="w-full p-3 bg-muted/20 hover:bg-muted/40 text-left flex items-center justify-between text-xs font-semibold text-foreground transition-colors"
              onClick={() => setVerificarDigitales(!verificarDigitales)}
            >
              <span className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                Verificar cobros por Yape, Plin y Tarjetas (Opcional)
              </span>
              <span className="text-[11px] text-primary font-medium">
                {verificarDigitales ? 'Ocultar verificación digital' : 'Comprobar billeteras/POS'}
              </span>
            </button>

            {verificarDigitales && (
              <div className="p-4 bg-card border-t border-border space-y-3 text-xs">
                <p className="text-[11px] text-muted-foreground">
                  Compara los montos registrados en el ERP con el aplicativo del celular o los vouchers del POS:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Yape */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60">
                    <div>
                      <span className="font-semibold block text-foreground">Yape</span>
                      <span className="text-[10px] text-muted-foreground">
                        Esperado: {formatCurrency(estadoCaja.ventasDigitales.yape)}
                      </span>
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        step="0.5"
                        value={yapeVerificado}
                        onChange={(e) => setYapeVerificado(Number(e.target.value))}
                        className="h-7 text-xs font-bold text-right"
                      />
                    </div>
                  </div>

                  {/* Plin */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60">
                    <div>
                      <span className="font-semibold block text-foreground">Plin</span>
                      <span className="text-[10px] text-muted-foreground">
                        Esperado: {formatCurrency(estadoCaja.ventasDigitales.plin)}
                      </span>
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        step="0.5"
                        value={plinVerificado}
                        onChange={(e) => setPlinVerificado(Number(e.target.value))}
                        className="h-7 text-xs font-bold text-right"
                      />
                    </div>
                  </div>

                  {/* Tarjetas */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60">
                    <div>
                      <span className="font-semibold block text-foreground">Tarjetas POS</span>
                      <span className="text-[10px] text-muted-foreground">
                        Esperado: {formatCurrency(estadoCaja.ventasDigitales.tarjeta)}
                      </span>
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        step="0.5"
                        value={tarjetaVerificado}
                        onChange={(e) => setTarjetaVerificado(Number(e.target.value))}
                        className="h-7 text-xs font-bold text-right"
                      />
                    </div>
                  </div>

                  {/* Transferencia */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60">
                    <div>
                      <span className="font-semibold block text-foreground">Transferencia</span>
                      <span className="text-[10px] text-muted-foreground">
                        Esperado: {formatCurrency(estadoCaja.ventasDigitales.transferencia)}
                      </span>
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        step="0.5"
                        value={transferenciaVerificado}
                        onChange={(e) => setTransferenciaVerificado(Number(e.target.value))}
                        className="h-7 text-xs font-bold text-right"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/60 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Volver a mi caja
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleGuardar}
              disabled={isSubmitting}
              className="w-full sm:w-auto text-xs font-semibold"
            >
              Guardar arqueo
            </Button>

            {onProcederCierre && (
              <Button
                type="button"
                size="sm"
                onClick={handleProcederCierreClick}
                disabled={isSubmitting}
                className="w-full sm:w-auto text-xs font-semibold gap-1.5"
              >
                <span>Proceder al cierre</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
