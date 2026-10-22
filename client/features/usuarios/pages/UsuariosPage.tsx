import React, { useState, useEffect, useMemo } from 'react';
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
import { UsuarioFormDialog } from '../components/UsuarioFormDialog';
import { UsuarioDetalleModal } from '../components/UsuarioDetalleModal';
import { usuariosService } from '../services/usuariosService';
import { Usuario, NuevoUsuarioPayload, UserRole } from '../types/usuarios.types';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Building,
  Eye,
  Edit,
  Copy,
  Check,
  LayoutGrid,
  List,
  Sparkles,
  Download,
  Lock,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { QueryError } from '@/components/common/QueryError';

type FiltroTab = 'TODOS' | 'ADMINISTRADOR' | 'CAJERO' | 'SUPERVISOR' | 'ACTIVO' | 'INACTIVO';
type TipoVista = 'TABLA' | 'TARJETAS';

export const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTab, setFiltroTab] = useState<FiltroTab>('TODOS');
  // Iniciar en vista de tarjetas en pantallas móviles para máxima legibilidad, o tabla en desktop
  const [tipoVista, setTipoVista] = useState<TipoVista>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'TARJETAS';
    }
    return 'TABLA';
  });

  // Modales
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState<Usuario | null>(null);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    try {
      const data = await usuariosService.getUsuarios();
      setUsuarios(data);
      setLoadError('');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Revisa el almacenamiento e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Guardar (Crear o Editar)
  const handleGuardarUsuario = async (payload: NuevoUsuarioPayload, id?: string) => {
    try {
      if (id) {
        const actualizado = await usuariosService.actualizarUsuario(id, payload);
        toast.success(`Usuario "${actualizado.nombreCompleto}" actualizado correctamente`);
      } else {
        const nuevo = await usuariosService.crearUsuario(payload);
        toast.success(`Usuario "${nuevo.nombreCompleto}" registrado exitosamente`);
      }
      await fetchUsuarios();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la operación';
      toast.error(msg);
      throw err;
    }
  };

  // Eliminar
  const handleEliminarUsuario = async (user: Usuario) => {
    if (user.id === 'user-admin') {
      toast.error('No se puede eliminar la cuenta de Administrador Principal');
      return;
    }

    const confirmacion = window.confirm(
      `¿Deseas retirar el acceso de "${user.nombreCompleto}" (@${user.username})? Los usuarios demo se desactivan para evitar que vuelvan a aparecer activos.`
    );
    if (!confirmacion) return;

    try {
      await usuariosService.eliminarUsuario(user.id);
      toast.success(`Usuario "${user.nombreCompleto}" eliminado del sistema`);
      if (detalleModalOpen && usuarioSeleccionado?.id === user.id) {
        setDetalleModalOpen(false);
        setUsuarioSeleccionado(null);
      }
      await fetchUsuarios();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo eliminar el usuario';
      toast.error(msg);
    }
  };

  // Abrir nuevo
  const handleNuevoUsuario = () => {
    setUsuarioAEditar(null);
    setFormModalOpen(true);
  };

  // Abrir editar
  const handleEditarUsuario = (user: Usuario) => {
    setUsuarioAEditar(user);
    setFormModalOpen(true);
  };

  // Abrir detalles
  const handleVerDetalles = (user: Usuario) => {
    setUsuarioSeleccionado(user);
    setDetalleModalOpen(true);
  };

  // Copiar correo
  const handleCopiarEmail = (e: React.MouseEvent, email: string, id: string) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(email).then(() => {
      setCopiadoId(id);
      toast.success(`Correo ${email} copiado`);
      setTimeout(() => setCopiadoId(null), 2000);
    }).catch(() => toast.error('No se pudo copiar el correo. Selecciónalo y cópialo manualmente.'));
  };

  // Exportar CSV
  const handleExportarCsv = () => {
    const encabezados = 'ID,Nombre Completo,Usuario,Email,Rol,Sucursal,Teléfono,Estado\n';
    const csv = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const filas = usuarios
      .map(
        (u) =>
          [u.id, u.nombreCompleto, u.username, u.email, u.rol, u.sucursal, u.telefono || '', u.estado].map(csv).join(',')
      )
      .join('\n');
    const blob = new Blob([encabezados + filas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Usuarios_KIPUS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Directorio de usuarios exportado en CSV');
  };

  // Filtros
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      // Filtro por tab
      if (filtroTab === 'ADMINISTRADOR' && u.rol !== 'ADMINISTRADOR') return false;
      if (filtroTab === 'CAJERO' && u.rol !== 'CAJERO') return false;
      if (filtroTab === 'SUPERVISOR' && u.rol !== 'SUPERVISOR') return false;
      if ((filtroTab === 'ACTIVO' || filtroTab === 'INACTIVO') && u.estado !== filtroTab) return false;

      // Filtro por texto
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const coincideNombre = u.nombreCompleto.toLowerCase().includes(q);
        const coincideUser = u.username.toLowerCase().includes(q);
        const coincideEmail = u.email.toLowerCase().includes(q);
        const coincideSucursal = u.sucursal.toLowerCase().includes(q);
        const coincideRol = u.rol.toLowerCase().includes(q);
        return coincideNombre || coincideUser || coincideEmail || coincideSucursal || coincideRol;
      }

      return true;
    });
  }, [usuarios, filtroTab, searchTerm]);

  // Métricas
  const totalActivos = useMemo(() => usuarios.filter((u) => u.estado === 'ACTIVO').length, [usuarios]);
  const totalAdmins = useMemo(() => usuarios.filter((u) => u.rol === 'ADMINISTRADOR').length, [usuarios]);
  const totalCajeros = useMemo(() => usuarios.filter((u) => u.rol === 'CAJERO').length, [usuarios]);
  const totalSupervisores = useMemo(() => usuarios.filter((u) => u.rol === 'SUPERVISOR').length, [usuarios]);

  const getRoleBadge = (rol: UserRole) => {
    switch (rol) {
      case 'ADMINISTRADOR':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            Administrador
          </span>
        );
      case 'SUPERVISOR':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            Supervisor
          </span>
        );
      case 'CAJERO':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Cajero POS
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <PageHeader
        title="Usuarios"
        description="Gestión de cuentas, roles de acceso, contraseñas y asignación de sucursales para el personal"
        badge="Seguridad KIPU'S"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarCsv}
            className="h-9 text-xs gap-1.5 border-border"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Button
            size="sm"
            onClick={handleNuevoUsuario}
            className="h-9 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo usuario</span>
          </Button>
        </div>
      </PageHeader>

      <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Este prototipo guarda las cuentas y contraseñas en el almacenamiento local de este navegador. Los roles limitan la navegación de la interfaz; no equivalen a controles de seguridad de servidor.
      </p>

      {/* Contenedor Principal: Filtros y Tabla / Tarjetas */}
      {loadError && <QueryError message={loadError} retry={() => { setLoading(true); void fetchUsuarios(); }} />}
      <Card className="border-border bg-card">
        <CardContent className="p-3 sm:p-4 space-y-4">
          {/* Barra de Filtros */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Buscador */}
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, usuario, correo o sucursal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 h-9 text-xs w-full"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    title="Limpiar búsqueda"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Selector de Vista (Tabla vs Tarjetas) */}
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <span className="text-xs text-muted-foreground sm:hidden font-mono">
                  {usuariosFiltrados.length} {usuariosFiltrados.length === 1 ? 'usuario' : 'usuarios'}
                </span>
                <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                  <button
                    type="button"
                    onClick={() => setTipoVista('TABLA')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      tipoVista === 'TABLA'
                        ? 'bg-card text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Vista en tabla"
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>Tabla</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoVista('TARJETAS')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                      tipoVista === 'TARJETAS'
                        ? 'bg-card text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Vista en tarjetas"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Tarjetas</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs de Filtro de Roles con Scroll Horizontal Limpio */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-2 border-t border-border/60">
              <span className="text-xs font-medium text-muted-foreground mr-1 whitespace-nowrap shrink-0">
                Rol:
              </span>
              {(
                [
                  { id: 'TODOS', label: `Todos (${usuarios.length})` },
                  { id: 'ADMINISTRADOR', label: `Administradores (${totalAdmins})` },
                  { id: 'CAJERO', label: `Cajeros (${totalCajeros})` },
                  { id: 'SUPERVISOR', label: `Supervisores (${totalSupervisores})` },
                  { id: 'ACTIVO', label: `Solo Activos (${totalActivos})` },
                  { id: 'INACTIVO', label: `Inactivos (${usuarios.filter(u => u.estado === 'INACTIVO').length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    filtroTab === tab.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listado de Usuarios */}
          {loadError ? null : loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Cargando directorio de usuarios...
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="py-12 px-4 text-center border border-border rounded-xl bg-muted/10 space-y-3">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-base font-semibold text-foreground">
                No se encontraron usuarios
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No hay resultados para los criterios seleccionados. Prueba cambiando el término de búsqueda o el filtro de rol.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFiltroTab('TODOS');
                }}
                className="h-8 text-xs"
              >
                Restablecer filtros
              </Button>
            </div>
          ) : tipoVista === 'TABLA' ? (
            /* Vista de Tabla Protegida con Desplazamiento Horizontal */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1 lg:hidden">
                <span className="text-[11px] font-medium text-primary flex items-center gap-1">
                  ↔ Desliza horizontalmente para ver todas las columnas
                </span>
                <span className="text-[11px] font-mono">
                  {usuariosFiltrados.length} {usuariosFiltrados.length === 1 ? 'usuario' : 'usuarios'}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
                <Table className="w-full min-w-[960px]">
                  <TableHeader>
                    <TableRow className="bg-muted/40 border-b border-border hover:bg-muted/40">
                      <TableHead className="text-xs font-semibold text-foreground py-2.5 px-3 min-w-[250px] whitespace-nowrap">
                        Usuario / Empleado
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground py-2.5 px-3 min-w-[140px] whitespace-nowrap">
                        Rol y Permisos
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground py-2.5 px-3 min-w-[200px] whitespace-nowrap">
                        Sucursal Asignada
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground py-2.5 px-3 min-w-[220px] whitespace-nowrap">
                        Contacto
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground py-2.5 px-3 min-w-[100px] text-center whitespace-nowrap">
                        Estado
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground py-2.5 px-3 min-w-[120px] text-right whitespace-nowrap">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuariosFiltrados.map((user) => (
                      <TableRow
                        key={user.id}
                        className="hover:bg-muted/40 border-b border-border/70 transition-colors cursor-pointer"
                        onClick={() => handleVerDetalles(user)}
                      >
                        {/* Usuario e Iniciales */}
                        <TableCell className="py-2.5 px-3 min-w-[250px]">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {user.avatarInitials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground text-sm block leading-snug hover:text-primary transition-colors whitespace-nowrap">
                                {user.nombreCompleto}
                              </span>
                              <span className="font-mono text-xs text-muted-foreground block whitespace-nowrap">
                                @{user.username}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Rol */}
                        <TableCell className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">
                          {getRoleBadge(user.rol)}
                        </TableCell>

                        {/* Sucursal */}
                        <TableCell className="py-2.5 px-3 whitespace-nowrap min-w-[200px] text-xs text-foreground font-medium">
                          <div className="flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="whitespace-nowrap">{user.sucursal}</span>
                          </div>
                        </TableCell>

                        {/* Contacto */}
                        <TableCell className="py-2.5 px-3 whitespace-nowrap min-w-[220px] text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-foreground">
                              <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="font-mono text-xs">{user.email}</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopiarEmail(e, user.email, user.id)}
                                className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                title="Copiar correo"
                              >
                                {copiadoId === user.id ? (
                                  <Check className="h-3 w-3 text-success-text" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            {user.telefono && (
                              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span>{user.telefono}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Estado */}
                        <TableCell className="py-2.5 px-3 whitespace-nowrap min-w-[100px] text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                              user.estado === 'ACTIVO'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {user.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                          </span>
                        </TableCell>

                        {/* Acciones */}
                        <TableCell
                          className="py-2.5 px-3 whitespace-nowrap min-w-[120px] text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVerDetalles(user)}
                              title="Ver detalles del usuario"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditarUsuario(user)}
                              title="Editar usuario"
                              className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            /* Vista de Tarjetas Adaptada y Fluida */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {usuariosFiltrados.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleVerDetalles(user)}
                  className="p-4 rounded-xl border border-border bg-card space-y-3 hover:border-primary/40 hover:shadow-xs transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shrink-0">
                        {user.avatarInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-foreground leading-snug truncate">
                          {user.nombreCompleto}
                        </h4>
                        <span className="font-mono text-xs text-muted-foreground block truncate">
                          @{user.username}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {getRoleBadge(user.rol)}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{user.sucursal}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate font-mono">{user.email}</span>
                    </div>
                    {user.telefono && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{user.telefono}</span>
                      </div>
                    )}
                  </div>

                  <div
                    className="flex items-center justify-between pt-2 border-t border-border/60 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                        user.estado === 'ACTIVO'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {user.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerDetalles(user)}
                        className="h-7 text-xs px-2.5 gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Ver</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditarUsuario(user)}
                        className="h-7 text-xs px-2.5 gap-1 text-primary border-primary/30 hover:bg-primary/5"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Editar</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Formulario Usuario (Crear o Editar) */}
      <UsuarioFormDialog
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        onGuardar={handleGuardarUsuario}
        usuarioAEditar={usuarioAEditar}
      />

      {/* Modal Detalle Usuario */}
      <UsuarioDetalleModal
        open={detalleModalOpen}
        onOpenChange={setDetalleModalOpen}
        usuario={usuarioSeleccionado}
        onEditarClick={(user) => {
          setDetalleModalOpen(false);
          handleEditarUsuario(user);
        }}
        onEliminarClick={(user) => {
          handleEliminarUsuario(user);
        }}
      />
    </div>
  );
};

export default UsuariosPage;
