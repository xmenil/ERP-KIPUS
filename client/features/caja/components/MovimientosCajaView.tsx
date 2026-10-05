import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MovimientoCaja } from '../types/caja.types';
import { formatCurrency } from '@/utils/formatters';
import { MovimientoDetalleModal } from './MovimientoDetalleModal';
import {
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  Filter,
  Eye,
  CreditCard,
  Coins,
  Smartphone,
  Receipt,
  Download,
} from 'lucide-react';

interface MovimientosCajaViewProps {
  movimientos: MovimientoCaja[];
  cajaNombre?: string;
}

export const MovimientosCajaView: React.FC<MovimientosCajaViewProps> = ({
  movimientos,
  cajaNombre = 'Caja 01',
}) => {
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'INGRESOS' | 'EGRESOS' | 'VENTAS'>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<MovimientoCaja | null>(null);

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      // Filtro por tab
      if (filtroTipo === 'INGRESOS' && m.tipo !== 'INGRESO') return false;
      if (filtroTipo === 'EGRESOS' && m.tipo !== 'EGRESO') return false;
      if (filtroTipo === 'VENTAS' && m.origenTipo !== 'VENTA') return false;

      // Filtro por texto
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase();
        const coincideConcepto = m.concepto.toLowerCase().includes(query);
        const coincideUsuario = m.usuario.toLowerCase().includes(query);
        const coincideRef = m.comprobanteRef?.toLowerCase().includes(query);
        const coincideMetodo = m.metodo.toLowerCase().includes(query);
        return coincideConcepto || coincideUsuario || coincideRef || coincideMetodo;
      }
      return true;
    });
  }, [movimientos, filtroTipo, busqueda]);

  const renderIconoMetodo = (metodo: string) => {
    switch (metodo) {
      case 'EFECTIVO':
        return <Coins className="h-3.5 w-3.5 text-primary" />;
      case 'YAPE':
      case 'PLIN':
        return <Smartphone className="h-3.5 w-3.5 text-primary" />;
      case 'TARJETA':
        return <CreditCard className="h-3.5 w-3.5 text-primary" />;
      default:
        return <Receipt className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros Operativos */}
      <Card className="border border-border/80 shadow-sm bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Tabs de Filtro Rápido */}
            <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-lg border border-border/60 w-full sm:w-auto overflow-x-auto">
              {(['TODOS', 'INGRESOS', 'EGRESOS', 'VENTAS'] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-3 py-1.5 rounded-md text-xs transition-all whitespace-nowrap ${
                    filtroTipo === tipo
                      ? 'bg-card text-foreground shadow-xs border border-border font-medium'
                      : 'text-muted-foreground hover:text-foreground font-normal'
                  }`}
                >
                  {tipo === 'TODOS'
                    ? 'Todos'
                    : tipo === 'INGRESOS'
                    ? 'Ingresos (+)'
                    : tipo === 'EGRESOS'
                    ? 'Egresos (-)'
                    : 'Ventas (+)'}
                </button>
              ))}
            </div>

            {/* Buscador */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por concepto o comprobante..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Movimientos */}
      <Card className="border border-border/80 shadow-sm bg-card overflow-hidden">
        <CardHeader className="p-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              Movimientos del turno • {cajaNombre}
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">
              Mostrando {movimientosFiltrados.length} operaciones registradas
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {movimientosFiltrados.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Receipt className="h-8 w-8 text-muted-foreground/50 mx-auto" />
              <p className="text-xs font-medium text-foreground">
                No se encontraron movimientos con los filtros seleccionados
              </p>
              <p className="text-[11px] text-muted-foreground">
                Los cobros de ventas y registros manuales aparecerán aquí inmediatamente.
              </p>
            </div>
          ) : (
            <>
              {/* VISTA ESCRITORIO (>= md): Tabla completa con scroll horizontal seguro */}
              <div className="hidden md:block overflow-x-auto">
                <Table className="w-full min-w-[760px]">
                  <TableHeader>
                    <TableRow className="text-xs bg-muted/40 border-b border-border">
                      <TableHead className="w-20 whitespace-nowrap py-3 px-3">Hora</TableHead>
                      <TableHead className="min-w-[200px] whitespace-nowrap py-3 px-3">Concepto / Detalle</TableHead>
                      <TableHead className="w-28 whitespace-nowrap py-3 px-3">Tipo</TableHead>
                      <TableHead className="w-28 whitespace-nowrap py-3 px-3">Método</TableHead>
                      <TableHead className="w-28 whitespace-nowrap py-3 px-3 text-right">Monto</TableHead>
                      <TableHead className="w-28 whitespace-nowrap py-3 px-3">Cajero</TableHead>
                      <TableHead className="w-16 whitespace-nowrap py-3 px-3 text-center">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientosFiltrados.map((mov) => {
                      const esIngreso = mov.tipo === 'INGRESO';
                      return (
                        <TableRow
                          key={mov.id}
                          className="text-xs hover:bg-muted/30 cursor-pointer transition-colors border-b border-border/60"
                          onClick={() => setMovimientoSeleccionado(mov)}
                        >
                          {/* Hora */}
                          <TableCell className="font-mono text-muted-foreground whitespace-nowrap py-3 px-3">
                            {mov.hora || mov.fecha}
                          </TableCell>

                          {/* Concepto */}
                          <TableCell className="py-3 px-3">
                            <div className="font-medium text-foreground line-clamp-1">
                              {mov.concepto}
                            </div>
                            {mov.comprobanteRef && (
                              <span className="text-[10px] text-primary font-mono block">
                                Ref: {mov.comprobanteRef}
                              </span>
                            )}
                          </TableCell>

                          {/* Tipo */}
                          <TableCell className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                                esIngreso
                                  ? 'bg-success-soft text-success-text border-success/30'
                                  : 'bg-danger-soft text-danger-text border-destructive/30'
                              }`}
                            >
                              {esIngreso ? (
                                <ArrowDownCircle className="h-3 w-3 text-success" />
                              ) : (
                                <ArrowUpCircle className="h-3 w-3 text-destructive" />
                              )}
                              {esIngreso ? 'Ingreso' : 'Egreso'}
                            </span>
                          </TableCell>

                          {/* Método */}
                          <TableCell className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium whitespace-nowrap">
                              {renderIconoMetodo(mov.metodo)}
                              {mov.metodo}
                            </span>
                          </TableCell>

                          {/* Monto (+ S/ en verde, - S/ en rojo con tabular-nums) */}
                          <TableCell className="text-right py-3 px-3">
                            <span
                              className={`font-semibold tabular-nums text-xs font-mono whitespace-nowrap ${
                                esIngreso ? 'text-success-text' : 'text-danger-text'
                              }`}
                            >
                              {esIngreso ? '+' : '-'} {formatCurrency(mov.monto)}
                            </span>
                          </TableCell>

                          {/* Usuario */}
                          <TableCell className="text-muted-foreground text-xs py-3 px-3 whitespace-nowrap">
                            {mov.usuario}
                          </TableCell>

                          {/* Acción */}
                          <TableCell className="text-center py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => setMovimientoSeleccionado(mov)}
                              title="Ver detalle del movimiento"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* VISTA MÓVIL (< md): Tarjetas ergonómicas con targets táctiles amplios */}
              <div className="block md:hidden divide-y divide-border">
                {movimientosFiltrados.map((mov) => {
                  const esIngreso = mov.tipo === 'INGRESO';
                  return (
                    <div
                      key={mov.id}
                      onClick={() => setMovimientoSeleccionado(mov)}
                      className="p-3.5 space-y-2 hover:bg-muted/10 active:bg-muted/20 transition-colors cursor-pointer"
                    >
                      {/* Cabecera de la tarjeta: Badge de Tipo y Hora */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                            esIngreso
                              ? 'bg-success-soft text-success-text border-success/30'
                              : 'bg-danger-soft text-danger-text border-destructive/30'
                          }`}
                        >
                          {esIngreso ? (
                            <ArrowDownCircle className="h-3 w-3 text-success" />
                          ) : (
                            <ArrowUpCircle className="h-3 w-3 text-destructive" />
                          )}
                          {esIngreso ? 'Ingreso' : 'Egreso'}
                        </span>

                        <span className="text-xs font-mono text-muted-foreground">
                          {mov.hora || mov.fecha}
                        </span>
                      </div>

                      {/* Concepto y comprobante */}
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-foreground leading-snug">
                          {mov.concepto}
                        </div>
                        {mov.comprobanteRef && (
                          <span className="text-[11px] font-mono text-primary block">
                            Ref: {mov.comprobanteRef}
                          </span>
                        )}
                      </div>

                      {/* Método de pago, Cajero y Monto Final */}
                      <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            {renderIconoMetodo(mov.metodo)}
                            {mov.metodo}
                          </span>
                          <span>•</span>
                          <span>{mov.usuario}</span>
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-semibold tabular-nums text-sm font-mono ${
                              esIngreso ? 'text-success-text' : 'text-danger-text'
                            }`}
                          >
                            {esIngreso ? '+' : '-'} {formatCurrency(mov.monto)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalle */}
      <MovimientoDetalleModal
        open={Boolean(movimientoSeleccionado)}
        onOpenChange={(open) => !open && setMovimientoSeleccionado(null)}
        movimiento={movimientoSeleccionado}
      />
    </div>
  );
};
