import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SummaryCard } from '../components/SummaryCard';
import { FilterBar } from '../components/FilterBar';
import { InventoryTable } from '../components/InventoryTable';
import { ProductInventoryDetail } from '../components/ProductInventoryDetail';
import { MovementTable } from '../components/MovementTable';
import { AdjustmentTable } from '../components/AdjustmentTable';
import { AdjustmentForm } from '../components/AdjustmentForm';
import { PhysicalInventoryTable } from '../components/PhysicalInventoryTable';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { inventarioService } from '../services/inventarioService';
import {
  ItemStockDetalle,
  MovimientoStock,
  AjusteInventario,
  AlmacenResumen,
  NuevoAjustePayload,
} from '../types/inventario.types';
import { subscribeToErp } from '@/services/erp/erpStore';
import { formatCurrency } from '@/utils/formatters';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

type SeccionInventario = 'existencias' | 'entradas-salidas' | 'ajustes' | 'inventario-fisico';

/**
 * Módulo de INVENTARIO de KIPU'S ERP.
 * Centro de control del stock estructurado en 4 áreas esenciales:
 * 1. Existencias
 * 2. Entradas y salidas
 * 3. Ajustes
 * 4. Inventario físico
 */
export const InventarioPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados de datos
  const [productos, setProductos] = useState<ItemStockDetalle[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [ajustes, setAjustes] = useState<AjusteInventario[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sección activa (controlada eficientemente por URL y estado sincronizado)
  const tabParam = searchParams.get('tab');
  const getSeccionValida = (tab: string | null): SeccionInventario =>
    tab && ['existencias', 'entradas-salidas', 'ajustes', 'inventario-fisico'].includes(tab)
      ? (tab as SeccionInventario)
      : 'existencias';

  const [seccionActiva, setSeccionActiva] = useState<SeccionInventario>(() => getSeccionValida(tabParam));

  // Sincronizar estado cuando cambia URL param por botones de historial
  useEffect(() => {
    const valid = getSeccionValida(tabParam);
    if (valid !== seccionActiva) {
      setSeccionActiva(valid);
    }
  }, [tabParam]);

  // Cambio de pestaña instantáneo: sin recargas de página, sin retrasos y sin ensuciar el historial
  const handleTabChange = (value: string) => {
    const nuevaSeccion = value as SeccionInventario;
    setSeccionActiva(nuevaSeccion);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nuevaSeccion === 'existencias') {
          next.delete('tab');
        } else {
          next.set('tab', nuevaSeccion);
        }
        return next;
      },
      { replace: true }
    );
  };

  // Modales
  const [productoSeleccionado, setProductoSeleccionado] = useState<ItemStockDetalle | null>(null);
  const [openDetalleModal, setOpenDetalleModal] = useState(false);
  const [openAjusteModal, setOpenAjusteModal] = useState(false);

  // Filtro de búsqueda cruzada para Entradas y Salidas
  const [filtroMovimientosProducto, setFiltroMovimientosProducto] = useState<string>('');

  // Filtros de la pantalla de Existencias
  const [busquedaExistencias, setBusquedaExistencias] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [almacenFiltro, setAlmacenFiltro] = useState('TODOS');

  // Carga de datos unificada: sólo muestra esqueleto en la primera carga para evitar parpadeos
  const cargarDatos = async (isInitial: boolean = false) => {
    if (isInitial) {
      setLoading(true);
    }
    setError(null);
    try {
      const [prodsData, movsData, ajustesData, almacenesData] = await Promise.all([
        inventarioService.getProductosStock(),
        inventarioService.getMovimientos(),
        inventarioService.getAjustes(),
        inventarioService.getAlmacenes(),
      ]);
      setProductos(prodsData || []);
      setMovimientos(movsData || []);
      setAjustes(ajustesData || []);
      setAlmacenes(almacenesData || []);
    } catch {
      setError('No se pudo cargar la información del inventario. Revisa tu conexión a internet.');
      toast.error('Error al sincronizar inventario');
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    cargarDatos(true);
    const unsubscribe = subscribeToErp(() => {
      cargarDatos(false);
    });
    return unsubscribe;
  }, []);

  // Lista de categorías únicas para los filtros
  const categorias = useMemo(() => {
    return Array.from(new Set(productos.map((p) => p.categoria))).filter(Boolean);
  }, [productos]);

  // Indicadores superiores (Sección 3)
  const metricas = useMemo(() => {
    const total = productos.length;
    const stockBajo = productos.filter((p) => p.estadoNivel === 'STOCK_BAJO').length;
    const agotados = productos.filter((p) => p.estadoNivel === 'AGOTADO').length;
    const valorAprox = productos.reduce((acc, p) => acc + p.valorizadoCosto, 0);

    return {
      total,
      stockBajo,
      agotados,
      valorAprox,
    };
  }, [productos]);

  // Filtrado de la tabla de Existencias
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchBusqueda =
        p.nombre.toLowerCase().includes(busquedaExistencias.toLowerCase()) ||
        p.sku.toLowerCase().includes(busquedaExistencias.toLowerCase());

      const matchCategoria =
        categoriaFiltro === 'TODAS' || p.categoria === categoriaFiltro;

      const matchEstado =
        estadoFiltro === 'TODOS' || p.estadoNivel === estadoFiltro;

      const matchAlmacen =
        almacenFiltro === 'TODOS' || (p.almacen && p.almacen.includes(almacenFiltro));

      return matchBusqueda && matchCategoria && matchEstado && matchAlmacen;
    });
  }, [productos, busquedaExistencias, categoriaFiltro, estadoFiltro, almacenFiltro]);

  const hayFiltrosExistenciasActivos =
    busquedaExistencias !== '' ||
    categoriaFiltro !== 'TODAS' ||
    estadoFiltro !== 'TODOS' ||
    almacenFiltro !== 'TODOS';

  const resetFiltrosExistencias = () => {
    setBusquedaExistencias('');
    setCategoriaFiltro('TODAS');
    setEstadoFiltro('TODOS');
    setAlmacenFiltro('TODOS');
  };

  // Ver detalle de producto
  const handleVerDetalle = (prod: ItemStockDetalle) => {
    setProductoSeleccionado(prod);
    setOpenDetalleModal(true);
  };

  // Navegación fluida: de Detalle de Producto a Entradas y Salidas
  const handleIrAEntradasSalidas = (sku: string, _nombre: string) => {
    setFiltroMovimientosProducto(sku);
    handleTabChange('entradas-salidas');
  };

  // Registrar nuevo ajuste individual
  const handleGuardarAjuste = async (payload: NuevoAjustePayload) => {
    await inventarioService.registrarAjuste(payload);
    await cargarDatos();
  };

  // Aplicar ajustes masivos de inventario físico
  const handleAplicarAjustesFisicos = async (
    items: { productoId: string; stockFisico: number; motivo?: string }[]
  ) => {
    await inventarioService.aplicarAjustesFisicos(items);
    await cargarDatos();
  };

  // Movimientos filtrados para el modal de detalle del producto seleccionado
  const movimientosDelProductoSeleccionado = useMemo(() => {
    if (!productoSeleccionado) return [];
    return movimientos.filter(
      (m) =>
        m.sku === productoSeleccionado.sku ||
        m.productoNombre === productoSeleccionado.nombre
    );
  }, [movimientos, productoSeleccionado]);

  return (
    <div className="space-y-5">
      {/* Encabezado Principal según sección 3 */}
      <PageHeader
        title="Inventario"
        description="Consulta y controla el stock de tus productos."
      >
        {seccionActiva === 'ajustes' && (
          <Button
            type="button"
            size="sm"
            onClick={() => setOpenAjusteModal(true)}
            className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo ajuste</span>
          </Button>
        )}
      </PageHeader>

      {/* Indicadores Superiores Discretos (Sección 3) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Total de productos"
          value={metricas.total}
          description="registrados en catálogo"
        />
        <SummaryCard
          label="Stock bajo"
          value={metricas.stockBajo}
          description={metricas.stockBajo > 0 ? 'requieren reposición' : 'niveles estables'}
          variant={metricas.stockBajo > 0 ? 'warning' : 'default'}
        />
        <SummaryCard
          label="Agotados"
          value={metricas.agotados}
          description={metricas.agotados > 0 ? 'sin unidades disponibles' : 'ninguno agotado'}
          variant={metricas.agotados > 0 ? 'danger' : 'default'}
        />
        <SummaryCard
          label="Valor aprox. del inventario"
          value={formatCurrency(metricas.valorAprox)}
          description="calculado al costo de compra"
        />
      </div>

      {/* Pestañas de Navegación del Módulo: Únicamente las 4 requeridas */}
      <Tabs value={seccionActiva} onValueChange={handleTabChange} className="w-full space-y-4">
        <div className="border-b border-border">
          <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2 justify-start border-none">
            <TabsTrigger
              value="existencias"
              className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs sm:text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              Existencias
            </TabsTrigger>
            <TabsTrigger
              value="entradas-salidas"
              className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs sm:text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              Entradas y salidas
            </TabsTrigger>
            <TabsTrigger
              value="ajustes"
              className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs sm:text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              Ajustes
            </TabsTrigger>
            <TabsTrigger
              value="inventario-fisico"
              className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs sm:text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              Inventario físico
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Estado de Error */}
        {error && (
          <ErrorState message={error} onRetry={cargarDatos} className="mt-2" />
        )}

        {/* Estado de Carga */}
        {loading && !error && <LoadingState rows={6} hasCards={false} />}

        {/* ========================================================================= */}
        {/* SECCIÓN 1: EXISTENCIAS (Pantalla Principal)                               */}
        {/* ========================================================================= */}
        {!loading && !error && (
          <TabsContent value="existencias" className="space-y-4 m-0 focus-visible:outline-none">
            <ErrorBoundary moduleName="Catálogo de Existencias">
              {/* Barra de Filtros */}
              <FilterBar
                busqueda={busquedaExistencias}
                onBusquedaChange={setBusquedaExistencias}
                categoria={categoriaFiltro}
                onCategoriaChange={setCategoriaFiltro}
                categorias={categorias}
                estado={estadoFiltro}
                onEstadoChange={setEstadoFiltro}
                almacen={almacenFiltro}
                onAlmacenChange={setAlmacenFiltro}
                almacenes={almacenes}
                onResetFilters={resetFiltrosExistencias}
                hayFiltrosActivos={hayFiltrosExistenciasActivos}
                totalResultados={productosFiltrados.length}
              />

              {/* Tabla de Existencias */}
              <InventoryTable
                productos={productosFiltrados}
                onVerDetalle={handleVerDetalle}
                onResetFilters={resetFiltrosExistencias}
                isFiltered={hayFiltrosExistenciasActivos}
              />
            </ErrorBoundary>
          </TabsContent>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN 2: ENTRADAS Y SALIDAS                                             */}
        {/* ========================================================================= */}
        {!loading && !error && (
          <TabsContent value="entradas-salidas" className="space-y-4 m-0 focus-visible:outline-none">
            <ErrorBoundary moduleName="Entradas y Salidas">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">Entradas y salidas</h2>
                <p className="text-xs text-muted-foreground">
                  Consulta cómo ha cambiado el stock de tus productos a partir de compras, ventas y ajustes.
                </p>
              </div>

              <MovementTable
                movimientos={movimientos}
                initialSearch={filtroMovimientosProducto}
                onClearInitialSearch={() => setFiltroMovimientosProducto('')}
              />
            </ErrorBoundary>
          </TabsContent>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN 3: AJUSTES DE INVENTARIO                                          */}
        {/* ========================================================================= */}
        {!loading && !error && (
          <TabsContent value="ajustes" className="space-y-4 m-0 focus-visible:outline-none">
            <ErrorBoundary moduleName="Ajustes de Inventario">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-foreground">Ajustes de inventario</h2>
                  <p className="text-xs text-muted-foreground">
                    Corrige diferencias entre el stock registrado y el stock real por mermas, vencimientos o recuentos.
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => setOpenAjusteModal(true)}
                  className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground self-start sm:self-auto shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nuevo ajuste</span>
                </Button>
              </div>

              <AdjustmentTable
                ajustes={ajustes}
                onNuevoAjuste={() => setOpenAjusteModal(true)}
              />
            </ErrorBoundary>
          </TabsContent>
        )}

        {/* ========================================================================= */}
        {/* SECCIÓN 4: INVENTARIO FÍSICO                                              */}
        {/* ========================================================================= */}
        {!loading && !error && (
          <TabsContent value="inventario-fisico" className="space-y-4 m-0 focus-visible:outline-none">
            <ErrorBoundary moduleName="Inventario Físico">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">Inventario físico</h2>
                <p className="text-xs text-muted-foreground">
                  Compara el stock registrado con la cantidad real disponible ingresando el conteo de cada producto.
                </p>
              </div>

              <PhysicalInventoryTable
                productos={productos}
                almacenes={almacenes}
                onAplicarAjustes={handleAplicarAjustesFisicos}
              />
            </ErrorBoundary>
          </TabsContent>
        )}
      </Tabs>

      {/* Modal: Detalle de Producto con Últimas Entradas y Salidas */}
      <ProductInventoryDetail
        open={openDetalleModal}
        onOpenChange={setOpenDetalleModal}
        producto={productoSeleccionado}
        movimientosProducto={movimientosDelProductoSeleccionado}
        onIrAEntradasSalidas={handleIrAEntradasSalidas}
      />

      {/* Modal: Formulario de Nuevo Ajuste con Confirmación de 2 Fases */}
      <AdjustmentForm
        open={openAjusteModal}
        onOpenChange={setOpenAjusteModal}
        productos={productos}
        onGuardarAjuste={handleGuardarAjuste}
        productoInicialId={productoSeleccionado?.id}
      />
    </div>
  );
};

export default InventarioPage;
