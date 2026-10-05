import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AuditoriaCaja } from '../types/caja.types';
import {
  ShieldCheck,
  Search,
  Lock,
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  RefreshCw,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

interface AuditoriaCajaViewProps {
  auditorias: AuditoriaCaja[];
}

export const AuditoriaCajaView: React.FC<AuditoriaCajaViewProps> = ({ auditorias }) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroAccion, setFiltroAccion] = useState<string>('TODAS');

  const auditoriasFiltradas = useMemo(() => {
    return auditorias.filter((item) => {
      if (filtroAccion !== 'TODAS' && item.accion !== filtroAccion) return false;
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const coincideUsuario = item.usuario.toLowerCase().includes(query);
        const coincideCaja = item.caja.toLowerCase().includes(query);
        const coincideMov = item.movimiento?.toLowerCase().includes(query) || false;
        const coincideObs = item.observacion?.toLowerCase().includes(query) || false;
        return coincideUsuario || coincideCaja || coincideMov || coincideObs;
      }
      return true;
    });
  }, [auditorias, filtroAccion, busqueda]);

  const renderBadgeAccion = (accion: string) => {
    switch (accion) {
      case 'APERTURA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <RefreshCw className="h-3 w-3" /> Apertura
          </span>
        );
      case 'CIERRE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-800 border border-zinc-200">
            <Lock className="h-3 w-3" /> Cierre
          </span>
        );
      case 'ARQUEO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Calculator className="h-3 w-3" /> Arqueo
          </span>
        );
      case 'INGRESO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownCircle className="h-3 w-3" /> Ingreso
          </span>
        );
      case 'EGRESO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <ArrowUpCircle className="h-3 w-3" /> Egreso
          </span>
        );
      case 'ANULACION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="h-3 w-3" /> Anulación
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
            {accion}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner de Seguridad Informativo */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs">
        <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
        <div>
          <span className="font-semibold block">Bitácora de Auditoría Inmutable de Caja</span>
          <p className="text-[11px] text-blue-800">
            Todas las acciones críticas (aperturas, cierres, arqueos y salidas manuales de efectivo) quedan registradas con huella temporal y usuario responsable para control de gerencia.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Filtros rápidos por acción */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-lg border border-border/60 overflow-x-auto w-full sm:w-auto">
            {['TODAS', 'APERTURA', 'CIERRE', 'ARQUEO', 'INGRESO', 'EGRESO'].map((acc) => (
              <button
                key={acc}
                type="button"
                onClick={() => setFiltroAccion(acc)}
                className={`px-3 py-1 rounded text-xs transition-all whitespace-nowrap ${
                  filtroAccion === acc
                    ? 'bg-card text-foreground shadow-xs border border-border font-medium'
                    : 'text-muted-foreground hover:text-foreground font-normal'
                }`}
              >
                {acc === 'TODAS' ? 'Todas' : acc.charAt(0) + acc.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuario o detalle..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Auditoría */}
      <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs bg-muted/40">
                  <TableHead className="w-28 whitespace-nowrap">Fecha</TableHead>
                  <TableHead className="w-20 whitespace-nowrap">Hora</TableHead>
                  <TableHead className="w-32">Usuario</TableHead>
                  <TableHead className="w-28">Acción</TableHead>
                  <TableHead>Caja & Sucursal</TableHead>
                  <TableHead>Detalle de la Operación</TableHead>
                  <TableHead>Observación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditoriasFiltradas.map((aud) => (
                  <TableRow key={aud.id} className="text-xs hover:bg-muted/20">
                    <TableCell className="font-medium text-foreground whitespace-nowrap">
                      {aud.fecha}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                      {aud.hora}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {aud.usuario}
                    </TableCell>
                    <TableCell>{renderBadgeAccion(aud.accion)}</TableCell>
                    <TableCell>
                      <span className="font-medium block text-foreground">
                        {aud.caja}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {aud.sucursal}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-foreground font-medium">{aud.movimiento}</div>
                      {aud.valorAnterior && aud.valorNuevo && (
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {aud.valorAnterior} → {aud.valorNuevo}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[11px] italic">
                      {aud.observacion || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
