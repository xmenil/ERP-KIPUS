# Seguimiento de ampliación

21/10/2026. Historial de entregas E0–E10; la publicación al repositorio fue solicitada después del cierre técnico (ver último apartado). Fase 5 anterior permanece cancelada.

| Entrega | Estado | Evidencia / siguiente paso |
|---|---|---|
| E0 | Completada | Inventario, contrato y 16 capturas en `00-linea-base.md`; typecheck, 58 pruebas y build aprobados |
| E1 | Completada en su alcance local | `E1-persistencia.md`; typecheck, 87 pruebas y build aprobados. Cinco flujos en navegador con fallo, borrador, reintento y doble clic, sin excepciones. Preferencia de venta sin stock sigue bloqueada hasta E2 |
| E2 | Completada | `E2-configuracion.md`; typecheck, 103 pruebas y build aprobados; persistencia, sesión, errores, numeración y capturas aisladas verificadas |
| E3 | Completada | `E3-proveedores.md`; typecheck, 119 pruebas y build aprobados; directorio, referencias, selección en Compras y CSV descargado comprobados en navegador |
| E4 | Completada | `E4-compras.md`; saldo suficiente, filtros y resumen por periodo. Verificación técnica aprobada; comparación visual aprobada por el usuario al solicitar E8. |
| E5 | Completada | `E5-gastos.md`; filtros y resumen por periodo. Verificación técnica aprobada; comparación visual aprobada por el usuario al solicitar E8. |
| E6 | Completada en código | `E6-clientes.md`; TypeScript, suite unitaria completa y build aprobados. Sin revisión por script de navegador ni capturas, según instrucción del usuario. |
| E7 | Completada en código | `E7-usuarios.md`; lectura/escritura, autenticación, cambio de sesión, permisos por ruta y menú, recuperación local y controles del último administrador implementados. 155 pruebas, TypeScript y build aprobados. Sin recorrido de navegador por indicación del usuario. |
| E8 | Completada en código | `E8-reportes.md`; TypeScript, 180 pruebas y build aprobados. Revisión visual aprobada por el usuario al solicitar E9; apertura de CSV/guardado PDF en navegador pendientes. |
| E9 | Completada en código | `E9-asistente.md`; consultas locales, periodos y fuentes, reposición revisable sin escritura implícita. TypeScript, 200 pruebas en 26 archivos y build aprobados. Revisión manual pendiente. |
| E10 | Verificación técnica completada | `E10-integracion.md`; diez pruebas integradas, TypeScript, 210 pruebas en 27 archivos y build aprobados. Matriz A01–A15 con pendientes de navegador explícitos; A13/A14 pendientes. |

## Comprobación final

- E0: 24 navegaciones (ocho módulos × 1440/720/390), 16 capturas y cero excepciones. Servidor existente HTTP 200; no se inició otro.
- E1: 15 navegaciones de los cinco flujos críticos a esos anchos; pruebas directas de las cinco operaciones con almacenamiento normal y fallido. Formularios de gasto/compra/cobro/ingreso/ajuste conservan borrador o confirmación y estado previo; cada doble clic del reintento crea un solo registro. Gasto y compra se comprobaron después de recargar; también se recargó el POS. La suite comprueba reinicialización de las cinco operaciones.
- Fuentes: `evidencias/E0/revision.json`, `evidencias/E1/revision.json`, `pruebas-E1.txt`, `build-E1.txt` y `navegador-E1.txt`.
- Los intentos intermedios de navegador detectaron el total inicial del modal de cobro y dos esperas/selectores del script. Se corrigieron; el resultado final es el JSON y log de la ejecución que terminó correctamente.
- `git diff --check` sin errores de whitespace. No se incluyó ni modificó `docs/Nuevo documento de texto.txt`.

## Revisión estática previa de E4 y E5

La revisión anterior encontró que Compras no validaba saldo/filtro de fecha y Gastos carecía de filtro de fecha. Los tres defectos se corrigieron en el ajuste documentado al final. Los factores artificiales y gastos anulados de `reportesService` se corrigieron posteriormente en E8.

