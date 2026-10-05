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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-success-soft text-success-text border border-success/30">
            <RefreshCw className="h-3 w-3 text-success" /> Apertura
          </span>
        );
      case 'CIERRE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
            <Lock className="h-3 w-3" /> Cierre
          </span>
        );
      case 'ARQUEO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            <Calculator className="h-3 w-3" /> Arqueo
          </span>
        );
      case 'INGRESO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-success-soft text-success-text border border-success/30">
            <ArrowDownCircle className="h-3 w-3 text-success" /> Ingreso
          </span>
        );
      case 'EGRESO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-danger-soft text-danger-text border border-destructive/30">
            <ArrowUpCircle className="h-3 w-3 text-destructive" /> Egreso
          </span>
        );
      case 'ANULACION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-warning-soft text-warning-text border border-warning/30">
            <AlertCircle className="h-3 w-3 text-warning" /> Anulación
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
            {accion}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner de Seguridad Informativo */}
      <div className="flex items-start sm:items-center gap-3 p-3.5 rounded-md bg-muted/40 border border-border text-foreground text-xs">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <span className="font-semibold block text-foreground">Bitácora de Auditoría Inmutable de Caja</span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Todas las acciones críticas (aperturas, cierres, arqueos y salidas manuales de efectivo) quedan registradas con huella temporal y usuario responsable para control de gerencia.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Filtros rápidos por acción */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-md border border-border/60 overflow-x-auto w-full md:w-auto">
            {['TODAS', 'APERTURA', 'CIERRE', 'ARQUEO', 'INGRESO', 'EGRESO'].map((acc) => (
              <button
                key={acc}
                type="button"
                onClick={() => setFiltroAccion(acc)}
                className={`px-3 py-1.5 rounded text-xs transition-all whitespace-nowrap ${
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
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuario o detalle..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-9 pl-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Auditoría: Tabla Desktop (>= lg) y Tarjetas Móvil (< lg) */}
      <Card className="border border-border/80 shadow-xs bg-card overflow-hidden">
        <CardContent className="p-0">
          {auditoriasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No se encontraron registros de auditoría con los filtros aplicados.
            </div>
          ) : (
            <>
              {/* VISTA ESCRITORIO: Tabla estructurada con scroll horizontal seguro */}
              <div className="hidden lg:block overflow-x-auto w-full">
                <Table className="w-full min-w-[880px] table-auto">
                  <TableHeader>
                    <TableRow className="text-xs bg-muted/40 border-b border-border">
                      <TableHead className="w-28 min-w-[110px] whitespace-nowrap py-3 px-4">Fecha</TableHead>
                      <TableHead className="w-20 min-w-[80px] whitespace-nowrap py-3 px-3">Hora</TableHead>
                      <TableHead className="w-32 min-w-[130px] whitespace-nowrap py-3 px-3">Usuario</TableHead>
                      <TableHead className="w-28 min-w-[110px] whitespace-nowrap py-3 px-3">Acción</TableHead>
                      <TableHead className="min-w-[170px] whitespace-nowrap py-3 px-4">Caja & Sucursal</TableHead>
                      <TableHead className="min-w-[220px] whitespace-nowrap py-3 px-4">Detalle de la Operación</TableHead>
                      <TableHead className="min-w-[160px] whitespace-nowrap py-3 px-4">Observación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditoriasFiltradas.map((aud) => (
                      <TableRow key={aud.id} className="text-xs hover:bg-muted/20 border-b border-border/70">
                        <TableCell className="font-medium text-foreground whitespace-nowrap py-3 px-4">
                          {aud.fecha}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground whitespace-nowrap py-3 px-3">
                          {aud.hora}
                        </TableCell>
                        <TableCell className="font-medium text-foreground py-3 px-3 whitespace-nowrap">
                          {aud.usuario}
                        </TableCell>
                        <TableCell className="py-3 px-3 whitespace-nowrap">{renderBadgeAccion(aud.accion)}</TableCell>
                        <TableCell className="py-3 px-4 min-w-[170px]">
                          <span className="font-medium block text-foreground leading-tight">
                            {aud.caja}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {aud.sucursal}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-4 min-w-[220px]">
                          <div className="text-foreground font-medium leading-snug">{aud.movimiento}</div>
                          {aud.valorAnterior && aud.valorNuevo && (
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">
                              {aud.valorAnterior} → {aud.valorNuevo}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs italic py-3 px-4 min-w-[160px]">
                          {aud.observacion || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* VISTA MÓVIL Y TABLET: Lista de tarjetas ergonómicas (< lg) */}
              <div className="block lg:hidden divide-y divide-border">
                {auditoriasFiltradas.map((aud) => (
                  <div key={aud.id} className="p-3.5 space-y-2.5 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div>{renderBadgeAccion(aud.accion)}</div>
                      <div className="text-right text-xs font-mono text-muted-foreground">
                        <span>{aud.fecha}</span> • <span>{aud.hora}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-medium text-foreground leading-snug">
                        {aud.movimiento}
                      </div>
                      {aud.valorAnterior && aud.valorNuevo && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {aud.valorAnterior} → {aud.valorNuevo}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-y-1 text-xs pt-1 border-t border-border/50 text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {aud.caja} <span className="text-muted-foreground font-normal">({aud.sucursal.split(' ')[0]})</span>
                      </span>
                      <span>Resp: <strong className="text-foreground font-medium">{aud.usuario}</strong></span>
                    </div>

                    {aud.observacion && (
                      <div className="text-xs text-muted-foreground italic bg-muted/30 px-2 py-1 rounded">
                        Obs: {aud.observacion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
