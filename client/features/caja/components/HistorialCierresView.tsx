import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CierreCaja } from '../types/caja.types';
import { formatCurrency } from '@/utils/formatters';
import { CierreResultadoModal } from './CierreResultadoModal';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Store,
  Receipt,
  Printer,
  History,
} from 'lucide-react';

interface HistorialCierresViewProps {
  cierres: CierreCaja[];
  onNuevaApertura?: () => void;
}

export const HistorialCierresView: React.FC<HistorialCierresViewProps> = ({
  cierres,
  onNuevaApertura,
}) => {
  const [cierreSeleccionado, setCierreSeleccionado] = useState<CierreCaja | null>(null);

  return (
    <div className="space-y-4">
      <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
        <CardHeader className="p-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Historial de cierres de turno
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Registro histórico de liquidaciones de caja y balance de entrega de fondos.
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {cierres.length} cierres registrados
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {cierres.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Receipt className="h-8 w-8 text-muted-foreground/50 mx-auto" />
              <p className="text-xs font-medium text-foreground">
                No hay cierres registrados todavía
              </p>
              <p className="text-[11px] text-muted-foreground">
                Cuando finalices un turno de caja, el comprobante se archivará aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs bg-muted/40">
                    <TableHead className="w-24">Fecha</TableHead>
                    <TableHead className="w-20">Hora</TableHead>
                    <TableHead>Caja y Sucursal</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead className="text-right">Saldo Inicial</TableHead>
                    <TableHead className="text-right">Efectivo Entregado</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                    <TableHead className="w-32 text-center">Estado</TableHead>
                    <TableHead className="w-20 text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cierres.map((cie) => {
                    const estaCuadrada = Math.abs(cie.diferencia) < 0.05;
                    return (
                      <TableRow
                        key={cie.id}
                        className="text-xs hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setCierreSeleccionado(cie)}
                      >
                        {/* Fecha */}
                        <TableCell className="font-medium text-foreground">
                          {cie.fechaCierre}
                        </TableCell>

                        {/* Hora */}
                        <TableCell className="font-mono text-muted-foreground">
                          {cie.horaCierre}
                        </TableCell>

                        {/* Caja */}
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {cie.cajaNombre}
                          </div>
                          <span className="text-[10px] text-muted-foreground block">
                            {cie.sucursal}
                          </span>
                        </TableCell>

                        {/* Responsable */}
                        <TableCell className="text-muted-foreground">
                          {cie.responsable}
                        </TableCell>

                        {/* Saldo Inicial */}
                        <TableCell className="text-right font-medium tabular-nums text-muted-foreground">
                          {formatCurrency(cie.saldoInicial)}
                        </TableCell>

                        {/* Saldo Final */}
                        <TableCell className="text-right font-semibold tabular-nums text-foreground">
                          {formatCurrency(cie.saldoContado)}
                        </TableCell>

                        {/* Diferencia */}
                        <TableCell className="text-right">
                          <span
                            className={`font-semibold tabular-nums ${
                              estaCuadrada
                                ? 'text-emerald-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {estaCuadrada ? 'S/ 0.00' : formatCurrency(cie.diferencia)}
                          </span>
                        </TableCell>

                        {/* Estado con Texto e Icono (Regla 6 y 21) */}
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                              estaCuadrada
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {estaCuadrada ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                            )}
                            {estaCuadrada ? 'Cuadrada' : 'Diferencia'}
                          </span>
                        </TableCell>

                        {/* Acción */}
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs font-medium gap-1 text-primary hover:text-primary"
                            onClick={() => setCierreSeleccionado(cie)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Ver</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Visor de Comprobante de Cierre */}
      <CierreResultadoModal
        open={Boolean(cierreSeleccionado)}
        onOpenChange={(open) => !open && setCierreSeleccionado(null)}
        cierre={cierreSeleccionado}
        onNuevaAperturaClick={() => {
          setCierreSeleccionado(null);
          if (onNuevaApertura) onNuevaApertura();
        }}
      />
    </div>
  );
};
