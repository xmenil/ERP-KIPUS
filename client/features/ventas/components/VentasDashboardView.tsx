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
import { formatMoney } from '@/utils/formatters';
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-md border border-border bg-card shadow-2xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              Mostrador de Ventas y Facturación
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-success-soft text-success-text font-semibold border border-success/30">
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
          className="gap-2 bg-primary text-primary-foreground font-semibold text-xs sm:text-sm h-10 sm:h-11 px-5 shadow-xs shrink-0"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Abrir Punto de Venta (POS)</span>
        </Button>
      </div>

      {/* Tarjetas de Métricas Ejecutivas del Día */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Facturado */}
        <Card className="border-border/80 rounded-md">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              <span>Ventas del Día</span>
              <DollarSign className="h-3.5 w-3.5 text-success-text" />
            </span>
            <div className="text-2xl font-semibold font-mono tabular-nums text-foreground">
              {formatMoney(kpis?.totalVendidoHoy || 0)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-success-text font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>+{kpis?.comparativaAyerPorcentaje}% vs. ayer</span>
            </div>
          </CardContent>
        </Card>

        {/* Comprobantes Emitidos */}
        <Card className="border-border/80 rounded-md">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              <span>Comprobantes Emitidos</span>
              <Receipt className="h-3.5 w-3.5 text-primary" />
            </span>
            <div className="text-2xl font-semibold font-mono tabular-nums text-foreground">
              {kpis?.transaccionesHoy || 0} operaciones
            </div>
            <div className="text-[11px] text-muted-foreground">
              Boletas, facturas y notas de venta
            </div>
          </CardContent>
        </Card>

        {/* Ticket Promedio */}
        <Card className="border-border/80 rounded-md">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              <span>Ticket Promedio</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
            </span>
            <div className="text-2xl font-semibold font-mono tabular-nums text-foreground">
              {formatMoney(kpis?.ticketPromedioHoy || 0)}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              Consumo promedio por venta
            </div>
          </CardContent>
        </Card>

        {/* Unidades Despachadas */}
        <Card className="border-border/80 rounded-md">
          <CardContent className="p-3.5 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              <span>Unidades Despachadas</span>
              <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
            <div className="text-2xl font-semibold font-mono tabular-nums text-foreground">
              {kpis?.articulosDespachadosHoy || 0} unid.
            </div>
            <div className="text-[11px] text-muted-foreground">
              Descontadas de Kardex hoy
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por Medio de Pago en Caja */}
      {kpis?.ventasPorMetodo && (
        <Card className="border-border/80 rounded-md">
          <CardHeader className="p-3.5 pb-2">
            <CardTitle className="text-xs font-semibold text-foreground">
              Ingresos por Medio de Pago (Turno Actual)
            </CardTitle>
            <CardDescription className="text-[11px]">
              Distribución de cobranzas en efectivo y pagos digitales.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {kpis.ventasPorMetodo.map((m) => (
                <div
                  key={m.metodo}
                  className="rounded-md border border-border/70 bg-muted/30 p-2.5 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                    <span className="font-medium text-foreground">{m.metodo}</span>
                    <span className="font-mono">{m.porcentaje}%</span>
                  </div>
                  <div className="text-base font-semibold font-mono tabular-nums text-foreground">
                    {formatMoney(m.total)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla y tarjetas de ventas recientes del día */}
      <Card className="border-border/80 rounded-md">
        <CardHeader className="p-3.5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
            className="h-8 text-xs font-semibold gap-1 text-primary hover:border-primary w-full sm:w-auto"
          >
            <PlusCircle className="h-3 w-3" />
            <span>Cobrar nueva venta</span>
          </Button>
        </CardHeader>
        <CardContent className="p-3.5 pt-0">
          {ventasHoy.length === 0 ? (
            <div className="h-24 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-md">
              <p className="text-xs text-muted-foreground">
                Aún no hay ventas registradas en este turno.
              </p>
            </div>
          ) : (
            <div>
              {/* Vista Desktop / Tablet (pantallas ≥ sm): Tabla protegida */}
              <div className="hidden sm:block overflow-x-auto rounded border border-border">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow className="bg-muted/40 border-b border-border">
                      <TableHead className="text-xs py-2 whitespace-nowrap">Comprobante</TableHead>
                      <TableHead className="text-xs py-2 min-w-[150px] whitespace-nowrap">Cliente</TableHead>
                      <TableHead className="text-xs py-2 whitespace-nowrap">Hora</TableHead>
                      <TableHead className="text-xs py-2 whitespace-nowrap">Medio Pago</TableHead>
                      <TableHead className="text-xs py-2 text-right whitespace-nowrap">Total Cobrado</TableHead>
                      <TableHead className="text-xs py-2 text-center w-28 whitespace-nowrap">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventasHoy.map((v) => (
                      <TableRow key={v.id} className="text-xs hover:bg-muted/20 border-b border-border/60">
                        <TableCell className="py-2 whitespace-nowrap">
                          <span className="font-mono font-semibold text-primary block">
                            {v.serieCorrelativo}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{v.tipoComprobante}</span>
                        </TableCell>
                        <TableCell className="py-2 min-w-[150px]">
                          <span className="font-medium text-foreground block">{v.clienteNombre}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{v.clienteDocumento}</span>
                        </TableCell>
                        <TableCell className="py-2 font-mono text-muted-foreground text-[11px] whitespace-nowrap">
                          {v.fecha}
                        </TableCell>
                        <TableCell className="py-2 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted border border-border/60">
                            {v.metodoPago}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono font-semibold text-foreground text-sm tabular-nums whitespace-nowrap">
                          {formatMoney(v.total)}
                        </TableCell>
                        <TableCell className="py-2 text-center whitespace-nowrap">
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
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Vista Móvil (pantallas < sm): Tarjetas Compactas */}
              <div className="sm:hidden space-y-2 pt-1">
                {ventasHoy.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-md border border-border bg-card shadow-2xs space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-primary text-xs">
                            {v.serieCorrelativo}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                            {v.tipoComprobante}
                          </span>
                        </div>
                        <h4 className="font-medium text-foreground text-xs mt-1">
                          {v.clienteNombre}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Doc: {v.clienteDocumento}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-semibold text-foreground text-sm tabular-nums block">
                          {formatMoney(v.total)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted border border-border/60">
                          {v.metodoPago}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-mono">{v.fecha}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onVerDetalleVenta(v)}
                          className="h-7 text-[11px] px-2 gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Ver</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.info(`Imprimiendo ticket ${v.serieCorrelativo}...`)}
                          className="h-7 text-[11px] px-2 gap-1"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Ticket</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
