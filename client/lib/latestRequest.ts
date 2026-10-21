// Solo la consulta más reciente puede publicar resultados o finalizar la carga.
// invalidate también descarta cualquier respuesta al abandonar una pantalla.
export function createLatestRequest() {
  let version = 0;
  return {
    begin: () => ++version,
    isCurrent: (request: number) => request === version,
    invalidate: () => { ++version; },
  };
}
