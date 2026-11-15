import React, { useState, useMemo } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Compra, EstadoCompra } from '../types/compras.types';
import { ResumenSugerenciaCompras } from '../services/sugerenciaComprasService';
import { ReabastecimientoAlertCard } from './ReabastecimientoAlertCard';
import { formatCurrency, formatDate, pluralizeUnit } from '@/utils/formatters';
import {
  PlusCircle,
  Search,
  Truck,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Receipt,
  Sparkles,
  Eye,
  Check,
  PackageCheck,
  MoreHorizontal,
  X,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CONDICION_PAGO_LABELS: Record<string, string> = {
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
  CREDITO_30_DIAS: 'Crédito 30 días',
  TARJETA: 'Tarjeta',
};

const ESTADOS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' | 'neutral' }> = {
  BORRADOR: { label: 'Borrador', variant: 'neutral' },
  PENDIENTE: { label: 'Pendiente', variant: 'warning' },
  APROBADA: { label: 'Aprobada', variant: 'info' },
  RECIBIDA_PARCIAL: { label: 'Recibida parcial', variant: 'warning' },
  RECIBIDO: { label: 'Completada', variant: 'success' },
  ANULADO: { label: 'Anulada', variant: 'danger' },
};

interface OrdenesCompraViewProps {
  compras: Compra[];
  loading: boolean;
  sugerencias: ResumenSugerenciaCompras;
  onNuevaOrden: () => void;
  onAbrirSugerencias: () => void;
  onActualizarEstado?: (id: string, nuevoEstado: EstadoCompra) => Promise<void>;
  onIrARecepcion?: (compraId: string) => void;
}

