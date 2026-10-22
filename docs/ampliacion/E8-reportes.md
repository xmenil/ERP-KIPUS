# E8 — Reportes y exportaciones

21/10/2026. Implementación sobre los cambios locales existentes, sin rehacer E0–E7. Se comprobó HTTP 200 en el servidor de `http://localhost:8080/`; no se inició otra instancia. Continúa el prototipo con `localStorage`, sin DB ni servicios externos. No se tocaron datos del perfil del usuario, scripts de navegador ni imágenes. Sin commit, push ni despliegue. La fase 5 anterior sigue cancelada.

## Reglas implementadas

- Periodos dinámicos: mes actual hasta hoy, mes anterior completo y año actual hasta hoy. Se usa la fecha de calendario UTC guardada por el store, extremos inclusivos; se muestran fechas exactas. Los campos de solo fecha conservan su día registrado. Se eliminan factores multiplicadores y meses/resultados inventados.
- Ventas: solo `COMPLETADA`, con importes guardados e IGV incluido. `PENDIENTE` y `ANULADA` no integran las ventas. El ranking distribuye descuentos del documento entre productos con reparto acumulativo de céntimos, conserva artículos fuera del catálogo y exporta todos los productos, sin un límite artificial de diez.
- Devoluciones: reducen ventas, unidades y montos en la fecha de devolución, aunque la venta original sea de otro periodo. Solo se aceptan referencias a ventas completadas. El costo se revierte únicamente cuando la mercadería retorna al inventario. Pueden existir importes/unidades negativos; no se sustituyen por valores positivos.
- Gastos: importes de registros activos en el periodo, todos los medios de pago. Los anulados quedan fuera por su estado actual, igual que en Gastos; no se reconstruye su estado histórico al cierre de una fecha.
- Compras: solo recibidas, por `fechaRecepcion` o `fecha` si la recepción histórica no se guardó. No se descuentan todas las compras como costo de ventas: eso duplicaría el costo estimado por productos vendidos. Pendientes y anuladas excluidas.
- Cobros: ingresos menos reembolsos efectivamente registrados en movimientos de Caja con origen `VENTA`/`DEVOLUCION`, por su propia fecha. Se conservan movimientos vinculados a ventas anuladas porque representan dinero registrado, separadamente de las ventas. No se infieren cobros desde `montoRecibido`, crédito ni ausencia de movimientos. La cifra no es un saldo de Caja ni un saldo pendiente de crédito.
- Costos: estimación con `precioCompra` actual del catálogo. No existe costo histórico en `ItemVenta`; la pantalla y ambos formatos lo advierten. Si falta un costo, costo y resultado del periodo son «No disponible», sin porcentajes de respaldo. El resultado incluye IGV y no se presenta como utilidad contable ni efectivo disponible. Las pérdidas se conservan.
- Tributario: demostración local, sin declaración ni validación SUNAT. Usa base/IGV guardados de boletas y facturas, con prorrateo de devoluciones; las notas de venta no aportan IGV. Las compras recibidas se simulan al 18%, sin asumir que sus comprobantes o crédito fiscal estén validados. No se inventan proporciones boleta/factura ni crédito fiscal de gastos.

## Interfaz y exportación

`SummaryStrip` con ventas menos devoluciones, cobros netos, gastos activos y resultado estimado. Tres pestañas: Finanzas, Productos y Tributario demo. Un gráfico mensual con dos series reales y tokens `--chart-1`/`--chart-2`, título, periodo, moneda y tabla equivalente. Tablas con paginación de 20 filas, conteo, encabezado fijo, importes alineados, foco y región desplazable con aviso móvil. Selector y filtros etiquetados; acciones táctiles de 44 px. Skeleton adaptado y error/reintento sin mostrar datos anteriores como si pertenecieran al periodo nuevo.

La carga consulta un único reporte y utiliza `useErpQuery`: descarta respuestas antiguas, se actualiza ante cambios del store y bloquea exportación durante carga/error. Búsqueda y orden del ranking se mantienen en el padre y en la exportación. El filtro de productos solo afecta al ranking; esta limitación aparece en pantalla y archivo. Los totales financieros conservan todo el periodo.

