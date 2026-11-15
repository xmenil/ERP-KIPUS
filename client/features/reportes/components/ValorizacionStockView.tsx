import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MetricCard } from '@/components/common/MetricCard';
import { ItemStockDetalle } from '@/features/inventario/types/inventario.types';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import {
  Warehouse,
  Coins,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  Package,
  Layers,
  ArrowUpRight,
  Download,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '@/constants/routes';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ValorizacionStockViewProps {
  productos: ItemStockDetalle[];
  loading?: boolean;
}

type FiltroClaseAbc = 'TODOS' | 'CLASE_A' | 'CLASE_B' | 'CLASE_C' | 'ESTANCADO';

export const ValorizacionStockView: React.FC<ValorizacionStockViewProps> = ({
  productos,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroClase, setFiltroClase] = useState<FiltroClaseAbc>('TODOS');

  // Clasificación ABC por valor de inventario acumulado
  const productosClasificados = useMemo(() => {
    // Ordenar de mayor a menor valorizado costo
    const ordenados = [...productos].sort((a, b) => (b.valorizadoCosto || 0) - (a.valorizadoCosto || 0));
    const totalCostoGeneral = ordenados.reduce((s, p) => s + (p.valorizadoCosto || 0), 0);

    let acumulado = 0;
    return ordenados.map((p) => {
      acumulado += p.valorizadoCosto || 0;
      const pctAcum = totalCostoGeneral > 0 ? (acumulado / totalCostoGeneral) * 100 : 0;
      let clase: 'A' | 'B' | 'C' = 'C';
      if (pctAcum <= 75) clase = 'A';
      else if (pctAcum <= 90) clase = 'B';

      // Precio venta estimado
      const precioVentaUnit = p.precioVenta || (p.precioCompra ? +(p.precioCompra * 1.35).toFixed(2) : 10);
      const valorizadoVenta = p.valorizadoVenta || +(p.stock * precioVentaUnit).toFixed(2);
      const gananciaPotencial = Math.max(0, +(valorizadoVenta - (p.valorizadoCosto || 0)).toFixed(2));
      const estancado = p.stock > (p.stockMinimo * 2) && p.estadoNivel === 'SUFICIENTE';

      return {
        ...p,
        claseAbc: clase,
        valorizadoVenta,
        gananciaPotencial,
        estancado,
        porcentajeDelValor: totalCostoGeneral > 0 ? +(((p.valorizadoCosto || 0) / totalCostoGeneral) * 100).toFixed(1) : 0,
      };
    });
  }, [productos]);

  // Filtrado reactivo
  const filteredProductos = useMemo(() => {
    return productosClasificados.filter((p) => {
      if (filtroClase === 'CLASE_A' && p.claseAbc !== 'A') return false;
      if (filtroClase === 'CLASE_B' && p.claseAbc !== 'B') return false;
      if (filtroClase === 'CLASE_C' && p.claseAbc !== 'C') return false;
      if (filtroClase === 'ESTANCADO' && !p.estancado) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          p.nombre.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [productosClasificados, filtroClase, searchTerm]);

  // Totales
  const totalCosto = useMemo(
    () => productosClasificados.reduce((sum, p) => sum + (p.valorizadoCosto || 0), 0),
    [productosClasificados]
  );
  const totalVentaProyectada = useMemo(
    () => productosClasificados.reduce((sum, p) => sum + p.valorizadoVenta, 0),
    [productosClasificados]
  );
  const gananciaPotencialTotal = Math.max(0, +(totalVentaProyectada - totalCosto).toFixed(2));
  const totalUnidades = useMemo(() => productosClasificados.reduce((sum, p) => sum + p.stock, 0), [productosClasificados]);

  const countClaseA = useMemo(() => productosClasificados.filter((p) => p.claseAbc === 'A').length, [productosClasificados]);
  const countClaseB = useMemo(() => productosClasificados.filter((p) => p.claseAbc === 'B').length, [productosClasificados]);
  const countClaseC = useMemo(() => productosClasificados.filter((p) => p.claseAbc === 'C').length, [productosClasificados]);
  const countEstancados = useMemo(() => productosClasificados.filter((p) => p.estancado).length, [productosClasificados]);

  // Exportar Excel de Valorización
  const handleExportarCsv = () => {
    const encabezados = 'SKU,Producto,Categoría,Stock Físico,Costo Unitario,Valorizado Costo,Precio Venta,Valorizado Venta,Ganancia Proyectada,Clasificación ABC\n';
    const filas = productosClasificados
      .map(
        (p) =>
          `"${p.sku}","${p.nombre}","${p.categoria}","${p.stock}","${p.precioCompra || 0}","${p.valorizadoCosto || 0}","${p.precioVenta || 0}","${p.valorizadoVenta}","${p.gananciaPotencial}","Clase ${p.claseAbc}"`
      )
      .join('\n');

    const blob = new Blob([encabezados + filas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Valorizacion_Inventario_ABC_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Reporte de valorización y clasificación ABC exportado.');
  };

  return (
    <div className="space-y-4">
      {/* 1. KPIs Superiores de Valorización */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Capital Invertido en Stock"
          value={formatCurrency(totalCosto)}
          subtitle={`${totalUnidades} unidades en almacenes`}
          icon={Warehouse}
          iconColor="text-primary bg-primary/10"
        />
        <MetricCard
          title="Valor a Precio de Venta"
          value={formatCurrency(totalVentaProyectada)}
          subtitle="Ingreso total estimado por liquidación"
          icon={Coins}
          iconColor="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
        />
        <MetricCard
          title="Ganancia Bruta Potencial"
          value={formatCurrency(gananciaPotencialTotal)}
          subtitle={`Margen proyectado: ${totalCosto > 0 ? ((gananciaPotencialTotal / totalCosto) * 100).toFixed(1) : 0}%`}
          icon={TrendingUp}
          iconColor="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
        />
        <MetricCard
          title="Productos Clase A (Clave)"
          value={`${countClaseA} artículos`}
          subtitle="Concentran el 75% del capital"
          icon={Layers}
          iconColor="text-warning-text bg-warning-soft"
        />
      </div>

      {/* 2. Filtros y Búsqueda */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por producto, SKU o categoría..."
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

            {/* Chips de Clasificación ABC */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              {[
                { id: 'TODOS', label: `Todos (${productosClasificados.length})` },
                { id: 'CLASE_A', label: `Clase A - Alta (${countClaseA})` },
                { id: 'CLASE_B', label: `Clase B - Media (${countClaseB})` },
                { id: 'CLASE_C', label: `Clase C - Baja (${countClaseC})` },
                ...(countEstancados > 0
                  ? [{ id: 'ESTANCADO', label: `Estancados (${countEstancados})` }]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroClase(tab.id as FiltroClaseAbc)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-full border transition-colors whitespace-nowrap cursor-pointer select-none font-medium',
                    filtroClase === tab.id
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleExportarCsv}
              className="h-9 gap-1.5 text-xs font-semibold shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exportar CSV</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Tabla de Existencias Valorizadas con Clasificación ABC */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Warehouse className="h-4 w-4 text-primary" />
                <span>Valorización de Existencias y Matriz ABC</span>
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Control del capital inmovilizado en estanterías frente al ingreso proyectado por venta al público.
              </p>
            </div>
            <Button asChild size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary hover:bg-primary-soft">
              <Link to={APP_ROUTES.INVENTARIO}>
                <span>Gestionar inventario</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          <div className="overflow-x-auto rounded border border-border bg-card">
            <Table className="w-full min-w-[850px]">
              <TableHeader className="bg-muted/50">
                <TableRow className="text-xs">
                  <TableHead className="py-2.5">Producto & SKU</TableHead>
                  <TableHead className="py-2.5 whitespace-nowrap">Categoría</TableHead>
                  <TableHead className="py-2.5 text-center whitespace-nowrap">Stock Físico</TableHead>
                  <TableHead className="py-2.5 text-right whitespace-nowrap">Costo Unit.</TableHead>
                  <TableHead className="py-2.5 text-right whitespace-nowrap">Valorizado Costo</TableHead>
                  <TableHead className="py-2.5 text-right whitespace-nowrap">P. Venta Proy.</TableHead>
                  <TableHead className="py-2.5 text-right whitespace-nowrap">Ganancia Potencial</TableHead>
                  <TableHead className="py-2.5 text-center whitespace-nowrap">Clase ABC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProductos.map((prod) => (
                  <TableRow key={prod.id} className="text-xs hover:bg-muted/20">
                    <TableCell className="py-2.5">
                      <span className="font-semibold text-foreground block">{prod.nombre}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        SKU: {prod.sku}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 whitespace-nowrap text-muted-foreground">
                      {prod.categoria}
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums font-semibold py-2.5 whitespace-nowrap">
                      {prod.stock} un.
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-muted-foreground py-2.5 whitespace-nowrap">
                      {formatCurrency(prod.precioCompra || 0)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-bold text-foreground py-2.5 whitespace-nowrap">
                      {formatCurrency(prod.valorizadoCosto || 0)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-foreground py-2.5 whitespace-nowrap">
                      {formatCurrency(prod.valorizadoVenta)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-semibold text-success-text py-2.5 whitespace-nowrap">
                      +{formatCurrency(prod.gananciaPotencial)}
                    </TableCell>
                    <TableCell className="text-center py-2.5 whitespace-nowrap">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold border',
                          prod.claseAbc === 'A'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300'
                            : prod.claseAbc === 'B'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300'
                            : 'bg-muted text-muted-foreground border-border'
                        )}
                      >
                        Clase {prod.claseAbc}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
