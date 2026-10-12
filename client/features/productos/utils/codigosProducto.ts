import { Producto } from '../types/productos.types';

export function normalizarCodigo(codigo: string): string {
  if (/[\u0000-\u001f\u007f-\u009f]/.test(codigo)) {
    throw new Error('El código debe estar en una sola línea y sin caracteres de control.');
  }
  const normalizado = codigo.trim();
  if (normalizado.length > 256) throw new Error('El código no puede superar 256 caracteres.');
  return normalizado;
}

export function buscarProductoPorCodigo(productos: Producto[], codigo: string): Producto | undefined {
  const normalizado = normalizarCodigo(codigo);
  if (!normalizado) return undefined;
  return productos.find(p => p.codigoBarras?.trim() === normalizado);
}

export function validarCodigoUnico(productos: Producto[], codigo: string, excluirId?: string): string | undefined {
  const normalizado = normalizarCodigo(codigo);
  if (normalizado && productos.some(p => p.id !== excluirId && p.codigoBarras?.trim() === normalizado)) {
    throw new Error('Este código ya pertenece a otro producto. Busca el producto registrado o ingresa otro código.');
  }
  return normalizado || undefined;
}
