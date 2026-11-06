# KIPU'S ERP — Flujos Operativos Estilo Bizagi BPMN

Este documento consolida los **11 flujos de procesos unificados** de **KIPU'S ERP**, adaptados al estándar visual de diagramas de procesos de negocio **BPMN / Bizagi**:
- **Cajas amplias y legibles** con bordes redondeados y tipografía clara.
- **Acciones cortas, directas y precisas**, basadas en el funcionamiento real de la interfaz.
- **Colores corporativos Bizagi BPMN** (100% compatibles con PlantUML moderno mediante estereotipos y estilos CSS, sin alertas ni advertencias):
  - 🟢 **Verde (`<<verde>>`):** Inicio de proceso, aprobaciones, registros exitosos y emisión de comprobantes.
  - 🔵 **Azul (`<<azul>>`):** Tareas operativas de usuario (navegación, escaneo, digitación).
  - 🟡 **Amarillo (`<<amarillo>>`):** Evaluaciones, decisiones de negocio, alertas preventivas y ajustes.
  - 🟣 **Morado (`<<morado>>`):** Cálculos automáticos del sistema ERP (Kardex, utilidades, asistente IA).
  - 🔴 **Rojo (`<<rojo>>`):** Mermas, alertas críticas de stock agotado y descuadres de caja.
- **Roles unificados:** Los procesos compartidos entre Administrador, Almacenero y Cajero están unificados en un solo flujo maestro para evitar duplicidades.

---

## 1. Matriz de Flujos Unificados por Rol

| N° | Flujo de Proceso | Roles Participantes | Disparador desde la Interfaz | Imagen Generada |
| :---: | :--- | :--- | :--- | :--- |
| **F01** | **Monitoreo y Acciones Rápidas** | Dueño/Admin, Cajero, Almacén | Menú `Inicio` / Dashboard general | `imagenes/01_monitoreo_inicio.png` |
| **F02** | **Venta en Mostrador (POS)** | Cajero, Dueño/Admin | Botón morado `[+ Registrar venta]` o `Ventas y caja` | `imagenes/02_venta_pos_completa.png` |
| **F03** | **Turno y Cuadre de Caja** | Cajero, Dueño/Admin | Botón `[$ Cuadre de caja]` o enlace en tarjeta | `imagenes/03_cuadre_caja_arqueo.png` |
| **F04** | **Cotizaciones y Devoluciones** | Cajero, Dueño/Admin | Pestañas dentro de `Ventas y caja` | `imagenes/04_cotizaciones_devoluciones.png` |
| **F05** | **Alta de Producto en Inventario** | Almacenero, Dueño/Admin | Menú `Inventario` -> `[Nuevo producto]` / `[Escanear]` | `imagenes/05_inventario_escaner_catalogo.png` |
| **F06** | **Kardex y Alertas de Stock** | Almacenero, Dueño/Admin | Menú `Inventario` -> `Entradas y Salidas` / Tarjeta en Inicio | `imagenes/06_kardex_alertas_stock.png` |
| **F07** | **Conteo Físico y Ajuste de Mermas** | Almacenero, Dueño/Admin | Menú `Inventario` -> Pestañas `Ajustes` / `Inventario físico` | `imagenes/07_conteo_fisico_ajustes.png` |
| **F08** | **Sugerencia de Reabastecimiento** | Dueño/Admin | Menú `Compras` -> `[Sugerencias]` o Alerta en Inicio | `imagenes/08_reabastecimiento_compras.png` |
| **F09** | **Recepción de Mercadería** | Almacenero, Dueño/Admin | Menú `Compras` -> `[Recepción de mercancía]` | `imagenes/09_recepcion_mercaderia.png` |
| **F10** | **Gastos Operativos y Clientes** | Dueño/Admin (ambos), Cajero (clientes) | Menú `Gastos y clientes` (o `Clientes` en cajero) | `imagenes/10_gastos_clientes.png` |
| **F11** | **Reportes del Negocio, SUNAT y KIPU'S IA** | Dueño/Admin (completo), Almacén (inventario) | Menú `Reportes` o Botón `[* KIPU'S IA]` en Inicio | `imagenes/11_reportes_sunat_ia.png` |

---

## 2. Diagramas de Proceso (Estilo Bizagi BPMN)

---

### FLUJO 01: Monitoreo y Acciones Rápidas (Inicio)
* **Actores:** Dueño / Administrador, Cajero, Almacenero.
* **Archivo:** [`01_monitoreo_inicio.puml`](file:///d:/ERP-APP/docs/UML-flujos/01_monitoreo_inicio.puml)
* **Imagen:** ![F01](imagenes/01_monitoreo_inicio.png)

```plantuml
@startuml
<style>
activityDiagram {
  BackgroundColor #F8F9FA
  BorderColor #2C3E50
  FontColor #1A252F
  FontSize 13
  FontName "Segoe UI", Arial, sans-serif
  RoundCorner 12
  Padding 10
  Margin 8

  .verde {
    BackgroundColor #D4EFDF
    BorderColor #27AE60
    FontColor #145A32
  }
  .amarillo {
    BackgroundColor #FCF3CF
    BorderColor #F39C12
    FontColor #7D6608
  }
  .azul {
    BackgroundColor #D4E6F1
    BorderColor #2980B9
    FontColor #154360
  }
  .morado {
    BackgroundColor #E8DAEF
    BorderColor #8E44AD
    FontColor #4A235A
  }
  .rojo {
    BackgroundColor #FADBD8
    BorderColor #C0392B
    FontColor #78281F
  }
}
</style>

skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.8
skinparam activityStartColor #27AE60
skinparam activityEndColor #C0392B
skinparam activityDiamondBackgroundColor #FCF3CF
skinparam activityDiamondBorderColor #F39C12
skinparam activityDiamondFontColor #7D6608
skinparam activityDiamondFontSize 12

title F01 - Monitoreo y Acciones Rápidas (Inicio)

start
:Ingresar a Inicio (Panel General); <<azul>>
:Consultar ventas del día y saldo de caja; <<azul>>
:Revisar alertas de stock bajo y cobros pendientes; <<amarillo>>

switch (¿Acción rápida requerida?)
case ([Registrar venta])
  :Abrir Terminal POS de venta; <<verde>>
  stop
case ([Cuadre de caja])
  :Abrir Arqueo y Cierre de turno; <<azul>>
  stop
case ([KIPU'S IA])
  :Consultar Asistente Inteligente 360; <<morado>>
  stop
case ([Ver inventario])
  :Revisar catálogo y stock crítico; <<amarillo>>
  stop
case ([Actualizar])
  :Recargar métricas en tiempo real; <<azul>>
  stop
endswitch
@enduml
```

---

### FLUJO 02: Venta en Mostrador (POS)
* **Actores:** Cajero, Dueño / Administrador.
* **Archivo:** [`02_venta_pos_completa.puml`](file:///d:/ERP-APP/docs/UML-flujos/02_venta_pos_completa.puml)
* **Imagen:** ![F02](imagenes/02_venta_pos_completa.png)

```plantuml
@startuml
<style>
activityDiagram {
  BackgroundColor #F8F9FA
  BorderColor #2C3E50
  FontColor #1A252F
  FontSize 13
  FontName "Segoe UI", Arial, sans-serif
  RoundCorner 12
  Padding 10
  Margin 8

  .verde {
    BackgroundColor #D4EFDF
    BorderColor #27AE60
    FontColor #145A32
  }
  .amarillo {
    BackgroundColor #FCF3CF
    BorderColor #F39C12
    FontColor #7D6608
  }
  .azul {
    BackgroundColor #D4E6F1
    BorderColor #2980B9
    FontColor #154360
  }
  .morado {
    BackgroundColor #E8DAEF
    BorderColor #8E44AD
    FontColor #4A235A
  }
  .rojo {
    BackgroundColor #FADBD8
    BorderColor #C0392B
    FontColor #78281F
  }
}
</style>

skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.8
skinparam activityStartColor #27AE60
skinparam activityEndColor #C0392B
skinparam activityDiamondBackgroundColor #FCF3CF
skinparam activityDiamondBorderColor #F39C12
skinparam activityDiamondFontColor #7D6608
skinparam activityDiamondFontSize 12

title F02 - Venta en Mostrador (POS)

start
:Ingresar a POS y pulsar Registrar Venta; <<azul>>
:Escanear código de barra o buscar producto; <<azul>>

if (¿Stock disponible?) then (Sí)
  :Agregar producto al carrito; <<azul>>
  :Seleccionar tipo de comprobante (Boleta / Factura); <<azul>>
  :Registrar forma de pago (Efectivo / Yape / Tarjeta); <<azul>>
  :Descontar existencias en Kardex; <<morado>>
  :Registrar ingreso de dinero en Caja Activa; <<morado>>
  :Emitir comprobante e imprimir ticket; <<verde>>
  stop
else (No)
  :Notificar stock insuficiente y bloquear venta; <<rojo>>
  stop
endif
@enduml
```

---

### FLUJO 03: Turno y Cuadre de Caja
* **Actores:** Cajero, Dueño / Administrador.
* **Archivo:** [`03_cuadre_caja_arqueo.puml`](file:///d:/ERP-APP/docs/UML-flujos/03_cuadre_caja_arqueo.puml)
* **Imagen:** ![F03](imagenes/03_cuadre_caja_arqueo.png)

```plantuml
@startuml
<style>
activityDiagram {
  BackgroundColor #F8F9FA
  BorderColor #2C3E50
  FontColor #1A252F
  FontSize 13
  FontName "Segoe UI", Arial, sans-serif
  RoundCorner 12
  Padding 10
  Margin 8

  .verde {
    BackgroundColor #D4EFDF
    BorderColor #27AE60
    FontColor #145A32
  }
  .amarillo {
    BackgroundColor #FCF3CF
    BorderColor #F39C12
    FontColor #7D6608
  }
  .azul {
    BackgroundColor #D4E6F1
    BorderColor #2980B9
    FontColor #154360
  }
  .morado {
    BackgroundColor #E8DAEF
    BorderColor #8E44AD
    FontColor #4A235A
  }
  .rojo {
    BackgroundColor #FADBD8
    BorderColor #C0392B
    FontColor #78281F
  }
}
</style>

skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.8
skinparam activityStartColor #27AE60
skinparam activityEndColor #C0392B
skinparam activityDiamondBackgroundColor #FCF3CF
skinparam activityDiamondBorderColor #F39C12
skinparam activityDiamondFontColor #7D6608
skinparam activityDiamondFontSize 12

title F03 - Turno y Cuadre de Caja

start
:Ingresar a Módulo Caja; <<azul>>

if (¿Caja abierta?) then (No)
  :Ingresar fondo inicial de sencillo; <<azul>>
  :Aperturar turno de caja; <<verde>>
else (Sí)
  :Continuar operaciones de ventas y cobros; <<azul>>
endif

:Llegar al fin de jornada y pulsar Cerrar Caja; <<azul>>
:Contar efectivo físico e ingresar montos; <<azul>>
:Calcular diferencia entre sistema y dinero físico; <<morado>>

if (¿Diferencia es S/ 0.00?) then (Sí)
  :Cerrar turno con estado CUADRADA; <<verde>>
  stop
else (No)
  :Registrar motivo de faltante o sobrante; <<amarillo>>
  :Cerrar turno con estado CON DIFERENCIA; <<rojo>>
  stop
endif
@enduml
```

---

### FLUJO 04: Cotizaciones y Devoluciones
* **Actores:** Cajero, Dueño / Administrador.
* **Archivo:** [`04_cotizaciones_devoluciones.puml`](file:///d:/ERP-APP/docs/UML-flujos/04_cotizaciones_devoluciones.puml)
* **Imagen:** ![F04](imagenes/04_cotizaciones_devoluciones.png)

```plantuml
@startuml
<style>
activityDiagram {
  BackgroundColor #F8F9FA
  BorderColor #2C3E50
  FontColor #1A252F
  FontSize 13
  FontName "Segoe UI", Arial, sans-serif
  RoundCorner 12
  Padding 10
  Margin 8

  .verde {
    BackgroundColor #D4EFDF
    BorderColor #27AE60
    FontColor #145A32
  }
  .amarillo {
    BackgroundColor #FCF3CF
    BorderColor #F39C12
    FontColor #7D6608
  }
  .azul {
    BackgroundColor #D4E6F1
    BorderColor #2980B9
    FontColor #154360
  }
  .morado {
    BackgroundColor #E8DAEF
    BorderColor #8E44AD
    FontColor #4A235A
  }
  .rojo {
    BackgroundColor #FADBD8
    BorderColor #C0392B
    FontColor #78281F
  }
}
</style>

skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.8
skinparam activityStartColor #27AE60
skinparam activityEndColor #C0392B
skinparam activityDiamondBackgroundColor #FCF3CF
skinparam activityDiamondBorderColor #F39C12
skinparam activityDiamondFontColor #7D6608
skinparam activityDiamondFontSize 12

title F04 - Cotizaciones y Devoluciones

start
if (¿Tipo de operación?) then (Cotización / Preventa)
  :Crear proforma con cliente y productos; <<azul>>
  :Guardar con correlativo COT-XXXX; <<azul>>
  if (¿Cliente aprueba compra?) then (Sí)
    :Convertir cotización en Venta Activa; <<verde>>
    :Cargar en POS y emitir comprobante; <<verde>>
    stop
  else (No)
    :Marcar cotización como Vencida o Anulada; <<rojo>>
    stop
  endif
else (Devolución / Nota de Crédito)
  :Buscar venta original en historial; <<azul>>
  :Registrar motivo de devolución; <<amarillo>>
  if (¿Producto apto para venta?) then (Sí)
    :Reingresar unidades al Kardex; <<verde>>
  else (No)
    :Enviar a merma o desecho; <<rojo>>
  endif
  if (¿Reembolso en efectivo?) then (Sí)
    :Registrar salida de dinero en caja; <<rojo>>
  else (No)
    :Generar saldo a favor del cliente; <<azul>>
  endif
  :Emitir Nota de Crédito final; <<verde>>
  stop
endif
@enduml
```

---

### FLUJO 05: Alta de Producto en Inventario
* **Actores:** Almacenero, Dueño / Administrador.
* **Archivo:** [`05_inventario_escaner_catalogo.puml`](file:///d:/ERP-APP/docs/UML-flujos/05_inventario_escaner_catalogo.puml)
* **Imagen:** ![F05](imagenes/05_inventario_escaner_catalogo.png)

```plantuml
@startuml
<style>
activityDiagram {
  BackgroundColor #F8F9FA
  BorderColor #2C3E50
  FontColor #1A252F
  FontSize 13
  FontName "Segoe UI", Arial, sans-serif
  RoundCorner 12
  Padding 10
  Margin 8

  .verde {
    BackgroundColor #D4EFDF
    BorderColor #27AE60
    FontColor #145A32
  }
  .amarillo {
    BackgroundColor #FCF3CF
    BorderColor #F39C12
    FontColor #7D6608
  }
  .azul {
    BackgroundColor #D4E6F1
    BorderColor #2980B9
    FontColor #154360
  }
  .morado {
    BackgroundColor #E8DAEF
    BorderColor #8E44AD
    FontColor #4A235A
  }
  .rojo {
    BackgroundColor #FADBD8
    BorderColor #C0392B
    FontColor #78281F
  }
}
</style>

skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.8
skinparam activityStartColor #27AE60
skinparam activityEndColor #C0392B
skinparam activityDiamondBackgroundColor #FCF3CF
skinparam activityDiamondBorderColor #F39C12
skinparam activityDiamondFontColor #7D6608
skinparam activityDiamondFontSize 12

title F05 - Alta de Producto en Inventario

start
:Ingresar a Inventario y pulsar Nuevo Producto; <<azul>>
:Escanear código de barra con lector o cámara; <<azul>>

if (¿Código o SKU ya existe?) then (Sí)
  :Abrir ficha existente para actualizar datos; <<amarillo>>
  stop
else (No)
  :Ingresar nombre, categoría y unidad SUNAT; <<azul>>
  :Ingresar costo de compra y precio de venta; <<azul>>
  if (¿Precio venta supera al costo?) then (Sí)
    :Definir stock mínimo para alertas; <<azul>>
    :Guardar nuevo producto en catálogo; <<verde>>
    if (¿Registra stock inicial?) then (Sí)
      :Asentar registro inicial en Kardex; <<morado>>
    endif
    stop
  else (No)
    :Bloquear guardado por margen negativo; <<rojo>>
    stop
  endif
endif
@enduml
```

---

### FLUJO 06: Kardex y Alertas de Stock
* **Actores:** Almacenero, Dueño / Administrador.
* **Archivo:** [`06_kardex_alertas_stock.puml`](file:///d:/ERP-APP/docs/UML-flujos/06_kardex_alertas_stock.puml)
* **Imagen:** ![F06](imagenes/06_kardex_alertas_stock.png)

```plantuml
@startuml
<style>
activityDiagram {
  BackgroundColor #F8F9FA
  BorderColor #2C3E50
  FontColor #1A252F
  FontSize 13
  FontName "Segoe UI", Arial, sans-serif
  RoundCorner 12
  Padding 10
  Margin 8

  .verde {
    BackgroundColor #D4EFDF
    BorderColor #27AE60
    FontColor #145A32
  }
  .amarillo {
    BackgroundColor #FCF3CF
    BorderColor #F39C12
    FontColor #7D6608
  }
  .azul {
    BackgroundColor #D4E6F1
    BorderColor #2980B9
    FontColor #154360
  }
  .morado {
    BackgroundColor #E8DAEF
    BorderColor #8E44AD
    FontColor #4A235A
  }
  .rojo {
    BackgroundColor #FADBD8
    BorderColor #C0392B
    FontColor #78281F
  }
}
</style>

skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.8
skinparam activityStartColor #27AE60
skinparam activityEndColor #C0392B
skinparam activityDiamondBackgroundColor #FCF3CF
skinparam activityDiamondBorderColor #F39C12
skinparam activityDiamondFontColor #7D6608
skinparam activityDiamondFontSize 12

title F06 - Kardex y Alertas de Stock

start
:Ocurre movimiento (Venta, Compra, Merma o Devolución); <<azul>>
:Calcular nuevo saldo disponible en almacén; <<morado>>
:Registrar movimiento inmutable en Kardex; <<morado>>

if (¿Stock actual es 0?) then (Sí)
  :Activar alerta roja "PRODUCTO AGOTADO"; <<rojo>>
  :Notificar en Dashboard e Inventario; <<rojo>>
elseif (¿Stock menor o igual al mínimo?) then (Sí)
  :Activar alerta amarilla "STOCK BAJO"; <<amarillo>>
  :Agregar a lista de sugerencias de compra; <<amarillo>>
else (No)
  :Marcar semáforo verde "STOCK ÓPTIMO"; <<verde>>
endif

:Actualizar tarjetas de existencias en Inicio; <<azul>>
stop
@enduml
```

---

### FLUJO 07: Conteo Físico y Ajuste de Mermas
* **Actores:** Almacenero, Dueño / Administrador.
* **Archivo:** [`07_conteo_fisico_ajustes.puml`](file:///d:/ERP-APP/docs/UML-flujos/07_conteo_fisico_ajustes.puml)
* **Imagen:** ![F07](imagenes/07_conteo_fisico_ajustes.png)

```plantuml
@startuml
<style>
activityDiagram {
  BackgroundColor #F8F9FA
  BorderColor #2C3E50
  FontColor #1A252F
  FontSize 13
  FontName "Segoe UI", Arial, sans-serif
  RoundCorner 12
  Padding 10
  Margin 8

  .verde {
    BackgroundColor #D4EFDF
    BorderColor #27AE60
    FontColor #145A32
  }
  .amarillo {
    BackgroundColor #FCF3CF
    BorderColor #F39C12
    FontColor #7D6608
  }
  .azul {
    BackgroundColor #D4E6F1
    BorderColor #2980B9
    FontColor #154360
  }
  .morado {
    BackgroundColor #E8DAEF
    BorderColor #8E44AD
    FontColor #4A235A
  }
  .rojo {
    BackgroundColor #FADBD8
    BorderColor #C0392B
    FontColor #78281F
  }
}
</style>

skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.8
skinparam activityStartColor #27AE60
skinparam activityEndColor #C0392B
skinparam activityDiamondBackgroundColor #FCF3CF
skinparam activityDiamondBorderColor #F39C12
skinparam activityDiamondFontColor #7D6608
skinparam activityDiamondFontSize 12

title F07 - Conteo Físico y Ajuste de Mermas

start
:Realizar conteo físico en anaquel de almacén; <<azul>>
:Ingresar a Inventario y digitar cantidad contada; <<azul>>
:Calcular diferencia contra stock en sistema; <<morado>>

if (¿Diferencia es 0?) then (Sí)
  :Confirmar inventario exacto sin variaciones; <<verde>>
  stop
elseif (¿Diferencia menor a 0?) then (Faltante)
  :Identificar merma por daño o vencimiento; <<rojo>>
  :Seleccionar justificación obligatoria; <<amarillo>>
  :Descontar stock y asentar salida en Kardex; <<morado>>
  :Finalizar ajuste con merma registrada; <<rojo>>
  stop
else (Sobrante)
  :Identificar producto no registrado en compra; <<amarillo>>
  :Seleccionar justificación de ingreso; <<amarillo>>
  :Aumentar stock y asentar entrada en Kardex; <<morado>>
  :Finalizar ajuste con sobrante regularizado; <<verde>>
  stop
endif
@enduml
```

---

### FLUJO 08: Sugerencia de Reabastecimiento
* **Actores:** Dueño / Administrador.
* **Archivo:** [`08_reabastecimiento_compras.puml`](file:///d:/ERP-APP/docs/UML-flujos/08_reabastecimiento_compras.puml)
* **Imagen:** ![F08](imagenes/08_reabastecimiento_compras.png)

```plantuml
@startuml
<style>
activityDiagram {
  BackgroundColor #F8F9FA
  BorderColor #2C3E50
  FontColor #1A252F
  FontSize 13
  FontName "Segoe UI", Arial, sans-serif
  RoundCorner 12
  Padding 10
  Margin 8

  .verde {
    BackgroundColor #D4EFDF
    BorderColor #27AE60
    FontColor #145A32
  }
  .amarillo {
    BackgroundColor #FCF3CF
    BorderColor #F39C12
    FontColor #7D6608
  }
  .azul {
    BackgroundColor #D4E6F1
    BorderColor #2980B9
    FontColor #154360
  }
  .morado {
    BackgroundColor #E8DAEF
    BorderColor #8E44AD
    FontColor #4A235A
  }
  .rojo {
    BackgroundColor #FADBD8
    BorderColor #C0392B
    FontColor #78281F
  }
}
</style>

skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.8
skinparam activityStartColor #27AE60
skinparam activityEndColor #C0392B
skinparam activityDiamondBackgroundColor #FCF3CF
skinparam activityDiamondBorderColor #F39C12
skinparam activityDiamondFontColor #7D6608
skinparam activityDiamondFontSize 12

title F08 - Sugerencia de Reabastecimiento

start
:Ingresar a Compras y seleccionar Sugerencias; <<azul>>
:Analizar ventas de 30 días y stock mínimo; <<morado>>
:Calcular velocidad diaria y días de cobertura; <<morado>>
:Calcular unidades para 30 días de inventario; <<amarillo>>
:Revisar matriz de reposición con proveedor habitual; <<azul>>
:Ajustar y confirmar cantidades requeridas; <<azul>>
:Generar Orden de Compra en BORRADOR; <<verde>>
stop
@enduml
```

---

### FLUJO 09: Recepción de Mercadería
* **Actores:** Almacenero, Dueño / Administrador.
* **Archivo:** [`09_recepcion_mercaderia.puml`](file:///d:/ERP-APP/docs/UML-flujos/09_recepcion_mercaderia.puml)
* **Imagen:** ![F09](imagenes/09_recepcion_mercaderia.png)

```plantuml
@startuml
<style>
activityDiagram {
  BackgroundColor #F8F9FA
  BorderColor #2C3E50
  FontColor #1A252F
  FontSize 13
  FontName "Segoe UI", Arial, sans-serif
  RoundCorner 12
  Padding 10
  Margin 8

  .verde {
    BackgroundColor #D4EFDF
    BorderColor #27AE60
    FontColor #145A32
  }
  .amarillo {
    BackgroundColor #FCF3CF
    BorderColor #F39C12
    FontColor #7D6608
  }
  .azul {
    BackgroundColor #D4E6F1
    BorderColor #2980B9
    FontColor #154360
  }
  .morado {
    BackgroundColor #E8DAEF
    BorderColor #8E44AD
    FontColor #4A235A
  }
  .rojo {
    BackgroundColor #FADBD8
    BorderColor #C0392B
    FontColor #78281F
  }
}
</style>

skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.8
skinparam activityStartColor #27AE60
skinparam activityEndColor #C0392B
skinparam activityDiamondBackgroundColor #FCF3CF
skinparam activityDiamondBorderColor #F39C12
skinparam activityDiamondFontColor #7D6608
skinparam activityDiamondFontSize 12

title F09 - Recepción de Mercadería

start
:Recibir mercadería física con Guía o Factura; <<azul>>
:Abrir Recepción en módulo Compras; <<azul>>
:Verificar cantidades y costos unitarios; <<azul>>

if (¿Cantidades y costos correctos?) then (Sí)
  :Confirmar recepción en almacén; <<azul>>
  :Aumentar existencias en catálogo; <<morado>>
  :Actualizar costo de compra del producto; <<morado>>
  :Asentar entrada de mercadería en Kardex; <<morado>>
  :Marcar orden como RECIBIDA; <<verde>>
  :Actualizar valorizado total de inventario; <<verde>>
  stop
else (No)
  :Notificar discrepancia y rechazar recepción; <<rojo>>
  stop
endif
@enduml
```

---

### FLUJO 10: Gastos Operativos y Clientes
* **Actores:** Dueño / Administrador (ambos), Cajero (solo clientes).
* **Archivo:** [`10_gastos_clientes.puml`](file:///d:/ERP-APP/docs/UML-flujos/10_gastos_clientes.puml)
* **Imagen:** ![F10](imagenes/10_gastos_clientes.png)

```plantuml
@startuml
<style>
activityDiagram {
  BackgroundColor #F8F9FA
  BorderColor #2C3E50
  FontColor #1A252F
  FontSize 13
  FontName "Segoe UI", Arial, sans-serif
  RoundCorner 12
  Padding 10
  Margin 8

  .verde {
    BackgroundColor #D4EFDF
    BorderColor #27AE60
    FontColor #145A32
  }
  .amarillo {
    BackgroundColor #FCF3CF
    BorderColor #F39C12
    FontColor #7D6608
  }
  .azul {
    BackgroundColor #D4E6F1
    BorderColor #2980B9
    FontColor #154360
  }
  .morado {
    BackgroundColor #E8DAEF
    BorderColor #8E44AD
    FontColor #4A235A
  }
  .rojo {
    BackgroundColor #FADBD8
    BorderColor #C0392B
    FontColor #78281F
  }
}
</style>

skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.8
skinparam activityStartColor #27AE60
skinparam activityEndColor #C0392B
skinparam activityDiamondBackgroundColor #FCF3CF
skinparam activityDiamondBorderColor #F39C12
skinparam activityDiamondFontColor #7D6608
skinparam activityDiamondFontSize 12

title F10 - Gastos Operativos y Clientes

start
if (¿Tipo de operación?) then (Gasto Operativo)
  :Ingresar a Gastos y pulsar Nuevo Gasto; <<azul>>
  :Seleccionar categoría (Servicios, Alquiler, Flete); <<azul>>
  :Ingresar monto y adjuntar comprobante; <<azul>>
  if (¿Afecta efectivo de caja?) then (Sí)
    :Descontar egreso del saldo de gaveta; <<rojo>>
  else (No)
    :Registrar egreso por transferencia o banco; <<azul>>
  endif
  :Deducir gasto de la Utilidad Neta; <<morado>>
  :Actualizar gráfico de egresos en Inicio; <<verde>>
  stop
else (Gestión de Clientes)
  :Ingresar a Clientes y pulsar Nuevo Cliente; <<azul>>
  :Registrar documento DNI o RUC y Razón Social; <<azul>>
  :Guardar datos de contacto y dirección; <<azul>>
  :Habilitar cliente de inmediato para ventas en POS; <<verde>>
  stop
endif
@enduml
```

---

### FLUJO 11: Reportes del Negocio, SUNAT y KIPU'S IA
* **Actores:** Dueño / Administrador (completo), Almacenero (reportes de inventario).
* **Archivo:** [`11_reportes_sunat_ia.puml`](file:///d:/ERP-APP/docs/UML-flujos/11_reportes_sunat_ia.puml)
* **Imagen:** ![F11](imagenes/11_reportes_sunat_ia.png)

```plantuml
@startuml
<style>
activityDiagram {
  BackgroundColor #F8F9FA
  BorderColor #2C3E50
  FontColor #1A252F
  FontSize 13
  FontName "Segoe UI", Arial, sans-serif
  RoundCorner 12
  Padding 10
  Margin 8

  .verde {
    BackgroundColor #D4EFDF
    BorderColor #27AE60
    FontColor #145A32
  }
  .amarillo {
    BackgroundColor #FCF3CF
    BorderColor #F39C12
    FontColor #7D6608
  }
  .azul {
    BackgroundColor #D4E6F1
    BorderColor #2980B9
    FontColor #154360
  }
  .morado {
    BackgroundColor #E8DAEF
    BorderColor #8E44AD
    FontColor #4A235A
  }
  .rojo {
    BackgroundColor #FADBD8
    BorderColor #C0392B
    FontColor #78281F
  }
}
</style>

skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.8
skinparam activityStartColor #27AE60
skinparam activityEndColor #C0392B
skinparam activityDiamondBackgroundColor #FCF3CF
skinparam activityDiamondBorderColor #F39C12
skinparam activityDiamondFontColor #7D6608
skinparam activityDiamondFontSize 12

title F11 - Reportes del Negocio, SUNAT y KIPU'S IA

start
if (¿Canal de consulta?) then (Módulo Reportes)
  :Ingresar a módulo Reportes; <<azul>>
  switch (¿Reporte a generar?)
  case ([Financiero])
    :Calcular Utilidad Bruta y Utilidad Neta; <<morado>>
    stop
  case ([Tributario])
    :Calcular balance IGV Ventas vs Compras SUNAT; <<amarillo>>
    stop
  case ([Exportación])
    :Descargar Kardex y Existencias en Excel/CSV; <<verde>>
    stop
  endswitch
else (Asistente KIPU'S IA)
  :Pulsar botón KIPU'S IA en Inicio o Reportes; <<azul>>
  :Hacer consulta por texto o comando de voz; <<azul>>
  :Analizar caja, ventas del día y stock crítico; <<morado>>
  :Devolver diagnóstico inteligente con atajos; <<verde>>
  stop
endif
@enduml
```

---

## 3. Instrucciones para Word

1. Abre tu documento Word.
2. Ve a la pestaña **Insertar** -> **Imágenes** -> **Este dispositivo...**
3. Navega a la carpeta:
   `D:\ERP-APP\docs\UML-flujos\imagenes\`
4. Selecciona las 11 imágenes generadas (`01_monitoreo_inicio.png` hasta `11_reportes_sunat_ia.png`).
5. Cada imagen cuenta con la resolución óptima, tipografía Segoe UI legible y estilo formal Bizagi BPMN listo para informes ejecutivos y manuales operativos.
