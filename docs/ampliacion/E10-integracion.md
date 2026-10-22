# E10 — Integración y cierre técnico

21/10/2026. E10 ejecutada dentro del alcance autorizado: pruebas de integración y verificaciones técnicas, sin scripts de navegador ni capturas. No se reactivó la fase 5 cancelada, no se hicieron encuestas ni puntuaciones con participantes. El servidor existente `http://localhost:8080/` respondió HTTP 200; no se inició otra instancia. Se preservaron cambios locales y archivos ajenos. Sin commit, push ni despliegue.

## Alcance y aislamiento

Se añade `client/services/erp/erpStore.integracion.spec.ts` con diez pruebas que enlazan operaciones reales del store y los servicios de Configuración, Usuarios/autenticación, Compras, Caja, Reportes y asistente. Las funciones de producción se ejecutan con `localStorage` y `sessionStorage` simulados en mapas nuevos por prueba. No se accede al perfil ni al almacenamiento del usuario.

La preparación vacía colecciones únicamente en ese almacenamiento simulado; fija el reloj de prueba en 21 oct 2026 y usa dos productos con stock 100 y caja de prueba con S/ 1,000. Se crean proveedores/clientes/operaciones E10 identificables. Reinicializar módulos comprueba que los servicios recuperan los registros persistidos, sin atribuirle el significado de cerrar y abrir un navegador real.

El CSV se escribe en un directorio temporal exclusivo, se reabre en UTF-8, se compara con las secciones calculadas y se elimina al terminar la prueba. Las pruebas previas de exportación también releen sus campos con un parser CSV. Esto acredita generación/lectura técnica del archivo; no acredita su descarga o apertura en una hoja de cálculo desde el navegador.

## Matriz A01–A15

Todos los casos de navegador quedan explícitamente diferenciados. «Lógica aprobada» no significa recorrido visual aprobado. Rol de referencia: administrador; A06 además utiliza cajero y supervisor. No hubo navegación interactiva de navegador durante E10.

| Caso | Verificación técnica y resultado | Comprobación manual restante |
|---|---|---|
| A01 | Aprobada lógica: guardar empresa, reinicializar, emitir venta y cambiar empresa; el comprobante conserva su emisor histórico | Cabecera y documento renderizados tras recargar |
| A02 | Aprobada lógica: proveedor nuevo → compra recibida → seis unidades de stock, una entrada Kardex y un egreso S/ 12; Reportes refleja compra; consultas/reinicialización no duplican | Recorrido completo por pantallas Inventario/Kardex/Caja |
| A03 | Aprobada lógica: pendiente no mueve stock/caja; recepción aplica una vez y persiste; segunda recepción rechazada | Confirmación de recepción en interfaz |
| A04 | Aprobada lógica: gasto efectivo S/ 18 → caja S/ 982, un movimiento, Reportes/asistente S/ 18; reinicializar conserva; anular devuelve caja a S/ 1,000 y Reportes a cero | Formulario, borrador, comprobación visual y recarga en navegador |
| A05 | Aprobada lógica: cliente nuevo → venta → edición de cliente; comprobante conserva nombre y documento históricos | Selección del cliente activo y consulta del comprobante en pantalla |
| A06 | Aprobada lógica: alta/login, cajero sin Usuarios, edición a supervisor con Compras/sin Caja, logout/reinicio y desactivación con rechazo de login | Navegación directa y acciones visibles por rol en el navegador |
| A07 | Aprobada lógica/archivo: mes actual vs anterior, operaciones y totales, filtro/orden, CSV UTF-8 reabierto con español, comillas y salto de línea; HTML usa mismos datos | Descargar/abrir CSV en hoja de cálculo y guardar PDF desde el navegador |
| A08 | Aprobada lógica: créditos reales crean saldos 80/4.8; asistente reconoce mayor saldo, producto de cuatro unidades y stock agotado; sugerencia coincide y no escribe compra | Contrastar conversación y enlaces en pantalla |
| A09 | Aprobada lógica: fallo de escritura al recibir compra conserva almacenamiento, stock, caja, Kardex y Reportes; no notifica; reintento publica una vez | Fallo/borrador/reintento de formularios en navegador; regresiones adicionales de fallos ya cubiertas por las suites E1–E9 |
| A10 | Parcial: factura duplicada y recepción repetida rechazadas sin efectos; prueba existente de consultas superpuestas descarta respuestas antiguas en diez ciclos | Doble clic real y bloqueo de envíos en formularios/conversación |
| A11 | Parcial: reimportación del store/servicios conserva estado; logout/reinicio y desactivación no modifican datos de negocio | Cerrar/abrir navegador, recargar y comprobar sesión según recordar/sin recordar |
| A12 | Aprobada lógica: catálogo operativo vacío conserva cero; datos ilegibles rechazan Reportes, asistente y escritura sin sobrescribirse; suites previas cubren filtros y validaciones | Estados vacíos, sin coincidencias y error visibles en cada pantalla |
| A13 | Pendiente: no se operó navegador | Ocho pantallas a 1440/720/390, teclado y zoom real 200%; lector de pantalla en flujos críticos |
| A14 | Pendiente: no se realizaron nuevas mediciones de contraste | Temas claro/oscuro, pares de color y comprensión de estados; las evidencias anteriores mantienen su alcance original |
| A15 | Parcial: diez ciclos gasto → notificación → Reportes/asistente → reinicialización con cifras consistentes y cancelación de suscripción | Diez recorridos entre rutas reales, consola, bloqueos, acumulación de suscripciones y memoria del navegador |

