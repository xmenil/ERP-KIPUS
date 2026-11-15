import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ConfiguracionPos } from '../types/configuracion.types';
import { VentaTicketData } from '@/features/ventas/types/ticket.types';
import { ticketPrintService } from '@/features/ventas/services/ticketPrintService';
import { audioFeedbackService } from '@/features/ventas/services/audioFeedbackService';
import {
  Printer,
  Volume2,
  VolumeX,
  CreditCard,
  Save,
  CheckCircle2,
  FileText,
  DollarSign,
  Scissors,
} from 'lucide-react';
import { toast } from 'sonner';

interface HardwarePosViewProps {
  pos: ConfiguracionPos;
  empresaRuc: string;
  empresaRazon: string;
  empresaComercial: string;
  empresaDireccion: string;
  empresaTelefono: string;
  empresaCorreo: string;
  onUpdatePos: (field: string, val: any) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export const HardwarePosView: React.FC<HardwarePosViewProps> = ({
  pos,
  empresaRuc,
  empresaRazon,
  empresaComercial,
  empresaDireccion,
  empresaTelefono,
  empresaCorreo,
  onUpdatePos,
  onSave,
  isSaving,
}) => {
  const [localSaving, setLocalSaving] = useState(false);
  const [imprimiendoPrueba, setImprimiendoPrueba] = useState(false);

  const anchoActual = pos?.anchoPapel || '80mm';

  const handleImprimirTicketPrueba = async () => {
    setImprimiendoPrueba(true);
    try {
      const ticketPrueba: VentaTicketData = {
        empresa: {
          ruc: empresaRuc || '20000000001',
          razonSocial: empresaRazon || 'EMPRESA DEMO S.A.C.',
          nombreComercial: empresaComercial || "KIPU'S POS",
          direccionFiscal: empresaDireccion || 'Av. Principal 123, Lima',
          telefono: empresaTelefono || '01-234-5678',
          correo: empresaCorreo || 'contacto@empresa.pe',
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
          metodoPago: 'Efectivo',
          montoRecibido: 20.0,
          vuelto: 5.5,
        },
        pie: {
          mensaje: pos?.mensajePie || "¡Gracias por su compra en KIPU'S!",
          resolucionSunat: 'AUTORIZADO MEDIANTE RES. N° 034-005-0005315/SUNAT',
          hashCpe: 'a1b2c3d4e5f6g7h8i9j0',
        },
      };

      await ticketPrintService.imprimirTicket(ticketPrueba, anchoActual);

      if (pos?.sonidosActivos) {
        audioFeedbackService.playCashChime();
      }

      toast.success('Orden de impresión de prueba enviada a la ticketera');
    } catch {
      toast.error('No se pudo enviar la impresión de prueba');
    } finally {
      setImprimiendoPrueba(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalSaving(true);
    try {
      await onSave();
      toast.success(
        `Hardware guardado: Papel ${anchoActual}, Gaveta ${pos?.abrirGaveta ? 'activa' : 'desactivada'}`
      );
    } catch {
      toast.error('Error al guardar la configuración de hardware');
    } finally {
      setLocalSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 select-none">
      {/* 1. Selector Visual de Formato Térmico (Gestalt Similitud y Cerramiento) */}
      <Card className="border-border/80 bg-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Printer className="h-4 w-4 text-primary" />
              <span>Formato de Papel Térmico</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Selecciona el ancho según el modelo de ticketera instalada en el punto de venta
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImprimirTicketPrueba}
            disabled={imprimiendoPrueba}
            className="h-8 text-xs gap-1.5 border-border"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            <span>{imprimiendoPrueba ? 'Imprimiendo...' : 'Imprimir Ticket de Prueba'}</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opción 80mm */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                onUpdatePos('anchoPapel', '80mm');
                toast.info('Formato de impresión cambiado a 80 mm (Estándar de mostrador)');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onUpdatePos('anchoPapel', '80mm');
                  toast.info('Formato de impresión cambiado a 80 mm (Estándar de mostrador)');
                }
              }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                anchoActual === '80mm'
                  ? 'border-primary bg-primary-soft/40 shadow-xs'
                  : 'border-border/80 bg-card hover:border-border'
              }`}
            >
              <div
                className={`p-2 rounded-md ${
                  anchoActual === '80mm' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground">80 mm (Estándar de Mostrador)</span>
                  {anchoActual === '80mm' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary text-primary-foreground">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Recomendado para impresoras Epson, Xprinter, Bixolon, Sam4s (48 columnas).
                </p>
              </div>
            </div>

            {/* Opción 58mm */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                onUpdatePos('anchoPapel', '58mm');
                toast.info('Formato de impresión cambiado a 58 mm (Compacto / Portátil)');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onUpdatePos('anchoPapel', '58mm');
                  toast.info('Formato de impresión cambiado a 58 mm (Compacto / Portátil)');
                }
              }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                anchoActual === '58mm'
                  ? 'border-primary bg-primary-soft/40 shadow-xs'
                  : 'border-border/80 bg-card hover:border-border'
              }`}
            >
              <div
                className={`p-2 rounded-md ${
                  anchoActual === '58mm' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground">58 mm (Compacto / Portátil)</span>
                  {anchoActual === '58mm' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary text-primary-foreground">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Ticketeras pequeñas bluetooth o USB de bajo costo (32 columnas).
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <Label className="text-xs font-semibold">Mensaje de Despedida al Pie del Ticket</Label>
            <Input
              value={pos?.mensajePie || "¡Gracias por su compra en KIPU'S! Vuelva pronto."}
              onChange={(e) => onUpdatePos('mensajePie', e.target.value)}
              className="h-8 text-xs"
              placeholder="Ej. ¡Gracias por su preferencia! Vuelva pronto."
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. Opciones de Automatización del Mostrador */}
      <Card className="border-border/80 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
            <CreditCard className="h-4 w-4 text-primary" />
            <span>Comportamiento de Hardware en el Mostrador</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Acciones automáticas disparadas al momento de confirmar un cobro en el POS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={pos?.autoImprimir ?? false}
                onChange={(e) => onUpdatePos('autoImprimir', e.target.checked)}
                className="rounded border-border text-primary h-4 w-4"
              />
              <div className="space-y-0.5">
                <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Impresión Automática</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Lanzar impresión de ticket sin esperar confirmación adicional.
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={pos?.abrirGaveta ?? true}
                onChange={(e) => onUpdatePos('abrirGaveta', e.target.checked)}
                className="rounded border-border text-primary h-4 w-4"
              />
              <div className="space-y-0.5">
                <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Apertura de Gaveta RJ11</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Enviar pulso a la gaveta de dinero en cobros en efectivo.
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={pos?.cortarPapel ?? true}
                onChange={(e) => onUpdatePos('cortarPapel', e.target.checked)}
                className="rounded border-border text-primary h-4 w-4"
              />
              <div className="space-y-0.5">
                <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Corte Automático de Papel</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Activar guillotina de la ticketera al finalizar la impresión.
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={pos?.sonidosActivos ?? true}
                onChange={(e) => {
                  onUpdatePos('sonidosActivos', e.target.checked);
                  audioFeedbackService.setMuted(!e.target.checked);
                }}
                className="rounded border-border text-primary h-4 w-4"
              />
              <div className="space-y-0.5">
                <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  {(pos?.sonidosActivos ?? true) ? (
                    <Volume2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span>Feedback Auditivo (Beeps)</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Emitir pitido de confirmación al escanear código y cobrar.
                </div>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          disabled={isSaving || localSaving}
          className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-5 h-8 text-xs shadow-xs"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{isSaving || localSaving ? 'Guardando...' : 'Guardar Parámetros de Hardware'}</span>
        </Button>
      </div>
    </form>
  );
};
