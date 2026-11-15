import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CuentaPorPagar, AbonoProveedor } from '../types/compras.types';
import { comprasService } from '../services/comprasService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  CreditCard,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  Building2,
  DollarSign,
  PlusCircle,
  Receipt,
  FileText,
  History,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FiltroEstado = 'TODAS' | 'VENCIDAS' | 'POR_VENCER' | 'PAGADAS';

export const CuentasPorPagarView: React.FC = () => {
  const [cuentas, setCuentas] = useState<CuentaPorPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODAS');

  // Modal de Abono
  const [modalAbonoOpen, setModalAbonoOpen] = useState(false);
  const [cuentaParaAbonar, setCuentaParaAbonar] = useState<CuentaPorPagar | null>(null);
  const [montoAbono, setMontoAbono] = useState<number>(0);
  const [metodoPagoAbono, setMetodoPagoAbono] = useState('TRANSFERENCIA');
  const [referenciaOperacion, setReferenciaOperacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de Historial de Pagos
  const [modalHistorialOpen, setModalHistorialOpen] = useState(false);
  const [cuentaHistorial, setCuentaHistorial] = useState<CuentaPorPagar | null>(null);

  const fetchCuentas = async () => {
    setLoading(true);
    try {
      const data = await comprasService.getCuentasPorPagar();
      setCuentas(data);
    } catch {
      toast.error('Error al cargar cuentas por pagar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuentas();
  }, []);

  // Calcular días de vencimiento
  const calcularDias = (fechaVenc: string) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(fechaVenc);
    venc.setHours(0, 0, 0, 0);
    const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Filtrado reactivo
  const filteredCuentas = useMemo(() => {
    return cuentas.filter((c) => {
      const dias = calcularDias(c.fechaVencimiento);
      const estaVencida = dias < 0 && c.saldoPendiente > 0;
      const porVencer = dias >= 0 && dias <= 7 && c.saldoPendiente > 0;
      const estaPagada = c.saldoPendiente <= 0;

      if (filtroEstado === 'VENCIDAS' && !estaVencida) return false;
      if (filtroEstado === 'POR_VENCER' && !porVencer) return false;
      if (filtroEstado === 'PAGADAS' && !estaPagada) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          c.proveedorNombre.toLowerCase().includes(q) ||
          c.proveedorRuc.includes(q) ||
          c.serieFactura.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [cuentas, filtroEstado, searchTerm]);

  // Métricas Consolidadas
  const totalDeuda = useMemo(
    () => cuentas.reduce((sum, c) => sum + (c.saldoPendiente || 0), 0),
    [cuentas]
  );
  const totalVencido = useMemo(
    () =>
      cuentas
        .filter((c) => calcularDias(c.fechaVencimiento) < 0 && c.saldoPendiente > 0)
        .reduce((sum, c) => sum + (c.saldoPendiente || 0), 0),
    [cuentas]
  );
  const totalPorVencer7Dias = useMemo(
    () =>
      cuentas
        .filter((c) => {
          const d = calcularDias(c.fechaVencimiento);
          return d >= 0 && d <= 7 && c.saldoPendiente > 0;
        })
        .reduce((sum, c) => sum + (c.saldoPendiente || 0), 0),
    [cuentas]
  );
  const proveedoresConSaldo = useMemo(() => {
    const provs = new Set(cuentas.filter((c) => c.saldoPendiente > 0).map((c) => c.proveedorRuc));
    return provs.size;
  }, [cuentas]);

  // Abrir Modal de Abono
  const handleAbrirAbono = (cuenta: CuentaPorPagar) => {
    setCuentaParaAbonar(cuenta);
    setMontoAbono(cuenta.saldoPendiente);
    setMetodoPagoAbono('TRANSFERENCIA');
    setReferenciaOperacion(`OP-${Math.floor(100000 + Math.random() * 900000)}`);
    setModalAbonoOpen(true);
  };

  // Registrar Abono
  const handleConfirmarAbono = async () => {
    if (!cuentaParaAbonar) return;
    if (montoAbono <= 0) {
      toast.error('El monto del abono debe ser mayor a cero.');
      return;
    }
    if (montoAbono > cuentaParaAbonar.saldoPendiente) {
      toast.error('El monto del abono no puede superar el saldo pendiente.');
      return;
    }

    setIsSubmitting(true);
    try {
      const nuevoAbono = await comprasService.registrarAbono(cuentaParaAbonar.id, {
        monto: montoAbono,
        metodoPago: metodoPagoAbono,
        referenciaOperacion,
        registradoPor: 'Administrador',
      });

      // Actualizar estado local
      setCuentas((prev) =>
        prev.map((c) => {
          if (c.id === cuentaParaAbonar.id) {
            const nuevoPagado = c.montoPagado + montoAbono;
            const nuevoSaldo = Math.max(0, +(c.montoTotal - nuevoPagado).toFixed(2));
            const nuevoEstado = nuevoSaldo <= 0 ? 'PAGADO' : 'PARCIAL';
            const abonosPrevios = c.historialAbonos || [];
            return {
              ...c,
              montoPagado: nuevoPagado,
              saldoPendiente: nuevoSaldo,
              estado: nuevoEstado,
              historialAbonos: [nuevoAbono, ...abonosPrevios],
            };
          }
          return c;
        })
      );

      toast.success(
        `Abono de ${formatCurrency(montoAbono)} registrado para la factura ${cuentaParaAbonar.serieFactura}.`
      );
      setModalAbonoOpen(false);
    } catch {
      toast.error('Error al registrar el abono.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. KPIs Superiores de Cuentas por Pagar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Deuda a Proveedores"
          value={formatCurrency(totalDeuda)}
          subtitle={`${proveedoresConSaldo} empresas con saldo activo`}
          icon={CreditCard}
          iconColor="text-primary bg-primary/10"
        />
        <MetricCard
          title="Facturas Vencidas / En Mora"
          value={formatCurrency(totalVencido)}
          subtitle="Prioridad crítica de pago"
          icon={AlertTriangle}
          iconColor="text-danger-text bg-danger-soft"
        />
        <MetricCard
          title="Vencimientos (Próximos 7 días)"
          value={formatCurrency(totalPorVencer7Dias)}
          subtitle="Compromisos de la semana"
          icon={Clock}
          iconColor="text-warning-text bg-warning-soft"
        />
        <MetricCard
          title="Proveedores con Crédito"
          value={`${proveedoresConSaldo} activos`}
          subtitle="Con facturas por liquidar"
          icon={Building2}
          iconColor="text-success-text bg-success-soft"
        />
      </div>

      {/* 2. Filtros y Búsqueda */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Buscador */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por proveedor, RUC o serie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs border-border bg-card"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Chips de Estado */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              {[
                { id: 'TODAS', label: 'Todas las facturas' },
                { id: 'VENCIDAS', label: 'Vencidas / En Mora' },
                { id: 'POR_VENCER', label: 'Por vencer (7 días)' },
                { id: 'PAGADAS', label: 'Saldadas' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroEstado(tab.id as FiltroEstado)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap cursor-pointer select-none font-medium',
                    filtroEstado === tab.id
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Tabla Cronológica de Cuentas por Pagar */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Cronograma y Vencimiento de Facturas</span>
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Control de pasivos comerciales, abonos efectuados y días de crédito disponible.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="h-44 rounded-md border border-border flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Cargando cuentas por pagar...</span>
            </div>
          ) : filteredCuentas.length === 0 ? (
            <div className="py-12 px-4 rounded-md border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-success-text/50" />
              <p className="text-xs font-semibold text-foreground">
                No hay cuentas por pagar pendientes en esta vista
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                No se encontraron compromisos que coincidan con los filtros seleccionados. Todas tus obligaciones comerciales están al día.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-border bg-card">
              <Table className="w-full min-w-[850px]">
                <TableHeader className="bg-muted/50">
                  <TableRow className="text-xs">
                    <TableHead className="py-2.5 whitespace-nowrap">Factura</TableHead>
                    <TableHead className="py-2.5 whitespace-nowrap">Proveedor / RUC</TableHead>
                    <TableHead className="py-2.5 whitespace-nowrap">Emisión</TableHead>
                    <TableHead className="py-2.5 whitespace-nowrap">Vencimiento</TableHead>
                    <TableHead className="py-2.5 text-center whitespace-nowrap">Estado Semáforo</TableHead>
                    <TableHead className="py-2.5 text-right whitespace-nowrap">Total Factura</TableHead>
                    <TableHead className="py-2.5 text-right whitespace-nowrap">Saldo Pendiente</TableHead>
                    <TableHead className="py-2.5 text-right w-36 whitespace-nowrap">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCuentas.map((c) => {
                    const dias = calcularDias(c.fechaVencimiento);
                    const estaVencida = dias < 0 && c.saldoPendiente > 0;
                    const porVencer = dias >= 0 && dias <= 7 && c.saldoPendiente > 0;
                    const estaSaldada = c.saldoPendiente <= 0;

                    const porcentajePagado =
                      c.montoTotal > 0 ? Math.min(100, Math.round((c.montoPagado / c.montoTotal) * 100)) : 100;

                    return (
                      <TableRow key={c.id} className="text-xs hover:bg-muted/20">
                        <TableCell className="font-mono font-semibold text-primary py-2.5 whitespace-nowrap">
                          {c.serieFactura}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-semibold text-foreground block">{c.proveedorNombre}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            RUC: {c.proveedorRuc}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground py-2.5 whitespace-nowrap">
                          {formatDate(c.fechaEmision)}
                        </TableCell>
                        <TableCell className="font-mono font-medium py-2.5 whitespace-nowrap">
                          {formatDate(c.fechaVencimiento)}
                        </TableCell>
                        <TableCell className="text-center py-2.5 whitespace-nowrap">
                          {estaSaldada ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-success-soft text-success-text">
                              Saldada (100%)
                            </span>
                          ) : estaVencida ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                              Vencida hace {Math.abs(dias)}d
                            </span>
                          ) : porVencer ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                              Vence en {dias}d
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground">
                              Al día ({dias}d restantes)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-muted-foreground py-2.5 whitespace-nowrap">
                          {formatCurrency(c.montoTotal)}
                        </TableCell>
                        <TableCell className="text-right py-2.5 whitespace-nowrap">
                          <span
                            className={cn(
                              'font-mono font-bold tabular-nums text-xs block',
                              c.saldoPendiente > 0 ? 'text-danger-text' : 'text-success-text'
                            )}
                          >
                            {formatCurrency(c.saldoPendiente)}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Abonado: {porcentajePagado}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-2.5 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {c.saldoPendiente > 0 ? (
                              <Button
                                size="sm"
                                onClick={() => handleAbrirAbono(c)}
                                className="h-7 px-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-hover gap-1 shadow-xs"
                              >
                                <DollarSign className="h-3.5 w-3.5" />
                                <span>Abonar</span>
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCuentaHistorial(c);
                                  setModalHistorialOpen(true);
                                }}
                                className="h-7 px-2 text-xs font-medium text-muted-foreground gap-1"
                              >
                                <History className="h-3.5 w-3.5" />
                                <span>Pagos</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Registro de Abono */}
      <Dialog open={modalAbonoOpen} onOpenChange={setModalAbonoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-primary" />
              <span>Registrar Abono a Proveedor</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Factura {cuentaParaAbonar?.serieFactura} — {cuentaParaAbonar?.proveedorNombre}
            </DialogDescription>
          </DialogHeader>

          {cuentaParaAbonar && (
            <div className="space-y-4 text-xs py-2">
              {/* Tarjeta de Saldo */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border/70 flex justify-between items-center">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                    Saldo Pendiente
                  </span>
                  <span className="text-lg font-bold font-mono text-danger-text">
                    {formatCurrency(cuentaParaAbonar.saldoPendiente)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMontoAbono(cuentaParaAbonar.saldoPendiente)}
                  className="h-7 text-[11px] font-semibold border-primary/40 text-primary"
                >
                  Pagar total
                </Button>
              </div>

              {/* Formulario */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Monto del Abono (S/) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.10"
                    max={cuentaParaAbonar.saldoPendiente}
                    value={montoAbono}
                    onChange={(e) => setMontoAbono(parseFloat(e.target.value) || 0)}
                    className="h-9 text-xs font-mono font-bold text-base"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Medio de Pago *</Label>
                  <Select value={metodoPagoAbono} onValueChange={setMetodoPagoAbono}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRANSFERENCIA" className="text-xs">
                        Transferencia Bancaria (BCP / BBVA / Interbank)
                      </SelectItem>
                      <SelectItem value="EFECTIVO" className="text-xs">
                        Efectivo de Caja Comercial
                      </SelectItem>
                      <SelectItem value="CHEQUE" className="text-xs">
                        Cheque Comercial / Letra de Cambio
                      </SelectItem>
                      <SelectItem value="YAPE_PLIN" className="text-xs">
                        Yape / Plin Empresa
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">N° Operación / Referencia de Pago</Label>
                  <Input
                    value={referenciaOperacion}
                    onChange={(e) => setReferenciaOperacion(e.target.value)}
                    placeholder="Ej. OP-982412 o Recibo N° 45"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalAbonoOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || montoAbono <= 0}
              onClick={handleConfirmarAbono}
              className="text-xs bg-primary text-primary-foreground font-semibold gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirmar Pago de {formatCurrency(montoAbono)}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Historial de Pagos */}
      <Dialog open={modalHistorialOpen} onOpenChange={setModalHistorialOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <History className="h-5 w-5 text-primary" />
              <span>Historial de Abonos</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Factura {cuentaHistorial?.serieFactura} — {cuentaHistorial?.proveedorNombre}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {cuentaHistorial?.historialAbonos && cuentaHistorial.historialAbonos.length > 0 ? (
              <div className="border border-border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="text-xs">
                      <TableHead className="py-2">Fecha</TableHead>
                      <TableHead className="py-2">Medio / Operación</TableHead>
                      <TableHead className="py-2 text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuentaHistorial.historialAbonos.map((abn) => (
                      <TableRow key={abn.id} className="text-xs">
                        <TableCell className="font-mono text-muted-foreground py-2">
                          {formatDate(abn.fecha)}
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="font-semibold block">{abn.metodoPago}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {abn.referenciaOperacion}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-success-text py-2">
                          {formatCurrency(abn.monto)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                Esta factura fue liquidada en un solo pago de contado.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalHistorialOpen(false)}
              className="text-xs"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
