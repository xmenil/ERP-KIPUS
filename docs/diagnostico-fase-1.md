# Fase 1: diagnóstico y línea base

Fecha: 21/10/2026. Plan: [plan de trabajo](./plan-trabajo-recomendaciones.md). Fuente: [recomendaciones](./recomendaciones.md).

Estado: diagnóstico técnico ejecutado; validación en navegador y reproducción del bloqueo pendientes. No se han aplicado correcciones de las fases 2 y 3.

## Entorno y alcance de la evidencia

- Windows, Node v22.17.0, pnpm 10.14.0. Comandos desde la raíz del repositorio.
- Pruebas Vitest en Node con almacenamiento en memoria y `window` simulado; cada recarga reinicializa el módulo conservando el almacenamiento simulado.
- No se leyeron ni modificaron datos de un perfil de navegador. Los casos de corrupción y cuota son inyectados, no incidentes observados en el equipo del usuario.
- No hubo sesión de navegador instrumentada en esta ejecución. No hay mediciones reales de carga, búsqueda, renderizado o guardado ni confirmación de la causa del bloqueo original.
- El navegador, dispositivo, rol, volumen de catálogo y pasos del reporte original aún no están informados. Se solicitó esta información para completar la reproducción.

## Recorrido y contrato actual observado

`ProductoFormDialog` → `ProductosPage.handleGuardarProducto` → `productosService` → `erpStore` → `notify` → escritura de todo el ERP en `localStorage` → suscriptores → recarga del catálogo.

Referencias principales:

- `client/features/productos/components/ProductoFormDialog.tsx`: validación, bloqueo de doble envío mediante referencia, estado «Guardando…» y conservación del borrador cuando `onGuardar` rechaza.
- `client/features/productos/pages/ProductosPage.tsx`: alta/edición, confirmación de éxito, búsqueda, filtros, orden y paginación de 12 filas; suscripción con limpieza al desmontar.
- `client/features/productos/services/productosService.ts`: mutación síncrona del store seguida de demora simulada.
- `client/services/erp/erpStore.ts`: clave `KIPUS_ERP_STORAGE_V2`, lectura desde línea 1256, escritura desde 1287, notificación desde 1332 y operaciones de productos desde 1790. Las líneas pueden cambiar al implementar correcciones.
- `client/services/mock/mockUtils.ts`: demora por defecto de 250 ms; al finalizar clona los datos. Es una configuración, no una medición de respuesta real.
- `client/features/auth/services/authService.ts` y `sessionStore.ts`: cerrar sesión elimina claves de autenticación, no la clave del ERP.

El catálogo actual es local al origen/perfil del navegador y no está separado por usuario en la clave de almacenamiento. Cambiar de usuario dentro del mismo origen usa el mismo store. No se observó una API de persistencia en el recorrido de productos. La separación por negocio y la necesidad de sincronización entre equipos deben definirse antes de modificar ese contrato.

## Registro de hallazgos

| ID | Prioridad | Estado y evidencia | Consecuencia | Trabajo siguiente |
|---|---|---|---|---|
| INC-001 | P0 | Reproducido en prueba aislada: `setItem` lanza `QuotaExceededError`; `crearProducto` devuelve el producto y solo se escribe una advertencia | Queda en memoria, pero desaparece al reinicializar; la UI puede confirmar éxito porque el servicio no recibe rechazo | Fase 2: hacer observable el fallo, evitar cambios parciales y mantener borrador |
| INC-002 | P0 | Bloqueo original no reproducido; faltan pasos y navegador | No se puede atribuir aún una causa ni declarar una mejora | Completar perfil y recorrido de navegador antes de corregir |
| INC-003 | P1 | Reproducido: eliminar todos los productos persiste `[]`; al reinicializar reaparecen los productos iniciales | Un catálogo vacío válido no se conserva | Fase 2: distinguir vacío válido de datos ausentes o inválidos |
| INC-004 | P0 | Reproducido: JSON inválido provoca advertencia y escritura de datos iniciales sobre la misma clave | Se sobrescribe el contenido que podría servir para recuperación | Fase 2: validar y establecer recuperación sin sobrescritura silenciosa |
| INC-005 | P1 | Inspección: la mutación notifica y recarga; después el handler vuelve a recargar; cada consulta usa demora simulada | Trabajo redundante y posibles respuestas fuera de orden; relación con el bloqueo no probada | Fase 3: contar solicitudes y medir; revisar orden y carga |
| INC-006 | P1 | Inspección: alta/edición conservan búsqueda, categoría y estado actuales | Un producto guardado puede quedar fuera del resultado y parecer ausente | Fase 2: permitir localizarlo y distinguir filtro de fallo de persistencia |
| INC-007 | P1 | Inspección: botones de impresión del historial/dashboard ejecutan únicamente `toast.info` | El aviso anuncia impresión sin ejecutar una impresión en esos botones | Registrar alcance funcional y corregir o identificar la simulación en fase posterior |

