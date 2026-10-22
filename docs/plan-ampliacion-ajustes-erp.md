# Plan detallado de ampliación de ajustes al resto de KIPU'S ERP

Fecha: 21/10/2026.

Estado: E0–E9 completadas en código y verificación técnica; E10 completada en su verificación técnica con 210 pruebas, tipos y build aprobados. El usuario aprobó visualmente E4/E5 y E8. El plan mantiene pendientes los recorridos manuales indicados en A01–A15, especialmente A13/A14, accesibilidad y descarga/impresión en navegador. Ver docs/ampliacion/seguimiento.md y docs/ampliacion/E10-integracion.md. No se declara cierre total ni se reactiva la fase 5 anterior.

## 1. Objetivo y decisiones del usuario

Extender las mejoras funcionales, de estabilidad y de interfaz a los módulos pendientes del ERP. Cada entrega debe permitir completar una tarea de negocio, guardar su resultado y comprender qué pasó, con una presentación coherente con las pantallas ya ajustadas.

Condiciones que se deben conservar al continuar en otro chat:

- El sistema es un **prototipo funcional con persistencia en `localStorage`**. No migrar a una base de datos ni agregar backend o servicios externos como requisito de este plan.
- Las fases 1 a 4 anteriores fueron desarrolladas y subidas al repositorio. Su punto de referencia es el commit `54440434a05f5cc8eb1bda3571ee2bdfc07b86ec`, rama `main`, remoto `https://github.com/xmenil/ERP-KIPUS.git`.
- El usuario **canceló la fase 5 anterior**. No reactivar esa campaña de evaluación con tres participantes ni sus puntuaciones automáticamente. Las comprobaciones técnicas necesarias para cada cambio de este nuevo plan sí forman parte de su ejecución.
- El encargo original fue preparar este plan. En la continuación se autorizó ejecutar E0 y después E1; su evidencia está en docs/ampliacion/.
- El usuario ya utiliza `http://localhost:8080/`. Comprobar su disponibilidad antes de iniciar un servidor; no lanzar otro innecesariamente ni cambiar a `127.0.0.1`, porque cada origen tiene almacenamiento independiente.
- No borrar, reemplazar o restablecer los datos del usuario para hacer pruebas. Emplear un perfil de navegador separado y datos identificables de prueba.
- El guardado local es compartido por usuarios del mismo origen/perfil en el prototipo actual. No prometer sincronización entre equipos, aislamiento por negocio o controles de servidor que no existen.
- Este documento nuevo no implica un nuevo commit, push o despliegue. Consultar el estado de Git al retomar y ejecutar esas operaciones cuando estén solicitadas.

## 2. Punto de partida

### Trabajo anterior que debe conservarse

| Área         | Ya implementado                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Productos     | Guardado del catálogo antes de publicar cambios en memoria, rechazo de fallos de persistencia, conservación de catálogo vacío y protección frente a datos inválidos |
| Estabilidad   | Corrección de promesas simuladas pendientes; protección contra respuestas antiguas y cargas duplicadas en Productos, Ventas, Inventario y Caja                          |
| Carga inicial | Páginas con carga diferida y límite de errores por ruta                                                                                                                 |
| Interfaz      | Reorganización de Inicio, Productos, Inventario, Ventas y Caja; formulario/detalle de Productos, menús de acciones y confirmación de eliminación                      |
| Componentes   | `SummaryStrip`, `PageHeader`, componentes Radix/shadcn, mejoras de botones, cierre de diálogos y navegación                                                         |
| Evidencia     | 58 pruebas aprobadas en la última suite completa, TypeScript y build aprobados; capturas y revisión de cinco rutas a 1440, 720 y 390 px                                 |

Los resultados anteriores son una referencia histórica, no una garantía de que el repositorio no haya cambiado en otro chat. Revalidar la línea base al comenzar.

Leer estos documentos antes de desarrollar:

1. [Recomendaciones originales](./recomendaciones.md).
2. [Plan anterior](./plan-trabajo-recomendaciones.md).
3. [Diagnóstico inicial](./diagnostico-fase-1.md).
4. [Persistencia de Productos](./avance-fase-2-productos.md).
5. [Estabilidad](./avance-fase-3-estabilidad.md).
6. [Interfaz y capturas](./avance-fase-4-interfaz.md).
7. Reglas del repositorio en `AGENTS.md` y `.agents/skills/kipus-ui/SKILL.md`.

Las rutas reales del frontend están en `client/`. Los tokens están en `client/global.css` y `tailwind.config.ts`, aunque la skill mencione otra ubicación genérica. No crear carpetas `src/` para reproducir esa referencia.

### Hallazgos que justifican la ampliación

