import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Pedido, Cotizacion, EstadoPedido, EstadoCotizacion } from '../types/ventas.types';
import { Producto } from '@/features/productos/types/productos.types';
import { Cliente } from '@/features/clientes/types/clientes.types';
import { PedidosView } from './PedidosView';
import { CotizacionesView } from './CotizacionesView';
import { SummaryCard } from '@/features/inventario/components/SummaryCard';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import {
  ShoppingBag,
  FileCheck,
  Plus,
  Clock,
  CheckCircle2,
  TrendingUp,
  RotateCw,
} from 'lucide-react';

interface PedidosCotizacionesViewProps {
  pedidos: Pedido[];
  cotizaciones: Cotizacion[];
  productos: Producto[];
  clientes: Cliente[];
  onCambiarEstadoPedido: (id: string, nuevoEstado: EstadoPedido) => Promise<void>;
  onConvertirPedidoAVenta: (pedidoId: string) => Promise<void>;
  onCrearPedido: (payload: Omit<Pedido, 'id' | 'codigo' | 'fecha'>) => Promise<void>;
  onConvertirCotizacionAVenta: (cotizacionId: string) => Promise<void>;
  onCrearCotizacion: (payload: Omit<Cotizacion, 'id' | 'numero' | 'fecha'>) => Promise<void>;
  subTabInicial?: 'pedidos' | 'cotizaciones';
}

export const PedidosCotizacionesView: React.FC<PedidosCotizacionesViewProps> = ({
  pedidos,
  cotizaciones,
  productos,
  clientes,
  onCambiarEstadoPedido,
  onConvertirPedidoAVenta,
  onCrearPedido,
  onConvertirCotizacionAVenta,
  onCrearCotizacion,
  subTabInicial = 'pedidos',
}) => {
  const [subTab, setSubTab] = useState<'pedidos' | 'cotizaciones'>(subTabInicial);

  const metricas = useMemo(() => {
    const pedidosPendientes = pedidos.filter((p) => p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO').length;
    const pedidosEntregados = pedidos.filter((p) => p.estado === 'ENTREGADO').length;
    const cotizacionesVigentes = cotizaciones.filter((c) => c.estado === 'VIGENTE').length;
    const valorCotizado = cotizaciones
      .filter((c) => c.estado === 'VIGENTE')
      .reduce((acc, c) => acc + (c.total || 0), 0);

    return {
      pedidosPendientes,
      pedidosEntregados,
      cotizacionesVigentes,
      valorCotizado,
    };
  }, [pedidos, cotizaciones]);

  return (
    <div className="space-y-4">
      {/* Indicadores Superiores de Preventa y Cotizaciones */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Pedidos pendientes"
          value={metricas.pedidosPendientes}
          description="en preparación o por entregar"
          variant={metricas.pedidosPendientes > 0 ? 'warning' : 'default'}
        />
        <SummaryCard
          label="Pedidos completados"
          value={metricas.pedidosEntregados}
          description="facturados y entregados"
          variant="success"
        />
        <SummaryCard
          label="Cotizaciones vigentes"
          value={metricas.cotizacionesVigentes}
          description="proformas activas a clientes"
        />
        <SummaryCard
          label="Valor potencial cotizado"
          value={formatCurrency(metricas.valorCotizado)}
          description="ventas en negociación"
        />
      </div>

      {/* Switcher Ergonómico entre Pedidos y Cotizaciones */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1 border-b border-border">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={subTab === 'pedidos' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSubTab('pedidos')}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              subTab === 'pedidos' && 'bg-primary text-primary-foreground'
            )}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Pedidos en Cola ({pedidos.filter((p) => p.estado !== 'ENTREGADO').length})</span>
          </Button>

          <Button
            type="button"
            variant={subTab === 'cotizaciones' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSubTab('cotizaciones')}
            className={cn(
              'h-8 text-xs font-semibold gap-1.5',
              subTab === 'cotizaciones' && 'bg-primary text-primary-foreground'
            )}
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>Cotizaciones y Proformas ({cotizaciones.length})</span>
          </Button>
        </div>
      </div>

      {/* Subvista: Pedidos */}
      {subTab === 'pedidos' && (
        <div className="space-y-3">
          <PedidosView
            pedidos={pedidos}
            productos={productos}
            clientes={clientes}
            onCambiarEstado={onCambiarEstadoPedido}
            onConvertirAVenta={onConvertirPedidoAVenta}
            onCrearPedido={onCrearPedido}
          />
        </div>
      )}

      {/* Subvista: Cotizaciones */}
      {subTab === 'cotizaciones' && (
        <div className="space-y-3">
          <CotizacionesView
            cotizaciones={cotizaciones}
            productos={productos}
            clientes={clientes}
            onConvertirAVenta={onConvertirCotizacionAVenta}
            onCrearCotizacion={onCrearCotizacion}
          />
        </div>
      )}
    </div>
  );
};
