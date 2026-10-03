import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CajaInfo } from '../types/caja.types';
import { formatCurrency } from '@/utils/formatters';
import {
  Store,
  Coins,
  TrendingUp,
  User,
  Clock,
  Eye,
  CheckCircle2,
  LockKeyhole,
  Building,
  ShieldAlert,
} from 'lucide-react';

interface GestionCajasViewProps {
  cajas: CajaInfo[];
  onSeleccionarCaja?: (caja: CajaInfo) => void;
}

export const GestionCajasView: React.FC<GestionCajasViewProps> = ({
  cajas,
  onSeleccionarCaja,
}) => {
  const [sucursalFiltro, setSucursalFiltro] = useState<string>('TODAS');

  const sucursalesUnicas = useMemo(() => {
    const set = new Set<string>();
    cajas.forEach((c) => set.add(c.sucursal));
    return Array.from(set);
  }, [cajas]);

  const cajasFiltradas = useMemo(() => {
    if (sucursalFiltro === 'TODAS') return cajas;
    return cajas.filter((c) => c.sucursal === sucursalFiltro);
  }, [cajas, sucursalFiltro]);

  // Métricas consolidadas
  const totalCajas = cajasFiltradas.length;
  const abiertas = cajasFiltradas.filter((c) => c.abierta).length;
  const cerradas = totalCajas - abiertas;
  const saldoTotalEfectivo = cajasFiltradas.reduce((acc, c) => acc + c.saldoActualEfectivo, 0);
  const ventasTotalesDia = cajasFiltradas.reduce((acc, c) => acc + c.ventasDia, 0);

  return (
    <div className="space-y-6">
      {/* Barra de Filtros por Sucursal */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-foreground">
              Filtrar cajas por sucursal:
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-lg border border-border/60 overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSucursalFiltro('TODAS')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                sucursalFiltro === 'TODAS'
                  ? 'bg-card text-foreground shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todas las sedes ({cajas.length})
            </button>
            {sucursalesUnicas.map((suc) => (
              <button
                key={suc}
                type="button"
                onClick={() => setSucursalFiltro(suc)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                  sucursalFiltro === suc
                    ? 'bg-card text-foreground shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {suc}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas Consolidadas de la Sucursal */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Cajas abiertas
            </span>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums">
              {abiertas} <span className="text-xs font-normal text-muted-foreground">de {totalCajas}</span>
            </div>
            <span className="text-[10px] text-muted-foreground block">
              {cerradas} cajas cerradas
            </span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Efectivo en red
            </span>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {formatCurrency(saldoTotalEfectivo)}
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Total disponible en gavetas
            </span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Ventas del día (Red)
            </span>
            <div className="text-2xl font-bold text-primary tabular-nums">
              {formatCurrency(ventasTotalesDia)}
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Suma de todos los canales
            </span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground block">
              Auditoría y control
            </span>
            <div className="text-sm font-bold text-foreground pt-1 flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Cajas sincronizadas
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Sin descuadres críticos activos
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Cajas Operativas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cajasFiltradas.map((caja) => {
          return (
            <Card
              key={caja.id}
              className={`border transition-all hover:border-primary/50 shadow-xs ${
                caja.abierta
                  ? 'border-border bg-card'
                  : 'border-border/60 bg-muted/20 opacity-80'
              }`}
            >
              <CardContent className="p-5 space-y-4">
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-foreground line-clamp-1">
                      {caja.nombre}
                    </h4>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      {caja.sucursal}
                    </span>
                  </div>

                  {/* Estado con Texto y Color (Regla 6) */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                      caja.abierta
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        caja.abierta ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                    {caja.abierta ? '🟢 Abierta' : '🔴 Cerrada'}
                  </span>
                </div>

                {/* Datos Operativos */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/60 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> Cajero:
                    </span>
                    <span className="font-semibold text-foreground">
                      {caja.responsableActual}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Coins className="h-3 w-3" /> Saldo en gaveta:
                    </span>
                    <span className="font-bold text-foreground tabular-nums">
                      {formatCurrency(caja.saldoActualEfectivo)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Ventas del turno:
                    </span>
                    <span className="font-semibold text-primary tabular-nums">
                      {formatCurrency(caja.ventasDia)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> Última actividad:
                    </span>
                    <span>{caja.ultimaActividad}</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-semibold gap-1.5"
                    onClick={() => onSeleccionarCaja && onSeleccionarCaja(caja)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Consultar movimientos
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
