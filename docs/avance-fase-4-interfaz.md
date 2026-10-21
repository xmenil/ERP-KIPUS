# Fase 4: orden visual y facilidad de uso

Fecha: 21/10/2026. Referencia: [plan de trabajo](./plan-trabajo-recomendaciones.md).

La implementación de las pantallas priorizadas está realizada. Se mantiene el prototipo funcional con `localStorage`. La evaluación con usuarios nuevos y las puntuaciones antes/después corresponden a la fase 5.

## Criterio aplicado

Se reutilizan la paleta y los componentes existentes, siguiendo `.agents/skills/kipus-ui/SKILL.md`: superficies neutras, violeta para la acción principal y navegación, colores semánticos para estados del negocio, tipografía legible y menos elementos repetidos. No se agregó una segunda paleta ni dependencias.

## Cambios para comparar

| Pantalla | Situación anterior | Resultado local |
|---|---|---|
| Productos | Cuatro tarjetas independientes, valoraciones con mucho protagonismo y tres acciones por fila | Resumen en una sola superficie; valoración desplegable; acción principal «Nuevo producto»; editar visible y menú para detalle/eliminar |
| Tabla de productos | Categoría, costo y margen competían con precio/stock y ensanchaban la tabla | Prioridad a SKU, producto, precio, stock, estado y acciones. Las columnas adicionales se muestran desde 1536 px; sus datos siguen disponibles en el detalle |
| Formulario de productos | Encabezado decorativo, tamaños pequeños y colores particulares | Secciones de datos, precios y existencias; etiquetas asociadas a categoría/unidad; entradas de 16 px en móvil; mensajes y colores coherentes |
| Detalle y eliminación | Detalle con colores particulares y confirmación nativa del navegador | Detalle alineado con la paleta y diálogo de confirmación con nombre del producto, cancelar y estado de eliminación |
| Resumen del negocio | Tarjetas y textos de turno/estado fijos; porcentaje de variación fijo visible | Un bloque con ventas, efectivo y pendientes accionables. Se retiraron los estados y la comparación fija de la presentación; gráfico principal con colores de los tokens de gráficos |
| Inventario | Indicadores separados y filtros en una fila estrecha | Franja de indicadores y filtros en una rejilla adaptable, con etiquetas visibles |
| Ventas | Título largo, aviso fijo de caja abierta y cuatro tarjetas de métricas | Título «Ventas», controles secundarios neutros, resumen compacto y retiro del estado fijo de caja en la pestaña de resumen |
| Caja | Selector de tres botones, indicadores separados y acceso duplicado al cierre | Selector compacto de vista, saldo principal, franja de movimientos y un solo acceso al cierre dentro de «Mi caja» |
| Navegación | Nombre Dashboard, tipografía pesada y cabecera con tipo de cambio fijo y notificación sin acción | Nombre «Resumen del negocio», cabecera más simple y sede tomada del usuario; se retiraron esos indicadores fijos o sin operación |

El nombre del menú cambió; la ruta del inicio sigue siendo `/dashboard`. En Productos, la valoración al costo continúa oculta al cajero. Los cambios de presentación no convierten el prototipo en un servicio de facturación conectado ni modifican el origen de sus datos simulados.

## Estados y accesibilidad

- Se conservan carga, vacío, error y éxito de los flujos existentes. El resumen ahora ofrece reintento si falla una consulta y evita mostrar su esqueleto indefinidamente en ese caso.
- Los campos de formulario mantienen su contenido cuando falla el guardado.
- Los botones base tienen tamaño táctil de 44 px en móvil y 36 px en escritorio, salvo variantes o pantallas que tengan medidas propias. Los controles principales de las pantallas revisadas se ajustaron expresamente.
- Se añadieron nombres accesibles a búsqueda y acciones, asociación de etiquetas, estado semántico de ordenamiento y traducción de los controles de menú/cierre.
- El cierre de diálogos tiene un área táctil mayor; el menú por fila usa Radix y permite acceso por teclado.
- Se respeta `prefers-reduced-motion` para reducir animaciones y transiciones.

## Evidencia de navegador

Se revisaron las cinco pantallas en Chrome sin interfaz, con sesión de administrador demo en un perfil separado. No se usó el almacenamiento del perfil del usuario.

