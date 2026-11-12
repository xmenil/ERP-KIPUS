import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ticketPrintService } from './ticketPrintService';
import { audioFeedbackService } from './audioFeedbackService';
import { VentaTicketData } from '../types/ticket.types';

describe('ticketPrintService & audioFeedbackService (Fase 7 POS)', () => {
  const dummyTicket: VentaTicketData = {
    empresa: {
      ruc: '20601234567',
      razonSocial: "MINIMARKET KIPU'S S.A.C.",
      nombreComercial: "KIPU'S EL AHORRO",
      direccionFiscal: 'Av. Alameda Perú 456, Tingo María',
      telefono: '962112334',
      correo: 'contacto@kipus.pe',
    },
    comprobante: {
      id: 'dummy-venta-123',
      tipoComprobante: 'BOLETA',
      serieCorrelativo: 'B001-000484',
      fecha: '12/11/2026',
      hora: '14:30:00',
    },
    cajero: 'Darwin Namuche',
    sucursal: 'Sede Central',
    cliente: {
      nombre: 'Consumidor Final',
      documento: '00000000',
    },
    items: [
      {
        sku: 'ACE-PRI-90',
        nombre: 'Aceite Primor 900ml',
        cantidad: 2,
        precioUnitario: 9.5,
        subtotal: 19.0,
      },
    ],
    totales: {
      opGravada: 16.1,
      opExonerada: 0,
      igv: 2.9,
      descuento: 0,
      total: 19.0,
      totalEnLetras: 'SON: DIECINUEVE CON 00/100 SOLES',
    },
    pago: {
      metodoPago: 'EFECTIVO',
      montoRecibido: 20.0,
      vuelto: 1.0,
    },
    pie: {
      mensaje: '¡Gracias por su compra en KIPU\'S! Vuelva pronto.',
      resolucionSunat: 'Representación impresa de Comprobante de Pago Electrónico',
      hashCpe: 'dummy-hash-123',
    },
  };

  it('generarHtmlTicket genera correctamente el formato para 80mm', () => {
    const html = ticketPrintService.generarHtmlTicket(dummyTicket, '80mm');

    expect(html).toContain('76mm');
    expect(html).toContain('20601234567');
    expect(html).toContain("KIPU'S EL AHORRO");
    expect(html).toContain('B001-000484');
    expect(html).toContain('Aceite Primor 900ml');
    expect(html).toContain('S/ 19.00');
    expect(html).toContain('SON: DIECINUEVE CON 00/100 SOLES');
    expect(html).toContain('EFECTIVO');
    expect(html).toContain('VUELTO');
  });

  it('generarHtmlTicket genera correctamente el formato compacto para 58mm', () => {
    const html = ticketPrintService.generarHtmlTicket(dummyTicket, '58mm');

    expect(html).toContain('54mm');
    expect(html).toContain('10px');
    expect(html).toContain('B001-000484');
    expect(html).toContain('Aceite Primor 900ml');
  });

  it('audioFeedbackService maneja mute y reproducción de tonos sin error', () => {
    audioFeedbackService.setMuted(true);
    expect(audioFeedbackService.isMuted()).toBe(true);

    // No debe lanzar errores al llamar los métodos silenciados
    expect(() => audioFeedbackService.playSuccessBeep()).not.toThrow();
    expect(() => audioFeedbackService.playErrorBeep()).not.toThrow();
    expect(() => audioFeedbackService.playCashChime()).not.toThrow();

    audioFeedbackService.setMuted(false);
    expect(audioFeedbackService.isMuted()).toBe(false);

    // Ni tampoco desilenciados
    expect(() => audioFeedbackService.playSuccessBeep()).not.toThrow();
    expect(() => audioFeedbackService.playErrorBeep()).not.toThrow();
    expect(() => audioFeedbackService.playCashChime()).not.toThrow();
  });
});

