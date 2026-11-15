import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { GastosOperativosView } from '../components/GastosOperativosView';
import { GastoFormSheet } from '../components/GastoFormSheet';
import { ClientesDirectorioView } from '@/features/clientes/components/ClientesDirectorioView';
import { CuentasPorCobrarFiadosView } from '@/features/clientes/components/CuentasPorCobrarFiadosView';
import { gastosService } from '../services/gastosService';
import { Gasto, NuevoGastoPayload } from '../types/gastos.types';
import { erpStore, subscribeToErp } from '@/services/erp/erpStore';
import { formatCurrency } from '@/utils/formatters';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

type GastosTab = 'gastos' | 'clientes' | 'cuentas-cobrar';

const TAB_TITLES: Record<GastosTab, string> = {
  gastos: 'Gastos Operativos',
  clientes: 'Directorio de Clientes',
  'cuentas-cobrar': 'Cuentas por Cobrar (Fiados)',
};

export const GastosPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const activeTab: GastosTab =
    tabParam === 'clientes'
      ? 'clientes'
      : tabParam === 'cuentas-cobrar' || tabParam === 'fiados'
      ? 'cuentas-cobrar'
      : 'gastos';

  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [totalVentasMes, setTotalVentasMes] = useState<number>(3400);
  const [loading, setLoading] = useState(true);
  const [sheetGastoOpen, setSheetGastoOpen] = useState(false);
  const [clienteFiadoSeleccionadoId, setClienteFiadoSeleccionadoId] = useState<string | undefined>();

  const fetchGastos = async () => {
    setLoading(true);
    try {
      const data = await gastosService.getGastos();
      setGastos(data);
      const ventas = erpStore.getVentas();
      const sumVentas = ventas.reduce((s, v) => s + (v.total || 0), 0);
      if (sumVentas > 0) setTotalVentasMes(sumVentas);
    } catch {
      toast.error('Error al cargar la información de gastos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGastos();
    return subscribeToErp(() => fetchGastos());
  }, []);

  const handleCrearGasto = async (payload: NuevoGastoPayload) => {
    try {
      const nuevo = await gastosService.registrarGasto(payload);
      setGastos((prev) => [nuevo, ...prev]);
      toast.success(`Gasto de ${formatCurrency(nuevo.monto)} registrado correctamente.`);
    } catch {
      toast.error('No se pudo registrar el gasto.');
    }
  };

  const handleIrAFiados = (clienteId: string) => {
    setClienteFiadoSeleccionadoId(clienteId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'cuentas-cobrar');
      return next;
    }, { replace: true });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gastos y Clientes"
        description="Egresos operativos del negocio, directorio de clientes y control de créditos y fiados."
        badge={TAB_TITLES[activeTab]}
      >
        {activeTab === 'gastos' && (
          <Button
            size="sm"
            onClick={() => setSheetGastoOpen(true)}
            className="h-8 gap-2 bg-primary text-primary-foreground font-semibold text-xs shadow-xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Registrar gasto</span>
          </Button>
        )}
      </PageHeader>

      <div className="pt-0">
        {activeTab === 'gastos' && (
          <GastosOperativosView
            gastos={gastos}
            loading={loading}
            totalVentasMes={totalVentasMes}
            onRegistrarGasto={handleCrearGasto}
          />
        )}

        {activeTab === 'clientes' && (
          <ClientesDirectorioView
            embedded={true}
            onIrAFiados={handleIrAFiados}
          />
        )}

        {activeTab === 'cuentas-cobrar' && (
          <CuentasPorCobrarFiadosView clienteInicialId={clienteFiadoSeleccionadoId} />
        )}
      </div>

      <GastoFormSheet
        open={sheetGastoOpen}
        onOpenChange={setSheetGastoOpen}
        onGastoRegistrado={handleCrearGasto}
      />
    </div>
  );
};

export default GastosPage;
