import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ItemStockDetalle, EstadoNivelStock } from '../types/inventario.types';
import { formatCurrency } from '@/utils/formatters';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  ClipboardCheck,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';

interface TablaControlStockProps {
  productos: ItemStockDetalle[];
  loading: boolean;
  onOpenRecepcionConProducto: (productoId: string) => void;
  onOpenAuditoriaConProducto: (productoId: string) => void;
}

export const TablaControlStock: React.FC<TablaControlStockProps> = ({
  productos,
  loading,
  onOpenRecepcionConProducto,
  onOpenAuditoriaConProducto,
}) => {
  const { user } = useAuth();
  // TODO backend: ocultar esto en el servidor
  const puedeVerCostos = user?.rol !== 'CAJERO';

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroNivel, setFiltroNivel] = useState<'TODOS' | EstadoNivelStock>('TODOS');

  const countSuficiente = productos.filter((p) => p.estadoNivel === 'SUFICIENTE').length;
  const countPorAgotarse = productos.filter((p) => p.estadoNivel === 'POR_AGOTARSE').length;
  const countAgotado = productos.filter((p) => p.estadoNivel === 'AGOTADO').length;

  const filteredProductos = productos.filter((p) => {
    const matchSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ubicacion.toLowerCase().includes(searchTerm.toLowerCase());

    const matchFiltro = filtroNivel === 'TODOS' || p.estadoNivel === filtroNivel;

    return matchSearch && matchFiltro;
  });

  return (
    <div className="space-y-3.5">
      {/* Barra de búsqueda y Filtros rápidos de estado */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por producto, SKU, categoría o estante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Segmented controls para el estado de stock */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setFiltroNivel('TODOS')}
            className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer select-none font-medium ${
              filtroNivel === 'TODOS'
                ? 'bg-primary text-primary-foreground border-primary font-semibold'
                : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
            }`}
          >
            Todos ({productos.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroNivel('SUFICIENTE')}
            className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer select-none flex items-center gap-1 font-medium ${
              filtroNivel === 'SUFICIENTE'
                ? 'bg-success-soft text-success-text border-success font-semibold'
                : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
            }`}
          >
            <CheckCircle2 className="h-3 w-3 text-success" />
            <span>Suficiente ({countSuficiente})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroNivel('POR_AGOTARSE')}
            className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer select-none flex items-center gap-1 font-medium ${
              filtroNivel === 'POR_AGOTARSE'
                ? 'bg-warning-soft text-warning-text border-warning font-semibold'
                : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
            }`}
          >
            <AlertTriangle className="h-3 w-3 text-warning" />
            <span>Por agotarse ({countPorAgotarse})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroNivel('AGOTADO')}
            className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer select-none flex items-center gap-1 font-medium ${
              filtroNivel === 'AGOTADO'
                ? 'bg-danger-soft text-danger-text border-destructive font-semibold'
                : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
            }`}
          >
            <XCircle className="h-3 w-3 text-destructive" />
            <span>Agotados ({countAgotado})</span>
          </button>
        </div>
      </div>

      {/* Tabla de existencias y niveles de stock */}
      <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
        <Table className="w-full min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-muted/50 border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold py-2.5 w-24 whitespace-nowrap">Código SKU</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 whitespace-nowrap">Producto & Categoría</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 whitespace-nowrap">Ubicación física</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-center whitespace-nowrap">Nivel de Stock</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 whitespace-nowrap">Estado</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-right whitespace-nowrap">
                {puedeVerCostos ? 'Costo / Venta' : 'PVP Venta'}
              </TableHead>
              {puedeVerCostos && (
                <TableHead className="text-xs font-semibold py-2.5 text-right whitespace-nowrap">Inversión Stock</TableHead>
              )}
              <TableHead className="text-xs font-semibold py-2.5 text-right w-40 whitespace-nowrap">Acción Rápida</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={puedeVerCostos ? 8 : 7} className="h-28 text-center text-xs text-muted-foreground">
                  Cargando catálogo de existencias...
                </TableCell>
              </TableRow>
            ) : filteredProductos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={puedeVerCostos ? 8 : 7} className="h-28 text-center text-xs text-muted-foreground">
                  No se encontraron productos con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              filteredProductos.map((prod) => {
                const isBajo = prod.estadoNivel === 'POR_AGOTARSE';
                const isAgotado = prod.estadoNivel === 'AGOTADO';

                return (
                  <TableRow
                    key={prod.id}
                    className="text-xs hover:bg-muted/30 transition-colors border-b border-border/70"
                  >
                    {/* Código SKU */}
                    <TableCell className="font-mono text-muted-foreground font-medium py-2.5">
                      {prod.sku}
                    </TableCell>

                    {/* Producto & Categoría */}
                    <TableCell className="py-2.5">
                      <span className="font-semibold text-foreground block text-[13px]">
                        {prod.nombre}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {prod.categoria} · {prod.unidadMedida}
                      </span>
                    </TableCell>

                    {/* Ubicación / Estante (Etapa 2) */}
                    <TableCell className="py-2.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 text-primary/70 shrink-0" />
                        <span className="truncate max-w-[130px]">{prod.ubicacion}</span>
                      </span>
                    </TableCell>

                    {/* Stock actual vs Stock Mínimo */}
                    <TableCell className="py-2.5 text-center">
                      <div className="flex items-baseline justify-center gap-1 font-mono">
                        <span
                          className={`text-sm font-bold tabular-nums ${
                            isAgotado
                              ? 'text-danger-text'
                              : isBajo
                              ? 'text-warning-text'
                              : 'text-foreground'
                          }`}
                        >
                          {prod.stock}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          / mín {prod.stockMinimo}
                        </span>
                      </div>
                    </TableCell>

                    {/* Estado semántico */}
                    <TableCell className="py-2.5">
                      {isAgotado ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-danger-soft text-danger-text border border-destructive/20">
                          <XCircle className="h-3 w-3 text-destructive" />
                          Agotado
                        </span>
                      ) : isBajo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-warning-soft text-warning-text border border-warning/20">
                          <AlertTriangle className="h-3 w-3 text-warning" />
                          Por agotarse
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-success-soft text-success-text border border-success/20">
                          <CheckCircle2 className="h-3 w-3 text-success" />
                          Suficiente
                        </span>
                      )}
                    </TableCell>

                    {/* Costo / Venta */}
                    <TableCell className="py-2.5 text-right font-mono tabular-nums whitespace-nowrap">
                      {puedeVerCostos && (
                        <span className="text-muted-foreground block text-[11px]">
                          C: {formatCurrency(prod.precioCompra)}
                        </span>
                      )}
                      <span className="text-foreground font-medium">
                        {puedeVerCostos ? 'V: ' : ''}{formatCurrency(prod.precioVenta)}
                      </span>
                    </TableCell>

                    {/* Inversión total en stock */}
                    {puedeVerCostos && (
                      <TableCell className="py-2.5 text-right font-mono font-semibold tabular-nums text-foreground whitespace-nowrap">
                        {formatCurrency(prod.valorizadoCosto)}
                      </TableCell>
                    )}

                    {/* Acciones directas */}
                    <TableCell className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenRecepcionConProducto(prod.id)}
                          title="Registrar llegada de compra para este producto"
                          className="h-7 px-2 text-[11px] gap-1 hover:border-primary hover:text-primary"
                        >
                          <Truck className="h-3 w-3 text-primary" />
                          <span>+ Recibir</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenAuditoriaConProducto(prod.id)}
                          title="Cotejar lo que hay en estante vs sistema"
                          className="h-7 px-2 text-[11px] gap-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <ClipboardCheck className="h-3 w-3" />
                          <span>Cotejar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
