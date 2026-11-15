import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import { OrdenesCompraView } from '../components/OrdenesCompraView';
import { RecepcionMercaderiaView } from '../components/RecepcionMercaderiaView';
import { ProveedoresDirectorioView } from '../components/ProveedoresDirectorioView';
import { CuentasPorPagarView } from '../components/CuentasPorPagarView';
import { NuevaCompraDialog } from '../components/NuevaCompraDialog';
import { RecomendacionComprasModal } from '../components/RecomendacionComprasModal';
import { useComprasData } from '../hooks/useComprasData';
import { CompraItemDetalle } from '../types/compras.types';
import { PlusCircle, Sparkles } from 'lucide-react';

type ComprasTab = 'ordenes' | 'recepcion' | 'proveedores' | 'cuentas-pagar';

const TAB_TITLES: Record<ComprasTab, string> = {
  ordenes: 'Órdenes de Compra',
  recepcion: 'Recepción de Mercadería',
  proveedores: 'Directorio de Proveedores',
  'cuentas-pagar': 'Cuentas por Pagar',
};

export const ComprasPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as ComprasTab | null;

  const activeTab: ComprasTab =
    tabParam && ['ordenes', 'recepcion', 'proveedores', 'cuentas-pagar'].includes(tabParam)
      ? tabParam
      : 'ordenes';

  const { compras, loading, sugerencias, fetchCompras, registrarCompra, actualizarEstado } = useComprasData();

  const [compraParaRecepcionarId, setCompraParaRecepcionarId] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalRecomendacionOpen, setModalRecomendacionOpen] = useState(false);
  const [itemsParaOrden, setItemsParaOrden] = useState<CompraItemDetalle[] | null>(null);
  const [proveedorParaOrden, setProveedorParaOrden] = useState<{ razonSocial: string; ruc: string } | null>(null);

  const handleAbrirNuevaOrden = (items?: CompraItemDetalle[] | null, prov?: { razonSocial: string; ruc: string } | null) => {
    setItemsParaOrden(items || null);
    setProveedorParaOrden(prov || null);
    setOpenModal(true);
  };

  const handleIrARecepcion = (compraId: string) => {
    setCompraParaRecepcionarId(compraId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'recepcion');
      return next;
    }, { replace: true });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Compras y Proveedores"
        description="Órdenes de compra, recepción física en almacén, directorio de proveedores y cuentas por pagar."
        badge={TAB_TITLES[activeTab]}
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalRecomendacionOpen(true)}
            className="h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary-soft text-xs font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Sugerencias KIPU'S</span>
            {sugerencias.totalProductosSugeridos > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-danger-soft text-danger-text text-[10px] font-bold">
                {sugerencias.totalProductosSugeridos}
              </span>
            )}
          </Button>

          <Button
            size="sm"
            onClick={() => handleAbrirNuevaOrden()}
            className="h-8 gap-1.5 bg-primary text-primary-foreground font-semibold text-xs shadow-xs"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{user?.rol === 'ALMACENERO' || user?.rol === 'SUPERVISOR' ? 'Registrar recepción' : 'Nueva orden'}</span>
          </Button>
        </div>
      </PageHeader>

      <div className="pt-0">
        {activeTab === 'ordenes' && (
          <OrdenesCompraView
            compras={compras}
            loading={loading}
            sugerencias={sugerencias}
            onNuevaOrden={() => handleAbrirNuevaOrden()}
            onAbrirSugerencias={() => setModalRecomendacionOpen(true)}
            onActualizarEstado={actualizarEstado}
            onIrARecepcion={handleIrARecepcion}
          />
        )}

        {activeTab === 'recepcion' && (
          <RecepcionMercaderiaView
            compras={compras}
            compraSeleccionadaId={compraParaRecepcionarId}
            onRecepcionCompletada={fetchCompras}
          />
        )}

        {activeTab === 'proveedores' && (
          <ProveedoresDirectorioView embedded={true} />
        )}

        {activeTab === 'cuentas-pagar' && (
          <CuentasPorPagarView />
        )}
      </div>

      <RecomendacionComprasModal
        open={modalRecomendacionOpen}
        onOpenChange={setModalRecomendacionOpen}
        sugerencias={sugerencias}
        onProcederOrden={(items, prov) => handleAbrirNuevaOrden(items, prov)}
      />

      <NuevaCompraDialog
        open={openModal}
        onOpenChange={setOpenModal}
        onCompraRegistrada={registrarCompra}
        itemsIniciales={itemsParaOrden}
        proveedorInicial={proveedorParaOrden}
        onAbrirRecomendacion={() => {
          setOpenModal(false);
          setModalRecomendacionOpen(true);
        }}
      />
    </div>
  );
};

export default ComprasPage;
