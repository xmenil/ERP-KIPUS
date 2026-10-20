# Plan del pendiente 2: registrar productos con lector QR/código de barras

Estado: etapas 1 y 2 implementadas, ampliadas con cámara por solicitud del usuario. Incluye campo de código en alta/edición, búsqueda exacta, validación de unicidad al guardar, consulta por código en catálogo/detalle y lectura real en el POS. El usuario confirmó el flujo manual con teclado. Pendiente: verificar cámara y lector físico en dispositivos reales; autocompletado externo sigue fuera de esta entrega.

## Integración con el trabajo compartido

El usuario confirmó posteriormente que la lectura funciona en su teléfono. Se integró `origin/main` (`e02e44e`) en la rama `feature/integracion-lector-productos`, conservando los cambios de voz y compras del colaborador. Los conflictos del formulario de productos y POS se resolvieron manteniendo la lectura exacta y las validaciones del código.

El escáner rápido del colaborador conserva la presentación de cámara/manual y la guía de encuadre, ahora conectadas a ZXing mediante un componente de cámara compartido con Productos y POS. Se sustituyó la dependencia exclusiva de `BarcodeDetector`. La lectura se detiene tras un código; una nueva apertura permite continuar.

El alta rápida guarda `codigoBarras` independiente del SKU y permite editar una coincidencia existente. El paso al formulario completo conserva el código. Las sugerencias del catálogo de ejemplo no asignan precios ni stock del negocio; se retiraron coincidencias por fragmentos. Se conserva la consulta externa del colaborador para sugerir datos descriptivos, con revisión antes de guardar.

Validación de integración: 46 pruebas automatizadas aprobadas, incluidas pruebas de coincidencias exactas del catálogo. Pendiente: repetir la prueba manual con el diseño integrado y verificar el lector físico.

## Ampliación implementada: celular y webcam

- Botón «Leer con cámara» tanto en el formulario de productos como en el POS. El lector físico y el ingreso manual siguen disponibles.
- ZXing (`@zxing/browser` con `@zxing/library`), cargado cuando se abre la cámara, permite decodificar códigos 1D y 2D en el navegador ([documentación](https://github.com/zxing-js/browser)).
- Una lectura por apertura: se detiene la cámara antes de entregar el código al flujo existente. Para otra unidad, volver a abrir la cámara o ajustar cantidad en el carrito.
- Preferencia por cámara trasera; selector cuando se detectan varias cámaras. Cancelación, cambio de dispositivo, salida de pantalla, pestaña oculta y errores detienen las pistas de vídeo. Una autorización tardía después de cancelar también libera el dispositivo.
- Mensajes para permisos denegados, webcam ausente, cámara ocupada y conexión insegura; reintento sin perder el formulario. No se solicita micrófono ni se suben imágenes a un servidor.
- Para acceder a la cámara se requiere HTTPS o localhost y autorización del navegador ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)). Abrir desde el celular `http://IP-del-PC:8080` normalmente no cumple este requisito; usar una URL HTTPS de la aplicación. No se configuró publicación ni certificado como parte de este cambio.
- Pruebas automatizadas del ciclo de vida: lectura única, liberación al cancelar, permiso tardío, decodificador tardío, fallo de inicio y mensajes de errores.

### Cómo probar la cámara

1. En PC abrir la aplicación en localhost; en celular abrir su URL HTTPS. Permitir acceso a la cámara.
2. En «Nuevo producto», pulsar «Leer con cámara» y apuntar a un código de barras de un envase o a un QR cuyo contenido sea un identificador simple.
3. Verificar que se completa el código y se cierra la cámara. Completar datos, stock y guardar.
4. En POS pulsar «Leer con cámara» y escanear el mismo envase/QR: debe agregar una sola unidad y cerrar la cámara.
5. Repetir con producto duplicado, desconocido, inactivo y sin stock; comprobar que no se agregan productos incorrectos.
6. Probar cerrar sin lectura, cambiar de cámara, denegar permiso y salir de la página durante la solicitud. El indicador de cámara debe apagarse al terminar.

La calidad de lectura depende de iluminación, enfoque y resolución; verificar QR y códigos de barras con los dispositivos que se usarán en el negocio.

### Ajustes tras prueba en teléfono

El usuario informó que la cámara abre pero no reconoce el código. Se incorporó búsqueda más exhaustiva, selector de tipo QR/barras, resolución preferida de 1080p y enfoque continuo cuando el dispositivo lo admite. El enfoque es opcional y no bloquea cámaras sin soporte. Los errores que detienen el motor ahora se muestran y permiten reintentar, en lugar de dejar la pantalla aparentemente buscando.

