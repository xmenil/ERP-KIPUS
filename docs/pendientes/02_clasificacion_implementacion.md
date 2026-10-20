# Pendientes: dificultad y propuesta de implementación

Análisis del archivo `01_pendiente.md`, sus tres capturas y el código actual. Este documento propone el trabajo; las funcionalidades todavía no se han implementado.

## Clasificación y orden recomendado

| Orden | Pendiente | Dificultad | Esfuerzo orientativo | Motivo |
| --- | --- | --- | --- | --- |
| 1 | Cerrar sesión por inactividad y exigir login antes de mostrar contenido | Media-baja (2/5) | 1–2 días | Controlar vencimiento, restauración de sesión y sincronización entre pestañas. |
| 2 | Registrar productos con lector QR/código de barras | Media (3/5) | 1–3 días con lector físico; 2–4 días adicionales con cámara | Capturar el código es sencillo; completar datos exige una fuente de información. |
| 3 | Activar voz del POS con un clic | Media-alta (4/5) | 2–4 días para una primera versión | Requiere reconocimiento real, permisos y resolver productos/cantidades sin confusiones. |
| 4 | Recomendar compras por ventas y stock | Alta (5/5) | 5–8 días para una primera versión | Hace falta completar el modelo de órdenes y su relación con inventario. |

Estimaciones para una persona familiarizada con el proyecto, incluyendo validación básica. No incluyen proveedores externos, despliegue ni migración a una base de datos. El orden combina dificultad y dependencias; si el abastecimiento es urgente, puede adelantarse el cuarto pendiente después de corregir el modelo de compras.

## 1. Inicio de sesión obligatorio y cierre por inactividad

**Estado de implementación:** cierre por inactividad implementado con un límite de 15 minutos, definido en `SESSION_IDLE_TIMEOUT_MS` dentro de `client/features/auth/services/sessionStore.ts`. Se valida al restaurar y al recuperar foco/visibilidad; se comparte actividad y cierre entre sesiones recordadas en distintas pestañas. Las sesiones de una pestaña usan `sessionStorage`. Los campos de credenciales empiezan vacíos y el login muestra un aviso cuando se detecta vencimiento. Se añadieron pruebas automatizadas de la persistencia y del límite de expiración. Queda pendiente verificar manualmente el flujo en navegador, la suspensión del equipo y las pestañas.

**Requisito aclarado:** en cada acceso al login mostrar primero la animación de introducción existente y después el formulario de inicio de sesión. Esto incluye el retorno después del cierre por inactividad. El botón «Omitir» permite pasar al formulario. Mostrar el contenido del sistema únicamente después de autenticar al usuario. No se requiere una página pública adicional.

**Situación actual:** `ProtectedRoute` ya envía al login cuando no hay usuario autenticado. Sin embargo, `authService` restaura el usuario guardado en `localStorage` sin comprobar vencimiento y `AuthContext` no controla la inactividad. Por eso una sesión recordada permite volver directamente al contenido incluso después de mucho tiempo. Además, la restauración actual solo lee `localStorage`, aunque el login sin «recordar» guarda en `sessionStorage`; ambos casos deben tratarse de forma coherente.

**Política propuesta pendiente de definir:** usar, por ejemplo, 15 minutos de inactividad como valor inicial configurable. La sesión puede continuar mientras esté vigente; una sesión vencida debe llevar al login incluso al recargar o reabrir el navegador. «Recordar» no debe impedir el vencimiento por inactividad. Si se requiere login en cada apertura aun con sesión vigente, definirlo como una regla adicional.

**Pasos:**

1. Guardar una marca de última actividad al iniciar sesión. Al restaurar, validar el tiempo transcurrido antes de publicar el usuario autenticado; las sesiones antiguas sin marca deben exigir login.
2. Crear un controlador de inactividad en `AuthContext` o un hook dedicado. Registrar interacciones como teclado, clic, desplazamiento y toque, limitando la frecuencia de escrituras. Las peticiones automáticas del sistema no cuentan como actividad del usuario.
3. Comprobar el vencimiento antes de renovar la marca de actividad para que una interacción tardía no reactive una sesión vencida.
4. Al vencer, limpiar usuario, token y marcas de sesión en memoria y almacenamiento, actualizar el contexto y dejar que `ProtectedRoute` redirija a `/login` con un motivo de expiración.
5. Comprobar también al recuperar foco o visibilidad, y al cargar la aplicación: los temporizadores pueden retrasarse con una pestaña en segundo plano o un equipo suspendido.
6. Sincronizar actividad y cierre entre pestañas cuando compartan la misma sesión. Mantener aisladas las sesiones que solo existen en `sessionStorage`.
7. Conservar los módulos dentro de `ProtectedRoute`. El contenido se muestra únicamente tras autenticación válida; no es necesario cambiar `/` a una página pública.

