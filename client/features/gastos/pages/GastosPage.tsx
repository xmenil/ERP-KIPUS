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
import { NuevoGastoDialog } from '../components/NuevoGastoDialog';
import { gastosService } from '../services/gastosService';
import { Gasto, NuevoGastoPayload } from '../types/gastos.types';
import { subscribeToErp } from '@/services/erp/erpStore';
import { formatCurrency } from '@/utils/formatters';
import { PlusCircle, Search, Receipt, TrendingDown, Building, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export const GastosPage: React.FC = () => {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);

  const fetchGastos = async () => {
    setLoading(true);
    try {
      const data = await gastosService.getGastos();
      setGastos(data);
    } catch {
      toast.error('Error al cargar gastos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGastos();
    const unsubscribe = subscribeToErp(() => {
      fetchGastos();
    });
    return unsubscribe;
  }, []);

  const handleCrearGasto = async (payload: NuevoGastoPayload) => {
    try {
      const nuevo = await gastosService.registrarGasto(payload);
      setGastos((prev) => [nuevo, ...prev]);
      toast.success(`Gasto de ${formatCurrency(nuevo.monto)} registrado`);
    } catch {
      toast.error('No se pudo registrar el gasto');
    }
  };

  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODAS');

  const filteredGastos = gastos.filter((g) => {
    const matchSearch =
      g.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.beneficiario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.comprobante.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoriaFiltro === 'TODAS' || g.categoria === categoriaFiltro;
    return matchSearch && matchCat;
  });

  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gastos y Egresos Operativos"
        description="Control de costos fijos, variables, servicios y proveedores menores del negocio"
        badge="Flujo Negativo"
      >
        <Button
          size="sm"
          onClick={() => setOpenModal(true)}
          className="gap-2 bg-primary text-primary-foreground font-semibold shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Registrar Gasto</span>
        </Button>
      </PageHeader>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Total Egresos del Mes"
          value={formatCurrency(totalGastos)}
          subtitle={`${gastos.length} comprobantes registrados`}
          icon={TrendingDown}
          iconColor="text-rose-600 bg-rose-50 dark:bg-rose-950/40"
        />
        <MetricCard
          title="Gastos en Locales & Alquiler"
          value={formatCurrency(
            gastos.filter((g) => g.categoria === 'ALQUILER').reduce((a, b) => a + b.monto, 0)
          )}
          subtitle="Costos fijos principales"
          icon={Building}
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/40"
        />
        <MetricCard
          title="Servicios Básicos & Logística"
          value={formatCurrency(
            gastos
              .filter((g) => g.categoria === 'SERVICIOS_BASICOS' || g.categoria === 'LOGISTICA')
              .reduce((a, b) => a + b.monto, 0)
          )}
          subtitle="Luz, agua, internet, combustible"
          icon={Receipt}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/40"
        />
      </div>

      {/* Tabla de Gastos */}
      <Card className="border-border/80">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por concepto o proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Categorías pill selector */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: 'TODAS', label: 'Todos' },
                { id: 'ALQUILER', label: 'Alquiler' },
                { id: 'SERVICIOS_BASICOS', label: 'Servicios' },
                { id: 'LOGISTICA', label: 'Logística' },
                { id: 'PERSONAL', label: 'Personal' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoriaFiltro(c.id)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    categoriaFiltro === c.id
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {c.label}
                </button>
              ))}
              <span className="text-xs text-muted-foreground ml-2 hidden lg:inline">
                {filteredGastos.length} egresos
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-slate-100/90 dark:bg-slate-800/90 border-b border-border">
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Fecha</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Categoría</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Concepto / Descripción</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">Beneficiario / Proveedor</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider py-2.5">N° Comprobante</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-right py-2.5">Monto Pagado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      Cargando gastos y egresos...
                    </TableCell>
                  </TableRow>
                ) : filteredGastos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                      No se encontraron registros de gastos con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGastos.map((gasto) => (
                    <TableRow key={gasto.id} className="text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-border/70 transition-colors">
                      <TableCell className="text-muted-foreground font-mono text-xs py-2.5 font-medium">{gasto.fecha}</TableCell>
                      <TableCell className="py-2.5">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-muted border border-border/60 text-foreground">
                          {gasto.categoria.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground py-2.5">{gasto.descripcion}</TableCell>
                      <TableCell className="text-foreground py-2.5 font-medium text-xs">{gasto.beneficiario}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground py-2.5 font-medium">
                        {gasto.comprobante}
                      </TableCell>
                      <TableCell className="text-right font-black font-mono text-rose-700 dark:text-rose-400 py-2.5 text-[14px] tabular-nums">
                        -{formatCurrency(gasto.monto)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NuevoGastoDialog
        open={openModal}
        onOpenChange={setOpenModal}
        onGastoRegistrado={handleCrearGasto}
      />
    </div>
  );
};

export default GastosPage;
