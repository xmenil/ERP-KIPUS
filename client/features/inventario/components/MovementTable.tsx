import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchBar } from './SearchBar';
import { EmptyState } from './EmptyState';
import { MovimientoStock } from '../types/inventario.types';
import { formatDateTime } from '@/utils/formatters';
import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Info, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MovementTableProps {
  movimientos: MovimientoStock[];
  initialSearch?: string;
  onClearInitialSearch?: () => void;
}

/**
 * Tabla simple y directa de Entradas y Salidas de inventario.
 * Consulta la trazabilidad generada automáticamente por compras, ventas y ajustes.
 */
export const MovementTable: React.FC<MovementTableProps> = ({
  movimientos,
  initialSearch = '',
  onClearInitialSearch,
}) => {
  const [busqueda, setBusqueda] = useState(initialSearch);
  const [tipoFiltro, setTipoFiltro] = useState<string>('TODOS');
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('TODOS');

  // Mantener sincronizado si initialSearch cambia desde afuera
  React.useEffect(() => {
    if (initialSearch) {
      setBusqueda(initialSearch);
    }
  }, [initialSearch]);

  const handleBusquedaChange = (val: string) => {
    setBusqueda(val);
    if (!val && onClearInitialSearch) {
      onClearInitialSearch();
    }
  };

  const handleResetFilters = () => {
    setBusqueda('');
    setTipoFiltro('TODOS');
    setPeriodoFiltro('TODOS');
    if (onClearInitialSearch) onClearInitialSearch();
  };

  const hayFiltrosActivos = busqueda !== '' || tipoFiltro !== 'TODOS' || periodoFiltro !== 'TODOS';

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      // Filtro texto
      const matchBusqueda =
        m.productoNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
        (m.referencia && m.referencia.toLowerCase().includes(busqueda.toLowerCase())) ||
        (m.origen && m.origen.toLowerCase().includes(busqueda.toLowerCase()));

      // Filtro tipo
      const matchTipo = tipoFiltro === 'TODOS' || m.tipo === tipoFiltro;

      // Filtro período
      let matchPeriodo = true;
      if (periodoFiltro !== 'TODOS') {
        const movDate = m.fecha ? new Date(m.fecha.replace(' ', 'T')) : new Date();
        const hoy = new Date();
        if (isNaN(movDate.getTime())) {
          matchPeriodo = true;
        } else if (periodoFiltro === 'HOY') {
          matchPeriodo = movDate.toDateString() === hoy.toDateString();
        } else if (periodoFiltro === '7_DIAS') {
          const hace7Dias = new Date();
          hace7Dias.setDate(hoy.getDate() - 7);
          matchPeriodo = movDate >= hace7Dias;
        } else if (periodoFiltro === 'ESTE_MES') {
          matchPeriodo =
            movDate.getMonth() === hoy.getMonth() && movDate.getFullYear() === hoy.getFullYear();
        }
      }

      return matchBusqueda && matchTipo && matchPeriodo;
    });
  }, [movimientos, busqueda, tipoFiltro, periodoFiltro]);

  return (
    <div className="space-y-4">
      {/* Banner discreto de automatización según requerimiento 4 y 7 */}
      <div className="flex items-start gap-2.5 p-3 rounded-md bg-muted/40 border border-border text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong className="text-foreground font-medium">Registro automático:</strong> Cada vez que confirmas una compra el stock aumenta, y al concretar una venta disminuye sin necesidad de registrarlo manualmente.
        </p>
      </div>

      {/* Barra de Filtros Simples */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <SearchBar
              value={busqueda}
              onChange={handleBusquedaChange}
              placeholder="Buscar producto, código SKU o comprobante…"
              className="flex-1"
            />

            <div className="w-full sm:w-36 shrink-0">
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger className="h-9 text-xs border-border bg-card">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS" className="text-xs">
                    Todos los tipos
                  </SelectItem>
                  <SelectItem value="ENTRADA" className="text-xs">
                    Entrada
                  </SelectItem>
                  <SelectItem value="SALIDA" className="text-xs">
                    Salida
                  </SelectItem>
                  <SelectItem value="AJUSTE" className="text-xs">
                    Ajuste
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-40 shrink-0">
              <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
                <SelectTrigger className="h-9 text-xs border-border bg-card">
                  <SelectValue placeholder="Fecha / Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS" className="text-xs">
                    Cualquier fecha
                  </SelectItem>
                  <SelectItem value="HOY" className="text-xs">
                    Hoy
                  </SelectItem>
                  <SelectItem value="7_DIAS" className="text-xs">
                    Últimos 7 días
                  </SelectItem>
                  <SelectItem value="ESTE_MES" className="text-xs">
                    Este mes
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
            <div className="flex items-center gap-2">
              {hayFiltrosActivos && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 -ml-1 font-normal"
                >
                  <RotateCcw className="h-3 w-3" />
                  Limpiar filtros
                </Button>
              )}
            </div>

            <span className="tabular-nums ml-auto text-xs">
              Mostrando <strong className="text-foreground font-medium">{movimientosFiltrados.length}</strong>{' '}
              {movimientosFiltrados.length === 1 ? 'movimiento' : 'movimientos'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Contenido: Tabla de Movimientos */}
      {movimientosFiltrados.length === 0 ? (
        <EmptyState
          title={hayFiltrosActivos ? 'Sin coincidencias' : 'No hay movimientos registrados'}
          description={
            hayFiltrosActivos
              ? 'Prueba ajustando los filtros de fecha, tipo o búsqueda.'
              : 'Las compras, ventas y ajustes de stock generarán registros automáticos aquí.'
          }
          actionLabel={hayFiltrosActivos ? 'Limpiar filtros' : undefined}
          onAction={hayFiltrosActivos ? handleResetFilters : undefined}
        />
      ) : (
        <div className="space-y-3">
          {/* Vista Escritorio: Tabla */}
          <div className="hidden md:block overflow-x-auto rounded-md border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 border-b border-border hover:bg-transparent">
                  <TableHead className="text-xs font-semibold py-3 px-4 text-foreground w-40">
                    Fecha
                  </TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-4 text-foreground">
                    Producto
                  </TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-3 text-foreground w-28">
                    Tipo
                  </TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-4 text-right text-foreground w-32">
                    Cantidad
                  </TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-4 text-foreground w-56">
                    Origen / Referencia
                  </TableHead>
                  <TableHead className="text-xs font-semibold py-3 px-4 text-foreground w-36">
                    Usuario
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientosFiltrados.map((mov) => {
                  const isEntrada = mov.tipo === 'ENTRADA';
                  const isSalida = mov.tipo === 'SALIDA';

                  return (
                    <TableRow
                      key={mov.id}
                      className="border-b border-border/70 hover:bg-muted/30 transition-colors h-12"
                    >
                      {/* Fecha */}
                      <TableCell className="py-2.5 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(mov.fecha)}
                      </TableCell>

                      {/* Producto */}
                      <TableCell className="py-2.5 px-4">
                        <span className="font-medium text-sm text-foreground block leading-tight">
                          {mov.productoNombre}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">{mov.sku}</span>
                      </TableCell>

                      {/* Tipo con Badge accesible */}
                      <TableCell className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border select-none',
                            isEntrada && 'bg-success-soft text-success-text border-success/30',
                            isSalida && 'bg-danger-soft text-danger-text border-destructive/30',
                            !isEntrada && !isSalida && 'bg-warning-soft text-warning-text border-warning/30'
                          )}
                        >
                          {isEntrada ? (
                            <ArrowDownRight className="h-3 w-3" />
                          ) : isSalida ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowLeftRight className="h-3 w-3" />
                          )}
                          <span>
                            {isEntrada ? 'Entrada' : isSalida ? 'Salida' : 'Ajuste'}
                          </span>
                        </span>
                      </TableCell>

                      {/* Cantidad */}
                      <TableCell className="py-2.5 px-4 text-right">
                        <span
                          className={cn(
                            'font-semibold font-mono text-sm tabular-nums',
                            isEntrada && 'text-success-text',
                            isSalida && 'text-danger-text',
                            !isEntrada && !isSalida && 'text-warning-text'
                          )}
                        >
                          {isEntrada ? `+${mov.cantidad}` : isSalida ? `-${mov.cantidad}` : mov.cantidad}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">unidades</span>
                      </TableCell>

                      {/* Origen */}
                      <TableCell className="py-2.5 px-4">
                        <span className="font-medium text-xs text-foreground block">
                          {mov.origen || (isEntrada ? 'Compra' : isSalida ? 'Venta' : 'Ajuste')}
                        </span>
                        <span className="text-xs text-muted-foreground block truncate">
                          {mov.referencia}
                        </span>
                      </TableCell>

                      {/* Usuario */}
                      <TableCell className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {mov.usuario}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Vista Móvil: Tarjetas compactas */}
          <div className="block md:hidden space-y-2.5">
            {movimientosFiltrados.map((mov) => {
              const isEntrada = mov.tipo === 'ENTRADA';
              const isSalida = mov.tipo === 'SALIDA';

              return (
                <Card key={`m-mov-${mov.id}`} className="border-border bg-card shadow-2xs">
                  <CardContent className="p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm text-foreground leading-snug truncate">
                          {mov.productoNombre}
                        </h4>
                        <p className="text-xs text-muted-foreground font-mono">{mov.sku}</p>
                      </div>

                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border select-none shrink-0',
                          isEntrada && 'bg-success-soft text-success-text border-success/30',
                          isSalida && 'bg-danger-soft text-danger-text border-destructive/30',
                          !isEntrada && !isSalida && 'bg-warning-soft text-warning-text border-warning/30'
                        )}
                      >
                        {isEntrada ? 'Entrada' : isSalida ? 'Salida' : 'Ajuste'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 px-2.5 rounded bg-muted/30 border border-border/50">
                      <div>
                        <span className="text-muted-foreground block text-xs">Cantidad</span>
                        <span
                          className={cn(
                            'font-semibold font-mono text-sm tabular-nums',
                            isEntrada && 'text-success-text',
                            isSalida && 'text-danger-text',
                            !isEntrada && !isSalida && 'text-warning-text'
                          )}
                        >
                          {isEntrada ? `+${mov.cantidad}` : isSalida ? `-${mov.cantidad}` : mov.cantidad} unidades
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Saldo posterior</span>
                        <span className="font-mono text-sm font-medium text-foreground tabular-nums">
                          {mov.stockResultante} unidades
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {mov.origen || 'Operación'} • {mov.referencia}
                        </span>
                        <span className="font-mono text-[11px]">{formatDateTime(mov.fecha)}</span>
                      </div>
                      <div className="text-[11px]">Por: {mov.usuario}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
