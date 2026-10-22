import { z } from "zod";
import type { NuevoProveedorPayload } from "../types/proveedores.types";
export const normalizarRuc = (value: string) => value.replace(/[\s-]/g, "");
const opcional = z
  .string()
  .trim()
  .max(200, "Usa hasta 200 caracteres.")
  .optional();
export const proveedorSchema = z.object({
  ruc: z
    .string()
    .transform(normalizarRuc)
    .refine((value) => /^\d{11}$/.test(value), "El RUC debe tener 11 dígitos."),
  razonSocial: z
    .string()
    .trim()
    .min(1, "Ingresa la razón social.")
    .max(200, "Usa hasta 200 caracteres."),
  nombreComercial: opcional,
  contacto: z.string().trim().max(160, "Usa hasta 160 caracteres."),
  telefono: z
    .string()
    .trim()
    .max(80, "Usa hasta 80 caracteres.")
    .regex(/^[\d\s()+/.-]*$/, "Usa números y separadores para el teléfono."),
  correo: z
    .string()
    .trim()
    .max(160, "Usa hasta 160 caracteres.")
    .refine(
      (value) => !value || z.string().email().safeParse(value).success,
      "Ingresa un correo válido.",
    ),
  direccion: opcional,
  ciudad: opcional,
  provincia: opcional,
  pais: opcional,
  codigoPostal: opcional,
  rubro: z
    .string()
    .trim()
    .min(1, "Ingresa el rubro.")
    .max(160, "Usa hasta 160 caracteres."),
  condicionPago: z
    .string()
    .trim()
    .min(1, "Elige la condición de pago.")
    .max(80),
  diasCredito: z
    .number({ invalid_type_error: "Ingresa un número de días válido." })
    .finite("Ingresa un número de días válido.")
    .int()
    .min(0, "Los días no pueden ser negativos.")
    .max(365, "Usa hasta 365 días.")
    .optional(),
  limiteCredito: z
    .number({ invalid_type_error: "Ingresa un límite de crédito válido." })
    .finite("Ingresa un límite de crédito válido.")
    .min(0, "El límite no puede ser negativo.")
    .max(999999999, "Revisa el límite de crédito.")
    .optional(),
  descripcion: z
    .string()
    .trim()
    .max(1000, "Usa hasta 1000 caracteres.")
    .optional(),
  imagenUrl: z.string().optional(),
});
export function validarProveedor(payload: NuevoProveedorPayload) {
  const value = proveedorSchema.parse(payload) as NuevoProveedorPayload;
  const credit = value.condicionPago
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .includes("credito");
  const days = Number(value.condicionPago.match(/\d+/)?.[0] || 0);
  if (credit && days > 365)
    throw new Error("La condición de pago admite hasta 365 días de crédito.");
  return { ...value, diasCredito: credit ? days : 0 };
}