**Archivos:** `client/features/auth/services/authService.ts`, `client/features/auth/context/AuthContext.tsx`, un posible hook de inactividad y `client/features/auth/components/ProtectedRoute.tsx`. Revisar `LoginPage.tsx` para presentar el motivo de expiración. No requiere endpoint para la versión local actual; cuando exista autenticación real en servidor, el servidor también debe validar el vencimiento de la sesión.

**Criterios de aceptación:** sin sesión, `/` y los módulos protegidos llevan al login; el login válido permite ver contenido; actividad antes del límite prolonga la sesión; superar el límite cierra la sesión; recargar, reabrir o volver de suspensión con una sesión vencida exige credenciales; «recordar» no evita el cierre; las pestañas de una sesión compartida reflejan el cierre; login sin «recordar» se restaura correctamente dentro de su pestaña. Verificar con reloj controlado el límite de expiración y manualmente la suspensión y las pestañas.

## 2. Alta de productos con lector

**Plan revisado:** consultar `03_plan_lector_productos.md`. Etapas 1 y 2 implementadas: alta/edición con código independiente del SKU, control de duplicados, búsqueda en catálogo y lectura exacta en POS. Se añadió lectura con cámara de celular/webcam en ambos flujos; cada apertura entrega una sola lectura y libera el dispositivo. El usuario confirmó la lectura manual con teclado. Pendiente: validación manual de cámara y lector físico. El catálogo externo queda para una ampliación. La situación y pasos originales que siguen describen la propuesta previa.

**Situación actual:** `Producto` y `NuevoProductoPayload` tienen `sku`, pero no un campo separado para código de barras. El lector del POS en `PosTerminalView.tsx` agrega un producto aleatorio mediante `handleSimularEscaner`.

**Alcance inicial recomendado:** lector físico configurado como teclado, que escriba el código en un campo y termine con Enter. Confirmar si el equipo lee QR, códigos de barras o ambos. Agregar lectura por cámara en una segunda etapa.

**Pasos:**

1. Agregar `codigoBarras?: string` al producto y al payload, conservando el SKU como identificador interno. Mantener los códigos como texto para preservar ceros iniciales.
2. Incorporar el campo de lectura al formulario de alta y buscar coincidencias exactas en el catálogo.
3. Si existe: mostrar el producto y ofrecer editarlo o registrar una entrada de inventario, evitando duplicarlo.
4. Si no existe: completar el código y permitir ingresar nombre, categoría, precios y stock. Validar unicidad también al guardar.
5. Reutilizar la búsqueda por código en el POS para sustituir el escaneo aleatorio.
6. Para cámara: agregar captura, decodificación, cierre de cámara y control de lecturas repetidas. Validar la biblioteca elegida en los dispositivos reales antes de integrarla.

**Límite importante:** leer un código no proporciona por sí solo nombre, precio, categoría o stock. El autocompletado requiere un catálogo existente, una importación del proveedor o un servicio externo. El precio y stock propios deben definirse en el negocio. Registrar automáticamente solo es viable cuando todos los campos obligatorios están disponibles y validados.

**Archivos:** `client/features/productos/types/productos.types.ts`, `client/features/productos/services/productosService.ts`, los formularios de productos, `client/services/erp/erpStore.ts` y `client/features/ventas/components/PosTerminalView.tsx`.

**Criterios de aceptación:** código conocido, desconocido, duplicado y con ceros iniciales; escaneos consecutivos; Enter no envía accidentalmente el formulario; cancelar la cámara libera el dispositivo. Si se usa cámara, `getUserMedia` requiere permiso y un contexto seguro, como HTTPS o localhost ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)).

## 3. Escuchar pedidos con un clic en «Voz KIPU'S IA»

**Situación actual:** el botón solo alterna un campo de texto. `handleInterpretarVoz` busca palabras del nombre y agrega coincidencias; no captura audio ni interpreta correctamente cantidades. Una palabra compartida puede agregar varios productos.

**Pasos:**

1. Crear un hook de reconocimiento y llamar a `start()` desde el clic del botón, con idioma `es-PE`. Detectar soporte en ejecución.
2. Gestionar estados de inicio, escucha, procesamiento, fin y error; permitir detener y limpiar el reconocimiento al salir del POS.
3. Mostrar la transcripción y procesar únicamente resultados finales, evitando agregar dos veces una misma frase.
4. Separar la interpretación en una función que devuelva productos, cantidades y coincidencias ambiguas. Comenzar con comandos definidos, por ejemplo «agrega dos unidades de [producto]».
5. Agregar automáticamente solo coincidencias inequívocas con stock suficiente. Si hay varias presentaciones o marcas, pedir selección; si no hay coincidencia, permitir corregir el texto.
6. Mantener la entrada manual como alternativa. El cobro conserva su flujo de confirmación.

