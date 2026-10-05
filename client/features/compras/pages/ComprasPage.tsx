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
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { NuevaCompraDialog } from '../components/NuevaCompraDialog';
import { comprasService } from '../services/comprasService';
import { Compra, NuevaCompraPayload } from '../types/compras.types';
import { subscribeToErp } from '@/services/erp/erpStore';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CONDICION_PAGO_LABELS: Record<string, string> = {
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
  CREDITO_30_DIAS: 'Crédito 30 días',
  TARJETA: 'Tarjeta',
};

export const ComprasPage: React.FC = () => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODAS');
  const [openModal, setOpenModal] = useState(false);

  const fetchCompras = async () => {
    setLoading(true);
    try {
      const data = await comprasService.getCompras();
      setCompras(data);
    } catch {
      toast.error('Error al cargar la lista de compras.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
    const unsubscribe = subscribeToErp(() => {
      fetchCompras();
    });
    return unsubscribe;
  }, []);

  const handleCrearCompra = async (payload: NuevaCompraPayload & { productoId?: string }) => {
    try {
      const nueva = await comprasService.registrarCompra(payload);
      setCompras((prev) => [nueva, ...prev]);
      toast.success(`Compra con factura ${nueva.serieFactura} registrada correctamente.`);
    } catch {
      toast.error('No se pudo registrar la compra.');
    }
  };

  const filteredCompras = useMemo(() => {
    return compras.filter((c) => {
      const matchSearch =
        c.proveedorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.proveedorRuc.includes(searchTerm) ||
        c.serieFactura.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEstado = estadoFiltro === 'TODAS' || c.estado === estadoFiltro;
      return matchSearch && matchEstado;
    });
  }, [compras, searchTerm, estadoFiltro]);

  const totalCompras = useMemo(() => compras.reduce((acc, c) => acc + c.total, 0), [compras]);

  const countRecibido = useMemo(
    () => compras.filter((c) => c.estado === 'RECIBIDO').length,
    [compras]
  );

  const countPendiente = useMemo(
    () => compras.filter((c) => c.estado === 'PENDIENTE').length,
    [compras]
  );

  return (
    <div className="space-y-6">
      {/* Encabezado y Acción Primaria Única */}
      <PageHeader
        title="Gestión de Compras y Abastecimiento"
        description="Recepción de facturas de proveedores, órdenes de compra y control de cuentas por pagar"
        badge="Recepción Mercadería"
      >
        <Button
          size="sm"
          onClick={() => setOpenModal(true)}
          className="h-9 gap-2 bg-primary text-primary-foreground font-semibold shadow-2xs w-full sm:w-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Nueva orden de compra</span>
        </Button>
      </PageHeader>

      {/* Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Compras Totales del Mes"
          value={formatCurrency(totalCompras)}
          subtitle={
            compras.length === 1 ? '1 factura recepcionada' : `${compras.length} facturas recepcionadas`
          }
          icon={Truck}
          iconColor="text-primary bg-primary/10"
        />
        <MetricCard
          title="Mercadería Recibida"
          value={`${countRecibido} ${countRecibido === 1 ? 'orden' : 'órdenes'}`}
          subtitle="Ingresadas al almacén físico"
          icon={CheckCircle2}
          iconColor="text-success-text bg-success-soft"
        />
        <MetricCard
          title="Órdenes Pendientes"
          value={`${countPendiente} ${countPendiente === 1 ? 'orden en tránsito' : 'órdenes en tránsito'}`}
          subtitle="Por arribar al local comercial"
          icon={Clock}
          iconColor="text-warning-text bg-warning-soft"
        />
      </div>

      {/* Bloque Principal: Filtros y Tabla / Tarjetas de Compras */}
      <Card className="border-border">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Barra de Búsqueda y Filtros de Estado */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por proveedor, RUC o serie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs border-border bg-card"
              />
            </div>

            {/* Selector de Estado con scroll horizontal en móviles */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              {[
                { id: 'TODAS', label: 'Todas las compras', count: compras.length },
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

          {/* Estado de Carga */}
          {loading ? (
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
                {searchTerm || estadoFiltro !== 'TODAS'
                  ? 'No se encontraron compras con los criterios indicados'
                  : 'Aún no registras compras ni abastecimientos este mes'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {searchTerm || estadoFiltro !== 'TODAS'
                  ? 'Intenta cambiar el término de búsqueda o selecciona otro estado.'
                  : 'Registra las facturas de tus proveedores para ingresar stock a tus almacenes.'}
              </p>
              {!searchTerm && estadoFiltro === 'TODAS' && (
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
                <Table className="w-full min-w-[780px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-b border-border hover:bg-transparent">
                      <TableHead className="text-xs font-semibold py-2.5 w-28 whitespace-nowrap">Fecha</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-36 whitespace-nowrap">Factura Proveedor</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 whitespace-nowrap">Proveedor / RUC</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-32 text-center whitespace-nowrap">Ítems</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-36 whitespace-nowrap">Condición de Pago</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-32 whitespace-nowrap">Estado</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-36 text-right whitespace-nowrap">Total Facturado</TableHead>
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

                    {/* Fila Inferior: Monto Total Facturado */}
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Receipt className="h-3 w-3" />
                        <span>Total factura:</span>
                      </span>
                      <span className="font-mono font-bold tabular-nums text-sm text-foreground">
                        {formatCurrency(compra.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Registro de Compra */}
      <NuevaCompraDialog
        open={openModal}
        onOpenChange={setOpenModal}
        onCompraRegistrada={handleCrearCompra}
      />
    </div>
  );
};

export default ComprasPage;
