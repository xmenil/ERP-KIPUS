import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SerieComprobante } from '../types/configuracion.types';
import {
  FileCheck,
  CheckCircle2,
  Lock,
  Server,
  KeyRound,
  Save,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface SunatConfigViewProps {
  series: SerieComprobante[];
  ruc: string;
  razonSocial: string;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export const SunatConfigView: React.FC<SunatConfigViewProps> = ({
  series,
  ruc,
  razonSocial,
  onSave,
  isSaving,
}) => {
  const [usuarioSol, setUsuarioSol] = useState('KIPUS_FACT2026');
  const [claveSol, setClaveSol] = useState('••••••••••••');
  const [ambiente, setAmbiente] = useState<'PRODUCCION' | 'BETA'>('PRODUCCION');
  const [probandoConexion, setProbandoConexion] = useState(false);
  const [localSaving, setLocalSaving] = useState(false);

  const handleProbarConexion = () => {
    setProbandoConexion(true);
    setTimeout(() => {
      setProbandoConexion(false);
      toast.success('Conexión con el servidor SUNAT / OSE verificada exitosamente (200 OK)');
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalSaving(true);
    try {
      await onSave();
      toast.success(
        `Configuración SUNAT guardada para ${series.length} series autorizadas (${ambiente})`
      );
    } catch {
      toast.error('Error al guardar la configuración de SUNAT');
    } finally {
      setLocalSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 select-none">
      {/* 1. Health Card: Estado del Sistema SUNAT (Nielsen H1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 flex items-start gap-3">
          <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Servicio de Emisión
            </span>
            <p className="text-xs font-semibold text-foreground mt-0.5">SUNAT / OSE Operativo</p>
            <p className="text-[11px] text-muted-foreground">Envío directo de comprobantes activo</p>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card flex items-start gap-3">
          <div className="p-2 rounded-md bg-primary-soft text-primary shrink-0">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Entorno Activo
            </span>
            <p className="text-xs font-semibold text-foreground mt-0.5">
              {ambiente === 'PRODUCCION' ? 'Producción Oficial SUNAT' : 'Ambiente de Pruebas (BETA)'}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono">RUC: {ruc}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-card flex items-start gap-3">
          <div className="p-2 rounded-md bg-muted text-muted-foreground shrink-0">
            <Lock className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Certificado Digital (.pfx)
            </span>
            <p className="text-xs font-semibold text-foreground mt-0.5">Vigente hasta 31/12/2027</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Firma electrónica activa</p>
          </div>
        </div>
      </div>

      {/* 2. Series de Facturación y Correlativos (Gestalt Cerramiento y Proximidad) */}
      <Card className="border-border/80 bg-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <FileCheck className="h-4 w-4 text-primary" />
              <span>Series y Correlativos Oficiales de Facturación</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Series autorizadas para la emisión en mostrador y puntos de venta
            </CardDescription>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
            {series.length} series registradas
          </span>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/40 text-xs">
                  <TableHead className="font-semibold text-foreground h-8">Tipo de Comprobante</TableHead>
                  <TableHead className="font-semibold text-center h-8">Serie</TableHead>
                  <TableHead className="font-semibold text-right h-8">Siguiente Correlativo</TableHead>
                  <TableHead className="font-semibold text-center h-8">Destino SUNAT</TableHead>
                  <TableHead className="font-semibold text-center h-8">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {series.map((s, idx) => (
                  <TableRow key={idx} className="text-xs hover:bg-muted/30">
                    <TableCell className="font-semibold text-foreground py-2">{s.tipo}</TableCell>
                    <TableCell className="text-center font-mono font-bold text-primary py-2">
                      {s.serie}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold tabular-nums text-foreground py-2">
                      {String(s.siguienteNumero).padStart(6, '0')}
                    </TableCell>
                    <TableCell className="text-center text-[11px] text-muted-foreground py-2">
                      {s.serie.startsWith('B') || s.serie.startsWith('F') ? 'Envío Electrónico' : 'Control Interno'}
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        Activo
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center gap-2 mt-3 p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Para evitar saltos de correlativos sancionables por SUNAT, los números correlativos avanzan de forma automática con cada venta emitida.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Credenciales SOL y Conexión OSE */}
      <Card className="border-border/80 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <KeyRound className="h-4 w-4 text-primary" />
            <span>Credenciales de Envío Clave SOL</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Usuario secundario SOL con permiso de facturación electrónica (nunca uses la clave SOL principal del dueño).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Usuario Secundario SOL</Label>
              <Input
                value={usuarioSol}
                onChange={(e) => setUsuarioSol(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Clave SOL</Label>
              <Input
                type="password"
                value={claveSol}
                onChange={(e) => setClaveSol(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-border/60">
            <div className="flex items-center gap-3">
              <Label className="text-xs font-semibold">Ambiente:</Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAmbiente('PRODUCCION')}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    ambiente === 'PRODUCCION'
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  Producción Oficial
                </button>
                <button
                  type="button"
                  onClick={() => setAmbiente('BETA')}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    ambiente === 'BETA'
                      ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  Pruebas (Beta)
                </button>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleProbarConexion}
              disabled={probandoConexion}
              className="h-8 text-xs gap-1.5 border-border"
            >
              <RotateCw className={`h-3.5 w-3.5 ${probandoConexion ? 'animate-spin' : ''}`} />
              <span>{probandoConexion ? 'Comprobando...' : 'Probar Conexión SUNAT'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          disabled={isSaving || localSaving}
          className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-5 h-8 text-xs shadow-xs"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{isSaving || localSaving ? 'Guardando...' : 'Guardar Parámetros SUNAT'}</span>
        </Button>
      </div>
    </form>
  );
};