| ID  | Evidencia disponible                                                                                                                                                                                      | Estado                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| H01 | En el intento cancelado de fase 5, pruebas aisladas comprobaron que venta, ajuste de inventario e ingreso de caja no rechazaban errores de escritura. El archivo de esas pruebas fue retirado al cancelar | Reproducir de nuevo antes de corregir; no está resuelto                         |
| H02 | Esas pruebas también comprobaron que el store de Ventas aceptaba stock insuficiente y cantidades 0, negativas o `NaN`                                                                                  | Reproducir y acordar su relación con la opción de venta sin stock              |
| H03 | `configuracionService.ts` mantiene `mockConfiguracion` en memoria; guardar cambia esa variable sin escribir `localStorage`                                                                          | Comprobado por lectura; falta recorrido visual de recarga                        |
| H04 | `usuariosService.ts` usa `kipus_erp_users_list`, silencia errores de escritura y retorna usuarios iniciales ante fallos de lectura                                                                    | Comprobado por lectura; falta prueba aislada de los escenarios                   |
| H05 | `ExportarReporteModal.tsx` espera con un temporizador y anuncia Excel/PDF generado, sin generar ni descargar archivo                                                                                    | Comprobado por lectura                                                           |
| H06 | `reportesService.ts` utiliza factores según periodo, costo estimado del 62% y series mensuales fijas                                                                                                   | Comprobado por lectura; no son filtros temporales reales                         |
| H07 | `ProtectedRoute` comprueba autenticación. `authService` conserva acceso genérico de demostración y combina usuarios locales con demo                                                               | Revisar coherencia de roles y estados; no inferir autorización real de servidor |
| H08 | KIPU'S IA responde mediante reglas locales; hay selecciones que toman el primer producto o cliente para afirmar recurrencia o mayor deuda                                                                 | Comprobado por lectura; contrastar contra datos de prueba                        |
| H09 | Formularios, tablas y estados de los módulos pendientes aún no recibieron una revisión visual completa                                                                                                 | Pendiente de capturas e inventario por pantalla                                  |

El bloqueo de página reportado originalmente no tiene una causa confirmada. Mantenerlo abierto si reaparece; no declararlo resuelto por cambiar tarjetas o colores.

## 3. Alcance y orden de ejecución

Se trabajará por etapas nuevas **E0–E10**, para evitar confundirlas con la fase 5 cancelada.

| Etapa | Prioridad | Entrega                                            | Dependencias      | Esfuerzo orientativo |
| ----- | --------- | -------------------------------------------------- | ----------------- | -------------------- |
| E0    | P0        | Inventario, capturas y contrato funcional local    | Ninguna           | 1 día               |
| E1    | P0        | Guardado consistente y validaciones entre módulos | E0                | 2–4 días           |
| E2    | P1        | Configuración persistente y coherente             | E1                | 1–2 días           |
| E3    | P1        | Proveedores: funcionamiento e interfaz             | E1                | 1–2 días           |
| E4    | P1        | Compras: registro y efectos en stock/caja          | E2, E3            | 2–3 días           |
| E5    | P1        | Gastos: registro y efectos en caja                 | E1, E2            | 1–2 días           |
| E6    | P1        | Clientes: directorio y uso en ventas               | E1                | 1–2 días           |
| E7    | P1        | Usuarios y coherencia de permisos demo             | E1; considerar E2 | 2–3 días           |
| E8    | P1        | Reportes y exportación verificables               | E2, E4, E5, E6    | 2–4 días           |
| E9    | P2        | KIPU'S IA y recomendaciones locales                | E4, E6, E8        | 1–2 días           |
| E10   | P1        | Recorridos integrados y cierre documental          | Etapas anteriores | 2–3 días           |

Total estimado: **16–28 días laborables**, para una persona de desarrollo, sujeto al diagnóstico y al alcance de exportación. No es una fecha comprometida. La estimación excluye una DB, integración SUNAT, modelos externos de IA y evaluación con participantes reales.

P0: conservación de datos y consistencia de operaciones. P1: tareas habituales y claridad de uso. P2: asistencia y mejoras secundarias. Cada etapa incluye su diseño de interfaz; no postergar todo el diseño hasta el final.

## 4. Patrón de interfaz obligatorio para todos los módulos

### Composición de pantalla

1. Cabecera con título corto del negocio, una frase de orientación y una acción principal.
2. Resumen compacto solo si ayuda a decidir. Reutilizar `SummaryStrip`; no añadir cuatro tarjetas decorativas a todas las pantallas por costumbre.
3. Búsqueda y filtros con etiquetas visibles, agrupados por utilidad.
4. Tabla o lista principal con los datos necesarios para la tarea habitual.
5. Detalles, análisis secundarios y ajustes avanzados en un panel, pestaña o sección desplegable con nombre claro.

### Reglas de diseño

