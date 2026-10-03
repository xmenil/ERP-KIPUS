export interface Cliente {
  id: string;
  documentoTipo: 'DNI' | 'RUC';
  numeroDocumento: string;
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
  totalCompras: number;
  saldoPendiente: number;
  activo: boolean;
}

export interface NuevoClientePayload {
  documentoTipo: 'DNI' | 'RUC';
  numeroDocumento: string;
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
}
