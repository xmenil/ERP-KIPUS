import { z } from "zod";
import type { ConfiguracionSistema } from "../types/configuracion.types";

export const CONFIGURACION_KEY = "KIPUS_ERP_CONFIGURACION_V1";
export const SERIES_LOCALES = [
  { tipo: "Boleta de Venta", serie: "B001" },
  { tipo: "Factura Electrónica", serie: "F001" },
  { tipo: "Nota de Venta", serie: "NV01" },
] as const;
export const DEFAULT_CONFIGURACION: ConfiguracionSistema = {
  empresa: {
    ruc: "20608821941",
    razonSocial: "Comercial Minimarket Kipu's E.I.R.L.",
    nombreComercial: "MINIMARKET & BODEGA KIPU'S",
    nombreSede: "Sede Central (Tingo María)",
    direccionFiscal: "Jr. Tito Jaime 450 - Tingo María, Huánuco",
    telefono: "(062) 562-180 / 991 884 122",
    correo: "ventas@minimarketkipus.pe",
    regimenTributario: "Régimen MYPE Tributario (RMT)",
  },
  series: SERIES_LOCALES.map((s) => ({ ...s, siguienteNumero: 501 })),
  tasaIgv: 18,
  monedaPrincipal: "PEN",
  permitirVentaSinStock: false,
};

const texto = (nombre: string) =>
  z
    .string()
    .trim()
    .min(1, `Ingresa ${nombre}.`)
    .max(160, "Usa hasta 160 caracteres.");
export const configuracionSchema = z
  .object({
    empresa: z.object({
      ruc: z
        .string()
        .trim()
        .regex(/^\d{11}$/, "El RUC debe tener 11 dígitos."),
      razonSocial: texto("la razón social"),
      nombreComercial: z.string().trim().max(160, "Usa hasta 160 caracteres."),
      nombreSede: texto("el nombre de la sede"),
      direccionFiscal: texto("la dirección fiscal"),
      telefono: z
        .string()
        .trim()
        .max(80, "Usa hasta 80 caracteres.")
        .regex(
          /^[\d\s()+/.-]*$/,
          "Usa números y separadores para el teléfono.",
        ),
      correo: z
        .string()
        .trim()
        .max(160, "Usa hasta 160 caracteres.")
        .refine(
          (value) => !value || z.string().email().safeParse(value).success,
          "Ingresa un correo como ventas@empresa.pe.",
        ),
      regimenTributario: z
        .string()
        .trim()
        .max(160, "Usa hasta 160 caracteres."),
    }),
    series: z
      .array(
        z.object({
          tipo: z.string(),
          serie: z.string(),
          siguienteNumero: z.number().int().min(1).max(999999),
        }),
      )
      .length(3),
    tasaIgv: z.literal(18),
    monedaPrincipal: z.literal("PEN"),
    permitirVentaSinStock: z.literal(false),
  })
  .superRefine((value, context) => {
    value.series.forEach((s, index) => {
      if (
        s.tipo !== SERIES_LOCALES[index].tipo ||
        s.serie !== SERIES_LOCALES[index].serie
      )
        context.addIssue({
          code: "custom",
          path: ["series", index],
          message: "Las series locales son B001, F001 y NV01.",
        });
    });
  });

export function leerConfiguracion(): ConfiguracionSistema {
  if (typeof window === "undefined")
    return structuredClone(DEFAULT_CONFIGURACION);
  let raw: string | null;
  try {
    raw = localStorage.getItem(CONFIGURACION_KEY);
  } catch {
    throw new Error(
      "No se pudo leer la configuración. Revisa los permisos de almacenamiento y reintenta.",
    );
  }
  if (raw === null) return structuredClone(DEFAULT_CONFIGURACION);
  try {
    return configuracionSchema.parse(JSON.parse(raw)) as ConfiguracionSistema;
  } catch {
    throw new Error(
      "La configuración guardada no es legible. Consérvala para recuperarla; no se reemplazó ningún dato.",
    );
  }
}

const listeners = new Set<() => void>();
export function subscribeToConfiguracion(listener: () => void) {
  listeners.add(listener);
  const storage = (event: StorageEvent) => {
    if (event.key === CONFIGURACION_KEY) listener();
  };
  if (typeof window !== "undefined")
    window.addEventListener("storage", storage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined")
      window.removeEventListener("storage", storage);
  };
}

export function guardarConfiguracion(
  nueva: ConfiguracionSistema,
): ConfiguracionSistema {
  const validada = configuracionSchema.parse(nueva) as ConfiguracionSistema;
  leerConfiguracion();
  try {
    localStorage.setItem(CONFIGURACION_KEY, JSON.stringify(validada));
  } catch {
    throw new Error(
      "No se pudo guardar la configuración. Revisa el espacio y los permisos del navegador. Tus cambios siguen en el formulario.",
    );
  }
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* El guardado ya está confirmado. */
    }
  });
  return structuredClone(validada);
}
