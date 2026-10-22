import React, { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryError } from '@/components/common/QueryError';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { NuevoClienteDialog } from '../components/NuevoClienteDialog';
import { ClienteDetalleDialog } from '../components/ClienteDetalleDialog';
import { clientesService } from '../services/clientesService';
import { useErpQuery } from '@/hooks/useErpQuery';
import type { Cliente, NuevoClientePayload } from '../types/clientes.types';
import { normalizarDocumentoCliente } from '../utils/clienteValidation';
import { ventasService } from '@/features/ventas/services/ventasService';
import type { Venta } from '@/features/ventas/types/ventas.types';
import { Search, MoreHorizontal, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

export const ClientesPage: React.FC = () => {
  const { data: clientes, loading, error, refresh } = useErpQuery(clientesService.getClientes);
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('TODOS');
  const [estadoFiltro, setEstadoFiltro] = useState('ACTIVOS');
  const [pagina, setPagina] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [clienteEdicion, setClienteEdicion] = useState<Cliente | undefined>();
  const [clienteDetalle, setClienteDetalle] = useState<Cliente | null>(null);
  const [ventasCliente, setVentasCliente] = useState<Venta[]>([]);
  const [cargandoVentas, setCargandoVentas] = useState(false);
  const [errorVentas, setErrorVentas] = useState('');
  const [clienteCambioEstado, setClienteCambioEstado] = useState<Cliente | null>(null);
  const [guardandoEstado, setGuardandoEstado] = useState(false);

  const clientesDirectorio = useMemo(() => clientes.filter(cliente => normalizarDocumentoCliente(cliente.numeroDocumento) !== '00000000'), [clientes]);
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase('es-PE');
    const qDoc = normalizarDocumentoCliente(busqueda).toLocaleLowerCase('es-PE');
    return clientesDirectorio.filter(cliente => {
      const coincideTexto = !q || cliente.nombre.toLocaleLowerCase('es-PE').includes(q)
        || normalizarDocumentoCliente(cliente.numeroDocumento).includes(qDoc)
        || cliente.telefono.toLocaleLowerCase('es-PE').includes(q)
        || cliente.correo.toLocaleLowerCase('es-PE').includes(q);
      const coincideTipo = tipoFiltro === 'TODOS' || cliente.documentoTipo === tipoFiltro;
      const activo = cliente.activo !== false;
      const coincideEstado = estadoFiltro === 'TODOS' || (estadoFiltro === 'ACTIVOS' ? activo : !activo);
      return coincideTexto && coincideTipo && coincideEstado;
    }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [clientesDirectorio, busqueda, tipoFiltro, estadoFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const filas = filtrados.slice(pagina * PAGE_SIZE, (pagina + 1) * PAGE_SIZE);
  const guardarNuevo = async (payload: NuevoClientePayload) => {
    const cliente = await clientesService.registrarCliente(payload);
    toast.success(`Cliente ${cliente.nombre} registrado.`);
  };
  const guardarEdicion = async (id: string, payload: NuevoClientePayload) => {
    const cliente = await clientesService.actualizarCliente(id, payload);
    toast.success(`Ficha de ${cliente.nombre} actualizada. Las ventas guardadas mantienen sus datos originales.`);
    setClienteEdicion(undefined);
  };
  const abrirDetalle = async (cliente: Cliente) => {
    setClienteDetalle(cliente);
    setCargandoVentas(true);
    setErrorVentas('');
    try { setVentasCliente(await ventasService.getVentas()); }
    catch { setVentasCliente([]); setErrorVentas('No se pudo cargar el historial de ventas. Cierra la ficha e inténtalo de nuevo.'); }
    finally { setCargandoVentas(false); }
  };
  const abrirEdicion = (cliente: Cliente) => { setClienteDetalle(null); setClienteEdicion(cliente); setFormOpen(true); };
  const confirmarEstado = async () => {
    if (!clienteCambioEstado || guardandoEstado) return;
    setGuardandoEstado(true);
    try {
      const cliente = await clientesService.cambiarEstadoCliente(clienteCambioEstado.id);
      toast.success(`Cliente ${cliente.activo ? 'activado' : 'desactivado'}.`);
      setClienteCambioEstado(null);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'No se pudo cambiar el estado. Inténtalo de nuevo.');
    } finally { setGuardandoEstado(false); }
  };
  const abrirNuevo = () => { setClienteEdicion(undefined); setFormOpen(true); };

  return <div className="space-y-6">
    <QueryError message={error} retry={() => { void refresh(); }} />
    <PageHeader title="Clientes" description="Busca clientes, revisa sus comprobantes y mantén sus datos de facturación al día.">
      <Button onClick={abrirNuevo} className="h-11 w-full gap-2 sm:h-9 sm:w-auto"><UserPlus className="h-4 w-4" />Registrar cliente</Button>
    </PageHeader>

    <Card className="border-border"><CardContent className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="clientes-busqueda">Buscar por nombre, documento o contacto</Label>
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="clientes-busqueda" value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(0); }} placeholder="Nombre, DNI, RUC, teléfono o correo" className="h-11 pl-9 text-base md:h-9 md:text-sm" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:w-[360px]">
          <div className="space-y-2"><Label htmlFor="clientes-tipo">Tipo de documento</Label><Select value={tipoFiltro} onValueChange={value => { setTipoFiltro(value); setPagina(0); }}><SelectTrigger id="clientes-tipo" className="h-11 text-base md:h-9 md:text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem><SelectItem value="DNI">DNI</SelectItem><SelectItem value="RUC">RUC</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="clientes-estado">Estado</Label><Select value={estadoFiltro} onValueChange={value => { setEstadoFiltro(value); setPagina(0); }}><SelectTrigger id="clientes-estado" className="h-11 text-base md:h-9 md:text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ACTIVOS">Activos</SelectItem><SelectItem value="INACTIVOS">Inactivos</SelectItem><SelectItem value="TODOS">Todos</SelectItem></SelectContent></Select></div>
        </div>
      </div>

      {loading && !error ? <div className="space-y-3 py-4" aria-label="Cargando clientes">{[0, 1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />)}</div>
        : !error && filas.length === 0 ? <div className="rounded-md border border-dashed border-border px-4 py-12 text-center"><p className="text-sm font-medium">{clientesDirectorio.length === 0 ? 'Aún no hay clientes en el directorio.' : 'No hay clientes que coincidan con la búsqueda.'}</p><p className="mt-1 text-sm text-muted-foreground">{clientesDirectorio.length === 0 ? 'Consumidor Final se selecciona aparte al vender. Registra aquí personas o empresas.' : 'Prueba otro documento o cambia los filtros.'}</p>{clientesDirectorio.length === 0 && <Button className="mt-4 h-11 sm:h-9" onClick={abrirNuevo}>Registrar primer cliente</Button>}</div>
        : !error && <>
          <div className="hidden overflow-x-auto rounded-md border border-border md:block">
            <Table><TableHeader><TableRow><TableHead>Documento</TableHead><TableHead>Cliente / razón social</TableHead><TableHead>Contacto</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>{filas.map(cliente => <TableRow key={cliente.id}>
                <TableCell className="font-mono text-sm">{cliente.documentoTipo}<span className="block text-muted-foreground">{cliente.numeroDocumento}</span></TableCell>
                <TableCell className="font-medium">{cliente.nombre}</TableCell>
                <TableCell className="max-w-56 text-sm"><span className="block">{cliente.telefono && cliente.telefono !== '-' ? cliente.telefono : 'Sin teléfono'}</span><span className="block truncate text-xs text-muted-foreground">{cliente.correo && cliente.correo !== '-' ? cliente.correo : 'Sin correo'}</span></TableCell>
                <TableCell><span className={cliente.activo === false ? 'rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground' : 'rounded-md bg-success-soft px-2 py-1 text-xs text-success-text'}>{cliente.activo === false ? 'Inactivo' : 'Activo'}</span></TableCell>
                <TableCell className="text-right"><div className="inline-flex items-center gap-1"><Button variant="ghost" size="sm" className="h-9" onClick={() => { void abrirDetalle(cliente); }}>Ver ficha</Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Acciones de ${cliente.nombre}`} className="h-9 w-9"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => abrirEdicion(cliente)}>Editar datos</DropdownMenuItem><DropdownMenuItem onSelect={() => setClienteCambioEstado(cliente)}>{cliente.activo === false ? 'Activar cliente' : 'Desactivar cliente'}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></TableCell>
              </TableRow>)}</TableBody>
            </Table>
          </div>
          <div className="space-y-2 md:hidden">{filas.map(cliente => <article key={cliente.id} className="space-y-3 rounded-md border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="font-medium">{cliente.nombre}</p><p className="font-mono text-sm text-muted-foreground">{cliente.documentoTipo} · {cliente.numeroDocumento}</p></div><span className={cliente.activo === false ? 'rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground' : 'rounded-md bg-success-soft px-2 py-1 text-xs text-success-text'}>{cliente.activo === false ? 'Inactivo' : 'Activo'}</span></div>
            <p className="text-sm text-muted-foreground">{cliente.telefono && cliente.telefono !== '-' ? cliente.telefono : 'Sin teléfono'}{cliente.correo && cliente.correo !== '-' ? ` · ${cliente.correo}` : ''}</p>
            <div className="flex gap-2"><Button variant="outline" className="h-11 flex-1" onClick={() => { void abrirDetalle(cliente); }}>Ver ficha</Button><Button variant="outline" className="h-11 flex-1" onClick={() => abrirEdicion(cliente)}>Editar</Button></div>
          </article>)}</div>
          <div className="flex flex-col gap-2 border-t border-border pt-3 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-muted-foreground">Mostrando {filtrados.length ? pagina * PAGE_SIZE + 1 : 0}–{Math.min((pagina + 1) * PAGE_SIZE, filtrados.length)} de {filtrados.length} clientes</p><div className="flex items-center gap-2"><Button variant="outline" className="h-11 sm:h-9" disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}>Anterior</Button><span aria-live="polite">Página {pagina + 1} de {totalPaginas}</span><Button variant="outline" className="h-11 sm:h-9" disabled={pagina + 1 >= totalPaginas} onClick={() => setPagina(p => p + 1)}>Siguiente</Button></div></div>
        </>}
    </CardContent></Card>

    <NuevoClienteDialog open={formOpen} onOpenChange={open => { setFormOpen(open); if (!open) setClienteEdicion(undefined); }} onClienteRegistrado={guardarNuevo} cliente={clienteEdicion} onClienteActualizado={guardarEdicion} />
    <ClienteDetalleDialog cliente={clienteDetalle} ventas={ventasCliente} cargandoVentas={cargandoVentas} errorVentas={errorVentas} onClose={() => setClienteDetalle(null)} onEditar={abrirEdicion} />
    <AlertDialog open={!!clienteCambioEstado} onOpenChange={open => { if (!open && !guardandoEstado) setClienteCambioEstado(null); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{clienteCambioEstado?.activo === false ? '¿Activar cliente?' : '¿Desactivar cliente?'}</AlertDialogTitle><AlertDialogDescription>{clienteCambioEstado ? `${clienteCambioEstado.nombre} ${clienteCambioEstado.activo === false ? 'volverá a aparecer' : 'dejará de aparecer'} en el selector de ventas. Sus comprobantes históricos se conservan.` : ''}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={guardandoEstado}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={guardandoEstado} onClick={event => { event.preventDefault(); void confirmarEstado(); }}>{guardandoEstado ? 'Guardando…' : clienteCambioEstado?.activo === false ? 'Activar cliente' : 'Desactivar cliente'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </div>;
};

export default ClientesPage;
