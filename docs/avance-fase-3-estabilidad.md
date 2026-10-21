# Fase 3: estabilidad y respuesta

Fecha: 21/10/2026. Estado: cambios técnicos implementados y comprobados; validación de tiempos y bloqueo original en navegador pendiente.

El prototipo mantiene su persistencia en `localStorage`. Se utiliza el servidor existente en `http://localhost:8080/`; no se inició otro servidor en esta fase.

## Problemas atendidos

1. **Promesas que podían quedar pendientes.** `simulateDelay` clonaba datos dentro de un temporizador sin capturar errores. Una excepción en `structuredClone` salía del callback sin resolver ni rechazar la consulta. Ahora clona dentro de la función `async`, que rechaza correctamente ante un error. También captura los datos al consultar: una mutación durante los 250 ms de espera simulada no altera esa respuesta.
2. **Respuestas antiguas y desmontaje.** Ventas, Caja e Inventario ahora permiten publicar resultados, errores y fin de carga únicamente a la consulta más reciente. Al salir de cada pantalla invalidan consultas pendientes y eliminan su suscripción. Se mantiene la protección equivalente que Productos recibió en la fase 2.
3. **Consultas duplicadas.** Se retiraron las consultas adicionales de los handlers de operaciones de Ventas, Caja e Inventario: las mutaciones ya notifican mediante el store. Se conserva la carga inicial y la actualización de la suscripción. Ventas conserva los datos visibles durante una actualización, sin reemplazarlos por carga en cada operación.
4. **Carga permanente en Caja.** Una carga inicial fallida dejaba `estado` vacío y la condición `loading || !estado` mostraba la carga indefinidamente. Ahora se muestra un error y una acción de reintento. Ventas también ofrece reintento y el mensaje de Inventario describe una carga local.
5. **Descarga de todos los módulos al entrar.** Las páginas del ERP usan carga diferida. El menú y la cabecera permanecen montados mientras se carga el módulo, con un esqueleto de contenido. Un límite de errores por ruta conserva la navegación si falla una vista; también mantiene la opción existente de recargar la página.

Referencias: `client/services/mock/mockUtils.ts`, `client/lib/latestRequest.ts`, las páginas `VentasPage.tsx`, `CajaPage.tsx`, `InventarioPage.tsx`, `client/app/router.tsx` y `client/components/layout/AppLayout.tsx`.

No se cambió la política de escritura síncrona de `localStorage`: diferir guardados sin garantizar su finalización podría volver a introducir pérdidas al cerrar la pestaña. Tampoco se agregó virtualización sin evidencia de que el volumen de datos lo requiera.

## Evidencia técnica

| Verificación | Resultado |
|---|---|
| Suite general tras los cambios principales | 57 pruebas aprobadas en 11 archivos |
| Regresión adicional de diez recorridos del store | Archivo de persistencia aprobado: 9 pruebas, incluida la nueva |
| Consultas fuera de orden | Una prueba ejecuta diez rondas y verifica que la respuesta antigua no publique ni siga vigente después de invalidar |
| Suscripciones del store | Diez ciclos de alta/consulta/edición/desuscripción; cada listener recibe solo sus dos notificaciones y no vuelve a recibir en los ciclos posteriores |
| Clonación | Prueba de rechazo de datos no clonables y prueba de instantánea independiente durante la demora |
| TypeScript y compilación | Validados; ver comprobación final de la entrega |
| Servidor existente | `http://localhost:8080/` respondió HTTP 200 |

Las pruebas son de lógica en Node y almacenamiento simulado. Diez rondas automatizadas no equivalen a diez recorridos visuales en un navegador ni prueban ausencia de fugas de memoria de toda la aplicación.

### Tamaño de compilación

| Archivo generado | Antes, fase 2 | Después |
|---|---:|---:|
| JavaScript de entrada, sin comprimir | 1.505,85 kB | 430,16 kB |
| JavaScript de entrada, gzip | 388,77 kB | 135,00 kB |

El archivo de entrada disminuye aproximadamente 71% sin comprimir. El código restante se distribuye en archivos de páginas y dependencias compartidas: no desaparece ni esos 430,16 kB representan toda la transferencia al visitar una página. La compilación genera archivos separados para Productos (72,01 kB), Inventario (67,56 kB), Caja (100,34 kB) y Ventas (107,25 kB), además de sus dependencias. Son medidas del build de producción; Vite en desarrollo sirve los módulos de otra manera.

La compilación ya no presenta chunks superiores a 500 kB en esta ejecución. Se conserva el aviso sobre datos antiguos de Browserslist. No se instalaron dependencias para estos ajustes.

## Comparación en el servidor existente

1. Recargar <http://localhost:8080/> para tomar el nuevo enrutador.
2. Visitar <http://localhost:8080/productos>, registrar/editar y comprobar que no reaparezca una carga completa tras guardar.
3. Visitar <http://localhost:8080/ventas>, realizar una operación de prueba y comprobar que el listado o POS se actualice sin una segunda recarga completa del módulo.
4. Visitar <http://localhost:8080/inventario>, realizar un ajuste de prueba y comprobar las existencias y movimientos resultantes.
5. Visitar <http://localhost:8080/caja> y consultar datos después de una operación. Los fallos de carga no deben dejar un indicador permanente: debe existir una salida de reintento.
6. Repetir Productos → Ventas → Inventario → Caja → Productos diez veces, usando datos de prueba. Registrar cualquier bloqueo con pasos, navegador, hora y mensaje de consola.

La arquitectura y los textos de recuperación tienen cambios; el rediseño de colores y densidad de pantallas corresponde a la fase 4.

## Pendientes para cerrar la validación de fase 3

- Grabar perfiles Performance del recorrido que bloqueaba la aplicación y repetirlo diez veces.
- Medir carga, búsqueda, guardado y costo de serialización/escritura con el mismo catálogo y equipo antes y después. Usar el protocolo de `diagnostico-fase-1.md`; no deducir esos tiempos del tamaño de archivos ni de Vitest.
- Identificar el equipo y navegador del reporte original y comprobar la recuperación visible ante errores en una sesión autenticada.
- Confirmar un presupuesto de respuesta basado en esas mediciones.

Estos pendientes impiden declarar resuelto el bloqueo original. Las correcciones se apoyan en fallos concretos del código y pruebas de regresión, no en una reproducción de ese reporte.
