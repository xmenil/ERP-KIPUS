/**
 * Utilidades para emular el comportamiento asíncrono del backend REST
 * mientras se desarrollan y prueban las funcionalidades antes de conectar Spring Boot.
 */

export async function simulateDelay<T>(data: T, delayMs: number = 250): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(structuredClone(data));
    }, delayMs);
  });
}