**Implementación inicial:** Web Speech API donde esté disponible. Tiene compatibilidad limitada y algunas implementaciones procesan audio mediante un servicio remoto; no asumir funcionamiento sin conexión ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)). El navegador puede solicitar permiso la primera vez: un clic inicia la solicitud, pero no elimina ese permiso.

**Archivos:** `client/features/ventas/components/PosTerminalView.tsx`, un nuevo hook de voz y una función de interpretación. Si posteriormente se elige transcripción externa con credenciales privadas, esas credenciales deben quedar en el servidor.

**Criterios de aceptación:** permiso concedido/denegado, navegador sin soporte, silencio, desconexión, cantidades, nombres parecidos, falta de stock, varios comandos y salida de pantalla durante la escucha. Probar con micrófono real y ruido de tienda.

## 4. Recomendación y generación de órdenes de compra

**Situación actual:** las ventas guardan líneas por producto, pero `Compra` conserva únicamente totales e `itemsCount`. No guarda líneas con cantidades pendientes por producto. Además, `erpStore.registrarCompra` aumenta el stock del producto seleccionado o del primero si no se selecciona: ese comportamiento debe corregirse antes de automatizar abastecimiento. Los servicios revisados usan datos locales mediante `erpStore` y demoras simuladas.

**Fase A: completar compras e inventario**

1. Modelar órdenes con proveedor, líneas (`productoId`, cantidad solicitada, cantidad recibida, costo), fechas y estados de borrador, emitida, parcialmente recibida, recibida y anulada.
2. Crear la orden sin aumentar stock. Aumentarlo únicamente al recibir cantidades por producto, registrando su movimiento de inventario.
3. Impedir recepciones duplicadas y cantidades inválidas. Migrar los datos locales existentes sin inventar el detalle que no está disponible.
4. Establecer proveedor habitual, plazo de entrega, múltiplos de compra y parámetros de cobertura cuando se necesiten.

**Fase B: recomendaciones explicables**

1. Empezar con productos bajo stock mínimo y una cantidad objetivo configurable.
2. Incorporar ventas completadas de una ventana configurable, por ejemplo 30 días. Excluir anuladas y ajustar devoluciones según su tratamiento, sin descontarlas dos veces.
3. Calcular demanda diaria y compras pendientes de recepción por producto.
4. Mostrar cantidad sugerida y motivo; permitir editar y seleccionar líneas para crear borradores agrupados por proveedor.

```text
demandaDiaria = unidades netas vendidas / días de la ventana
stockObjetivo = max(stockMinimo,
                    demandaDiaria × (plazoEntrega + diasCobertura) + stockSeguridad)
cantidadSugerida = max(0, redondearHaciaArriba(stockObjetivo - stockActual - pendienteRecepcion))
```

`diasCobertura` representa la cobertura adicional después del plazo de entrega. Ajustar el redondeo a la unidad de medida y a los múltiplos del proveedor; no todas las unidades admiten solo enteros.

Ejemplo con unidades enteras: demanda de 3 unidades/día, plazo de 2 días, cobertura adicional de 5 días, seguridad de 4, mínimo de 5, stock de 8 y 6 pendientes. Objetivo: `max(5, 3 × 7 + 4) = 25`; sugerencia: `25 - 8 - 6 = 11` unidades.

**Casos especiales:** sin historial, usar mínimo/objetivo manual y señalar datos insuficientes; para productos nuevos, usar solo los días observados; los días sin stock pueden subestimar la demanda. Una recomendación por rotación no necesita IA generativa para su primera versión.

**Archivos:** tipos, servicio, página y formulario de `client/features/compras/`; `client/services/erp/erpStore.ts`; tipos/servicios de ventas, productos e inventario; un módulo separado de cálculo de abastecimiento.

**Criterios de aceptación:** stock bajo sin ventas, alta rotación, orden pendiente que evita recomendar otra compra, devolución, venta anulada, recepción parcial, recepción repetida, proveedor faltante y unidades fraccionarias. Probar el cálculo con datos controlados y comprobar que crear un borrador no altera stock.

## Alcance técnico común

La primera versión puede aprovechar los servicios actuales y la persistencia local. Para operar entre varios dispositivos, compartir stock y gestionar órdenes concurrentes hará falta persistencia centralizada y validación en servidor; eso constituye trabajo adicional. Crear endpoints únicamente cuando la persistencia compartida, operaciones de base de datos o credenciales privadas lo requieran.

Antes de implementar cada funcionalidad, definir su alcance mínimo y aplicar las reglas UI del proyecto. Al terminar cambios de código, ejecutar `pnpm typecheck` y las verificaciones pertinentes: pruebas de cálculo para abastecimiento y validaciones manuales con hardware para lector y voz.
