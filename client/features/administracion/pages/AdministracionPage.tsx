import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsuariosPage } from '@/features/usuarios/pages/UsuariosPage';
import { ConfiguracionPage } from '@/features/configuracion/pages/ConfiguracionPage';
import { ShieldCheck, Building, Settings } from 'lucide-react';

type TabAdmin = 'usuarios' | 'sucursales' | 'sistema';

export const AdministracionPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  const getValidTab = (tab: string | null): TabAdmin => {
    if (tab === 'usuarios' || tab === 'sucursales' || tab === 'sistema') {
      return tab;
    }
    return 'usuarios';
  };

  const [activeTab, setActiveTab] = useState<TabAdmin>(() => getValidTab(tabFromUrl));

  useEffect(() => {
    const valid = getValidTab(tabFromUrl);
    if (valid !== activeTab) {
      setActiveTab(valid);
    }
  }, [tabFromUrl]);

  const handleTabChange = (val: string) => {
    const nextTab = val as TabAdmin;
    setActiveTab(nextTab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextTab === 'usuarios') {
          next.delete('tab');
        } else {
          next.set('tab', nextTab);
        }
        return next;
      },
      { replace: true }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administración del Sistema"
        description="Gestión integral de usuarios, roles, permisos de acceso, datos de la empresa y configuración operativa"
        badge="Módulo Administrativo"
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-4">
        <TabsList className="bg-muted/70 p-1 flex overflow-x-auto flex-nowrap sm:flex-wrap h-auto gap-1 border border-border/60 max-w-full scrollbar-none justify-start">
          <TabsTrigger value="usuarios" className="text-xs font-semibold py-1.5 px-3 gap-1.5 shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Usuarios, Roles y Permisos</span>
          </TabsTrigger>

          <TabsTrigger value="sucursales" className="text-xs font-medium py-1.5 px-3 gap-1.5 shrink-0">
            <Building className="h-3.5 w-3.5" />
            <span>Empresa y Sucursales</span>
          </TabsTrigger>

          <TabsTrigger value="sistema" className="text-xs font-medium py-1.5 px-3 gap-1.5 shrink-0">
            <Settings className="h-3.5 w-3.5" />
            <span>Facturación y Parámetros</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="space-y-4 m-0 focus-visible:outline-none">
          <UsuariosPage embedded={true} />
        </TabsContent>

        <TabsContent value="sucursales" className="space-y-4 m-0 focus-visible:outline-none">
          <ConfiguracionPage embedded={true} seccionVisible="empresa" />
        </TabsContent>

        <TabsContent value="sistema" className="space-y-4 m-0 focus-visible:outline-none">
          <ConfiguracionPage embedded={true} seccionVisible="sistema" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdministracionPage;

