import React, { useState, useEffect } from 'react';
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
import { formatCurrency } from '@/utils/formatters';
import { PlusCircle, Search, Truck, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const ComprasPage: React.FC = () => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);

  const fetchCompras = async () => {
    setLoading(true);
    try {
      const data = await comprasService.getCompras();
      setCompras(data);
    } catch {
      toast.error('Error al cargar compras');
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

  const handleCrearCompra = async (payload: NuevaCompraPayload) => {
    try {
      const nueva = await comprasService.registrarCompra(payload);
      setCompras((prev) => [nueva, ...prev]);
      toast.success(`Compra ${nueva.serieFactura} registrada con éxito`);
    } catch {
      toast.error('No se pudo registrar la compra');
    }
  };

  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODAS');

  const filteredCompras = compras.filter((c) => {
    const matchSearch =
      c.proveedorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.proveedorRuc.includes(searchTerm) ||
      c.serieFactura.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = estadoFiltro === 'TODAS' || c.estado === estadoFiltro;
    return matchSearch && matchEstado;
  });

  const totalCompras = compras.reduce((acc, c) => acc + c.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Compras y Abastecimiento"
        description="Recepción de facturas de proveedores, órdenes de compra y control de cuentas por pagar"
        badge="Recepción Mercadería"
      >
        <Button
          size="sm"
          onClick={() => setOpenModal(true)}
          className="gap-2 bg-primary text-primary-foreground font-semibold shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Nueva Orden de Compra</span>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Compras Totales del Mes"
          value={formatCurrency(totalCompras)}
          subtitle={`${compras.length} facturas recepcionadas`}
          icon={Truck}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40"
        />
        <MetricCard
          title="Mercadería Recibida"
          value={`${compras.filter((c) => c.estado === 'RECIBIDO').length} órdenes`}
          subtitle="Ingresadas al almacén físico"
          icon={CheckCircle}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
        />
        <MetricCard
          title="Órdenes Pendientes"
          value={`${compras.filter((c) => c.estado === 'PENDIENTE').length} en tránsito`}
          subtitle="Por arribar al local comercial"
          icon={Clock}
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/40"
        />
      </div>

      <Card className="border-border/80">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por proveedor o serie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filtros de estado */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {['TODAS', 'RECIBIDO', 'PENDIENTE'].map((est) => (
                <button
                  key={est}
                  onClick={() => setEstadoFiltro(est)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    estadoFiltro === est
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {est === 'TODAS' ? 'Todas las compras' : est === 'RECIBIDO' ? 'Recibidas' : 'Pendientes'}
                </button>
              ))}
              <span className="text-xs text-muted-foreground ml-2 hidden lg:inline">
                {filteredCompras.length} compras
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-slate-100/90 dark:bg-slate-800/90 border-b border-border">
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Fecha</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Factura Proveedor</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Proveedor / RUC</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-center py-2.5">Ítems</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Condición</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Estado</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-right py-2.5">Total Facturado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      Cargando compras y órdenes de abastecimiento...
                    </TableCell>
                  </TableRow>
                ) : filteredCompras.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      No se encontraron compras con los criterios indicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompras.map((compra) => (
                    <TableRow key={compra.id} className="text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-border/70 transition-colors">
                      <TableCell className="text-muted-foreground font-mono text-xs py-2.5 font-medium">{compra.fecha}</TableCell>
                      <TableCell className="font-mono font-bold text-primary py-2.5">
                        {compra.serieFactura}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="font-semibold text-foreground block text-[13px]">
                          {compra.proveedorNombre}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">RUC: {compra.proveedorRuc}</span>
                      </TableCell>
                      <TableCell className="text-center font-bold font-mono text-foreground py-2.5">
                        {compra.itemsCount} unid.
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-muted border border-border/60">
                          {compra.metodoPago.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <StatusBadge
                          status={compra.estado}
                          variant={compra.estado === 'RECIBIDO' ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell className="text-right font-black font-mono text-foreground py-2.5 text-[14px] tabular-nums">
                        {formatCurrency(compra.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NuevaCompraDialog
        open={openModal}
        onOpenChange={setOpenModal}
        onCompraRegistrada={handleCrearCompra}
      />
    </div>
  );
};

export default ComprasPage;
