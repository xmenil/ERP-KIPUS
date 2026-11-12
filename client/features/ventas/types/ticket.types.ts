export interface TicketEmpresa {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  direccionFiscal: string;
  telefono: string;
  correo: string;
}

export interface TicketItem {
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface TicketTotales {
  opGravada: number;
  opExonerada: number;
  igv: number;
  descuento: number;
  total: number;
  totalEnLetras: string;
}

export interface TicketPago {
  metodoPago: string;
  montoRecibido?: number;
  vuelto?: number;
}

export interface TicketComprobante {
  id: string;
  tipoComprobante: string;
  serieCorrelativo: string;
  fecha: string;
  hora: string;
}

export interface TicketCliente {
  nombre: string;
  documento: string;
  direccion?: string;
}

export interface TicketPie {
  mensaje: string;
  resolucionSunat: string;
  hashCpe?: string;
}

export interface VentaTicketData {
  empresa: TicketEmpresa;
  comprobante: TicketComprobante;
  cajero: string;
  sucursal: string;
  cliente: TicketCliente;
  items: TicketItem[];
  totales: TicketTotales;
  pago: TicketPago;
  pie: TicketPie;
}

export interface ConfiguracionPos {
  anchoPapel: '80mm' | '58mm';
  autoImprimir: boolean;
  abrirGaveta: boolean;
  mensajePie: string;
  cortarPapel: boolean;
  sonidosActivos: boolean;
}

