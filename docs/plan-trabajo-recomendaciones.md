# Plan de trabajo para atender las recomendaciones de KIPU'S ERP

Fecha: 21 de octubre de 2026.

Fuente: [recomendaciones.md](./recomendaciones.md).

Estado: propuesto; las tareas están pendientes de ejecución.

Avance del 21/10/2026: fase 1 iniciada. El [diagnóstico y línea base](./diagnostico-fase-1.md) registra pruebas aisladas, hallazgos reproducidos e inventario inicial. Siguen pendientes la reproducción del bloqueo y las mediciones en navegador; la fase no se declara completamente cerrada.

Continuación del 21/10/2026: se implementaron correcciones de persistencia local del catálogo y actualización del listado. Ver [avance de fase 2 y comparación local](./avance-fase-2-productos.md). Por indicación del usuario, el prototipo mantiene `localStorage`; una base de datos no es un requisito de estas fases.

Fase 3, 21/10/2026: implementadas protecciones frente a respuestas antiguas, errores de clonación, carga permanente de Caja y consultas duplicadas; módulos con carga diferida. Ver [evidencia y validación pendiente](./avance-fase-3-estabilidad.md). Continúan pendientes los perfiles del bloqueo original en navegador.

Fase 4, 21/10/2026: reorganizadas las cinco pantallas priorizadas, formulario y acciones de Productos, indicadores, navegación y controles de móvil. Ver [cambios, capturas y comprobaciones](./avance-fase-4-interfaz.md). La evaluación con usuarios y la comparación de puntuaciones corresponden a la fase 5.

## Objetivo y alcance

Corregir los problemas reportados de registro de productos y bloqueos, reducir la saturación visual y facilitar los recorridos de trabajo del comerciante. El resultado debe demostrar mejoras mediante pruebas repetibles y observaciones de usuarios.

La evaluación de origen asigna 3/5 a las seis dimensiones. Se utilizará como referencia inicial, no como una medición técnica de fallos o rendimiento. La meta propuesta es alcanzar al menos 4/5 en cada dimensión tras repetir la evaluación con tareas y criterios comunes. No se calculará una ponderación hasta definir los pesos.

El alcance comprende diagnóstico, correcciones funcionales, ajustes de interfaz y validación. Se prioriza Productos y luego los recorridos de venta, inventario, caja y consulta de resultados que estén implementados. Este documento no implica que los ajustes ya se hayan realizado.

## Contexto técnico revisado

- El catálogo se gestiona desde `client/features/productos/pages/ProductosPage.tsx`, sus formularios y `client/features/productos/services/productosService.ts`.
- El servicio de productos utiliza `erpStore` y una demora simulada. El estado del ERP tiene lectura y escritura en `localStorage` dentro de `client/services/erp/erpStore.ts`.
- Existen pruebas en `client/services/erp/erpStore.productos.spec.ts` para códigos y modificaciones del catálogo. Será necesario complementar la cobertura de persistencia y fallos de guardado.
- La página de productos se suscribe a cambios del ERP y vuelve a cargar el catálogo. Se revisará su comportamiento con operaciones sucesivas antes de atribuirle problemas de rendimiento.
- Las reglas visuales están en `.agents/skills/kipus-ui/SKILL.md`. Se reutilizarán los componentes de `client/components/ui` y se verificará la ubicación real de los tokens en `client/global.css` y `tailwind.config.ts` antes de modificarlos.

Los bloqueos y la pérdida de productos son reportes pendientes de reproducción. La revisión anterior identifica puntos de investigación, pero no demuestra todavía la causa. La persistencia local tampoco implica sincronización entre equipos o navegadores; cualquier necesidad de ese tipo deberá definirse expresamente antes de ampliar la arquitectura.

## Prioridades y trazabilidad

