import { apiClient } from '@/services/api/apiClient';
import { VentaTicketData, ConfiguracionPos } from '../types/ticket.types';

export const ticketPrintService = {
  /**
   * Obtiene la información estructurada del ticket de venta desde el backend
   */
  async obtenerDatosTicket(ventaId: string): Promise<VentaTicketData> {
    return apiClient.get<VentaTicketData>(`/ventas/${ventaId}/ticket`);
  },

  /**
   * Obtiene la configuración de hardware POS desde el backend
   */
  async obtenerConfiguracionPos(): Promise<ConfiguracionPos> {
    try {
      return await apiClient.get<ConfiguracionPos>('/configuracion/pos');
    } catch {
      return {
        anchoPapel: '80mm',
        autoImprimir: false,
        abrirGaveta: true,
        mensajePie: "¡Gracias por su compra en KIPU'S! Vuelva pronto.",
        cortarPapel: true,
        sonidosActivos: true,
      };
    }
  },

  /**
   * Guarda la configuración de hardware POS
   */
  async guardarConfiguracionPos(pos: ConfiguracionPos): Promise<ConfiguracionPos> {
    return apiClient.put<ConfiguracionPos>('/configuracion/pos', pos);
  },

  /**
   * Genera el HTML térmico formateado para 80mm o 58mm
   */
  generarHtmlTicket(ticket: VentaTicketData, ancho: '80mm' | '58mm' = '80mm'): string {
    const es58 = ancho === '58mm';
    const anchoCss = es58 ? '54mm' : '76mm';
    const fontSize = es58 ? '10px' : '12px';
    const separador = es58 ? '--------------------------------' : '========================================';

    const itemsHtml = ticket.items
      .map(
        (it) => `
        <tr>
          <td style="text-align: left; padding: 2px 0; vertical-align: top;">
            ${it.nombre}<br/>
            <small style="color: #444;">${it.cantidad} x S/ ${it.precioUnitario.toFixed(2)}</small>
          </td>
          <td style="text-align: right; padding: 2px 0; vertical-align: top; white-space: nowrap; font-weight: bold;">
            S/ ${it.subtotal.toFixed(2)}
          </td>
        </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ticket ${ticket.comprobante.serieCorrelativo}</title>
  <style>
    @page {
      size: ${anchoCss} auto;
      margin: 0;
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: ${fontSize};
      line-height: 1.25;
      color: #000;
      background: #fff;
      margin: 0 auto;
      padding: 3mm 4mm;
      width: ${anchoCss};
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .separator { margin: 4px 0; overflow: hidden; white-space: nowrap; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    .totals-row td { padding: 1px 0; }
    .legal-notice { font-size: 8px; line-height: 1.1; margin-top: 6px; }
  </style>
</head>
<body>
  <!-- Encabezado Empresa -->
  <div class="text-center">
    <div class="text-bold uppercase" style="font-size: 1.2em;">${ticket.empresa.nombreComercial || ticket.empresa.razonSocial}</div>
    <div class="uppercase">${ticket.empresa.razonSocial}</div>
    <div>RUC: ${ticket.empresa.ruc}</div>
    <div>${ticket.empresa.direccionFiscal}</div>
    ${ticket.empresa.telefono ? `<div>Telf: ${ticket.empresa.telefono}</div>` : ''}
  </div>

  <div class="separator text-center">${separador}</div>

  <!-- Tipo de Comprobante y Numeración -->
  <div class="text-center text-bold">
    <div style="font-size: 1.1em;">${ticket.comprobante.tipoComprobante} ELECTRÓNICA</div>
    <div style="font-size: 1.25em; margin: 2px 0;">${ticket.comprobante.serieCorrelativo}</div>
  </div>

  <div class="separator text-center">${separador}</div>

  <!-- Información de la Venta -->
  <div>
    <div><b>Fecha/Hora:</b> ${ticket.comprobante.fecha} ${ticket.comprobante.hora}</div>
    <div><b>Cajero:</b> ${ticket.cajero}</div>
    <div><b>Sucursal:</b> ${ticket.sucursal}</div>
    <div><b>Cliente:</b> ${ticket.cliente.nombre}</div>
    <div><b>DOC:</b> ${ticket.cliente.documento}</div>
    ${ticket.cliente.direccion ? `<div><b>Dir:</b> ${ticket.cliente.direccion}</div>` : ''}
  </div>

  <div class="separator text-center">${separador}</div>

  <!-- Detalle de Productos -->
  <table>
    <thead>
      <tr style="border-bottom: 1px dashed #000;">
        <th style="text-align: left; padding-bottom: 2px;">CANT/DESCRIPCIÓN</th>
        <th style="text-align: right; padding-bottom: 2px;">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="separator text-center">${separador}</div>

  <!-- Totales -->
  <table class="totals-row">
    <tr>
      <td>OP. GRAVADA:</td>
      <td class="text-right">S/ ${ticket.totales.opGravada.toFixed(2)}</td>
    </tr>
    <tr>
      <td>I.G.V. (18%):</td>
      <td class="text-right">S/ ${ticket.totales.igv.toFixed(2)}</td>
    </tr>
    ${
      ticket.totales.descuento > 0
        ? `<tr><td>DESCUENTO:</td><td class="text-right">- S/ ${ticket.totales.descuento.toFixed(2)}</td></tr>`
        : ''
    }
    <tr style="font-size: 1.2em; font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000;">
      <td style="padding: 3px 0;">IMPORTE TOTAL:</td>
      <td class="text-right" style="padding: 3px 0;">S/ ${ticket.totales.total.toFixed(2)}</td>
    </tr>
  </table>

  <!-- Total en letras -->
  <div style="margin-top: 4px; font-size: 0.9em;">
    <b>${ticket.totales.totalEnLetras}</b>
  </div>

  <div class="separator text-center">${separador}</div>

  <!-- Detalle de Pago -->
  <div>
    <div><b>FORMA DE PAGO:</b> ${ticket.pago.metodoPago}</div>
    ${
      ticket.pago.montoRecibido !== undefined && ticket.pago.montoRecibido > 0
        ? `<div><b>IMPORTE PAGADO:</b> S/ ${ticket.pago.montoRecibido.toFixed(2)}</div>`
        : ''
    }
    ${
      ticket.pago.vuelto !== undefined && ticket.pago.vuelto > 0
        ? `<div><b>VUELTO:</b> S/ ${ticket.pago.vuelto.toFixed(2)}</div>`
        : ''
    }
  </div>

  <div class="separator text-center">${separador}</div>

  <!-- Pie del Ticket -->
  <div class="text-center">
    <div style="margin-bottom: 4px; font-weight: bold;">${ticket.pie.mensaje}</div>
    <div class="legal-notice">
      ${ticket.pie.resolucionSunat}<br/>
      ${ticket.pie.hashCpe ? `Hash: ${ticket.pie.hashCpe}<br/>` : ''}
      Consulte su comprobante en:<br/>
      https://kipus.pe/consultas
    </div>
  </div>
</body>
</html>`;
  },

  /**
   * Imprime el comprobante utilizando un iframe oculto en el navegador
   */
  async imprimirTicket(ticket: VentaTicketData, ancho: '80mm' | '58mm' = '80mm'): Promise<void> {
    const htmlContent = this.generarHtmlTicket(ticket, ancho);

    return new Promise((resolve) => {
      // Crear iframe oculto
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc) {
        resolve();
        return;
      }

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      iframe.contentWindow?.focus();

      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch {
          // Ignorar si cancela
        } finally {
          setTimeout(() => {
            document.body.removeChild(iframe);
            resolve();
          }, 1000);
        }
      }, 300);
    });
  },

  /**
   * Envía un pulso de apertura a la gaveta de dinero (RJ11 conectada a la ticketera)
   */
  abrirGavetaPortamonedas(): void {
    // Comando estándar ESC/POS para abrir gaveta: ESC p m t1 t2 (27, 112, 0, 25, 250)
    // En navegadores web, las impresoras térmicas conectadas por USB/LAN que tienen
    // la opción "Open Cash Drawer" activada en las propiedades de Windows abren
    // el cajón antes o después del trabajo de impresión.
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      // Comando ESC/POS binario enviado como texto crudo
      doc.write(String.fromCharCode(27, 112, 0, 25, 250));
      doc.close();
      iframe.contentWindow?.print();
    }

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 500);
  },
};