## Siguiente entrega

E4–E9 están completadas en código y E10 en su verificación técnica, por solicitud expresa. No se ejecutaron nuevas comprobaciones visuales automatizadas por indicación del usuario. El usuario aprobó E4/E5 al solicitar E8 y aprobó visualmente E8 al solicitar E9. El siguiente trabajo pendiente son los recorridos manuales de la matriz E10; el plan no se declara completamente cerrado.

Rutas para comparar con el mismo origen: `http://localhost:8080/ventas`, `/compras`, `/gastos`, `/inventario?tab=ajustes`, `/caja`, `/proveedores`, `/clientes`. Las capturas están bajo `docs/ampliacion/evidencias/E0/` y `E1/`. Los datos de prueba pertenecen únicamente al perfil aislado del runner.

## Cierre de E7

El directorio `kipus_erp_users_list` ahora valida lectura y escritura y comparte una sola fuente de verdad con el login. Contenido JSON ilegible o inválido se preserva y bloquea cambios; fallos de escritura se propagan. Usuarios nuevos requieren campos válidos y contraseña explícita, usuario/correo se normalizan y no se exponen contraseñas en listados ni exportación. Las cuentas demo tienen una sola representación: las cuentas demo secundarias se desactivan al retirarse y no reaparecen activas.

La sesión activa recoge cambios de nombre, correo, rol y sucursal; una cuenta desactivada o retirada pierde su sesión. La navegación y las rutas directas usan la misma matriz: administrador (todos), cajero (resumen, ventas, caja, clientes), supervisor (resumen, productos, inventario, compras, proveedores, clientes). Se quitó el acceso genérico que creaba administradores y se impide dejar el directorio sin administrador activo. Login explica que el cambio de clave se solicita a un administrador; detalle omite el último acceso ficticio y el directorio informa que roles/contraseñas son locales, no seguridad de servidor.

Verificación: TypeScript aprobado, 155/155 pruebas en 21 archivos, build cliente/servidor aprobado. Ocho pruebas nuevas cubren contenido ilegible y escritura fallida, normalización/duplicados/filtrado de contraseña, último administrador, alta/login/cambio de rol/desactivación, rechazo del acceso genérico y matriz de roles. La suite muestra mensajes internos de ZXing en pruebas de detección que terminan aprobadas; build mantiene el aviso histórico de Browserslist desactualizado.

No se ejecutaron scripts del navegador ni capturas, conforme a la instrucción del usuario. El servidor que ya estaba activo respondió HTTP 200; no se inició otro ni se modificaron datos del navegador. Revisar manualmente `http://localhost:8080/login` y, con administrador, `http://localhost:8080/usuarios`. La recuperación si el directorio queda corrupto consiste en conservar la clave y restaurar una copia válida; no hay restablecimiento remoto ni contraseña olvidada simulada. Detalles: `E7-usuarios.md`. Sin commit, push o despliegue.

## Cierre de E2

Persistencia en `KIPUS_ERP_CONFIGURACION_V1`; ausencia inicial, lectura inválida y fallo de escritura diferenciados. Guardado validado, sin modificar V2 al editar empresa. Empresa/RUC/sede conectados a navegación y nueva venta; cada nueva venta conserva su emisor histórico. Series y siguiente número provienen del store. PEN, IGV del 18% y venta sin stock no permitida se muestran como parámetros fijos, sin controles de edición ficticios.

Verificación final: TypeScript aprobado, 103/103 pruebas en 13 archivos y build cliente/servidor aprobado. `git diff --check` sin errores. Advertencias históricas de ZXing/Browserslist conservadas como línea base.

Chrome aislado, administrador de prueba: Configuración a 1440/720/390 px sin desbordamiento; ocho capturas. RUC/correo inválidos con foco en primer campo, fallo de escritura con borrador, reintento con doble clic (una escritura), navegación reactiva, recarga, aviso de borrador, cancelación del restablecimiento, cierre/inicio de sesión reales, emisor histórico y siguiente número comprobados. Contenido ilegible preservado, formulario bloqueado y reintento tras recuperación. Cero excepciones de ejecución. Contraste medido de texto de error: 5,83:1 claro y 6,17:1 oscuro.

