# Avance de fase 2: guardado local de productos

Fecha: 21/10/2026.

## Alcance acordado

KIPU'S ERP sigue siendo un prototipo funcional. La persistencia se mantiene en `localStorage`, sin base de datos ni nuevos endpoints. El catálogo continúa compartido por los usuarios del mismo origen y perfil del navegador; cerrar sesión no lo elimina. No se requiere una migración a DB para estas correcciones.

## Cambios implementados

- Alta, edición, baja y cambio de estado de productos escriben el catálogo candidato antes de publicarlo en memoria y notificar a las pantallas. Si falla la escritura, rechazan la operación y mantienen el catálogo anterior.
- El formulario ya conservaba sus valores al recibir un rechazo; ahora recibe también los errores de persistencia y puede mostrarlos sin anunciar éxito ni cerrarse.
- Se conserva un catálogo vacío válido al volver a cargar.
- Un contenido inválido o ilegible no se reemplaza automáticamente. Las escrituras quedan protegidas mientras persista el error de lectura. El guardado de productos informa del problema. La recuperación guiada/importación de respaldos no forma parte de esta entrega.
- Se conserva la clave antigua `KIPUS_ERP_STORAGE` en lugar de borrarla automáticamente; no se migran sus datos en esta entrega.
- Después de guardar, Productos busca por el SKU registrado, limpia categoría y estado, restablece orden y página. Esto también permite encontrar una edición de un producto que estaba en otra página.
- La suscripción actualiza el catálogo local directamente y no inicia otra consulta simulada. Se eliminó la consulta duplicada del handler. Las respuestas de consultas anteriores se descartan al actualizar o abandonar la pantalla.

Estos ajustes corrigen casos concretos del diagnóstico. No confirman la causa del bloqueo reportado ni representan un rediseño visual completo.

## Comparación en localhost

Servidor iniciado con `pnpm dev --host 127.0.0.1`.

- Inicio de sesión: <http://127.0.0.1:8080/login>.
- Pantalla con cambios: <http://127.0.0.1:8080/productos>.

Utilizar siempre la misma dirección `127.0.0.1`: `localhost`, otra IP y el dominio desplegado tienen almacenamientos diferentes. La versión local no comparte automáticamente los datos del despliegue. Si el servidor se detiene, volver a ejecutar el comando desde la raíz y usar el puerto que informe Vite.

| Paso | Qué hacer en ambas versiones | Qué comprobar en la versión local |
|---|---|---|
| 1 | Iniciar sesión con una cuenta del prototipo | Acceso a Productos |
| 2 | Activar una búsqueda o categoría que excluya un producto nuevo | Mantenerla activa antes de abrir el formulario |
| 3 | Registrar un producto con un SKU libre y guardar | El buscador pasa al SKU y aparece el producto; no hay una segunda recarga del listado |
| 4 | Editar nombre/precio y guardar | Se localiza la edición y aparece confirmación |
| 5 | Recargar y cerrar/iniciar sesión | Se conserva el producto con sus cambios |
| 6 | Limpiar la búsqueda | Se vuelve al catálogo completo |

Los fallos de almacenamiento y el catálogo vacío se verificaron con almacenamiento simulado. No es necesario borrar el catálogo ni corromper el almacenamiento para la comparación habitual. El alcance de persistencia atómica de esta entrega son las operaciones de catálogo de productos; las operaciones de venta/caja/inventario requieren su propia revisión ante fallos de almacenamiento.

## Validación

`pnpm test`: 54 pruebas aprobadas en 9 archivos, incluidas 8 pruebas de persistencia del catálogo. `pnpm typecheck`: aprobado. La ruta `/productos` responde HTTP 200; esto comprueba el servicio de la SPA, no sustituye una prueba visual autenticada.

`pnpm build`: cliente y servidor compilados correctamente. Continúan los avisos sobre tamaño de chunks y datos antiguos de Browserslist; no impiden la compilación.

Las pruebas diagnósticas originales de `erpStore.diagnostico.spec.ts` se actualizaron a expectativas de regresión: rechazo sin cambios parciales, conservación del vacío, protección de JSON inválido y reintento de edición. El documento `diagnostico-fase-1.md` conserva la evidencia histórica previa a la corrección.

Pendiente: validación visual autenticada, reproducción y medición del bloqueo original, completar validación de todos los campos del formulario y continuar las demás fases del plan.
