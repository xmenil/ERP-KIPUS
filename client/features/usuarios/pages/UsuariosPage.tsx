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
import { MetricCard } from '@/components/common/MetricCard';
import { UsuarioFormDialog } from '../components/UsuarioFormDialog';
import { UsuarioDetalleModal } from '../components/UsuarioDetalleModal';
import { usuariosService } from '../services/usuariosService';
import { Usuario, NuevoUsuarioPayload, UserRole } from '../types/usuarios.types';
import {
  Users,
  ShieldCheck,
  Search,
  Plus,
  Phone,
  Mail,
  Building,
  Eye,
  Edit,
  Trash2,
  Copy,
  Check,
  LayoutGrid,
  List,
  Sparkles,
  Download,
  Lock,
  KeyRound,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

type FiltroTab = 'TODOS' | 'ADMINISTRADOR' | 'CAJERO' | 'SUPERVISOR' | 'ACTIVO';
type TipoVista = 'TABLA' | 'TARJETAS';

export const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTab, setFiltroTab] = useState<FiltroTab>('TODOS');
  const [tipoVista, setTipoVista] = useState<TipoVista>('TABLA');

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
    } catch {
      toast.error('Error al cargar la lista de usuarios');
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
      fetchUsuarios();
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
      `¿Estás seguro de eliminar el usuario "${user.nombreCompleto}" (@${user.username})?\n\nEsta acción revocará su acceso al sistema de forma permanente.`
    );
    if (!confirmacion) return;

    try {
      await usuariosService.eliminarUsuario(user.id);
      toast.success(`Usuario "${user.nombreCompleto}" eliminado del sistema`);
      if (detalleModalOpen && usuarioSeleccionado?.id === user.id) {
        setDetalleModalOpen(false);
        setUsuarioSeleccionado(null);
      }
      fetchUsuarios();
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
    navigator.clipboard.writeText(email);
    setCopiadoId(id);
    toast.success(`Correo ${email} copiado`);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  // Exportar CSV
  const handleExportarCsv = () => {
    const encabezados = 'ID,Nombre Completo,Usuario,Email,Rol,Sucursal,Teléfono,Estado,Último Acceso\n';
    const filas = usuarios
      .map(
        (u) =>
          `"${u.id}","${u.nombreCompleto}","${u.username}","${u.email}","${u.rol}","${u.sucursal}","${u.telefono || ''}","${u.estado}","${u.ultimoAcceso || ''}"`
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
      if (filtroTab === 'ACTIVO' && u.estado !== 'ACTIVO') return false;

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
        title="Usuarios y Seguridad del Sistema"
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
            <span>Nuevo Usuario</span>
          </Button>
        </div>
      </PageHeader>

      {/* Tarjetas Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Total Usuarios Activos"
          value={totalActivos}
          subtitle="Cuentas habilitadas con login"
          icon={ShieldCheck}
          iconColor="text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400"
        />
        <MetricCard
          title="Administradores"
          value={totalAdmins}
          subtitle="Acceso completo al ERP"
          icon={KeyRound}
          iconColor="text-purple-700 bg-purple-100 dark:bg-purple-950/60 dark:text-purple-400"
        />
        <MetricCard
          title="Cajeros y POS"
          value={totalCajeros}
          subtitle="Operaciones de caja y ventas"
          icon={Users}
          iconColor="text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400"
        />
        <MetricCard
          title="Supervisores / Almacén"
          value={totalSupervisores}
          subtitle="Control de stock y kardex"
          icon={Building}
          iconColor="text-blue-700 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400"
        />
      </div>

      {/* Contenedor Principal: Filtros y Tabla */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 space-y-4">
          {/* Barra de Filtros */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Buscador */}
              <div className="relative w-full max-w-md">
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
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                  <button
                    type="button"
                    onClick={() => setTipoVista('TABLA')}
                    className={`p-1.5 rounded-md text-xs transition-colors ${
                      tipoVista === 'TABLA'
                        ? 'bg-card text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Vista en tabla"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoVista('TARJETAS')}
                    className={`p-1.5 rounded-md text-xs transition-colors ${
                      tipoVista === 'TARJETAS'
                        ? 'bg-card text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Vista en tarjetas"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs de Filtro de Roles */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 pt-2 border-t border-border/60">
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
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFiltroTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    filtroTab === tab.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listado de Usuarios */}
          {loading ? (
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
            /* Vista de Tabla Desktop */
            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <Table className="w-full min-w-table">
                <TableHeader>
                  <TableRow className="bg-muted/40 border-b border-border hover:bg-muted/40">
                    <TableHead className="text-xs font-semibold text-foreground py-2.5 px-3">
                      Usuario / Empleado
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground py-2.5 px-3">
                      Rol y Permisos
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground py-2.5 px-3">
                      Sucursal Asignada
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground py-2.5 px-3">
                      Contacto
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground py-2.5 px-3 text-center">
                      Estado
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground py-2.5 px-3 text-right">
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
                      <TableCell className="py-2.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {user.avatarInitials}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground text-sm block leading-snug hover:text-primary transition-colors">
                              {user.nombreCompleto}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground block">
                              @{user.username}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Rol */}
                      <TableCell className="py-2.5 px-3 whitespace-nowrap">
                        {getRoleBadge(user.rol)}
                      </TableCell>

                      {/* Sucursal */}
                      <TableCell className="py-2.5 px-3 whitespace-nowrap text-xs text-foreground font-medium">
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span>{user.sucursal}</span>
                        </div>
                      </TableCell>

                      {/* Contacto */}
                      <TableCell className="py-2.5 px-3 whitespace-nowrap text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{user.email}</span>
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
                              <Phone className="h-3 w-3" />
                              <span>{user.telefono}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="py-2.5 px-3 whitespace-nowrap text-center">
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
                        className="py-2.5 px-3 whitespace-nowrap text-right"
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
                          {user.id !== 'user-admin' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEliminarUsuario(user)}
                              title="Eliminar usuario"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-danger-soft"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Vista de Tarjetas */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {usuariosFiltrados.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-xl border border-border bg-card space-y-3 hover:border-primary/40 transition-all shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shrink-0">
                        {user.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-foreground leading-snug truncate">
                          {user.nombreCompleto}
                        </h4>
                        <span className="font-mono text-xs text-muted-foreground block">
                          @{user.username}
                        </span>
                      </div>
                    </div>
                    {getRoleBadge(user.rol)}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{user.sucursal}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.telefono && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{user.telefono}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                        user.estado === 'ACTIVO'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-emerald-200'
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
                        className="h-7 text-xs px-2 gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Ver</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditarUsuario(user)}
                        className="h-7 text-xs px-2 gap-1 text-primary border-primary/30 hover:bg-primary/5"
                      >
                        <Edit className="h-3 w-3" />
                        <span>Editar</span>
                      </Button>
                      {user.id !== 'user-admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEliminarUsuario(user)}
                          className="h-7 text-xs px-2 gap-1 text-destructive hover:bg-danger-soft border-destructive/30"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
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
