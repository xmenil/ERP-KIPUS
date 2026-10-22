import type { ConfiguracionSistema } from "../types/configuracion.types";
import {
  guardarConfiguracion,
  leerConfiguracion,
} from "./configuracionStorage";

export const configuracionService = {
  async getConfiguracion(): Promise<ConfiguracionSistema> {
    return leerConfiguracion();
  },
  async guardarConfiguracion(
    nueva: ConfiguracionSistema,
  ): Promise<ConfiguracionSistema> {
    return guardarConfiguracion(nueva);
  },
};
