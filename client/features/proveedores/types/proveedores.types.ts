export interface Proveedor {
  id: string;
  ruc: string;
  razonSocial: string;
  contacto: string;
  telefono: string;
  correo: string;
  rubro: string;
  condicionPago: string;
}

export interface NuevoProveedorPayload {
  ruc: string;
  razonSocial: string;
  contacto: string;
  telefono: string;
  correo: string;
  rubro: string;
  condicionPago: string;
}
