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
import { MetricCard } from '@/components/common/MetricCard';
import { NuevoClienteDialog } from '../components/NuevoClienteDialog';
import { clientesService } from '../services/clientesService';
import { Cliente, NuevoClientePayload } from '../types/clientes.types';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { UserPlus, Search, Users, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const data = await clientesService.getClientes();
      setClientes(data);
    } catch {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleCrearCliente = async (payload: NuevoClientePayload) => {
    try {
      const nuevo = await clientesService.registrarCliente(payload);
      setClientes((prev) => [nuevo, ...prev]);
      toast.success(`Cliente "${nuevo.nombre}" registrado`);
    } catch {
      toast.error('No se pudo registrar el cliente');
    }
  };

  const [filtroTipoDoc, setFiltroTipoDoc] = useState<string>('TODOS');

  const filteredClientes = clientes.filter((c) => {
    const matchSearch =
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.numeroDocumento.includes(searchTerm) ||
      c.telefono.includes(searchTerm);
    const matchDoc =
      filtroTipoDoc === 'TODOS' ||
      (filtroTipoDoc === 'CON_DEUDA' ? c.saldoPendiente > 0 : c.documentoTipo === filtroTipoDoc);
    return matchSearch && matchDoc;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Directorio de Clientes"
        description="Ficha de clientes (DNI / RUC), cuentas corrientes comerciales e historial de compras"
        badge="Directorio Comercial"
      >
        <Button
          size="sm"
          onClick={() => setOpenModal(true)}
          className="gap-2 bg-primary text-primary-foreground font-semibold shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          <span>Registrar Cliente</span>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Clientes Registrados"
          value={formatNumber(clientes.length)}
          subtitle="Personas naturales y jurídicas"
          icon={Users}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40"
        />
        <MetricCard
          title="Clientes con RUC (Empresas)"
          value={`${clientes.filter((c) => c.documentoTipo === 'RUC').length}`}
          subtitle="Facturación B2B recurrente"
          icon={Users}
          iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40"
        />
        <MetricCard
          title="Saldos por Cobrar"
          value={formatCurrency(clientes.reduce((a, b) => a + b.saldoPendiente, 0))}
          subtitle="Cuentas corrientes de clientes"
          icon={Users}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
        />
      </div>

      <Card className="border-border/80">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o DNI/RUC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filtros rápidos */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: 'TODOS', label: 'Todos' },
                { id: 'DNI', label: 'DNI' },
                { id: 'RUC', label: 'Empresas RUC' },
                { id: 'CON_DEUDA', label: 'Con Saldo Pendiente' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltroTipoDoc(f.id)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    filtroTipoDoc === f.id
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="text-xs text-muted-foreground ml-2 hidden lg:inline">
                {filteredClientes.length} clientes
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-slate-100/90 dark:bg-slate-800/90 border-b border-border">
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Documento Identidad</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Cliente / Razón Social</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Teléfono & Contacto</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Dirección Comercial</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-right py-2.5">Compras Acum.</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-right py-2.5">Saldo por Cobrar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      Cargando directorio de clientes...
                    </TableCell>
                  </TableRow>
                ) : filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      No se encontraron clientes con los filtros indicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id} className="text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-border/70 transition-colors">
                      <TableCell className="py-2.5">
                        <span className="font-mono font-bold text-primary block text-[13px]">
                          {cliente.numeroDocumento}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          {cliente.documentoTipo}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground py-2.5 text-[13px]">
                        {cliente.nombre}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="space-y-0.5 text-foreground">
                          <div className="flex items-center gap-1.5 font-medium text-xs">
                            <Phone className="h-3.5 w-3.5 text-primary" />
                            <span>{cliente.telefono || 'Sin teléfono'}</span>
                          </div>
                          {cliente.correo && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{cliente.correo}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate py-2.5 text-xs">
                        {cliente.direccion || 'No especificada'}
                      </TableCell>
                      <TableCell className="text-right font-black font-mono text-foreground py-2.5 text-[14px] tabular-nums">
                        {formatCurrency(cliente.totalCompras)}
                      </TableCell>
                      <TableCell className="text-right font-black font-mono py-2.5 text-[14px] tabular-nums">
                        <span className={cliente.saldoPendiente > 0 ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800' : 'text-slate-500'}>
                          {formatCurrency(cliente.saldoPendiente)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NuevoClienteDialog
        open={openModal}
        onOpenChange={setOpenModal}
        onClienteRegistrado={handleCrearCliente}
      />
    </div>
  );
};

export default ClientesPage;
