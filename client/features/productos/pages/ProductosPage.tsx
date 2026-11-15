import React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { CatalogoProductosView } from '@/features/inventario/components/CatalogoProductosView';

/**
 * Vista de Catálogo de Productos de KIPU'S ERP.
 * Descompuesta en vistas modulares desacopladas con panel lateral Sheet.
 */
export const ProductosPage: React.FC = () => {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Catálogo de Productos"
        description="Gestión integral de productos, precios comerciales, márgenes y códigos de barras."
      />
      <ErrorBoundary moduleName="Catálogo de Productos">
        <CatalogoProductosView />
      </ErrorBoundary>
    </div>
  );
};

export default ProductosPage;
