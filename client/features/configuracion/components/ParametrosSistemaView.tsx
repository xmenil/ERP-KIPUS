import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Save, RotateCcw, ShieldCheck, Database, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface ParametrosSistemaViewProps {
  tasaIgv: number;
  monedaPrincipal: 'PEN' | 'USD';
  permitirVentaSinStock: boolean;
  onUpdateParametro: (field: string, val: any) => void;
  onSyncBaseDatos: () => Promise<void>;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export const ParametrosSistemaView: React.FC<ParametrosSistemaViewProps> = ({
  tasaIgv,
  monedaPrincipal,
  permitirVentaSinStock,
  onUpdateParametro,
  onSyncBaseDatos,
  onSave,
  isSaving,
}) => {
  const [localSaving, setLocalSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSyncBaseDatos();
      toast.success('Módulos sincronizados con la base de datos');
    } catch {
      toast.error('Error al sincronizar datos');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalSaving(true);
    try {
      await onSave();
      toast.success(
        `Parámetros del sistema guardados (IGV: ${tasaIgv}%, Moneda: ${monedaPrincipal})`
      );
    } catch {
      toast.error('Error al guardar los parámetros del sistema');
    } finally {
      setLocalSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 select-none">
      {/* 1. Impuestos y Moneda (Gestalt Proximidad) */}
      <Card className="border-border/80 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <DollarSign className="h-4 w-4 text-primary" />
            <span>Moneda Base e Impuestos Tributarios</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Parámetros fiscales de aplicación obligatoria para la valorización de compras y ventas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tasa del Impuesto General a las Ventas (IGV)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={tasaIgv}
                  readOnly
                  className="h-8 text-xs w-24 bg-muted/40 font-bold font-mono"
                />
                <span className="text-xs text-muted-foreground">% (Tasa Estándar Nacional Perú)</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Moneda Principal del Negocio</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={monedaPrincipal === 'PEN' ? 'Soles (S/ - PEN)' : 'Dólares ($ - USD)'}
                  readOnly
                  className="h-8 text-xs w-48 bg-muted/40 font-bold"
                />
                <span className="text-xs text-muted-foreground">(Moneda de curso legal)</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/60">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={permitirVentaSinStock}
                onChange={(e) => onUpdateParametro('permitirVentaSinStock', e.target.checked)}
                className="rounded border-border text-primary h-4 w-4"
              />
              <div className="space-y-0.5">
                <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Permitir Ventas con Stock en Cero o Negativo</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Habilita registrar ventas de mostrador aunque el inventario teórico no haya sido ingresado aún por el almacenero.
                </div>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 2. Sincronización y Mantenimiento de Datos */}
      <Card className="border-border/80 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Database className="h-4 w-4 text-primary" />
            <span>Integridad de Datos y Sincronización</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Mantiene alineados en tiempo real los módulos de Ventas, Inventario, Kardex, Caja y Compras.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              Catálogo activo: <span className="font-semibold text-foreground">30 productos básicos</span> vinculados con control de kardex y balance diario.
            </p>
            <p className="text-[11px]">Última sincronización verificada con el servidor central.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
            className="h-8 text-xs gap-1.5 shrink-0 border-border"
          >
            <RotateCcw className={`h-3.5 w-3.5 text-muted-foreground ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar con Base de Datos'}</span>
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          disabled={isSaving || localSaving}
          className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-5 h-8 text-xs shadow-xs"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{isSaving || localSaving ? 'Guardando...' : 'Guardar Parámetros del Sistema'}</span>
        </Button>
      </div>
    </form>
  );
};
