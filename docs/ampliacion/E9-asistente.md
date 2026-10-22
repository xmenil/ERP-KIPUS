# E9 — Asistente y recomendaciones locales

21/10/2026. Se conservaron los cambios locales de E0–E8 y los archivos ajenos. Servidor existente `http://localhost:8080/` comprobado con HTTP 200; no se inició otra instancia. Prototipo con `localStorage`, sin DB, modelos, claves ni servicios externos. Sin scripts de navegador, capturas, commit, push ni despliegue. La fase 5 anterior permanece cancelada.

El usuario aprobó la revisión visual de E8 al solicitar E9. Esta aprobación no acredita apertura de CSV, guardado de PDF ni recorridos con lector de pantalla.

## Comportamiento implementado

- Conversación basada en reglas explícitas. No se presenta como IA externa, analítica predictiva ni respuesta a cualquier pregunta. Se retiraron las tarjetas repetidas y la afirmación fija de que los clientes con RUC generan 65% del ticket.
- Mayor saldo: orden descendente por `saldoPendiente`, empates explícitos e inclusión identificada de fichas inactivas. Se avisa que los saldos heredados del prototipo no están conciliados con ventas/cobros y no acreditan deuda exigible. Ausencia de saldo no se interpreta como cuentas al día.
- Producto más vendido: suma de unidades de ventas completadas menos devoluciones en su fecha, con orden descendente y empates. Conserva datos históricos aunque el producto no esté en el catálogo. No usa el primer producto del directorio ni inventa un producto cuando no hay ventas.
- Ventas y gastos: comparten `calcularReporte` de E8. Excluyen ventas pendientes/anuladas y gastos anulados por estado actual. Devoluciones en su fecha, incluso de ventas previas; crédito separado de cobros efectivamente registrados en Caja. Las respuestas muestran fuente y alcance.
- Periodos: hoy, ayer, últimos 7/30 días, mes actual hasta hoy, mes anterior completo y año actual hasta hoy. Fechas de calendario UTC e inclusivas, igual que E8. La pregunta puede sustituir el periodo del selector; el alcance efectivo aparece junto a la respuesta. Fechas no admitidas y periodos ambiguos piden precisión, sin usar otro periodo silenciosamente.
- Stock: solo productos activos. Prioriza agotados, proporción stock/mínimo, cantidad e ID. Se informa stock y mínimo configurado; no se anuncia reposición ya registrada. Catálogo vacío y ausencia de stock crítico tienen mensajes distintos.
- Caja: informa estado abierto/cerrado, valores guardados del turno, otros ingresos, egresos y cobros digitales. Una caja cerrada se presenta como último turno guardado, sin afirmar efectivo físico disponible o saldo bancario confirmado.
- Stock, Caja y saldos de clientes son actuales. Un pedido histórico se aclara; el selector de ventas no convierte esos datos en un histórico inexistente.
- Consultas desconocidas, múltiples temas y pronósticos piden una pregunta admitida. Pedir crear, registrar, anular o pagar devuelve orientación al módulo y su formulario. Ninguna respuesta ejecuta una escritura.

## Reposición de Compras

`sugerenciaComprasService` utiliza ventas completadas y devoluciones de los últimos 30 días UTC. Se retira la suma adicional de salidas de Kardex, las ventas anuladas/pendientes, el ritmo mínimo inventado y el costo de respaldo calculado con 75% del precio de venta.

Cantidad orientativa: diferencia entre stock y el mayor de dos veces el mínimo o 15 días al ritmo neto positivo observado (unidades netas de 30 días / 30). Cobertura sin ventas positivas: no disponible. Si no hay mínimo ni demanda para estimar cantidad, no se inventa una: queda sin seleccionar y exige una cantidad antes de continuar. La regla se muestra como orientación revisable, no como pronóstico.

Solo se ofrece automáticamente un proveedor cuando hay exactamente uno activo. Con cero o varios, se elige en el formulario; no se asigna un RUC ficticio ni se presume una relación producto/proveedor. El catálogo de inactivos queda fuera.

Modal de revisión con selección, cantidades etiquetadas, costo actual, periodo, fuente, cobertura, total y paginación de diez productos. «Revisar en formulario de compra» transfiere el borrador a `NuevaCompraDialog`. No guarda la compra: sigue siendo necesaria la validación y confirmación del formulario de E4. La acción del banner es secundaria para conservar una sola acción principal en Compras.

## Interfaz y errores

`KipusIaPage` presenta descripción local, selector, conversación y ejemplos breves. Cada respuesta muestra hora, alcance, fuente y datos. Los enlaces respetan los permisos de ruta existentes. Preguntas limitadas a 500 caracteres; bloqueo síncrono de doble envío y botones de ejemplo durante una consulta. El texto se conserva si la lectura falla y «Reintentar» reutiliza la pregunta y periodo originales sin duplicar el mensaje.

