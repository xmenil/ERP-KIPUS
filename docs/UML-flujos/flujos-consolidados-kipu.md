# KIPU'S ERP — Flujos Operativos Unificados para Servidor UML

Este documento contiene los **flujos operativos reales** de la aplicación **KIPU'S ERP**, estructurados a partir de la interfaz visible (pantalla de Inicio, panel general, botones de acción rápida y menú de navegación). 

Cada flujo está diseñado con **pasos cortos, precisos y cronológicos**, unificando las funciones que comparten los roles (Dueño/Admin, Cajero y Almacenero) para **evitar duplicidades**.

Los diagramas están redactados en **PlantUML (`@startuml ... @enduml`)** y en **Mermaid**, listos para ser procesados y ejecutados en cualquier servidor UML (PlantUML Server, Kroki, Mermaid Live Editor, extensiones de IDE o pipelines CI/CD).

---

## 1. Matriz de Flujos Unificados por Rol

Para no duplicar procesos que realizan múltiples usuarios, los flujos se han consolidado según su ejecución real en la interfaz:

| Flujo | Nombre del Flujo | Roles que lo Usan | Acceso desde la Interfaz |
| :---: | :--- | :--- | :--- |
| **F01** | **Monitoreo Ejecutivo y Panel de Inicio** | Admin, Cajero, Almacén | Menú `Inicio` / Dashboard |
| **F02** | **Venta Completa en Mostrador (POS)** | Cajero, Admin | Botón `[+ Registrar venta]` o `Ventas y caja` |
| **F03** | **Ciclo de Turno y Cuadre de Caja** | Cajero, Admin | Botón `[$ Cuadre de caja]` o link en tarjeta |
| **F04** | **Cotizaciones, Pedidos y Devoluciones** | Cajero, Admin | Pestañas dentro de `Ventas y caja` |
| **F05** | **Alta de Producto con Escáner y Catálogo** | Almacenero, Admin | Menú `Inventario` -> `[Nuevo producto]` / `[Escanear]` |
| **F06** | **Kardex Continuo y Alertas de Stock** | Almacenero, Admin | Menú `Inventario` -> `Entradas y Salidas` / Tarjeta Inicio |
| **F07** | **Conteo Físico y Ajuste de Mermas** | Almacenero, Admin | Menú `Inventario` -> `Inventario físico` / `Ajustes` |
| **F08** | **Reabastecimiento Inteligente de Compras** | Admin, Almacenero | Menú `Compras` -> `[Sugerencias]` o Alerta en Inicio |
| **F09** | **Recepción de Mercadería de Proveedores** | Almacenero, Admin | Menú `Compras` -> `[Recepción de mercancía]` |
| **F10** | **Gastos Operativos y Gestión de Clientes** | Admin (ambos), Cajero (solo clientes) | Menú `Gastos y clientes` (o `Clientes` en cajero) |
| **F11** | **Liquidación SUNAT, Reportes y KIPU'S IA** | Admin (completo), Almacén (solo stock) | Menú `Reportes` o Botón `[* KIPU'S IA]` |

---

## 2. Detalle de Flujos: Pasos Cortos y Diagramas UML

---

### FLUJO 01: Monitoreo Ejecutivo y Panel de Inicio
* **Roles:** Dueño / Administrador (visión 360), Cajero (resumen de ventas/turno), Almacenero (resumen de stock y recepciones).
* **Pasos Cortos y Precisos:**
  1. **Acceso:** El usuario ingresa al sistema y se posiciona en `Inicio`.
  2. **Lectura de KPIs:**
     - Revisa ventas del día y variación porcentual (ej. `S/ 308.60 +12.5%`).
     - Revisa dinero en caja chica y estado del turno (`S/ 640.00` - Caja abierta).
     - Revisa llamadas de atención: productos bajo stock crítico y cobros pendientes.
  3. **Visualización de Tendencia:** Examina la gráfica de barras de ventas vs gastos de los últimos 7 días.
  4. **Disparo de Acción Rápida:**
     - Da clic en `[Actualizar]` para refrescar datos.
     - Da clic en `[$ Cuadre de caja]` para operar gaveta (va a `/ventas?tab=caja`).
     - Da clic en `[+ Registrar venta]` para vender en mostrador (va a `/ventas`).
     - Da clic en `[* KIPU'S IA]` para consultar el estado del negocio por voz o texto.

#### Código UML (PlantUML)
```plantuml
@startuml
skinparam handwritten false
skinparam monochrome true
skinparam packageStyle rectangle
skinparam shadowing false

title F01 - Monitoreo Ejecutivo y Panel de Inicio

start
:Usuario abre KIPU'S ERP en pantalla "Inicio";
:Sistema carga datos en tiempo real desde erpStore;
fork
  :Visualizar KPIs (Ventas hoy, Saldo caja chica, Alertas críticas);
fork again
  :Analizar gráfica comparativa (Ventas vs Gastos 7 días);
fork again
  :Revisar panel de reabastecimiento (Artículos bajo stock);
end fork

if (¿Qué acción requiere el usuario?) then ([Registrar Venta])
  :Clic en botón púrpura "+ Registrar venta";
  :Redirigir a POS Terminal (/ventas);
  detach
elseif ([Cuadre de Caja]) then
  :Clic en botón "$ Cuadre de caja";
  :Redirigir a módulo Caja (/ventas?tab=caja);
  detach
elseif ([KIPU'S IA]) then
  :Clic en botón "KIPU'S IA";
  :Abrir diálogo inteligente de asistencia;
  detach
elseif ([Ver Inventario]) then
  :Clic en enlace "Ver inventario ->";
  :Redirigir a Catálogo filtrado por Stock Bajo (/inventario);
  detach
else ([Actualizar])
  :Clic en "Actualizar";
  :Refrescar métricas en pantalla;
  stop
endif
@enduml
```

#### Código Mermaid
```mermaid
flowchart TD
    A["Usuario en pantalla 'Inicio'"] --> B["Cargar métricas en tiempo real"]
    B --> C["1. KPIs: Ventas hoy, Caja chica, Alertas"]
    B --> D["2. Gráfico: Ventas vs Gastos 7 días"]
    B --> E["3. Alertas: Reabastecimiento de stock"]
    C & D & E --> F{"Seleccionar acción rápida"}
    F -- "[+ Registrar venta]" --> G["Ir a Terminal POS (/ventas)"]
    F -- "[$ Cuadre de caja]" --> H["Ir a Cuadre de Caja (/ventas?tab=caja)"]
    F -- "[* KIPU'S IA]" --> I["Abrir Asistente Inteligente"]
    F -- "[Ver inventario ->]" --> J["Ir a Inventario filtrado (/inventario)"]
    F -- "[Actualizar]" --> K["Refrescar indicadores en pantalla"]
```

---

### FLUJO 02: Venta Completa en Mostrador (POS)
* **Roles:** Cajero (operador principal), Dueño/Administrador (apoyo/supervisión).
* **Pasos Cortos y Precisos:**
  1. **Disparo:** Clic en `[+ Registrar venta]` desde Inicio o acceso a `Ventas y caja`.
  2. **Ingreso de Producto:** 
     - Pistolear código con lector USB, enfocar con cámara del celular/PC, dictar por voz *"Agrega 2 unidades de arroz"* o buscar por nombre/SKU.
  3. **Validación de Stock:** El sistema valida existencias inmediatas; si hay stock, suma al carrito con su precio unitario.
  4. **Datos de Venta:**
     - Selecciona comprobante: `Boleta`, `Factura` (exige RUC) o `Nota de Venta`.
     - Selecciona o busca cliente (Consumidor final o cliente con DNI/RUC).
  5. **Cobro:** 
     - Elige medio de pago: `Efectivo`, `Yape`, `Plin`, `Tarjeta` o `Mixto`.
     - Ingresa monto entregado por el cliente y el sistema calcula el vuelto exacto.
  6. **Confirmación y Cierre:** Clic en `[Cobrar e Imprimir]`.
  7. **Impacto en el Sistema:**
     - Genera correlativo oficial (ej. `B001-000502`).
     - Descuenta automáticamente el stock en catálogo y genera salida en Kardex.
     - Suma el dinero en la caja activa (efectivo o billetera).
     - Actualiza los KPIs de Inicio (`Ventas de hoy`) al instante.
     - Imprime ticket térmico y limpia la pantalla para la siguiente venta.

#### Código UML (PlantUML)
```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false

title F02 - Venta Completa en Mostrador (POS)

start
:Clic en "+ Registrar venta";
:Cargar terminal POS con catálogo y carrito vacío;

repeat
  :Capturar producto (Lector de barras, Cámara, Voz o Buscador);
  if (¿Producto existe y stock > 0?) then (Sí)
    :Agregar producto a la lista del carrito;
    :Calcular subtotal, descuento e IGV (18%);
  else (No)
    :Mostrar alerta sonora y visual "Sin existencias";
  endif
repeat while (¿Desea ingresar más productos?) is (Sí)
->No;

:Seleccionar comprobante (Boleta, Factura o Nota de venta);
:Identificar cliente (Consumidor final, DNI o RUC);
:Seleccionar método de pago (Efectivo, Yape, Plin, Tarjeta, Mixto);
:Digitar monto recibido y calcular vuelto;
:Clic en "Cobrar e Imprimir";

partition "Transacción Atómica (erpStore)" {
  :Crear registro de Venta con serie correlativa;
  :Descontar stock del producto en catálogo;
  :Generar movimiento Kardex (SALIDA - VENTA);
  :Ingresar dinero en movimientos de Caja activa;
  :Acumular compra al cliente;
  :Llamar notify() para refrescar Dashboard en tiempo real;
}

:Mostrar modal de éxito con ticket imprimible;
:Limpiar terminal POS para la siguiente venta;
stop
@enduml
```

#### Código Mermaid
```mermaid
flowchart TD
    A["Clic en '+ Registrar venta'"] --> B["Escanear producto (Lector, Cámara, Voz o Teclado)"]
    B --> C{"¿Stock disponible?"}
    C -- "No" --> D["Alerta: Producto sin stock"]
    C -- "Sí" --> E["Sumar ítem al Carrito"]
    E --> F{"¿Más productos?"}
    F -- "Sí" --> B
    F -- "No" --> G["Seleccionar Comprobante (Boleta / Factura / Nota)"]
    G --> H["Ingresar Cliente (Consumidor Final, DNI o RUC)"]
    H --> I["Elegir Pago (Efectivo, Yape, Plin, Tarjeta, Mixto)"]
    I --> J["Ingresar monto y calcular vuelto"]
    J --> K["Clic en 'Cobrar e Imprimir'"]
    K --> L["erpStore ejecuta: Venta + Descuento Stock + Kardex + Ingreso Caja"]
    L --> M["Imprimir Ticket térmico y refrescar KPIs de Inicio"]
```

---

### FLUJO 03: Ciclo de Turno y Cuadre de Caja
* **Roles:** Cajero (opera su turno), Dueño/Administrador (audita y controla todas las cajas).
* **Pasos Cortos y Precisos:**
  1. **Apertura:** Clic en `[$ Cuadre de caja]` -> Si la caja está cerrada, se ingresa el monto inicial de sencillo (ej. `S/ 150.00`) y se abre el turno.
  2. **Operación Diaria:** Cada venta en mostrador o egreso manual registrado suma o resta en tiempo real en la gaveta activa.
  3. **Arqueo Físico:** Al auditar o a mitad de turno, se cuentan los billetes y monedas por denominación; el sistema suma el total físico y lo compara contra el teórico.
  4. **Cierre de Turno:**
     - Al terminar el día, el cajero cuenta todo el efectivo en gaveta y digita el monto real contado.
     - El sistema calcula: `Diferencia = Saldo Contado - Saldo Esperado`.
     - Si coincide: estado `CUADRADA`. Si no: estado `CON_DIFERENCIA` (exige justificación obligatoria).
  5. **Finalización:** Se cierra la caja, se genera el reporte de cierre y se bloquean nuevas ventas en esa caja hasta el siguiente turno.

#### Código UML (PlantUML)
```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false

title F03 - Ciclo de Turno y Cuadre de Caja

start
:Clic en "$ Cuadre de caja";

if (¿Caja está abierta?) then (No)
  :Abrir diálogo de Apertura;
  :Ingresar fondo inicial de sencillo (ej. S/ 150.00);
  :Guardar apertura -> Estado pasa a ABIERTA;
else (Sí)
  :Mostrar resumen activo de caja;
endif

partition "Operación de Turno" {
  :Ventas POS ingresan efectivo/digital automáticamente;
  if (¿Requiere egreso menor o retiro?) then (Sí)
    :Registrar movimiento manual (Concepto y Monto);
    :Descontar del saldo esperado de gaveta;
  endif
  if (¿Desea realizar Arqueo sorpresivo?) then (Sí)
    :Desglosar monedas y billetes por denominación;
    :Verificar cuadre previo y asentar en auditoría;
  endif
}

:Iniciar "Cierre de Caja";
:Cajero ingresa monto físico contado de la gaveta;
:Sistema calcula Diferencia = Contado - Esperado;

if (Diferencia == 0?) then (Sí)
  :Estado: CUADRADA;
else (No)
  :Estado: CON DIFERENCIA (Faltante o Sobrante);
  :Ingresar motivo y justificación obligatoria;
endif

:Confirmar Cierre de Caja;
:Estado pasa a CERRADA;
:Guardar histórico en auditoriaCaja y emitir resumen;
stop
@enduml
```

#### Código Mermaid
```mermaid
flowchart TD
    A["Clic en '$ Cuadre de caja'"] --> B{"¿Caja abierta?"}
    B -- "No" --> C["Ingresar saldo inicial de sencillo (ej. S/ 150) -> Abrir Caja"]
    B -- "Sí" --> D["Turno activo: Operación continua"]
    C --> D
    D --> E["Cobros automáticos de ventas POS + Egresos manuales"]
    E --> F["Fin de turno: Clic en 'Cerrar Caja'"]
    F --> G["Cajero cuenta efectivo en gaveta y digita monto real"]
    G --> H["Calcular Diferencia = Saldo Contado - Saldo Esperado"]
    H --> I{"¿Diferencia === 0?"}
    I -- "Sí" --> J["Cierre 'CUADRADA'"]
    I -- "No" --> K["Cierre 'CON DIFERENCIA' (Justificación obligatoria)"]
    J --> L["Caja pasa a 'CERRADA' y emite reporte final"]
    K --> L
```

---

### FLUJO 04: Cotizaciones, Pedidos y Devoluciones
* **Roles:** Cajero, Dueño/Administrador.
* **Pasos Cortos y Precisos:**
  1. **Cotización:** Se crea proforma con precios pactados sin tocar stock ni dinero. Si el cliente la aprueba, se da clic en `[Convertir a Venta]` y pasa automáticamente al carrito del POS.
  2. **Devolución / Anulación:** 
     - Se ubica la venta en el historial por su correlativo (ej. `B001-000490`).
     - Se define si el producto regresa en buen estado al almacén (`Retorna a inventario: Sí` suma unidades al stock).
     - Se define si se entrega dinero en efectivo (`Afecta caja: Sí` genera un egreso en la gaveta activa).
     - Se asienta el motivo y se genera el Kardex de ajuste correspondiente.

#### Código UML (PlantUML)
```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false

title F04 - Cotizaciones, Pedidos y Devoluciones

start
if (¿Tipo de gestión comercial?) then (Cotización / Pedido)
  :Crear proforma con cliente y lista de ítems;
  :Guardar con código único (COT-XXXX);
  :Entregar presupuesto al cliente;
  if (¿Cliente aprueba compra?) then (Sí)
    :Clic en "Convertir a Venta";
    :Inyectar ítems directamente al POS (Flujo F02);
    :Comprobante emitido descuenta stock y cobra;
  else (No)
    :Marcar como Vencida o Cancelada;
  endif
else (Devolución / Anulación de Venta)
  :Buscar comprobante original en Historial;
  :Ingresar motivo obligatorio de la solicitud;
  if (¿Mercadería en buen estado para reventa?) then (Sí)
    :Marcar "Retorna a stock" -> Suma unidades en catálogo;
    :Generar asiento Kardex (ENTRADA - AUDITORIA);
  else (No)
    :Marcar "Desecho / Merma" -> No suma existencias;
  endif
  if (¿Se devuelve dinero en efectivo?) then (Sí)
    :Registrar EGRESO en movimientos de caja activa;
    :Restar del saldo de la gaveta física;
  else (No)
    :Emitir saldo a favor o nota interna;
  endif
endif
stop
@enduml
```

---

### FLUJO 05: Alta de Producto con Escáner y Catálogo
* **Roles:** Almacenero (gestión operativa), Dueño/Administrador (control total y precios).
* **Pasos Cortos y Precisos:**
  1. **Acceso:** Ir a `Inventario` y dar clic en `[Nuevo producto]` o `[Escanear código]`.
  2. **Escaneo de Código:** Pistolear el código del empaque con lector USB o enfocarlo con la cámara.
  3. **Control de Duplicados:** Si el código ya existe, el sistema muestra el producto encontrado y ofrece editarlo.
  4. **Datos Maestros:** Se ingresa Nombre comercial, Categoría, Unidad SUNAT, Precio de Compra (Costo), Precio de Venta (validando que Venta > Costo) y Stock Mínimo de alerta.
  5. **Guardado e Inicialización:** Al guardar, se graba en el catálogo; si tiene existencias iniciales, se crea la fila inicial en Kardex automáticamente.

#### Código UML (PlantUML)
```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false

title F05 - Alta de Producto con Escáner y Catálogo

start
:Almacenero o Admin abre "Inventario";
:Clic en "Nuevo producto" o "Escanear";
:Capturar código (Lector de barras físico, Cámara web o Teclado);
:Normalizar código preservando ceros a la izquierda;

if (¿Código o SKU ya existe en catálogo?) then (Sí)
  :Mostrar aviso: "Producto ya registrado";
  :Cargar datos existentes para permitir edición;
else (No)
  :Completar formulario de alta de producto;
  :Ingresar Nombre, Categoría y Unidad de medida;
  :Ingresar Precio Compra (Costo) y Precio Venta;
  
  if (Precio Venta <= Precio Compra?) then (Sí)
    :Alerta: "El precio de venta debe superar al costo";
    stop
  endif
  
  :Definir Stock Mínimo de alerta y Ubicación física;
  :Clic en "Guardar producto";
  :erpStore.crearProducto() agrega al catálogo activo;
  
  if (Stock inicial > 0?) then (Sí)
    :Generar movimiento Kardex (ENTRADA - INVENTARIO_INICIAL);
  endif
endif
:Mostrar confirmación Toast y actualizar catálogo;
stop
@enduml
```

#### Código Mermaid
```mermaid
flowchart TD
    A["Ir a 'Inventario' -> Clic en 'Nuevo producto'"] --> B["Pistolear código de barras o escanear con cámara"]
    B --> C{"¿Código o SKU ya existe?"}
    C -- "Sí" --> D["Mostrar producto existente y permitir edición"]
    C -- "No" --> E["Completar datos: Nombre, Categoría, Unidad"]
    E --> F["Ingresar Costo de Compra y Precio de Venta"]
    F --> G{"¿Precio Venta > Costo?"}
    G -- "No" --> H["Error: Precio de venta debe superar costo"]
    G -- "Sí" --> I["Definir Stock Mínimo para alertas"]
    I --> J["Guardar producto en catálogo"]
    J --> K["Si stock inicial > 0, asentar Kardex inicial"]
```

---

### FLUJO 06: Kardex Continuo y Alertas de Stock
* **Roles:** Almacenero, Dueño/Administrador.
* **Pasos Cortos y Precisos:**
  1. **Disparo Transaccional:** Cada venta, compra, devolución o ajuste genera automáticamente una fila en Kardex.
  2. **Registro Inmutable:** Guarda Fecha/Hora, SKU, Producto, Tipo (`ENTRADA`/`SALIDA`/`AJUSTE`), Cantidad, Stock Resultante, Documento de Referencia y Usuario.
  3. **Evaluación de Niveles:** El sistema evalúa el nuevo saldo contra `stockMinimo`:
     - Si `Stock === 0`: Marca en ROJO (`AGOTADO`).
     - Si `Stock <= Mínimo`: Marca en AMARILLO (`STOCK BAJO`).
     - Si `Stock > Mínimo`: Marca en VERDE (`SUFICIENTE`).
  4. **Impacto en Inicio:** Se alimenta la tarjeta `"Atención inmediata"` y `"Alertas de reabastecimiento"` que se ven en la pantalla principal.

#### Código UML (PlantUML)
```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false

title F06 - Kardex Continuo y Alertas de Stock

start
:Ocurre evento transaccional (Venta, Compra, Ajuste, Devolución);
:Calcular Stock Resultante = Stock Previo +/- Cantidad operada;
:Insertar registro inmutable en movimientosKardex con usuario y referencia;

if (Stock Resultante == 0?) then (Sí)
  :Clasificación: "AGOTADO" (Rojo);
  :Disparar alerta urgente en tarjeta de Inicio;
elseif (Stock Resultante <= Stock Mínimo?) then (Sí)
  :Clasificación: "STOCK BAJO" (Amarillo);
  :Enviar a lista de Reabastecimiento pendiente;
else (No)
  :Clasificación: "SUFICIENTE" (Verde);
  :Stock en orden;
endif

:Actualizar indicadores en Inicio y catálogo;
stop
@enduml
```

---

### FLUJO 07: Conteo Físico y Ajuste de Mermas
* **Roles:** Almacenero (conteo en estantería), Dueño/Administrador (aprobación de mermas).
* **Pasos Cortos y Precisos:**
  1. **Toma Física:** El almacenero abre `Inventario físico`, cuenta las unidades reales en el estante y digita el valor.
  2. **Cálculo de Variación:** El sistema calcula: `Diferencia = Stock Físico - Stock Sistema`.
  3. **Justificación:** Si hay faltante, selecciona motivo obligatorio (`MERMA`, `VENCIMIENTO`, `ROTURA` o `PÉRDIDA`) con detalle. Si hay sobrante, selecciona `SOBRANTE / INGRESO NO REGISTRADO`.
  4. **Ajuste:** Clic en `[Aplicar ajustes físicos]`. El stock se actualiza al valor real y se asienta el Kardex con motivo `AUDITORIA_CONTEO`.

#### Código UML (PlantUML)
```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false

title F07 - Conteo Físico y Ajuste de Mermas

start
:Almacenero abre pestaña "Inventario físico";
:Seleccionar anaquel o categoría a auditar;
:Digitar stock físico real contado en el estante;
:Calcular Diferencia = Stock Físico - Stock en Sistema;

if (Diferencia == 0?) then (Sí)
  :Sin descuadre (Stock exacto);
  stop
elseif (Diferencia < 0?) then (Faltante)
  :Detectada Merma o Pérdida;
  :Seleccionar motivo obligatorio (Rotura, Vencimiento, Pérdida);
else (Sobrante)
  :Detectado Sobrante;
  :Seleccionar motivo obligatorio (Ingreso omitido);
endif

:Ingresar observación obligatoria del auditor;
:Clic en "Aplicar ajustes físicos";
:erpStore actualiza stock de catálogo al valor real;
:Generar registro en Ajustes y movimiento Kardex AUDITORIA_CONTEO;
:Refrescar valorizado total del inventario;
stop
@enduml
```

---

### FLUJO 08: Reabastecimiento Inteligente de Compras
* **Roles:** Dueño/Administrador (decisión de compra), Almacenero (consulta y sugerencia).
* **Pasos Cortos y Precisos:**
  1. **Disparo:** Clic en la tarjeta de Inicio `[Alertas de reabastecimiento -> Ver inventario]` o en `Compras -> Sugerencias`.
  2. **Cálculo de Demanda:** El motor analiza las ventas de los últimos 30 días y el stock actual.
  3. **Detección de Quiebre:** Calcula la velocidad diaria de venta y los días de cobertura restantes.
  4. **Recomendación:** Sugiere comprar unidades suficientes para 30 días de cobertura, asignando al proveedor habitual y estimando el monto en soles.
  5. **Generación de Orden:** El usuario selecciona los productos deseados y da clic en `[Generar Orden de Compra]`.

#### Código UML (PlantUML)
```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false

title F08 - Reabastecimiento Inteligente de Compras

start
:Usuario abre "Sugerencias de Compra" (desde Inicio o Compras);
:Motor analiza ventas de últimos 30 días y existencias actuales;
:Filtrar artículos con Stock === 0 o Stock <= Mínimo;
:Calcular velocidad de venta diaria = unidades / 30;
:Calcular días de cobertura = stockActual / velocidadDiaria;
:Calcular cantidad óptima para 30 días de cobertura;
:Asignar proveedor habitual y calcular inversión estimada;
:Mostrar matriz priorizada (Crítica, Alta, Media);
:Usuario revisa, ajusta cantidades y marca casillas;
:Clic en "Generar Orden de Compra";
:Crear orden en estado BORRADOR agrupada por proveedor;
stop
@enduml
```

---

### FLUJO 09: Recepción de Mercadería de Proveedores
* **Roles:** Almacenero (recepción física en muelle), Dueño/Administrador (control de facturación).
* **Pasos Cortos y Precisos:**
  1. **Llegada:** El proveedor entrega mercadería con Guía de Remisión o Factura física.
  2. **Apertura:** El almacenero abre `Compras y proveedores` -> `[Recepción de mercancía]`.
  3. **Verificación:** Digita el número de comprobante físico, las cantidades recibidas y el costo de compra unitario.
  4. **Confirmación:** Clic en `[Confirmar recepción e ingresar a stock]`.
  5. **Impacto:** Las existencias aumentan al instante en catálogo, se actualiza el costo de adquisición si varió, se genera la entrada en Kardex (`ENTRADA - COMPRA`) y la orden pasa a `RECIBIDA`.

#### Código UML (PlantUML)
```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false

title F09 - Recepción de Mercadería de Proveedores

start
:Llega camión de proveedor con mercadería;
:Almacenero abre diálogo "Recepción de mercancía";
:Ingresar número de Guía de Remisión o Factura del proveedor;
:Verificar bultos físicos entregados;
:Digitar cantidad recibida y costo unitario de compra;

if (Cantidad > 0 y Costo > 0?) then (Sí)
  :Clic en "Confirmar recepción e ingresar a stock";
  partition "erpStore.recepcionarMercancia()" {
    :Aumentar stock disponible en catálogo;
    if (¿Costo unitario cambió?) then (Sí)
      :Actualizar precioCompra del producto en catálogo;
    endif
    :Insertar fila Kardex (ENTRADA - COMPRA con Guía);
    :Actualizar estado de orden de compra a RECIBIDA;
  }
  :Notificar éxito y refrescar valorizado de almacén;
else (No)
  :Alerta: "Cantidades y costos deben ser válidos";
endif
stop
@enduml
```

---

### FLUJO 10: Gastos Operativos y Gestión de Clientes
* **Roles:** Dueño/Administrador (gastos y clientes), Cajero (consulta y registro básico de clientes).
* **Pasos Cortos y Precisos:**
  1. **Gastos Operativos (Admin):**
     - Clic en `[Nuevo Gasto]` en `Gastos y clientes`.
     - Elige categoría: Alquiler, Servicios, Flete, Personal, Mantenimiento.
     - Si se paga con dinero de la tienda: marca `Afectar caja chica: Sí` (resta efectivo de la gaveta activa). Si es por transferencia, no toca la gaveta.
     - El gasto resta inmediatamente de la Utilidad Neta en los reportes y en el gráfico de Inicio.
  2. **Clientes (Cajero y Admin):**
     - Registro o consulta con DNI o RUC (con validación de formato).
     - Acumula récord de compras para fidelización y crédito comercial.

#### Código UML (PlantUML)
```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false

title F10 - Gastos Operativos y Gestión de Clientes

start
if (¿Qué operación se realiza?) then (Registrar Gasto Operativo)
  :Admin abre "Gastos y clientes" -> Clic en "Nuevo Gasto";
  :Seleccionar categoría (Alquiler, Servicios, Flete, Sueldos);
  :Digitar monto, concepto y comprobante;
  if (¿Se paga con efectivo de caja chica?) then (Sí)
    :Marcar "Afectar caja chica";
    :Registrar EGRESO en movimientos de caja;
    :Restar del saldo de efectivo de gaveta;
  else (No)
    :Pago por transferencia bancaria;
    :No descuenta efectivo de la gaveta;
  endif
  :Guardar gasto -> Restar en Utilidad Neta mensual;
  :Actualizar barra roja de "Gastos" en gráfico de Inicio;
else (Gestión de Clientes)
  :Cajero o Admin abre diálogo "Nuevo Cliente";
  :Digitar DNI (8 dígitos) o RUC (11 dígitos) y Razón Social;
  :Guardar cliente en directorio activo;
  :Disponible de inmediato para autocompletar en POS;
endif
stop
@enduml
```

---

### FLUJO 11: Liquidación SUNAT, Reportes y KIPU'S IA
* **Roles:** Dueño/Administrador (acceso completo), Almacenero (solo reporte de inventario valorizado).
* **Pasos Cortos y Precisos:**
  1. **Reportes Financieros:** Calcula en tiempo real:
     $$\text{Ventas Netas} - \text{Costo de Ventas} = \text{Utilidad Bruta}$$
     $$\text{Utilidad Bruta} - \text{Gastos Operativos} = \text{Utilidad Neta}$$
  2. **Liquidación SUNAT:** Cruza IGV cobrado en Boletas/Facturas (Débito) vs IGV pagado en compras con Factura (Crédito fiscal) para estimar el impuesto a pagar.
  3. **KIPU'S IA:** 
     - Clic en botón `[* KIPU'S IA]` desde Inicio o Reportes.
     - Consulta por voz o texto (ej. *"¿Cómo va el negocio hoy?"* o *"¿Tengo stock de arroz?"*).
     - La IA extrae métricas de `erpStore` y responde con tarjetas analíticas y botones de redirección directa a la pantalla con problemas.

#### Código UML (PlantUML)
```plantuml
@startuml
skinparam monochrome true
skinparam shadowing false

title F11 - Liquidación SUNAT, Reportes y KIPU'S IA

start
if (¿Canal de consulta?) then (Módulo Reportes)
  :Admin abre módulo "Reportes";
  fork
    :Pestaña Financiera: Utilidad Bruta y Utilidad Neta en cascada;
  fork again
    :Pestaña SUNAT: IGV Débito (Ventas) vs IGV Crédito (Compras);
    :Calcular impuesto estimado a pagar ante SUNAT;
  fork again
    :Pestaña Inventario: Stock valorizado a costo y precio venta;
    :Exportar balance consolidado en archivo CSV;
  end fork
else (Asistente KIPU'S IA)
  :Clic en botón "KIPU'S IA" (en Inicio o Reportes);
  :Dictar consulta por voz o escribir en el chat;
  :Motor heurístico analiza estado en tiempo real:;
  :Efectivo en gaveta, ventas del turno, compras y stock crítico;
  :Devolver diagnóstico en lenguaje natural con métricas;
  :Mostrar botones de acción directa a los módulos;
endif
stop
@enduml
```

---

## 3. Guía de Ejecución en Servidor UML

Para ejecutar y compilar estos diagramas en cualquier entorno o servidor:

1. **En Servidor PlantUML Oficial o Local:**
   - Copiar el bloque entre `@startuml` y `@enduml` y pegarlo en `http://www.plantuml.com/plantuml` o en tu contenedor Docker local (`docker run -d -p 8080:8080 plantuml/plantuml-server`).
   - También puedes utilizar los archivos individuales `.puml` generados en esta carpeta `docs/UML-flujos/`.

2. **En Mermaid Live Editor / GitHub:**
   - Los bloques de código ````mermaid```` renderizan directamente en GitHub, GitLab, Notion, extensiones de VS Code o en `https://mermaid.live`.

3. **Integración con Herramientas de Modelado:**
   - Compatibles con PlantUML CLI: `plantuml -tpng *.puml` genera las imágenes PNG de todos los flujos de forma automática.