Evidencia: `evidencias/E2/revision.json`, `pruebas-E2.txt`, `build-E2.txt`, `navegador-E2.txt`. Antes: `evidencias/E0/configuracion-1440.png` y `configuracion-390.png`; después: `evidencias/E2/`. Ruta: `http://localhost:8080/configuracion`. Detalles, archivos y decisiones en `E2-configuracion.md`.

Los intentos intermedios del script se corrigieron para abrir el menú Radix con teclado, comprobar la empresa con el menú lateral visible y usar el módulo ya cargado por Vite al emitir una venta de prueba. El resultado definitivo está en `revision.json`.

No se ejecutó un restablecimiento en el perfil del usuario, no se borraron claves antiguas y no se inició otro servidor. Sin commit, push ni despliegue. E3–E10 siguen pendientes; la fase 5 anterior sigue cancelada. Lector de pantalla y zoom real 200% no se acreditan con esta entrega.

## Cierre de E3

RUC normalizado y único, incluidos inactivos; alta/edición/estado/baja con persistencia atómica y validaciones compartidas. Proveedores con compras no se eliminan ni cambian de RUC; proveedores con saldo positivo tampoco se eliminan. Desactivar conserva el historial y retira al proveedor del selector de Compras. El store rechaza el proveedor inactivo aunque el formulario de compra esté desactualizado.

Directorio con búsqueda, filtros de estado/pago, tabla de escritorio/lista móvil y paginación. Detalle con historial de compras y saldo referencial claramente identificado. Formulario único en Sheet, mensajes de campo, foco, borrador/reintento, confirmación de descarte y bloqueo de doble envío. CSV con BOM, comillas/celdas escapadas y los mismos filtros de pantalla. Se retiraron verificación SUNAT y homologación simuladas.

Reproducción previa: 7 casos fallidos y 4 aprobados en `evidencias/E3/reproduccion.txt`. Verificación final: TypeScript aprobado, 119/119 pruebas en 15 archivos y build cliente/servidor aprobado; `git diff --check` sin errores. Se conservan las advertencias históricas de ZXing/Browserslist.

Chrome aislado con administrador de prueba: seis navegaciones de Proveedores/Compras a 1440/720/390 px sin desbordamiento, cero excepciones. Alta y edición con escritura fallida, borrador y reintento; alta con doble clic crea un solo registro; recarga conserva los cambios. Proveedor elegido en una compra real, edición posterior sin cambiar su historial, RUC protegido y baja con referencias deshabilitada. Desactivar/activar, fallo y reintento de estado; proveedor inactivo excluido de Compras. Baja sin referencias: cancelación, fallo sin cambios y reintento correcto. RUC duplicado rechazado junto al campo. Datos ilegibles preservados y catálogo vacío diferenciado de filtro sin resultados.

CSV descargado por Chrome y leído desde disco: un registro inactivo filtrado, con comillas, coma y caracteres españoles correctos, sin los proveedores fuera del filtro. La ruta exacta del archivo está en `evidencias/E3/revision.json` (`operations.csvFile`); cada ejecución descarga a una carpeta nueva para no leer archivos anteriores. Pruebas de CSV cubren saltos de línea y neutralización de fórmulas. Capturas en claro/oscuro; los cuatro pares de texto/estado medidos superan 4,5:1 en ambos temas. Menús operados con teclado y cierre de detalle con Esc.

Archivos y decisiones: `E3-proveedores.md`. Evidencias: `evidencias/E3/`, `pruebas-E3.txt`, `build-E3.txt`, `navegador-E3.txt`. Comparar con `evidencias/E0/proveedores-1440.png` / `proveedores-390.png`. Rutas: `http://localhost:8080/proveedores` y `http://localhost:8080/compras`.

Siguen pendientes E8–E10, zoom real 200% y lector de pantalla. No se reactivó la fase 5 anterior. Servidor y almacenamiento del perfil del usuario conservados, sin commit, push ni despliegue.

## Cierre de E4

