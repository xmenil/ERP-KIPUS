/**
 * Utilidades para emular el comportamiento asíncrono del backend REST
 * mientras se desarrollan y prueban las funcionalidades antes de conectar Spring Boot.
 */

export async function simulateDelay<T>(data: T, delayMs: number = 250): Promise<T> {
  // Capturar al consultar: una mutación durante la espera no cambia la respuesta.
  // Dentro de una función async, un fallo de clonación rechaza la promesa.
  const snapshot = structuredClone(data);
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  return snapshot;
}
