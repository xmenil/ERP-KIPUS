import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { StatusBadge } from '@/components/common/StatusBadge';
import { InventarioFlowBanner } from '../components/InventarioFlowBanner';
import { TablaControlStock } from '../components/TablaControlStock';
import { RecepcionMercanciaDialog } from '../components/RecepcionMercanciaDialog';
import { AuditoriaConteoDialog } from '../components/AuditoriaConteoDialog';
import { NuevoMovimientoDialog } from '../components/NuevoMovimientoDialog';
import { ModuloAuditoriaFisica } from '../components/ModuloAuditoriaFisica';
import { AnalisisRotacionReporte } from '../components/AnalisisRotacionReporte';
import { inventarioService } from '../services/inventarioService';
import {
  MovimientoKardex,
  AlmacenResumen,
  ItemStockDetalle,
  NuevoMovimientoPayload,
  RecepcionMercanciaPayload,
  AjusteAuditoriaPayload,
  EtapaFlujoInventario,
} from '../types/inventario.types';
import { subscribeToErp, erpStore } from '@/services/erp/erpStore';
import {
  Warehouse,
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  Truck,
  ClipboardCheck,
  Search,
  MapPin,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

export const InventarioPage: React.FC = () => {
  // Datos principales
  const [productosStock, setProductosStock] = useState<ItemStockDetalle[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoKardex[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenResumen[]>([]);
  const [loading, setLoading] = useState(true);

  // Navegación de pestañas sincronizada con las 6 etapas
  const [tabActiva, setTabActiva] = useState<string>('control-stock');
  const [etapaActiva, setEtapaActiva] = useState<EtapaFlujoInventario>('CONTROL_STOCK');

  // Modales
  const [openRecepcionModal, setOpenRecepcionModal] = useState(false);
  const [openAuditoriaModal, setOpenAuditoriaModal] = useState(false);
  const [openMovimientoModal, setOpenMovimientoModal] = useState(false);
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<string | undefined>(undefined);

  // Filtros del Kardex
  const [kardexSearch, setKardexSearch] = useState('');
  const [kardexTipoFiltro, setKardexTipoFiltro] = useState<string>('TODOS');

  // Carga de datos
  const fetchData = async () => {
    setLoading(true);
    try {
      const [kardexData, almacenesData, stockData] = await Promise.all([
        inventarioService.getMovimientosKardex(),
        inventarioService.getAlmacenes(),
        inventarioService.getProductosStock(),
      ]);
      setMovimientos(kardexData);
      setAlmacenes(almacenesData);
      setProductosStock(stockData);
    } catch {
      toast.error('Error al cargar datos del inventario');
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

  // Mapear selección del banner a pestañas
  const handleSelectEtapa = (etapa: EtapaFlujoInventario) => {
    setEtapaActiva(etapa);
    switch (etapa) {
      case 'RECEPCION':
        setTabActiva('recepcion');
        break;
      case 'CLASIFICACION':
        setTabActiva('almacenes');
        break;
      case 'MOVIMIENTOS':
        setTabActiva('kardex');
        break;
      case 'CONTROL_STOCK':
        setTabActiva('control-stock');
        break;
      case 'AUDITORIA':
        setTabActiva('auditoria');
        break;
      case 'ANALISIS':
        setTabActiva('analisis');
        break;
    }
  };

  // Mapear cambio de tab al banner
  const handleTabChange = (value: string) => {
    setTabActiva(value);
    switch (value) {
      case 'recepcion':
        setEtapaActiva('RECEPCION');
        break;
      case 'almacenes':
        setEtapaActiva('CLASIFICACION');
        break;
      case 'kardex':
        setEtapaActiva('MOVIMIENTOS');
        break;
      case 'control-stock':
        setEtapaActiva('CONTROL_STOCK');
        break;
      case 'auditoria':
        setEtapaActiva('AUDITORIA');
        break;
      case 'analisis':
        setEtapaActiva('ANALISIS');
        break;
    }
  };

  // Handlers para acciones
  const handleRecepcionMercancia = async (payload: RecepcionMercanciaPayload) => {
    await inventarioService.recepcionarMercancia(payload);
    await fetchData();
  };

  const handleAjusteAuditoria = async (payload: AjusteAuditoriaPayload) => {
    await inventarioService.registrarAjusteAuditoria(payload);
    await fetchData();
  };

  const handleCrearMovimientoManual = async (payload: NuevoMovimientoPayload) => {
    await inventarioService.registrarMovimiento(payload);
    await fetchData();
    toast.success(`Movimiento de ${payload.tipo} registrado en Kardex`);
  };

  // Abrir modal con producto específico desde la tabla
  const handleOpenRecepcionConProd = (id: string) => {
    setProductoSeleccionadoId(id);
    setOpenRecepcionModal(true);
  };

  const handleOpenAuditoriaConProd = (id: string) => {
    setProductoSeleccionadoId(id);
    setOpenAuditoriaModal(true);
  };

  // Cálculos resumen
  const productosBajoStock = productosStock.filter((p) => p.estadoNivel !== 'SUFICIENTE').length;
  const totalValorizadoCosto = productosStock.reduce((acc, p) => acc + p.valorizadoCosto, 0);

  // Filtrado de Kardex
  const filteredKardex = movimientos.filter((m) => {
    const matchSearch =
      m.productoNombre.toLowerCase().includes(kardexSearch.toLowerCase()) ||
      m.sku.toLowerCase().includes(kardexSearch.toLowerCase()) ||
      m.referencia.toLowerCase().includes(kardexSearch.toLowerCase());
    const matchTipo = kardexTipoFiltro === 'TODOS' || m.tipo === kardexTipoFiltro;
    return matchSearch && matchTipo;
  });

  // Recepciones recientes (movimientos de entrada con motivo compra)
  const recepcionesRecientes = movimientos.filter(
    (m) => m.tipo === 'ENTRADA' && (m.motivo === 'COMPRA' || m.motivo === 'INVENTARIO_INICIAL')
  );

  return (
    <div className="space-y-5">
      {/* Encabezado Principal */}
      <PageHeader
        title="Gestión y Control de Inventarios"
        description="Ciclo completo de mercadería: recepción, clasificación, kardex, niveles de stock, auditorías y valorización."
        badge="Multialmacén KIPU'S"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setProductoSeleccionadoId(undefined);
              setOpenRecepcionModal(true);
            }}
            className="gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
          >
            <Truck className="h-4 w-4" />
            <span>+ Recepcionar Mercancía</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setProductoSeleccionadoId(undefined);
              setOpenAuditoriaModal(true);
            }}
            className="gap-1.5 font-medium"
          >
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <span>Auditar Físicamente</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpenMovimientoModal(true)}
            className="gap-1.5 text-muted-foreground hover:text-foreground text-xs"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span>Movimiento manual</span>
          </Button>
        </div>
      </PageHeader>

      {/* Banner Visual del Flujo de 6 Etapas */}
      <InventarioFlowBanner
        etapaActiva={etapaActiva}
        onSelectEtapa={handleSelectEtapa}
        productosBajoStockCount={productosBajoStock}
        totalMovimientos={movimientos.length}
        totalValorizado={totalValorizadoCosto}
      />

      {/* Navegación por pestañas sincronizadas con el flujo */}
      <Tabs value={tabActiva} onValueChange={handleTabChange} className="w-full space-y-4">
        <TabsList className="bg-muted/70 p-1 flex flex-wrap h-auto gap-1 border border-border/60">
          <TabsTrigger value="control-stock" className="text-xs font-medium py-1.5 px-3">
            4. Control de Niveles de Stock
          </TabsTrigger>
          <TabsTrigger value="recepcion" className="text-xs font-medium py-1.5 px-3">
            1. Recepción de Mercancía
          </TabsTrigger>
          <TabsTrigger value="kardex" className="text-xs font-medium py-1.5 px-3">
            3. Registro de Movimientos (Kardex)
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="text-xs font-medium py-1.5 px-3">
            5. Auditorías y Conteo Físico
          </TabsTrigger>
          <TabsTrigger value="almacenes" className="text-xs font-medium py-1.5 px-3">
            2. Clasificación y Ubicaciones
          </TabsTrigger>
          <TabsTrigger value="analisis" className="text-xs font-medium py-1.5 px-3">
            6. Análisis y Reportes
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: CONTROL DE NIVELES DE STOCK (Etapa 4)                          */}
        {/* ========================================================================= */}
        <TabsContent value="control-stock" className="space-y-4">
          <TablaControlStock
            productos={productosStock}
            loading={loading}
            onOpenRecepcionConProducto={handleOpenRecepcionConProd}
            onOpenAuditoriaConProducto={handleOpenAuditoriaConProd}
          />
        </TabsContent>

        {/* ========================================================================= */}
        {/* PESTAÑA 2: RECEPCIÓN DE MERCANCÍA (Etapa 1 - Conexión con Compras)       */}
        {/* ========================================================================= */}
        <TabsContent value="recepcion" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Panel de acción directa de recepción */}
            <Card className="border-border/80 lg:col-span-1">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-primary" />
                    ¿Llegó un pedido de proveedor?
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Registra la llegada de mercadería para sumar las unidades al stock inmediatamente y dejar trazabilidad en el Kardex.
                  </p>
                </div>

                <Button
                  className="w-full gap-2 font-semibold text-xs h-9 bg-primary"
                  onClick={() => {
                    setProductoSeleccionadoId(undefined);
                    setOpenRecepcionModal(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Registrar Recepción con Guía / Factura</span>
                </Button>

                <div className="pt-2 border-t border-border/60 space-y-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground block">
                    Relación con el área de Compras:
                  </span>
                  <p className="text-[11px] leading-tight">
                    También puedes generar una orden formal con costo total e impacto en caja desde el{' '}
                    <a href="/compras" className="text-primary underline">
                      Módulo de Compras
                    </a>.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Historial de recepciones recientes */}
            <Card className="border-border/80 lg:col-span-2">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Últimas recepciones e ingresos registrados
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {recepcionesRecientes.length} ingresos
                  </span>
                </div>

                <div className="overflow-x-auto rounded border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 border-b border-border">
                        <TableHead className="text-xs py-2">Fecha</TableHead>
                        <TableHead className="text-xs py-2">Producto / SKU</TableHead>
                        <TableHead className="text-xs py-2 text-center">Ingreso</TableHead>
                        <TableHead className="text-xs py-2">Comprobante / Proveedor</TableHead>
                        <TableHead className="text-xs py-2">Almacén</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recepcionesRecientes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-xs text-muted-foreground">
                            Aún no hay recepciones registradas.
                          </TableCell>
                        </TableRow>
                      ) : (
                        recepcionesRecientes.slice(0, 5).map((rec) => (
                          <TableRow key={rec.id} className="text-xs hover:bg-muted/20 border-b border-border/60">
                            <TableCell className="font-mono text-muted-foreground py-2 text-[11px]">
                              {rec.fecha}
                            </TableCell>
                            <TableCell className="py-2">
                              <span className="font-medium text-foreground block">{rec.productoNombre}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{rec.sku}</span>
                            </TableCell>
                            <TableCell className="py-2 text-center font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                              +{rec.cantidad}
                            </TableCell>
                            <TableCell className="py-2 text-[11px]">
                              <span className="font-medium text-foreground block">{rec.referencia}</span>
                              <span className="text-[10px] text-muted-foreground">Por: {rec.usuario}</span>
                            </TableCell>
                            <TableCell className="py-2 text-muted-foreground text-[11px]">
                              {rec.almacen}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* PESTAÑA 3: KARDEX Y MOVIMIENTOS (Etapa 3 - Conexión con Ventas y Caja)    */}
        {/* ========================================================================= */}
        <TabsContent value="kardex" className="space-y-4">
          <Card className="border-border/80">
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por producto, SKU o comprobante..."
                    value={kardexSearch}
                    onChange={(e) => setKardexSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {['TODOS', 'ENTRADA', 'SALIDA', 'AJUSTE'].map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => setKardexTipoFiltro(tipo)}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer select-none font-medium ${
                        kardexTipoFiltro === tipo
                          ? 'bg-primary text-primary-foreground border-primary font-semibold'
                          : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
                      }`}
                    >
                      {tipo === 'TODOS' ? 'Todos' : tipo}
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-2 hidden lg:inline">
                    {filteredKardex.length} operaciones
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-b border-border hover:bg-transparent">
                      <TableHead className="text-xs font-semibold py-2.5">Fecha y Hora</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5">Tipo</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5">Producto / SKU</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5">Almacén</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 text-center">Cantidad</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5 text-center">Saldo Stock</TableHead>
                      <TableHead className="text-xs font-semibold py-2.5">Referencia / Origen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKardex.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-28 text-center text-xs text-muted-foreground">
                          No se encontraron movimientos registrados con los filtros seleccionados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredKardex.map((mov) => {
                        const isEntrada = mov.tipo === 'ENTRADA';
                        const isSalida = mov.tipo === 'SALIDA';
                        return (
                          <TableRow
                            key={mov.id}
                            className="text-xs hover:bg-muted/20 border-b border-border/70 transition-colors"
                          >
                            <TableCell className="text-muted-foreground font-mono text-[11px] py-2.5">
                              {mov.fecha}
                            </TableCell>

                            <TableCell className="py-2.5">
                              <div className="flex items-center gap-1.5">
                                {isEntrada ? (
                                  <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600" />
                                ) : isSalida ? (
                                  <ArrowUpRight className="h-3.5 w-3.5 text-rose-600" />
                                ) : (
                                  <ArrowLeftRight className="h-3.5 w-3.5 text-amber-600" />
                                )}
                                <StatusBadge
                                  status={mov.tipo}
                                  variant={isEntrada ? 'success' : isSalida ? 'danger' : 'warning'}
                                />
                              </div>
                            </TableCell>

                            <TableCell className="py-2.5">
                              <span className="font-semibold text-foreground block text-[13px]">
                                {mov.productoNombre}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-mono">
                                SKU: {mov.sku}
                              </span>
                            </TableCell>

                            <TableCell className="text-foreground py-2.5 font-medium text-xs">
                              {mov.almacen}
                            </TableCell>

                            <TableCell className="text-center font-bold font-mono text-sm tabular-nums py-2.5">
                              <span
                                className={
                                  isEntrada
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : isSalida
                                    ? 'text-rose-700 dark:text-rose-400'
                                    : 'text-amber-700 dark:text-amber-400'
                                }
                              >
                                {isEntrada ? `+${mov.cantidad}` : isSalida ? `-${mov.cantidad}` : mov.cantidad}
                              </span>
                            </TableCell>

                            <TableCell className="text-center font-semibold font-mono text-xs text-foreground py-2.5 tabular-nums">
                              {mov.stockResultante} unid.
                            </TableCell>

                            <TableCell className="py-2.5">
                              <span className="font-medium text-foreground block text-xs">
                                {mov.referencia}
                              </span>
                              <span className="text-[11px] text-muted-foreground">Por: {mov.usuario}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* PESTAÑA 4: AUDITORÍAS Y RECUENTOS FÍSICOS (Etapa 5)                       */}
        {/* ========================================================================= */}
        <TabsContent value="auditoria" className="space-y-4">
          <ModuloAuditoriaFisica
            productos={productosStock}
            onAjustar={handleAjusteAuditoria}
          />
        </TabsContent>

        {/* ========================================================================= */}
        {/* PESTAÑA 5: CLASIFICACIÓN Y UBICACIONES (Etapa 2 - Conexión con Catálogo)  */}
        {/* ========================================================================= */}
        <TabsContent value="almacenes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {almacenes.map((alm) => (
              <Card key={alm.id} className="border-border/80">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded bg-primary-soft text-primary">
                        <Warehouse className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{alm.nombre}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {alm.direccion}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-success-soft text-success-text font-medium border border-success/20">
                      Operativo
                    </span>
                  </div>

                  {alm.responsable && (
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                      <span className="font-medium text-foreground">Responsable: </span>
                      {alm.responsable}
                    </div>
                  )}

                  {/* Zonas y estantes configurados */}
                  {alm.zonas && (
                    <div className="space-y-1">
                      <span className="text-[11px] text-muted-foreground font-medium block">
                        Zonas / Estanterías organizadas:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {alm.zonas.map((zona) => (
                          <span
                            key={zona}
                            className="text-[11px] px-2 py-0.5 rounded bg-card border border-border text-foreground font-mono"
                          >
                            {zona}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                    <div className="p-2.5 rounded bg-muted/30">
                      <span className="text-[11px] text-muted-foreground block">Variedad de Artículos</span>
                      <span className="text-base font-bold font-mono text-foreground">
                        {alm.totalProductos} SKUs
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-muted/30">
                      <span className="text-[11px] text-muted-foreground block">Existencias Totales</span>
                      <span className="text-base font-bold font-mono text-primary">
                        {alm.stockTotalUnidades} unid.
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Guía práctica para pequeños negocios */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <span className="text-xs font-semibold text-foreground block">
              Consejo KIPU'S para ordenar tu local:
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Asigna a cada estante una etiqueta visible (ej. "Estante A-1", "Vitrina Mostrador"). Cuando registras un producto en el{' '}
              <a href="/productos" className="text-primary underline">
                Catálogo de Productos
              </a>
              , guárdale su ubicación. Así, cualquier trabajador nuevo o tú mismo sabrán en qué anaquel exacto está la mercadería sin tener que buscar por toda la tienda.
            </p>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* PESTAÑA 6: ANÁLISIS Y REPORTES (Etapa 6 - Conexión con Finanzas)          */}
        {/* ========================================================================= */}
        <TabsContent value="analisis" className="space-y-4">
          <AnalisisRotacionReporte
            productos={productosStock}
            movimientos={movimientos}
          />
        </TabsContent>
      </Tabs>

      {/* Diálogos modales */}
      <RecepcionMercanciaDialog
        open={openRecepcionModal}
        onOpenChange={setOpenRecepcionModal}
        productos={productosStock}
        onRecepcionar={handleRecepcionMercancia}
      />

      <AuditoriaConteoDialog
        open={openAuditoriaModal}
        onOpenChange={setOpenAuditoriaModal}
        productos={productosStock}
        productoInicialId={productoSeleccionadoId}
        onAjustar={handleAjusteAuditoria}
      />

      <NuevoMovimientoDialog
        open={openMovimientoModal}
        onOpenChange={setOpenMovimientoModal}
        onMovimientoCreado={handleCrearMovimientoManual}
      />
    </div>
  );
};

export default InventarioPage;