- Acento violeta existente, superficies neutras y colores semánticos acompañados por texto. No introducir degradados, sombras de color, tarjetas anidadas ni iconos decorativos junto a cada dato.
- Inter con pesos 400/500/600; títulos de página de 24 px, secciones de 18 px, contenido/tablas de 14 px y metadatos de 12 px.
- Entradas de 16 px en móvil y 14 px desde escritorio. Montos y cantidades con `tabular-nums`, alineados a la derecha; reservar monoespaciada para códigos/documentos.
- Espaciado de 4/8/12/16/24/32 px, radios y bordes de los tokens existentes.
- Una sola acción primaria por vista. Las secundarias usarán `outline` o `ghost`; las destructivas requerirán confirmación con el nombre del registro y estado de ejecución.
- Máximo dos acciones visibles por fila; el resto en menú Radix. Evitar depender solo de pulsar una fila para abrir detalles.
- Etiquetas asociadas a campos, error accionable junto al campo y foco en el primero inválido. Conservar borradores ante errores; impedir doble envío.
- Diseñar carga, vacío, ausencia de resultados, error con reintento y confirmación de éxito. No presentar un fallo de carga como un catálogo vacío.
- Vista móvil sin desbordamiento horizontal de página; si una tabla necesita desplazamiento interno, indicarlo y priorizar columnas. Controles principales de 44 px en móvil y foco visible.
- Contraste AA: 4,5:1 para texto normal y 3:1 para elementos que correspondan. Revisar claro y oscuro; los valores medidos anteriormente no cubren nuevos componentes automáticamente.
- No anunciar «guardado», «exportado», «impreso» o «enviado» si la acción solo muestra un aviso. Identificar las simulaciones cuando afecten una decisión del usuario.

### Referencias de implementación

- `client/components/common/PageHeader.tsx`.
- `client/components/common/SummaryStrip.tsx`.
- `client/components/ui/`: Button, Input, Select, Table, Dialog, AlertDialog, DropdownMenu y Tabs.
- `client/features/productos/pages/ProductosPage.tsx` como referencia de acción por fila y confirmación, sin copiar su composición mecánicamente.
- `client/lib/latestRequest.ts` para descartar respuestas antiguas.
- `client/utils/formatters.ts` para dinero, cantidades y documentos.
- `scripts/revision-fase4.mjs` como referencia de revisión de navegador con perfil aislado; adaptar sin sobrescribir las evidencias históricas.

## 5. E0 — Inventario y línea base de la ampliación

Responsable: desarrollo/frontend. E0 completada; ver docs/ampliacion/00-linea-base.md.

- [X] E0.1 Confirmar rama, commit, cambios locales y servidor existente. No deshacer trabajo ajeno ni añadir el archivo vacío `docs/Nuevo documento de texto.txt` a entregas.
- [X] E0.2 Capturar las ocho pantallas pendientes: Configuración, Proveedores, Compras, Gastos, Clientes, Usuarios, Reportes y KIPU'S IA, en escritorio y móvil.
- [X] E0.3 Inventariar cada botón, formulario y exportación: acción real, acción simulada, acción sin conexión y error conocido.
- [X] E0.4 Identificar la fuente de verdad de cada módulo: store, almacenamiento separado o memoria temporal.
- [X] E0.5 Acordar por escrito los contratos de compra recibida/pendiente, pago en efectivo/digital/crédito, venta sin stock, series y permisos demo. Usar el comportamiento implementado como evidencia, no como requisito incuestionable.
- [X] E0.6 Ejecutar `pnpm typecheck`, `pnpm test` y `pnpm build`; registrar fallos existentes por separado.

Entregable: `docs/ampliacion/00-linea-base.md`, matriz de acciones y capturas iniciales. Cierre: cada módulo tiene tarea principal, almacenamiento, acciones y límites identificados.

## 6. E1 — Consistencia funcional y persistencia compartida

Archivos principales: `client/services/erp/erpStore.ts`, servicios de cada dominio, `client/features/ventas/components/CobroModal.tsx` y `PosTerminalView.tsx`.

