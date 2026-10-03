import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/common/StatusBadge';
import { MetricCard } from '@/components/common/MetricCard';
import { NuevoMovimientoDialog } from '../components/NuevoMovimientoDialog';
import { inventarioService } from '../services/inventarioService';
import {
  MovimientoKardex,
  AlmacenResumen,
  NuevoMovimientoPayload,
} from '../types/inventario.types';
import { subscribeToErp } from '@/services/erp/erpStore';
import {
  Warehouse,
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

export const InventarioPage: React.FC = () => {
  const [movimientos, setMovimientos] = useState<MovimientoKardex[]>([]);
  const [almacenes, setAlmacenes] = useState<AlmacenResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kardexData, almacenesData] = await Promise.all([
        inventarioService.getMovimientosKardex(),
        inventarioService.getAlmacenes(),
      ]);
      setMovimientos(kardexData);
      setAlmacenes(almacenesData);
    } catch {
      toast.error('Error al cargar datos de inventario');
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

  const handleCrearMovimiento = async (payload: NuevoMovimientoPayload) => {
    try {
      const nuevo = await inventarioService.registrarMovimiento(payload);
      setMovimientos((prev) => [nuevo, ...prev]);
      toast.success(`Movimiento de ${payload.tipo} registrado en Kardex`);
    } catch {
      toast.error('No se pudo registrar el movimiento');
    }
  };

  const [tipoFiltro, setTipoFiltro] = useState<string>('TODOS');

  const filteredMovimientos = movimientos.filter((m) => {
    const matchSearch =
      m.productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.referencia.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = tipoFiltro === 'TODOS' || m.tipo === tipoFiltro;
    return matchSearch && matchTipo;
  });

  const totalEntradas = movimientos.filter((m) => m.tipo === 'ENTRADA').reduce((a, b) => a + b.cantidad, 0);
  const totalSalidas = movimientos.filter((m) => m.tipo === 'SALIDA').reduce((a, b) => a + b.cantidad, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control de Inventario y Kardex"
        description="Seguimiento de entradas, salidas, transferencias y existencias por almacén"
        badge="Multialmacén"
      >
        <Button
          size="sm"
          onClick={() => setOpenModal(true)}
          className="gap-2 bg-primary text-primary-foreground font-semibold shadow-sm"
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span>Registrar Movimiento</span>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Entradas de Mercadería"
          value={`+${totalEntradas} unid.`}
          subtitle="Compras e ingresos a almacén"
          icon={ArrowDownRight}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
        />
        <MetricCard
          title="Salidas por Ventas"
          value={`-${totalSalidas} unid.`}
          subtitle="Despachos y atenciones de mostrador"
          icon={ArrowUpRight}
          iconColor="text-rose-600 bg-rose-50 dark:bg-rose-950/40"
        />
        <MetricCard
          title="Movimientos en Kardex"
          value={`${movimientos.length} reg.`}
          subtitle="Historial de trazabilidad física"
          icon={Boxes}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40"
        />
      </div>

      <Tabs defaultValue="kardex" className="w-full space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="kardex" className="text-xs font-semibold">
            Kardex Físico de Movimientos
          </TabsTrigger>
          <TabsTrigger value="almacenes" className="text-xs font-semibold">
            Sedes y Almacenes Activos
          </TabsTrigger>
        </TabsList>

        {/* Pestaña Kardex */}
        <TabsContent value="kardex" className="space-y-4">
          <Card className="border-border/80">
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por producto, SKU o referencia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                {/* Filtro de tipos de movimiento */}
                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  {['TODOS', 'ENTRADA', 'SALIDA', 'AJUSTE'].map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => setTipoFiltro(tipo)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        tipoFiltro === tipo
                          ? 'bg-primary text-primary-foreground border-primary font-semibold'
                          : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {tipo === 'TODOS' ? 'Todos' : tipo}
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-2 hidden lg:inline">
                    {filteredMovimientos.length} operaciones
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-slate-100/90 dark:bg-slate-800/90 border-b border-border">
                      <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Fecha y Hora</TableHead>
                      <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Tipo</TableHead>
                      <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Producto / SKU</TableHead>
                      <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Almacén</TableHead>
                      <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-center py-2.5">Cantidad</TableHead>
                      <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-center py-2.5">Saldo Stock</TableHead>
                      <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Referencia / Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                          Cargando movimientos de inventario...
                        </TableCell>
                      </TableRow>
                    ) : filteredMovimientos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                          No hay movimientos registrados con los filtros seleccionados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMovimientos.map((mov) => {
                        const isEntrada = mov.tipo === 'ENTRADA';
                        const isSalida = mov.tipo === 'SALIDA';
                        return (
                          <TableRow key={mov.id} className="text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-border/70 transition-colors">
                            <TableCell className="text-muted-foreground font-mono text-xs py-2.5 font-medium">
                              {mov.fecha}
                            </TableCell>
                            <TableCell className="py-2.5">
                              <div className="flex items-center gap-1.5">
                                {isEntrada ? (
                                  <ArrowDownRight className="h-4 w-4 text-emerald-600" />
                                ) : isSalida ? (
                                  <ArrowUpRight className="h-4 w-4 text-rose-600" />
                                ) : (
                                  <ArrowLeftRight className="h-4 w-4 text-amber-600" />
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
                            <TableCell className="text-center font-black font-mono text-[14px] tabular-nums py-2.5">
                              <span className={isEntrada ? 'text-emerald-700 dark:text-emerald-400' : isSalida ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}>
                                {isEntrada ? `+${mov.cantidad}` : isSalida ? `-${mov.cantidad}` : mov.cantidad}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-bold font-mono text-[13px] text-foreground py-2.5 tabular-nums">
                              {mov.stockResultante} unid.
                            </TableCell>
                            <TableCell className="py-2.5">
                              <span className="font-semibold text-foreground block text-xs">{mov.referencia}</span>
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

        {/* Pestaña Almacenes */}
        <TabsContent value="almacenes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {almacenes.map((alm) => (
              <Card key={alm.id} className="border-border/80">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Warehouse className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{alm.nombre}</h4>
                        <p className="text-xs text-muted-foreground">{alm.direccion}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                      Operativo
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <span className="text-[11px] text-muted-foreground block">Variedad de Artículos</span>
                      <span className="text-lg font-bold text-foreground">{alm.totalProductos} SKUs</span>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <span className="text-[11px] text-muted-foreground block">Unidades Físicas</span>
                      <span className="text-lg font-bold text-primary">{alm.stockTotalUnidades} unid.</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <NuevoMovimientoDialog
        open={openModal}
        onOpenChange={setOpenModal}
        onMovimientoCreado={handleCrearMovimiento}
      />
    </div>
  );
};

export default InventarioPage;