## Fuentes de verdad y límites conservados

| Datos | Fuente local | Contrato |
|---|---|---|
| Catálogo y operaciones | `KIPUS_ERP_STORAGE_V2`, mediante getters/mutaciones de `erpStore` | Persistencia antes de notificar, rollback de escrituras fallidas; getters devuelven copias |
| Empresa y parámetros soportados | Servicio/storage de Configuración | Configuración persistida; ventas conservan copia del emisor; ajustes no soportados no simulan funcionalidad |
| Cuentas | `kipus_erp_users_list`, mediante `usuariosStorage`/`usuariosService` | Normalización, duplicados, último administrador y contenido inválido conservado |
| Sesión | `SessionStore` en local/sessionStorage según recordar | Rol/estado refrescados desde cuentas; autenticación local de prototipo, sin seguridad de servidor |
| Reportes | Operaciones del store, agregadas por `calcularReporte` | Fechas UTC inclusivas, sin factores ni resultados de respaldo; costo actual como estimación |
| Exportación | Mismo reporte/secciones/filtros mostrados | CSV real y HTML imprimible; contenido tributario de demostración |
| Asistente y reposición | Getters del store y cálculo compartido con Reportes | Lectura local y reglas, sin IA externa; no guarda compras al recomendar |

No se amplió el alcance a DB ni servicios externos. Los saldos heredados de clientes no son un estado de cuenta conciliado; el costo de ventas usa precios actuales sin costo histórico; el contenido tributario no es una declaración oficial. Los periodos usan el día UTC guardado por el store y los campos de solo fecha conservan su día registrado. Las pruebas no acreditan aislamiento por usuario/equipo ni sincronización entre navegadores.

## Evidencia y resultado

- Pruebas integradas: diez aprobadas en `erpStore.integracion.spec.ts`.
- Verificación completa aprobada: `pnpm typecheck`, 210/210 pruebas en 27 archivos y `pnpm build` (cliente y servidor). Los diez casos integrados se suman a las 200 pruebas anteriores.
- Evidencia guardada: `typecheck-E10.txt`, `pruebas-E10.txt`, `build-E10.txt`. Se usó `vitest run --reporter=dot` para reducir salida; los avisos diagnósticos existentes de ZXing/Browserslist no causaron fallos. Esbuild se ejecutó con autorización de revisión automática fuera de la restricción de procesos del sandbox.
- Incidencias funcionales nuevas en los recorridos probados: ninguna. No fue necesario modificar código de producción para esta entrega.
- No hay commit de E10. Los cambios de entregas anteriores permanecen locales; no se hizo staging, push ni despliegue.

## Estado de cierre y rutas

E10 queda cerrada en su verificación técnica. El plan completo no se declara finalizado: A13/A14 y las partes de navegador de A01–A12/A15 continúan pendientes por la instrucción de omitir scripts de navegador. La aprobación visual previa de E4/E5/E8 no sustituye estos recorridos ni se extiende automáticamente a E7/E9.

Comparar en el servidor existente:

- `/configuracion`, `/clientes` y `/ventas`: empresa/cliente y comprobante histórico.
- `/proveedores`, `/compras`, `/inventario` y `/caja`: compra recibida/pendiente y efectos únicos.
- `/gastos`, `/caja` y `/reportes`: gastos, anulación, periodo y exportación.
- `/usuarios` y `/login`: cambios de cuenta, rol y sesión.
- `/kipus-ia`: preguntas de contraste documentadas en E9.

Todas las rutas usan `http://localhost:8080`. Para crear datos de prueba manuales, usar un perfil aislado en ese mismo origen; no restablecer el perfil habitual ni borrar sus claves. No se requieren nuevos servicios para comparar.
