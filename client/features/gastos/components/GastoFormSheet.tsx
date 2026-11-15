import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { CategoriaGasto, NuevoGastoPayload } from '../types/gastos.types';
import {
  Receipt,
  Building,
  Users,
  Truck,
  Wrench,
  Megaphone,
  Wallet,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface GastoFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGastoRegistrado: (payload: NuevoGastoPayload) => Promise<void>;
}

const CATEGORIAS_ITEMS: { id: CategoriaGasto; label: string; icon: React.ElementType }[] = [
  { id: 'SERVICIOS_BASICOS', label: 'Servicios Básicos (Luz, agua, internet)', icon: Receipt },
  { id: 'ALQUILER', label: 'Alquiler de Local / Almacén', icon: Building },
  { id: 'PLANILLA', label: 'Planilla / Sueldos y Adelantos', icon: Users },
  { id: 'LOGISTICA', label: 'Logística / Envíos y Combustible', icon: Truck },
  { id: 'MANTENIMIENTO', label: 'Mantenimiento y Reparaciones', icon: Wrench },
  { id: 'MARKETING', label: 'Publicidad y Marketing', icon: Megaphone },
  { id: 'OTROS', label: 'Otros Egresos Operativos', icon: Wallet },
];

export const GastoFormSheet: React.FC<GastoFormSheetProps> = ({
  open,
  onOpenChange,
  onGastoRegistrado,
}) => {
  const [categoria, setCategoria] = useState<CategoriaGasto>('SERVICIOS_BASICOS');
  const [descripcion, setDescripcion] = useState('');
  const [beneficiario, setBeneficiario] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [monto, setMonto] = useState<string>('50');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorInput, setErrorInput] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInput(null);

    const montoNum = Number(monto);
    if (!descripcion.trim()) {
      setErrorInput('Ingresa el concepto o descripción del egreso.');
      return;
    }
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorInput('El monto debe ser un valor positivo mayor a S/ 0.00.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onGastoRegistrado({
        categoria,
        descripcion: descripcion.trim(),
        beneficiario: beneficiario.trim() || 'Proveedor General',
        comprobante: comprobante.trim() || `VALE-${Math.floor(1000 + Math.random() * 9000)}`,
        monto: montoNum,
        metodoPago,
      });

      // Resetear campos
      setDescripcion('');
      setBeneficiario('');
      setComprobante('');
      setMonto('50');
      setErrorInput(null);
      onOpenChange(false);
    } catch {
      setErrorInput('Ocurrió un error al registrar el gasto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto flex flex-col p-6">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <DollarSign className="h-5 w-5 text-primary" />
            <span>Registrar Gasto Operativo</span>
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Registra los egresos de caja o transferencias para mantener actualizado tu flujo operativo.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 py-4 text-xs">
          {errorInput && (
            <div className="p-3 rounded-lg border border-danger-soft bg-danger-soft/40 text-danger-text flex items-center gap-2 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorInput}</span>
            </div>
          )}

          {/* Categoría */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Categoría del Egreso *</Label>
            <Select value={categoria} onValueChange={(val) => setCategoria(val as CategoriaGasto)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SelectItem key={item.id} value={item.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{item.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Monto (S/) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Monto Pagado (S/) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground text-xs font-bold">
                S/
              </span>
              <Input
                type="number"
                step="0.01"
                min="0.10"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="pl-8 h-9 text-xs font-mono font-bold text-base"
                required
              />
            </div>
          </div>

          {/* Concepto / Descripción */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Concepto / Detalle del Gasto *
            </Label>
            <Input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Pago recibo de luz local central mes actual"
              className="h-9 text-xs"
              required
            />
          </div>

          {/* Beneficiario / Proveedor */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Beneficiario / Proveedor del Servicio
            </Label>
            <Input
              value={beneficiario}
              onChange={(e) => setBeneficiario(e.target.value)}
              placeholder="Ej. Electrocentro S.A., Propietario Local, etc."
              className="h-9 text-xs"
            />
          </div>

          {/* Medio de Pago */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Medio de Pago *</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EFECTIVO" className="text-xs">
                  Efectivo de Caja Comercial (Descuenta de caja activa)
                </SelectItem>
                <SelectItem value="TRANSFERENCIA" className="text-xs">
                  Transferencia Bancaria (BCP / BBVA / Interbank)
                </SelectItem>
                <SelectItem value="YAPE" className="text-xs">
                  Yape / Plin Empresa
                </SelectItem>
                <SelectItem value="TARJETA" className="text-xs">
                  Tarjeta Débito / Crédito
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* N° Comprobante */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              N° Comprobante / Recibo / Vale
            </Label>
            <Input
              value={comprobante}
              onChange={(e) => setComprobante(e.target.value)}
              placeholder="Ej. REC-098234, FACT-E001-231, o Vale N° 12"
              className="h-9 text-xs font-mono uppercase"
            />
          </div>

          <SheetFooter className="pt-4 border-t border-border flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs bg-primary text-primary-foreground font-semibold gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Registrar Gasto</span>
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
