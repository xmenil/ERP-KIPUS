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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-card border border-border/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">
              {estado.nombre}
            </span>
            {/* Estado Semántico con Icono y Texto (Regla 6) */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-success-soft text-success-text border border-success/30">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Caja abierta
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
          className="h-8 text-xs font-medium border-border text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5 shrink-0"
        >
          <LockKeyhole className="h-3.5 w-3.5" />
          <span>Cerrar turno de caja</span>
        </Button>
      </div>

      {/* 2. TARJETA HERO: SALDO ACTUAL CON JERARQUÍA EQUILIBRADA Y ELEGANTE */}
      <Card className="border border-border/80 shadow-xs bg-card overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Saldo más delgado y proporcionado */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-primary" />
                Saldo disponible en gaveta (Efectivo)
              </span>
              <div className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight tabular-nums">
                {formatCurrency(estado.saldoEfectivoEsperado)}
              </div>
              <p className="text-xs text-muted-foreground">
                Iniciado con {formatCurrency(estado.saldoInicial)} de sencillo • Calculado en tiempo real
              </p>
            </div>

            {/* BOTONES DE ACCIÓN DISCRETOS Y ERGONÓMICOS (Grid 2x2 en móvil, en línea en desktop) */}
            <div className="grid grid-cols-2 sm:flex sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
              {/* Ingreso */}
              <Button
                type="button"
                size="sm"
                onClick={onOpenIngreso}
                variant="outline"
                className="h-10 sm:h-9 px-3.5 border-border hover:bg-muted text-foreground font-medium text-xs gap-1.5 rounded-md justify-center"
              >
                <ArrowDownCircle className="h-3.5 w-3.5 text-primary" />
                <span>Ingreso</span>
              </Button>

              {/* Egreso */}
              <Button
                type="button"
                size="sm"
                onClick={onOpenEgreso}
                variant="outline"
                className="h-10 sm:h-9 px-3.5 border-border hover:bg-muted text-foreground font-medium text-xs gap-1.5 rounded-md justify-center"
              >
                <ArrowUpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Egreso</span>
              </Button>

              {/* Contar dinero / Arquear */}
              <Button
                type="button"
                size="sm"
                onClick={onOpenArqueo}
                variant="outline"
                className="h-10 sm:h-9 px-3.5 border-border hover:bg-muted text-foreground font-medium text-xs gap-1.5 rounded-md justify-center"
              >
                <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Contar dinero</span>
              </Button>

              {/* Cerrar caja */}
              <Button
                type="button"
                size="sm"
                onClick={onOpenCierre}
                className="h-10 sm:h-9 px-3.5 font-medium text-xs gap-1.5 rounded-md justify-center"
              >
                <LockKeyhole className="h-3.5 w-3.5" />
                <span>Cerrar caja</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Métricas Operativas de Flujo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Ventas en Efectivo */}
        <Card className="border border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              Ventas en efectivo
            </span>
            <div className="text-xl font-semibold text-success-text tabular-nums">
              + {formatCurrency(estado.ventasEfectivo)}
            </div>
            <span className="text-xs text-muted-foreground">
              Total vendido por comprobantes en mano
            </span>
          </CardContent>
        </Card>

        {/* Otros Ingresos */}
        <Card className="border border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ArrowDownCircle className="h-3.5 w-3.5 text-primary" />
              Otros ingresos
            </span>
            <div className="text-xl font-semibold text-foreground tabular-nums">
              + {formatCurrency(estado.otrosIngresosEfectivo)}
            </div>
            <span className="text-xs text-muted-foreground">
              Aportes de sencillo y cobranzas
            </span>
          </CardContent>
        </Card>

        {/* Egresos */}
        <Card className="border border-border/80 shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ArrowUpCircle className="h-3.5 w-3.5 text-destructive" />
              Egresos / Gastos
            </span>
            <div className="text-xl font-semibold text-danger-text tabular-nums">
              - {formatCurrency(estado.egresosEfectivo)}
            </div>
            <span className="text-xs text-muted-foreground">
              Compras menores y pagos desde caja
            </span>
          </CardContent>
        </Card>
      </div>

      {/* 4. Distribución por Métodos de Pago */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">
                Cobros por métodos de pago hoy
              </h3>
              <p className="text-xs text-muted-foreground">
                Efectivo recibido en caja más billeteras digitales y tarjetas del día.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground block">Total General Ventas:</span>
              <span className="text-sm font-semibold text-primary tabular-nums">
                {formatCurrency(estado.totalVentasGeneral)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {/* Efectivo */}
            <div className="p-3 rounded-md bg-muted/30 border border-border space-y-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                Efectivo
              </span>
              <div className="text-base font-semibold text-foreground tabular-nums">
                {formatCurrency(estado.ventasEfectivo)}
              </div>
              <span className="text-[11px] text-muted-foreground">En gaveta</span>
            </div>

            {/* Yape */}
            <div className="p-3 rounded-md bg-muted/30 border border-border space-y-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                Yape
              </span>
              <div className="text-base font-semibold text-foreground tabular-nums">
                {formatCurrency(estado.ventasDigitales.yape)}
              </div>
              <span className="text-[11px] text-muted-foreground">Billetera BCP</span>
            </div>

            {/* Plin */}
            <div className="p-3 rounded-md bg-muted/30 border border-border space-y-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                Plin
              </span>
              <div className="text-base font-semibold text-foreground tabular-nums">
                {formatCurrency(estado.ventasDigitales.plin)}
              </div>
              <span className="text-[11px] text-muted-foreground">Interbank / BBVA</span>
            </div>

            {/* Tarjeta POS */}
            <div className="p-3 rounded-md bg-muted/30 border border-border space-y-1">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                Tarjeta POS
              </span>
              <div className="text-base font-semibold text-foreground tabular-nums">
                {formatCurrency(estado.ventasDigitales.tarjeta)}
              </div>
              <span className="text-[11px] text-muted-foreground">Izipay / Niubiz</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Últimos Movimientos Rápidos */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">
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
              className="text-xs font-medium text-primary hover:text-primary gap-1"
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
                  className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-muted/20 px-2 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 border ${
                        esIngreso
                          ? 'bg-success-soft text-success-text border-success/20'
                          : 'bg-danger-soft text-danger-text border-destructive/20'
                      }`}
                    >
                      {esIngreso ? (
                        <ArrowDownCircle className="h-4 w-4" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground truncate">
                        {mov.concepto}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                        <span>{mov.hora || mov.fecha}</span>
                        <span>•</span>
                        <span>{mov.metodo}</span>
                        {mov.comprobanteRef && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-primary font-medium truncate">
                              {mov.comprobanteRef}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-semibold tabular-nums text-xs font-mono block ${
                        esIngreso ? 'text-success-text' : 'text-danger-text'
                      }`}
                    >
                      {esIngreso ? '+' : '-'} {formatCurrency(mov.monto)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
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
