
# Auditoría Funcional: Módulos de Productos e Inventario (KIPU'S ERP)

Esta auditoría evalúa exclusivamente la **lógica de negocio, reglas de validación y flujos funcionales** de los módulos de Productos e Inventario, sin entrar en aspectos estéticos de diseño.

---

## 1. Evaluación Punto por Punto (1 a 16)

### 1. Acciones por fila (editar, ver kardex, ajustar stock, desactivar)
* **Estado:** **PARCIAL**
* **Evidencia:**
  * [ProductosPage.tsx:L361-432](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L361-L432): En el catálogo de productos **no existe columna de acciones por fila**. No hay botón de edición, ni enlace directo para ver su kardex individual, ni opción de desactivar o ajustar.
  * [TablaControlStock.tsx:L241-265](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/TablaControlStock.tsx#L241-L265): En la tabla de control de existencias de Inventario sí existen acciones por fila: `+ Recibir` (para registrar llegada) y `Cotejar` (para abrir el diálogo de auditoría física). Sin embargo, faltan las acciones de editar datos maestros, desactivar y ver el historial de kardex filtrado para esa fila.

---

### 2. Paginación, conteo y ordenamiento
* **Estado:** **PARCIAL**
* **Evidencia:**
  * **Paginación:** **SÍ**. Implementada en [ProductosPage.tsx:L23, L87-91, L507-531](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L23) con tamaño fijo (`PAGE_SIZE = 12`) y botones de navegación (*Anterior / Siguiente*).
  * **Conteo:** **SÍ**. Implementado en [ProductosPage.tsx:L495-505](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L495-L505) (*"Mostrando 1–12 de X productos"*) y en [InventarioPage.tsx:L286-288](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/pages/InventarioPage.tsx#L286-L288) (*"Mostrando X movimientos"*).
  * **Ordenamiento:** **NO**. Los encabezados `<TableHead>` en ambos módulos ([ProductosPage.tsx:L362-368](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L362-L368) e [InventarioPage.tsx:L295-318](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/pages/InventarioPage.tsx#L295-L318)) son etiquetas estáticas sin eventos `onClick`, ni iconos de dirección ascendente/descendente por columna (SKU, nombre, costo, precio, stock).

---

### 3. Filtros por estado (bajo, agotado, inactivo)
* **Estado:** **PARCIAL**
* **Evidencia:**
  * [ProductosPage.tsx:L215-231](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L215-L231): Solo cuenta con filtrado por categoría y búsqueda textual. **No tiene filtros rápidos para stock bajo, agotado ni inactivo**.
  * [TablaControlStock.tsx:L70-121](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/TablaControlStock.tsx#L70-L121): En Inventario sí existen botones de filtro por estado de stock: *"Todos"*, *"Suficiente"*, *"Por agotarse"* (bajo) y *"Agotado"*. Sin embargo, **ninguno de los dos módulos permite filtrar por productos inactivos**.

---

### 4. Campos del formulario de producto
* **Campos evaluados:** SKU, código de barras, unidad SUNAT, tipo (producto/servicio), afectación IGV, precio con IGV, costo, precio, stock mínimo, proveedor.
* **Estado:** **PARCIAL** (4 completos, 2 parciales, 4 ausentes)
* **Evidencia:** [NuevoProductoDialog.tsx:L33-57, L131-322](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/components/NuevoProductoDialog.tsx#L33-L57):
  * **SKU:** **SÍ** ([L134-151](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/components/NuevoProductoDialog.tsx#L134-L151)).
  * **Costo (`precioCompra`):** **SÍ** ([L207-224](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/components/NuevoProductoDialog.tsx#L207-L224)).
  * **Precio (`precioVenta`):** **SÍ** ([L229-246](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/components/NuevoProductoDialog.tsx#L229-L246)).
  * **Stock mínimo:** **SÍ** ([L274-291](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/components/NuevoProductoDialog.tsx#L274-L291)).
  * **Unidad SUNAT:** **PARCIAL** ([L310-316](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/components/NuevoProductoDialog.tsx#L310-L316): lista cerrada `UNIDAD`, `GALON`, `JUEGO`, `KILO`, `LITRO`, `PAQUETE`, pero no usa los códigos oficiales del catálogo 03 de SUNAT: `NIU`, `KGM`, `GLI`, `LTR`, etc.).
  * **Tipo (producto/servicio):** **PARCIAL** ([L176](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/components/NuevoProductoDialog.tsx#L176): solo existe una opción dentro de categoría llamada *"Servicios / M.O."*, no hay un discriminador estructural `tipo: PRODUCTO | SERVICIO`).
  * **Código de barras:** **NO** (no existe campo en el esquema ni en el diálogo).
  * **Afectación IGV:** **NO** (no hay selector Gravado 10, Exonerado 20, Inafecto 30).
  * **Precio con IGV:** **NO** (solo hay un único campo de precio, sin desglose ni especificación de si incluye o no IGV).
  * **Proveedor:** **NO** (no se asocia proveedor habitual en el formulario).

---

### 5. Validaciones: SKU único, precio > 0, alerta de precio < costo
* **Estado:** **PARCIAL**
* **Evidencia:**
  * **Precio > 0:** **SÍ**. Validado en [NuevoProductoDialog.tsx:L47](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/components/NuevoProductoDialog.tsx#L47) (`gt(0, 'El precio de venta debe ser mayor a S/ 0.00')`).
  * **SKU único:** **NO**. Ni en el esquema Zod ni en [erpStore.ts:L1232-1241](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/services/erp/erpStore.ts#L1232-L1241) se verifica si el SKU ya existe antes de agregarlo al catálogo.
  * **Alerta de precio < costo:** **NO**. No existe regla de refinamiento ni aviso visual si `precioVenta < precioCompra`; el formulario permite registrar pérdidas sin ninguna advertencia.

---

### 6. Eliminación: ¿borra o desactiva? ¿Qué pasa si el producto tiene movimientos?
* **Estado:** **NO**
* **Evidencia:**
  * En [productosService.ts:L1-15](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/services/productosService.ts#L1-L15) y [erpStore.ts:L1232-1241](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/services/erp/erpStore.ts#L1232-L1241) **no existen funciones de eliminar ni de desactivar productos**.
  * No existe lógica de integridad referencial que bloquee o alerte si un producto tiene movimientos en el Kardex.

---

### 7. ¿El stock se puede editar directamente o solo por movimientos?
* **Estado:** **SÍ** *(Cumple la regla de integridad de inventario)*
* **Evidencia:**
  * En [ProductosPage.tsx:L401-415](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L401-L415) la celda de stock es estrictamente de solo lectura.
  * El stock solo se establece al crear el producto ([NuevoProductoDialog.tsx:L48](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/components/NuevoProductoDialog.tsx#L48)) y posteriormente **solo varía mediante movimientos registrados en el Kardex**: ventas ([erpStore.ts:L935-958](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/services/erp/erpStore.ts#L935-L958)), compras ([erpStore.ts:L1037-1056](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/services/erp/erpStore.ts#L1037-L1056)), recepciones de mercadería ([erpStore.ts:L1311-1338](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/services/erp/erpStore.ts#L1311-L1338)), auditorías físicas ([erpStore.ts:L1343-1375](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/services/erp/erpStore.ts#L1343-L1375)) o ajustes manuales ([erpStore.ts:L1210-1229](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/services/erp/erpStore.ts#L1210-L1229)).

---

### 8. Kardex: ¿se registra cada entrada y salida con fecha, motivo, usuario y saldo?
* **Estado:** **SÍ**
* **Evidencia:**
  * Modelo en [inventario.types.ts:L10-22](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/types/inventario.types.ts#L10-L22): `MovimientoKardex` contiene explícitamente `fecha`, `tipo`, `motivo`, `usuario`, `cantidad`, `stockResultante` (saldo) y `referencia`.
  * Visualización en [InventarioPage.tsx:L358-430](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/pages/InventarioPage.tsx#L358-L430): La tabla y las tarjetas muestran fecha/hora con `formatDateTime`, badge de tipo, cantidad operada (+/-), saldo resultante en unidades, comprobante y responsable del movimiento.

---

### 9. Ajustes de stock con motivo obligatorio
* **Estado:** **SÍ**
* **Evidencia:**
  * En [NuevoMovimientoDialog.tsx:L43, L200-230](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/NuevoMovimientoDialog.tsx#L43): El campo motivo es obligatorio y se adapta según el tipo seleccionado (`COMPRA`, `VENTA`, `INVENTARIO_INICIAL`, `MERMA`, `TRANSFERENCIA`).
  * En [AuditoriaConteoDialog.tsx:L50, L208-228](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/AuditoriaConteoDialog.tsx#L50): En la auditoría física es obligatorio seleccionar el motivo del descuadre (*Conteo rutinario, Merma por rotura, Despacho no anotado, Ingreso no registrado*).

---

### 10. Stock por almacén/sede y transferencias entre sedes
* **Estado:** **PARCIAL**
* **Evidencia:**
  * **Sedes:** Existen sedes configuradas en [InventarioPage.tsx:L505-595](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/pages/InventarioPage.tsx#L505-L595) y [inventario.types.ts:L24-32](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/types/inventario.types.ts#L24-L32) (`AlmacenResumen`), pero **el stock en el producto es un único número global** ([productos.types.ts:L8](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/types/productos.types.ts#L8)), no está desglosado por almacén.
  * **Transferencias:** **NO**. Solo existe la palabra `TRANSFERENCIA` como opción de texto en el selector de motivos ([NuevoMovimientoDialog.tsx:L212, L219](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/NuevoMovimientoDialog.tsx#L212)), pero no hay un flujo pareado ni formulario de transferencia entre Sede Origen y Sede Destino.

---

### 11. Permisos por rol (¿el cajero ve costos?)
* **Estado:** **NO**
* **Evidencia:**
  * Aunque existen roles definidos en [auth.types.ts:L1](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/auth/types/auth.types.ts#L1) (`ADMINISTRADOR`, `CAJERO`, `SUPERVISOR`), en [ProductosPage.tsx:L365, L395](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L365) la columna `P. Costo` se renderiza incondicionalmente a cualquier usuario autenticado (`useAuth` ni siquiera está importado).
  * En [TablaControlStock.tsx:L134, L226-238](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/TablaControlStock.tsx#L134) el costo unitario y la inversión valorizada de stock también son visibles para todos los roles.

---

### 12. Costo: ¿se actualiza desde compras? ¿con qué método?
* **Estado:** **PARCIAL**
* **Evidencia:**
  * En el registro de compras estándar ([erpStore.ts:L1037-1056](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/services/erp/erpStore.ts#L1037-L1056)) **el costo del producto no se actualiza**.
  * En la recepción de mercadería ([erpStore.ts:L1316-1318](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/services/erp/erpStore.ts#L1316-L1318)) el costo sí se actualiza, pero mediante **sobrescritura directa por último precio de compra** (`prod.precioCompra = payload.costoUnitario`). **NO implementa Promedio Ponderado ni PEPS/FIFO** (métodos exigidos por SUNAT).

---

### 13. Historial de cambios de precio
* **Estado:** **NO**
* **Evidencia:**
  * En [productos.types.ts:L1-13](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/types/productos.types.ts#L1-L13) el producto solo almacena los valores escalares actuales de `precioCompra` y `precioVenta`.
  * No existe ninguna tabla, endpoint ni registro histórico de auditoría que guarde fecha, usuario ni precio anterior cuando un precio cambia.

---

### 14. Importar/exportar Excel o CSV
* **Estado:** **NO**
* **Evidencia:**
  * En [ProductosPage.tsx:L1-548](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L1-L548) e [InventarioPage.tsx:L1-620](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/pages/InventarioPage.tsx#L1-L620) no existe ningún botón o diálogo de importación masiva ni de descarga en Excel/CSV. Tampoco hay librerías de parseo o exportación instaladas en [package.json](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/package.json).

---

### 15. Toma de inventario (conteo físico)
* **Estado:** **SÍ**
* **Evidencia:**
  * Implementado de forma masiva en [ModuloAuditoriaFisica.tsx:L1-255](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/ModuloAuditoriaFisica.tsx#L1-L255): Muestra la relación de artículos por anaquel/ubicación, permite ingresar el recuento físico real, calcula faltantes/sobrantes y su valor monetario, y aplica el ajuste en Kardex con un botón.
  * Implementado de forma individual en [AuditoriaConteoDialog.tsx:L1-266](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/AuditoriaConteoDialog.tsx#L1-L266) (modal para ajustar un producto específico con motivo y observación).

---

### 16. Pluralización de unidades (galon/galones)
* **Estado:** **NO**
* **Evidencia:**
  * En [ProductosPage.tsx:L410, L484](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L410) se concatena ingenuamente una letra `s`: `{prod.unidadMedida.toLowerCase()}s`.
  * Esto genera textos gramaticalmente incorrectos como: `10 galons` (en vez de *galones*), `25 unidads` (en vez de *unidades*) y `5 paquetes` (correcto por casualidad). En [formatters.ts:L1-46](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/utils/formatters.ts#L1-L46) no existe función de pluralización.

---

## 2. Resumen Ejecutivo de Cumplimiento

| Aspecto Evaluado | Estado | Archivo Principal de Evidencia |
| :--- | :---: | :--- |
| 1. Acciones por fila (editar, ver kardex, ajustar, desactivar) | **PARCIAL** | [ProductosPage.tsx:361](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L361) / [TablaControlStock.tsx:241](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/TablaControlStock.tsx#L241) |
| 2. Paginación, conteo y ordenamiento | **PARCIAL** | [ProductosPage.tsx:23, 362, 496](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L23) |
| 3. Filtros por estado (bajo, agotado, inactivo) | **PARCIAL** | [ProductosPage.tsx:215](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L215) / [TablaControlStock.tsx:70](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/TablaControlStock.tsx#L70) |
| 4. Campos del formulario de producto | **PARCIAL** | [NuevoProductoDialog.tsx:33-57](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/components/NuevoProductoDialog.tsx#L33-L57) |
| 5. Validaciones (SKU único, precio > 0, precio < costo) | **PARCIAL** | [NuevoProductoDialog.tsx:47](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/components/NuevoProductoDialog.tsx#L47) / [erpStore.ts:1232](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/services/erp/erpStore.ts#L1232) |
| 6. Eliminación y regla con movimientos | **NO** | [productosService.ts:1-15](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/services/productosService.ts#L1-L15) |
| 7. Stock no editable directo, solo por Kardex | **SÍ** | [ProductosPage.tsx:401](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L401) / [erpStore.ts:935, 1037](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/services/erp/erpStore.ts#L935) |
| 8. Registro de Kardex completo (fecha, motivo, usuario, saldo) | **SÍ** | [inventario.types.ts:10-22](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/types/inventario.types.ts#L10-L22) / [InventarioPage.tsx:358](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/pages/InventarioPage.tsx#L358) |
| 9. Ajustes de stock con motivo obligatorio | **SÍ** | [NuevoMovimientoDialog.tsx:200](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/NuevoMovimientoDialog.tsx#L200) / [AuditoriaConteoDialog.tsx:208](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/AuditoriaConteoDialog.tsx#L208) |
| 10. Stock por almacén y transferencias entre sedes | **PARCIAL** | [inventario.types.ts:24, 46](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/types/inventario.types.ts#L24) / [productos.types.ts:8](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/types/productos.types.ts#L8) |
| 11. Permisos por rol (cajero no debe ver costos) | **NO** | [ProductosPage.tsx:365](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L365) / [TablaControlStock.tsx:134](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/TablaControlStock.tsx#L134) |
| 12. Actualización de costo desde compras y método valorizado | **PARCIAL** | [erpStore.ts:1037, 1316](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/services/erp/erpStore.ts#L1037) |
| 13. Historial de cambios de precio | **NO** | [productos.types.ts:1-13](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/types/productos.types.ts#L1-L13) |
| 14. Importar / exportar Excel o CSV | **NO** | [package.json](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/package.json) / [ProductosPage.tsx:1-548](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L1-L548) |
| 15. Toma de inventario físico (auditoría) | **SÍ** | [ModuloAuditoriaFisica.tsx:1-255](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/ModuloAuditoriaFisica.tsx#L1-L255) / [AuditoriaConteoDialog.tsx](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/AuditoriaConteoDialog.tsx) |
| 16. Pluralización correcta de unidades de medida | **NO** | [ProductosPage.tsx:410](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/productos/pages/ProductosPage.tsx#L410) / [formatters.ts:1-46](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/utils/formatters.ts#L1-L46) |

---

## 3. Matriz de Brechas Priorizada: Impacto, Esfuerzo y Capa Tecnológica

A continuación se detallan las funcionalidades faltantes o incompletas, ordenadas de mayor a menor impacto para la operación del ERP:

| Prioridad | Funcionalidad Faltante | Impacto | Esfuerzo | Capa Responsable | Detalle Técnico Requerido |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **1** | **Permisos por rol: Ocultar costos a Cajero** | **CRÍTICO** | **Bajo** | **Frontend + Spring Boot** | **Frontend:** Consumir `useAuth()`; renderizar columnas de Costo e Inversión solo si `user.rol !== 'CAJERO'`.<br>**Spring Boot:** En DTO de respuesta para cajeros, omitir o mandar en `null` los campos `precioCompra` y `valorizadoCosto` mediante `@JsonView` o DTO diferenciado. |
| **2** | **Acciones de edición y desactivación de productos** | **CRÍTICO** | **Medio** | **Frontend + Spring Boot** | **Frontend:** Menú `DropdownMenu` por fila en `ProductosPage` con *"Editar"*, *"Ver Kardex"* y *"Desactivar"*.<br>**Spring Boot:** Endpoints `PUT /api/v1/productos/{id}` y `PATCH /api/v1/productos/{id}/estado`. |
| **3** | **Eliminación lógica e integridad con Kardex** | **CRÍTICO** | **Medio** | **Frontend + Spring Boot** | **Spring Boot:** Entidad `Producto` con soft delete (`@SQLDelete`, campo `activo`). Validar en service: si tiene registros en tabla `movimientos_kardex`, rechazar `DELETE` físico con HTTP 409 y sugerir desactivación. |
| **4** | **Stock multi-almacén real y transferencias entre sedes** | **CRÍTICO** | **Alto** | **Frontend + Spring Boot** | **Spring Boot:** Tabla intermedia `stock_almacen(producto_id, almacen_id, cantidad)`. Endpoint transaccional `POST /api/v1/inventario/transferencias` que descuente de origen y aumente en destino en una sola transacción `@Transactional`.<br>**Frontend:** Selector de stock por sede y diálogo de transferencias. |
| **5** | **Validación de SKU único** | **ALTO** | **Bajo** | **Frontend + Spring Boot** | **Spring Boot:** Restricción `@Column(unique = true)` en entidad JPA y validación en service.<br>**Frontend:** Validación asíncrona en formulario o en `onBlur` que informe si el SKU ya existe. |
| **6** | **Método de costeo oficial (Promedio Ponderado - CPP)** | **ALTO** | **Medio** | **Spring Boot** | **Spring Boot:** Al registrar compras o recepciones, calcular nuevo costo unitario: `((StockActual * CostoActual) + (CantIngreso * CostoIngreso)) / (StockTotal)`. Actualizar automáticamente `precio_compra` del producto. |
| **7** | **Campos tributarios SUNAT (Código barras, Tipo, IGV)** | **ALTO** | **Medio** | **Frontend + Spring Boot** | **Frontend:** Inputs para código de barras, selector de tipo (Producto / Servicio) y tipo de afectación IGV (Gravado / Exonerado / Inafecto).<br>**Spring Boot:** Campos en tabla `productos` requeridos para facturación electrónica (UBL 2.1). |
| **8** | **Alerta precio de venta < precio de costo** | **MEDIO** | **Bajo** | **Solo Frontend** | **Frontend:** Refinamiento Zod en `NuevoProductoDialog.tsx`: `.refine(data => data.precioVenta >= data.precioCompra, { message: 'El precio de venta es menor al costo', path: ['precioVenta'] })` o banner de advertencia visual. |
| **9** | **Filtros por estado en Catálogo de Productos** | **MEDIO** | **Bajo** | **Solo Frontend** | **Frontend:** Agregar botones segmentados en `ProductosPage.tsx`: *"Todos"*, *"Stock bajo"*, *"Agotados"*, *"Inactivos"*. |
| **10** | **Ordenamiento interactivo por columnas** | **MEDIO** | **Bajo** | **Solo Frontend** | **Frontend:** Estado local `sortField` y `sortOrder` en tablas de Productos y Kardex para ordenar por SKU, Nombre, Costo, PVP y Stock con un clic en la cabecera. |
| **11** | **Importar y Exportar a Excel / CSV** | **MEDIO** | **Medio** | **Frontend + Spring Boot** | **Frontend:** Botones *"Descargar Excel"* y modal para subir archivo `.xlsx` / `.csv`.<br>**Spring Boot:** Endpoint de streaming `GET /api/v1/productos/exportar` (Apache POI) y lectura masiva `POST /api/v1/productos/importar`. |
| **12** | **Historial de cambios de precios** | **MEDIO** | **Medio** | **Frontend + Spring Boot** | **Spring Boot:** Tabla `historial_precios(id, producto_id, precio_compra_ant, precio_compra_nuevo, precio_venta_ant, precio_venta_nuevo, usuario_id, fecha)` disparado por listener JPA `@EntityListeners` o servicio.<br>**Frontend:** Pestaña o modal de auditoría de precios. |
| **13** | **Pluralización gramatical de unidades** | **BAJO** | **Bajo** | **Solo Frontend** | **Frontend:** Función `pluralizeUnit(qty, unit)` en `formatters.ts` que mapee: `GALON` -> `galón / galones`, `UNIDAD` -> `unidad / unidades`, `KILO` -> `kilo / kilos`. |