INC-001 e INC-004 son riesgos comprobados bajo condiciones inyectadas. No demuestran que esas condiciones hayan causado el reporte del profesor. INC-004 no determina si todo JSON inválido es recuperable.

## Casos ejecutados y reproducción

Archivo: `client/services/erp/erpStore.diagnostico.spec.ts`.

Son pruebas de caracterización del comportamiento actual, incluidos defectos. Que pasen no significa que el guardado sea aceptable: al corregir, se deben reemplazar las expectativas del defecto por las del contrato deseado.

| Caso | Pasos aislados | Resultado observado |
|---|---|---|
| D01 | Alta válida → editar nombre/precio → reinicializar | Ambos cambios conservados cuando el almacenamiento funciona |
| D02 / INC-001 | Inicializar → hacer fallar `setItem` → alta → reinicializar | Alta disponible en memoria y ausente tras recarga |
| D03 / INC-003 | Eliminar cada producto → verificar `productos: []` persistido → reinicializar | Reaparecen datos iniciales |
| D04 / INC-004 | Precargar JSON inválido → inicializar | Advertencia y reemplazo por datos iniciales |
| D05 | Alta → segundo alta con SKU equivalente y espacios | Rechazo sin modificación del estado persistido |
| D06 | Suscribir → mutar → desuscribir → mutar | Una notificación; la baja evita la siguiente |

Repetir solo esta evidencia: `pnpm test client/services/erp/erpStore.diagnostico.spec.ts`.

La edición comparte `notify` y la misma escritura que el alta, por lo que también queda expuesta al error silenciado por inspección. Aún falta una prueba específica de fallo durante edición. La limpieza del suscriptor se comprobó a nivel de store; no prueba ausencia de fugas en toda la aplicación.

## Inventario inicial de acciones

Inventario de los recorridos críticos, no auditoría exhaustiva de todos los botones del ERP. La conexión a handlers se verificó por lectura; la operación visual completa sigue pendiente.

| Módulo | Acciones identificadas | Referencia | Verificación pendiente |
|---|---|---|---|
| Productos | Nuevo, editar, detalle, eliminar, buscar, filtrar, ordenar, paginar, escanear, buscar por voz | `ProductosPage.tsx`, `ProductoFormDialog.tsx` | Campos vacíos en UI, doble clic, permisos, filtros tras guardado, cámara/voz y recarga real |
| Ventas | Agregar por código, buscar, cambiar cantidad, quitar ítem, vaciar carrito, cobrar, consultar detalle | `PosTerminalView.tsx`, `CobroModal.tsx`, `VentaDetalleModal.tsx` | Venta completa y coherencia de stock/caja/comprobante |
| Ventas | Imprimir desde historial y dashboard | `VentasHistorialView.tsx`, `VentasDashboardView.tsx` | Handler observado solo muestra aviso; impresión no implementada en esas acciones |
| Inventario | Abrir ajuste, registrar movimiento, recepción y conteo | `InventarioPage.tsx`, `NuevoMovimientoDialog.tsx`, `RecepcionMercanciaDialog.tsx`, `AuditoriaConteoDialog.tsx` | Guardado, saldo final, consulta en kardex y persistencia |
| Caja | Abrir, registrar operación, arqueo, proceder al cierre, consultar movimientos/cierres | `CajaPage.tsx`, `AbrirCajaDialog.tsx`, `OperacionCajaDialog.tsx`, `ArqueoConteoDialog.tsx`, `CierreCajaDialog.tsx` | Estados abierta/cerrada, montos y restricciones |
| Sesión | Cerrar e iniciar sesión | `authService.ts`, `sessionStore.ts` | Conservación real del catálogo y expectativas de separación entre usuarios |

