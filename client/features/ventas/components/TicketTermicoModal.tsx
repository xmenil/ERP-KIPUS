import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Vault, Copy, Check, Eye } from 'lucide-react';
import { ticketPrintService } from '../services/ticketPrintService';
import { VentaTicketData, ConfiguracionPos } from '../types/ticket.types';
import { audioFeedbackService } from '../services/audioFeedbackService';
import { toast } from 'sonner';

interface TicketTermicoModalProps {
  ventaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TicketTermicoModal: React.FC<TicketTermicoModalProps> = ({
  ventaId,
  open,
  onOpenChange,
}) => {
  const [ticketData, setTicketData] = useState<VentaTicketData | null>(null);
  const [posConfig, setPosConfig] = useState<ConfiguracionPos | null>(null);
  const [ancho, setAncho] = useState<'80mm' | '58mm'>('80mm');
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (open && ventaId) {
      setLoading(true);
      Promise.all([
        ticketPrintService.obtenerDatosTicket(ventaId),
        ticketPrintService.obtenerConfiguracionPos(),
      ])
        .then(([ticket, config]) => {
          setTicketData(ticket);
          setPosConfig(config);
          if (config?.anchoPapel) {
            setAncho(config.anchoPapel);
          }
        })
        .catch(() => {
          toast.error('No se pudieron cargar los datos del comprobante');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, ventaId]);

  const handlePrint = async () => {
    if (!ticketData) return;
    try {
      if (posConfig?.abrirGaveta) {
        audioFeedbackService.playCashChime();
      }
      await ticketPrintService.imprimirTicket(ticketData, ancho);
      toast.success('Ticket enviado al spooler de impresión');
    } catch {
      toast.error('Error al imprimir el comprobante');
    }
  };

  const handleAbrirGaveta = () => {
    ticketPrintService.abrirGavetaPortamonedas();
    audioFeedbackService.playCashChime();
    toast.success('Pulso de apertura enviado a la gaveta de dinero');
  };

  const handleCopiarTexto = () => {
    if (!ticketData) return;
    const txt = `
${ticketData.empresa.nombreComercial || ticketData.empresa.razonSocial}
RUC: ${ticketData.empresa.ruc}
${ticketData.empresa.direccionFiscal}
----------------------------------------
${ticketData.comprobante.tipoComprobante}: ${ticketData.comprobante.serieCorrelativo}
Fecha: ${ticketData.comprobante.fecha} ${ticketData.comprobante.hora}
Cliente: ${ticketData.cliente.nombre} (${ticketData.cliente.documento})
----------------------------------------
${ticketData.items.map((i) => `${i.cantidad} x ${i.nombre} = S/ ${i.subtotal.toFixed(2)}`).join('\n')}
----------------------------------------
TOTAL: S/ ${ticketData.totales.total.toFixed(2)}
${ticketData.totales.totalEnLetras}
Forma de Pago: ${ticketData.pago.metodoPago}
----------------------------------------
${ticketData.pie.mensaje}
    `.trim();

    navigator.clipboard?.writeText(txt);
    setCopiado(true);
    toast.success('Texto del ticket copiado al portapapeles');
    setTimeout(() => setCopiado(false), 2000);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="pb-2 border-b border-border/80 flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              Vista Previa de Impresión Térmica
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Formato POS optimizado para ticketeras térmicas Epson, Xprinter y Bixolon
            </p>
          </div>

          {/* Selector de Ancho */}
          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setAncho('80mm')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                ancho === '80mm'
                  ? 'bg-background shadow-xs text-foreground font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              80mm
            </button>
            <button
              type="button"
              onClick={() => setAncho('58mm')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                ancho === '58mm'
                  ? 'bg-background shadow-xs text-foreground font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              58mm
            </button>
          </div>
        </DialogHeader>

        {/* Contenedor del Ticket Térmico con aspecto realista */}
        <div className="flex-1 overflow-y-auto py-3 px-2 flex justify-center bg-muted/40 rounded-lg my-2 border border-border/60">
          {loading ? (
            <div className="py-16 text-center space-y-2">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">Generando representación del ticket...</p>
            </div>
          ) : ticketData ? (
            <div
              className={`bg-white text-zinc-950 font-mono text-[11px] leading-tight p-4 shadow-md rounded border border-zinc-200 transition-all ${
                ancho === '58mm' ? 'w-[240px] text-[10px]' : 'w-[310px]'
              }`}
            >
              {/* Encabezado */}
              <div className="text-center space-y-0.5">
                <div className="font-bold text-xs uppercase tracking-tight">
                  {ticketData.empresa.nombreComercial || ticketData.empresa.razonSocial}
                </div>
                <div className="text-[10px] uppercase text-zinc-700">
                  {ticketData.empresa.razonSocial}
                </div>
                <div>RUC: {ticketData.empresa.ruc}</div>
                <div className="text-[10px] text-zinc-600">{ticketData.empresa.direccionFiscal}</div>
                {ticketData.empresa.telefono && <div>Telf: {ticketData.empresa.telefono}</div>}
              </div>

              <div className="my-2 border-b border-dashed border-zinc-400" />

              {/* Comprobante */}
              <div className="text-center font-bold">
                <div className="text-xs uppercase">{ticketData.comprobante.tipoComprobante} ELECTRÓNICA</div>
                <div className="text-sm font-extrabold tracking-wider mt-0.5">
                  {ticketData.comprobante.serieCorrelativo}
                </div>
              </div>

              <div className="my-2 border-b border-dashed border-zinc-400" />

              {/* Datos Venta */}
              <div className="space-y-0.5 text-[10px]">
                <div>
                  <span className="font-semibold">Fecha:</span> {ticketData.comprobante.fecha}{' '}
                  {ticketData.comprobante.hora}
                </div>
                <div>
                  <span className="font-semibold">Cajero:</span> {ticketData.cajero}
                </div>
                <div>
                  <span className="font-semibold">Cliente:</span> {ticketData.cliente.nombre}
                </div>
                <div>
                  <span className="font-semibold">DOC:</span> {ticketData.cliente.documento}
                </div>
              </div>

              <div className="my-2 border-b border-dashed border-zinc-400" />

              {/* Items */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold border-b border-zinc-300 pb-1 text-[10px]">
                  <span>DESCRIPCIÓN</span>
                  <span>TOTAL</span>
                </div>
                {ticketData.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="font-medium">{it.nombre}</div>
                      <div className="text-[9px] text-zinc-500">
                        {it.cantidad} x S/ {it.precioUnitario.toFixed(2)}
                      </div>
                    </div>
                    <div className="font-bold whitespace-nowrap">S/ {it.subtotal.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="my-2 border-b border-dashed border-zinc-400" />

              {/* Totales */}
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>OP. GRAVADA:</span>
                  <span>S/ {ticketData.totales.opGravada.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>I.G.V. (18%):</span>
                  <span>S/ {ticketData.totales.igv.toFixed(2)}</span>
                </div>
                {ticketData.totales.descuento > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>DESCUENTO:</span>
                    <span>- S/ {ticketData.totales.descuento.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold border-t border-b border-zinc-800 py-1 my-1">
                  <span>TOTAL A PAGAR:</span>
                  <span>S/ {ticketData.totales.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Letras */}
              <div className="text-[9px] font-semibold text-zinc-700 my-1">
                {ticketData.totales.totalEnLetras}
              </div>

              <div className="my-2 border-b border-dashed border-zinc-400" />

              {/* Pago */}
              <div className="space-y-0.5 text-[10px]">
                <div>
                  <span className="font-semibold">MÉTODO PAGO:</span> {ticketData.pago.metodoPago}
                </div>
                {ticketData.pago.montoRecibido !== undefined && (
                  <div>
                    <span className="font-semibold">PAGÓ CON:</span> S/{' '}
                    {ticketData.pago.montoRecibido.toFixed(2)}
                  </div>
                )}
                {ticketData.pago.vuelto !== undefined && (
                  <div>
                    <span className="font-semibold">VUELTO:</span> S/{' '}
                    {ticketData.pago.vuelto.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="my-2 border-b border-dashed border-zinc-400" />

              {/* Pie */}
              <div className="text-center space-y-1 text-[9px] text-zinc-600">
                <div className="font-bold text-zinc-900">{ticketData.pie.mensaje}</div>
                <div>{ticketData.pie.resolucionSunat}</div>
                {ticketData.pie.hashCpe && <div>Hash: {ticketData.pie.hashCpe}</div>}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground my-8">No se encontraron datos del ticket.</p>
          )}
        </div>

        {/* Acciones del Modal */}
        <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row pt-2 border-t border-border/80">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAbrirGaveta}
              className="text-xs gap-1.5"
              title="Enviar comando para abrir la gaveta portamonedas"
            >
              <Vault className="h-3.5 w-3.5 text-primary" />
              <span>Abrir Gaveta</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopiarTexto}
              className="text-xs gap-1.5"
              title="Copiar texto simple del comprobante"
            >
              {copiado ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiado ? 'Copiado' : 'Copiar'}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cerrar
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              disabled={loading || !ticketData}
              className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold px-4"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir Ticket</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