- [X] E1.1 Reproducir H01/H02 con pruebas aisladas antes de modificar el store; mantener los datos del usuario intactos.
- [X] E1.2 Definir cómo confirmar o revertir una operación que afecta simultáneamente venta/compra, productos, kardex y caja. Un fallo no debe dejar solo una parte aplicada ni notificar éxito.
- [X] E1.3 Revisar operaciones anidadas, como conversión de pedido/cotización y recepción: no basta con revertir el último paso si ya se guardó otro efecto.
- [X] E1.4 Hacer que la escritura fallida se propague a los formularios y conservar su contenido. No publicar éxito ni duplicar la operación al reintentar.
- [X] E1.5 Validar cantidades finitas y positivas, importes válidos, producto existente/activo y stock acumulado cuando el mismo producto aparece en varios ítems.
- [X] E1.6 Respetar el contrato de `permitirVentaSinStock`; mientras no esté conectado, no asumir que el checkbox cambia el store. Resolverlo junto con E2.
- [X] E1.7 Comprobar caja cerrada, pago mixto, digital y crédito según el alcance real del prototipo; impedir que un medio de pago termine contado dos veces.
- [X] E1.8 Revisar identificadores repetidos en operaciones rápidas y correlativos de comprobantes. Una operación repetida intencionalmente y un doble envío no son el mismo caso.
- [X] E1.9 Conservar datos ilegibles para recuperación, catálogo vacío válido y compatibilidad de claves. No limpiar claves antiguas ni restablecer todos los módulos al montar una pantalla.
- [X] E1.10 Aplicar tratamiento de consultas antiguas/desmontaje a los módulos nuevos que lo necesiten, sin añadir consultas redundantes.

Aceptación: venta/compra/gasto/ajuste e ingreso de caja comprobados con almacenamiento normal y fallido; memoria, estado persistido y pantallas coinciden después de recargar. Los casos inválidos no alteran registros. Esta etapa no cambia la persistencia a una DB.

## 7. E2 — Configuración

Archivos: `client/features/configuracion/pages/ConfiguracionPage.tsx`, `services/configuracionService.ts`, `types/configuracion.types.ts`, componentes de navegación y consumidores de parámetros.

### Funcionamiento

- [X] E2.1 Persistir configuración en una clave documentada de `localStorage` o integrarla de forma compatible con el store. Distinguir ausencia inicial, contenido inválido y error de escritura.
- [X] E2.2 Validar datos de empresa, correo, RUC y campos numéricos con mensajes claros; definir los campos opcionales.
- [X] E2.3 Conectar los datos guardados a las etiquetas de empresa/sede pertinentes; retirar textos fijos que contradigan la configuración.
- [X] E2.4 Revisar tasa, moneda, series y siguiente número: conectar lo implementable localmente y mostrar como no editable lo que todavía no tenga efecto. No ofrecer una opción activa que no cambie el comportamiento.
- [X] E2.5 Mantener PEN como alcance inicial si USD no está implementado de extremo a extremo. No convertir importes cambiando solo el símbolo.
- [X] E2.6 Separar «Guardar configuración» de «Restablecer datos de demostración». El restablecimiento debe explicar qué datos afecta y requerir confirmación; nunca ejecutarlo en pruebas sobre el perfil del usuario.

### Interfaz

[X]  E2.7 Título «Configuración»; secciones de Empresa, Comprobantes y Preferencias, con campos relacionados y ancho de lectura razonable.

[X]  E2.8 Guardar como acción principal, estado «Guardando…», errores junto al campo y aviso de cambios sin guardar cuando sea necesario.

[X]  E2.9 Ubicar restablecimiento en una sección separada, visualmente secundaria hasta que se abra la confirmación.

Aceptación: guardar, recargar y cerrar/iniciar sesión conserva la configuración; los parámetros ofrecidos producen el efecto anunciado y un fallo no pierde el borrador ni cambia la configuración vigente.

## 8. E3 — Proveedores

Archivos: `client/features/proveedores/pages/ProveedoresPage.tsx`, `services/proveedoresService.ts`, `components/ProveedorFormDialog.tsx`, `ProveedorDetalleModal.tsx` y `NuevoProveedorDialog.tsx`.

- [X] E3.1 Revisar alta, edición, estado y baja, normalización de RUC y reglas de duplicados, incluidos inactivos.
- [X] E3.2 Definir el tratamiento de proveedores referenciados por compras: conservar el historial y considerar desactivar en lugar de borrar cuando corresponda.
- [X] E3.3 Revisar formularios duplicados: reutilizar el formulario principal donde corresponda, después de comprobar sus consumidores.
- [X] E3.4 Verificar la exportación CSV existente: descarga real, columnas, codificación, delimitación y coherencia con filtros. Escapar correctamente las celdas.
- [X] E3.5 Interfaz: «Proveedores», acción «Nuevo proveedor», búsqueda por nombre/RUC, filtros de estado y condición de pago, tabla con razón social, RUC, contacto, condición y acciones.
- [X] E3.6 Mostrar deuda, límite o datos comerciales ampliados en detalle, sin saturar cada fila. Usar diálogo de confirmación y mensajes específicos.

Aceptación: proveedor registrado/editado persiste, puede seleccionarse en Compras y mantiene sus referencias históricas; CSV descargado contiene los registros esperados; móvil y teclado permiten completar las tareas.

## 9. E4 — Compras

Archivos: `client/features/compras/pages/ComprasPage.tsx`, `services/comprasService.ts`, `sugerenciaComprasService.ts`, `components/NuevaCompraDialog.tsx`, `RecomendacionComprasModal.tsx`; store e Inventario/Caja como consumidores. E4 completada; ver `docs/ampliacion/E4-compras.md`.