| ID | Observación de origen | Trabajo previsto | Prioridad | Evidencia de aceptación |
|---|---|---|---|---|
| R01 | El producto a veces no se registra o desaparece al actualizar | Reproducir, corregir el guardado y comprobar conservación de datos | P0 | Alta y edición verificadas tras recarga y nueva sesión, según el contrato definido |
| R02 | La página se cuelga | Medir y corregir la causa reproducida de bloqueos | P0 | Mismo recorrido completado repetidamente sin bloqueo y con mediciones comparables |
| R03 | Botones, formularios y operaciones deben cumplir lo anunciado | Inventariar acciones y probar recorridos completos | P1 | Acciones del alcance probadas con resultado verificable |
| R04 | Navegación poco clara | Unificar nombres, acciones principales y siguientes pasos | P1 | Usuarios nuevos completan tareas sin instrucciones constantes |
| R05 | Diseño y colores cansan la vista | Aplicar tokens, tipografía, alineación y contraste coherentes | P1 | Revisión visual, teclado y resoluciones aprobada |
| R06 | Pantallas demasiado cargadas | Priorizar datos, agrupar campos y reducir elementos repetidos | P1 | Tarea principal identificable y datos útiles accesibles |
| R07 | Falta demostrar iteración y mejora | Registrar hallazgos, cambios y repetición de pruebas | P1 transversal | Cada hallazgo tiene estado, evidencia y resultado posterior |
| R08 | Errores y confirmaciones deben ser comprensibles | Completar estados y mensajes accionables | P1 | Validación, carga, vacío, error y éxito revisados en los flujos críticos |

P0: afecta la continuidad de trabajo o la conservación de datos. P1: afecta la claridad y la operación habitual. Los ajustes decorativos menores se atienden después de estas prioridades.

## Fase 1. Diagnóstico y línea base

Responsable propuesto: desarrollo, con apoyo de quien reportó el problema.

Estimación: 1–2 días laborables. Dependencia: ninguna.

- [ ] Registrar navegador, dispositivo, rol, pasos, datos usados, frecuencia y resultado esperado de cada incidencia.
- [ ] Reproducir alta y edición de productos con SKU y código de barras distintos, con y sin filtros activos.
- [ ] Distinguir entre dato no guardado, dato oculto por filtros/paginación y lista que no se actualiza.
- [ ] Revisar formularios, validaciones, servicio, notificaciones del store, persistencia, inicialización y cierre de sesión.
- [ ] Comprobar qué ocurre si el almacenamiento está lleno, bloqueado o contiene datos inválidos, usando un entorno de prueba con respaldo de los datos.
- [ ] Registrar consola y perfiles de rendimiento al abrir Productos, buscar, guardar, navegar y consultar resultados.
- [ ] Medir con el mismo dispositivo y conjunto de datos: carga de catálogo, respuesta de búsqueda y guardado. Separar la demora simulada del procesamiento real.
- [ ] Inventariar acciones visibles de los módulos incluidos y marcar las que no tienen comportamiento completo.

Entregable: registro de incidencias y mediciones iniciales con pasos reproducibles. Si un fallo no se reproduce, conservarlo como pendiente con las condiciones que faltan; no darlo por corregido.

## Fase 2. Guardado y edición confiables de productos

Responsable propuesto: desarrollo.

Estimación: 2–3 días. Dependencia: diagnóstico de R01.

- [ ] Definir el contrato de persistencia del prototipo: qué se conserva al recargar, cerrar y abrir el navegador o cerrar sesión, y si los datos son compartidos o separados por usuario/negocio.
- [ ] Corregir las causas comprobadas en el recorrido formulario → servicio → store → almacenamiento → lista y detalle.
- [ ] Revisar que un error de escritura no se comunique como guardado exitoso y que no deje datos inconsistentes entre memoria y almacenamiento.
- [ ] Evitar envíos duplicados mientras se guarda y conservar los valores introducidos ante un fallo.
- [ ] Mostrar errores específicos de campos y conflictos de códigos; enfocar el primer campo inválido.
- [ ] Confirmar el guardado con un mensaje claro y permitir ubicar el producto aunque los filtros actuales lo excluyan.
- [ ] Añadir pruebas de regresión de alta, edición, recarga del estado, duplicados, errores de persistencia y ausencia de modificaciones parciales.

Criterio de cierre: el producto creado y su edición se conservan en todos los escenarios acordados; una operación fallida no anuncia éxito, no pierde el formulario ni altera parcialmente el registro. Cerrar sesión se comprobará contra el contrato definido, sin asumir que deba borrar el catálogo.

## Fase 3. Estabilidad y respuesta de la aplicación

Responsable propuesto: desarrollo.

Estimación: 1–3 días. Dependencia: línea base de R02; coordinar con la fase 2 cuando compartan causa.