Compras y Abastecimiento conectado a almacén, Kardex y caja. Soporte nativo para estado `PENDIENTE` (órdenes en tránsito) y `RECIBIDO` (ingreso físico inmediato). Las órdenes pendientes no alteran stock, no generan movimientos en Kardex y no descuentan caja. `recepcionarCompra` aplica la mercadería al inventario, crea asientos de entrada en Kardex y liquida el egreso en caja de forma atómica con rollback completo.

Rediseño con `SummaryStrip` (4 métricas: Compras del periodo, Mercadería recibida, Órdenes en tránsito, Proveedores activos), filtros unificados de estado y proveedor activo, tabla desktop con máximo 2 acciones visibles («Ver detalle» y «Recepcionar») más menú `...`, vista móvil responsive con tarjetas estructuradas y `AlertDialog` de confirmación detallando unidades y egreso en efectivo. Formulario de alta con secciones, totales en vivo con números tabulares y prevención de doble clic. Nuevo modal de detalle `CompraDetalleModal` con acción directa de recepción. Sugerencia inteligente de reposición conectada únicamente a proveedores activos vigentes.

Verificación final: TypeScript aprobado (0 errores), 127/127 pruebas unitarias aprobadas en 16 archivos (incluyendo 8 pruebas de ciclo de vida, persistencia y rollback en `erpStore.compras.spec.ts`) y build cliente/servidor aprobado sin errores.

Chrome aislado con administrador de prueba: seis navegaciones de Compras e Inventario a 1440/720/390 px sin desbordamiento horizontal, 0 excepciones. Validación de campos obligatorios, fallo simulado de guardado con preservación de borrador, registro de orden pendiente con cero impacto prematuro, reload y consulta de detalle con cierre Esc, confirmación y recepción de mercadería con incremento de stock, asiento Kardex y descuento de caja comprobados. Los pares de color medidos superan 4.5:1 en temas claro y oscuro. Modal de recomendación inteligente verificado.

Archivos y decisiones: `E4-compras.md`. Evidencias: `docs/ampliacion/evidencias/E4/` (`revision.json`, 13 capturas PNG). Rutas: `http://localhost:8080/compras` e `http://localhost:8080/inventario`. Siguiente entrega según el plan: E5 (Gastos y Caja).

## Cierre de E5

Módulo de Gastos y Egresos Operativos integrado con Caja Registradora (`KIPUS_ERP_STORAGE_V2`). Validaciones compartidas con Zod (`gastoValidation.ts`): categoría obligatoria, concepto (mínimo 3 caracteres), montos finitos positivos y medio de pago.

Diferenciación estricta por canal de desembolso:
- Efectivo (`EFECTIVO`): exige caja de mostrador abierta y saldo suficiente en efectivo (`saldoEfectivoEsperado >= monto`), evitando saldos negativos irreales; descuenta inmediatamente de caja y genera asiento formal en `movimientosCaja`.
- Digital o bancario (`TRANSFERENCIA`, `YAPE`, `PLIN`, `TARJETA`): se permite su registro incluso con caja física cerrada sin descontar efectivo del mostrador.
- Anulación (`anularGasto`): reversión transaccional que reintegra el dinero a la caja registradora en egresos de efectivo y actualiza el estado a `ANULADO`.
- Rollback atómico: si la persistencia falla, se restaura el saldo de caja y el listado de gastos sin efectos parciales.

Interfaz de usuario rediseñada según `kipus-ui`:
- `SummaryStrip` con 4 métricas en vivo: Total egresos del periodo, Efectivo de caja registradora (% del total), Pagos bancarios y digitales, y Rubro de mayor costo.
- Filtros unificados: búsqueda, categoría, medio de pago y estado (`Todos`, `Activos`, `Anulados`).
- Tabla de escritorio con máximo 2 acciones por fila («Ver detalle» y menú contextual `...`), más vista móvil en tarjetas estructuradas.
- Nuevo `GastoDetalleModal` con datos de auditoría (usuario, sucursal, caja de origen, estado) y diálogo de confirmación `AlertDialog` para anulación.
- `NuevoGastoDialog` con secciones explícitas, advertencia de saldo disponible en caja en vivo y prevención de doble clic.

