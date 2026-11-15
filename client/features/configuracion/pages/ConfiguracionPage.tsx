import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { configuracionService } from '../services/configuracionService';
import { ConfiguracionSistema } from '../types/configuracion.types';
import { EmpresaConfigView } from '../components/EmpresaConfigView';
import { SunatConfigView } from '../components/SunatConfigView';
import { HardwarePosView } from '../components/HardwarePosView';
import { ParametrosSistemaView } from '../components/ParametrosSistemaView';

export interface ConfiguracionPageProps {
  embedded?: boolean;
  seccionVisible?: 'todas' | 'empresa' | 'sistema' | 'sunat' | 'hardware';
}

export const ConfiguracionPage: React.FC<ConfiguracionPageProps> = ({
  embedded = false,
  seccionVisible = 'todas',
}) => {
  const [config, setConfig] = useState<ConfiguracionSistema | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    configuracionService.getConfiguracion().then((data) => {
      setConfig(data);
      setLoading(false);
    });
  }, []);

  const handleUpdateEmpresa = (field: string, val: string) => {
    if (!config) return;
    setConfig({
      ...config,
      empresa: {
        ...config.empresa,
        [field]: val,
      },
    });
  };

  const handleUpdatePos = (field: string, val: any) => {
    if (!config) return;
    setConfig({
      ...config,
      pos: {
        ...(config.pos || {
          anchoPapel: '80mm',
          autoImprimir: false,
          abrirGaveta: true,
          mensajePie: "¡Gracias por su compra en KIPU'S! Vuelva pronto.",
          cortarPapel: true,
          sonidosActivos: true,
        }),
        [field]: val,
      },
    });
  };

  const handleUpdateParametro = (field: string, val: any) => {
    if (!config) return;
    setConfig({
      ...config,
      [field]: val,
    });
  };

  const handleSyncBaseDatos = async () => {
    const data = await configuracionService.getConfiguracion();
    setConfig(data);
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      await configuracionService.guardarConfiguracion(config);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted/40 rounded animate-pulse" />
        <div className="h-64 bg-muted/20 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          title="Configuración del Sistema"
          description="Datos de la empresa, facturación electrónica, series y hardware de punto de venta"
          badge="Parámetros Globales"
        />
      )}

      {seccionVisible === 'empresa' && (
        <EmpresaConfigView
          empresa={config.empresa}
          onUpdateEmpresa={handleUpdateEmpresa}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {seccionVisible === 'sunat' && (
        <SunatConfigView
          series={config.series}
          ruc={config.empresa.ruc}
          razonSocial={config.empresa.razonSocial}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {seccionVisible === 'hardware' && (
        <HardwarePosView
          pos={
            config.pos || {
              anchoPapel: '80mm',
              autoImprimir: false,
              abrirGaveta: true,
              mensajePie: "¡Gracias por su compra en KIPU'S! Vuelva pronto.",
              cortarPapel: true,
              sonidosActivos: true,
            }
          }
          empresaRuc={config.empresa.ruc}
          empresaRazon={config.empresa.razonSocial}
          empresaComercial={config.empresa.nombreComercial}
          empresaDireccion={config.empresa.direccionFiscal}
          empresaTelefono={config.empresa.telefono}
          empresaCorreo={config.empresa.correo}
          onUpdatePos={handleUpdatePos}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {seccionVisible === 'sistema' && (
        <ParametrosSistemaView
          tasaIgv={config.tasaIgv}
          monedaPrincipal={config.monedaPrincipal}
          permitirVentaSinStock={config.permitirVentaSinStock}
          onUpdateParametro={handleUpdateParametro}
          onSyncBaseDatos={handleSyncBaseDatos}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {seccionVisible === 'todas' && (
        <div className="space-y-8">
          <EmpresaConfigView
            empresa={config.empresa}
            onUpdateEmpresa={handleUpdateEmpresa}
            onSave={handleSave}
            isSaving={isSaving}
          />
          <SunatConfigView
            series={config.series}
            ruc={config.empresa.ruc}
            razonSocial={config.empresa.razonSocial}
            onSave={handleSave}
            isSaving={isSaving}
          />
          <HardwarePosView
            pos={
              config.pos || {
                anchoPapel: '80mm',
                autoImprimir: false,
                abrirGaveta: true,
                mensajePie: "¡Gracias por su compra en KIPU'S! Vuelva pronto.",
                cortarPapel: true,
                sonidosActivos: true,
              }
            }
            empresaRuc={config.empresa.ruc}
            empresaRazon={config.empresa.razonSocial}
            empresaComercial={config.empresa.nombreComercial}
            empresaDireccion={config.empresa.direccionFiscal}
            empresaTelefono={config.empresa.telefono}
            empresaCorreo={config.empresa.correo}
            onUpdatePos={handleUpdatePos}
            onSave={handleSave}
            isSaving={isSaving}
          />
          <ParametrosSistemaView
            tasaIgv={config.tasaIgv}
            monedaPrincipal={config.monedaPrincipal}
            permitirVentaSinStock={config.permitirVentaSinStock}
            onUpdateParametro={handleUpdateParametro}
            onSyncBaseDatos={handleSyncBaseDatos}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>
      )}
    </div>
  );
};

export default ConfiguracionPage;
