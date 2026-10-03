import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PosTerminalView } from '../components/PosTerminalView';
import { VentasDashboardView } from '../components/VentasDashboardView';
import { VentasHistorialView } from '../components/VentasHistorialView';
import { VentaDetalleModal } from '../components/VentaDetalleModal';
import { DevolucionesView } from '../components/DevolucionesView';
import { PedidosView } from '../components/PedidosView';
import { CotizacionesView } from '../components/CotizacionesView';
import { KipusIaVentasSheet } from '../components/KipusIaVentasSheet';
import { ventasService } from '../services/ventasService';
import { productosService } from '@/features/productos/services/productosService';
import { clientesService } from '@/features/clientes/services/clientesService';
import {
  Venta,
  NuevaVentaPayload,
  Pedido,
  Cotizacion,
  Devolucion,
  ResumenVentasKpis,
  NivelComplejidadNegocio,
  EstadoPedido,
} from '../types/ventas.types';
import { Producto } from '@/features/productos/types/productos.types';
import { Cliente } from '@/features/clientes/types/clientes.types';
import { subscribeToErp } from '@/services/erp/erpStore';
import {
  ShoppingCart,
  LayoutDashboard,
  Receipt,
  ShoppingBag,
  FileCheck,
  RotateCcw,
  Sparkles,
  Store,
  Building2,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';

export const VentasPage: React.FC = () => {
  // Estado de navegación
  const [tabActiva, setTabActiva] = useState<string>('pos');

  // Complejidad progresiva (adaptable al tamaño de negocio)
  const [nivelNegocio, setNivelNegocio] = useState<NivelComplejidadNegocio>('COMERCIO_MEDIANO');

  // Sucursal y caja activa
  const [sucursalActiva, setSucursalActiva] = useState('Sede Central (Tingo María)');
  const [cajaActiva, setCajaActiva] = useState('Caja 01 - Mostrador');

  // Datos principales
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [kpis, setKpis] = useState<ResumenVentasKpis | null>(null);
  const [loading, setLoading] = useState(true);

  // Modales
  const [ventaSeleccionadaDetalle, setVentaSeleccionadaDetalle] = useState<Venta | null>(null);
  const [openDetalleModal, setOpenDetalleModal] = useState(false);
  const [openIaSheet, setOpenIaSheet] = useState(false);
  const [ventaParaDevolucion, setVentaParaDevolucion] = useState<Venta | null>(null);

  // Carga de datos
  const fetchData = async () => {
    setLoading(true);
    try {
      const [ventasData, prodsData, cliData, pedData, cotData, devData, kpisData] =
        await Promise.all([
          ventasService.getVentas(),
          productosService.getProductos(),
          clientesService.getClientes(),
          ventasService.getPedidos(),
          ventasService.getCotizaciones(),
          ventasService.getDevoluciones(),
          ventasService.getKpisVentas(),
        ]);

      setVentas(ventasData);
      setProductos(prodsData);
      setClientes(cliData);
      setPedidos(pedData);
      setCotizaciones(cotData);
      setDevoluciones(devData);
      setKpis(kpisData);
    } catch {
      toast.error('Error al cargar datos del módulo de ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const unsubscribe = subscribeToErp(() => {
      fetchData();
    });
    return unsubscribe;
  }, []);

  // Handlers
  const handleEmitirVenta = async (payload: NuevaVentaPayload): Promise<Venta> => {
    const nueva = await ventasService.crearVenta(payload);
    await fetchData();
    return nueva;
  };

  const handleAnularVenta = async (id: string, motivo: string) => {
    await ventasService.anularVenta(id, motivo);
    await fetchData();
  };

  const handleRegistrarDevolucion = async (payload: any) => {
    await ventasService.registrarDevolucion(payload);
    await fetchData();
  };

  const handleCambiarEstadoPedido = async (id: string, nuevoEstado: EstadoPedido) => {
    await ventasService.cambiarEstadoPedido(id, nuevoEstado);
    await fetchData();
  };

  const handleConvertirPedidoAVenta = async (pedidoId: string) => {
    await ventasService.convertirPedidoAVenta(pedidoId);
    await fetchData();
  };

  const handleCrearPedido = async (payload: any) => {
    await ventasService.crearPedido(payload);
    await fetchData();
  };

  const handleConvertirCotizacionAVenta = async (cotizacionId: string) => {
    await ventasService.convertirCotizacionAVenta(cotizacionId);
    await fetchData();
  };

  const handleCrearCotizacion = async (payload: any) => {
    await ventasService.crearCotizacion(payload);
    await fetchData();
  };

  const handleVerDetalleVenta = (v: Venta) => {
    setVentaSeleccionadaDetalle(v);
    setOpenDetalleModal(true);
  };

  const handleIniciarDevolucionDesdeVenta = (v: Venta) => {
    setVentaParaDevolucion(v);
    setTabActiva('devoluciones');
  };

  return (
    <div className="space-y-4">
      {/* Encabezado Principal */}
      <PageHeader
        title="Módulo de Ventas y Facturación"
        description="Punto de venta rápido, comprobantes electrónicos SUNAT, pedidos, cotizaciones y devoluciones."
        badge="POS KIPU'S"
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de complejidad progresiva del negocio */}
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs">
            <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground hidden sm:inline">Modo:</span>
            <select
              value={nivelNegocio}
              onChange={(e) => setNivelNegocio(e.target.value as NivelComplejidadNegocio)}
              className="bg-transparent font-medium text-foreground text-xs focus:outline-none cursor-pointer"
            >
              <option value="TIENDA_PEQUENA">Tienda Rápida / Bodega</option>
              <option value="COMERCIO_MEDIANO">Comercio Mediano</option>
              <option value="CADENA_EMPRESARIAL">Cadena Multitienda</option>
            </select>
          </div>

          {/* Selector de Sucursal si es mediano o empresarial */}
          {nivelNegocio !== 'TIENDA_PEQUENA' && (
            <div className="hidden md:flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-xs">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <select
                value={sucursalActiva}
                onChange={(e) => setSucursalActiva(e.target.value)}
                className="bg-transparent font-medium text-foreground text-xs focus:outline-none cursor-pointer"
              >
                <option value="Sede Central (Tingo María)">Sede Central</option>
                <option value="Tienda Mostrador (Tingo María)">Tienda Mostrador</option>
                <option value="Sucursal Huánuco">Sucursal Huánuco</option>
              </select>
            </div>
          )}

          {/* Botón Asistente KIPU'S IA */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpenIaSheet(true)}
            className="gap-1.5 h-8 text-xs font-semibold text-primary border-primary/30 hover:bg-primary-soft cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>KIPU'S IA</span>
          </Button>
        </div>
      </PageHeader>

      {/* Navegación por pestañas de ventas */}
      <Tabs value={tabActiva} onValueChange={setTabActiva} className="w-full space-y-3.5">
        <TabsList className="bg-muted/70 p-1 flex flex-wrap h-auto gap-1 border border-border/60">
          <TabsTrigger value="pos" className="text-xs font-semibold py-1.5 px-3 gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Punto de Venta (POS)</span>
          </TabsTrigger>

          <TabsTrigger value="dashboard" className="text-xs font-medium py-1.5 px-3 gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Resumen del Día</span>
          </TabsTrigger>

          <TabsTrigger value="historial" className="text-xs font-medium py-1.5 px-3 gap-1.5">
            <Receipt className="h-3.5 w-3.5" />
            <span>Historial de Comprobantes</span>
          </TabsTrigger>

          {/* Pestañas habilitadas en Modo Comercio Mediano y Cadena */}
          {nivelNegocio !== 'TIENDA_PEQUENA' && (
            <>
              <TabsTrigger value="pedidos" className="text-xs font-medium py-1.5 px-3 gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Pedidos ({pedidos.filter((p) => p.estado !== 'ENTREGADO').length})</span>
              </TabsTrigger>

              <TabsTrigger value="cotizaciones" className="text-xs font-medium py-1.5 px-3 gap-1.5">
                <FileCheck className="h-3.5 w-3.5" />
                <span>Cotizaciones / Proformas</span>
              </TabsTrigger>
            </>
          )}

          {/* Pestaña habilitada en Modo Cadena Empresarial */}
          {nivelNegocio === 'CADENA_EMPRESARIAL' && (
            <TabsTrigger value="devoluciones" className="text-xs font-medium py-1.5 px-3 gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Devoluciones</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: TERMINAL PUNTO DE VENTA (POS)                                  */}
        {/* ========================================================================= */}
        <TabsContent value="pos" className="space-y-4">
          <PosTerminalView
            productos={productos}
            clientes={clientes}
            onEmitirVenta={handleEmitirVenta}
            sucursalActiva={sucursalActiva}
            cajaActiva={cajaActiva}
            vendedorActivo="Carlos Vega"
          />
        </TabsContent>

        {/* ========================================================================= */}
        {/* PESTAÑA 2: DASHBOARD RESUMEN DE VENTAS                                    */}
        {/* ========================================================================= */}
        <TabsContent value="dashboard" className="space-y-4">
          <VentasDashboardView
            ventas={ventas}
            kpis={kpis}
            onIrAPos={() => setTabActiva('pos')}
            onVerDetalleVenta={handleVerDetalleVenta}
          />
        </TabsContent>

        {/* ========================================================================= */}
        {/* PESTAÑA 3: HISTORIAL DE VENTAS                                            */}
        {/* ========================================================================= */}
        <TabsContent value="historial" className="space-y-4">
          <VentasHistorialView
            ventas={ventas}
            loading={loading}
            onVerDetalle={handleVerDetalleVenta}
            onIniciarDevolucion={handleIniciarDevolucionDesdeVenta}
          />
        </TabsContent>

        {/* ========================================================================= */}
        {/* PESTAÑA 4: PEDIDOS                                                        */}
        {/* ========================================================================= */}
        {nivelNegocio !== 'TIENDA_PEQUENA' && (
          <TabsContent value="pedidos" className="space-y-4">
            <PedidosView
              pedidos={pedidos}
              productos={productos}
              clientes={clientes}
              onCambiarEstado={handleCambiarEstadoPedido}
              onConvertirAVenta={handleConvertirPedidoAVenta}
              onCrearPedido={handleCrearPedido}
            />
          </TabsContent>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 5: COTIZACIONES                                                   */}
        {/* ========================================================================= */}
        {nivelNegocio !== 'TIENDA_PEQUENA' && (
          <TabsContent value="cotizaciones" className="space-y-4">
            <CotizacionesView
              cotizaciones={cotizaciones}
              productos={productos}
              clientes={clientes}
              onConvertirAVenta={handleConvertirCotizacionAVenta}
              onCrearCotizacion={handleCrearCotizacion}
            />
          </TabsContent>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 6: DEVOLUCIONES                                                   */}
        {/* ========================================================================= */}
        {nivelNegocio === 'CADENA_EMPRESARIAL' && (
          <TabsContent value="devoluciones" className="space-y-4">
            <DevolucionesView
              ventas={ventas}
              devoluciones={devoluciones}
              onRegistrarDevolucion={handleRegistrarDevolucion}
              ventaPreseleccionada={ventaParaDevolucion}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Modal de Detalle de Venta */}
      <VentaDetalleModal
        open={openDetalleModal}
        onOpenChange={setOpenDetalleModal}
        venta={ventaSeleccionadaDetalle}
        onAnularVenta={handleAnularVenta}
        onIniciarDevolucion={handleIniciarDevolucionDesdeVenta}
      />

      {/* Panel lateral KIPU'S IA */}
      <KipusIaVentasSheet
        open={openIaSheet}
        onOpenChange={setOpenIaSheet}
        ventas={ventas}
        productos={productos}
        kpis={kpis}
      />
    </div>
  );
};

export default VentasPage;
