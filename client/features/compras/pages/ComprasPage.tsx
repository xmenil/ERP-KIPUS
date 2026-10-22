import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useErpQuery } from '@/hooks/useErpQuery';
import { QueryError } from '@/components/common/QueryError';
import { PageHeader } from '@/components/common/PageHeader';
import { SummaryStrip } from '@/components/common/SummaryStrip';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { NuevaCompraDialog } from '../components/NuevaCompraDialog';
import { RecomendacionComprasModal } from '../components/RecomendacionComprasModal';
import { CompraDetalleModal } from '../components/CompraDetalleModal';
import { comprasService } from '../services/comprasService';
import { sugerenciaComprasService, ResumenSugerenciaCompras } from '../services/sugerenciaComprasService';
import { Compra, NuevaCompraPayload, CompraItemDetalle } from '../types/compras.types';
import { formatCurrency, formatDate, pluralizeUnit } from '@/utils/formatters';
import {
  PlusCircle,
  Search,
  Building2,
  Receipt,
  Sparkles,
  AlertTriangle,
  MoreHorizontal,
  PackageCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { isDateWithinRange } from '@/utils/dateRange';

const CONDICION_PAGO_LABELS: Record<string, string> = {
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo (caja)',
  CREDITO_30_DIAS: 'Crédito 30 días',
  TARJETA: 'Tarjeta',
};

export const ComprasPage: React.FC = () => {
  const { data: compras, loading, error: queryError, refresh: fetchCompras } = useErpQuery(comprasService.getCompras);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODAS');
  const [proveedorFiltro, setProveedorFiltro] = useState<string>('TODOS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [openModal, setOpenModal] = useState(false);

  // Estados de detalle y recepción
  const [detalleCompra, setDetalleCompra] = useState<Compra | null>(null);
  const [compraARecepcionar, setCompraARecepcionar] = useState<Compra | null>(null);
  const [recepcionando, setRecepcionando] = useState(false);
  const lockRecepcion = useRef(false);

  // Estados para Recomendación Inteligente de Compra
  const [modalRecomendacionOpen, setModalRecomendacionOpen] = useState(false);
  const [itemsParaOrden, setItemsParaOrden] = useState<CompraItemDetalle[] | null>(null);
  const [proveedorParaOrden, setProveedorParaOrden] = useState<{ razonSocial: string; ruc: string } | null>(null);
  const [sugerencias, setSugerencias] = useState<ResumenSugerenciaCompras>({
    items: [],
    totalProductosSugeridos: 0,
    totalUnidadesSugeridas: 0,
    inversionTotalEstimada: 0,
    conteoAgotados: 0,
    conteoCriticos: 0,
    conteoAltaRotacion: 0,
    desde: '',
    hasta: '',
  });

  useEffect(() => {
    if (!loading && !queryError) {
      setSugerencias(sugerenciaComprasService.obtenerSugerencias());
    }
  }, [compras, loading, queryError]);

  const handleCrearCompra = async (payload: NuevaCompraPayload) => {
    const nueva = await comprasService.registrarCompra(payload);
    void fetchCompras();
    const mensaje = nueva.estado === 'RECIBIDO'
      ? `Compra con factura ${nueva.serieFactura} registrada e ingresada al almacén.`
      : `Orden de compra ${nueva.serieFactura} registrada como pendiente.`;
    toast.success(mensaje);
  };

  const handleRecepcionarCompra = async (compraId: string) => {
    if (lockRecepcion.current) return;
    lockRecepcion.current = true;
    setRecepcionando(true);
    try {
      const recibida = await comprasService.recepcionarCompra(compraId);
      void fetchCompras();
      toast.success(`Compra ${recibida.serieFactura} recepcionada. El stock se actualizó en almacén.`);
      setCompraARecepcionar(null);
      if (detalleCompra?.id === compraId) {
        setDetalleCompra(recibida);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo recepcionar la compra.');
    } finally {
      lockRecepcion.current = false;
      setRecepcionando(false);
    }
  };

  const handleProcederOrden = (
    items: CompraItemDetalle[],
    prov?: { razonSocial: string; ruc: string }
  ) => {
    setItemsParaOrden(items);
    setProveedorParaOrden(prov || null);
    setOpenModal(true);
  };

  // Lista única de proveedores en las compras existentes para filtro
  const proveedoresDisponibles = useMemo(() => {
    const map = new Map<string, string>();
    compras.forEach((c) => {
      if (c.proveedorRuc && c.proveedorNombre) {
        map.set(c.proveedorRuc, c.proveedorNombre);
      }
    });
    return Array.from(map.entries()).map(([ruc, nombre]) => ({ ruc, nombre }));
  }, [compras]);

  const filteredCompras = useMemo(() => {
    return compras.filter((c) => {
      const matchSearch =
        c.proveedorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.proveedorRuc.includes(searchTerm) ||
        c.serieFactura.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEstado = estadoFiltro === 'TODAS' || c.estado === estadoFiltro;
      const matchProveedor = proveedorFiltro === 'TODOS' || c.proveedorRuc === proveedorFiltro;
      const matchFecha = isDateWithinRange(c.fecha, fechaDesde, fechaHasta);
      return matchSearch && matchEstado && matchProveedor && matchFecha;
    });
  }, [compras, searchTerm, estadoFiltro, proveedorFiltro, fechaDesde, fechaHasta]);

  const comprasPeriodo = useMemo(() => compras.filter(c => isDateWithinRange(c.fecha, fechaDesde, fechaHasta)), [compras, fechaDesde, fechaHasta]);
  const proveedoresPeriodo = useMemo(() => new Set(comprasPeriodo.map(compra => compra.proveedorRuc)).size, [comprasPeriodo]);
  const totalCompras = useMemo(() => comprasPeriodo.reduce((acc, c) => acc + c.total, 0), [comprasPeriodo]);

  const countRecibido = useMemo(
    () => comprasPeriodo.filter((c) => c.estado === 'RECIBIDO').length,
    [comprasPeriodo]
  );

  const countPendiente = useMemo(
    () => comprasPeriodo.filter((c) => c.estado === 'PENDIENTE').length,
    [comprasPeriodo]
  );

  return (
    <div className="space-y-6">
      <QueryError message={queryError} retry={() => { void fetchCompras(); }} />

      {/* Encabezado y Acción Primaria Única */}
      <PageHeader
        title="Compras y Abastecimiento"
        description="Facturas de proveedores, ingreso de mercadería a almacén y control de compras."
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalRecomendacionOpen(true)}
            className="h-9 gap-1.5 border-primary/30 text-primary hover:bg-primary-soft shadow-2xs font-semibold text-xs"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Sugerencia de compras</span>
            {sugerencias.totalProductosSugeridos > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-danger-soft text-danger-text text-[10px] font-bold">
                {sugerencias.totalProductosSugeridos}
              </span>
            )}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setItemsParaOrden(null);
              setProveedorParaOrden(null);
              setOpenModal(true);
            }}
            className="h-9 gap-2 bg-primary text-primary-foreground font-semibold shadow-2xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Nueva orden de compra</span>
          </Button>
        </div>
      </PageHeader>

      {/* Banner de Abastecimiento Inteligente si hay productos críticos o de alta rotación */}
      {sugerencias.totalProductosSugeridos > 0 && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground flex items-center gap-2">
                <span>Reposición por stock y ventas de los últimos 30 días</span>
                <span className="text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 px-1.5 py-0.2 rounded">
                  {sugerencias.conteoAgotados} agotados · {sugerencias.conteoCriticos} en alerta mínima
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Hay {sugerencias.totalProductosSugeridos} productos para revisar. La sugerencia no registra una compra: confirma cantidades y proveedor en el formulario.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setModalRecomendacionOpen(true)}
            variant="outline"
            className="h-11 md:h-9 text-xs shrink-0 gap-2"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ver sugerencias ({formatCurrency(sugerencias.inversionTotalEstimada)})</span>
          </Button>
        </div>
      )}

      {/* Resumen Compacto con SummaryStrip */}
      <SummaryStrip
        loading={loading}
        items={[
          {
            label: 'Compras del periodo',
            value: formatCurrency(totalCompras),
            description: `${comprasPeriodo.length} ${pluralizeUnit(comprasPeriodo.length, 'factura registrada')}`,
          },
          {
            label: 'Mercadería recibida',
            value: `${countRecibido} ${pluralizeUnit(countRecibido, 'orden')}`,
            description: 'Ingresada al almacén',
          },
          {
            label: 'Órdenes en tránsito',
            value: `${countPendiente} ${pluralizeUnit(countPendiente, 'orden')}`,
            description: countPendiente > 0 ? 'Pendientes de recepción' : 'Sin órdenes pendientes',
            tone: countPendiente > 0 ? 'warning' : undefined,
          },
          {
            label: 'Proveedores del periodo',
            value: proveedoresPeriodo,
            description: 'Con compras registradas en el rango',
          },
        ]}
      />

      {/* Bloque Principal: Filtros y Tabla / Tarjetas de Compras */}
      <Card className="border-border">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Barra de Búsqueda y Filtros */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por proveedor, RUC o serie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-11 md:h-9 text-base md:text-xs border-border bg-card"
                />
              </div>

              {/* Filtro por Proveedor */}
              <div className="w-full sm:w-56">
                <Select value={proveedorFiltro} onValueChange={setProveedorFiltro}>
                  <SelectTrigger className="h-11 md:h-9 text-base md:text-xs border-border bg-card">
                    <SelectValue placeholder="Todos los proveedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS" className="text-xs">
                      Todos los proveedores
                    </SelectItem>
                    {proveedoresDisponibles.map((p) => (
                      <SelectItem key={p.ruc} value={p.ruc} className="text-xs">
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selector de Estado */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              {[
                { id: 'TODAS', label: 'Todas', count: comprasPeriodo.length },
                { id: 'RECIBIDO', label: 'Recibidas', count: countRecibido },
                { id: 'PENDIENTE', label: 'Pendientes', count: countPendiente },
              ].map((est) => {
                const isSelected = estadoFiltro === est.id;

                return (
                  <button
                    key={est.id}
                    type="button"
                    onClick={() => setEstadoFiltro(est.id)}
                    className={cn(
                      'px-2.5 py-1 text-xs rounded-full border transition-colors whitespace-nowrap cursor-pointer select-none font-medium',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                        : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground'
                    )}
                  >
                    <span>{est.label}</span>
                    <span className="ml-1 opacity-70 tabular-nums">({est.count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end border-t border-border/60 pt-3">
            <label htmlFor="compras-fecha-desde" className="space-y-1 text-xs font-medium text-foreground">
              Desde fecha
              <Input id="compras-fecha-desde" type="date" value={fechaDesde} max={fechaHasta || undefined} onChange={e => setFechaDesde(e.target.value)} className="h-11 md:h-9 text-base md:text-sm" />
            </label>
            <label htmlFor="compras-fecha-hasta" className="space-y-1 text-xs font-medium text-foreground">
              Hasta fecha
              <Input id="compras-fecha-hasta" type="date" value={fechaHasta} min={fechaDesde || undefined} onChange={e => setFechaHasta(e.target.value)} className="h-11 md:h-9 text-base md:text-sm" />
            </label>
            {(fechaDesde || fechaHasta) && <Button type="button" variant="outline" onClick={() => { setFechaDesde(''); setFechaHasta(''); }} className="h-11 md:h-9">Limpiar fechas</Button>}
          </div>

          {/* Estado de Carga */}
          {queryError ? null : loading ? (
            <div className="h-44 rounded-md border border-border flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Cargando órdenes de compra y abastecimiento...</span>
            </div>
          ) : filteredCompras.length === 0 ? (
            /* Estado Vacío Guiado */
            <div className="py-12 px-4 rounded-md border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                {searchTerm || estadoFiltro !== 'TODAS' || proveedorFiltro !== 'TODOS'
                  ? 'No se encontraron compras con los criterios indicados'
                  : 'Aún no registras compras ni abastecimientos este mes'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {searchTerm || estadoFiltro !== 'TODAS' || proveedorFiltro !== 'TODOS'
                  ? 'Intenta cambiar el término de búsqueda o selecciona otro filtro.'
                  : 'Registra las facturas de tus proveedores para ingresar stock a tus almacenes.'}
              </p>
              {!searchTerm && estadoFiltro === 'TODAS' && proveedorFiltro === 'TODOS' && (
                <Button
                  size="sm"
                  onClick={() => setOpenModal(true)}
                  className="mt-2 text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Registrar primera compra</span>
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Vista 1: Tabla Completa para Escritorio (>= md) */}
              <div className="hidden md:block overflow-x-auto rounded border border-border bg-card shadow-2xs">
                <Table className="w-full min-w-[850px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-b border-border hover:bg-transparent">
                      <TableHead className="text-xs font-semibold py-2.5 w-28 whitespace-nowrap">Fecha</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-36 whitespace-nowrap">Factura Proveedor</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 whitespace-nowrap">Proveedor / RUC</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-32 text-center whitespace-nowrap">Ítems</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-36 whitespace-nowrap">Condición de Pago</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-32 whitespace-nowrap">Estado</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-36 text-right whitespace-nowrap">Total Facturado</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-28 text-right whitespace-nowrap">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompras.map((compra) => (
                      <TableRow
                        key={compra.id}
                        className="text-xs hover:bg-muted/30 border-b border-border/70 transition-colors"
                      >
                        <TableCell className="font-mono text-muted-foreground font-medium py-2.5 whitespace-nowrap">
                          {formatDate(compra.fecha)}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-primary py-2.5 whitespace-nowrap">
                          {compra.serieFactura}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-medium text-foreground block text-xs">
                            {compra.proveedorNombre}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            RUC: {compra.proveedorRuc}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono tabular-nums text-foreground py-2.5 whitespace-nowrap">
                          {compra.itemsCount} {pluralizeUnit(compra.itemsCount, 'unidad')}
                        </TableCell>
                        <TableCell className="py-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted border border-border/60 text-muted-foreground">
                            {CONDICION_PAGO_LABELS[compra.metodoPago] || compra.metodoPago.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 whitespace-nowrap">
                          <StatusBadge
                            status={compra.estado}
                            variant={compra.estado === 'RECIBIDO' ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold font-mono text-foreground py-2.5 text-xs tabular-nums whitespace-nowrap">
                          {formatCurrency(compra.total)}
                        </TableCell>
                        <TableCell className="text-right py-2.5 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDetalleCompra(compra)}
                              aria-label={`Ver detalle de compra ${compra.serieFactura}`}
                              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Ver detalle
                            </Button>

                            {compra.estado === 'PENDIENTE' && (
                              <Button
                                size="sm"
                                onClick={() => setCompraARecepcionar(compra)}
                                aria-label={`Recepcionar mercadería de ${compra.serieFactura}`}
                                className="h-8 px-2.5 text-xs bg-primary text-primary-foreground font-semibold hover:bg-primary-hover gap-1 shadow-2xs"
                              >
                                <PackageCheck className="h-3.5 w-3.5" />
                                <span>Recepcionar</span>
                              </Button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Acciones de compra ${compra.serieFactura}`}
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setDetalleCompra(compra)}>
                                  Ver detalle completo
                                </DropdownMenuItem>
                                {compra.estado === 'PENDIENTE' && (
                                  <DropdownMenuItem
                                    onSelect={() => setCompraARecepcionar(compra)}
                                    className="text-primary font-medium"
                                  >
                                    Recepcionar mercadería
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

              {/* Vista 2: Tarjetas Dedicadas para Móvil (< md) */}
              <div className="block md:hidden space-y-2.5">
                {filteredCompras.map((compra) => (
                  <div
                    key={compra.id}
                    className="p-3.5 rounded-lg border border-border bg-card shadow-2xs space-y-2.5 hover:border-border/80 transition-colors"
                  >
                    {/* Fila Superior: Serie, Fecha y Estado */}
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary text-xs">
                          {compra.serieFactura}
                        </span>
                        <span className="text-muted-foreground text-[11px] font-mono">
                          • {formatDate(compra.fecha)}
                        </span>
                      </div>
                      <StatusBadge
                        status={compra.estado}
                        variant={compra.estado === 'RECIBIDO' ? 'success' : 'warning'}
                      />
                    </div>

                    {/* Datos del Proveedor y Cantidad de Ítems */}
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0 mt-0.5" />
                        <p className="text-xs font-semibold text-foreground leading-snug">
                          {compra.proveedorNombre}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground pl-5">
                        <span className="font-mono">RUC: {compra.proveedorRuc}</span>
                        <span>•</span>
                        <span className="font-mono tabular-nums">
                          {compra.itemsCount} {pluralizeUnit(compra.itemsCount, 'unidad')}
                        </span>
                        <span>•</span>
                        <span>{CONDICION_PAGO_LABELS[compra.metodoPago] || compra.metodoPago}</span>
                      </div>
                    </div>

                    {/* Fila Inferior: Monto Total Facturado y Acciones */}
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                      <span className="font-mono font-bold tabular-nums text-sm text-foreground">
                        {formatCurrency(compra.total)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetalleCompra(compra)}
                          className="h-8 text-xs px-2.5"
                        >
                          Ver detalle
                        </Button>
                        {compra.estado === 'PENDIENTE' && (
                          <Button
                            size="sm"
                            onClick={() => setCompraARecepcionar(compra)}
                            className="h-8 text-xs px-2.5 bg-primary text-primary-foreground font-semibold"
                          >
                            Recepcionar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalle de Compra */}
      <CompraDetalleModal
        open={detalleCompra !== null}
        onOpenChange={(val) => { if (!val) setDetalleCompra(null); }}
        compra={detalleCompra}
        onRecepcionar={handleRecepcionarCompra}
      />

      {/* Diálogo de Confirmación de Recepción de Mercadería */}
      <AlertDialog
        open={compraARecepcionar !== null}
        onOpenChange={(val) => { if (!val && !recepcionando) setCompraARecepcionar(null); }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              ¿Confirmar recepción de mercadería?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
              <span>
                Se registrará el ingreso de{' '}
                <strong className="text-foreground font-semibold">
                  {compraARecepcionar?.itemsCount} unidades
                </strong>{' '}
                al almacén y se crearán los asientos correspondientes en el Kardex de inventario.
              </span>
              {compraARecepcionar?.metodoPago === 'EFECTIVO' && (
                <span className="block text-amber-700 dark:text-amber-400 font-medium pt-1">
                  Atención: El comprobante está marcado como pago en efectivo. Se descontará{' '}
                  {formatCurrency(compraARecepcionar?.total || 0)} de la caja registradora.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={recepcionando} className="h-9 text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={recepcionando}
              onClick={(e) => {
                e.preventDefault();
                if (compraARecepcionar) {
                  void handleRecepcionarCompra(compraARecepcionar.id);
                }
              }}
              className="h-9 text-xs bg-primary text-primary-foreground font-semibold hover:bg-primary-hover gap-1.5"
            >
              <PackageCheck className="h-4 w-4" />
              <span>{recepcionando ? 'Recepcionando…' : 'Confirmar recepción'}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Recomendación Inteligente de Compra */}
      <RecomendacionComprasModal
        open={modalRecomendacionOpen}
        onOpenChange={setModalRecomendacionOpen}
        sugerencias={sugerencias}
        onProcederOrden={handleProcederOrden}
      />

      {/* Modal de Registro de Compra */}
      <NuevaCompraDialog
        open={openModal}
        onOpenChange={setOpenModal}
        onCompraRegistrada={handleCrearCompra}
        itemsIniciales={itemsParaOrden}
        proveedorInicial={proveedorParaOrden}
        onAbrirRecomendacion={() => {
          setOpenModal(false);
          setModalRecomendacionOpen(true);
        }}
      />
    </div>
  );
};

export default ComprasPage;
