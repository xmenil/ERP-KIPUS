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
import { StatusBadge } from '@/components/common/StatusBadge';
import { RecentSale } from '../types/dashboard.types';
import { formatCurrency } from '@/utils/formatters';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '@/constants/routes';

interface RecentSalesTableProps {
  sales: RecentSale[];
  isLoading?: boolean;
}

export const RecentSalesTable: React.FC<RecentSalesTableProps> = ({ sales, isLoading }) => {
  return (
    <Card className="border-border/80">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground">
            Últimas Ventas Emitidas
          </CardTitle>
          <CardDescription className="text-xs">
            Comprobantes y boletas generadas hoy
          </CardDescription>
        </div>
        <Link
          to={APP_ROUTES.VENTAS}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          Ver todas
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-muted/40 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-slate-100/90 dark:bg-slate-800/90 border-b border-border">
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">N° Comprobante</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Cliente / Razón Social</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Medio de Pago</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Estado</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-right py-2.5">Total Cobrado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id} className="text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-border/70 transition-colors">
                    <TableCell className="font-mono font-bold text-primary py-2.5">
                      {sale.codigo}
                      <span className="block text-[11px] text-muted-foreground font-normal font-sans">
                        {sale.fecha}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-semibold text-foreground py-2.5">
                      {sale.cliente}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted border border-border/60">
                        {sale.metodoPago}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <StatusBadge
                        status={sale.estado}
                        variant={sale.estado === 'COMPLETADA' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell className="text-right font-black font-mono text-foreground py-2.5 text-[14px] tabular-nums">
                      {formatCurrency(sale.monto)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
