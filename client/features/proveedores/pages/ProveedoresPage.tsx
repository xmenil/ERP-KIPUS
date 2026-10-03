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
import { NuevoProveedorDialog } from '../components/NuevoProveedorDialog';
import { proveedoresService } from '../services/proveedoresService';
import { Proveedor, NuevoProveedorPayload } from '../types/proveedores.types';
import { formatNumber } from '@/utils/formatters';
import { Building2, Search, PlusCircle, Phone, Mail, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export const ProveedoresPage: React.FC = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);

  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const data = await proveedoresService.getProveedores();
      setProveedores(data);
    } catch {
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const handleCrearProveedor = async (payload: NuevoProveedorPayload) => {
    try {
      const nuevo = await proveedoresService.registrarProveedor(payload);
      setProveedores((prev) => [nuevo, ...prev]);
      toast.success(`Proveedor "${nuevo.razonSocial}" registrado`);
    } catch {
      toast.error('No se pudo registrar el proveedor');
    }
  };

  const filteredProveedores = proveedores.filter(
    (p) =>
      p.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ruc.includes(searchTerm) ||
      p.rubro.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Directorio de Proveedores"
        description="Gestión de contactos de abastecimiento, condiciones comerciales y catálogo de proveedores"
        badge="Proveedores Homologados"
      >
        <Button
          size="sm"
          onClick={() => setOpenModal(true)}
          className="gap-2 bg-primary text-primary-foreground font-semibold shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Registrar Proveedor</span>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Proveedores en Cartera"
          value={formatNumber(proveedores.length)}
          subtitle="Empresas con RUC verificado"
          icon={Building2}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40"
        />
        <MetricCard
          title="Proveedores a Crédito"
          value={`${proveedores.filter((p) => p.condicionPago.includes('Crédito')).length}`}
          subtitle="Con línea de crédito aprobada"
          icon={CreditCard}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
        />
        <MetricCard
          title="Rubros de Abastecimiento"
          value={`${Array.from(new Set(proveedores.map((p) => p.rubro))).length} sectores`}
          subtitle="Lubricantes, repuestos y filtros"
          icon={Building2}
          iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40"
        />
      </div>

      <Card className="border-border/80">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por RUC o razón social..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredProveedores.length} proveedores listados
            </span>
          </div>

          <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-slate-100/90 dark:bg-slate-800/90 border-b border-border">
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">RUC Proveedor</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Razón Social</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Asesor & Contacto Directo</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Rubro de Suministro</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Condición de Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                      Cargando directorio de proveedores homologados...
                    </TableCell>
                  </TableRow>
                ) : filteredProveedores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                      No se encontraron proveedores que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProveedores.map((prov) => (
                    <TableRow key={prov.id} className="text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-border/70 transition-colors">
                      <TableCell className="font-mono font-bold text-primary py-2.5 text-[13px]">
                        {prov.ruc}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground py-2.5 text-[13px]">
                        {prov.razonSocial}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="space-y-0.5 text-foreground">
                          <span className="font-semibold text-foreground block text-xs">{prov.contacto}</span>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <Phone className="h-3.5 w-3.5 text-primary" />
                            <span>{prov.telefono}</span>
                          </div>
                          {prov.correo && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{prov.correo}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-muted border border-border/60 text-foreground">
                          {prov.rubro}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="font-semibold text-foreground text-xs">
                          {prov.condicionPago}
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

      <NuevoProveedorDialog
        open={openModal}
        onOpenChange={setOpenModal}
        onProveedorRegistrado={handleCrearProveedor}
      />
    </div>
  );
};

export default ProveedoresPage;
