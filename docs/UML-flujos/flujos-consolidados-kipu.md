# KIPU'S ERP — Flujos Operativos Estilo Bizagi para Servidor UML

Este documento presenta los **11 flujos de procesos unificados** de **KIPU'S ERP**, adaptados al estilo de diagramas de procesos **BPMN / Bizagi**:
- **Pasos cortos, concisos y directos**, basados en la operación real de la pantalla.
- **Cuadros coloreados con semántica BPMN**:
  - 🟢 **Verde (`#E8F8F5`):** Inicio, confirmaciones de éxito y emisión de comprobantes.
  - 🔵 **Azul (`#EBF5FB`):** Tareas operativas del usuario en la interfaz.
  - 🟡 **Amarillo (`#FEF9E7`):** Compuertas de decisión, alertas preventivas y revisiones.
  - 🟣 **Morado (`#F4ECF7`):** Transacciones atómicas del sistema (`erpStore`) y asistencia IA.
  - 🔴 **Rojo (`#FDEDEC`):** Mermas, alertas críticas y desvíos.
- **Roles unificados:** Los flujos que comparten roles no se repiten, sino que especifican los actores participantes.

---

## 1. Matriz de Flujos Unificados por Rol

| Flujo | Nombre del Flujo | Roles Participantes | Disparador desde la Interfaz |
| :---: | :--- | :--- | :--- |
| **F01** | **Monitoreo y Acciones Rápidas** | Admin, Cajero, Almacén | Menú `Inicio` / Dashboard general |
| **F02** | **Venta en Mostrador (POS)** | Cajero, Admin | Botón morado `[+ Registrar venta]` o `Ventas y caja` |
| **F03** | **Turno y Cuadre de Caja** | Cajero, Admin | Botón `[$ Cuadre de caja]` o enlace en tarjeta |
| **F04** | **Cotizaciones y Devoluciones** | Cajero, Admin | Pestañas dentro de `Ventas y caja` |
| **F05** | **Alta de Producto en Inventario** | Almacenero, Admin | Menú `Inventario` -> `[Nuevo producto]` / `[Escanear]` |
| **F06** | **Kardex y Alertas de Stock** | Almacenero, Admin | Menú `Inventario` -> `Entradas y Salidas` / Tarjeta en Inicio |
| **F07** | **Conteo Físico y Ajuste de Mermas** | Almacenero, Admin | Menú `Inventario` -> Pestañas `Ajustes` / `Inventario físico` |
| **F08** | **Sugerencia de Reabastecimiento** | Admin, Almacenero | Menú `Compras` -> `[Sugerencias]` o Alerta en Inicio |
| **F09** | **Recepción de Mercadería** | Almacenero, Admin | Menú `Compras` -> `[Recepción de mercancía]` |
| **F10** | **Gastos Operativos y Clientes** | Admin (ambos), Cajero (clientes) | Menú `Gastos y clientes` (o `Clientes` en cajero) |
| **F11** | **Liquidación SUNAT y KIPU'S IA** | Admin (completo), Almacén (solo stock) | Menú `Reportes` o Botón `[* KIPU'S IA]` en Inicio |

---

## 2. Diagramas de Proceso Cortos y Coloreados

---

### FLUJO 01: Monitoreo y Acciones Rápidas (Inicio)
* **Actores:** Dueño / Administrador, Cajero, Almacenero.
* **Pasos Rápidos:**
  1. Abrir pantalla `Inicio` (Panel General).
  2. Visualizar KPIs de ventas, caja chica y alertas de stock bajo.
  3. Revisar gráfico comparativo de ventas vs gastos (7 días).
  4. Ejecutar acción directa mediante botones superiores: `[+ Registrar venta]`, `[$ Cuadre de caja]`, `[* KIPU'S IA]` o `[Actualizar]`.

```plantuml
@startuml
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2

skinparam activity {
  BackgroundColor #EBF5FB
  BorderColor #2980B9
  BorderThickness 1.2
  FontColor #1A252F
}
skinparam decision {
  BackgroundColor #FEF9E7
  BorderColor #F39C12
  BorderThickness 1.2
  FontColor #7D6608
}
skinparam start {
  Color #27AE60
}
skinparam stop {
  Color #C0392B
}

title F01 - Monitoreo y Acciones Rápidas (Inicio)

start
:Abrir pantalla "Inicio" (Panel General);
:Visualizar KPIs de ventas, caja chica y alertas;
:Revisar gráfico de ventas vs gastos (7 días);

switch (¿Qué acción requiere el usuario?)
case ([+ Registrar venta])
  #E8F8F5:Ir a Terminal POS (/ventas);
  detach
case ([$ Cuadre de caja])
  #EBF5FB:Ir a Módulo Caja (/ventas?tab=caja);
  detach
case ([* KIPU'S IA])
  #F4ECF7:Abrir Asistente Inteligente;
  detach
case ([Ver inventario ->])
  #FEF9E7:Ir a catálogo de existencias bajo stock;
  detach
case ([Actualizar])
  #EBF5FB:Refrescar indicadores en tiempo real;
  stop
endswitch
@enduml
```

---

### FLUJO 02: Venta en Mostrador (POS)
* **Actores:** Cajero (operador), Dueño / Administrador (supervisor).
* **Pasos Rápidos:**
  1. Clic en `[+ Registrar venta]` desde Inicio o menú lateral.
  2. Pistolear código de barras, escanear con cámara, dictar por voz o buscar producto.
  3. Si hay stock disponible, sumar al carrito; si no, alerta sonora inmediata.
  4. Seleccionar comprobante (`Boleta`, `Factura`, `Nota`) e identificar cliente.
  5. Elegir método de pago (`Efectivo`, `Yape`, `Plin`, `Tarjeta`, `Mixto`) y calcular vuelto.
  6. Clic en `[Cobrar e Imprimir]`: el sistema descuenta stock en Kardex, ingresa dinero a caja, emite ticket e impacta Inicio en tiempo real.

```plantuml
@startuml
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2

skinparam activity {
  BackgroundColor #EBF5FB
  BorderColor #2980B9
  BorderThickness 1.2
  FontColor #1A252F
}
skinparam decision {
  BackgroundColor #FEF9E7
  BorderColor #F39C12
  BorderThickness 1.2
  FontColor #7D6608
}
skinparam start {
  Color #27AE60
}
skinparam stop {
  Color #C0392B
}

title F02 - Venta en Mostrador (POS)

start
:Clic en "+ Registrar venta";
:Capturar producto (Lector de barras, Cámara, Voz o Teclado);

if (¿Stock disponible?) then (Sí)
  :Agregar ítem al carrito de venta;
  :Elegir comprobante (Boleta, Factura o Nota);
  :Definir pago (Efectivo, Yape, Plin, Tarjeta o Mixto);
  :Clic en "Cobrar e Imprimir";
  #F4ECF7:erpStore descuenta stock en Kardex;
  #F4ECF7:erpStore ingresa dinero a Caja;
  #E8F8F5:Imprimir ticket y actualizar métricas de Inicio;
  stop
else (No)
  #FDEDEC:Alerta sonora "Sin existencias suficientes";
  stop
endif
@enduml
```

---

### FLUJO 03: Turno y Cuadre de Caja
* **Actores:** Cajero, Dueño / Administrador.
* **Pasos Rápidos:**
  1. Clic en `[$ Cuadre de caja]`. Si la caja está cerrada, ingresar fondo de sencillo y abrir turno.
  2. Cobros de ventas POS y egresos menores se acumulan automáticamente.
  3. Al fin de turno, clic en `[Cerrar Caja]` y digitar el efectivo contado en gaveta.
  4. Comparar contra el saldo esperado: si coincide es `CUADRADA`; si hay diferencia, exige motivo obligatorio.
  5. Cerrar caja y generar reporte de turno.

```plantuml
@startuml
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2

skinparam activity {
  BackgroundColor #EBF5FB
  BorderColor #2980B9
  BorderThickness 1.2
  FontColor #1A252F
}
skinparam decision {
  BackgroundColor #FEF9E7
  BorderColor #F39C12
  BorderThickness 1.2
  FontColor #7D6608
}
skinparam start {
  Color #27AE60
}
skinparam stop {
  Color #C0392B
}

title F03 - Turno y Cuadre de Caja

start
:Clic en "$ Cuadre de caja";

if (¿Caja está abierta?) then (No)
  :Ingresar fondo inicial de sencillo (ej. S/ 150);
  #E8F8F5:Abrir turno de caja;
else (Sí)
  :Continuar operaciones activas del turno;
endif

:Cobros de ventas POS y egresos menores;
:Fin de jornada: Clic en "Cerrar Caja";
:Cajero digita efectivo físico contado en gaveta;

if (¿Diferencia === 0?) then (Sí)
  #E8F8F5:Cierre "CUADRADA";
else (No)
  #FDEDEC:Cierre "CON DIFERENCIA" (Faltante o Sobrante);
  :Ingresar motivo obligatorio de descuadre;
endif

#E8F8F5:Cerrar caja y emitir reporte de turno;
stop
@enduml
```

---

### FLUJO 04: Cotizaciones y Devoluciones
* **Actores:** Cajero, Dueño / Administrador.
* **Pasos Rápidos:**
  - **Cotización:** Crear proforma con cliente y productos -> Guardar -> Si el cliente confirma, clic en `[Convertir a Venta]` y pasa directo al POS.
  - **Devolución:** Buscar venta en historial -> Asignar motivo -> Si mercadería está apta, reingresar a stock en Kardex; si se devuelve dinero, asentar egreso en gaveta de caja.

```plantuml
@startuml
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2

skinparam activity {
  BackgroundColor #EBF5FB
  BorderColor #2980B9
  BorderThickness 1.2
  FontColor #1A252F
}
skinparam decision {
  BackgroundColor #FEF9E7
  BorderColor #F39C12
  BorderThickness 1.2
  FontColor #7D6608
}
skinparam start {
  Color #27AE60
}
skinparam stop {
  Color #C0392B
}

title F04 - Cotizaciones y Devoluciones

start
if (¿Tipo de gestión comercial?) then (Cotización / Pedido)
  :Crear proforma con cliente y productos;
  :Guardar con código único COT-XXXX;
  if (¿Cliente aprueba compra?) then (Sí)
    #E8F8F5:Clic en "Convertir a Venta";
    #E8F8F5:Transferir al POS y emitir boleta/factura;
  else (No)
    #FDEDEC:Marcar como Vencida o Cancelada;
  endif
else (Devolución / Anulación)
  :Buscar venta original en Historial;
  :Ingresar motivo obligatorio de solicitud;
  if (¿Mercadería apta para reventa?) then (Sí)
    #E8F8F5:Reingresar unidades al stock (Kardex);
  else (No)
    #FDEDEC:Marcar como merma o desecho;
  endif
  if (¿Reembolso en efectivo?) then (Sí)
    #FDEDEC:Registrar egreso de dinero en gaveta;
  else (No)
    #EBF5FB:Emitir saldo a favor del cliente;
  endif
endif
stop
@enduml
```

---

### FLUJO 05: Alta de Producto en Inventario
* **Actores:** Almacenero, Dueño / Administrador.
* **Pasos Rápidos:**
  1. Abrir `Inventario` y dar clic en `[Nuevo producto]` o `[Escanear]`.
  2. Pistolear empaque con lector USB o enfocar con cámara del dispositivo.
  3. Si ya existe, carga los datos para editar; si es nuevo, ingresar nombre, categoría y unidad SUNAT.
  4. Ingresar costo y precio de venta (validando que Venta > Costo).
  5. Asignar stock mínimo para alertas y guardar. Si tiene existencias iniciales, asienta Kardex inicial.

```plantuml
@startuml
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2

skinparam activity {
  BackgroundColor #EBF5FB
  BorderColor #2980B9
  BorderThickness 1.2
  FontColor #1A252F
}
skinparam decision {
  BackgroundColor #FEF9E7
  BorderColor #F39C12
  BorderThickness 1.2
  FontColor #7D6608
}
skinparam start {
  Color #27AE60
}
skinparam stop {
  Color #C0392B
}

title F05 - Alta de Producto en Inventario

start
:Abrir Inventario -> Clic en "Nuevo producto" o "Escanear";
:Pistolear empaque con lector USB o enfocar con cámara;

if (¿Código o SKU ya existe?) then (Sí)
  #FEF9E7:Mostrar producto registrado y permitir edición;
else (No)
  :Ingresar Nombre, Categoría y Unidad SUNAT;
  :Ingresar Costo de Compra y Precio de Venta;
  if (¿Precio Venta > Costo?) then (Sí)
    :Definir Stock Mínimo para alertas;
    #E8F8F5:Guardar producto en catálogo activo;
    if (¿Tiene stock inicial?) then (Sí)
      #F4ECF7:Asentar Kardex inicial (ENTRADA);
    endif
  else (No)
    #FDEDEC:Alerta "Precio de venta debe superar al costo";
  endif
endif
stop
@enduml
```

---

### FLUJO 06: Kardex y Alertas de Stock
* **Actores:** Almacenero, Dueño / Administrador.
* **Pasos Rápidos:**
  1. Ocurre una venta, compra, devolución o ajuste.
  2. El sistema calcula el saldo en tiempo real e inserta una fila inmutable en Kardex.
  3. Clasifica el producto: Rojo si está `AGOTADO` (0 unidades), Amarillo si está `BAJO` (<= mínimo), o Verde si está `SUFICIENTE`.
  4. Actualiza inmediatamente las tarjetas de Inicio y alertas de reposición.

```plantuml
@startuml
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2

skinparam activity {
  BackgroundColor #EBF5FB
  BorderColor #2980B9
  BorderThickness 1.2
  FontColor #1A252F
}
skinparam decision {
  BackgroundColor #FEF9E7
  BorderColor #F39C12
  BorderThickness 1.2
  FontColor #7D6608
}
skinparam start {
  Color #27AE60
}
skinparam stop {
  Color #C0392B
}

title F06 - Kardex y Alertas de Stock

start
:Ocurre movimiento (Venta, Compra, Devolución o Ajuste);
#F4ECF7:Calcular saldo resultante en tiempo real;
#F4ECF7:Insertar fila inmutable en Kardex (Fecha, Tipo, Ref, Usuario);

if (¿Stock actual === 0?) then (Sí)
  #FDEDEC:Semáforo ROJO "AGOTADO";
  #FDEDEC:Alerta crítica en Dashboard y Compras;
elseif (¿Stock <= Mínimo?) then (Sí)
  #FEF9E7:Semáforo AMARILLO "STOCK BAJO";
  #FEF9E7:Enviar a lista de reabastecimiento;
else (No)
  #E8F8F5:Semáforo VERDE "SUFICIENTE";
endif

:Actualizar tarjeta de existencias en Inicio;
stop
@enduml
```

---

### FLUJO 07: Conteo Físico y Ajuste de Mermas
* **Actores:** Almacenero (conteo en estante), Dueño / Administrador (aprobación).
* **Pasos Rápidos:**
  1. Contar unidades físicas reales en el anaquel.
  2. Abrir `Inventario físico` y digitar el stock contado.
  3. Sistema calcula: `Diferencia = Físico - Sistema`.
  4. Si falta mercadería: seleccionar motivo obligatorio (`Rotura`, `Vencimiento`, `Pérdida`). Si sobra: seleccionar motivo de ajuste.
  5. Clic en aplicar: se actualiza el stock real y se genera el Kardex `AUDITORIA_CONTEO`.

```plantuml
@startuml
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2

skinparam activity {
  BackgroundColor #EBF5FB
  BorderColor #2980B9
  BorderThickness 1.2
  FontColor #1A252F
}
skinparam decision {
  BackgroundColor #FEF9E7
  BorderColor #F39C12
  BorderThickness 1.2
  FontColor #7D6608
}
skinparam start {
  Color #27AE60
}
skinparam stop {
  Color #C0392B
}

title F07 - Conteo Físico y Ajuste de Mermas

start
:Almacenero cuenta unidades reales en anaquel;
:Abrir "Inventario físico" y digitar stock contado;
#F4ECF7:Calcular Diferencia = Stock Físico - Stock Sistema;

if (¿Diferencia === 0?) then (Sí)
  #E8F8F5:Stock exacto (Sin cambios requeridos);
elseif (¿Diferencia < 0?) then (Faltante)
  #FDEDEC:Merma detectada (Vencimiento, Rotura, Pérdida);
  :Seleccionar motivo obligatorio de merma;
  #F4ECF7:Aplicar ajuste: Descontar stock y registrar Kardex;
else (Sobrante)
  #FEF9E7:Sobrante detectado (Ingreso no anotado);
  :Seleccionar motivo obligatorio de ajuste;
  #F4ECF7:Aplicar ajuste: Aumentar stock y registrar Kardex;
endif
stop
@enduml
```

---

### FLUJO 08: Sugerencia de Reabastecimiento
* **Actores:** Dueño / Administrador, Almacenero.
* **Pasos Rápidos:**
  1. Abrir `Compras` -> Clic en `[Sugerencias de Compra]` (o desde la alerta de Inicio).
  2. Motor analiza ventas de los últimos 30 días y productos bajo stock.
  3. Calcula días de cobertura restantes y sugiere cantidad para 30 días de inventario.
  4. Presenta matriz con proveedor sugerido e inversión estimada en soles.
  5. Usuario valida cantidades y genera la Orden de Compra en borrador.

```plantuml
@startuml
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2

skinparam activity {
  BackgroundColor #EBF5FB
  BorderColor #2980B9
  BorderThickness 1.2
  FontColor #1A252F
}
skinparam decision {
  BackgroundColor #FEF9E7
  BorderColor #F39C12
  BorderThickness 1.2
  FontColor #7D6608
}
skinparam start {
  Color #27AE60
}
skinparam stop {
  Color #C0392B
}

title F08 - Sugerencia de Reabastecimiento

start
:Abrir Compras -> Clic en "Sugerencias de Compra";
#F4ECF7:Analizar ventas de 30 días y productos bajo stock;
#F4ECF7:Calcular velocidad diaria y días de cobertura restantes;
#F4ECF7:Sugerir unidades a comprar para 30 días de inventario;
:Presentar matriz priorizada con proveedor habitual;
:Usuario valida o modifica cantidades sugeridas;
:Clic en "Generar Orden de Compra";
#E8F8F5:Crear orden de compra en estado BORRADOR;
stop
@enduml
```

---

### FLUJO 09: Recepción de Mercadería
* **Actores:** Almacenero (recepción física), Dueño / Administrador (control).
* **Pasos Rápidos:**
  1. Llega proveedor con mercadería física y Guía de Remisión o Factura.
  2. Abrir `Compras` -> `[Recepción de mercancía]`.
  3. Digitar número de comprobante, bultos/unidades recibidas y costo unitario real.
  4. Clic en confirmar: aumenta existencias en catálogo, actualiza costo de compra si varió, inserta fila en Kardex (`ENTRADA - COMPRA`) y marca orden como `RECIBIDA`.

```plantuml
@startuml
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2

skinparam activity {
  BackgroundColor #EBF5FB
  BorderColor #2980B9
  BorderThickness 1.2
  FontColor #1A252F
}
skinparam decision {
  BackgroundColor #FEF9E7
  BorderColor #F39C12
  BorderThickness 1.2
  FontColor #7D6608
}
skinparam start {
  Color #27AE60
}
skinparam stop {
  Color #C0392B
}

title F09 - Recepción de Mercadería

start
:Llega proveedor con mercadería y Guía/Factura física;
:Almacenero abre "Recepción de mercancía";
:Digitar número de comprobante, cantidades y costo unitario;

if (¿Cantidades y costos válidos?) then (Sí)
  :Clic en "Confirmar recepción e ingresar a stock";
  #F4ECF7:Aumentar stock disponible en catálogo;
  #F4ECF7:Actualizar costo de compra del producto si varió;
  #F4ECF7:Insertar fila Kardex (ENTRADA - COMPRA);
  #E8F8F5:Cambiar estado de orden a "RECIBIDA";
  #E8F8F5:Actualizar valorizado total en almacén;
else (No)
  #FDEDEC:Alerta: "Cantidades y costos deben ser mayores a 0";
endif
stop
@enduml
```

---

### FLUJO 10: Gastos Operativos y Clientes
* **Actores:** Dueño / Administrador (gastos y clientes), Cajero (clientes).
* **Pasos Rápidos:**
  - **Gasto:** Clic en `[Nuevo Gasto]` en `Gastos y clientes` -> Elegir categoría -> Si se paga con dinero de tienda, marca `Afectar caja chica` (resta efectivo de gaveta); si es por banco, no toca la gaveta. Resta de la Utilidad Neta y actualiza el gráfico de Inicio.
  - **Cliente:** Clic en `[Nuevo Cliente]` -> Digitar DNI o RUC con Razón Social -> Queda listo para emisión en POS.

```plantuml
@startuml
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2

skinparam activity {
  BackgroundColor #EBF5FB
  BorderColor #2980B9
  BorderThickness 1.2
  FontColor #1A252F
}
skinparam decision {
  BackgroundColor #FEF9E7
  BorderColor #F39C12
  BorderThickness 1.2
  FontColor #7D6608
}
skinparam start {
  Color #27AE60
}
skinparam stop {
  Color #C0392B
}

title F10 - Gastos Operativos y Clientes

start
if (¿Operación a realizar?) then (Gasto Operativo)
  :Abrir "Gastos y clientes" -> Clic en "Nuevo Gasto";
  :Elegir categoría (Alquiler, Servicios, Flete, Personal);
  :Ingresar monto, concepto y comprobante;
  if (¿Afecta caja chica?) then (Sí)
    #FDEDEC:Registrar EGRESO en gaveta de caja activa;
    #FDEDEC:Restar del saldo de efectivo de mostrador;
  else (No)
    #EBF5FB:Pago bancario -> No descuenta gaveta física;
  endif
  #F4ECF7:Restar monto en Utilidad Neta mensual;
  :Actualizar gráfico de gastos en Inicio;
else (Gestión de Clientes)
  :Abrir diálogo "Nuevo Cliente";
  :Ingresar DNI (8 dígitos) o RUC (11 dígitos) y Razón Social;
  #E8F8F5:Guardar cliente en directorio activo;
  :Disponible de inmediato para autocompletar en POS;
endif
stop
@enduml
```

---

### FLUJO 11: Liquidación SUNAT y KIPU'S IA
* **Actores:** Dueño / Administrador (acceso total), Almacenero (solo inventario).
* **Pasos Rápidos:**
  - **Reportes:** Pestaña Financiera (Ventas - Costos = Utilidad Bruta; menos Gastos = Utilidad Neta) | Pestaña SUNAT (IGV Débito vs IGV Crédito) | Exportación a CSV.
  - **KIPU'S IA:** Clic en `[* KIPU'S IA]` desde Inicio -> Dictar por voz o escribir consulta -> La IA analiza estado en tiempo real (caja, facturación, stock crítico) y devuelve diagnóstico con botones de acción directa.

```plantuml
@startuml
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2