- [ ] Revisar ciclos de efectos, suscripciones y limpieza al desmontar componentes.
- [ ] Comprobar respuestas asíncronas fuera de orden, recargas redundantes y estados de carga que no finalizan.
- [ ] Medir el costo de filtros, ordenamiento, renderizado y serialización del store con catálogos representativos.
- [ ] Aplicar únicamente las optimizaciones justificadas por las mediciones; reutilizar la paginación existente y valorar otras medidas si el volumen lo exige.
- [ ] Completar recuperación y reintento ante errores sin obligar al usuario a recargar toda la aplicación.
- [ ] Repetir diez veces el recorrido que producía el bloqueo, registrando dispositivo, volumen y tiempos.

Criterio de cierre: diez recorridos consecutivos sin bloqueo, sin errores de ejecución asociados y sin crecimiento sostenido de suscripciones. Comparar tiempos antes/después bajo las mismas condiciones y fijar en el diagnóstico un presupuesto de respuesta acorde al equipo de prueba; no declarar mejora solo por percepción.

## Fase 4. Orden visual y facilidad de uso

Responsable propuesto: frontend/diseño, con validación de un usuario del negocio.

Estimación: 3–4 días. Dependencia: flujos principales estables de las fases 2 y 3.

- [ ] Comenzar por Productos como pantalla piloto: definir tarea principal, orden de lectura y acción «Nuevo producto».
- [ ] Usar superficies neutras y el violeta existente como acento; reservar los colores semánticos para estados del negocio, acompañados de texto.
- [ ] Unificar escala tipográfica, espacios, bordes y alineación; mostrar importes y cantidades alineados a la derecha.
- [ ] Retirar tarjetas, indicadores, iconos y textos repetidos que no ayuden a completar la tarea; conservar la información útil en detalles o secciones pertinentes.
- [ ] Agrupar campos relacionados y mantener búsqueda, filtros y acciones en posiciones coherentes.
- [ ] Revisar nombres de menús y botones con vocabulario del comerciante y una acción primaria por vista.
- [ ] Completar estados de carga, vacío, error y éxito, con mensajes que indiquen qué ocurrió y cómo continuar.
- [ ] Validar el piloto y extender sus patrones al dashboard, inventario, ventas y caja, según el inventario de pantallas existentes.
- [ ] Verificar móvil, escritorio, zoom de 200%, foco, uso con teclado, etiquetas y contraste AA; evitar scroll horizontal de toda la página.

Entregables: capturas comparables antes/después, criterios visuales aplicados y lista de pantallas revisadas. Reutilizar `kipus-ui` como guía del proyecto, sin crear una segunda paleta o un sistema de componentes paralelo.

Criterio de cierre: la acción principal se reconoce, los datos prioritarios se leen sin elementos que compitan innecesariamente y las tareas siguen siendo posibles en móvil y con teclado.

## Fase 5. Pruebas completas, validación e iteración

Responsable propuesto: desarrollo y una persona que coordine las pruebas. Participantes: al menos tres usuarios que no hayan desarrollado el prototipo.

Estimación: 2–3 días. Dependencia: fases anteriores completadas para los recorridos evaluados.

- [ ] Ejecutar los casos de la matriz siguiente y adjuntar resultado esperado, real y evidencia.
- [ ] Ejecutar `pnpm typecheck`, `pnpm test` y `pnpm build`; comparar cualquier fallo con la línea base y resolver los causados por los ajustes.
- [ ] Pedir a cada participante las mismas tareas, con datos y entorno equivalentes, sin indicar dónde pulsar.
- [ ] Registrar finalización, tiempo, errores y solicitudes de ayuda. Obtener una medición inicial antes de los ajustes visuales y repetirla después.
- [ ] Reaplicar las seis dimensiones de evaluación con la misma escala. Registrar participantes y puntuaciones para que la comparación sea interpretable.
- [ ] Priorizar nuevos hallazgos por pérdida de datos, bloqueo, impedimento de tarea y dificultad de uso, en ese orden.
- [ ] Corregir los hallazgos prioritarios y repetir los mismos casos afectados.

Meta de usabilidad propuesta: al menos el 80% de las tareas asignadas se completa sin ayuda y ninguna tarea crítica queda impedida. Documentar resultados reales aunque no alcancen la meta; una media favorable no compensa un fallo de pérdida de datos.