| Comprobación | Resultado |
|---|---|
| Cinco rutas a 1440, 720 y 390 px | 15 combinaciones cargadas, sin desbordamiento horizontal de página y sin errores de renderizado detectados |
| Excepciones de ejecución registradas | Ninguna durante el recorrido |
| Formulario a 390 px | Diálogo de 370,5 px y campo de nombre con fuente calculada de 16 px |
| Alta y recarga | Producto conservado con precio registrado |
| Edición | Nombre actualizado y encontrado en el almacenamiento local de prueba |
| Cancelación de eliminación | El registro continúa guardado |
| Teclado | Menú de acciones abierto con flecha abajo; navegación con Tab comprobada |

El ancho de 720 px comprueba reflujo en espacio reducido, pero no sustituye una prueba manual de zoom del navegador al 200%. Tampoco esta revisión reemplaza una auditoría completa con lector de pantalla o pruebas de todos los roles.

### Contraste medido

Valores calculados en Chrome a partir de los colores de los tokens usados. Todas las combinaciones siguientes superan 4,5:1 para texto normal.

| Texto / fondo | Claro | Oscuro |
|---|---:|---:|
| Principal / tarjeta | 17,12:1 | 14,77:1 |
| Secundario / tarjeta | 6,29:1 | 7,33:1 |
| Texto de botón principal / primario | 11,56:1 | 6,71:1 |
| Error / fondo suave | 5,83:1 | 6,17:1 |
| Advertencia / fondo suave | 4,87:1 | 8,86:1 |
| Éxito / fondo suave | 4,87:1 | 8,41:1 |

Esto valida esas combinaciones de tokens, no todos los elementos de todas las pantallas. El modo oscuro se comprobó visualmente en Productos; sigue pendiente una revisión exhaustiva del resto del ERP en ese modo.

### Capturas

| Pantalla | Escritorio | Móvil |
|---|---|---|
| Resumen del negocio | [1440 px](./evidencias/fase4/dashboard-1440.png) | [390 px](./evidencias/fase4/dashboard-390.png) |
| Productos | [1440 px](./evidencias/fase4/productos-1440.png) | [390 px](./evidencias/fase4/productos-390.png) |
| Inventario | [1440 px](./evidencias/fase4/inventario-1440.png) | [390 px](./evidencias/fase4/inventario-390.png) |
| Ventas | [1440 px](./evidencias/fase4/ventas-1440.png) | [390 px](./evidencias/fase4/ventas-390.png) |
| Caja | [1440 px](./evidencias/fase4/caja-1440.png) | [390 px](./evidencias/fase4/caja-390.png) |

También se guardaron el [formulario](./evidencias/fase4/producto-formulario-390.png), la [confirmación de eliminación](./evidencias/fase4/producto-confirmacion-390.png), [Productos en oscuro](./evidencias/fase4/productos-oscuro-390.png) y los [resultados medidos](./evidencias/fase4/revision.json).

Las capturas corresponden a la versión local posterior a los ajustes. La comparación de «antes» usa la estructura de código revisada, no capturas del despliegue. El script `node scripts/revision-fase4.mjs` reproduce la revisión en Windows con Chrome instalado y el servidor local activo; usa un perfil nuevo por ejecución.

## Validación técnica y comparación manual

La suite existente pasó: **58 pruebas en 11 archivos**. Se verificaron TypeScript y compilación; el aviso de Browserslist sobre datos antiguos no impide compilar. Se hizo una comprobación adicional de tipos y compilación tras los ajustes finales.

Para comparar con el despliegue, recargar el servidor que ya estaba activo y abrir las mismas pantallas con el mismo rol y ancho de ventana:

- [Resumen del negocio](http://localhost:8080/dashboard).
- [Productos](http://localhost:8080/productos): revisar resumen, valoración desplegable, menú por fila y formulario.
- [Inventario](http://localhost:8080/inventario): comparar indicadores y filtros.
- [Ventas](http://localhost:8080/ventas): comparar cabecera y pestaña de resumen.
- [Caja](http://localhost:8080/caja): comparar selector de vista, saldo y movimientos.

La versión local y el despliegue tienen almacenamientos independientes: comparar organización y facilidad de completar tareas, no exigir iguales cantidades o importes.

## Siguiente fase

La fase 5 debe evaluar los mismos recorridos con usuarios nuevos, repetir la matriz de aceptación y registrar tiempos, ayuda requerida y puntuaciones. Completar en esa validación el zoom real de 200%, lector de pantalla básico, roles cajero/supervisor y los estados menos frecuentes. No se atribuye todavía una mejora de puntuación ni la resolución del bloqueo original a estos ajustes visuales.