export const OrdenesCompraView: React.FC<OrdenesCompraViewProps> = ({
  compras,
  loading,
  sugerencias,
  onNuevaOrden,
  onAbrirSugerencias,
  onActualizarEstado,
  onIrARecepcion,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODAS');
  const [compraSeleccionada, setCompraSeleccionada] = useState<Compra | null>(null);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);

  // Filtros
  const filteredCompras = useMemo(() => {
    return compras.filter((c) => {
      const matchSearch =
        c.proveedorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.proveedorRuc.includes(searchTerm) ||
        c.serieFactura.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEstado =
        estadoFiltro === 'TODAS' ||
        c.estado === estadoFiltro ||
        (estadoFiltro === 'PENDIENTES_TODAS' && (c.estado === 'PENDIENTE' || c.estado === 'APROBADA' || c.estado === 'BORRADOR'));
      return matchSearch && matchEstado;
    });
  }, [compras, searchTerm, estadoFiltro]);

  // Métricas
  const totalCompras = useMemo(() => compras.reduce((acc, c) => acc + c.total, 0), [compras]);
  const countRecibido = useMemo(
    () => compras.filter((c) => c.estado === 'RECIBIDO').length,
    [compras]
  );
  const countPendiente = useMemo(
    () => compras.filter((c) => c.estado === 'PENDIENTE' || c.estado === 'APROBADA' || c.estado === 'BORRADOR').length,
    [compras]
  );
  const countParcial = useMemo(
    () => compras.filter((c) => c.estado === 'RECIBIDA_PARCIAL').length,
    [compras]
  );

  const handleCambiarEstado = async (compra: Compra, nuevoEstado: EstadoCompra) => {
    if (!onActualizarEstado) return;
    try {
      await onActualizarEstado(compra.id, nuevoEstado);
      toast.success(`Orden ${compra.serieFactura} actualizada a "${ESTADOS_MAP[nuevoEstado]?.label || nuevoEstado}".`);
    } catch {
      toast.error('No se pudo actualizar el estado de la orden.');
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Asistente Superior de Reabastecimiento */}
      <ReabastecimientoAlertCard
        sugerencias={sugerencias}
        onAbrirSugerencias={onAbrirSugerencias}
      />

      {/* 2. Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          title="Compras Totales del Mes"
          value={formatCurrency(totalCompras)}
          subtitle={
            compras.length === 1 ? '1 factura/orden registrada' : `${compras.length} órdenes registradas`
          }
          icon={Truck}
          iconColor="text-primary bg-primary/10"
        />
        <MetricCard
          title="Mercadería Recibida"
          value={`${countRecibido} ${countRecibido === 1 ? 'orden' : 'órdenes'}`}
          subtitle="En existencia física en almacén"
          icon={CheckCircle2}
          iconColor="text-success-text bg-success-soft"
        />
        <MetricCard
          title="Órdenes Pendientes"
          value={`${countPendiente} ${countPendiente === 1 ? 'orden' : 'órdenes'}`}
          subtitle={countParcial > 0 ? `${countParcial} con recepción parcial` : 'Por arribar o recepcionar'}
          icon={Clock}
          iconColor="text-warning-text bg-warning-soft"
        />
      </div>

      {/* 3. Bloque Principal: Filtros y Tabla */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Barra de Búsqueda y Botones de Acción */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
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

            {/* Chips de Estado con scroll horizontal */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              {[
                { id: 'TODAS', label: 'Todas', count: compras.length },
                { id: 'PENDIENTES_TODAS', label: 'Pendientes / Tránsito', count: countPendiente },
                { id: 'RECIBIDO', label: 'Completadas', count: countRecibido },
                { id: 'RECIBIDA_PARCIAL', label: 'Parciales', count: countParcial },
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

            {/* Botones de Cabecera Rápida */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={onAbrirSugerencias}
                className="h-9 gap-1.5 border-primary/30 text-primary hover:bg-primary-soft text-xs font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Sugerencias</span>
                {sugerencias.totalProductosSugeridos > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-danger-soft text-danger-text text-[10px] font-bold">
                    {sugerencias.totalProductosSugeridos}
                  </span>
                )}
              </Button>
              <Button
                size="sm"
                onClick={onNuevaOrden}
                className="h-9 gap-1.5 bg-primary text-primary-foreground font-semibold text-xs shadow-xs"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Nueva orden</span>
              </Button>
            </div>
          </div>

          {/* Estado de Carga */}
          {loading ? (
            <div className="h-44 rounded-md border border-border flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Cargando órdenes de compra...</span>
            </div>
          ) : filteredCompras.length === 0 ? (
            /* Estado Vacío */
            <div className="py-12 px-4 rounded-md border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                {searchTerm || estadoFiltro !== 'TODAS'
                  ? 'No se encontraron órdenes con los criterios indicados'
                  : 'Aún no registras órdenes de compra este mes'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {searchTerm || estadoFiltro !== 'TODAS'
                  ? 'Intenta cambiar el término de búsqueda o selecciona otro estado.'
                  : 'Registra las órdenes a tus proveedores para planificar el ingreso de existencias.'}
              </p>
              {!searchTerm && estadoFiltro === 'TODAS' && (
                <Button
                  size="sm"
                  onClick={onNuevaOrden}
                  className="mt-2 text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Crear primera orden</span>
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Vista Desktop (>= md) */}
              <div className="hidden md:block overflow-x-auto rounded border border-border bg-card shadow-2xs">
                <Table className="w-full min-w-[850px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-b border-border hover:bg-transparent">
                      <TableHead className="text-xs font-semibold py-2.5 w-28 whitespace-nowrap">Fecha</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-36 whitespace-nowrap">Serie / Factura</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 whitespace-nowrap">Proveedor / RUC</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-28 text-center whitespace-nowrap">Ítems</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-36 whitespace-nowrap">Condición Pago</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-32 whitespace-nowrap">Estado</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-32 text-right whitespace-nowrap">Total Facturado</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-28 text-right whitespace-nowrap">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompras.map((compra) => {
                      const badgeInfo = ESTADOS_MAP[compra.estado] || { label: compra.estado, variant: 'neutral' };
                      return (
                        <TableRow
                          key={compra.id}
                          className="text-xs hover:bg-muted/30 border-b border-border/70 transition-colors cursor-pointer"
                          onClick={() => {
                            setCompraSeleccionada(compra);
                            setDetalleModalOpen(true);
                          }}
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
                              status={badgeInfo.label}
                              variant={badgeInfo.variant}
                            />
                          </TableCell>
                          <TableCell className="text-right font-semibold font-mono text-foreground py-2.5 text-xs tabular-nums whitespace-nowrap">
                            {formatCurrency(compra.total)}
                          </TableCell>
                          <TableCell className="text-right py-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              {compra.estado !== 'RECIBIDO' && onIrARecepcion && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs font-semibold gap-1 text-primary hover:bg-primary-soft border-primary/30"
                                  onClick={() => onIrARecepcion(compra.id)}
                                  title="Verificar y recepcionar mercadería"
                                >
                                  <PackageCheck className="h-3.5 w-3.5" />
                                  <span>Recepcionar</span>
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground rounded"
                                    aria-label="Más acciones"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setCompraSeleccionada(compra);
                                      setDetalleModalOpen(true);
                                    }}
                                    className="text-xs cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                    <span>Ver detalle</span>
                                  </DropdownMenuItem>
                                  {compra.estado === 'BORRADOR' && onActualizarEstado && (
                                    <DropdownMenuItem
                                      onClick={() => handleCambiarEstado(compra, 'APROBADA')}
                                      className="text-xs cursor-pointer text-primary"
                                    >
                                      <Check className="h-3.5 w-3.5 mr-2" />
                                      <span>Aprobar orden</span>
                                    </DropdownMenuItem>
                                  )}
                                  {compra.estado !== 'RECIBIDO' && onIrARecepcion && (
                                    <DropdownMenuItem
                                      onClick={() => onIrARecepcion(compra.id)}
                                      className="text-xs cursor-pointer font-medium"
                                    >
                                      <PackageCheck className="h-3.5 w-3.5 mr-2 text-primary" />
                                      <span>Pasar a recepción</span>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  {compra.estado !== 'ANULADO' && onActualizarEstado && (
                                    <DropdownMenuItem
                                      onClick={() => handleCambiarEstado(compra, 'ANULADO')}
                                      className="text-xs text-danger-text focus:text-danger-text focus:bg-danger-soft cursor-pointer"
                                    >
                                      <X className="h-3.5 w-3.5 mr-2" />
                                      <span>Anular orden</span>
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Vista Móvil (< md) */}
              <div className="block md:hidden space-y-2.5">
                {filteredCompras.map((compra) => {
                  const badgeInfo = ESTADOS_MAP[compra.estado] || { label: compra.estado, variant: 'neutral' };
                  return (
                    <div
                      key={compra.id}
                      className="p-3.5 rounded-lg border border-border bg-card shadow-2xs space-y-2.5 hover:border-border/80 transition-colors"
                      onClick={() => {
                        setCompraSeleccionada(compra);
                        setDetalleModalOpen(true);
                      }}
                    >
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
                          status={badgeInfo.label}
                          variant={badgeInfo.variant}
                        />
                      </div>

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

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Receipt className="h-3 w-3" />
                          <span>Total:</span>
                        </span>
                        <span className="font-mono font-bold tabular-nums text-sm text-foreground">
                          {formatCurrency(compra.total)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalle de Orden */}
      <Dialog open={detalleModalOpen} onOpenChange={setDetalleModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" />
              <span>Detalle de Orden {compraSeleccionada?.serieFactura}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Información de abastecimiento y detalle de ítems registrados.
            </DialogDescription>
          </DialogHeader>

          {compraSeleccionada && (
            <div className="space-y-4 text-xs py-2">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Proveedor</span>
                  <span className="font-semibold text-foreground block">{compraSeleccionada.proveedorNombre}</span>
                  <span className="font-mono text-muted-foreground text-[11px]">RUC: {compraSeleccionada.proveedorRuc}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Condición & Estado</span>
                  <span className="font-semibold text-foreground block">
                    {CONDICION_PAGO_LABELS[compraSeleccionada.metodoPago] || compraSeleccionada.metodoPago}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Estado: <span className="font-bold text-foreground">{compraSeleccionada.estado}</span>
                  </span>
                </div>
              </div>

              {compraSeleccionada.items && compraSeleccionada.items.length > 0 ? (
                <div className="border border-border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="text-xs">
                        <TableHead className="py-2">Producto</TableHead>
                        <TableHead className="py-2 text-center w-20">Cant.</TableHead>
                        <TableHead className="py-2 text-right w-24">P. Unit</TableHead>
                        <TableHead className="py-2 text-right w-24">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compraSeleccionada.items.map((it, idx) => (
                        <TableRow key={idx} className="text-xs">
                          <TableCell className="py-2">
                            <span className="font-medium text-foreground block">{it.nombre}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{it.sku}</span>
                          </TableCell>
                          <TableCell className="py-2 text-center font-mono tabular-nums">{it.cantidad}</TableCell>
                          <TableCell className="py-2 text-right font-mono tabular-nums">{formatCurrency(it.precioUnitario)}</TableCell>
                          <TableCell className="py-2 text-right font-mono font-semibold tabular-nums">{formatCurrency(it.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-2">
                  No hay ítems detallados para esta compra.
                </p>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-border font-mono font-bold text-sm">
                <span>Total Facturado:</span>
                <span className="text-primary text-base">{formatCurrency(compraSeleccionada.total)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {compraSeleccionada && compraSeleccionada.estado !== 'RECIBIDO' && onIrARecepcion && (
              <Button
                type="button"
                className="text-xs bg-primary text-primary-foreground font-semibold gap-1.5"
                onClick={() => {
                  setDetalleModalOpen(false);
                  onIrARecepcion(compraSeleccionada.id);
                }}
              >
                <PackageCheck className="h-4 w-4" />
                <span>Proceder a recepción</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setDetalleModalOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
