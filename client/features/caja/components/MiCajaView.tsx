import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EstadoCaja, MovimientoCaja } from '../types/caja.types';
import { formatCurrency } from '@/utils/formatters';
import {
  Coins,
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  LockKeyhole,
  Smartphone,
  CreditCard,
  Building,
  User,
  Clock,
  Store,
  ArrowRight,
  TrendingUp,
  Receipt,
} from 'lucide-react';

interface MiCajaViewProps {
  estado: EstadoCaja;
  movimientos: MovimientoCaja[];
  onOpenIngreso: () => void;
  onOpenEgreso: () => void;
  onOpenArqueo: () => void;
  onOpenCierre: () => void;
  onVerTodosMovimientos: () => void;
}

export const MiCajaView: React.FC<MiCajaViewProps> = ({
  estado,
  movimientos,
  onOpenIngreso,
  onOpenEgreso,
  onOpenArqueo,
  onOpenCierre,
  onVerTodosMovimientos,
}) => {
  const ultimosMovimientos = movimientos.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 1. Encabezado de Contexto Operativo y Estado de Caja (Reglas 4, 5, 6) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">
              {estado.nombre}
            </span>
            {/* Estado Semántico con Icono y Texto (Regla 6) */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              🟢 Caja abierta
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Store className="h-3.5 w-3.5 text-primary" />
              {estado.sucursal}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-primary" />
              Responsable: <strong className="text-foreground">{estado.responsable}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Apertura: {estado.horaApertura || '08:00'} ({estado.turno})
            </span>
          </div>
        </div>

        {/* Acceso Rápido al Cierre */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCierre}
          className="text-xs font-semibold border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 gap-1.5 shrink-0"
        >
          <LockKeyhole className="h-3.5 w-3.5" />
          Cerrar turno de caja
        </Button>
      </div>

      {/* 2. TARJETA HERO: SALDO ACTUAL CON LA MÁXIMA JERARQUÍA VISUAL (Regla 5) */}
      <Card className="border border-border shadow-sm bg-gradient-to-b from-card to-muted/20 overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Saldo Gigante */}
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-primary" />
                Saldo disponible en gaveta (Efectivo)
              </span>
              <div className="text-4xl sm:text-5xl font-black text-foreground tracking-tight tabular-nums">
                {formatCurrency(estado.saldoEfectivoEsperado)}
              </div>
              <p className="text-xs text-muted-foreground">
                Iniciado con {formatCurrency(estado.saldoInicial)} de sencillo • Calculado en tiempo real
              </p>
            </div>

            {/* BOTONES DE ACCIÓN PRINCIPALES (Reglas 5 y 31) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
              {/* + INGRESO */}
              <Button
                type="button"
                onClick={onOpenIngreso}
                className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs"
              >
                <ArrowDownCircle className="h-4 w-4 stroke-[2.5]" />
                + INGRESO
              </Button>

              {/* + EGRESO */}
              <Button
                type="button"
                onClick={onOpenEgreso}
                variant="outline"
                className="h-12 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-bold text-xs gap-1.5 shadow-xs"
              >
                <ArrowUpCircle className="h-4 w-4 stroke-[2.5]" />
                + EGRESO
              </Button>

              {/* CONTAR DINERO / ARQUEAR */}
              <Button
                type="button"
                onClick={onOpenArqueo}
                variant="secondary"
                className="h-12 font-bold text-xs gap-1.5 shadow-xs"
              >
                <Calculator className="h-4 w-4 stroke-[2]" />
                CONTAR DINERO
              </Button>

              {/* CERRAR CAJA */}
              <Button
                type="button"
                onClick={onOpenCierre}
                className="h-12 bg-foreground hover:bg-foreground/90 text-background font-bold text-xs gap-1.5 shadow-xs"
              >
                <LockKeyhole className="h-4 w-4 stroke-[2]" />
                CERRAR CAJA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Métricas Operativas de Flujo (Regla 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Ventas en Efectivo */}
        <Card className="border border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              Ventas en efectivo
            </span>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums">
              + {formatCurrency(estado.ventasEfectivo)}
            </div>
            <span className="text-[11px] text-muted-foreground">
              Total vendido por comprobantes en mano
            </span>
          </CardContent>
        </Card>

        {/* Otros Ingresos */}
        <Card className="border border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <ArrowDownCircle className="h-3.5 w-3.5 text-primary" />
              Otros ingresos
            </span>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              + {formatCurrency(estado.otrosIngresosEfectivo)}
            </div>
            <span className="text-[11px] text-muted-foreground">
              Aportes de sencillo y cobranzas
            </span>
          </CardContent>
        </Card>

        {/* Egresos */}
        <Card className="border border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <ArrowUpCircle className="h-3.5 w-3.5 text-rose-600" />
              Egresos / Gastos
            </span>
            <div className="text-2xl font-bold text-rose-600 tabular-nums">
              - {formatCurrency(estado.egresosEfectivo)}
            </div>
            <span className="text-[11px] text-muted-foreground">
              Compras menores y pagos desde caja
            </span>
          </CardContent>
        </Card>
      </div>

      {/* 4. Distribución por Métodos de Pago (Regla 5 y 14) */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-foreground">
                Cobros por métodos de pago hoy
              </h3>
              <p className="text-xs text-muted-foreground">
                Efectivo recibido en caja más billeteras digitales y tarjetas del día.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground block">Total General Ventas:</span>
              <span className="text-sm font-bold text-primary tabular-nums">
                {formatCurrency(estado.totalVentasGeneral)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {/* Efectivo */}
            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-1">
              <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-amber-700" />
                Efectivo
              </span>
              <div className="text-lg font-bold text-amber-950 tabular-nums">
                {formatCurrency(estado.ventasEfectivo)}
              </div>
              <span className="text-[10px] text-amber-800/80">En gaveta</span>
            </div>

            {/* Yape */}
            <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200/60 space-y-1">
              <span className="text-[11px] font-semibold text-purple-900 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-purple-700" />
                Yape
              </span>
              <div className="text-lg font-bold text-purple-950 tabular-nums">
                {formatCurrency(estado.ventasDigitales.yape)}
              </div>
              <span className="text-[10px] text-purple-800/80">Billetera BCP</span>
            </div>

            {/* Plin */}
            <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-200/60 space-y-1">
              <span className="text-[11px] font-semibold text-sky-900 flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-sky-700" />
                Plin
              </span>
              <div className="text-lg font-bold text-sky-950 tabular-nums">
                {formatCurrency(estado.ventasDigitales.plin)}
              </div>
              <span className="text-[10px] text-sky-800/80">Interbank / BBVA</span>
            </div>

            {/* Tarjeta POS */}
            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/60 space-y-1">
              <span className="text-[11px] font-semibold text-blue-900 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-blue-700" />
                Tarjeta POS
              </span>
              <div className="text-lg font-bold text-blue-950 tabular-nums">
                {formatCurrency(estado.ventasDigitales.tarjeta)}
              </div>
              <span className="text-[10px] text-blue-800/80">Izipay / Niubiz</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Últimos Movimientos Rápidos */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-foreground">
                Últimos movimientos del turno
              </h3>
              <p className="text-xs text-muted-foreground">
                Operaciones más recientes registradas en esta caja.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onVerTodosMovimientos}
              className="text-xs font-semibold text-primary hover:text-primary gap-1"
            >
              <span>Ver todos los movimientos</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="divide-y divide-border/60">
            {ultimosMovimientos.map((mov) => {
              const esIngreso = mov.tipo === 'INGRESO';
              return (
                <div
                  key={mov.id}
                  className="py-2.5 flex items-center justify-between text-xs hover:bg-muted/20 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                        esIngreso
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {esIngreso ? (
                        <ArrowDownCircle className="h-4 w-4" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4" />
                      )}
                    </span>
                    <div>
                      <div className="font-semibold text-foreground line-clamp-1">
                        {mov.concepto}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <span>{mov.hora || mov.fecha}</span>
                        <span>•</span>
                        <span>{mov.metodo}</span>
                        {mov.comprobanteRef && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-primary font-medium">
                              {mov.comprobanteRef}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-bold tabular-nums text-xs ${
                        esIngreso ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {esIngreso ? '+' : '-'} {formatCurrency(mov.monto)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {mov.usuario}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
