import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { OperacionCajaDialog } from '../components/OperacionCajaDialog';
import { cajaService } from '../services/cajaService';
import { EstadoCaja, MovimientoCaja, NuevaOperacionCajaPayload, TipoOperacionCaja } from '../types/caja.types';
import { subscribeToErp } from '@/services/erp/erpStore';
import { formatCurrency } from '@/utils/formatters';
import {
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  Wallet,
  Smartphone,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export const CajaPage: React.FC = () => {
  const [estado, setEstado] = useState<EstadoCaja | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [modalTipo, setModalTipo] = useState<TipoOperacionCaja>('INGRESO');

  const fetchCaja = async () => {
    setLoading(true);
    try {
      const [est, movs] = await Promise.all([
        cajaService.getEstado(),
        cajaService.getMovimientos(),
      ]);
      setEstado(est);
      setMovimientos(movs);
    } catch {
      toast.error('Error al cargar datos de caja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaja();
    const unsubscribe = subscribeToErp(() => {
      fetchCaja();
    });
    return unsubscribe;
  }, []);

  const handleOpenDialog = (tipo: TipoOperacionCaja) => {
    setModalTipo(tipo);
    setOpenModal(true);
  };

  const handleOperacion = async (payload: NuevaOperacionCajaPayload) => {
    try {
      const nuevo = await cajaService.registrarOperacion(payload);
      setMovimientos((prev) => [nuevo, ...prev]);
      // Refrescar estado consolidado
      const estActual = await cajaService.getEstado();
      setEstado(estActual);
      toast.success(
        `${payload.tipo === 'INGRESO' ? 'Ingreso' : 'Retiro'} de ${formatCurrency(payload.monto)} registrado`
      );
    } catch {
      toast.error('No se pudo registrar la operación de caja');
    }
  };

  const handleCerrarCaja = async () => {
    if (!window.confirm('¿Está seguro de cerrar el turno de caja actual? Se generará el resumen de arqueo.')) {
      return;
    }
    try {
      const est = await cajaService.cerrarTurno();
      setEstado(est);
      toast.success('Turno de caja cerrado exitosamente.');
    } catch {
      toast.error('Error al cerrar caja');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control de Caja y Arqueo Diario"
        description="Conciliación de pagos en efectivo, transferencias bancarias y cobros por billeteras digitales"
        badge={estado?.abierta ? 'Turno Abierto' : 'Turno Cerrado'}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenDialog('INGRESO')}
          className="gap-2"
        >
          <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
          <span>Ingreso a Caja</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenDialog('EGRESO')}
          className="gap-2"
        >
          <ArrowUpCircle className="h-4 w-4 text-rose-600" />
          <span>Retiro / Salida</span>
        </Button>

        <Button
          size="sm"
          onClick={handleCerrarCaja}
          disabled={!estado?.abierta}
          className="gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
        >
          <Lock className="h-4 w-4" />
          <span>Cierre de Turno</span>
        </Button>
      </PageHeader>

      {/* Arqueo de Caja Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Saldo Inicial (Apertura)"
          value={formatCurrency(estado?.saldoInicial ?? 0)}
          subtitle={estado?.turno ?? 'Turno Activo'}
          icon={Wallet}
          iconColor="text-slate-700 bg-slate-100 dark:bg-slate-800"
        />

        <MetricCard
          title="Cobros Digitales (Yape/Tarj.)"
          value={formatCurrency(estado?.ingresosDigitales ?? 0)}
          subtitle="Directo a cuenta bancaria"
          icon={Smartphone}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40"
        />

        <MetricCard
          title="Gastos / Retiros Efectivo"
          value={formatCurrency(estado?.egresosEfectivo ?? 0)}
          subtitle="Pagos menores en caja"
          icon={ArrowUpCircle}
          iconColor="text-rose-600 bg-rose-50 dark:bg-rose-950/40"
        />

        <MetricCard
          title="Efectivo Esperado en Gaveta"
          value={formatCurrency(estado?.saldoEfectivoEsperado ?? 0)}
          subtitle="A cuadrar en conteo físico"
          icon={DollarSign}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
        />
      </div>

      {/* Historial de Movimientos de Caja */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground">
            Movimientos y Cobranzas del Turno Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-slate-100/90 dark:bg-slate-800/90 border-b border-border">
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Hora Registro</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Tipo Operación</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Concepto / Glosa</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Medio de Pago</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-right py-2.5">Monto de Operación</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-right py-2.5">Operador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      Cargando movimientos de caja...
                    </TableCell>
                  </TableRow>
                ) : movimientos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      No se han registrado operaciones en este turno de caja.
                    </TableCell>
                  </TableRow>
                ) : (
                  movimientos.map((mov) => {
                    const isIngreso = mov.tipo === 'INGRESO';
                    return (
                      <TableRow key={mov.id} className="text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-border/70 transition-colors">
                        <TableCell className="font-mono text-muted-foreground font-semibold py-2.5">
                          {mov.fecha}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <StatusBadge
                            status={mov.tipo}
                            variant={isIngreso ? 'success' : 'danger'}
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-foreground py-2.5">
                          {mov.concepto}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-muted border border-border/60">
                            {mov.metodo}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-black font-mono py-2.5 text-[14px] tabular-nums ${isIngreso ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                          {isIngreso ? `+${formatCurrency(mov.monto)}` : `-${formatCurrency(mov.monto)}`}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground py-2.5 text-xs font-medium">
                          {mov.usuario}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <OperacionCajaDialog
        open={openModal}
        onOpenChange={setOpenModal}
        tipoInicial={modalTipo}
        onOperacionRegistrada={handleOperacion}
      />
    </div>
  );
};

export default CajaPage;
