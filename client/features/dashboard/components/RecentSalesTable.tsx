import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RecentSale } from '../types/dashboard.types';
import { formatCurrency } from '@/utils/formatters';
import { ArrowUpRight, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';

interface RecentSalesTableProps {
  sales: RecentSale[];
  isLoading?: boolean;
}

export const RecentSalesTable: React.FC<RecentSalesTableProps> = ({ sales, isLoading }) => {
  const navigate = useNavigate();

  return (
    <Card className="rounded-md border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Últimas ventas emitidas
            </CardTitle>
            {!isLoading && sales.length > 0 && (
              <span className="text-xs font-mono text-muted-foreground">
                ({sales.length} registros)
              </span>
            )}
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Comprobantes y boletas generadas durante la jornada
          </CardDescription>
        </div>
        <Link
          to={APP_ROUTES.VENTAS}
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5"
        >
          Ver todas
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-muted/40 rounded-md animate-pulse" />
            ))}
          </div>
        ) : sales.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-border rounded-md p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">
              Aún no se emitieron comprobantes el día de hoy
            </p>
            <p className="text-xs text-muted-foreground">
              Registra una venta desde el mostrador para empezar a registrar ingresos en caja.
            </p>
            <Button
              size="sm"
              onClick={() => navigate(APP_ROUTES.VENTAS)}
              className="mt-2 h-8 px-3 text-xs bg-primary text-primary-foreground font-medium rounded-md gap-1.5"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Registrar venta</span>
            </Button>
          </div>
        ) : (
          <>
            {/* Vista móvil: Lista de tarjetas compactas (evita aplastamiento de columnas en vertical) */}
            <div className="block md:hidden space-y-2.5">
              {sales.map((sale) => {
                const isCompletada = sale.estado === 'COMPLETADA';

                return (
                  <div
                    key={sale.id}
                    className="p-3 rounded-md border border-border bg-background flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-medium text-foreground">
                        {sale.codigo}
                      </span>
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded-sm ${
                          isCompletada
                            ? 'bg-success-soft text-success-text'
                            : 'bg-warning-soft text-warning-text'
                        }`}
                      >
                        {isCompletada ? 'Completada' : 'Pendiente'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {sale.cliente}
                      </p>
                      <span className="font-mono font-semibold text-sm tabular-nums text-foreground shrink-0">
                        {formatCurrency(sale.monto)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/60">
                      <span>{sale.fecha}</span>
                      <span className="px-1.5 py-0.5 rounded-sm bg-muted text-foreground border border-border/60 font-sans">
                        {sale.metodoPago}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vista escritorio / tablet: Tabla estructurada con anchos protegidos */}
            <div className="hidden md:block overflow-x-auto rounded-md border border-border">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/40 border-b border-border">
                    <TableHead className="text-xs font-medium text-muted-foreground py-2 h-9 whitespace-nowrap">
                      N° Comprobante
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-2 h-9">
                      Cliente / Razón Social
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-2 h-9 whitespace-nowrap">
                      Medio de Pago
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-2 h-9 whitespace-nowrap">
                      Estado
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-right py-2 h-9 whitespace-nowrap">
                      Total Cobrado
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => {
                    const isCompletada = sale.estado === 'COMPLETADA';

                    return (
                      <TableRow
                        key={sale.id}
                        className="text-sm hover:bg-muted/40 border-b border-border/80 transition-colors h-10"
                      >
                        <TableCell className="font-mono text-xs font-medium text-foreground py-2 whitespace-nowrap">
                          {sale.codigo}
                          <span className="block text-xs text-muted-foreground font-normal font-sans">
                            {sale.fecha}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-56 truncate text-foreground py-2">
                          {sale.cliente}
                        </TableCell>
                        <TableCell className="py-2 whitespace-nowrap">
                          <span className="text-xs font-normal px-2 py-0.5 rounded-sm bg-muted text-foreground border border-border/60">
                            {sale.metodoPago}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 whitespace-nowrap">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-sm ${
                              isCompletada
                                ? 'bg-success-soft text-success-text'
                                : 'bg-warning-soft text-warning-text'
                            }`}
                          >
                            {isCompletada ? 'Completada' : 'Pendiente'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-sm tabular-nums text-foreground py-2 whitespace-nowrap">
                          {formatCurrency(sale.monto)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSalesTable;
