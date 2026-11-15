import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { CatalogoProductosView } from '../components/CatalogoProductosView';
import { ControlStockView } from '../components/ControlStockView';
import { KardexMovimientosView } from '../components/KardexMovimientosView';
import { CategoriasUnidadesView } from '../components/CategoriasUnidadesView';

export type InventarioTab = 'catalogo' | 'stock' | 'kardex' | 'categorias';

const TAB_CONFIG: Record<
  InventarioTab,
  { label: string; description: string }
> = {
  catalogo: {
    label: 'Catálogo de Productos',
    description: 'Búsqueda reactiva, edición con panel deslizable y control comercial de productos.',
  },
  stock: {
    label: 'Control de Stock y Ajustes',
    description: 'Existencias físicas por almacén, alertas de quiebre de stock y calibración de inventario.',
  },
  kardex: {
    label: 'Kardex y Movimientos',
    description: 'Trazabilidad de entradas, salidas, documentos de origen y saldo valorizado.',
  },
  categorias: {
    label: 'Categorías y Unidades',
    description: 'Clasificaciones comerciales y catálogo de unidades de medida homologadas con SUNAT.',
  },
};

/**
 * Orquestador principal del módulo de INVENTARIO Y PRODUCTOS de KIPU'S ERP.
 * Gobernado directamente por el submenú del Sidebar mediante `?tab=`.
 */
export const InventarioPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const activeTab: InventarioTab = useMemo(() => {
    const rawTab = searchParams.get('tab');
    if (rawTab === 'stock' || rawTab === 'ajustes' || rawTab === 'inventario-fisico') {
      return 'stock';
    }
    if (rawTab === 'kardex' || rawTab === 'entradas-salidas') {
      return 'kardex';
    }
    if (rawTab === 'categorias') {
      return 'categorias';
    }
    return 'catalogo';
  }, [searchParams]);

  const currentInfo = TAB_CONFIG[activeTab];

  return (
    <div className="space-y-4">
      {/* Cabecera Ergonómica Contextual */}
      <PageHeader
        title="Inventario y Productos"
        description={currentInfo.description}
        badge={currentInfo.label}
      />

      {/* Vistas Modulares Desacopladas (gobernadas por el Sidebar) */}
      <div className="pt-0">
        {activeTab === 'catalogo' && (
          <ErrorBoundary moduleName="Catálogo de Productos">
            <CatalogoProductosView />
          </ErrorBoundary>
        )}

        {activeTab === 'stock' && (
          <ErrorBoundary moduleName="Control de Stock y Ajustes">
            <ControlStockView />
          </ErrorBoundary>
        )}

        {activeTab === 'kardex' && (
          <ErrorBoundary moduleName="Kardex y Movimientos">
            <KardexMovimientosView />
          </ErrorBoundary>
        )}

        {activeTab === 'categorias' && (
          <ErrorBoundary moduleName="Categorías y Unidades">
            <CategoriasUnidadesView />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
};

export default InventarioPage;
