import { z } from 'zod';
import { CategoriaGasto, NuevoGastoPayload } from '../types/gastos.types';

export const CATEGORIAS_VALIDAS: [CategoriaGasto, ...CategoriaGasto[]] = [
  'ALQUILER',
  'SERVICIOS_BASICOS',
  'PLANILLA',
  'LOGISTICA',
  'MANTENIMIENTO',
  'MARKETING',
  'OTROS',
];

export const METODOS_PAGO_GASTO = ['EFECTIVO', 'TRANSFERENCIA', 'YAPE', 'PLIN', 'TARJETA'] as const;

export const CATEGORIA_LABELS: Record<CategoriaGasto, string> = {
  ALQUILER: 'Alquiler de local',
  SERVICIOS_BASICOS: 'Servicios (Luz, agua, internet)',
  PLANILLA: 'Planilla / Sueldos',
  LOGISTICA: 'Logística / Envíos',
  MANTENIMIENTO: 'Mantenimiento y refacción',
  MARKETING: 'Publicidad y marketing',
  OTROS: 'Otros egresos operativos',
};

export const METODO_PAGO_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo de caja',
  TRANSFERENCIA: 'Transferencia bancaria',
  YAPE: 'Yape / Plin',
  PLIN: 'Yape / Plin',
  TARJETA: 'Tarjeta débito/crédito',
};

export const gastoSchema = z.object({
  categoria: z.enum(CATEGORIAS_VALIDAS, {
    errorMap: () => ({ message: 'Elige una categoría de gasto válida.' }),
  }),
  descripcion: z
    .string({ required_error: 'Ingresa el concepto o descripción del gasto.' })
    .trim()
    .min(3, 'El concepto debe tener al menos 3 caracteres.')
    .max(160, 'El concepto no debe superar 160 caracteres.'),
  beneficiario: z
    .string()
    .trim()
    .max(100, 'El beneficiario no debe superar 100 caracteres.')
    .optional()
    .or(z.literal('')),
  comprobante: z
    .string()
    .trim()
    .max(50, 'El número de comprobante no debe superar 50 caracteres.')
    .optional()
    .or(z.literal('')),
  monto: z
    .number({ invalid_type_error: 'Ingresa un monto numérico válido.' })
    .positive('El monto del egreso debe ser mayor a S/ 0.00.')
    .finite('El monto debe ser un número finito.')
    .max(100000, 'El monto supera el límite operativo permitido por comprobante (S/ 100,000.00).'),
  metodoPago: z
    .string({ required_error: 'Selecciona el medio de pago.' })
    .refine((val) => METODOS_PAGO_GASTO.includes(val as typeof METODOS_PAGO_GASTO[number]), {
      message: 'Selecciona un medio de pago válido (Efectivo, Transferencia, Yape/Plin o Tarjeta).',
    }),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD.')
    .optional(),
});

export function validarGastoPayload(payload: NuevoGastoPayload): {
  categoria: CategoriaGasto;
  descripcion: string;
  beneficiario: string;
  comprobante: string;
  monto: number;
  metodoPago: string;
  fecha?: string;
} {
  const result = gastoSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(result.error.errors[0]?.message || 'Datos del gasto inválidos.');
  }

  const data = result.data;
  return {
    categoria: data.categoria,
    descripcion: data.descripcion,
    beneficiario: data.beneficiario?.trim() || 'Varios',
    comprobante: data.comprobante?.trim() || 'Sin comprobante',
    monto: +data.monto.toFixed(2),
    metodoPago: data.metodoPago,
    fecha: data.fecha,
  };
}
