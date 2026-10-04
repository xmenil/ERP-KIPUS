import React from 'react';
import { SearchBar } from './SearchBar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { AlmacenResumen } from '../types/inventario.types';

interface FilterBarProps {
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  categoria: string;
  onCategoriaChange: (val: string) => void;
  categorias: string[];
  estado: string;
  onEstadoChange: (val: string) => void;
  almacen?: string;
  onAlmacenChange?: (val: string) => void;
  almacenes?: AlmacenResumen[];
  onResetFilters: () => void;
  hayFiltrosActivos: boolean;
  totalResultados?: number;
}

/**
 * Barra de filtros de inventario simple y directa para MYPES.
 * Agrupa búsqueda, categoría, estado y almacén sin saturar la vista.
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  busqueda,
  onBusquedaChange,
  categoria,
  onCategoriaChange,
  categorias,
  estado,
  onEstadoChange,
  almacen,
  onAlmacenChange,
  almacenes = [],
  onResetFilters,
  hayFiltrosActivos,
  totalResultados,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Buscador */}
        <SearchBar
          value={busqueda}
          onChange={onBusquedaChange}
          placeholder="Buscar por producto o código SKU…"
          className="flex-1"
        />

        {/* Filtro por Categoría */}
        <div className="w-full sm:w-44 shrink-0">
          <Select value={categoria} onValueChange={onCategoriaChange}>
            <SelectTrigger className="h-9 text-xs border-border bg-card">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAS" className="text-xs">
                Todas las categorías
              </SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por Estado */}
        <div className="w-full sm:w-36 shrink-0">
          <Select value={estado} onValueChange={onEstadoChange}>
            <SelectTrigger className="h-9 text-xs border-border bg-card">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS" className="text-xs">
                Todos los estados
              </SelectItem>
              <SelectItem value="DISPONIBLE" className="text-xs">
                Disponible
              </SelectItem>
              <SelectItem value="STOCK_BAJO" className="text-xs">
                Stock bajo
              </SelectItem>
              <SelectItem value="AGOTADO" className="text-xs">
                Agotado
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por Almacén (si hay almacenes y handler) */}
        {onAlmacenChange && almacenes.length > 0 && (
          <div className="w-full sm:w-48 shrink-0">
            <Select value={almacen || 'TODOS'} onValueChange={onAlmacenChange}>
              <SelectTrigger className="h-9 text-xs border-border bg-card">
                <SelectValue placeholder="Almacén" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS" className="text-xs">
                  Todos los almacenes
                </SelectItem>
                {almacenes.map((alm) => (
                  <SelectItem key={alm.id} value={alm.nombre} className="text-xs">
                    {alm.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Fila de estado de filtros y acción de limpiar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
        <div className="flex items-center gap-2">
          {hayFiltrosActivos && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 -ml-1 font-normal"
            >
              <RotateCcw className="h-3 w-3" />
              Restablecer filtros
            </Button>
          )}
        </div>

        {totalResultados !== undefined && (
          <span className="tabular-nums ml-auto text-xs">
            Mostrando <strong className="text-foreground font-medium">{totalResultados}</strong>{' '}
            {totalResultados === 1 ? 'producto' : 'productos'}
          </span>
        )}
      </div>
    </div>
  );
};