Verificación técnica: TypeScript aprobado (0 errores), 135/135 pruebas unitarias aprobadas en 17 archivos (suite dedicada de 8 pruebas en `erpStore.gastos.spec.ts`) y build de producción cliente/servidor completado con éxito. (Por instrucción del usuario se omitieron los scripts lentos de navegador para esta etapa).

Archivos y decisiones: `E5-gastos.md`. En el ajuste posterior se agregó el rango de fechas para la lista y las métricas del periodo; el cálculo de Reportes sigue en E8.

## Ajustes puntuales de E4 y E5

E4 valida saldo de caja suficiente tanto al registrar una compra recibida en efectivo como al recepcionar una orden pendiente; si el monto supera el saldo, informa disponible/requerido y revierte sin cambios en estado, stock, Kardex ni movimientos de caja. Compras tiene filtros inclusivos desde/hasta y su `SummaryStrip` usa ese rango.

E5 tiene filtros inclusivos desde/hasta; sus métricas de periodo se recalculan con el rango y mantienen fuera los gastos anulados. El cálculo de Reportes no se modificó y sigue asignado a E8.

Verificación final: TypeScript aprobado, 160/160 pruebas en 22 archivos y build cliente/servidor aprobado. Las pruebas enfocadas aprobaron 10 casos de Compras y 3 de rango de fechas. Se añadieron `E4-09`/`E4-10` (recepción pendiente e inmediata con saldo insuficiente, sin efectos parciales) y tres pruebas de límites/fechas en `dateRange.spec.ts`. No se ejecutaron scripts ni se usó navegador automatizado. El servidor existente responde HTTP 200. Rutas: `http://localhost:8080/compras` y `/gastos`. Sin commit, push ni despliegue.

## Cierre técnico de E8 y aprobación visual de E4/E5

El usuario confirmó que realizó la comparación visual de E4/E5 y quedó bien. Se cierra ese pendiente humano; no se atribuye esta aprobación a E7/E8 ni a la fase 5 cancelada.

Reportes usa periodos dinámicos e inclusivos de calendario UTC, datos reales del store y una fuente única para pantalla/CSV/impresión. Excluye ventas pendientes/anuladas y gastos anulados; descuenta devoluciones en su fecha y separa cobros registrados de ventas a crédito. Costo y resultado identificados como estimaciones con precios actuales e IGV incluido; sin costo disponible no se inventa resultado. La demostración tributaria usa los tipos reales de ventas y explicita los supuestos de compras. No hay factores, meses, ventas ni ranking de respaldo inventados.

Interfaz: resumen compacto, tres pestañas, gráfico con tabla alternativa, ranking con búsqueda/orden/paginación y operaciones de respaldo. CSV con BOM, escape y protección de fórmulas; impresión HTML autocontenida para guardar como PDF mediante el navegador. Se mantienen todos los filtros/filas del ranking en la exportación, sin limitarse a la página visible.

Verificación: TypeScript, 180 pruebas en 24 archivos y build cliente/servidor aprobados; E8 añade 20 pruebas. Se comprobó la relectura del contenido CSV y las APIs de descarga/impresión con simulaciones. Quedan pendientes revisión visual de E8, apertura del CSV descargado y guardado del PDF en el navegador del usuario. No se ejecutaron scripts de navegador ni se guardaron imágenes. Servidor existente conservado, sin cambios de datos del perfil.

Archivos, reglas y evidencia: `E8-reportes.md`. Comparar en `http://localhost:8080/reportes`, con respaldo en `/ventas`, `/gastos`, `/compras` y `/caja`. Al cierre de E8 quedaban E9 y E10. Sin commit, push ni despliegue.

## Cierre técnico de E9 y aprobación visual de E8

El usuario confirmó que E8 quedó bien en la revisión visual al solicitar E9. Se cierra ese pendiente visual; no se da por comprobada la apertura del CSV, el guardado PDF ni el lector de pantalla.

