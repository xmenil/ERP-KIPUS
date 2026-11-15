import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MetricCard } from '@/components/common/MetricCard';
import { Cliente, NuevoClientePayload } from '../types/clientes.types';
import { clientesService } from '../services/clientesService';
import { ClienteFormSheet } from './ClienteFormSheet';
import { ClienteDetalleSheet } from './ClienteDetalleSheet';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import {
  UserPlus,
  Search,
  Users,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  FileSpreadsheet,
  Wallet,
  Eye,
  Edit,
  MoreHorizontal,
  X,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ClientesDirectorioViewProps {
  embedded?: boolean;
  onIrAFiados?: (clienteId: string) => void;
}

export const ClientesDirectorioView: React.FC<ClientesDirectorioViewProps> = ({
  embedded = false,
  onIrAFiados,
}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipoDoc, setFiltroTipoDoc] = useState<string>('TODOS');

  // Modales / Sheets
  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState<Cliente | null>(null);
  const [detalleSheetOpen, setDetalleSheetOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const data = await clientesService.getClientes();
      setClientes(data);
    } catch {
      toast.error('Error al cargar la lista de clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleGuardarCliente = async (payload: NuevoClientePayload, id?: string) => {
    try {
      if (id) {
        const act = await clientesService.actualizarCliente(id, payload);
        setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...act } : c)));
        toast.success(`Cliente "${act.nombre}" actualizado correctamente.`);
      } else {
        const nuevo = await clientesService.registrarCliente(payload);
        setClientes((prev) => [nuevo, ...prev]);
        toast.success(`Cliente "${nuevo.nombre}" registrado exitosamente.`);
      }
    } catch {
      toast.error('No se pudo procesar la operación.');
    }
  };

  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const matchSearch =
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.numeroDocumento.includes(searchTerm) ||
        c.telefono.includes(searchTerm);
      const matchDoc =
        filtroTipoDoc === 'TODOS' ||
        (filtroTipoDoc === 'CON_DEUDA' ? c.saldoPendiente > 0 : c.documentoTipo === filtroTipoDoc);
      return matchSearch && matchDoc;
    });
  }, [clientes, searchTerm, filtroTipoDoc]);

  const countDni = useMemo(() => clientes.filter((c) => c.documentoTipo === 'DNI').length, [clientes]);
  const countRuc = useMemo(() => clientes.filter((c) => c.documentoTipo === 'RUC').length, [clientes]);
  const clientesConSaldo = useMemo(() => clientes.filter((c) => c.saldoPendiente > 0).length, [clientes]);
  const totalSaldosPorCobrar = useMemo(
    () => clientes.reduce((acc, c) => acc + (c.saldoPendiente || 0), 0),
    [clientes]
  );
  const totalComprasAcumuladas = useMemo(
    () => clientes.reduce((acc, c) => acc + (c.totalCompras || 0), 0),
    [clientes]
  );

  return (
    <div className="space-y-4">
      {/* 1. Header (si no está embebido) */}
      {!embedded ? (
        <PageHeader
          title="Directorio de Clientes"
          description="Ficha de clientes (DNI / RUC), líneas de crédito comercial e historial de compras"
          badge="Directorio Comercial"
        >
          <Button
            size="sm"
            onClick={() => {
              setClienteAEditar(null);
              setFormSheetOpen(true);
            }}
            className="h-9 gap-2 bg-primary text-primary-foreground font-semibold shadow-2xs w-full sm:w-auto"
          >
            <UserPlus className="h-4 w-4" />
            <span>Registrar cliente</span>
          </Button>
        </PageHeader>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/70">
          <div>
            <h3 className="text-sm font-bold text-foreground">Directorio de Clientes</h3>
            <p className="text-[11px] text-muted-foreground">
              Consulta de personas naturales y empresas, historial de consumo y datos fiscales.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setClienteAEditar(null);
              setFormSheetOpen(true);
            }}
            className="h-8 gap-1.5 bg-primary text-primary-foreground font-semibold text-xs shadow-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Nuevo cliente</span>
          </Button>
        </div>
      )}

      {/* 2. Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Clientes en Cartera"
          value={formatNumber(clientes.length)}
          subtitle="Personas y empresas"
          icon={Users}
          iconColor="text-primary bg-primary/10"
        />
        <MetricCard
          title="Empresas con RUC"
          value={formatNumber(countRuc)}
          subtitle="Facturación B2B recurrente"
          icon={Building}
          iconColor="text-primary bg-primary/10"
        />
        <MetricCard
          title="Saldos por Cobrar"
          value={formatCurrency(totalSaldosPorCobrar)}
          subtitle={`${clientesConSaldo} clientes con fiado activo`}
          icon={CreditCard}
          iconColor="text-danger-text bg-danger-soft"
        />
        <MetricCard
          title="Compras Acumuladas"
          value={formatCurrency(totalComprasAcumuladas)}
          subtitle="Volumen total facturado"
          icon={Wallet}
          iconColor="text-success-text bg-success-soft"
        />
      </div>

      {/* 3. Bloque Principal: Filtros y Tabla */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, documento o teléfono..."
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

            {/* Chips de Segmentación */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              {[
                { id: 'TODOS', label: 'Todos', count: clientes.length },
                { id: 'DNI', label: 'DNI', count: countDni },
                { id: 'RUC', label: 'Empresas RUC', count: countRuc },
                { id: 'CON_DEUDA', label: 'Con saldo deudor', count: clientesConSaldo },
              ].map((f) => {
                const isSelected = filtroTipoDoc === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltroTipoDoc(f.id)}
                    className={cn(
                      'px-2.5 py-1 text-xs rounded-full border transition-colors whitespace-nowrap cursor-pointer select-none font-medium',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                        : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground'
                    )}
                  >
                    <span>{f.label}</span>
                    <span className="ml-1 opacity-70 tabular-nums">({f.count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estado de Carga */}
          {loading ? (
            <div className="h-44 rounded-md border border-border flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Cargando directorio de clientes...</span>
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="py-12 px-4 rounded-md border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                {searchTerm || filtroTipoDoc !== 'TODOS'
                  ? 'No se encontraron clientes con los filtros indicados'
                  : 'Aún no registras clientes en el sistema'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {searchTerm || filtroTipoDoc !== 'TODOS'
                  ? 'Intenta cambiar el término de búsqueda o selecciona otro filtro.'
                  : 'Registra tus clientes con DNI o RUC para emitir boletas y facturas rápidamente.'}
              </p>
              {!searchTerm && filtroTipoDoc === 'TODOS' && (
                <Button
                  size="sm"
                  onClick={() => {
                    setClienteAEditar(null);
                    setFormSheetOpen(true);
                  }}
                  className="mt-2 text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Registrar primer cliente</span>
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Vista 1: Tabla Completa para Escritorio (>= md) */}
              <div className="hidden md:block overflow-x-auto rounded border border-border bg-card shadow-2xs">
                <Table className="w-full min-w-[780px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-b border-border hover:bg-transparent">
                      <TableHead className="text-xs font-semibold py-2.5 w-36 whitespace-nowrap">Documento</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 whitespace-nowrap">Cliente / Razón Social</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-44 whitespace-nowrap">Teléfono / WhatsApp</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 whitespace-nowrap">Dirección Fiscal / Domicilio</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-32 text-right whitespace-nowrap">Compras Acum.</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-32 text-right whitespace-nowrap">Saldo Fiado</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-24 text-right whitespace-nowrap">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClientes.map((cliente) => (
                      <TableRow
                        key={cliente.id}
                        className="text-xs hover:bg-muted/30 border-b border-border/70 transition-colors cursor-pointer"
                        onClick={() => {
                          setClienteSeleccionado(cliente);
                          setDetalleSheetOpen(true);
                        }}
                      >
                        <TableCell className="py-2.5 whitespace-nowrap">
                          <span className="font-mono font-semibold text-primary block text-xs">
                            {cliente.numeroDocumento}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {cliente.documentoTipo} · {cliente.tipoCliente || 'Minorista'}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-foreground py-2.5">
                          {cliente.nombre}
                        </TableCell>
                        <TableCell className="py-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-0.5 text-foreground">
                            {cliente.telefono ? (
                              <div className="flex items-center gap-2 font-mono text-xs">
                                <a
                                  href={`tel:${cliente.telefono.replace(/\s+/g, '')}`}
                                  className="text-foreground hover:text-primary flex items-center gap-1"
                                  title="Llamar"
                                >
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  <span>{cliente.telefono}</span>
                                </a>
                                <a
                                  href={`https://wa.me/51${cliente.telefono.replace(/\s+/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-success-text hover:text-success"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">Sin teléfono</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate py-2.5 text-xs">
                          {cliente.direccion || 'Sin dirección registrada'}
                        </TableCell>
                        <TableCell className="text-right font-semibold font-mono text-foreground py-2.5 text-xs tabular-nums whitespace-nowrap">
                          {formatCurrency(cliente.totalCompras)}
                        </TableCell>
                        <TableCell className="text-right py-2.5 whitespace-nowrap">
                          {cliente.saldoPendiente > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono tabular-nums bg-danger-soft text-danger-text border border-destructive/20">
                              {formatCurrency(cliente.saldoPendiente)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-mono tabular-nums text-xs">
                              S/ 0.00
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setClienteAEditar(cliente);
                                setFormSheetOpen(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              <span>Editar</span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground rounded"
                                  aria-label="Más opciones"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setClienteSeleccionado(cliente);
                                    setDetalleSheetOpen(true);
                                  }}
                                  className="text-xs cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                  <span>Ver ficha 360°</span>
                                </DropdownMenuItem>
                                {cliente.saldoPendiente > 0 && onIrAFiados && (
                                  <DropdownMenuItem
                                    onClick={() => onIrAFiados(cliente.id)}
                                    className="text-xs cursor-pointer text-primary"
                                  >
                                    <CreditCard className="h-3.5 w-3.5 mr-2" />
                                    <span>Ver fiados / Cobrar</span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Vista 2: Tarjetas para Móvil (< md) */}
              <div className="block md:hidden space-y-2.5">
                {filteredClientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="p-3.5 rounded-lg border border-border bg-card shadow-2xs space-y-2.5 hover:border-border/80 transition-colors"
                    onClick={() => {
                      setClienteSeleccionado(cliente);
                      setDetalleSheetOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border/60">
                          {cliente.documentoTipo}
                        </span>
                        <span className="font-mono font-bold text-primary text-xs">
                          {cliente.numeroDocumento}
                        </span>
                      </div>
                      {cliente.saldoPendiente > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold font-mono bg-danger-soft text-danger-text border border-destructive/20">
                          Debe {formatCurrency(cliente.saldoPendiente)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-success-soft text-success-text border border-success/20">
                          Al día
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground leading-snug">
                        {cliente.nombre}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {cliente.telefono && (
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Phone className="h-3 w-3" />
                            <span>{cliente.telefono}</span>
                          </span>
                        )}
                        {cliente.direccion && (
                          <span className="inline-flex items-center gap-1 w-full pt-0.5 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span>{cliente.direccion}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        <span>Compras acumuladas:</span>
                      </span>
                      <span className="font-mono font-bold tabular-nums text-xs text-foreground">
                        {formatCurrency(cliente.totalCompras)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Drawer lateral de Formulario */}
      <ClienteFormSheet
        open={formSheetOpen}
        onOpenChange={setFormSheetOpen}
        onGuardarCliente={handleGuardarCliente}
        clienteAEditar={clienteAEditar}
      />

      {/* Drawer lateral de Detalle 360° */}
      <ClienteDetalleSheet
        open={detalleSheetOpen}
        onOpenChange={setDetalleSheetOpen}
        cliente={clienteSeleccionado}
        onEditarClick={(cli) => {
          setDetalleSheetOpen(false);
          setClienteAEditar(cli);
          setFormSheetOpen(true);
        }}
        onAbonarClick={(cli) => {
          if (onIrAFiados) onIrAFiados(cli.id);
        }}
      />
    </div>
  );
};