Las secciones de pantalla, CSV e impresión se construyen desde el mismo reporte en memoria. Se incluyen alcance/filtros, finanzas, meses, demostración tributaria, ranking filtrado y operaciones de respaldo. CSV UTF-8 con BOM, extensión `.csv`, ocho columnas estables, comillas/comas/saltos escapados y protección de fórmulas en textos. Importes negativos permanecen numéricos. Exporta todas las páginas. No se anuncia XLSX ni descarga PDF inexistente.

«Imprimir / guardar como PDF» abre HTML autocontenido y solicita el diálogo del navegador; el usuario decide imprimir o guardar PDF. Los textos se escapan también en HTML. Un bloqueo de ventanas muestra error en el diálogo. La descarga CSV solo informa que se inició, no que se escribió en disco.

## Archivos

- `client/features/reportes/services/reportesService.ts`: cálculo puro, periodos y lectura del store.
- `client/features/reportes/types/reportes.types.ts`: contrato único de reporte, finanzas, series, ranking y operaciones.
- `client/features/reportes/pages/ReportesPage.tsx`: carga, resumen, filtros, pestañas y respaldo.
- `client/features/reportes/components/{ResumenFinancieroTab,LiquidacionSunatTab,TopProductosTab,TablaReporte,ExportarReporteModal,ReportesSkeleton}.tsx`: interfaz de la entrega.
- `client/features/reportes/utils/reporteExport.ts`: filtros, secciones comunes, CSV, HTML, descarga e impresión.
- `reportesService.spec.ts` y `reporteExport.spec.ts`: regresiones funcionales E8-01 a E8-20.

## Incidencias y evidencia técnica

Rol previsto: administrador con acceso a Reportes. Navegador no operado por instrucción del usuario. Datos de prueba aislados en Vitest: octubre de 2026, límites de medianoche, venta S/ 118, costo S/ 40, gasto S/ 90, devolución S/ 59, compra S/ 118 y datos vacíos/eliminados. Ninguna prueba escribe en el perfil del usuario.

| Incidencia | Prioridad | Reproducción y resultado anterior | Resultado exigido y corrección | Evidencia |
|---|---|---|---|---|
| E8-F01 | P1 | Elegir otro periodo aplicaba factores 0.88/3.4 y mostraba meses fijos | Filtrar fechas reales, excluir pendientes/anuladas, respetar devoluciones y conservar pérdidas | E8-01–E8-11, E8-20; cálculo y tabla mensual |
| E8-F02 | P1 | Sin ventas se inventaba ranking; costo siempre 62% y pérdida podía mostrar utilidad positiva | Cero/sin datos; costo actual identificado o resultado no disponible | E8-03–E8-07 |
| E8-F03 | P1 | Exportar solo esperaba 600 ms y anunciaba XLSX/PDF sin crear archivo | CSV real y vista imprimible, mismos datos/filtros, errores visibles | E8-13–E8-19; CSV releído por parser y APIs de descarga/impresión simuladas |
| E8-F04 | P1 | Consultas de periodos podían publicar respuestas antiguas y mostrar resumen previo tras fallo | Fuente única con consulta vigente, estados de carga/error y exportación bloqueada | `useErpQuery` existente; E8-12 verifica propagación de lectura fallida |

Verificación final: `pnpm typecheck`, suite completa de Vitest y `pnpm build` aprobados. Se añaden 20 pruebas de E8 (13 de cálculo y 7 de exportación), para 180 pruebas en 24 archivos en el conjunto. Build de cliente y servidor completado. Vitest necesitó ejecutar esbuild fuera de la restricción de procesos del sandbox (`spawn EPERM`); la revisión automática autorizó la ejecución. Los avisos existentes de ZXing y Browserslist no causaron fallos.

## Pendientes de comprobación humana

El usuario aprobó la revisión visual de E8 al solicitar E9. Esa aprobación no acredita pruebas específicas de teclado, zoom, lector de pantalla ni el uso del diálogo de impresión. Falta descargar y abrir el CSV desde el navegador y guardar un PDF para confirmar el comportamiento del navegador del usuario. Las pruebas sí releen el contenido CSV y comprueban el Blob/enlace y la petición de impresión con APIs simuladas. No se ejecutaron scripts de navegador ni se guardaron imágenes, por instrucción expresa.

Ruta para comparar: `http://localhost:8080/reportes`. Rutas de respaldo: `/ventas`, `/gastos`, `/compras`, `/caja`. Elegir el mismo periodo, contrastar operaciones y exportar. La comparación visual de E4/E5 fue aprobada por el usuario al solicitar E8; queda registrada en el seguimiento.
