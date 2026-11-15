import React, { useState, useMemo } from 'react';
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
import { MetricCard } from '@/components/common/MetricCard';
import { Gasto, NuevoGastoPayload, CategoriaGasto } from '../types/gastos.types';
import { GastoFormSheet } from './GastoFormSheet';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  PlusCircle,
  Search,
  Receipt,
  TrendingDown,
  Building,
  FileSpreadsheet,
  Wallet,
  PieChart,
  Percent,
  X,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const CATEGORIA_LABELS: Record<string, string> = {
  ALQUILER: 'Alquiler de local',
  SERVICIOS_BASICOS: 'Servicios básicos',
  PLANILLA: 'Planilla / Sueldos',
  LOGISTICA: 'Logística / Envíos',
  MANTENIMIENTO: 'Mantenimiento',
  MARKETING: 'Publicidad',
  OTROS: 'Otros egresos',
};

const CATEGORIA_COLORS: Record<string, string> = {
  ALQUILER: 'bg-amber-500',
  SERVICIOS_BASICOS: 'bg-blue-500',
  PLANILLA: 'bg-emerald-500',
  LOGISTICA: 'bg-indigo-500',
  MANTENIMIENTO: 'bg-orange-500',
  MARKETING: 'bg-purple-500',
  OTROS: 'bg-slate-400',
};

const METODO_PAGO_LABELS: Record<string, string> = {
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
  YAPE: 'Yape / Plin',
  TARJETA: 'Tarjeta',
};

