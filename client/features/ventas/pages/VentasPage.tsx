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
import { StatusBadge } from '@/components/common/StatusBadge';
import { MetricCard } from '@/components/common/MetricCard';
import { NuevaVentaDialog } from '../components/NuevaVentaDialog';
import { ventasService } from '../services/ventasService';
import { Venta, NuevaVentaPayload } from '../types/ventas.types';
import { subscribeToErp } from '@/services/erp/erpStore';
import { formatCurrency } from '@/utils/formatters';
import {
  PlusCircle,
  Search,
  ShoppingCart,
  FileText,
  DollarSign,
  Printer,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export const VentasPage: React.FC = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const data = await ventasService.getVentas();
      setVentas(data);
    } catch {
      toast.error('Error al cargar la lista de ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
    const unsubscribe = subscribeToErp(() => {
      fetchVentas();
    });
    return unsubscribe;
  }, []);

  const handleCrearVenta = async (payload: NuevaVentaPayload) => {
    try {
      const nueva = await ventasService.crearVenta(payload);
      setVentas((prev) => [nueva, ...prev]);
      toast.success(`Venta ${nueva.serieCorrelativo} emitida con éxito`);
    } catch {
      toast.error('No se pudo emitir la venta');
    }
  };

  const filteredVentas = ventas.filter(
    (v) =>
      v.serieCorrelativo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.clienteDocumento.includes(searchTerm)
  );

  const totalVendido = ventas.reduce((acc, v) => acc + (v.estado !== 'ANULADA' ? v.total : 0), 0);
  const totalFacturas = ventas.filter((v) => v.tipoComprobante === 'FACTURA').length;
  const totalBoletas = ventas.filter((v) => v.tipoComprobante === 'BOLETA').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Ventas y Comprobantes"
        description="Emisión de comprobantes electrónicos, boletas, facturas y control de caja de ventas"
        badge="SUNAT Integrable"
      >
        <Button
          size="sm"
          onClick={() => setOpenModal(true)}
          className="gap-2 bg-primary text-primary-foreground font-semibold shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Emitir Nuevo Comprobante</span>
        </Button>
      </PageHeader>

      {/* Métricas rápidas de ventas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Facturación del Día"
          value={formatCurrency(totalVendido)}
          subtitle={`${ventas.length} transacciones registradas`}
          icon={DollarSign}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
        />
        <MetricCard
          title="Boletas Electrónicas"
          value={`${totalBoletas}`}
          subtitle="Emitidas para consumidor final"
          icon={ShoppingCart}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40"
        />
        <MetricCard
          title="Facturas con RUC"
          value={`${totalFacturas}`}
          subtitle="Empresas y crédito fiscal"
          icon={FileText}
          iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40"
        />
      </div>

      {/* Buscador y Tabla */}
      <Card className="border-border/80">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, RUC/DNI o serie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Mostrando {filteredVentas.length} comprobantes
            </span>
          </div>

          <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-slate-100/90 dark:bg-slate-800/90 border-b border-border">
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Comprobante</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Cliente</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Fecha y Hora</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Medio de Pago</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Estado</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-right py-2.5">Total Cobrado</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-center py-2.5">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      Cargando ventas...
                    </TableCell>
                  </TableRow>
                ) : filteredVentas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                      No se encontraron comprobantes con el criterio de búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVentas.map((venta) => (
                    <TableRow key={venta.id} className="text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-border/70 transition-colors">
                      <TableCell className="py-2.5">
                        <span className="font-mono font-bold text-primary block text-[13px]">
                          {venta.serieCorrelativo}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {venta.tipoComprobante}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="font-semibold text-foreground block text-[13px]">{venta.clienteNombre}</span>
                        <span className="text-[11px] text-muted-foreground">Doc: {venta.clienteDocumento}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground py-2.5 font-mono text-xs">{venta.fecha}</TableCell>
                      <TableCell className="py-2.5">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-muted border border-border/60">
                          {venta.metodoPago}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <StatusBadge
                          status={venta.estado}
                          variant={venta.estado === 'COMPLETADA' ? 'success' : venta.estado === 'PENDIENTE' ? 'warning' : 'danger'}
                        />
                      </TableCell>
                      <TableCell className="text-right font-black font-mono text-foreground py-2.5 text-[14px] tabular-nums">
                        {formatCurrency(venta.total)}
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1 font-medium hover:bg-muted"
                          title="Imprimir Ticket"
                          onClick={() => toast.info(`Imprimiendo comprobante ${venta.serieCorrelativo}...`)}
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Ticket</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Nueva Venta */}
      <NuevaVentaDialog
        open={openModal}
        onOpenChange={setOpenModal}
        onVentaCreada={handleCrearVenta}
      />
    </div>
  );
};

export default VentasPage;