Las respuestas de consultas desmontadas se descartan. Foco devuelto al campo, registro de conversación con `role="log"`/`aria-live="polite"`, estado de consulta y errores anunciables. Scroll limitado al panel, datos numéricos tabulares, tokens y acciones de 44 px en móvil. La conversación solo vive en esta pantalla; los datos de negocio continúan en `localStorage` sin modificaciones causadas por consultar.

## Archivos

- `client/features/kipus-ia/services/kipusIaService.ts`: reglas, periodos, ordenamientos, lectura y respuesta.
- `client/features/kipus-ia/types/kipus-ia.types.ts`: contrato de conversación, alcance y enlaces.
- `client/features/kipus-ia/pages/KipusIaPage.tsx`: conversación, ejemplos, periodo, carga y reintento.
- `client/features/compras/services/sugerenciaComprasService.ts`: reposición calculada con ventana real.
- `client/features/compras/components/RecomendacionComprasModal.tsx`: revisión sin guardado implícito.
- `client/features/compras/pages/ComprasPage.tsx`: contrato de rango y texto/acción del banner de reposición.
- `kipusIaService.spec.ts` y `sugerenciaComprasService.spec.ts`: 20 regresiones de E9.

## Preguntas de contraste y evidencia

Rol previsto: administrador, con acceso a KIPU'S IA. Navegador no operado por indicación del usuario. Fixtures de Vitest aislados, sin escritura en su perfil. Las pruebas de funciones puras comparan datos originales antes/después para detectar mutaciones.

| Caso | Pregunta o recorrido | Resultado comprobado |
|---|---|---|
| E9-01 | «¿Qué cliente tiene la mayor deuda?» con saldos 10/90/90 | Luis y Rosa, S/ 90 cada uno, aunque Ana sea la primera ficha; inactivo identificado y aviso de no conciliación |
| E9-02/03 | «¿Cuál es el producto más vendido del mes?» | Producto p2, no p1 del catálogo; dos unidades menos una devuelta = una neta; anuladas, pendientes y septiembre excluidos |
| E9-04/05 | «¿Cuánto vendí hoy?» y selector Ayer | Mismos importes que Reportes; venta a crédito no se supone cobrada; días y límites correctos |
| E9-06 | «ventas hoy y ayer», «ventas de 2025» o rango no soportado | Solicita un solo periodo admitido |
| E9-07/08 | «¿Qué stock debo reponer?» / «stock ayer» | Agotados primero, luego menor proporción stock/mínimo; no simula stock histórico |
| E9-09 | «efectivo de caja» con caja cerrada | Último turno guardado, otros ingresos incluidos y sin afirmar efectivo contado |
| E9-10/11/15 | Catálogos vacíos, pregunta desconocida y fichas sin saldo | Sin cifras/productos inventados, pronósticos ni afirmación de cuentas conciliadas |
| E9-12 | «Genera una compra» | Devuelve enlace a Compras y datos originales intactos |
| E9-13/14 | «¿Cuánto gasté hoy?» y fallo de lectura | Solo gasto activo del día; error propagado para reintento |
| E9-16–20 | Reposición, devoluciones, proveedores e inactivos | Ventana 30 días, unidades/cobertura/cantidad reconstruibles, sin ritmo/costo/proveedor ficticio ni doble Kardex |

Incidencias corregidas: E9-F01 (P1, máximos incorrectos por tomar primer registro), E9-F02 (P1, fechas/anulaciones y vacíos ignorados), E9-F03 (P1, recomendaciones con ventas/Kardex duplicados y cifras de respaldo), E9-F04 (P1, consultas sin manejo de fallo/doble envío y mensajes predictivos ficticios). Evidencia: casos anteriores y código indicado; sin evidencia visual nueva ni commit. En la primera pasada las pruebas detectaron «mayor» confundido con mayo y «del mes anterior» reconocido también como mes actual; se corrigieron y las 20 pruebas enfocadas pasaron.

Verificación final: TypeScript aprobado; 20/20 pruebas enfocadas de E9 aprobadas y suite completa de 200 pruebas en 26 archivos aprobada; build de cliente y servidor aprobado. También se verificaron las 14 regresiones de proveedores al tocar la selección de proveedor en sugerencias. La ejecución de Vitest/build usó los procesos de esbuild autorizados por revisión automática, necesarios por la restricción `spawn EPERM` del sandbox. Los avisos previos de ZXing/Browserslist no causaron fallos.

## Pendientes y comparación

Pendientes humanos de E9: revisar escritorio/móvil y claro/oscuro, teclado/foco y anuncio de respuestas con lector de pantalla; probar error/reintento en navegador y confirmar el recorrido sugerencia → formulario → guardar. No se dan por aprobados mediante lectura de código ni por la aprobación visual de E8.

Comparar `http://localhost:8080/kipus-ia` y `http://localhost:8080/compras`. Contrastar preguntas con `/reportes`, `/clientes`, `/inventario` y `/caja`. Para las cifras de ventas/gastos, usar el mismo periodo UTC de Reportes. E10 sigue pendiente y no se reactiva la fase 5 anterior.
