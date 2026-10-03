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
import { AperturaCajaPayload } from '../types/caja.types';
import { formatCurrency } from '@/utils/formatters';
import {
  Sparkles,
  CheckCircle2,
  Coins,
  Store,
  User,
  Clock,
  ArrowRight,
  Calculator,
} from 'lucide-react';

interface AbrirCajaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCajaAbierta: (payload: AperturaCajaPayload) => Promise<void>;
  sucursalDefecto?: string;
}

export const AbrirCajaDialog: React.FC<AbrirCajaDialogProps> = ({
  open,
  onOpenChange,
  onCajaAbierta,
  sucursalDefecto = 'Sede Central (Tingo María)',
}) => {
  const [sucursal, setSucursal] = useState(sucursalDefecto);
  const [cajaId, setCajaId] = useState('caja-1');
  const [responsable, setResponsable] = useState('Juan Pérez');
  const [saldoInicial, setSaldoInicial] = useState<number>(200);
  const [observaciones, setObservaciones] = useState('');
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exito, setExito] = useState(false);
  const [horaApertura, setHoraApertura] = useState('');

  // Desglose de sencillo opcional
  const [denominaciones, setDenominaciones] = useState<{ [key: string]: number }>({
    '50': 2,
    '20': 3,
    '10': 3,
    '5': 2,
    '2': 0,
    '1': 0,
  });

  const actualizarConteo = (den: string, cant: number) => {
    const nuevo = { ...denominaciones, [den]: Math.max(0, cant) };
    setDenominaciones(nuevo);
    const suma = Object.entries(nuevo).reduce(
      (acc, [d, c]) => acc + Number(d) * c,
      0
    );
    setSaldoInicial(suma);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saldoInicial < 0) return;

    setIsSubmitting(true);
    try {
      const ahoraHora = new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setHoraApertura(ahoraHora);
      await onCajaAbierta({
        cajaId,
        sucursal,
        responsable,
        saldoInicial: Number(saldoInicial),
        observaciones: observaciones.trim() || undefined,
      });
      setExito(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCerrarModal = () => {
    setExito(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCerrarModal}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {exito ? (
          /* Pantalla de Éxito posterior a la apertura */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm animate-in zoom-in-95">
              <CheckCircle2 className="h-8 w-8 stroke-[2]" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                CAJA ABIERTA
              </div>
              <h3 className="text-xl font-bold text-foreground">
                ¡Tu caja está lista para operar!
              </h3>
              <p className="text-xs text-muted-foreground">
                Se ha registrado la apertura de turno correctamente.
              </p>
            </div>

            <div className="bg-muted/40 border border-border/70 rounded-xl p-4 text-xs space-y-2.5 text-left">
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Hora de apertura:</span>
                <span className="font-semibold text-foreground">{horaApertura}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Responsable:</span>
                <span className="font-semibold text-foreground">{responsable}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/50">
                <span className="text-muted-foreground">Sucursal y Caja:</span>
                <span className="font-semibold text-foreground">
                  {cajaId === 'caja-1' ? 'Caja 01' : 'Caja 02'} — {sucursal.split(' ')[0]}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 font-bold text-sm">
                <span className="text-foreground">Sencillo inicial:</span>
                <span className="text-emerald-700 tabular-nums">
                  {formatCurrency(saldoInicial)}
                </span>
              </div>
            </div>

            <Button
              className="w-full h-11 font-semibold text-sm gap-2"
              onClick={handleCerrarModal}
            >
              Ir a mi caja
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          /* Formulario de Apertura */
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2 text-primary font-medium text-xs">
                <Store className="h-4 w-4" />
                <span>KIPU'S ERP • Módulo Caja</span>
              </div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 pt-1">
                <Sparkles className="h-5 w-5 text-primary" />
                Abrir turno de caja
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ingresa el monto de sencillo en efectivo con el que inicias operaciones hoy.
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Sucursal y Caja */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-muted-foreground" />
                    Sucursal
                  </Label>
                  <Select value={sucursal} onValueChange={setSucursal}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sede Central (Tingo María)">
                        Sede Central (Tingo María)
                      </SelectItem>
                      <SelectItem value="Sucursal Huánuco">Sucursal Huánuco</SelectItem>
                      <SelectItem value="Sucursal Aucayacu">Sucursal Aucayacu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                    Caja a operar
                  </Label>
                  <Select value={cajaId} onValueChange={setCajaId}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caja-1">Caja 01 - Mostrador Principal</SelectItem>
                      <SelectItem value="caja-2">Caja 02 - Rápida / Billeteras</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Responsable */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Cajero / Responsable
                </Label>
                <Input
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  placeholder="Nombre de quien opera la caja"
                  required
                  className="h-9 text-xs"
                />
              </div>

              {/* Monto Inicial / Sencillo */}
              <div className="space-y-2 p-3.5 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-primary" />
                    Monto inicial (Sencillo de apertura)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-primary hover:text-primary gap-1 px-1.5"
                    onClick={() => setMostrarCalculadora(!mostrarCalculadora)}
                  >
                    <Calculator className="h-3 w-3" />
                    {mostrarCalculadora ? 'Entrada simple' : 'Contar monedas/billetes'}
                  </Button>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    S/
                  </span>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={saldoInicial}
                    onChange={(e) => setSaldoInicial(Number(e.target.value))}
                    required
                    className="h-11 pl-9 text-lg font-bold text-foreground tabular-nums"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Efectivo disponible en gaveta para dar vuelto a los primeros clientes.
                </p>

                {/* Desglose de billetes y monedas interactivo */}
                {mostrarCalculadora && (
                  <div className="pt-2 border-t border-border/60 space-y-2 text-xs">
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Desglose rápido de sencillo:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {['50', '20', '10', '5', '2', '1'].map((den) => (
                        <div key={den} className="flex items-center gap-1.5 bg-background p-1.5 rounded-lg border border-border">
                          <span className="text-[11px] font-medium w-8 text-muted-foreground">
                            S/{den}:
                          </span>
                          <Input
                            type="number"
                            min="0"
                            value={denominaciones[den] || 0}
                            onChange={(e) => actualizarConteo(den, Number(e.target.value))}
                            className="h-7 text-xs text-center p-0 font-semibold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Observación opcional */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Observaciones (Opcional)
                </Label>
                <Input
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej. Se recibió sencillo en monedas de S/ 2 y S/ 5"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-border/60 bg-muted/10 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCerrarModal}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || saldoInicial < 0}
                className="font-semibold gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                {isSubmitting ? 'Abriendo...' : 'Abrir caja'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