Se añadieron pruebas que ejecutan el motor sobre imágenes QR y EAN-13 (incluyendo código con ceros iniciales y barras fuera del centro). Se prioriza EAN-13 para evitar la conversión automática de un código con cero inicial a UPC-A de 12 dígitos; códigos UPC-A se leen en su representación EAN-13 de 13 dígitos. Falta confirmar la corrección en el teléfono del usuario. Las pruebas de imágenes no sustituyen la comprobación del enfoque real.

## Objetivo y descripción corregida

Permitir que el comerciante escanee el identificador de un producto para iniciar su registro sin escribir el código. Si el código ya existe, mostrar el producto registrado y evitar un alta duplicada. Si no existe, conservar el código en el formulario, completar los datos comerciales y confirmar con «Guardar producto».

La lectura no trae automáticamente nombre, categoría, precio o stock. Para completar esos datos automáticamente hará falta un catálogo de proveedor, una importación o una integración externa. No se creará un producto incompleto ni se aumentará stock solo por escanear.

## Alcance de la primera versión

- Lector físico que funcione como teclado y termine cada lectura con Enter; también se permite escribir o pegar el código manualmente.
- Códigos de barras y QR cuyo contenido sea un identificador de producto en texto. La capacidad de leer QR depende del lector físico.
- Un código opcional por producto, independiente del SKU interno.
- Alta y edición en el formulario utilizado por Productos.
- Búsqueda exacta y validación de duplicados en la capa que guarda los productos.
- Persistencia local actual, sin nuevos endpoints ni dependencias para decodificar imágenes.

Quedan para una ampliación: cámara del celular/PC, varios códigos por producto, registro por lotes, catálogos externos y QR con estructuras especiales (URL, JSON o GS1). No abrir enlaces ni interpretar contenidos QR como instrucciones. Si se necesitan QR estructurados, definir primero su formato y cómo extraer el identificador.

## Hallazgos del código actual

- `Producto` y `NuevoProductoPayload` tienen `sku`, pero no código de barras separado.
- `ProductosPage.tsx` utiliza `ProductoFormDialog.tsx` para crear y editar. `NuevoProductoDialog.tsx` existe, pero no se encontraron usos; no se modificará un formulario sin uso para resolver este flujo.
- `erpStore.crearProducto` y `actualizarProducto` ya comprueban duplicados de SKU. Deben incorporar una validación independiente del código leído.
- El catálogo se conserva en almacenamiento local. Los productos antiguos deben seguir funcionando sin código y sin reiniciar los datos guardados.
- `PosTerminalView.tsx` utiliza `handleSimularEscaner`, que agrega un producto aleatorio. Su sustitución es una segunda etapa que reutiliza la búsqueda de la primera.

## Flujo de registro

1. Abrir «Nuevo producto». Mostrar primero «Código de barras / QR (opcional)», con ayuda: «Escanea el producto o escribe su código y presiona Enter».
2. Enfocar el campo al abrir el alta. Capturar Enter únicamente en ese campo, impedir que envíe el formulario y ejecutar la búsqueda; ofrecer también «Buscar código» para uso manual/táctil.
3. Si el código no existe, indicar «Código disponible. Completa los datos del producto» y pasar el foco al nombre. Mantener el SKU independiente.
4. Si existe, mostrar nombre, SKU y estado activo/inactivo. Bloquear el alta con ese código y ofrecer abrir la edición con una acción explícita; conservar el borrador hasta que el usuario decida cambiar de producto.
5. Completar nombre, categoría, unidad, precios y stock. El stock inicial del alta comenzará en 0: escanear no demuestra cuántas unidades tiene el negocio.
6. Guardar después de validar los campos. Deshabilitar el envío mientras se guarda y conservar los datos ante un error.
7. Confirmar el registro y actualizar el catálogo. Para otro producto, abrir un nuevo alta y volver a enfocar el campo de código.

En edición se podrá asignar, reemplazar o quitar el código. Conservar el código del mismo producto es válido. Una lectura de otro producto mostrará el conflicto y no sobrescribirá datos automáticamente. Reponer existencias seguirá el flujo de inventario existente; no se añadirá una entrada automática como parte del escaneo.

## Reglas de datos

