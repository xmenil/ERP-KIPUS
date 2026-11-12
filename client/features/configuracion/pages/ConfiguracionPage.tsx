import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { ticketPrintService } from '@/features/ventas/services/ticketPrintService';
import { audioFeedbackService } from '@/features/ventas/services/audioFeedbackService';
import { Settings, Save, Building, FileCheck, CheckCircle2, RotateCcw, ShieldCheck, ArrowRight, Printer, Volume2 } from 'lucide-react';
import { APP_ROUTES } from '@/constants/routes';
import { toast } from 'sonner';

export interface ConfiguracionPageProps {
  embedded?: boolean;
  seccionVisible?: 'todas' | 'empresa' | 'sistema';
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

  const handleImprimirTicketPrueba = async () => {
    if (!config) return;
    const ticketPrueba = {
      empresa: {
        ruc: config.empresa.ruc,
        razonSocial: config.empresa.razonSocial,
        nombreComercial: config.empresa.nombreComercial,
        direccionFiscal: config.empresa.direccionFiscal,
        telefono: config.empresa.telefono,
        correo: config.empresa.correo,
      },
      comprobante: {
        id: 'test-ticket-id',
        tipoComprobante: 'TICKET PRUEBA',
        serieCorrelativo: 'TEST-000001',
        fecha: new Date().toLocaleDateString('es-PE'),
        hora: new Date().toLocaleTimeString('es-PE'),
      },
      cajero: 'Cajero de Prueba',
      sucursal: 'Sede Central',
      cliente: {
        nombre: 'Cliente de Prueba',
        documento: '00000000',
      },
      items: [
        {
          sku: 'DEMO-001',
          nombre: 'Producto de Prueba POS 1',
          cantidad: 2,
          precioUnitario: 5.0,
          subtotal: 10.0,
        },
        {
          sku: 'DEMO-002',
          nombre: 'Bebida Energizante 500ml',
          cantidad: 1,
          precioUnitario: 4.5,
          subtotal: 4.5,
        },
      ],
      totales: {
        opGravada: 12.29,
        opExonerada: 0,
        igv: 2.21,
        descuento: 0,
        total: 14.5,
        totalEnLetras: 'SON: CATORCE CON 50/100 SOLES',
      },
      pago: {
        metodoPago: 'EFECTIVO',
        montoRecibido: 20.0,
        vuelto: 5.5,
      },
      pie: {
        mensaje: config.pos?.mensajePie || "¡Gracias por su compra en KIPU'S! Vuelva pronto.",
        resolucionSunat: 'Representación impresa de Comprobante de Prueba',
        hashCpe: 'a1b2c3d4e5f6',
      },
    };

    audioFeedbackService.playSuccessBeep();
    await ticketPrintService.imprimirTicket(ticketPrueba as any, config.pos?.anchoPapel || '80mm');
    toast.success('Ticket de prueba enviado a la impresora');
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
      {!embedded && (
        <PageHeader
          title="Configuración de la Empresa y Parámetros"
          description="Datos de facturación electrónica, series de comprobantes y preferencias generales del sistema"
          badge="Parámetros Globales"
        />
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Datos de la Empresa y Sucursales */}
        {(seccionVisible === 'todas' || seccionVisible === 'empresa') && (
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Datos Fiscales de la Empresa y Sucursal (Emisor SUNAT)
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
        )}

        {(seccionVisible === 'todas' || seccionVisible === 'sistema') && (
          <>
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

            {/* Configuración de Hardware POS e Impresora Térmica */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Printer className="h-5 w-5 text-primary" />
                      Hardware POS, Impresora Térmica y Gaveta de Dinero
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Parámetros de impresión de tickets para ticketeras térmicas Epson, Xprinter, Bixolon y lectores de código de barras
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImprimirTicketPrueba}
                    className="text-xs gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5 text-primary" />
                    <span>Imprimir Prueba</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Ancho del Papel Térmico</Label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="anchoPapel"
                          value="80mm"
                          checked={(config.pos?.anchoPapel || '80mm') === '80mm'}
                          onChange={() => handleUpdatePos('anchoPapel', '80mm')}
                          className="text-primary"
                        />
                        <span className="font-medium">80 mm (Estándar - 48 cols)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="anchoPapel"
                          value="58mm"
                          checked={config.pos?.anchoPapel === '58mm'}
                          onChange={() => handleUpdatePos('anchoPapel', '58mm')}
                          className="text-primary"
                        />
                        <span className="font-medium">58 mm (Compacto - 32 cols)</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Mensaje al Pie del Ticket</Label>
                    <Input
                      value={config.pos?.mensajePie || "¡Gracias por su compra en KIPU'S! Vuelva pronto."}
                      onChange={(e) => handleUpdatePos('mensajePie', e.target.value)}
                      className="h-8 text-xs"
                      placeholder="Ej. ¡Gracias por su compra! Vuelva pronto."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60">
                  <label className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.pos?.autoImprimir ?? false}
                      onChange={(e) => handleUpdatePos('autoImprimir', e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <div>
                      <div className="font-semibold text-foreground">Impresión Automática</div>
                      <div className="text-[10px] text-muted-foreground">Disparar impresión al finalizar cobro</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.pos?.abrirGaveta ?? true}
                      onChange={(e) => handleUpdatePos('abrirGaveta', e.target.checked)}
                      className="rounded border-border text-primary"
                    />
                    <div>
                      <div className="font-semibold text-foreground">Apertura de Gaveta RJ11</div>
                      <div className="text-[10px] text-muted-foreground">Abrir cajón al cobrar en efectivo</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.pos?.sonidosActivos ?? true}
                      onChange={(e) => {
                        handleUpdatePos('sonidosActivos', e.target.checked);
                        audioFeedbackService.setMuted(!e.target.checked);
                      }}
                      className="rounded border-border text-primary"
                    />
                    <div>
                      <div className="font-semibold text-foreground">Beeps de Escáner y POS</div>
                      <div className="text-[10px] text-muted-foreground">Feedback sonoro en mostrador</div>
                    </div>
                  </label>
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
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground">
                  Catálogo actual: <span className="font-semibold text-foreground">30 productos de abarrotes, lácteos, bebidas, snacks y limpieza</span> sincronizados con stock y kardex.
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    const data = await configuracionService.getConfiguracion();
                    setConfig(data);
                    toast.success('Configuración sincronizada con la base de datos');
                  }}
                  className="h-9 text-xs gap-2 shrink-0 border-border"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                  Sincronizar con Base de Datos
                </Button>
              </CardContent>
            </Card>
          </>
        )}

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
