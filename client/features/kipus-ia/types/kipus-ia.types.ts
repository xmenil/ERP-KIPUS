import type { PeriodoReporte } from "@/features/reportes/types/reportes.types";
export type PeriodoConsulta =
  | PeriodoReporte
  | "HOY"
  | "AYER"
  | "ULTIMOS_7_DIAS"
  | "ULTIMOS_30_DIAS";
export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
  fuente?: string;
  alcance?: string;
  dataPoints?: { label: string; value: string }[];
  enlace?: { label: string; ruta: string };
}
