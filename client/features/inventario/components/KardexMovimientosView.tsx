import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inventarioService } from '../services/inventarioService';
import { MovimientoStock, ItemStockDetalle, TipoMovimiento } from '../types/inventario.types';
import { MovementTable } from './MovementTable';
import { NuevoMovimientoDialog } from './NuevoMovimientoDialog';
import { SummaryCard } from './SummaryCard';
import { cn } from '@/lib/utils';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Plus,
  RotateCw,
  Search,
  Filter,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface KardexMovimientosViewProps {
  filtroInicialSku?: string;
}

export const KardexMovimientosView: React.FC<KardexMovimientosViewProps> = ({
  filtroInicialSku = '',
}) => {
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [productos, setProductos] = useState<ItemStockDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(filtroInicialSku);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [modalNuevoMovimiento, setModalNuevoMovimiento] = useState(false);

  const cargarDatos = async (silencioso: boolean = false) => {
    if (!silencioso) setLoading(true);
    try {
      const [movsData, prodsData] = await Promise.all([
        inventarioService.getMovimientos(),
        inventarioService.getProductosStock(),
      ]);
      setMovimientos(movsData || []);
      setProductos(prodsData || []);
    } catch {
      toast.error('Error al sincronizar el Kardex de movimientos');
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Métricas del Kardex
  const metricas = useMemo(() => {
    const total = movimientos.length;
    const entradas = movimientos.filter((m) => m.tipo === 'ENTRADA').reduce((acc, m) => acc + m.cantidad, 0);
    const salidas = movimientos.filter((m) => m.tipo === 'SALIDA').reduce((acc, m) => acc + m.cantidad, 0);
    const ajustes = movimientos.filter((m) => m.tipo === 'AJUSTE').length;

    return { total, entradas, salidas, ajustes };
  }, [movimientos]);

  // Filtrado de movimientos
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      const s = searchTerm.toLowerCase();
      const matchSearch =
        m.productoNombre.toLowerCase().includes(s) ||
        m.sku.toLowerCase().includes(s) ||
        (m.referencia && m.referencia.toLowerCase().includes(s)) ||
        (m.origen && m.origen.toLowerCase().includes(s));

      const matchTipo = filtroTipo === 'TODOS' || m.tipo === filtroTipo;

      return matchSearch && matchTipo;
    });
  }, [movimientos, searchTerm, filtroTipo]);

  return (
    <div className="space-y-4">
      {/* Indicadores Resumidos de Movimientos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Total de transacciones"
          value={metricas.total}
          description="registros en el historial"
        />
        <SummaryCard
          label="Unidades ingresadas"
          value={`+${metricas.entradas}`}
          description="recepciones y compras"
          variant="success"
        />
        <SummaryCard
          label="Unidades despachadas"
          value={`-${metricas.salidas}`}
          description="ventas y transferencias"
          variant="default"
        />
        <SummaryCard
          label="Ajustes y mermas"
          value={metricas.ajustes}
          description="correcciones de stock"
          variant={metricas.ajustes > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Barra de Filtros y Acciones */}
      <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between bg-card p-3 rounded-lg border border-border shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por producto, SKU, documento (Factura/Boleta) o motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Chips de Tipo de Movimiento */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFiltroTipo('TODOS')}
            className={cn(
              'px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer font-medium',
              filtroTipo === 'TODOS'
                ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            )}
          >
            Todos ({movimientos.length})
          </button>

          <button
            type="button"
            onClick={() => setFiltroTipo('ENTRADA')}
            className={cn(
              'px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer font-medium flex items-center gap-1',
              filtroTipo === 'ENTRADA'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'bg-card border-border text-muted-foreground hover:text-emerald-600'
            )}
          >
            <ArrowDownLeft className="h-3.5 w-3.5" />
            <span>Entradas</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroTipo('SALIDA')}
            className={cn(
              'px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer font-medium flex items-center gap-1',
              filtroTipo === 'SALIDA'
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-400 font-bold'
                : 'bg-card border-border text-muted-foreground hover:text-blue-600'
            )}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>Salidas</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroTipo('AJUSTE')}
            className={cn(
              'px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer font-medium flex items-center gap-1',
              filtroTipo === 'AJUSTE'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold'
                : 'bg-card border-border text-muted-foreground hover:text-amber-600'
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Ajustes</span>
          </button>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => cargarDatos()}
            className="h-8 text-xs border-border"
            title="Refrescar historial"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setModalNuevoMovimiento(true)}
            className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Registrar movimiento</span>
          </Button>
        </div>
      </div>

      {/* Tabla del Kardex con Saldo y Costo */}
      <MovementTable
        movimientos={movimientosFiltrados}
        initialSearch={searchTerm}
      />

      {/* Modal para Registrar Movimiento Manual */}
      <NuevoMovimientoDialog
        open={modalNuevoMovimiento}
        onOpenChange={setModalNuevoMovimiento}
        onMovimientoCreado={async (payload) => {
          await inventarioService.registrarMovimiento(payload);
          await cargarDatos(true);
        }}
      />
    </div>
  );
};
