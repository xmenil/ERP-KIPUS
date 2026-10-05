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
            <>
              {/* VISTA ESCRITORIO (>= md): Tabla completa con scroll horizontal */}
              <div className="hidden md:block overflow-x-auto">
                <Table className="w-full min-w-[820px]">
                  <TableHeader>
                    <TableRow className="text-xs bg-muted/40 border-b border-border">
                      <TableHead className="w-24 whitespace-nowrap py-3 px-3">Fecha</TableHead>
                      <TableHead className="w-20 whitespace-nowrap py-3 px-3">Hora</TableHead>
                      <TableHead className="whitespace-nowrap py-3 px-3">Caja y Sucursal</TableHead>
                      <TableHead className="whitespace-nowrap py-3 px-3">Responsable</TableHead>
                      <TableHead className="text-right whitespace-nowrap py-3 px-3">Saldo Inicial</TableHead>
                      <TableHead className="text-right whitespace-nowrap py-3 px-3">Efectivo Entregado</TableHead>
                      <TableHead className="text-right whitespace-nowrap py-3 px-3">Diferencia</TableHead>
                      <TableHead className="w-32 whitespace-nowrap py-3 px-3 text-center">Estado</TableHead>
                      <TableHead className="w-20 whitespace-nowrap py-3 px-3 text-center">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cierres.map((cie) => {
                      const estaCuadrada = Math.abs(cie.diferencia) < 0.05;
                      return (
                        <TableRow
                          key={cie.id}
                          className="text-xs hover:bg-muted/30 cursor-pointer transition-colors border-b border-border/60"
                          onClick={() => setCierreSeleccionado(cie)}
                        >
                          {/* Fecha */}
                          <TableCell className="font-medium text-foreground whitespace-nowrap py-3 px-3">
                            {cie.fechaCierre}
                          </TableCell>

                          {/* Hora */}
                          <TableCell className="font-mono text-muted-foreground whitespace-nowrap py-3 px-3">
                            {cie.horaCierre}
                          </TableCell>

                          {/* Caja */}
                          <TableCell className="py-3 px-3">
                            <div className="font-medium text-foreground">
                              {cie.cajaNombre}
                            </div>
                            <span className="text-[10px] text-muted-foreground block">
                              {cie.sucursal}
                            </span>
                          </TableCell>

                          {/* Responsable */}
                          <TableCell className="text-muted-foreground py-3 px-3 whitespace-nowrap">
                            {cie.responsable}
                          </TableCell>

                          {/* Saldo Inicial */}
                          <TableCell className="text-right font-medium tabular-nums text-muted-foreground py-3 px-3 whitespace-nowrap">
                            {formatCurrency(cie.saldoInicial)}
                          </TableCell>

                          {/* Saldo Final */}
                          <TableCell className="text-right font-semibold tabular-nums text-foreground py-3 px-3 whitespace-nowrap">
                            {formatCurrency(cie.saldoContado)}
                          </TableCell>

                          {/* Diferencia */}
                          <TableCell className="text-right py-3 px-3 whitespace-nowrap">
                            <span
                              className={`font-semibold tabular-nums font-mono ${
                                estaCuadrada
                                  ? 'text-success-text'
                                  : 'text-warning-text'
                              }`}
                            >
                              {estaCuadrada ? 'S/ 0.00' : formatCurrency(cie.diferencia)}
                            </span>
                          </TableCell>

                          {/* Estado con Texto e Icono (Regla 6 y 21) */}
                          <TableCell className="text-center py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                                estaCuadrada
                                  ? 'bg-success-soft text-success-text border-success/30'
                                  : 'bg-warning-soft text-warning-text border-warning/30'
                              }`}
                            >
                              {estaCuadrada ? (
                                <CheckCircle2 className="h-3 w-3 text-success" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-warning" />
                              )}
                              {estaCuadrada ? 'Cuadrada' : 'Diferencia'}
                            </span>
                          </TableCell>

                          {/* Acción */}
                          <TableCell className="text-center py-3 px-3" onClick={(e) => e.stopPropagation()}>
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

              {/* VISTA MÓVIL (< md): Tarjetas ergonómicas de liquidación */}
              <div className="block md:hidden divide-y divide-border">
                {cierres.map((cie) => {
                  const estaCuadrada = Math.abs(cie.diferencia) < 0.05;
                  return (
                    <div
                      key={cie.id}
                      className="p-3.5 space-y-3 hover:bg-muted/10 transition-colors"
                    >
                      {/* Cabecera: Fecha/Hora y Badge de Estado */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {cie.fechaCierre} • {cie.horaCierre}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
                            estaCuadrada
                              ? 'bg-success-soft text-success-text border-success/30'
                              : 'bg-warning-soft text-warning-text border-warning/30'
                          }`}
                        >
                          {estaCuadrada ? (
                            <CheckCircle2 className="h-3 w-3 text-success" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-warning" />
                          )}
                          {estaCuadrada ? 'Cuadrada' : 'Diferencia'}
                        </span>
                      </div>

                      {/* Información de Caja y Responsable */}
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground">
                          {cie.cajaNombre} • <span className="font-normal text-muted-foreground">{cie.sucursal}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Responsable: <strong className="text-foreground font-medium">{cie.responsable}</strong>
                        </div>
                      </div>

                      {/* Resumen financiero en grid de 3 columnas */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-md bg-muted/30 border border-border/60 text-center">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Inicial</span>
                          <span className="text-xs font-medium text-muted-foreground tabular-nums font-mono">
                            {formatCurrency(cie.saldoInicial)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Entregado</span>
                          <span className="text-xs font-semibold text-foreground tabular-nums font-mono">
                            {formatCurrency(cie.saldoContado)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Diferencia</span>
                          <span
                            className={`text-xs font-semibold tabular-nums font-mono ${
                              estaCuadrada ? 'text-success-text' : 'text-warning-text'
                            }`}
                          >
                            {estaCuadrada ? 'S/ 0.00' : formatCurrency(cie.diferencia)}
                          </span>
                        </div>
                      </div>

                      {/* Botón de acción móvil accesible */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs font-medium gap-1.5 border-border"
                        onClick={() => setCierreSeleccionado(cie)}
                      >
                        <Eye className="h-3.5 w-3.5 text-primary" />
                        <span>Ver acta de liquidación</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
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
