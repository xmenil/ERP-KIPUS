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
import { Cliente, AbonoCliente } from '../types/clientes.types';
import { clientesService } from '../services/clientesService';
import { ticketPrintService } from '@/features/ventas/services/ticketPrintService';
import { VentaTicketData } from '@/features/ventas/types/ticket.types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  CreditCard,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  DollarSign,
  Printer,
  MessageSquare,
  Phone,
  FileSpreadsheet,
  X,
  History,
  Receipt,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CuentasPorCobrarFiadosViewProps {
  clienteInicialId?: string | null;
}

export const CuentasPorCobrarFiadosView: React.FC<CuentasPorCobrarFiadosViewProps> = ({
  clienteInicialId = null,
}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'EN_MORA' | 'POR_VENCER'>('TODOS');

  // Modal de Abono
  const [modalAbonoOpen, setModalAbonoOpen] = useState(false);
  const [clienteAbono, setClienteAbono] = useState<Cliente | null>(null);
  const [montoAbono, setMontoAbono] = useState<number>(0);
  const [metodoPagoAbono, setMetodoPagoAbono] = useState('EFECTIVO');
  const [referenciaAbono, setReferenciaAbono] = useState('');
  const [imprimirTicket, setImprimirTicket] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recibo Térmico Generado
  const [ultimoAbono, setUltimoAbono] = useState<AbonoCliente | null>(null);
  const [modalTicketOpen, setModalTicketOpen] = useState(false);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const data = await clientesService.getClientes();
      setClientes(data);
    } catch {
      toast.error('Error al cargar la lista de fiados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Si se pasó un cliente inicial, abrir su modal de abono
  useEffect(() => {
    if (clienteInicialId && clientes.length > 0) {
      const match = clientes.find((c) => c.id === clienteInicialId);
      if (match && match.saldoPendiente > 0) {
        handleAbrirAbono(match);
      }
    }
  }, [clienteInicialId, clientes]);

  // Filtrar únicamente los clientes que tienen deuda o saldo pendiente
  const clientesConDeuda = useMemo(() => {
    return clientes.filter((c) => (c.saldoPendiente || 0) > 0);
  }, [clientes]);

  const filteredFiados = useMemo(() => {
    return clientesConDeuda.filter((c) => {
      const limite = c.limiteCredito || 300;
      const excedeLimite = c.saldoPendiente >= limite;

      if (filtroEstado === 'EN_MORA' && !excedeLimite) return false;
      if (filtroEstado === 'POR_VENCER' && excedeLimite) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          c.nombre.toLowerCase().includes(q) ||
          c.numeroDocumento.includes(q) ||
          c.telefono.includes(q)
        );
      }
      return true;
    });
  }, [clientesConDeuda, filtroEstado, searchTerm]);

  // Métricas Clave de Cobranza
  const totalPorCobrar = useMemo(
    () => clientesConDeuda.reduce((sum, c) => sum + (c.saldoPendiente || 0), 0),
    [clientesConDeuda]
  );
  const clientesEnMora = useMemo(
    () => clientesConDeuda.filter((c) => c.saldoPendiente >= (c.limiteCredito || 300)).length,
    [clientesConDeuda]
  );
  const montoEnMora = useMemo(
    () =>
      clientesConDeuda
        .filter((c) => c.saldoPendiente >= (c.limiteCredito || 300))
        .reduce((sum, c) => sum + c.saldoPendiente, 0),
    [clientesConDeuda]
  );

  const handleAbrirAbono = (cli: Cliente) => {
    setClienteAbono(cli);
    setMontoAbono(cli.saldoPendiente);
    setMetodoPagoAbono('EFECTIVO');
    setReferenciaAbono(`ABN-${Math.floor(1000 + Math.random() * 9000)}`);
    setModalAbonoOpen(true);
  };

  const handleConfirmarAbono = async () => {
    if (!clienteAbono) return;
    if (montoAbono <= 0) {
      toast.error('El monto del abono debe ser mayor a S/ 0.00.');
      return;
    }
    if (montoAbono > clienteAbono.saldoPendiente) {
      toast.error('El monto no puede superar el saldo adeudado.');
      return;
    }

    setIsSubmitting(true);
    try {
      const abono = await clientesService.registrarAbonoCliente(clienteAbono.id, {
        monto: montoAbono,
        metodoPago: metodoPagoAbono,
        referenciaComprobante: referenciaAbono,
        cajero: 'Cajero de Turno',
      });

      // Actualizar estado local
      setClientes((prev) =>
        prev.map((c) =>
          c.id === clienteAbono.id ? { ...c, saldoPendiente: abono.saldoRestante } : c
        )
      );

      setUltimoAbono(abono);
      setModalAbonoOpen(false);

      if (imprimirTicket) {
        setModalTicketOpen(true);
      }

      toast.success(
        `Abono de ${formatCurrency(montoAbono)} registrado para ${clienteAbono.nombre}. Saldo restante: ${formatCurrency(abono.saldoRestante)}.`
      );
    } catch {
      toast.error('No se pudo registrar el abono.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImprimirTicketTermico = () => {
    if (!ultimoAbono) return;
    try {
      const ticketData: VentaTicketData = {
        empresa: {
          ruc: '20601234567',
          razonSocial: "KIPU'S ERP S.A.C.",
          nombreComercial: "KIPU'S MINIMARKET",
          direccionFiscal: 'Jr. Huallaga 450, Tingo María',
          telefono: '+51 987 654 321',
          correo: 'contacto@kipus.pe',
        },
        comprobante: {
          id: ultimoAbono.id,
          tipoComprobante: 'RECIBO DE ABONO',
          serieCorrelativo: ultimoAbono.referenciaComprobante || 'REC-ABONO',
          fecha: ultimoAbono.fecha,
          hora: ultimoAbono.hora,
        },
        cajero: ultimoAbono.cajero,
        sucursal: "Local Central - KIPU'S",
        cliente: {
          nombre: ultimoAbono.clienteNombre,
          documento: ultimoAbono.clienteDocumento,
        },
        items: [
          {
            sku: 'ABN-CTA',
            nombre: `Abono a Cuenta Fiado (Resta: ${formatCurrency(ultimoAbono.saldoRestante)})`,
            cantidad: 1,
            precioUnitario: ultimoAbono.montoAbonado,
            subtotal: ultimoAbono.montoAbonado,
          },
        ],
        totales: {
          opGravada: +(ultimoAbono.montoAbonado / 1.18).toFixed(2),
          opExonerada: 0,
          igv: +(ultimoAbono.montoAbonado - ultimoAbono.montoAbonado / 1.18).toFixed(2),
          descuento: 0,
          total: ultimoAbono.montoAbonado,
          totalEnLetras: `${ultimoAbono.montoAbonado.toFixed(2)} SOLES`,
        },
        pago: {
          metodoPago: ultimoAbono.metodoPago,
          montoRecibido: ultimoAbono.montoAbonado,
          vuelto: 0,
        },
        pie: {
          mensaje: '¡Gracias por su puntual abono! Conserve este recibo.',
          resolucionSunat: 'Constancia de pago a cuenta corriente comercial',
        },
      };

      ticketPrintService.imprimirTicket(ticketData);
      toast.success('Ticket de abono enviado a impresión térmica.');
    } catch {
      window.print();
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. KPIs Superiores de Fiados y Cuentas por Cobrar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total por Cobrar (Fiados)"
          value={formatCurrency(totalPorCobrar)}
          subtitle={`${clientesConDeuda.length} clientes con deuda activa`}
          icon={CreditCard}
          iconColor="text-danger-text bg-danger-soft"
        />
        <MetricCard
          title="Créditos al Límite / Mora"
          value={formatCurrency(montoEnMora)}
          subtitle={`${clientesEnMora} clientes con límite alcanzado`}
          icon={AlertTriangle}
          iconColor="text-warning-text bg-warning-soft"
        />
        <MetricCard
          title="Clientes con Línea Abierta"
          value={`${clientes.length - clientesEnMora} con cupo`}
          subtitle="Crédito disponible para venta"
          icon={CheckCircle2}
          iconColor="text-success-text bg-success-soft"
        />
        <MetricCard
          title="Cobranza Activa"
          value={`${clientesConDeuda.length} en cartera`}
          subtitle="Seguimiento de tesorería"
          icon={Clock}
          iconColor="text-primary bg-primary/10"
        />
      </div>

      {/* 2. Filtros y Búsqueda */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente con deuda por nombre o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs border-border bg-card"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Chips de Estado de Cobranza */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              {[
                { id: 'TODOS', label: `Todos los fiados (${clientesConDeuda.length})` },
                { id: 'EN_MORA', label: `Límite alcanzado (${clientesEnMora})` },
                { id: 'POR_VENCER', label: `Con cupo restante (${clientesConDeuda.length - clientesEnMora})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroEstado(tab.id as any)}
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

      {/* 3. Tabla de Fiados y Cuentas por Cobrar */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-primary" />
                <span>Libro Digital de Fiados y Créditos de Clientes</span>
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Control de saldos deudores, registro de abonos parciales/totales e impresión térmica de constancias.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="h-44 rounded-md border border-border flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Cargando libro de fiados...</span>
            </div>
          ) : filteredFiados.length === 0 ? (
            <div className="py-12 px-4 rounded-md border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-success-text/50" />
              <p className="text-xs font-semibold text-foreground">
                No hay saldos pendientes de cobro
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Todos tus clientes están al día con sus pagos o no hay coincidencias con los filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-border bg-card">
              <Table className="w-full min-w-[850px]">
                <TableHeader className="bg-muted/50">
                  <TableRow className="text-xs">
                    <TableHead className="py-2.5 whitespace-nowrap">Documento</TableHead>
                    <TableHead className="py-2.5 whitespace-nowrap">Cliente / Razón Social</TableHead>
                    <TableHead className="py-2.5 whitespace-nowrap">Contacto / WhatsApp</TableHead>
                    <TableHead className="py-2.5 text-center whitespace-nowrap">Límite Autorizado</TableHead>
                    <TableHead className="py-2.5 text-right whitespace-nowrap">Saldo Adeudado</TableHead>
                    <TableHead className="py-2.5 text-center whitespace-nowrap">Uso de Crédito</TableHead>
                    <TableHead className="py-2.5 text-right w-44 whitespace-nowrap">Acciones de Cobro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiados.map((cli) => {
                    const limite = cli.limiteCredito || 300;
                    const porcentajeUso = Math.min(100, Math.round((cli.saldoPendiente / limite) * 100));
                    const esCritico = porcentajeUso >= 90;
                    const cleanPhone = cli.telefono ? cli.telefono.replace(/\s+/g, '') : '';
                    const mensajeWhatsapp = encodeURIComponent(
                      `Estimado/a ${cli.nombre}, un cordial saludo de KIPU'S ERP. Le recordamos amablemente que registra un saldo pendiente de ${formatCurrency(cli.saldoPendiente)}. Puede acercarse al local o abonar por transferencia. ¡Muchas gracias!`
                    );

                    return (
                      <TableRow key={cli.id} className="text-xs hover:bg-muted/20">
                        <TableCell className="py-2.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-primary block text-xs">
                            {cli.numeroDocumento}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{cli.documentoTipo}</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-semibold text-foreground block">{cli.nombre}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {cli.direccion || 'Sin dirección registrada'}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 whitespace-nowrap">
                          {cleanPhone ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${cleanPhone}`}
                                className="font-mono text-muted-foreground hover:text-foreground flex items-center gap-1"
                                title="Llamar"
                              >
                                <Phone className="h-3 w-3" />
                                <span>{cli.telefono}</span>
                              </a>
                              <a
                                href={`https://wa.me/51${cleanPhone}?text=${mensajeWhatsapp}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded bg-success-soft text-success-text hover:bg-success-soft/80"
                                title="Enviar recordatorio cordial por WhatsApp"
                              >
                                <MessageSquare className="h-3 w-3" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">Sin teléfono</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono tabular-nums text-muted-foreground py-2.5 whitespace-nowrap">
                          {formatCurrency(limite)}
                        </TableCell>
                        <TableCell className="text-right py-2.5 whitespace-nowrap">
                          <span className="font-mono font-bold tabular-nums text-sm text-danger-text block">
                            {formatCurrency(cli.saldoPendiente)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2.5 whitespace-nowrap">
                          <div className="w-28 mx-auto space-y-1">
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                style={{ width: `${porcentajeUso}%` }}
                                className={cn(
                                  'h-full transition-all',
                                  esCritico ? 'bg-danger' : porcentajeUso > 60 ? 'bg-amber-500' : 'bg-primary'
                                )}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {porcentajeUso}% utilizado
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-2.5 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleAbrirAbono(cli)}
                              className="h-7 px-2.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-hover gap-1 shadow-xs"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>Abonar</span>
                            </Button>
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
              <span>Registrar Abono a Fiado</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cliente: {clienteAbono?.nombre} ({clienteAbono?.documentoTipo}: {clienteAbono?.numeroDocumento})
            </DialogDescription>
          </DialogHeader>

          {clienteAbono && (
            <div className="space-y-4 text-xs py-2">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/70 flex justify-between items-center">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                    Saldo Adeudado Total
                  </span>
                  <span className="text-lg font-bold font-mono text-danger-text">
                    {formatCurrency(clienteAbono.saldoPendiente)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMontoAbono(clienteAbono.saldoPendiente)}
                  className="h-7 text-[11px] font-semibold border-primary/40 text-primary"
                >
                  Liquidar todo
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Monto del Abono (S/) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.10"
                    max={clienteAbono.saldoPendiente}
                    value={montoAbono}
                    onChange={(e) => setMontoAbono(parseFloat(e.target.value) || 0)}
                    className="h-9 text-xs font-mono font-bold text-base"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Saldo restante tras abono:{' '}
                    <strong className="text-foreground">
                      {formatCurrency(Math.max(0, clienteAbono.saldoPendiente - montoAbono))}
                    </strong>
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Medio de Pago *</Label>
                  <Select value={metodoPagoAbono} onValueChange={setMetodoPagoAbono}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EFECTIVO" className="text-xs">
                        Efectivo en Caja Comercial (Suma a caja activa)
                      </SelectItem>
                      <SelectItem value="YAPE" className="text-xs">
                        Yape / Plin
                      </SelectItem>
                      <SelectItem value="TRANSFERENCIA" className="text-xs">
                        Transferencia Bancaria
                      </SelectItem>
                      <SelectItem value="TARJETA" className="text-xs">
                        Tarjeta Débito
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">N° Recibo / Operación</Label>
                  <Input
                    value={referenciaAbono}
                    onChange={(e) => setReferenciaAbono(e.target.value)}
                    placeholder="Ej. ABN-1049 o Recibo Manual N° 24"
                    className="h-9 text-xs font-mono uppercase"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="imprimirTicketCheck"
                    checked={imprimirTicket}
                    onChange={(e) => setImprimirTicket(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <Label htmlFor="imprimirTicketCheck" className="text-xs cursor-pointer">
                    Imprimir constancia de abono en ticketera térmica
                  </Label>
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
              <span>Confirmar Abono de {formatCurrency(montoAbono)}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Vista Previa / Impresión de Ticket Térmico de Abono */}
      <Dialog open={modalTicketOpen} onOpenChange={setModalTicketOpen}>
        <DialogContent className="max-w-xs p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-center">
              Constancia de Abono a Cuenta
            </DialogTitle>
          </DialogHeader>

          {ultimoAbono && (
            <div className="p-4 bg-muted/40 rounded-lg border border-border/80 font-mono text-[11px] space-y-2 text-foreground">
              <div className="text-center border-b border-dashed border-border pb-2 space-y-0.5">
                <p className="font-bold text-xs">KIPU'S ERP</p>
                <p className="text-[10px] text-muted-foreground">Local Central - Tingo María</p>
                <p className="text-[10px] text-muted-foreground">RUC: 20601234567</p>
              </div>

              <div className="border-b border-dashed border-border pb-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recibo:</span>
                  <span className="font-bold">{ultimoAbono.referenciaComprobante}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span>{ultimoAbono.fecha} {ultimoAbono.hora}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-semibold text-right truncate max-w-[140px]">{ultimoAbono.clienteNombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doc:</span>
                  <span>{ultimoAbono.clienteDocumento}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-border pb-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saldo Anterior:</span>
                  <span>{formatCurrency(ultimoAbono.saldoAnterior)}</span>
                </div>
                <div className="flex justify-between font-bold text-success-text">
                  <span>Monto Abonado:</span>
                  <span>{formatCurrency(ultimoAbono.montoAbonado)}</span>
                </div>
                <div className="flex justify-between text-danger-text font-bold">
                  <span>Saldo Restante:</span>
                  <span>{formatCurrency(ultimoAbono.saldoRestante)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Medio de Pago:</span>
                  <span>{ultimoAbono.metodoPago}</span>
                </div>
              </div>

              <div className="text-center pt-1 text-[10px] text-muted-foreground">
                <p>¡Gracias por su puntual abono!</p>
                <p>Conserve este ticket como constancia</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2">
            <Button
              type="button"
              onClick={handleImprimirTicketTermico}
              className="w-full text-xs bg-primary text-primary-foreground font-semibold gap-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Ticket Térmico</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalTicketOpen(false)}
              className="w-full text-xs"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