- [X] E4.1 Recorrer proveedor → productos → cantidades/costos → comprobante → medio de pago → guardar → consulta.
- [X] E4.2 Comprobar que total, cantidad de ítems y subtotales provienen del mismo detalle. No permitir combinaciones contradictorias de `total`, `itemsCount` e `items`.
- [X] E4.3 Definir cuándo entra stock: registro de compra recibida frente a compra pendiente. Evitar sumarlo otra vez al consultar o marcar recepción.
- [X] E4.4 Verificar kardex de entrada con referencia al comprobante, stock resultante y efectos en caja según el medio de pago. La recepción en efectivo valida saldo suficiente antes de modificar stock, Kardex o caja.
- [X] E4.5 Revisar duplicados por proveedor/comprobante y doble envío; aplicar reglas después de normalizar, sin bloquear compras legítimas por un criterio arbitrario.
- [X] E4.6 Conservar detalle/borrador ante fallos y actualizar tablas sin recargas completas o respuestas antiguas.
- [X] E4.7 Interfaz: acción «Registrar compra», filtros por proveedor/estado/fecha, columnas de fecha, proveedor, comprobante, total y estado; ítems en detalle.
- [X] E4.8 Formulario por secciones: Proveedor, Productos y Pago. Total siempre visible y una confirmación clara de lo registrado.
- [X] E4.9 Recomendaciones de reposición como ayuda secundaria. Mostrar origen de la sugerencia y permitir revisar cantidades antes de crear una compra; no darla por registrada automáticamente.

Aceptación: una compra de prueba aplica exactamente una entrada de stock y el efecto de caja acordado; todo coincide tras recarga. La compra pendiente no altera stock antes de la recepción definida. Error o doble clic no generan duplicados.

## 10. E5 — Gastos

Archivos: `client/features/gastos/pages/GastosPage.tsx`, `services/gastosService.ts`, `components/NuevoGastoDialog.tsx` y métodos de gasto/caja del store. E5 completada; ver `docs/ampliacion/E5-gastos.md`.

- [X] E5.1 Validar categoría, descripción, monto positivo/finito, beneficiario, comprobante opcional y medio de pago.
- [X] E5.2 Comprobar que el gasto se vincula con su movimiento de caja cuando corresponde y que no se vuelve a descontar al consultar.
- [X] E5.3 Revisar el comportamiento con caja cerrada y pagos digitales. Documentar el alcance de registro de gastos fuera de turno.
- [X] E5.4 Conservar campos y saldo anterior ante error de persistencia; reintentar una sola operación.
- [X] E5.5 Interfaz: acción «Registrar gasto», resumen compacto del periodo actualizado con el rango seleccionado, búsqueda y filtros de categoría/fecha/pago; tabla de fecha, concepto, categoría, monto y pago. El cálculo del módulo Reportes (factores de periodo y anulaciones) permanece dentro de E8.
- [X] E5.6 Rojo solo para egreso o error con significado; no pintar todas las tarjetas. Datos ampliados accesibles sin crear edición o anulación ficticias.

Aceptación de E5: gasto persistido, movimiento/saldo correctos, filtro de fecha y resumen de periodo coherente. Un registro fallido no genera salida de caja ni desaparece el formulario. El reflejo de anulaciones en Reportes se verifica en E8.

## 11. E6 — Clientes

Archivos: `client/features/clientes/pages/ClientesPage.tsx`, `services/clientesService.ts`, `components/NuevoClienteDialog.tsx`; selección de cliente en Ventas.

- [X] E6.1 Revisar alta, búsquedas, formato de DNI/RUC y normalización de documentos; definir duplicados y consumidor final.
- [X] E6.2 Implementar edición y ficha con historial de comprobantes; conservar el estado del directorio y persistir cambios.
- [X] E6.3 Seleccionar clientes activos en Ventas; comprobantes guardan una copia histórica y bloquean el cambio de documento cuando hay ventas asociadas.
- [X] E6.4 Retirar de la lista cifras demo no conciliadas y explicar su límite en la ficha.
- [X] E6.5 Interfaz: «Clientes», acción «Registrar cliente», búsqueda por nombre/documento/contacto, filtros y lista con documento, nombre y contacto; ventas en detalle.
- [X] E6.6 Opcionales claramente señalados, errores junto al campo, foco, borrador ante error y acciones accesibles en móvil.

Aceptación: alta y cualquier edición implementada persisten; el cliente se encuentra en Ventas; documentos duplicados o inválidos no dejan registros parciales.

## 12. E7 — Usuarios y permisos del prototipo

