import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { configuracionService } from '../services/configuracionService';
import { ConfiguracionSistema } from '../types/configuracion.types';
import { Settings, Save, Building, FileCheck, CheckCircle2, RotateCcw } from 'lucide-react';
import { erpStore } from '@/services/erp/erpStore';
import { toast } from 'sonner';

export const ConfiguracionPage: React.FC = () => {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setIsSaving(true);
    try {
      await configuracionService.guardarConfiguracion(config);
      toast.success('Configuración de la empresa guardada correctamente');
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-muted/40 rounded animate-pulse" />
        <div className="h-64 bg-muted/20 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de la Empresa y Parámetros"
        description="Datos de facturación electrónica, series de comprobantes y preferencias generales del sistema"
        badge="Parámetros Globales"
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Datos de la Empresa */}
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Datos Fiscales de la Empresa (Emisor SUNAT)
            </CardTitle>
            <CardDescription className="text-xs">
              Esta información se imprime en el encabezado de las boletas y facturas electrónicas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">RUC del Negocio</Label>
                <Input
                  value={config.empresa.ruc}
                  onChange={(e) => handleUpdateEmpresa('ruc', e.target.value)}
                  className="h-8 text-xs font-mono font-semibold"
                  required
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Razón Social Legal</Label>
                <Input
                  value={config.empresa.razonSocial}
                  onChange={(e) => handleUpdateEmpresa('razonSocial', e.target.value)}
                  className="h-8 text-xs font-semibold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre Comercial / Marca</Label>
                <Input
                  value={config.empresa.nombreComercial}
                  onChange={(e) => handleUpdateEmpresa('nombreComercial', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Régimen Tributario</Label>
                <Input
                  value={config.empresa.regimenTributario}
                  onChange={(e) => handleUpdateEmpresa('regimenTributario', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Dirección Fiscal / Establecimiento Anexo</Label>
                <Input
                  value={config.empresa.direccionFiscal}
                  onChange={(e) => handleUpdateEmpresa('direccionFiscal', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Teléfonos de Contacto</Label>
                <Input
                  value={config.empresa.telefono}
                  onChange={(e) => handleUpdateEmpresa('telefono', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Series de Comprobantes */}
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Series de Facturación y Correlativos Activos
            </CardTitle>
            <CardDescription className="text-xs">
              Series autorizadas para la emisión de comprobantes en este punto de venta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/40">
                    <TableHead className="text-xs font-semibold">Tipo de Comprobante</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Serie</TableHead>
                    <TableHead className="text-xs font-semibold text-center">
                      Próximo Correlativo
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.series.map((s, idx) => (
                    <TableRow key={idx} className="text-xs">
                      <TableCell className="font-semibold text-foreground">{s.tipo}</TableCell>
                      <TableCell className="text-center font-mono font-bold text-primary">
                        {s.serie}
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold">
                        {String(s.siguienteNumero).padStart(6, '0')}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          Activo
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Parámetros Generales */}
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Parámetros Operativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Tasa del Impuesto General a las Ventas (IGV)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={config.tasaIgv}
                    readOnly
                    className="h-8 text-xs w-24 bg-muted/40 font-bold"
                  />
                  <span className="text-xs text-muted-foreground">% (Estándar Nacional Perú)</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Moneda Principal del Sistema</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value="PEN (Soles - S/)"
                    readOnly
                    className="h-8 text-xs w-48 bg-muted/40 font-bold"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zona de Simulación y Datos Demo */}
        <Card className="border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              Simulación y Datos de Demostración (Minimarket / Bodega)
            </CardTitle>
            <CardDescription className="text-xs">
              Todos los módulos (Ventas, Inventario, Kardex, Caja, Compras y Gastos) están interconectados y sincronizados.
              Puedes restablecer los datos de ejemplo del minimarket en cualquier momento.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              Catálogo actual: <span className="font-semibold text-foreground">30 productos de abarrotes, lácteos, bebidas, snacks y limpieza</span> con stock, kardex y caja inicial sincronizados.
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                erpStore.restablecerDatosMinimarket();
                toast.success('Datos del Minimarket restablecidos al estado inicial');
              }}
              className="h-9 text-xs gap-2 shrink-0 border-border"
            >
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              Restablecer Datos Demo Minimarket
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="gap-2 bg-primary text-primary-foreground font-semibold px-6 shadow-sm"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Todos los Cambios'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ConfiguracionPage;
