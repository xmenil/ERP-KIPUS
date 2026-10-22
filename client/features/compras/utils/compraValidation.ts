import type { Compra, CompraItemDetalle, NuevaCompraPayload } from '../types/compras.types';
import type { Producto } from '@/features/productos/types/productos.types';
import type { Proveedor } from '@/features/proveedores/types/proveedores.types';
import { normalizarRuc } from '@/features/proveedores/utils/proveedorValidation';

export const METODOS_PAGO_COMPRA = [
  { id: 'TRANSFERENCIA', label: 'Transferencia bancaria' },
  { id: 'EFECTIVO', label: 'Efectivo (caja)' },
  { id: 'CREDITO_30_DIAS', label: 'Crédito a 30 días' },
  { id: 'TARJETA', label: 'Tarjeta' },
] as const;

export function normalizarComprobante(serie: string): string {
  return serie.trim().toUpperCase();
}

export function validarCompraPayload(
  payload: NuevaCompraPayload,
  contexto: {
    proveedores: Proveedor[];
    productos: Producto[];
    comprasExistentes: Compra[];
    cajaAbierta?: boolean;
  }
): void {
  const ruc = normalizarRuc(payload.proveedorRuc || '');
  if (!ruc || !/^\d{11}$/.test(ruc)) {
    throw new Error('El RUC del proveedor debe tener 11 dígitos numéricos.');
  }

  const razonSocial = payload.proveedorNombre?.trim() || '';
  if (!razonSocial) {
    throw new Error('Selecciona un proveedor activo con razón social válida.');
  }

  const prov = contexto.proveedores.find(p => normalizarRuc(p.ruc) === ruc);
  if (prov && prov.activo === false) {
    throw new Error('El proveedor está inactivo. Actívalo en Proveedores o elige otro proveedor.');
  }

  const serie = normalizarComprobante(payload.serieFactura || '');
  if (!serie) {
    throw new Error('Ingresa el número o serie del comprobante de compra.');
  }

  // Comprobar duplicado para el mismo proveedor
  const existeDuplicado = contexto.comprasExistentes.some(
    c => normalizarRuc(c.proveedorRuc) === ruc &&
         normalizarComprobante(c.serieFactura) === serie &&
         c.estado !== 'ANULADO'
  );
  if (existeDuplicado) {
    throw new Error('Ese comprobante ya está registrado para el proveedor.');
  }

  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error('Agrega al menos un producto a la compra.');
  }

  let totalCalculado = 0;
  let itemsCountCalculado = 0;

  for (let index = 0; index < payload.items.length; index++) {
    const item = payload.items[index];
    if (!item.productoId) {
      throw new Error(`El producto en la fila ${index + 1} no es válido.`);
    }

    const prod = contexto.productos.find(p => p.id === item.productoId);
    if (!prod) {
      throw new Error(`El producto "${item.nombre || item.productoId}" no existe en el catálogo.`);
    }
    if (prod.activo === false) {
      throw new Error(`El producto "${prod.nombre}" está desactivado. Actívalo en Productos antes de comprarlo.`);
    }

    if (!Number.isFinite(item.cantidad) || item.cantidad <= 0) {
      throw new Error(`La cantidad de "${prod.nombre}" debe ser un número positivo.`);
    }

    if (!Number.isFinite(item.precioUnitario) || item.precioUnitario < 0) {
      throw new Error(`El costo unitario de "${prod.nombre}" debe ser un número mayor o igual a cero.`);
    }

    const subtotalEsperado = +(item.cantidad * item.precioUnitario).toFixed(2);
    if (!Number.isFinite(item.subtotal) || Math.abs(item.subtotal - subtotalEsperado) > 0.001) {
      throw new Error(`El subtotal de "${prod.nombre}" no coincide con cantidad × costo.`);
    }

    totalCalculado += item.subtotal;
    itemsCountCalculado += item.cantidad;
  }

  totalCalculado = +totalCalculado.toFixed(2);

  if (!Number.isFinite(payload.total) || Math.abs(payload.total - totalCalculado) > 0.001) {
    throw new Error('El total de la compra no coincide con la suma de los productos.');
  }

  if (payload.itemsCount !== itemsCountCalculado) {
    throw new Error('La cantidad total de unidades no coincide con el detalle de productos.');
  }

  const metodosPermitidos = METODOS_PAGO_COMPRA.map(m => m.id);
  if (!metodosPermitidos.includes(payload.metodoPago as any)) {
    throw new Error('Elige un medio de pago válido para la compra.');
  }

  const estado = payload.estado || 'RECIBIDO';
  if (!['RECIBIDO', 'PENDIENTE'].includes(estado)) {
    throw new Error('El estado de la compra debe ser RECIBIDO o PENDIENTE.');
  }

  if (estado === 'RECIBIDO' && payload.metodoPago === 'EFECTIVO' && contexto.cajaAbierta === false) {
    throw new Error('Abre la caja antes de registrar una compra recibida pagada en efectivo.');
  }
}
