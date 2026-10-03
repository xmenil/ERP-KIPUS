import { simulateDelay } from '@/services/mock/mockUtils';
import { ConfiguracionSistema } from '../types/configuracion.types';

let mockConfiguracion: ConfiguracionSistema = {
  empresa: {
    ruc: '20608821941',
    razonSocial: 'Comercial Los Andes S.A.C.',
    nombreComercial: 'KIPU REPUESTOS & LUBRICANTES',
    direccionFiscal: 'Av. Industrial 450 - Ate, Lima',
    telefono: '(01) 482-9910 / 991 884 122',
    correo: 'administracion@comerciallosandes.pe',
    regimenTributario: 'Régimen MYPE Tributario (RMT)',
  },
  series: [
    { tipo: 'Boleta de Venta', serie: 'B001', siguienteNumero: 483 },
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