KIPU'S IA mantiene reglas locales y consulta datos del store sin cambios. Mayor saldo ordenado con empates y aviso de falta de conciliación; producto más vendido agregado por unidades netas; stock crítico priorizado por agotados/proporción del mínimo. Ventas/gastos comparten el cálculo de Reportes, con periodos UTC y devoluciones/anulaciones coherentes. Las respuestas muestran alcance y fuente; las desconocidas o ambiguas solicitan precisión en lugar de afirmar actividad normal.

Conversación con ejemplos breves, selector de periodo, foco, región viva, carga, borrador y reintento de consulta fallida. No se anuncia IA externa ni predicciones. Las consultas y recomendaciones no registran compras ni pagos. Reposición de Compras usa ventas netas de 30 días sin doble Kardex ni cifras de respaldo inventadas; el modal permite revisar y pasar al formulario, que sigue requiriendo confirmación de guardado.

Verificación: TypeScript, 200 pruebas en 26 archivos y build cliente/servidor aprobados; E9 añade 20 regresiones. No se ejecutaron scripts de navegador ni se guardaron imágenes. Pendientes manuales de E9: comparación visual, teclado/lector de pantalla, error/reintento y sugerencia → formulario → guardado.

Archivos y preguntas de contraste: `E9-asistente.md`. Comparar `http://localhost:8080/kipus-ia` y `/compras`, con `/reportes`, `/clientes`, `/inventario` y `/caja` como respaldo. Servidor existente y almacenamiento del perfil conservados. Al cierre de E9 quedaba E10. Sin commit, push ni despliegue.

## Cierre técnico de E10

Se ejecutaron diez pruebas integradas nuevas con store y servicios reales, usando almacenamiento y reloj de prueba aislados. Cubren empresa/cliente y comprobante histórico, proveedor/compra recibida/pendiente, stock/Kardex/Caja, gasto/anulación, cuentas/sesión/permisos, periodo/exportación, asistente/reposición, rollback/reintento, vacíos/corrupción y diez ciclos de consultas/reinicialización. El CSV se escribió y reabrió en un directorio temporal exclusivo, que se eliminó al terminar. Ninguna operación accedió al perfil del usuario.

Verificación final: TypeScript aprobado, 210 pruebas en 27 archivos aprobadas y build cliente/servidor aprobado. Evidencia: `typecheck-E10.txt`, `pruebas-E10.txt`, `build-E10.txt` y `client/services/erp/erpStore.integracion.spec.ts`. No se encontraron defectos nuevos en los recorridos probados ni fue necesario modificar producción.

`E10-integracion.md` contiene la matriz A01–A15 con evidencias y límites por caso. Continúan pendientes A13/A14 y las partes de navegador de los demás casos: recargas/cierre real de navegador, doble clic, formularios y borradores, rutas por rol, descarga CSV/PDF, teclado, lector de pantalla, temas, zoom y diez recorridos entre rutas. No se atribuye aprobación completa a pruebas de lógica ni a las revisiones visuales anteriores.

Servidor existente comprobado HTTP 200; rutas para comparar indicadas en E10. Sin scripts de navegador, imágenes, DB, servicios externos, commit, staging, push ni despliegue. La fase 5 anterior sigue cancelada. E10 queda completada técnicamente; el cierre total del plan queda pendiente de las comprobaciones manuales expresas.

## Publicación solicitada al repositorio

Tras E10, el usuario autorizó subir los cambios. Se agrupan código, pruebas, plan, seguimiento y evidencias de E0–E10 en `main`, conservando los pendientes manuales declarados. Los scripts y capturas históricos de E0–E4 se incluyen como evidencia de esas entregas, sin volver a ejecutarlos ni generar imágenes nuevas. `docs/Nuevo documento de texto.txt` es ajeno al trabajo y queda fuera del commit, sin modificarlo. La autorización corresponde a commit/push al repositorio existente; no se realiza despliegue.

Validación del conjunto: TypeScript, 210 pruebas en 27 archivos y build cliente/servidor aprobados; logs de E10 incluidos. La fase 5 anterior permanece cancelada y los pendientes de navegador no se dan por aprobados al publicar el código.