Archivos: `client/features/usuarios/pages/UsuariosPage.tsx`, `services/usuariosService.ts`, `components/UsuarioFormDialog.tsx`, `UsuarioDetalleModal.tsx`; `client/features/auth/services/authService.ts`, `sessionStore.ts`, `components/ProtectedRoute.tsx`, router y menú.

- [X] E7.1 Reproducir error de lectura/escritura de `kipus_erp_users_list`; validar contenido y conservarlo ante corrupción sin anunciar cambios guardados.
- [X] E7.2 Validar nombre de usuario/correo normalizados, duplicados y campos requeridos. Evitar datos editables inconsistentes entre Usuarios y autenticación.
- [X] E7.3 Comprobar alta → ingreso con esa cuenta → rol correcto; edición de rol/estado → efecto coherente en la sesión definida.
- [X] E7.4 Revisar usuarios demo combinados con usuarios almacenados: una cuenta desactivada no debe reaparecer activa por una copia demo alternativa.
- [X] E7.5 Establecer acceso por rol tanto en ruta como en acciones visibles. `ProtectedRoute` y el menú consultan la matriz de permisos local.
- [X] E7.6 Retirar el acceso genérico, mantener cuentas demo explícitas y proteger al último administrador. La recuperación local y sus límites están documentados.
- [X] E7.7 Interfaz: «Usuarios», acción «Nuevo usuario», búsqueda, filtros de rol/estado y lista; detalle sin credenciales ni último acceso inventado.
- [X] E7.8 Copiar y exportar solo confirman éxito tras completar; la contraseña se edita por el formulario. La pantalla aclara que la autenticación local no es seguridad de producción.

Aceptación de código: pruebas unitarias de la matriz de los tres roles, alta/login/edición de rol/desactivación, corrupción y fallo de escritura; TypeScript y build aprobados. La visita visual y navegación directa por cada rol quedan pendientes a petición del usuario de no ejecutar scripts de navegador. Ver `docs/ampliacion/E7-usuarios.md`.

## 13. E8 — Reportes y exportaciones

Archivos: `client/features/reportes/pages/ReportesPage.tsx`, `services/reportesService.ts`, `types/reportes.types.ts`, `components/ResumenFinancieroTab.tsx`, `TopProductosTab.tsx`, `LiquidacionSunatTab.tsx` y `ExportarReporteModal.tsx`.

- [X] E8.1 Límites inclusivos de calendario UTC: mes actual/año hasta hoy y mes anterior completo. Se filtran operaciones reales, sin factores ni meses fijos.
- [X] E8.2 Ventas completadas, gastos activos y compras recibidas; devoluciones en su fecha. Cobros reconstruidos de movimientos de Caja, separados de ventas/crédito.
- [X] E8.3 Costo actual identificado como estimación, sin atribuir precisión histórica; si falta costo, resultado no disponible. Importes financieros incluyen IGV y no se presentan como utilidad contable.
- [X] E8.4 Cero/sin operaciones y ranking vacío; las pérdidas no usan valores positivos de respaldo.
- [X] E8.5 Selector etiquetado, resumen compacto, gráfico mensual y tablas de respaldo; pestañas Finanzas, Productos y Tributario demo.
- [X] E8.6 Unidades, fechas, moneda y series con tokens `--chart-*`, leyenda y tabla alternativa del gráfico.
- [X] E8.7 CSV UTF-8 real, extensión `.csv`, enlace de descarga y manejo de error; sin prometer XLSX.
- [X] E8.8 Vista imprimible «Imprimir / guardar como PDF», con error si la ventana está bloqueada; sin anunciar descarga PDF.
- [X] E8.9 Secciones comunes de pantalla/CSV/impresión con mismo periodo, búsqueda y orden del ranking; CSV releído por parser con español, comillas y saltos. Verificación manual del archivo descargado y PDF pendiente, sin scripts de navegador por indicación del usuario.

Aceptación: con operaciones de prueba fechadas dentro/fuera de un periodo, pantalla y archivo coinciden. Los totales se pueden reconstruir desde los registros, no desde factores de variedad visual. No incluye integración o certificación SUNAT.

Implementación y límites documentados en `docs/ampliacion/E8-reportes.md`. Los checks anteriores indican implementación y pruebas de lógica/serialización; no equivalen a revisión visual ni a apertura de archivos en el navegador del usuario.

## 14. E9 — KIPU'S IA y recomendaciones

Archivos: `client/features/kipus-ia/pages/KipusIaPage.tsx`, `services/kipusIaService.ts`, `types/kipus-ia.types.ts`, sugerencias de Compras y paneles de ayuda de Ventas/Caja.