## Protocolo para completar la línea base en navegador

Usar un perfil exclusivo de prueba, sin datos operativos. Registrar sistema, navegador/versión, CPU/RAM, rol, resolución, número de productos y tamaño en bytes del estado persistido. Mantener equipo y datos iguales en la comparación posterior.

1. Crear un producto identificable: SKU `DIAG-001`, nombre «Arroz de diagnóstico», compra S/ 2.00, venta S/ 3.00, stock 5 y mínimo 1. Si el SKU ya existe, usar otro y registrarlo.
2. Buscarlo, abrir detalle, editar precio a S/ 4.00 y nombre a «Arroz editado». Comparar tabla y detalle.
3. Recargar, cerrar/abrir el navegador y cerrar/iniciar sesión por separado. Registrar en qué paso aparece una diferencia.
4. Repetir con filtro de otra categoría, búsqueda que excluya el nombre y en una página distinta de la primera. Limpiar filtros antes de concluir que se perdió el registro.
5. Probar obligatorios vacíos, SKU/código duplicado y doble clic al guardar. Registrar mensajes y valores conservados.
6. Con DevTools Performance y consola, grabar abrir catálogo → buscar → editar → guardar → navegar a inventario → volver. Contar recargas y observar tareas largas y errores. No confundir la demora simulada de 250 ms con tiempo de CPU.
7. Repetir diez recorridos idénticos y conservar trazas. Medir desde la acción hasta el resultado visible: carga, búsqueda y guardado. Informar mediana y máximo; anotar si el panel de desarrollo estaba abierto.
8. Registrar una venta implementada y contrastar resultado, stock, caja y comprobante. Repetir con el rol relevante y sesión vigente.

| Métrica | Datos/equipo | Antes | Después |
|---|---|---|---|
| Catálogo visible, mediana/máximo de 10 ejecuciones | Pendiente | No medido | Fase 3 |
| Búsqueda visible, mediana/máximo | Pendiente | No medido | Fase 3 |
| Guardado confirmado, mediana/máximo | Pendiente | No medido | Fase 3 |
| Bloqueos/errores en diez recorridos | Pendiente | No reproducido | Fase 3 |
| Bytes y volumen del catálogo | Pendiente | No medido | Mismo conjunto |

Definir presupuesto de respuesta después de medir el equipo objetivo; no fijar un umbral arbitrario a partir del tiempo de Vitest. Cuota, bloqueo de almacenamiento y corrupción ya tienen reproducción simulada; cualquier repetición manual debe ser en el perfil exclusivo de prueba.

## Cierre y siguiente entrega

### Línea base técnica ejecutada

| Comprobación | Resultado |
|---|---|
| `pnpm test` | 9 archivos y 52 pruebas aprobadas; incluye 6 casos nuevos de diagnóstico |
| `pnpm typecheck` | Aprobado, sin errores de TypeScript |
| `pnpm build` | Cliente y servidor compilados correctamente |

La suite de cámara emite mensajes de ZXing sobre intentos de lectura sin coincidencia, pero sus pruebas pasan. La compilación advierte datos antiguos de Browserslist y chunks superiores a 500 kB. El bundle principal generado mide 1,504.95 kB (388.37 kB gzip); es una línea base de tamaño, no evidencia de la causa del bloqueo. La importación directa de las páginas en `client/app/router.tsx` es un punto para evaluar carga diferida durante la fase 3, después de medir el arranque real.

La fase 2 puede comenzar con INC-001, INC-003 e INC-004 y sus reproducciones. Antes de cambiar la inicialización, definir tratamiento de catálogo vacío, datos inválidos, respaldo, claves antiguas y errores de escritura. No introducir una API o base de datos sin una necesidad demostrada.

Para cerrar totalmente la fase 1 faltan las trazas y tiempos del navegador, la reproducción del bloqueo reportado, la prueba visual de obligatorios y el recorrido completo entre módulos. Estos puntos quedan pendientes explícitos; no se declara resuelto el reporte original.
