import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Venta, ResumenVentasKpis } from '../types/ventas.types';
import { formatCurrency } from '@/utils/formatters';
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Receipt,
  Printer,
  Eye,
  PlusCircle,
  CreditCard,
  Building2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface VentasDashboardViewProps {
  ventas: Venta[];
  kpis: ResumenVentasKpis | null;
  onIrAPos: () => void;
  onVerDetalleVenta: (venta: Venta) => void;
}

export const VentasDashboardView: React.FC<VentasDashboardViewProps> = ({
  ventas,
  kpis,
  onIrAPos,
  onVerDetalleVenta,
}) => {
  const ventasHoy = ventas.slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Banner de acción principal y bienvenida ejecutiva */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-lg border border-border bg-card shadow-2xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              Mostrador de Ventas y Facturación
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
              Caja Abierta
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Emite comprobantes electrónicos, boletas, facturas y controla los ingresos de tu turno.
          </p>
        </div>

        <Button
          size="lg"
          onClick={onIrAPos}
          className="gap-2 bg-primary text-primary-foreground font-bold text-sm h-11 px-5 shadow-xs"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>+ ABRIR PUNTO DE VENTA (POS)</span>
        </Button>
      </div>

      {/* Tarjetas de Métricas Ejecutivas del Día */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Facturado */}
        <Card className="border-border/80">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              <span>Ventas del Día</span>
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {formatCurrency(kpis?.totalVendidoHoy || 0)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>+{kpis?.comparativaAyerPorcentaje}% vs. ayer</span>
            </div>
          </CardContent>
        </Card>

        {/* Transacciones Realizadas */}
        <Card className="border-border/80">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              <span>Comprobantes Emitidos</span>
              <Receipt className="h-3.5 w-3.5 text-primary" />
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {kpis?.transaccionesHoy || 0} operaciones
            </div>
            <p className="text-[11px] text-muted-foreground">
              Boletas, facturas y notas de venta
            </p>
          </CardContent>
        </Card>

        {/* Ticket Promedio */}
        <Card className="border-border/80">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              <span>Ticket Promedio</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {formatCurrency(kpis?.ticketPromedioHoy || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Gasto promedio por cada cliente
            </p>
          </CardContent>
        </Card>

        {/* Artículos Despachados */}
        <Card className="border-border/80">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              <span>Unidades Despachadas</span>
              <ShoppingCart className="h-3.5 w-3.5 text-amber-600" />
            </span>
            <div className="text-2xl font-bold font-mono tabular-nums text-foreground">
              {kpis?.articulosDespachadosHoy || 0} unid.
            </div>
            <p className="text-[11px] text-muted-foreground">
              Descontadas automáticamente de Kardex
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por método de pago */}
      {kpis && kpis.ventasPorMetodo.length > 0 && (
        <Card className="border-border/80">
          <CardHeader className="p-3.5 pb-2">
            <CardTitle className="text-xs font-semibold text-foreground">
              Ingresos según Método de Pago de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {kpis.ventasPorMetodo.map((m) => (
                <div
                  key={m.metodo}
                  className="rounded border border-border/70 bg-muted/30 p-2.5 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                    <span className="font-medium text-foreground">{m.metodo}</span>
                    <span className="font-mono">{m.porcentaje}%</span>
                  </div>
                  <div className="text-base font-bold font-mono tabular-nums text-foreground">
                    {formatCurrency(m.total)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de ventas recientes del día */}
      <Card className="border-border/80">
        <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-semibold text-foreground">
              Ventas Recientes del Turno
            </CardTitle>
            <CardDescription className="text-[11px]">
              Comprobantes emitidos recientemente en mostrador.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onIrAPos}
            className="h-7 text-xs font-semibold gap-1 text-primary hover:border-primary"
          >
            <PlusCircle className="h-3 w-3" />
            <span>Cobrar nueva venta</span>
          </Button>
        </CardHeader>
        <CardContent className="p-3.5 pt-0">
          <div className="overflow-x-auto rounded border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 border-b border-border">
                  <TableHead className="text-xs py-2">Comprobante</TableHead>
                  <TableHead className="text-xs py-2">Cliente</TableHead>
                  <TableHead className="text-xs py-2">Hora</TableHead>
                  <TableHead className="text-xs py-2">Medio Pago</TableHead>
                  <TableHead className="text-xs py-2 text-right">Total Cobrado</TableHead>
                  <TableHead className="text-xs py-2 text-center w-28">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventasHoy.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-xs text-muted-foreground">
                      Aún no hay ventas registradas en este turno.
                    </TableCell>
                  </TableRow>
                ) : (
                  ventasHoy.map((v) => (
                    <TableRow key={v.id} className="text-xs hover:bg-muted/20 border-b border-border/60">
                      <TableCell className="py-2">
                        <span className="font-mono font-bold text-primary block">
                          {v.serieCorrelativo}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{v.tipoComprobante}</span>
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="font-medium text-foreground block">{v.clienteNombre}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{v.clienteDocumento}</span>
                      </TableCell>
                      <TableCell className="py-2 font-mono text-muted-foreground text-[11px]">
                        {v.fecha}
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted border border-border/60">
                          {v.metodoPago}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono font-bold text-foreground text-sm tabular-nums">
                        {formatCurrency(v.total)}
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onVerDetalleVenta(v)}
                            className="h-7 w-7 p-0"
                            title="Ver detalle del comprobante"
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.info(`Imprimiendo ticket ${v.serieCorrelativo}...`)}
                            className="h-7 w-7 p-0"
                            title="Reimprimir ticket"
                          >
                            <Printer className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
