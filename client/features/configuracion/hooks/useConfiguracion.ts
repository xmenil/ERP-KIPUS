import { useEffect, useState } from "react";
import {
  leerConfiguracion,
  subscribeToConfiguracion,
} from "../services/configuracionStorage";

function snapshot() {
  try {
    return { config: leerConfiguracion(), error: "" };
  } catch (error) {
    return {
      config: null,
      error:
        error instanceof Error
          ? error.message
          : "No se pudo leer la configuración.",
    };
  }
}
export function useConfiguracion() {
  const [value, setValue] = useState(snapshot);
  useEffect(() => {
    const update = () => setValue(snapshot());
    const unsubscribe = subscribeToConfiguracion(update);
    update();
    return unsubscribe;
  }, []);
  return value;
}
