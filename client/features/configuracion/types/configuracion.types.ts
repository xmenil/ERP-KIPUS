export interface DatosEmpresa {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  direccionFiscal: string;
  telefono: string;
  correo: string;
  regimenTributario: string;
}

export interface SerieComprobante {
  tipo: string;
  serie: string;
  siguienteNumero: number;
}

export interface ConfiguracionPos {
  anchoPapel: '80mm' | '58mm';
  autoImprimir: boolean;
  abrirGaveta: boolean;
  mensajePie: string;
  cortarPapel: boolean;
  sonidosActivos: boolean;
}

export interface ConfiguracionSistema {
  empresa: DatosEmpresa;
  series: SerieComprobante[];
  tasaIgv: number;
  monedaPrincipal: 'PEN' | 'USD';
  permitirVentaSinStock: boolean;
  pos?: ConfiguracionPos;
}
