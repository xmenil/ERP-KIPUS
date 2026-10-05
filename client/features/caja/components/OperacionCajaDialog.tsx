import React, { useState, useEffect } from 'react';
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
import { TipoOperacionCaja, MetodoCaja, NuevaOperacionCajaPayload } from '../types/caja.types';
import { formatCurrency } from '@/utils/formatters';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  Wallet,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface OperacionCajaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOperacionRegistrada: (payload: NuevaOperacionCajaPayload) => Promise<void>;
  tipoInicial?: TipoOperacionCaja;
  saldoActual?: number;
}

const CATEGORIAS_INGRESO = [
  'Aporte de sencillo / cambio',
  'Cobranza extraordinaria',
  'Ajuste a favor de caja',
  'Otros ingresos',
];

const CATEGORIAS_EGRESO = [
  'Compras menores / Insumos de tienda',
  'Servicios básicos o pasajes',
  'Refrigerios o alimentación del personal',
  'Retiro a caja fuerte / depósito banco',
  'Otros egresos',
];

export const OperacionCajaDialog: React.FC<OperacionCajaDialogProps> = ({
  open,
  onOpenChange,
  onOperacionRegistrada,
  tipoInicial = 'INGRESO',
  saldoActual = 0,
}) => {
  const [tipo, setTipo] = useState<TipoOperacionCaja>(tipoInicial);
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [metodo, setMetodo] = useState<MetodoCaja>('EFECTIVO');
  const [monto, setMonto] = useState<number>(50);
  const [observaciones, setObservaciones] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTipo(tipoInicial);
    setCategoria(tipoInicial === 'INGRESO' ? CATEGORIAS_INGRESO[0] : CATEGORIAS_EGRESO[0]);
  }, [tipoInicial, open]);

  // Si cambia el tipo manualmente en el select
  const handleCambioTipo = (nuevoTipo: TipoOperacionCaja) => {
    setTipo(nuevoTipo);
    setCategoria(nuevoTipo === 'INGRESO' ? CATEGORIAS_INGRESO[0] : CATEGORIAS_EGRESO[0]);
  };

  const nuevoSaldoProyectado =
    tipo === 'INGRESO' ? saldoActual + (monto || 0) : Math.max(0, saldoActual - (monto || 0));

  const requiereAutorizacion = tipo === 'EGRESO' && monto >= 250;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim() || monto <= 0) return;

    setIsSubmitting(true);
    try {
      await onOperacionRegistrada({
        tipo,
        concepto: concepto.trim(),
        categoria,
        metodo,
        monto: Number(monto),
        observaciones: observaciones.trim() || undefined,
      });
      onOpenChange(false);
      setConcepto('');
      setObservaciones('');
      setMonto(50);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2 text-xs font-semibold">
            {tipo === 'INGRESO' ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ArrowDownCircle className="h-3.5 w-3.5" />
                Ingreso manual
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <ArrowUpCircle className="h-3.5 w-3.5" />
                Egreso / Salida
              </span>
            )}
          </div>
          <DialogTitle className="text-lg font-semibold pt-1">
            {tipo === 'INGRESO' ? 'Registrar nuevo ingreso' : 'Registrar nuevo egreso'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {tipo === 'INGRESO'
              ? 'Ingresa dinero extraordinario que entra a la caja sin ser una venta directa.'
              : 'Registra un gasto menor o salida de dinero físico de la gaveta.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo y Método */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Tipo de operación</Label>
              <Select value={tipo} onValueChange={(val: TipoOperacionCaja) => handleCambioTipo(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INGRESO">Ingreso (+)</SelectItem>
                  <SelectItem value="EGRESO">Egreso (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Método de pago</Label>
              <Select value={metodo} onValueChange={(val: MetodoCaja) => setMetodo(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EFECTIVO">Efectivo (Gaveta)</SelectItem>
                  <SelectItem value="YAPE">Yape</SelectItem>
                  <SelectItem value="PLIN">Plin</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                  <SelectItem value="TARJETA">Tarjeta POS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Categoría Operativa */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Categoría</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(tipo === 'INGRESO' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Concepto / Motivo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              Concepto / Motivo <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder={
                tipo === 'INGRESO'
                  ? 'Ej. Sencillo adicional traído por administración'
                  : 'Ej. Compra de bolsas y cinta de embalaje'
              }
              required
              className="h-9 text-xs"
            />
          </div>

          {/* Monto con previsualización del saldo */}
          <div className="space-y-2 p-3.5 rounded-xl bg-muted/40 border border-border">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium text-foreground">Monto (S/)</Label>
              <span className="text-[11px] text-muted-foreground">
                Saldo actual: <span className="tabular-nums font-medium text-foreground">{formatCurrency(saldoActual)}</span>
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                S/
              </span>
              <Input
                type="number"
                step="0.10"
                min="0.5"
                value={monto}
                onChange={(e) => setMonto(Number(e.target.value))}
                required
                className="h-9 pl-8 text-base font-semibold text-foreground tabular-nums"
              />
            </div>

            <div className="flex justify-between items-center text-[11px] pt-1">
              <span className="text-muted-foreground">Nuevo saldo proyectado:</span>
              <span
                className={`font-medium tabular-nums ${
                  tipo === 'INGRESO' ? 'text-emerald-700' : 'text-foreground'
                }`}
              >
                {formatCurrency(nuevoSaldoProyectado)}
              </span>
            </div>
          </div>

          {/* Advertencia si egreso supera umbral (regla 12) */}
          {requiereAutorizacion && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium block">Este egreso requiere autorización.</span>
                <span className="text-[11px] text-amber-800">
                  El monto supera el límite operativo diario (S/ 250.00). El movimiento quedará registrado con alerta para auditoría de supervisión.
                </span>
              </div>
            </div>
          )}

          {/* Observación opcional */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Observación (Opcional)</Label>
            <Input
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej. Comprobante adjunto en gaveta, firmado por cajero"
              className="h-8 text-xs"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-9 text-xs font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !concepto.trim() || monto <= 0}
              className={`h-9 text-xs font-medium ${
                tipo === 'EGRESO'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isSubmitting
                ? 'Registrando...'
                : tipo === 'INGRESO'
                ? 'Registrar ingreso'
                : 'Registrar egreso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