skinparam activity {
  BackgroundColor #EBF5FB
  BorderColor #2980B9
  BorderThickness 1.2
  FontColor #1A252F
}
skinparam decision {
  BackgroundColor #FEF9E7
  BorderColor #F39C12
  BorderThickness 1.2
  FontColor #7D6608
}
skinparam start {
  Color #27AE60
}
skinparam stop {
  Color #C0392B
}

title F11 - Liquidación SUNAT y KIPU'S IA

start
if (¿Canal de consulta?) then (Módulo Reportes)
  :Abrir módulo "Reportes";
  fork
    :Pestaña Financiera: Ventas - Costos = Utilidad Bruta;
    :Restar Gastos Operativos = Utilidad Neta;
  fork again
    :Pestaña SUNAT: IGV Ventas vs IGV Compras;
    #FEF9E7:Calcular impuesto estimado a pagar ante SUNAT;
  fork again
    #E8F8F5:Exportar balance e inventario a CSV;
  end fork
else (Asistente KIPU'S IA)
  :Clic en botón "KIPU'S IA" en Inicio;
  :Dictar consulta por voz o escribir en chat;
  #F4ECF7:IA analiza: caja, ventas de hoy y stock crítico;
  #E8F8F5:Devolver diagnóstico 360 con botones de acción directa;
endif
stop
@enduml
```
