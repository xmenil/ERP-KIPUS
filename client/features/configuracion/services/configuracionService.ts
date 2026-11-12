import { apiClient } from '@/services/api/apiClient';
import { ConfiguracionSistema } from '../types/configuracion.types';

export const configuracionService = {
  /**
   * Obtiene la configuración consolidada de empresa y parámetros del sistema
   */
  async getConfiguracion(): Promise<ConfiguracionSistema> {
    try {
      const [empresa, sistema] = await Promise.all([
        apiClient.get<any>('/configuracion/empresa'),
        apiClient.get<any>('/configuracion/sistema'),
      ]);

      return {
        empresa: {
          ruc: empresa?.ruc || '20608821941',
          razonSocial: empresa?.razonSocial || "Comercial Minimarket Kipu's E.I.R.L.",
          nombreComercial: empresa?.nombreComercial || "MINIMARKET & BODEGA KIPU'S",
          direccionFiscal: empresa?.direccionFiscal || 'Jr. Tito Jaime 450 - Tingo María, Huánuco',
          telefono: empresa?.telefono || '(062) 562-180 / 991 884 122',
          correo: empresa?.correo || 'ventas@minimarketkipus.pe',
          regimenTributario: empresa?.regimenTributario || 'Régimen MYPE Tributario (RMT)',
        },
        series: sistema?.series || [
          { tipo: 'Boleta de Venta', serie: 'B001', siguienteNumero: 484 },
          { tipo: 'Factura Electrónica', serie: 'F001', siguienteNumero: 130 },
          { tipo: 'Nota de Venta', serie: 'NV01', siguienteNumero: 913 },
        ],
        tasaIgv: sistema?.tasaIgv ?? 18,
        monedaPrincipal: sistema?.monedaPrincipal || 'PEN',
        permitirVentaSinStock: sistema?.permitirVentaSinStock ?? false,
        pos: sistema?.pos || {
          anchoPapel: '80mm',
          autoImprimir: false,
          abrirGaveta: true,
          mensajePie: "¡Gracias por su compra en KIPU'S! Vuelva pronto.",
          cortarPapel: true,
          sonidosActivos: true,
        },
      };
    } catch {
      // Fallback
      return {
        empresa: {
          ruc: '20608821941',
          razonSocial: "Comercial Minimarket Kipu's E.I.R.L.",
          nombreComercial: "MINIMARKET & BODEGA KIPU'S",
          direccionFiscal: 'Jr. Tito Jaime 450 - Tingo María, Huánuco',
          telefono: '(062) 562-180 / 991 884 122',
          correo: 'ventas@minimarketkipus.pe',
          regimenTributario: 'Régimen MYPE Tributario (RMT)',
        },
        series: [
          { tipo: 'Boleta de Venta', serie: 'B001', siguienteNumero: 484 },
          { tipo: 'Factura Electrónica', serie: 'F001', siguienteNumero: 130 },
          { tipo: 'Nota de Venta', serie: 'NV01', siguienteNumero: 913 },
        ],
        tasaIgv: 18,
        monedaPrincipal: 'PEN',
        permitirVentaSinStock: false,
        pos: {
          anchoPapel: '80mm',
          autoImprimir: false,
          abrirGaveta: true,
          mensajePie: "¡Gracias por su compra en KIPU'S! Vuelva pronto.",
          cortarPapel: true,
          sonidosActivos: true,
        },
      };
    }
  },

  /**
   * Guarda los cambios en la base de datos para empresa y sistema
   */
  async guardarConfiguracion(nueva: ConfiguracionSistema): Promise<ConfiguracionSistema> {
    await Promise.all([
      apiClient.put('/configuracion/empresa', nueva.empresa),
      apiClient.put('/configuracion/sistema', {
        series: nueva.series,
        tasaIgv: nueva.tasaIgv,
        monedaPrincipal: nueva.monedaPrincipal,
        permitirVentaSinStock: nueva.permitirVentaSinStock,
        pos: nueva.pos,
      }),
    ]);
    return nueva;
  },
};