const CATEGORIAS_CONFIG: { id: string; label: string }[] = [
  { id: 'TODAS', label: 'Todos' },
  { id: 'ALQUILER', label: 'Alquiler' },
  { id: 'SERVICIOS_BASICOS', label: 'Servicios' },
  { id: 'PLANILLA', label: 'Planilla' },
  { id: 'LOGISTICA', label: 'Logística' },
  { id: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { id: 'MARKETING', label: 'Marketing' },
  { id: 'OTROS', label: 'Otros' },
];

interface GastosOperativosViewProps {
  gastos: Gasto[];
  loading: boolean;
  totalVentasMes?: number;
  onRegistrarGasto: (payload: NuevoGastoPayload) => Promise<void>;
}

export const GastosOperativosView: React.FC<GastosOperativosViewProps> = ({
  gastos,
  loading,
  totalVentasMes = 24500,
  onRegistrarGasto,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');
  const [sheetOpen, setSheetOpen] = useState(false);

  // Filtros
  const filteredGastos = useMemo(() => {
    return gastos.filter((g) => {
      const matchSearch =
        g.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.beneficiario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.comprobante.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoriaFiltro === 'TODAS' || g.categoria === categoriaFiltro;
      return matchSearch && matchCat;
    });
  }, [gastos, searchTerm, categoriaFiltro]);

  // Métricas Consolidadas
  const totalGastos = useMemo(() => gastos.reduce((acc, g) => acc + g.monto, 0), [gastos]);

  const gastosAlquiler = useMemo(
    () => gastos.filter((g) => g.categoria === 'ALQUILER').reduce((a, b) => a + b.monto, 0),
    [gastos]
  );

  const gastosServiciosYLogistica = useMemo(
    () =>
      gastos
        .filter((g) => g.categoria === 'SERVICIOS_BASICOS' || g.categoria === 'LOGISTICA')
        .reduce((a, b) => a + b.monto, 0),
    [gastos]
  );

  // Porcentaje de impacto sobre las ventas
  const porcentajeImpactoVentas = useMemo(() => {
    if (!totalVentasMes || totalVentasMes <= 0) return 0;
    return +((totalGastos / totalVentasMes) * 100).toFixed(1);
  }, [totalGastos, totalVentasMes]);

  // Distribución por categoría
  const distribucionCategorias = useMemo(() => {
    if (totalGastos === 0) return [];
    const agrupado: Record<string, number> = {};
    gastos.forEach((g) => {
      agrupado[g.categoria] = (agrupado[g.categoria] || 0) + g.monto;
    });
    return Object.entries(agrupado)
      .map(([cat, monto]) => ({
        categoria: cat,
        label: CATEGORIA_LABELS[cat] || cat,
        monto,
        porcentaje: Math.round((monto / totalGastos) * 100),
        color: CATEGORIA_COLORS[cat] || 'bg-slate-400',
      }))
      .sort((a, b) => b.monto - a.monto);
  }, [gastos, totalGastos]);

  return (
    <div className="space-y-4">
      {/* 1. Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Egresos del Mes"
          value={formatCurrency(totalGastos)}
          subtitle={
            gastos.length === 1 ? '1 comprobante registrado' : `${gastos.length} comprobantes registrados`
          }
          icon={TrendingDown}
          iconColor="text-danger-text bg-danger-soft"
        />
        <MetricCard
          title="Alquiler & Locales"
          value={formatCurrency(gastosAlquiler)}
          subtitle="Arrendamiento fijo comercial"
          icon={Building}
          iconColor="text-warning-text bg-warning-soft"
        />
        <MetricCard
          title="Servicios & Logística"
          value={formatCurrency(gastosServiciosYLogistica)}
          subtitle="Luz, agua, internet, fletes"
          icon={Receipt}
          iconColor="text-primary bg-primary/10"
        />
        <MetricCard
          title="Impacto sobre Ventas"
          value={`${porcentajeImpactoVentas}%`}
          subtitle={`De las ventas (S/ ${formatCurrency(totalVentasMes)})`}
          icon={Percent}
          iconColor="text-info-text bg-info-soft"
        />
      </div>

      {/* 2. Tarjeta Condensada de Distribución de Egresos */}
      {totalGastos > 0 && distribucionCategorias.length > 0 && (
        <Card className="border border-border/80 shadow-2xs bg-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <PieChart className="h-4 w-4 text-primary" />
                <span>Distribución Porcentual del Gasto Operativo</span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                Total gastado: <strong className="text-foreground">{formatCurrency(totalGastos)}</strong>
              </span>
            </div>

            {/* Barra Segmentada de Distribución */}
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex shadow-inner">
              {distribucionCategorias.map((d) => (
                <div
                  key={d.categoria}
                  style={{ width: `${Math.max(d.porcentaje, 4)}%` }}
                  className={cn('h-full transition-all duration-300', d.color)}
                  title={`${d.label}: ${formatCurrency(d.monto)} (${d.porcentaje}%)`}
                />
              ))}
            </div>

            {/* Leyenda de Categorías */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
              {distribucionCategorias.map((d) => (
                <div key={d.categoria} className="flex items-center gap-1.5 text-[11px]">
                  <span className={cn('h-2 w-2 rounded-full shrink-0', d.color)} />
                  <span className="text-muted-foreground">{d.label}:</span>
                  <span className="font-semibold text-foreground font-mono">
                    {formatCurrency(d.monto)} ({d.porcentaje}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Bloque Principal: Filtros y Tabla */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Barra de Búsqueda y Botón */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por concepto, proveedor o comprobante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs border-border bg-card"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Chips de Categorías */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              {CATEGORIAS_CONFIG.map((c) => {
                const isSelected = categoriaFiltro === c.id;
                const count =
                  c.id === 'TODAS' ? gastos.length : gastos.filter((g) => g.categoria === c.id).length;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoriaFiltro(c.id)}
                    className={cn(
                      'px-2.5 py-1 text-xs rounded-full border transition-colors whitespace-nowrap cursor-pointer select-none font-medium',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary font-semibold'
                        : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground'
                    )}
                  >
                    <span>{c.label}</span>
                    <span className="ml-1 opacity-70 tabular-nums">({count})</span>
                  </button>
                );
              })}
            </div>

            <Button
              size="sm"
              onClick={() => setSheetOpen(true)}
              className="h-9 gap-1.5 bg-primary text-primary-foreground font-semibold text-xs shadow-xs shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Registrar gasto</span>
            </Button>
          </div>

          {/* Estado de Carga */}
          {loading ? (
            <div className="h-44 rounded-md border border-border flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Cargando gastos operativos...</span>
            </div>
          ) : filteredGastos.length === 0 ? (
            <div className="py-12 px-4 rounded-md border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                {searchTerm || categoriaFiltro !== 'TODAS'
                  ? 'No se encontraron egresos con los filtros aplicados'
                  : 'Aún no registras egresos este mes'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {searchTerm || categoriaFiltro !== 'TODAS'
                  ? 'Intenta cambiar el término de búsqueda o selecciona otra categoría.'
                  : 'Registra los gastos de alquiler, servicios o logística para mantener tu flujo de caja al día.'}
              </p>
              {!searchTerm && categoriaFiltro === 'TODAS' && (
                <Button
                  size="sm"
                  onClick={() => setSheetOpen(true)}
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
                      <TableHead className="text-xs font-semibold py-2.5 w-36 whitespace-nowrap">N° Comprobante</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-32 whitespace-nowrap">Medio de Pago</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 w-32 text-right whitespace-nowrap">Monto Pagado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGastos.map((gasto) => (
                      <TableRow
                        key={gasto.id}
                        className="text-xs hover:bg-muted/30 border-b border-border/70 transition-colors"
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
                          {gasto.descripcion}
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
                        <TableCell className="text-right font-semibold font-mono text-danger-text py-2.5 text-xs tabular-nums whitespace-nowrap">
                          -{formatCurrency(gasto.monto)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Vista 2: Tarjetas Dedicadas para Móvil (< md) */}
              <div className="block md:hidden space-y-2.5">
                {filteredGastos.map((gasto) => (
                  <div
                    key={gasto.id}
                    className="p-3.5 rounded-lg border border-border bg-card shadow-2xs space-y-2.5 hover:border-border/80 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-mono text-muted-foreground text-[11px] font-medium">
                        {formatDate(gasto.fecha)}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted border border-border/60 text-foreground">
                          {CATEGORIA_LABELS[gasto.categoria] || gasto.categoria}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/40">
                          {METODO_PAGO_LABELS[gasto.metodoPago] || gasto.metodoPago}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground leading-snug">
                        {gasto.descripcion}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Building className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                          <span className="truncate max-w-[140px]">{gasto.beneficiario}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Receipt className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                          <span className="font-mono">{gasto.comprobante}</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        <span>Monto egreso:</span>
                      </span>
                      <span className="font-mono font-bold tabular-nums text-sm text-danger-text">
                        -{formatCurrency(gasto.monto)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Formulario lateral de Registro de Gasto */}
      <GastoFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onGastoRegistrado={onRegistrarGasto}
      />
    </div>
  );
};
