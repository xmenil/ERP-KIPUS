import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Store,
  Building2,
  Users,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Key,
  PowerOff,
  Power,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { superAdminService } from '../services/superAdminService';
import {
  TiendaItem,
  SuperAdminMetricas,
  CrearTiendaPayload,
  UpdateTiendaPayload,
} from '../types/superAdmin.types';
import { CrearTiendaModal } from '../components/CrearTiendaModal';
import { EditarTiendaModal } from '../components/EditarTiendaModal';
import { CambiarPasswordModal } from '../components/CambiarPasswordModal';

export const SuperAdminPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'tiendas';

  const [tiendas, setTiendas] = useState<TiendaItem[]>([]);
  const [metricas, setMetricas] = useState<SuperAdminMetricas>({
    totalTiendas: 0,
    tiendasActivas: 0,
    tiendasSuspendidas: 0,
    totalUsuarios: 0,
    totalVentasGlobal: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'TODAS' | 'ACTIVO' | 'SUSPENDIDO'>('TODAS');

  // Modals state
  const [isCrearModalOpen, setIsCrearModalOpen] = useState(false);
  const [selectedTiendaToEdit, setSelectedTiendaToEdit] = useState<TiendaItem | null>(null);
  const [selectedTiendaForPassword, setSelectedTiendaForPassword] = useState<TiendaItem | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tiendasRes, metricasRes] = await Promise.all([
        superAdminService.getTiendas(),
        superAdminService.getMetricas(),
      ]);
      setTiendas(tiendasRes);
      setMetricas(metricasRes);
    } catch {
      toast.error('No se pudieron sincronizar las tiendas con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCrearTienda = async (payload: CrearTiendaPayload) => {
    await superAdminService.createTienda(payload);
    await fetchData();
  };

  const handleEditarTienda = async (id: string, payload: UpdateTiendaPayload) => {
    await superAdminService.updateTienda(id, payload);
    await fetchData();
  };

  const handleCambiarPassword = async (id: string, newPassword: string) => {
    await superAdminService.cambiarPasswordDueno(id, newPassword);
    await fetchData();
  };

  const handleToggleEstado = async (tienda: TiendaItem) => {
    const nuevoEstado = tienda.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
    const actionLabel = nuevoEstado === 'SUSPENDIDO' ? 'suspender' : 'reactivar';

    if (
      !window.confirm(
        `¿Confirmas que deseas ${actionLabel} la tienda "${tienda.nombreComercial}"?\n${
          nuevoEstado === 'SUSPENDIDO'
            ? 'Los usuarios y el dueño de esta tienda no podrán iniciar sesión hasta que sea reactivada.'
            : 'El dueño y el personal de esta tienda podrán volver a acceder al sistema.'
        }`
      )
    ) {
      return;
    }

    try {
      await superAdminService.cambiarEstado(tienda.id, nuevoEstado);
      toast.success(
        `Tienda "${tienda.nombreComercial}" ha sido ${
          nuevoEstado === 'SUSPENDIDO' ? 'suspendida temporalmente' : 'reactivada exitosamente'
        }.`
      );
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Error al cambiar estado de la tienda');
    }
  };

  // Filtrado de tiendas
  const filteredTiendas = useMemo(() => {
    return tiendas.filter((tienda) => {
      const matchEstado = estadoFilter === 'TODAS' || tienda.estado === estadoFilter;
      if (!matchEstado) return false;

      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const matchNombre = tienda.nombreComercial.toLowerCase().includes(term);
      const matchRazon = tienda.razonSocial.toLowerCase().includes(term);
      const matchRuc = tienda.ruc.toLowerCase().includes(term);
      const matchDueno = tienda.dueno?.nombreCompleto.toLowerCase().includes(term);
      const matchUser = tienda.dueno?.username.toLowerCase().includes(term);

      return matchNombre || matchRazon || matchRuc || matchDueno || matchUser;
    });
  }, [tiendas, estadoFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* ENCABEZADO DE PÁGINA */}
      <PageHeader
        title="Panel Super Administrador"
        description="Gestión global de tiendas, comercios adheridos, propietarios y políticas de suspensión de la plataforma."
        badge="SUPER ADMIN"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="h-9 gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
        <Button
          size="sm"
          onClick={() => setIsCrearModalOpen(true)}
          className="h-9 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Nueva Tienda
        </Button>
      </PageHeader>

      {/* TARJETAS DE MÉTRICAS GLOBALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tiendas */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Tiendas
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Store className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metricas.totalTiendas}</div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span>Organizaciones registradas en la red</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Tiendas Activas */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Tiendas Activas
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metricas.tiendasActivas}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Operando con acceso habilitado
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Tiendas Suspendidas */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Suspendidas
            </CardTitle>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {metricas.tiendasSuspendidas}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Bloqueadas de iniciar sesión
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Total Usuarios */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Usuarios en Plataforma
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{metricas.totalUsuarios}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Dueños, cajeros y almaceneros
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PESTAÑAS / TABS DE NAVEGACIÓN */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'tiendas' })}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            currentTab === 'tiendas'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Directorio de Tiendas ({tiendas.length})
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'metricas' })}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            currentTab === 'metricas'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Resumen de la Red
        </button>
      </div>

      {/* CONTENIDO SEGÚN TAB */}
      {currentTab === 'tiendas' && (
        <div className="space-y-4">
          {/* BARRA DE BÚSQUEDA Y FILTROS */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, RUC, dueño o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-8 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-xs text-muted-foreground font-medium">Estado:</span>
              <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/30">
                {(['TODAS', 'ACTIVO', 'SUSPENDIDO'] as const).map((est) => (
                  <button
                    key={est}
                    type="button"
                    onClick={() => setEstadoFilter(est)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-sm transition-all ${
                      estadoFilter === est
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {est === 'TODAS' ? 'Todas' : est === 'ACTIVO' ? 'Activas' : 'Suspendidas'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TABLA PRINCIPAL DE TIENDAS */}
          <Card className="border-border/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                      Tienda / Razón Social
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                      Dueño / Administrador
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground text-center">
                      Sucursales / Cajas
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground text-center">
                      Usuarios Locales
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground text-center">
                      Estado
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground text-right pr-4">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTiendas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                            <span>Cargando tiendas...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1">
                            <Store className="w-6 h-6 text-muted-foreground/60 mb-1" />
                            <p className="font-medium text-foreground">No se encontraron tiendas</p>
                            <p className="text-[11px]">Intenta modificar el término de búsqueda o registra una nueva tienda.</p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTiendas.map((tienda) => {
                      const isActivo = tienda.estado === 'ACTIVO';
                      return (
                        <TableRow
                          key={tienda.id}
                          className={`hover:bg-muted/30 transition-colors ${
                            !isActivo ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                          }`}
                        >
                          {/* Columna 1: Tienda */}
                          <TableCell className="py-3">
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                                  isActivo
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                <Store className="w-4 h-4" />
                              </div>
                              <div className="space-y-0.5">
                                <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                                  <span>{tienda.nombreComercial}</span>
                                  {!isActivo && (
                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/50 dark:text-rose-300 px-1.5 py-0.2 rounded">
                                      SUSPENDIDA
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                                  {tienda.razonSocial}
                                </div>
                                <div className="flex items-center gap-2 pt-0.5">
                                  <Badge
                                    variant="outline"
                                    className="font-mono text-[10px] px-1.5 py-0 bg-muted/40"
                                  >
                                    RUC: {tienda.ruc}
                                  </Badge>
                                  {tienda.telefono && (
                                    <span className="text-[10px] text-muted-foreground">
                                      Telf: {tienda.telefono}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Columna 2: Dueño */}
                          <TableCell className="py-3">
                            {tienda.dueno ? (
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold text-foreground">
                                  {tienda.dueno.nombreCompleto}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <span className="font-mono text-primary font-medium">
                                    @{tienda.dueno.username}
                                  </span>
                                  <span>•</span>
                                  <span>{tienda.dueno.email}</span>
                                </div>
                                {tienda.dueno.telefono && (
                                  <div className="text-[10px] text-muted-foreground">
                                    Móvil: {tienda.dueno.telefono}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                Sin dueño registrado
                              </span>
                            )}
                          </TableCell>

                          {/* Columna 3: Sucursales y Cajas */}
                          <TableCell className="py-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-xs font-semibold text-foreground">
                                {tienda.totalSucursales || 1} sucursal(es)
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {tienda.totalCajas || 1} caja(s) POS
                              </span>
                            </div>
                          </TableCell>

                          {/* Columna 4: Usuarios */}
                          <TableCell className="py-3 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-xs font-semibold text-foreground">
                                {tienda.totalUsuarios || 1} usuario(s)
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Creados por el dueño
                              </span>
                            </div>
                          </TableCell>

                          {/* Columna 5: Estado */}
                          <TableCell className="py-3 text-center">
                            {isActivo ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                ACTIVO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                SUSPENDIDO
                              </span>
                            )}
                          </TableCell>

                          {/* Columna 6: Acciones */}
                          <TableCell className="py-3 text-right pr-4">
                            <div className="flex items-center justify-end gap-1">
                              {/* Botón Suspender / Reactivar */}
                              <Button
                                variant={isActivo ? 'outline' : 'default'}
                                size="sm"
                                onClick={() => handleToggleEstado(tienda)}
                                title={isActivo ? 'Suspender Tienda' : 'Reactivar Tienda'}
                                className={`h-8 px-2.5 text-xs gap-1 ${
                                  isActivo
                                    ? 'hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 hover:border-rose-300'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                              >
                                {isActivo ? (
                                  <>
                                    <PowerOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                    <span className="hidden md:inline">Suspender</span>
                                  </>
                                ) : (
                                  <>
                                    <Power className="w-3.5 h-3.5" />
                                    <span className="hidden md:inline">Reactivar</span>
                                  </>
                                )}
                              </Button>

                              {/* Botón Editar */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTiendaToEdit(tienda)}
                                title="Editar datos de la tienda"
                                className="h-8 px-2 text-xs"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>

                              {/* Botón Cambiar Contraseña del Dueño */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTiendaForPassword(tienda)}
                                title="Restablecer contraseña del dueño"
                                className="h-8 px-2 text-xs hover:border-amber-400 hover:text-amber-600"
                              >
                                <Key className="w-3.5 h-3.5" />
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
          </Card>
        </div>
      )}

      {/* PESTAÑA: MÉTRICAS DE LA RED */}
      {currentTab === 'metricas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/80 shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                Arquitectura Multi-Tienda KIPU'S ERP
              </CardTitle>
              <CardDescription className="text-xs">
                Resumen de aislamiento y flujo operativo entre Super Admin y Tiendas locales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  1. Rol Super Administrador (Tú)
                </div>
                <p>
                  Gobierna la plataforma completa. Puede dar de alta nuevas tiendas, suspender comercios por falta de pago o auditoría, y recuperar contraseñas de los dueños.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  2. Rol Dueño / Administrador de Tienda
                </div>
                <p>
                  Al ingresar con sus credenciales creadas aquí, el dueño tiene autonomía completa sobre su negocio: configura sus comprobantes SUNAT, maneja su inventario y registra a sus propios cajeros y almaceneros desde <strong>Administración &gt; Usuarios y Roles</strong>.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  3. Efecto de Suspensión Inmediata
                </div>
                <p>
                  Cuando suspendes una tienda, tanto el dueño como todos sus cajeros y almaceneros quedan inmediatamente bloqueados en el login de la aplicación hasta que la reactives.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Estado del Servidor y Base de Datos
              </CardTitle>
              <CardDescription className="text-xs">
                Conexión centralizada Supabase PostgreSQL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                <span className="text-muted-foreground font-medium">Base de Datos Central:</span>
                <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Supabase PostgreSQL (En Línea)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                <span className="text-muted-foreground font-medium">Backend REST NestJS:</span>
                <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  /api/v1/super-admin
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                <span className="text-muted-foreground font-medium">Total Ventas Registradas (Global):</span>
                <span className="font-semibold text-foreground text-sm">
                  S/ {metricas.totalVentasGlobal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                <span className="text-muted-foreground font-medium">Políticas de Acceso Multi-tenant:</span>
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                  Aislamiento por Empresa &amp; Sucursal
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVA TIENDA */}
      <CrearTiendaModal
        open={isCrearModalOpen}
        onOpenChange={setIsCrearModalOpen}
        onSubmit={handleCrearTienda}
      />

      {/* MODAL: EDITAR TIENDA */}
      <EditarTiendaModal
        open={Boolean(selectedTiendaToEdit)}
        onOpenChange={(open) => !open && setSelectedTiendaToEdit(null)}
        tienda={selectedTiendaToEdit}
        onSubmit={handleEditarTienda}
      />

      {/* MODAL: RESTABLECER CONTRASEÑA */}
      <CambiarPasswordModal
        open={Boolean(selectedTiendaForPassword)}
        onOpenChange={(open) => !open && setSelectedTiendaForPassword(null)}
        tienda={selectedTiendaForPassword}
        onSubmit={handleCambiarPassword}
      />
    </div>
  );
};

export default SuperAdminPage;