- [X] E9.1 Asistente local basado en reglas, sin modelos, claves ni servicios externos.
- [X] E9.2 Mayor saldo guardado por orden descendente (con aviso de no conciliación), producto más vendido por unidades netas y stock crítico por agotados/proporción de mínimo. Empates y vacíos explícitos.
- [X] E9.3 Periodos UTC reales, cálculos compartidos con Reportes, anulaciones/devoluciones y vacíos. Consultas desconocidas, periodos no admitidos o ambiguos piden precisión.
- [X] E9.4 Consultas de solo lectura. Reposición usa ventas netas de 30 días sin duplicar Kardex ni inventar ritmo/costo/proveedor; revisión de cantidades y formulario antes de guardar.
- [X] E9.5 Conversación sobria, selector, ejemplos, fuente y alcance de cada respuesta; retiradas tarjetas y estadísticas fijas sin sustento.
- [X] E9.6 Estado de respuesta, error/reintento con pregunta/periodo originales, borrador, bloqueo de doble envío, foco y región viva implementados. Comprobación manual de teclado/lector de pantalla y revisión visual de E9 pendientes, sin scripts de navegador por indicación del usuario.

Aceptación: un conjunto documentado de preguntas obtiene cifras coincidentes con el store; las sugerencias no escriben registros por sí solas y la interfaz no anuncia IA externa o predicción que no exista.

Reglas, preguntas, 20 pruebas y límites en `docs/ampliacion/E9-asistente.md`. Los checks indican implementación y prueba de lógica; no atribuyen aprobación visual de E8 a E9 ni certifican uso con lector de pantalla.

## 15. E10 — Integración y cierre por recorridos

Se trata de verificación técnica del nuevo trabajo, no de reactivación de la fase 5 cancelada.

| Caso | Recorrido de prueba                                                          | Resultado exigido                                                                           |
| ---- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| A01  | Guardar empresa → recargar → consultar cabecera/documentos pertinentes     | Datos conservados y consistentes                                                            |
| A02  | Crear proveedor → registrar compra recibida → Inventario → Kardex → Caja | Mismos productos, cantidades, referencia y efecto de pago; sin doble entrada                |
| A03  | Compra pendiente → consulta → recepción, si está implementada            | Stock cambia solo en el momento acordado y una sola vez                                     |
| A04  | Registrar gasto en efectivo → Caja → Reportes → recargar                  | Un gasto, una salida correspondiente y mismos importes                                      |
| A05  | Crear cliente → elegirlo en venta → consultar comprobante                  | Nombre/documento correctos y persistentes                                                   |
| A06  | Crear/editar/desactivar usuario → ingresar → ruta directa                  | Cuenta, estado y rol coherentes con la matriz demo                                          |
| A07  | Elegir periodo → comparar operaciones → exportar                           | Filas y totales coinciden; archivo utilizable                                               |
| A08  | Consultar mayor deuda/stock/producto vendido en IA local                     | Respuesta sustentada en datos, sin tomar el primer registro por defecto                     |
| A09  | Provocar fallo de almacenamiento durante operación                          | Sin falso éxito, sin efectos parciales y con borrador/reintento                            |
| A10  | Doble clic, guardado repetido y respuestas fuera de orden                    | Una operación por envío y datos recientes visibles                                        |
| A11  | Recargar, cerrar/abrir navegador y cerrar/iniciar sesión                    | Persistencia conforme al contrato local, usando siempre el mismo origen/perfil              |
| A12  | Catálogos vacíos, filtros sin resultados y datos inválidos                | Estados diferenciados; datos inválidos no sobrescritos silenciosamente                     |
| A13  | Ocho pantallas a 1440, 720 y 390 px, teclado y zoom real 200%                | Tareas principales accesibles, foco visible y sin desbordamiento de página                 |
| A14  | Tema claro/oscuro, textos y estados de cada módulo                          | Contraste medido en combinaciones usadas y significado legible sin depender solo del color  |
| A15  | Repetir diez veces un recorrido entre módulos                               | Sin errores de ejecución, bloqueos reproducidos ni acumulación de suscripciones observada |

No marcar un caso como aprobado por una inspección de código si exige operar en el navegador. Diferenciar prueba de lógica, prueba de navegador y validación humana. Si no se dispone de lector de pantalla o no se reproduce el bloqueo original, dejarlo explícitamente pendiente.

Resultado E10: diez pruebas integradas nuevas, suite completa de 210 pruebas en 27 archivos, TypeScript y build aprobados. La matriz de `docs/ampliacion/E10-integracion.md` registra el resultado técnico y el pendiente manual de cada caso A01–A15; no se ejecutaron scripts de navegador ni capturas por instrucción del usuario. No se encontraron nuevos defectos en los recorridos probados. Se escribió/reabrió CSV temporal, sin atribuirle descarga o apertura en navegador.

## 16. Forma de trabajar y evidencia por etapa

Para cada etapa, ejecutar esta secuencia:

