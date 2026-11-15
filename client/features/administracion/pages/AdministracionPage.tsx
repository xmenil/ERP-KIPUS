import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { UsuariosPage } from '@/features/usuarios/pages/UsuariosPage';
import { ConfiguracionPage } from '@/features/configuracion/pages/ConfiguracionPage';

export type TabAdmin = 'usuarios' | 'empresa' | 'sunat' | 'hardware' | 'sistema';

const TAB_TITLES: Record<TabAdmin, string> = {
  usuarios: 'Usuarios y Roles',
  empresa: 'Empresa y Sucursales',
  sunat: 'Facturación y SUNAT',
  hardware: 'Hardware y POS',
  sistema: 'Parámetros del Sistema',
};

export const AdministracionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  const activeTab: TabAdmin = useMemo(() => {
    if (
      tabFromUrl === 'usuarios' ||
      tabFromUrl === 'empresa' ||
      tabFromUrl === 'sunat' ||
      tabFromUrl === 'hardware' ||
      tabFromUrl === 'sistema'
    ) {
      return tabFromUrl;
    }
    if (tabFromUrl === 'sucursales') {
      return 'empresa';
    }
    return 'usuarios';
  }, [tabFromUrl]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Administración del Sistema"
        description="Gestión integral de usuarios, roles, parámetros fiscales, facturación electrónica y periféricos de punto de venta."
        badge={TAB_TITLES[activeTab]}
      />

      <div className="pt-0">
        {activeTab === 'usuarios' && (
          <UsuariosPage embedded={true} />
        )}

        {activeTab === 'empresa' && (
          <ConfiguracionPage embedded={true} seccionVisible="empresa" />
        )}

        {activeTab === 'sunat' && (
          <ConfiguracionPage embedded={true} seccionVisible="sunat" />
        )}

        {activeTab === 'hardware' && (
          <ConfiguracionPage embedded={true} seccionVisible="hardware" />
        )}

        {activeTab === 'sistema' && (
          <ConfiguracionPage embedded={true} seccionVisible="sistema" />
        )}
      </div>
    </div>
  );
};

export default AdministracionPage;