- Añadir `codigoBarras?: string` a ambos tipos. Conservarlo como texto para mantener ceros iniciales y letras.
- Centralizar normalización y búsqueda: quitar espacios de los extremos, preservar mayúsculas/minúsculas y contenido interno; rechazar controles, contenido multilínea y códigos de más de 256 caracteres. No convertir a número ni quitar caracteres arbitrariamente.
- Campo vacío significa producto sin código. Permitir que varios productos no tengan código; al editar, distinguir campo omitido de una petición de quitar el código.
- La unicidad incluye productos activos e inactivos y excluye el propio ID al editar. Revalidar al guardar, aunque la búsqueda previa haya indicado disponibilidad.
- No imponer longitud EAN ni dígito de control a todos los códigos: el campo también admite identificadores QR y códigos alfanuméricos.
- La búsqueda inicial será por `codigoBarras` exacto. No copiar SKU al nuevo campo ni inventar códigos para el catálogo de ejemplo.
- Mantener la persistencia existente. La validación local cubre esta versión; una futura base centralizada deberá imponer unicidad y concurrencia en servidor.

## Orden de implementación

### Etapa 1: registro y edición

1. Crear una utilidad de códigos con validación, normalización y búsqueda exacta, acompañada de pruebas de sus reglas.
2. Ampliar tipos, guardado y actualización en `erpStore`; exponer búsqueda desde `productosService`. Probar duplicados al crear/editar y eliminación del código.
3. Integrar el campo y sus estados en `ProductoFormDialog`, utilizando los componentes existentes y errores junto al campo. Conectar desde `ProductosPage` la acción para editar una coincidencia.
4. Incluir el código en la búsqueda del catálogo y en el detalle del producto para que el comerciante pueda comprobar lo registrado.
5. Ejecutar comprobaciones y verificar el flujo manual con teclado y lector real.

### Etapa 2: reutilizar el lector en el POS

1. Sustituir el escaneo aleatorio por un campo de lectura enfocado mediante «Escáner», con Enter para buscar el código exacto.
2. Añadir una unidad del producto conocido usando las validaciones actuales del carrito; rechazar producto inactivo, desconocido o sin stock disponible.
3. Limpiar y reenfocar el campo tras cada lectura para continuar vendiendo. Dos lecturas consecutivas del mismo producto deben sumar dos unidades si hay stock.
4. Mantener la búsqueda manual por nombre/SKU. No capturar globalmente teclas que pertenezcan a cantidad, precio, cliente u otros campos.

### Etapa posterior: cámara y autocompletado

Definir dispositivos/navegadores y formato de códigos antes de elegir una biblioteca de cámara. Esa etapa requiere permisos, detener la cámara al cerrar, controlar detecciones repetidas y comprobar compatibilidad en equipos reales. Para autocompletar productos desconocidos, acordar primero la fuente de datos y su cobertura; precio de venta y stock del negocio siguen requiriendo validación.

## Archivos previstos

- `client/features/productos/types/productos.types.ts`
- `client/features/productos/services/productosService.ts`
- Nueva utilidad y pruebas de códigos en `client/features/productos/`.
- `client/services/erp/erpStore.ts` y pruebas pertinentes del guardado.
- `client/features/productos/components/ProductoFormDialog.tsx`
- `client/features/productos/pages/ProductosPage.tsx`
- `client/features/productos/components/ProductoDetalleModal.tsx`
- `client/features/ventas/components/PosTerminalView.tsx` (etapa 2).

## Criterios de aceptación y verificación

- Código desconocido: queda en el alta; Enter no guarda; solo se registra al completar datos y confirmar.
- Código conocido: muestra la coincidencia y bloquea duplicación, incluso si el producto está inactivo.
- `0012345678905` se conserva exactamente después de guardar y recargar.
- Edición: admite conservar código propio, cambiarlo por uno libre y quitarlo; rechaza el de otro producto.
- Alta sin código y productos anteriores siguen funcionando. No se borran datos ni se inventan existencias.
- Espacios exteriores se normalizan; lectura vacía, controles, varias líneas y longitud excesiva muestran un error junto al campo.
- Un segundo escaneo en el formulario reemplaza el valor seleccionado, sin concatenar códigos ni sobrescribir nombre/precios/stock silenciosamente.
- Guardar dos veces no crea dos productos; los errores conservan el borrador.
- POS: código exacto agrega el producto correcto; desconocido no agrega nada; lecturas repetidas respetan stock y cantidades existentes en el carrito.
- Pruebas automatizadas para normalización, búsqueda y unicidad al crear/editar. Ejecutar `pnpm typecheck`, las pruebas pertinentes con Vitest y `pnpm build`.
- Verificación manual: teclado/pegado, lector real con sufijo Enter, QR identificador si el equipo lo admite, foco, móvil y errores accesibles. No declarar compatibilidad con hardware sin probarlo.

## Supuestos por confirmar durante la implementación

La primera entrega utiliza lector físico como teclado con Enter y QR de identificador simple. Si el dispositivo solo lee códigos de barras, el sistema no podrá convertirlo en lector QR. Si se pretende usar la cámara desde el inicio o cargar datos automáticamente de un proveedor, ajustar el alcance antes de implementar esas partes.