1. Leer los archivos indicados y confirmar consumidores/contratos; registrar capturas iniciales con el mismo rol y datos de comparación.
2. Escribir las reglas de aceptación de la etapa y reproducir el fallo funcional que se vaya a corregir.
3. Ajustar servicio/store y UI necesarios para completar la tarea, manteniendo el alcance local del prototipo.
4. Completar mensajes, estados, teclado, móvil y claro/oscuro de esa entrega.
5. Añadir pruebas de regresión para persistencia, cálculos y operaciones con riesgo; no crear pruebas que solo repitan clases CSS o detalles reversibles de maquetación.
6. Ejecutar comprobaciones proporcionales. Antes del cierre de una entrega con cambios de código: `pnpm typecheck`, pruebas pertinentes y `pnpm build`; ejecutar la suite completa al tocar infraestructura compartida o al integrar el conjunto.
7. Repetir la tarea en navegador con perfil aislado. Guardar resultados esperados/reales, capturas y cualquier limitación.
8. Actualizar el seguimiento, informar qué cambió y dar las rutas locales para comparar. Hacer commit/push cuando estén solicitados, sin forzar la historia ni incluir archivos ajenos.

Estructura propuesta para las nuevas evidencias, a crear al ejecutar:

```text
docs/ampliacion/
  00-linea-base.md
  seguimiento.md
  E1-persistencia.md
  E2-configuracion.md
  E3-proveedores.md
  E4-compras.md
  E5-gastos.md
  E6-clientes.md
  E7-usuarios.md
  E8-reportes.md
  E9-asistente.md
  E10-integracion.md
  evidencias/<etapa>/<pantalla>-<ancho>-<antes-o-despues>.png
```

No reemplazar `docs/evidencias/fase4/` ni atribuir a este plan las capturas anteriores.

Cada incidencia debe tener: ID, etapa, pasos, rol, navegador, datos de prueba, resultado esperado, resultado observado, prioridad, archivo/corrección, prueba repetida, evidencia y commit si existe.

## 17. Seguimiento inicial y cierre

| Etapa | Estado                | Evidencia actual                                          | Próxima acción                                                |
| ----- | --------------------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| E0    | Completada            | docs/ampliacion/00-linea-base.md y evidencias/E0          | Línea base validada                                            |
| E1    | Completada            | docs/ampliacion/E1-persistencia.md y evidencias/E1        | Continuar con E2; preferencia de stock aún no conectada        |
| E2    | Completada            | docs/ampliacion/E2-configuracion.md y evidencias/E2       | Continuar con E3; parámetros sin soporte permanecen fijos      |
| E3    | Completada            | docs/ampliacion/E3-proveedores.md y evidencias/E3         | Continuar con E4                                                |
| E4    | Completada | docs/ampliacion/E4-compras.md y pruebas E4-09/E4-10 | Comparación visual aprobada por el usuario al solicitar E8 |
| E5    | Completada | docs/ampliacion/E5-gastos.md y pruebas de rango | Comparación visual aprobada por el usuario al solicitar E8 |
| E6    | Completada            | docs/ampliacion/E6-clientes.md                            | Continuar con E8 según dependencias                            |
| E7    | Completada en código | docs/ampliacion/E7-usuarios.md y pruebas de usuarios/auth | Comparación visual manual pendiente; continuar con E8          |
| E8    | Completada en código | docs/ampliacion/E8-reportes.md y pruebas E8-01–E8-20 | Visual aprobada por usuario; descarga/impresión manual pendientes |
| E9    | Completada en código | docs/ampliacion/E9-asistente.md y pruebas E9-01–E9-20 | Revisión visual, teclado y recorrido de formulario manual pendientes |
| E10   | Verificación técnica completada | docs/ampliacion/E10-integracion.md y logs de tipos/pruebas/build | Recorridos manuales A01–A15 según matriz; A13/A14 pendientes |

Criterios para declarar finalizado este nuevo plan:

- [ ] Los ocho módulos pendientes completan sus tareas principales con almacenamiento local confiable dentro del alcance acordado.
- [ ] Los recorridos entre módulos no producen duplicados ni resultados parciales ante los fallos probados.
- [X] Configuración, Usuarios y el store tienen fuentes de verdad documentadas y coherentes; verificadas en lógica de integración, con comprobación de pantalla según la matriz E10.
- [X] Reportes, exportaciones y asistente distinguen datos calculados, estimaciones y simulaciones; reglas y límites documentados en E8–E10.
- [ ] La interfaz sigue las reglas comunes y tiene evidencia en móvil/escritorio, claro/oscuro y teclado.
- [X] Los casos A01–A15 tienen resultado y evidencia, o un pendiente explícito que impide declarar esa parte terminada; ver matriz E10.
- [X] Tipos, pruebas necesarias y compilación pasan; se informa cualquier limitación material. E10: 210 pruebas en 27 archivos.
- [X] No se declara reactivada ni completada la evaluación humana de la fase 5 anterior.
