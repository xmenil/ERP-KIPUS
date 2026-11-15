import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useAuth } from '@/features/auth/context/AuthContext';
import { CajaPage } from '@/features/caja/pages/CajaPage';
import { PosTerminalView } from '../components/PosTerminalView';
import { VentasHistorialView } from '../components/VentasHistorialView';
import { PedidosCotizacionesView } from '../components/PedidosCotizacionesView';
import { VentasDashboardView } from '../components/VentasDashboardView';
import { VentaDetalleModal } from '../components/VentaDetalleModal';
import { KipusIaVentasSheet } from '../components/KipusIaVentasSheet';
import { useVentasData } from '../hooks/useVentasData';
import { Venta } from '../types/ventas.types';
import { Sparkles } from 'lucide-react';

export const VentasPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const tabActiva = useMemo(() => {
    if (tabParam === 'caja') return 'caja';
    if (tabParam === 'historial') return 'historial';
    if (tabParam === 'pedidos' || tabParam === 'cotizaciones') return 'pedidos';
    if (tabParam === 'dashboard') return 'dashboard';
    return 'pos';
  }, [tabParam]);

  const {
    ventas,
    productos,
    clientes,
    pedidos,
    cotizaciones,
    kpis,
    loading,
    emitirVenta,
    anularVenta,
    cambiarEstadoPedido,
    convertirPedidoAVenta,
    crearPedido,
    convertirCotizacionAVenta,
    crearCotizacion,
  } = useVentasData();

  const [ventaSeleccionadaDetalle, setVentaSeleccionadaDetalle] = useState<Venta | null>(null);
  const [openDetalleModal, setOpenDetalleModal] = useState(false);
  const [openIaSheet, setOpenIaSheet] = useState(false);

  const handleVerDetalle = (v: Venta) => {
    setVentaSeleccionadaDetalle(v);
    setOpenDetalleModal(true);
  };

  const badgeTitle =
    tabActiva === 'pos'
      ? 'Punto de Venta (POS)'
      : tabActiva === 'historial'
      ? 'Historial de Comprobantes'
      : tabActiva === 'caja'
      ? 'Caja y Turnos'
      : tabActiva === 'pedidos'
      ? 'Pedidos y Cotizaciones'
      : 'Resumen del Día';

  return (
    <div className="space-y-3">
      <PageHeader
        title="Ventas y Caja"
        description={tabActiva === 'pos' ? undefined : 'Punto de venta táctil, comprobantes SUNAT, arqueo y preventa.'}
        badge={badgeTitle}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpenIaSheet(true)}
          className="gap-1.5 h-8 text-xs font-semibold text-primary border-primary/30 hover:bg-primary-soft cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>KIPU'S IA</span>
        </Button>
      </PageHeader>

      <div className="pt-0">
        {tabActiva === 'pos' && (
          <ErrorBoundary moduleName="Punto de Venta POS">
            <PosTerminalView
              productos={productos}
              clientes={clientes}
              onEmitirVenta={emitirVenta}
              sucursalActiva="Sede Central (Tingo María)"
              cajaActiva="Caja 01 - Mostrador"
              vendedorActivo={user?.nombreCompleto || 'Carlos Vega'}
            />
          </ErrorBoundary>
        )}

        {tabActiva === 'historial' && (
          <ErrorBoundary moduleName="Historial de Comprobantes">
            <VentasHistorialView ventas={ventas} loading={loading} onVerDetalle={handleVerDetalle} />
          </ErrorBoundary>
        )}

        {tabActiva === 'caja' && (
          <ErrorBoundary moduleName="Caja y Turnos">
            <CajaPage embedded={true} />
          </ErrorBoundary>
        )}

        {tabActiva === 'pedidos' && (
          <ErrorBoundary moduleName="Pedidos y Cotizaciones">
            <PedidosCotizacionesView
              pedidos={pedidos}
              cotizaciones={cotizaciones}
              productos={productos}
              clientes={clientes}
              onCambiarEstadoPedido={cambiarEstadoPedido}
              onConvertirPedidoAVenta={convertirPedidoAVenta}
              onCrearPedido={crearPedido}
              onConvertirCotizacionAVenta={convertirCotizacionAVenta}
              onCrearCotizacion={crearCotizacion}
            />
          </ErrorBoundary>
        )}

        {tabActiva === 'dashboard' && user?.rol !== 'CAJERO' && (
          <ErrorBoundary moduleName="Resumen del Día">
            <VentasDashboardView
              ventas={ventas}
              kpis={kpis}
              onIrAPos={() => {}}
              onVerDetalleVenta={handleVerDetalle}
            />
          </ErrorBoundary>
        )}
      </div>

      <VentaDetalleModal
        open={openDetalleModal}
        onOpenChange={setOpenDetalleModal}
        venta={ventaSeleccionadaDetalle}
        onAnularVenta={anularVenta}
      />
      <KipusIaVentasSheet open={openIaSheet} onOpenChange={setOpenIaSheet} ventas={ventas} productos={productos} kpis={kpis} />
    </div>
  );
};

export default VentasPage;
