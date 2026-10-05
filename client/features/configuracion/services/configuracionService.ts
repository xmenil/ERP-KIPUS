import { simulateDelay } from '@/services/mock/mockUtils';
import { ConfiguracionSistema } from '../types/configuracion.types';

let mockConfiguracion: ConfiguracionSistema = {
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
};

export const configuracionService = {
  async getConfiguracion(): Promise<ConfiguracionSistema> {
    return simulateDelay(mockConfiguracion);
  },

  async guardarConfiguracion(nueva: ConfiguracionSistema): Promise<ConfiguracionSistema> {
    mockConfiguracion = structuredClone(nueva);
    return simulateDelay(mockConfiguracion);
  },
};