## Matriz mínima de pruebas de aceptación

| Caso | Recorrido | Resultado esperado |
|---|---|---|
| T01 | Crear producto válido, buscarlo y abrir su detalle | Los valores coinciden con los registrados |
| T02 | Recargar y volver a abrir el navegador en el mismo perfil | El producto continúa disponible según el contrato de persistencia |
| T03 | Editar nombre/precio y volver a consultar tras recargar | Los cambios se conservan sin alterar otros campos |
| T04 | Cerrar sesión y volver a ingresar | Se respeta la conservación y separación de datos definidas |
| T05 | Enviar campos obligatorios vacíos o códigos duplicados | Error junto al campo, sin crear ni modificar parcialmente registros |
| T06 | Pulsar Guardar repetidamente | Se genera una sola operación y el estado de envío es visible |
| T07 | Simular fallo de almacenamiento | No se anuncia éxito; se conserva el formulario y se informa cómo continuar |
| T08 | Crear con búsqueda/filtros activos | Se confirma el resultado y se puede localizar el producto |
| T09 | Repetir navegación, búsqueda y edición diez veces | No hay bloqueos ni respuestas antiguas que sustituyan datos recientes |
| T10 | Registrar una operación implementada, por ejemplo una venta, y consultar su resultado | Venta, stock, caja y comprobante reflejan lo previsto para ese flujo |
| T11 | Operar flujos críticos en móvil, con teclado y zoom 200% | Acciones accesibles, foco visible y contenido legible |
| T12 | Usuario nuevo registra, edita y consulta un producto | Completa la tarea y comprende confirmaciones y errores sin guía constante |

Los casos de almacenamiento se ejecutarán sobre datos de prueba. Las comprobaciones entre módulos se adaptarán al comportamiento implementado y documentarán cualquier función aún simulada.

## Secuencia y esfuerzo estimado

| Orden | Entrega | Esfuerzo estimado |
|---|---|---|
| 1 | Diagnóstico y línea base | 1–2 días |
| 2 | Persistencia y edición de productos | 2–3 días |
| 3 | Estabilidad y rendimiento | 1–3 días |
| 4 | Piloto visual y extensión a pantallas priorizadas | 3–4 días |
| 5 | Validación, correcciones y reevaluación | 2–3 días |
| | Total orientativo | 9–15 días laborables |

Estimación para una persona de desarrollo con disponibilidad de usuarios para validar. Se ajustará tras el diagnóstico según las causas y cantidad de pantallas afectadas. No incluye una migración a base de datos ni nuevas integraciones; si el diagnóstico demuestra que son necesarias, se documentará su alcance y estimación antes de incorporarlas.

## Registro de seguimiento

Mantener una fila por hallazgo y vincular cada corrección con su versión o commit y sus pruebas.

| ID | Dimensión | Pasos y evidencia inicial | Impacto | Responsable | Estado | Cambio/versión | Prueba repetida y resultado |
|---|---|---|---|---|---|---|---|
| INC-001 | Funcionamiento | Pendiente: reproducir producto que no se conserva | P0 | Por asignar | Pendiente | — | — |
| INC-002 | Funcionamiento | Pendiente: reproducir bloqueo reportado | P0 | Por asignar | Pendiente | — | — |
| INC-003 | Carga visual/diseño | Pendiente: capturas y tarea principal por pantalla | P1 | Por asignar | Pendiente | — | — |

Estados: pendiente, en diagnóstico, en corrección, en validación y cerrado. Un hallazgo se cierra con evidencia de la prueba repetida; si no se reproduce, se deja explícitamente pendiente de evidencia.

## Condiciones de finalización

- [ ] R01 y R02 tienen diagnóstico y corrección verificada, o una condición pendiente claramente documentada que impide declarar el plan completado.
- [ ] Los recorridos críticos guardan los datos conforme al contrato acordado y comunican los fallos sin falsos mensajes de éxito.
- [ ] Las pantallas priorizadas cumplen la guía visual y las verificaciones de accesibilidad y adaptación.
- [ ] Las comprobaciones técnicas pasan y los resultados de aceptación quedan registrados.
- [ ] La evaluación final incluye las seis dimensiones, comparación antes/después y observaciones de los usuarios.
- [ ] Cada recomendación tiene una tarea, evidencia de resultado y estado de cierre trazable.
