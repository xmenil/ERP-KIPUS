import React, { useState, useMemo } from 'react';
import { useErpQuery } from '@/hooks/useErpQuery';
import { QueryError } from '@/components/common/QueryError';
import { PageHeader } from '@/components/common/PageHeader';
import { SummaryStrip } from '@/components/common/SummaryStrip';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { NuevoGastoDialog } from '../components/NuevoGastoDialog';
import { GastoDetalleModal } from '../components/GastoDetalleModal';
import { gastosService } from '../services/gastosService';
import { Gasto, NuevoGastoPayload } from '../types/gastos.types';
import {
  CATEGORIAS_VALIDAS,
  CATEGORIA_LABELS,
  METODO_PAGO_LABELS,
} from '../utils/gastoValidation';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  PlusCircle,
  Search,
  Receipt,
  TrendingDown,
  Building2,
  FileSpreadsheet,
  Wallet,
  CreditCard,
  MoreHorizontal,
  Ban,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { isDateWithinRange } from '@/utils/dateRange';

export const GastosPage: React.FC = () => {
  const { data: gastos, loading, error: queryError, refresh: fetchGastos } = useErpQuery(
    gastosService.getGastos
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [metodoPagoFiltro, setMetodoPagoFiltro] = useState<string>('TODOS');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('TODOS');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const [openModal, setOpenModal] = useState(false);
  const [detalleGasto, setDetalleGasto] = useState<Gasto | null>(null);

  const handleCrearGasto = async (payload: NuevoGastoPayload) => {
    const nuevo = await gastosService.registrarGasto(payload);
    await fetchGastos();
    toast.success(`Gasto de ${formatCurrency(nuevo.monto)} registrado correctamente.`);
  };

  const handleAnularGasto = async (id: string, motivo: string) => {
    await gastosService.anularGasto(id, motivo);
    await fetchGastos();
    toast.success('Egreso anulado correctamente.');
  };

  // Filtrado de gastos
  const filteredGastos = useMemo(() => {
    return gastos.filter((g) => {
      const matchSearch =
        g.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.beneficiario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.comprobante.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat = categoriaFiltro === 'TODAS' || g.categoria === categoriaFiltro;

      const matchPago =
        metodoPagoFiltro === 'TODOS' ||
        (metodoPagoFiltro === 'YAPE' ? g.metodoPago === 'YAPE' || g.metodoPago === 'PLIN' : g.metodoPago === metodoPagoFiltro);

      const matchEstado =
        estadoFiltro === 'TODOS' ||
        (estadoFiltro === 'ANULADO' ? g.estado === 'ANULADO' : g.estado !== 'ANULADO');
      const matchFecha = isDateWithinRange(g.fecha, fechaDesde, fechaHasta);

      return matchSearch && matchCat && matchPago && matchEstado && matchFecha;
    });
  }, [gastos, searchTerm, categoriaFiltro, metodoPagoFiltro, estadoFiltro, fechaDesde, fechaHasta]);

  // Cálculos para SummaryStrip (solo gastos activos)
  const gastosActivos = useMemo(() => gastos.filter((g) => {
    return g.estado !== 'ANULADO' && isDateWithinRange(g.fecha, fechaDesde, fechaHasta);
  }), [gastos, fechaDesde, fechaHasta]);

  const totalGastos = useMemo(
    () => gastosActivos.reduce((acc, g) => acc + g.monto, 0),
    [gastosActivos]
  );

  const gastosEfectivo = useMemo(
    () =>
      gastosActivos
        .filter((g) => g.metodoPago === 'EFECTIVO')
        .reduce((acc, g) => acc + g.monto, 0),
    [gastosActivos]
  );

  const gastosDigitales = useMemo(
    () =>
      gastosActivos
        .filter((g) => g.metodoPago !== 'EFECTIVO')
        .reduce((acc, g) => acc + g.monto, 0),
    [gastosActivos]
  );

  const categoriaMayorGasto = useMemo(() => {
    if (gastosActivos.length === 0) return { nombre: 'Sin egresos', monto: 0 };
    const porCat = new Map<string, number>();
    gastosActivos.forEach((g) => {
      porCat.set(g.categoria, (porCat.get(g.categoria) || 0) + g.monto);
    });
    let topCat = '';
    let topMonto = 0;
    porCat.forEach((monto, cat) => {
      if (monto > topMonto) {
        topMonto = monto;
        topCat = cat;
      }
    });
    return {
      nombre: CATEGORIA_LABELS[topCat as keyof typeof CATEGORIA_LABELS] || topCat,
      monto: topMonto,
    };
  }, [gastosActivos]);

  return (
    <div className="space-y-6">
      <QueryError message={queryError} retry={() => { void fetchGastos(); }} />

      {/* Encabezado y Acción Primaria Única */}
      <PageHeader
        title="Gastos y Egresos Operativos"
        description="Costos fijos, servicios básicos, compras menores y control del flujo de egresos."
      >
        <Button
          size="sm"
          onClick={() => setOpenModal(true)}
          className="h-9 gap-2 bg-primary text-primary-foreground font-semibold shadow-2xs w-full sm:w-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Registrar gasto</span>
        </Button>
      </PageHeader>

      {/* Resumen Compacto con SummaryStrip */}
      <SummaryStrip
        loading={loading}
        items={[
          {
            label: 'Total egresos del periodo',
            value: formatCurrency(totalGastos),
            description: `${gastosActivos.length} ${gastosActivos.length === 1 ? 'comprobante activo' : 'comprobantes activos'}`,
          },
          {
            label: 'Efectivo de caja registradora',
            value: formatCurrency(gastosEfectivo),
            description:
              totalGastos > 0
                ? `${Math.round((gastosEfectivo / totalGastos) * 100)}% del total desembolsado`
                : 'Sin egresos en efectivo',
          },
          {
            label: 'Pagos bancarios y digitales',
            value: formatCurrency(gastosDigitales),
            description: 'Transferencia, Yape / Plin, Tarjeta',
          },
          {
            label: 'Rubro de mayor costo',
            value: categoriaMayorGasto.nombre,
            description:
              categoriaMayorGasto.monto > 0
                ? formatCurrency(categoriaMayorGasto.monto)
                : 'Sin gastos registrados',
          },
        ]}
      />

      {/* Bloque Principal: Filtros y Tabla / Tarjetas de Gastos */}
      <Card className="border-border shadow-2xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Barra de Filtros Unificada */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Buscador */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar concepto, proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs border-border bg-background"
              />
            </div>

            {/* Filtro por Categoría */}
            <div>
              <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                <SelectTrigger className="h-9 text-xs border-border bg-background">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="TODAS" className="text-xs">
                    Todas las categorías ({gastos.length})
                  </SelectItem>
                  {CATEGORIAS_VALIDAS.map((c) => {
                    const count = gastos.filter((g) => g.categoria === c).length;
                    return (
                      <SelectItem key={c} value={c} className="text-xs">
                        {CATEGORIA_LABELS[c]} ({count})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Medio de Pago */}
            <div>
              <Select value={metodoPagoFiltro} onValueChange={setMetodoPagoFiltro}>
                <SelectTrigger className="h-9 text-xs border-border bg-background">
                  <SelectValue placeholder="Medio de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS" className="text-xs">
                    Todos los medios de pago
                  </SelectItem>
                  <SelectItem value="EFECTIVO" className="text-xs">
                    Efectivo de caja
                  </SelectItem>
                  <SelectItem value="TRANSFERENCIA" className="text-xs">
                    Transferencia bancaria
                  </SelectItem>
                  <SelectItem value="YAPE" className="text-xs">
                    Yape / Plin
                  </SelectItem>
                  <SelectItem value="TARJETA" className="text-xs">
                    Tarjeta débito/crédito
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Estado */}
            <div>
              <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                <SelectTrigger className="h-9 text-xs border-border bg-background">
                  <SelectValue placeholder="Estado del egreso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS" className="text-xs">
                    Todos los estados
                  </SelectItem>
                  <SelectItem value="ACTIVO" className="text-xs">
                    Egresos activos ({gastosActivos.length})
                  </SelectItem>
                  <SelectItem value="ANULADO" className="text-xs">
                    Egresos anulados ({gastos.filter((g) => g.estado === 'ANULADO' && isDateWithinRange(g.fecha, fechaDesde, fechaHasta)).length})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end border-t border-border/60 pt-3">
            <label htmlFor="gastos-fecha-desde" className="space-y-1 text-xs font-medium text-foreground">
              Desde fecha
              <Input id="gastos-fecha-desde" type="date" value={fechaDesde} max={fechaHasta || undefined} onChange={e => setFechaDesde(e.target.value)} className="h-11 md:h-9 text-base md:text-sm" />
            </label>
            <label htmlFor="gastos-fecha-hasta" className="space-y-1 text-xs font-medium text-foreground">
              Hasta fecha
              <Input id="gastos-fecha-hasta" type="date" value={fechaHasta} min={fechaDesde || undefined} onChange={e => setFechaHasta(e.target.value)} className="h-11 md:h-9 text-base md:text-sm" />
            </label>
            {(fechaDesde || fechaHasta) && <Button type="button" variant="outline" onClick={() => { setFechaDesde(''); setFechaHasta(''); }} className="h-11 md:h-9">Limpiar fechas</Button>}
          </div>

          {/* Estado de Carga */}
          {queryError ? null : loading ? (
            <div className="h-44 rounded-md border border-border flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Cargando gastos y egresos operativos...</span>
            </div>
          ) : filteredGastos.length === 0 ? (
            /* Estado Vacío Guiado */
            <div className="py-12 px-4 rounded-md border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                {searchTerm || categoriaFiltro !== 'TODAS' || metodoPagoFiltro !== 'TODOS' || estadoFiltro !== 'TODOS' || fechaDesde || fechaHasta
                  ? 'No se encontraron egresos con los filtros aplicados'
                  : 'Aún no registras egresos este mes'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {searchTerm || categoriaFiltro !== 'TODAS' || metodoPagoFiltro !== 'TODOS' || estadoFiltro !== 'TODOS' || fechaDesde || fechaHasta
                  ? 'Intenta restablecer los filtros o cambiar el término de búsqueda.'
                  : 'Registra los gastos de alquiler, servicios o logística para mantener tu flujo de caja al día.'}
              </p>
              {!searchTerm && categoriaFiltro === 'TODAS' && metodoPagoFiltro === 'TODOS' && estadoFiltro === 'TODOS' && !fechaDesde && !fechaHasta && (
                <Button
                  size="sm"
                  onClick={() => setOpenModal(true)}
                  className="mt-2 text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Registrar primer gasto</span>
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Vista 1: Tabla Completa para Escritorio (>= md) */}
              <div className="hidden md:block overflow-x-auto rounded border border-border bg-card shadow-2xs">
                <Table className="w-full min-w-[760px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-b border-border hover:bg-transparent">
                      <TableHead className="text-xs font-semibold py-2.5 w-28 whitespace-nowrap">Fecha</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-44 whitespace-nowrap">Categoría</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 whitespace-nowrap">Concepto / Descripción</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-44 whitespace-nowrap">Beneficiario / Proveedor</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-32 whitespace-nowrap">Comprobante</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-32 whitespace-nowrap">Medio de Pago</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-28 text-right whitespace-nowrap">Monto</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-28 text-right whitespace-nowrap">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGastos.map((gasto) => {
                      const isAnulado = gasto.estado === 'ANULADO';
                      return (
                        <TableRow
                          key={gasto.id}
                          className={`text-xs border-b border-border/70 transition-colors ${
                            isAnulado ? 'bg-muted/30 opacity-70 hover:bg-muted/40' : 'hover:bg-muted/30'
                          }`}
                        >
                          <TableCell className="font-mono text-muted-foreground font-medium py-2.5 whitespace-nowrap">
                            {formatDate(gasto.fecha)}
                          </TableCell>
                          <TableCell className="py-2.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted border border-border/60 text-foreground">
                              {CATEGORIA_LABELS[gasto.categoria] || gasto.categoria}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-foreground py-2.5">
                            <div className="flex items-center gap-1.5">
                              {isAnulado && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-danger-soft text-danger-text">
                                  ANULADO
                                </span>
                              )}
                              <span className={isAnulado ? 'line-through text-muted-foreground' : ''}>
                                {gasto.descripcion}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground py-2.5 whitespace-nowrap">
                            {gasto.beneficiario}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground py-2.5 whitespace-nowrap">
                            {gasto.comprobante}
                          </TableCell>
                          <TableCell className="py-2.5 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-muted/50 text-muted-foreground border border-border/40">
                              {METODO_PAGO_LABELS[gasto.metodoPago] || gasto.metodoPago}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold font-mono text-foreground py-2.5 text-xs tabular-nums whitespace-nowrap">
                            <span className={isAnulado ? 'line-through text-muted-foreground' : 'text-danger-text'}>
                              -{formatCurrency(gasto.monto)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-2.5 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDetalleGasto(gasto)}
                                aria-label={`Ver detalle de gasto ${gasto.descripcion}`}
                                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                              >
                                Ver detalle
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Acciones de gasto ${gasto.descripcion}`}
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={() => setDetalleGasto(gasto)}>
                                    Ver detalle completo
                                  </DropdownMenuItem>
                                  {!isAnulado && (
                                    <DropdownMenuItem
                                      onSelect={() => setDetalleGasto(gasto)}
                                      className="text-danger-text font-medium"
                                    >
                                      Anular egreso
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Vista 2: Tarjetas Dedicadas para Móvil (< md) */}
              <div className="block md:hidden space-y-2.5">
                {filteredGastos.map((gasto) => {
                  const isAnulado = gasto.estado === 'ANULADO';
                  return (
                    <div
                      key={gasto.id}
                      className={`p-3.5 rounded-lg border border-border bg-card shadow-2xs space-y-2.5 transition-colors ${
                        isAnulado ? 'opacity-70 bg-muted/20' : 'hover:border-border/80'
                      }`}
                    >
                      {/* Fila Superior: Fecha y Estado / Categoría */}
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-mono text-muted-foreground text-[11px] font-medium">
                          {formatDate(gasto.fecha)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isAnulado && (
                            <StatusBadge status="ANULADO" variant="danger" />
                          )}
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted border border-border/60 text-foreground">
                            {CATEGORIA_LABELS[gasto.categoria] || gasto.categoria}
                          </span>
                        </div>
                      </div>

                      {/* Descripción Principal del Gasto */}
                      <div className="space-y-1">
                        <p className={`text-xs font-semibold text-foreground leading-snug ${isAnulado ? 'line-through text-muted-foreground' : ''}`}>
                          {gasto.descripcion}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                            <span className="truncate max-w-[140px]">{gasto.beneficiario}</span>
                          </span>
                          <span>•</span>
                          <span className="font-mono">{gasto.comprobante}</span>
                          <span>•</span>
                          <span>{METODO_PAGO_LABELS[gasto.metodoPago] || gasto.metodoPago}</span>
                        </div>
                      </div>

                      {/* Fila Inferior: Monto y Acción */}
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                        <span className={`font-mono font-bold tabular-nums text-sm ${isAnulado ? 'line-through text-muted-foreground' : 'text-danger-text'}`}>
                          -{formatCurrency(gasto.monto)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetalleGasto(gasto)}
                          className="h-8 text-xs px-2.5"
                        >
                          Ver detalle
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Registro de Gasto */}
      <NuevoGastoDialog
        open={openModal}
        onOpenChange={setOpenModal}
        onGastoRegistrado={handleCrearGasto}
      />

      {/* Modal de Detalle de Gasto */}
      <GastoDetalleModal
        open={detalleGasto !== null}
        onOpenChange={(val) => {
          if (!val) setDetalleGasto(null);
        }}
        gasto={detalleGasto}
        onAnularGasto={handleAnularGasto}
      />
    </div>
  );
};

export default GastosPage;
