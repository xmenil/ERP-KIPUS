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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { subscribeToErp } from '@/services/erp/erpStore';
import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';
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
  RotateCcw,
  PackageSearch,
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
  const [kardexAlmacenFiltro, setKardexAlmacenFiltro] = useState<string>('TODOS');

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
      toast.error('No se pudo cargar el inventario. Revisa tu conexión.');
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
    const signo = payload.tipo === 'ENTRADA' ? '+' : payload.tipo === 'SALIDA' ? '-' : '';
    toast.success(
      `Movimiento registrado: ${signo}${payload.cantidad} unid. (${payload.productoNombre})`
    );
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
    const matchAlmacen = kardexAlmacenFiltro === 'TODOS' || m.almacen.includes(kardexAlmacenFiltro);
    return matchSearch && matchTipo && matchAlmacen;
  });

  const hayFiltrosKardexActivos =
    kardexSearch !== '' || kardexTipoFiltro !== 'TODOS' || kardexAlmacenFiltro !== 'TODOS';

  const resetKardexFilters = () => {
    setKardexSearch('');
    setKardexTipoFiltro('TODOS');
    setKardexAlmacenFiltro('TODOS');
  };

  // Recepciones recientes (movimientos de entrada con motivo compra o inventario inicial)
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
                  <p className="text-xs leading-tight">
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
                  <span className="text-xs text-muted-foreground font-mono">
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
                            <TableCell className="font-mono text-muted-foreground py-2 text-xs">
                              {rec.fecha}
                            </TableCell>
                            <TableCell className="py-2">
                              <span className="font-medium text-foreground block">{rec.productoNombre}</span>
                              <span className="text-xs text-muted-foreground font-mono">{rec.sku}</span>
                            </TableCell>
                            <TableCell className="py-2 text-center font-semibold font-mono text-success-text tabular-nums">
                              +{rec.cantidad}
                            </TableCell>
                            <TableCell className="py-2 text-xs">
                              <span className="font-medium text-foreground block">{rec.referencia}</span>
                              <span className="text-xs text-muted-foreground">Por: {rec.usuario}</span>
                            </TableCell>
                            <TableCell className="py-2 text-muted-foreground text-xs">
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
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 space-y-4">
              {/* Barra de Filtros y Búsqueda en 2 filas limpias para evitar deformación */}
              <div className="flex flex-col gap-3">
                {/* Fila 1: Buscador y Selector de Sede */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar producto, SKU o comprobante…"
                      value={kardexSearch}
                      onChange={(e) => setKardexSearch(e.target.value)}
                      className="pl-9 h-9 text-sm w-full"
                    />
                  </div>

                  <div className="w-full sm:w-56 shrink-0">
                    <Select value={kardexAlmacenFiltro} onValueChange={setKardexAlmacenFiltro}>
                      <SelectTrigger className="h-9 text-xs w-full">
                        <SelectValue placeholder="Filtrar por sede" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS" className="text-xs">Todas las sedes</SelectItem>
                        {almacenes.map((alm) => (
                          <SelectItem key={alm.id} value={alm.nombre} className="text-xs">
                            {alm.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fila 2: Segmentación por Tipo, Limpiar y Conteo */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { key: 'TODOS', label: 'Todos' },
                      { key: 'ENTRADA', label: 'Entradas' },
                      { key: 'SALIDA', label: 'Salidas' },
                      { key: 'AJUSTE', label: 'Ajustes' },
                    ].map((tipo) => (
                      <button
                        key={tipo.key}
                        onClick={() => setKardexTipoFiltro(tipo.key)}
                        className={cn(
                          'px-3 py-1 text-xs rounded-md border transition-colors cursor-pointer select-none whitespace-nowrap shrink-0',
                          kardexTipoFiltro === tipo.key
                            ? 'bg-primary text-primary-foreground border-primary font-semibold'
                            : 'bg-card text-muted-foreground border-border hover:bg-muted/40 font-medium'
                        )}
                      >
                        {tipo.label}
                      </button>
                    ))}

                    {hayFiltrosKardexActivos && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetKardexFilters}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 ml-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Limpiar filtros
                      </Button>
                    )}
                  </div>

                  <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-auto">
                    Mostrando <strong className="text-foreground font-semibold">{filteredKardex.length}</strong> movimientos
                  </span>
                </div>
              </div>

              {/* Vista para Pantallas Grandes (Escritorio): Tabla Completa con min-width */}
              <div className="hidden lg:block overflow-x-auto rounded-md border border-border bg-card">
                <Table className="min-w-table">
                  <TableHeader>
                    <TableRow className="bg-muted/40 border-b border-border hover:bg-transparent">
                      <TableHead className="text-xs font-semibold py-3 px-3 whitespace-nowrap w-36">
                        Fecha y hora
                      </TableHead>
                      <TableHead className="text-xs font-semibold py-3 px-3 whitespace-nowrap w-28">
                        Tipo
                      </TableHead>
                      <TableHead className="text-xs font-semibold py-3 px-3 whitespace-nowrap">
                        Producto / Código
                      </TableHead>
                      <TableHead className="text-xs font-semibold py-3 px-3 whitespace-nowrap w-44">
                        Sede / Almacén
                      </TableHead>
                      <TableHead className="text-xs font-semibold py-3 px-3 text-right whitespace-nowrap w-28">
                        Movimiento
                      </TableHead>
                      <TableHead className="text-xs font-semibold py-3 px-3 text-right whitespace-nowrap w-28">
                        Saldo stock
                      </TableHead>
                      <TableHead className="text-xs font-semibold py-3 px-3 whitespace-nowrap w-48">
                        Comprobante / Origen
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={`skel-row-${i}`} className="border-b border-border">
                          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell className="px-3 py-3"><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-32" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredKardex.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-40 text-center">
                          <div className="flex flex-col items-center justify-center gap-2 py-4">
                            <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
                              <PackageSearch className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              No se encontraron movimientos registrados
                            </p>
                            <p className="text-xs text-muted-foreground max-w-sm">
                              {hayFiltrosKardexActivos
                                ? 'Prueba ajustando los filtros o el texto de búsqueda.'
                                : 'Aún no se han generado movimientos en el kardex físico.'}
                            </p>
                            {hayFiltrosKardexActivos && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={resetKardexFilters}
                                className="mt-2 text-xs"
                              >
                                Restablecer filtros
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredKardex.map((mov) => {
                        const isEntrada = mov.tipo === 'ENTRADA';
                        const isSalida = mov.tipo === 'SALIDA';

                        return (
                          <TableRow
                            key={mov.id}
                            className="border-b border-border hover:bg-muted/30 transition-colors"
                          >
                            <TableCell className="text-xs text-muted-foreground font-mono py-3 px-3 whitespace-nowrap">
                              {formatDateTime(mov.fecha)}
                            </TableCell>

                            <TableCell className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                {isEntrada ? (
                                  <ArrowDownRight className="h-3.5 w-3.5 text-success-text shrink-0" />
                                ) : isSalida ? (
                                  <ArrowUpRight className="h-3.5 w-3.5 text-danger-text shrink-0" />
                                ) : (
                                  <ArrowLeftRight className="h-3.5 w-3.5 text-warning-text shrink-0" />
                                )}
                                <StatusBadge
                                  status={
                                    mov.tipo === 'ENTRADA'
                                      ? 'Entrada'
                                      : mov.tipo === 'SALIDA'
                                      ? 'Salida'
                                      : 'Ajuste'
                                  }
                                  variant={
                                    isEntrada
                                      ? 'success'
                                      : isSalida
                                      ? 'danger'
                                      : 'warning'
                                  }
                                />
                              </div>
                            </TableCell>

                            <TableCell className="py-3 px-3 whitespace-nowrap">
                              <span className="font-medium text-sm text-foreground block">
                                {mov.productoNombre}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                SKU: {mov.sku}
                              </span>
                            </TableCell>

                            <TableCell className="text-xs text-foreground py-3 px-3 whitespace-nowrap">
                              {mov.almacen}
                            </TableCell>

                            <TableCell className="text-right py-3 px-3 whitespace-nowrap">
                              <span
                                className={cn(
                                  'font-semibold font-mono text-sm tabular-nums',
                                  isEntrada
                                    ? 'text-success-text'
                                    : isSalida
                                    ? 'text-danger-text'
                                    : 'text-warning-text'
                                )}
                              >
                                {isEntrada ? `+${mov.cantidad}` : isSalida ? `-${mov.cantidad}` : mov.cantidad} unid.
                              </span>
                            </TableCell>

                            <TableCell className="text-right font-medium font-mono text-xs text-foreground py-3 px-3 tabular-nums whitespace-nowrap">
                              {mov.stockResultante.toLocaleString('es-PE')} unid.
                            </TableCell>

                            <TableCell className="py-3 px-3 whitespace-nowrap">
                              <span className="text-xs font-medium text-foreground block">
                                {mov.referencia}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Resp.: {mov.usuario}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Vista para Móviles y Pantallas Angostas (< lg): Tarjetas Compactas */}
              <div className="block lg:hidden space-y-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={`skel-card-${i}`} className="p-4 border-border space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </Card>
                  ))
                ) : filteredKardex.length === 0 ? (
                  <Card className="border-border p-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
                        <PackageSearch className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        No se encontraron movimientos registrados
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {hayFiltrosKardexActivos
                          ? 'Prueba ajustando los filtros o el texto de búsqueda.'
                          : 'Aún no se han generado movimientos en el kardex físico.'}
                      </p>
                      {hayFiltrosKardexActivos && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetKardexFilters}
                          className="mt-2 text-xs"
                        >
                          Restablecer filtros
                        </Button>
                      )}
                    </div>
                  </Card>
                ) : (
                  filteredKardex.map((mov) => {
                    const isEntrada = mov.tipo === 'ENTRADA';
                    const isSalida = mov.tipo === 'SALIDA';

                    return (
                      <Card key={`card-${mov.id}`} className="border-border bg-card shadow-2xs">
                        <CardContent className="p-3.5 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-sm text-foreground truncate">
                                {mov.productoNombre}
                              </h4>
                              <p className="text-xs text-muted-foreground font-mono">
                                SKU: {mov.sku}
                              </p>
                            </div>
                            <StatusBadge
                              status={
                                mov.tipo === 'ENTRADA'
                                  ? 'Entrada'
                                  : mov.tipo === 'SALIDA'
                                  ? 'Salida'
                                  : 'Ajuste'
                              }
                              variant={
                                isEntrada
                                  ? 'success'
                                  : isSalida
                                  ? 'danger'
                                  : 'warning'
                              }
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs py-2 px-2.5 rounded bg-muted/30 border border-border/50">
                            <div>
                              <span className="text-muted-foreground block text-xs">Movimiento</span>
                              <span
                                className={cn(
                                  'font-semibold font-mono text-sm tabular-nums',
                                  isEntrada
                                    ? 'text-success-text'
                                    : isSalida
                                    ? 'text-danger-text'
                                    : 'text-warning-text'
                                )}
                              >
                                {isEntrada ? `+${mov.cantidad}` : isSalida ? `-${mov.cantidad}` : mov.cantidad} unid.
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs">Saldo en almacén</span>
                              <span className="font-semibold font-mono text-sm text-foreground tabular-nums">
                                {mov.stockResultante.toLocaleString('es-PE')} unid.
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs text-muted-foreground pt-1 border-t border-border/40">
                            <div className="flex items-center justify-between">
                              <span>Sede: <strong className="text-foreground font-medium">{mov.almacen}</strong></span>
                              <span className="font-mono text-xs">{formatDateTime(mov.fecha)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="truncate">Ref.: {mov.referencia}</span>
                              <span className="text-xs">Resp.: {mov.usuario}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
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
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={`alm-skel-${i}`} className="border-border bg-card shadow-sm p-5 space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </Card>
              ))
            ) : almacenes.length === 0 ? (
              <Card className="col-span-2 border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">No hay almacenes configurados en el sistema.</p>
              </Card>
            ) : (
              almacenes.map((alm) => (
                <Card key={alm.id} className="border-border bg-card shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary-soft text-primary">
                          <Warehouse className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-base text-foreground">{alm.nombre}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {alm.direccion}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status="Operativo" variant="success" />
                    </div>

                    {alm.responsable && (
                      <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-md">
                        <span className="font-medium text-foreground">Responsable: </span>
                        {alm.responsable}
                      </div>
                    )}

                    {alm.zonas && (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground font-medium block">
                          Zonas / Estanterías organizadas:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {alm.zonas.map((zona) => (
                            <span
                              key={zona}
                              className="text-xs px-2 py-0.5 rounded bg-card border border-border text-foreground font-mono"
                            >
                              {zona}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                      <div className="p-3 rounded-md bg-muted/40">
                        <span className="text-xs text-muted-foreground block">Variedad de artículos</span>
                        <span className="text-lg font-semibold text-foreground tabular-nums">
                          {alm.totalProductos} SKUs
                        </span>
                      </div>
                      <div className="p-3 rounded-md bg-muted/40">
                        <span className="text-xs text-muted-foreground block">Existencias físicas</span>
                        <span className="text-lg font-semibold text-primary tabular-nums">
                          {alm.stockTotalUnidades.toLocaleString('es-PE')} unid.
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setKardexAlmacenFiltro(alm.nombre);
                          setTabActiva('kardex');
                        }}
                        className="text-xs h-8"
                      >
                        Ver movimientos de esta sede
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
        almacenes={almacenes}
      />
    </div>
  );
};

export default InventarioPage;
