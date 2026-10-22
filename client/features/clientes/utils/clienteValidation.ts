import { z } from 'zod';
import type { NuevoClientePayload } from '../types/clientes.types';

export function normalizarDocumentoCliente(value: string): string {
  return value.replace(/[\s-]/g, '');
}

export const clienteSchema = z.object({
  documentoTipo: z.enum(['DNI', 'RUC'], { errorMap: () => ({ message: 'Elige DNI o RUC.' }) }),
  numeroDocumento: z.string().transform(normalizarDocumentoCliente),
  nombre: z.string().trim().min(2, 'Ingresa el nombre o razón social.').max(160, 'El nombre no debe superar 160 caracteres.'),
  telefono: z.string().trim().max(30, 'El teléfono no debe superar 30 caracteres.').optional().or(z.literal('')),
  correo: z.string().trim().max(160, 'El correo no debe superar 160 caracteres.').refine(value => !value || value === '-' || z.string().email().safeParse(value).success, 'Ingresa un correo válido.').optional().or(z.literal('')),
  direccion: z.string().trim().max(200, 'La dirección no debe superar 200 caracteres.').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (!/^\d+$/.test(data.numeroDocumento)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['numeroDocumento'], message: 'El documento solo puede contener números, espacios o guiones.' });
  } else if (data.numeroDocumento.length !== (data.documentoTipo === 'DNI' ? 8 : 11)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['numeroDocumento'], message: data.documentoTipo === 'DNI' ? 'El DNI debe tener 8 dígitos.' : 'El RUC debe tener 11 dígitos.' });
  }
});

export function validarCliente(payload: NuevoClientePayload): NuevoClientePayload {
  const parsed = clienteSchema.safeParse(payload);
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message || 'Revisa los datos del cliente.');
  if (parsed.data.documentoTipo === 'DNI' && parsed.data.numeroDocumento === '00000000') {
    throw new Error('El DNI 00000000 está reservado para Consumidor Final.');
  }
  return {
    documentoTipo: parsed.data.documentoTipo,
    numeroDocumento: parsed.data.numeroDocumento,
    nombre: parsed.data.nombre,
    telefono: parsed.data.telefono || '',
    correo: parsed.data.correo === '-' ? '' : parsed.data.correo || '',
    direccion: parsed.data.direccion || '',
  };
}
