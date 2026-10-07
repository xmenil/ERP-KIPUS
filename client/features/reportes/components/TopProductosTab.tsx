import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TopProductoReporte } from '../types/reportes.types';
import { formatMoney, pluralizeUnit } from '@/utils/formatters';
import { Search, ShoppingBag, ArrowUpDown, Filter } from 'lucide-react';

interface TopProductosTabProps {
  productos: TopProductoReporte[];
  periodoLabel: string;
}

export const TopProductosTab: React.FC<TopProductosTabProps> = ({
  productos,
  periodoLabel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [criterioOrden, setCriterioOrden] = useState<'RECAUDACION' | 'UNIDADES'>('RECAUDACION');

  const productosFiltrados = useMemo(() => {
    let result = productos.filter((p) => {
      const q = searchTerm.toLowerCase().trim();
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.categoria && p.categoria.toLowerCase().includes(q))
      );
    });

    if (criterioOrden === 'RECAUDACION') {
      result = [...result].sort((a, b) => b.totalRecaudado - a.totalRecaudado);
    } else {
      result = [...result].sort((a, b) => b.unidadesVendidas - a.unidadesVendidas);
    }

    return result;
  }, [productos, searchTerm, criterioOrden]);

  const isEmpty = productos.length === 0;
  const isSearchEmpty = !isEmpty && productosFiltrados.length === 0;

  return (
    <Card className="rounded-md border-border bg-card shadow-xs">
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Ranking de productos con mayor demanda
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Artículos de mayor rotación e impacto en la facturación ({periodoLabel})
            </CardDescription>
          </div>

          {/* Filtros y Orden */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por producto o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-card"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCriterioOrden(criterioOrden === 'RECAUDACION' ? 'UNIDADES' : 'RECAUDACION')
              }
              className="h-8 text-xs gap-1.5"
            >
              <ArrowUpDown className="h-3 w-3" />
              <span>
                {criterioOrden === 'RECAUDACION' ? 'Por recaudación' : 'Por unidades'}
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {isEmpty ? (
          <div className="p-8 text-center flex flex-col items-center justify-center border border-dashed border-border rounded-md my-2">
            <ShoppingBag className="h-8 w-8 text-muted-foreground mb-2" />
            <h4 className="text-sm font-semibold text-foreground">
              Sin ventas registradas en este período
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Aún no se han despachado artículos en {periodoLabel}. Cuando registres ventas en el POS, verás aquí el ranking de rotación.
            </p>
          </div>
        ) : isSearchEmpty ? (
          <div className="p-8 text-center flex flex-col items-center justify-center border border-dashed border-border rounded-md my-2">
            <Search className="h-8 w-8 text-muted-foreground mb-2" />
            <h4 className="text-sm font-semibold text-foreground">
              No se encontraron artículos
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              No hay productos que coincidan con "{searchTerm}". Intenta con otro término o limpia el buscador.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="mt-3 text-xs"
            >
              Limpiar búsqueda
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Vista Escritorio / Tablet: Tabla densa protegida con min-w */}
            <div className="hidden sm:block overflow-x-auto rounded-md border border-border">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow className="bg-muted/40 border-b border-border hover:bg-muted/40">
                    <TableHead className="w-16 text-xs font-semibold text-muted-foreground py-2.5 whitespace-nowrap">
                      Puesto
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground py-2.5 min-w-[180px] whitespace-nowrap">
                      Producto / Categoría
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground py-2.5 font-mono whitespace-nowrap">
                      SKU
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right py-2.5 whitespace-nowrap">
                      Unidades despachadas
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground text-right py-2.5 whitespace-nowrap">
                      Recaudación total
                    </TableHead>
                    <TableHead className="w-32 text-xs font-semibold text-muted-foreground text-right py-2.5 whitespace-nowrap">
                      % Facturación
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosFiltrados.map((item, idx) => (
                    <TableRow
                      key={item.sku}
                      className="text-xs hover:bg-muted/20 border-b border-border/70 transition-colors"
                    >
                      <TableCell className="font-mono font-medium text-muted-foreground py-2.5 whitespace-nowrap">
                        #{idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-foreground py-2.5 min-w-[180px]">
                        <div>{item.nombre}</div>
                        {item.categoria && (
                          <span className="text-[11px] text-muted-foreground">
                            {item.categoria}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground py-2.5 whitespace-nowrap">
                        {item.sku}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-foreground py-2.5 whitespace-nowrap">
                        {item.unidadesVendidas} {pluralizeUnit(item.unidadesVendidas, 'unidad')}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums text-foreground py-2.5 whitespace-nowrap">
                        {formatMoney(item.totalRecaudado)}
                      </TableCell>
                      <TableCell className="text-right py-2.5 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{ width: `${Math.min(100, item.porcentajeVenta * 2)}%` }}
                            />
                          </div>
                          <span className="font-mono font-medium text-xs text-primary tabular-nums whitespace-nowrap">
                            {item.porcentajeVenta}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Vista Móvil: Lista de Tarjetas Compactas */}
            <div className="sm:hidden space-y-2.5">
              {productosFiltrados.map((item, idx) => (
                <div
                  key={item.sku}
                  className="p-3 rounded-md border border-border bg-card space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-muted-foreground font-medium">
                          #{idx + 1}
                        </span>
                        <h5 className="font-medium text-foreground">{item.nombre}</h5>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground block mt-0.5">
                        SKU: {item.sku}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-mono border-primary/30 text-primary bg-primary-soft shrink-0">
                      {item.porcentajeVenta}%
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                    <span className="text-muted-foreground">
                      {item.unidadesVendidas} {pluralizeUnit(item.unidadesVendidas, 'unidad')}
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-foreground">
                      {formatMoney(item.totalRecaudado)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Barra de Conteo */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span>
                Mostrando {productosFiltrados.length} de {productos.length} artículos con mayor demanda
              </span>
              <span className="font-mono">
                Ordenado por {criterioOrden === 'RECAUDACION' ? 'recaudación total' : 'unidades vendidas'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
