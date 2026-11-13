# KIPU'S ERP PRO — Master Prompts para Agente de Figma (< 2,000 Caracteres por Sección)

> **Solución al límite de 2,000 caracteres de Figma AI / Plugins:**
> Para no superar el límite de **2000 / 2000** caracteres de Figma AI y mantener **el 100% de los detalles técnicos, tokens, componentes y flujos por rol**, el prompt ha sido dividido en **6 secciones secuenciales independientes** (todas entre 1,770 y 1,860 caracteres).
>
> También puedes encontrar cada sección como archivo de texto plano listo en:
> - [`docs/figma_prompts/parte1_design_system_y_shell.txt`](file:///d:/ERP-UNIFICADO/ERP-APP/docs/figma_prompts/parte1_design_system_y_shell.txt) (1,846 chars)
> - [`docs/figma_prompts/parte2_terminal_pos_y_catalogo.txt`](file:///d:/ERP-UNIFICADO/ERP-APP/docs/figma_prompts/parte2_terminal_pos_y_catalogo.txt) (1,859 chars)
> - [`docs/figma_prompts/parte3_modales_cobro_y_ticket.txt`](file:///d:/ERP-UNIFICADO/ERP-APP/docs/figma_prompts/parte3_modales_cobro_y_ticket.txt) (1,778 chars)
> - [`docs/figma_prompts/parte4_flujo_cajero_caja_turnos.txt`](file:///d:/ERP-UNIFICADO/ERP-APP/docs/figma_prompts/parte4_flujo_cajero_caja_turnos.txt) (1,802 chars)
> - [`docs/figma_prompts/parte5_flujo_almacenero_inventario.txt`](file:///d:/ERP-UNIFICADO/ERP-APP/docs/figma_prompts/parte5_flujo_almacenero_inventario.txt) (1,823 chars)
> - [`docs/figma_prompts/parte6_flujo_admin_ia_y_sunat.txt`](file:///d:/ERP-UNIFICADO/ERP-APP/docs/figma_prompts/parte6_flujo_admin_ia_y_sunat.txt) (1,815 chars)

---

## 📌 PARTE 1: DESIGN SYSTEM, TOKENS Y APP SHELL (1,846 caracteres)
*Copia y pega este bloque en el primer prompt de Figma:*

```text
[PROMPT PARTE 1/6: DESIGN SYSTEM & APP SHELL CON AUTO-LAYOUT]
Diseña en Figma un software de escritorio ERP profesional (1440x900px, 100% Auto-layout).

ESTILO & TOKENS:
- Primario: Violeta #431B94 (Hover #351574, Fondo suave #F3EFFB).
- Superficies: Fondo #F4F6F9, Tarjetas/Paneles #FFFFFF, Bordes #DCE2EB (1px), Radio base 6px.
- Textos: Títulos #111827, Secundario #556274. Tipografía Inter UI, montos en JetBrains Mono tabular.
- Semánticos: Éxito #16A34A (soft #F0FDF4), Alerta #F59E0B (soft #FFFBEB), Peligro #DC2626 (soft #FEF2F2). Cian secundario de marca #02A1BC solo para gráficos y logo.
- Sombras: Sutiles (0px 1px 3px rgba(16,24,40,0.06)).

ESTRUCTURA DE PANTALLA (SHELL):
1. APP SIDEBAR (Ancho 240px, Auto-layout vertical, fondo #F4F6F9, borde derecho #DCE2EB):
- Header (64px): Logo Kipu's + badge "PRO" en violeta suave + chip "Rol: Cajero".
- Menú de navegación:
  * Inicio (Dashboard)
  * "Ventas y caja" (Activo fondo #431B94, texto blanco) con SUB-OPCIONES indentadas (borde izq 2px violeta):
    - [🛒 Punto de Venta (POS)] (Seleccionado, fondo #F3EFFB, texto #431B94)
    - [🧾 Historial de Comprobantes] (Texto #556274)
    - [💵 Caja y Turnos] (Texto #556274)
  * Clientes
  * Inventario, Compras, Reportes, Administración (según rol).
- Footer (56px): Avatar 24px, "Carlos Vega", "Sede Central", icono verificado verde.

2. APP HEADER (Alto 52px, fondo #FFFFFF, borde inf #DCE2EB, Auto-layout horizontal):
- Izq: Botón colapsar menú (32px), Chip sucursal "🏢 Sucursal: Sede Central - Tingo María" (fondo #EDF2F7), Fecha "Vie, 13 Nov. 2026".
- Der: Pill WebSocket verde pulsante "🟢 En Vivo", Chip T.C. SUNAT "📈 T.C.: C: 3.74 | V: 3.76" monospaciado, Botón Sincronizar, Notificaciones con punto rojo, Botón Tema (luna), Avatar con iniciales "PR Pierina".

Genera componentes maestros con variantes y auto-layout estricto.
```

---

## 📌 PARTE 2: TERMINAL POS Y CATÁLOGO EN FILAS ALARGADAS (1,859 caracteres)
*Copia y pega este bloque en el segundo prompt de Figma:*

```text
[PROMPT PARTE 2/6: PANTALLA POS COMPLETA Y CATÁLOGO EN FILAS]
Diseña en Figma la pantalla principal de Punto de Venta (POS) en 1440x900px, 100% Auto-layout, con el Shell de la Parte 1.

COLUMNA IZQUIERDA (Catálogo y Búsqueda, 7 de 12 cols):
1. Sub-barra Slim (Alto 34px, borde #DCE2EB, radio 6px, padding 6px 12px):
- Izq: "Caja 01 - Mostrador 🟢 | Cajero: Carlos Vega" (NO repetir Sede Central).
- Der: Botones: [|||| Lector Código] [🎙️ Voz KIPU'S] [🔊 Sonidos].
2. Lector Código de Barras (Línea compacta):
- Input mono: "Escanear o digitar código..." + [Agregar] + [📷 Cámara].
3. Buscador Universal:
- Input con lupa + micrófono IA + chips: [Arroz Costeño] [Leche Gloria] [Inca Kola] [Aceite Primor].
4. Categorías (Pills con scroll horizontal):
- [Todos los productos] (Activo violeta #431B94) [Abarrotes] [Bebidas] [Limpieza] [Golosinas].
5. CATÁLOGO EN FILAS ALARGADAS (No tarjetas cuadradas):
- Filas horizontales (Alto 44px, padding 6px 12px, borde #DCE2EB, fondo #FFFFFF, radio 6px):
  * Izq: Badge SKU mono (#EDF2F7, ej. "ACE-PRI-90") + Nombre "Aceite Primor Clásico 900ml" negrita + "Abarrotes • UNIDAD • 7750123456789".
  * Der: Badge stock ("4 disp." ámbar, "45 disp." verde o "Agotado" rojo) + Precio mono bold "S/ 9.50" + Botón [+] o pill "2 en carrito" (#431B94).
- Muestra 8-10 filas compactas visibles a la vez sin scroll excesivo.

COLUMNA DERECHA (Panel Carrito y Cobro, Ancho fijo 380px):
- Header: Icono carrito + "Carrito de Venta (3 items)" + [Vaciar].
- Cliente: "Consumidor Final (00000000)" + [Cambiar cliente].
- Items: 3 filas con steppers `[-] [ 2 ] [+]`, subtotal y botón eliminar rojo.
- Desglose contable: Subtotal gravado S/ 72.88 | IGV (18%) S/ 13.12 | Descuento S/ 0.00.
- TOTAL GIGANTE: "TOTAL A COBRAR: S/ 86.00" (24px bold mono).
- Botón principal: "COBRAR (S/ 86.00) [F12]" (Alto 46px, fondo #431B94, blanco negrita).
```

---

## 📌 PARTE 3: MODALES DE COBRO SUNAT Y TICKET TÉRMICO (1,778 caracteres)
*Copia y pega este bloque en el tercer prompt de Figma:*

```text
[PROMPT PARTE 3/6: MODALES DE COBRO SUNAT Y TICKET TÉRMICO]
Diseña en Figma los 2 modales clave del cobro en overlay oscuro (#111827/60), 100% Auto-layout.

1. MODAL COBRO MULTIMÉTODO (Ancho 620px, radio 10px, fondo #FFFFFF):
- Header: Título "Completar Venta y Cobro" + correlativo "B001-00004219".
- Caja de Total (Fondo violeta suave #F3EFFB, borde #431B94/20, radio 8px, padding 10px):
  * "Total a Cobrar:" + Cifra gigante font-mono 28px bold #431B94: "S/ 86.00".
- Tipo Comprobante: [Boleta (03)] (Activo violeta) | [Factura (01)] | [Nota de Venta (00)].
- Métodos de Pago (Tabs): [💵 Efectivo] (Activo) | [📱 Yape/Plin] | [💳 Tarjeta] | [⏳ Crédito] | [🔀 Mixto].
- Contenido Efectivo:
  * Input "Monto Recibido": "S/ 100.00" (Autofoco, font-mono 18px).
  * Billetes rápidos: [Exacto] [S/ 10] [S/ 20] [S/ 50] [S/ 100] (Activo).
  * Panel Vuelto (Fondo verde #F0FDF4, borde #16A34A/30, radio 6px, padding 8px):
    - "Vuelto al Cliente: S/ 14.00" (Verde #15803D, font-mono 18px bold).
- Footer: [Cancelar [Esc]] + Botón gigante [EMITIR COMPROBANTE (ENTER)] (#431B94, blanco).

2. TICKET TÉRMICO SUNAT (Ancho 380px, estilo papel térmico 80mm):
- Header: Logo Kipu's + "DISTRIBUIDORA LOS ANDES S.A.C." + "RUC: 20601234567".
- Datos: "BOLETA: B001-00004219" + Fecha/Hora: 13/11/2026 10:45 AM + Cajero: Carlos Vega.
- Tabla con líneas punteadas:
  * 2 x Aceite Primor 900ml | S/ 9.50 | S/ 19.00
  * 1 x Arroz Costeño 5kg | S/ 23.50 | S/ 23.50
  * 1 x Fardo Leche Gloria | S/ 43.50 | S/ 43.50
- Desglose: Op. Gravada: S/ 72.88 | IGV (18%): S/ 13.12 | TOTAL: S/ 86.00.
- Pago: Efectivo: S/ 100.00 | Vuelto: S/ 14.00.
- Código QR SUNAT (90x90px) + Hash SHA-256 + "Representación impresa autorizada por SUNAT".
- Acciones: [🖨️ Imprimir] [📲 WhatsApp] [📥 PDF] [Nueva Venta (Esc)].
```

---

## 📌 PARTE 4: FLUJO ROL CAJERO — CAJA, TURNOS Y HISTORIAL (1,802 caracteres)
*Copia y pega este bloque en el cuarto prompt de Figma:*

```text
[PROMPT PARTE 4/6: FLUJO ROL CAJERO (CAJA, TURNOS Y HISTORIAL)]
Diseña en Figma las pantallas de caja y comprobantes del Cajero (1440x900px, 100% Auto-layout).

1. MODAL APERTURA DE CAJA (Ancho 480px, centrado):
- Datos: Sede Central | Caja 01 - Mostrador | Cajero: Carlos Vega | Fecha actual.
- Input monto inicial: "Monto Inicial en Gaveta (S/): [ 150.00 ]" (Font-mono 20px bold).
- Notas opcionales + Botón primario: [ABRIR TURNO DE CAJA] (#431B94, blanco).

2. HISTORIAL DE COMPROBANTES (Pestaña / Sub-botón de navegación):
- Header: Título "Historial de Comprobantes" + badge "Turno Activo".
- Filtros rápidos: [Todos] [Boletas] [Facturas] [Notas] + Buscador correlativo.
- Tabla DataTableERP:
  * Columnas: Hora | N° Comprobante | Cliente | Medio Pago | Total (S/) | Estado SUNAT | Acciones.
  * Filas:
    - 10:45 AM | B001-00004219 | Consumidor Final | Efectivo | S/ 86.00 | Verde "Aceptado" | [🖨️] [❌]
    - 10:32 AM | F001-00001048 | Inversiones Huallaga | Yape | S/ 320.00 | Verde "Aceptado" | [🖨️] [❌]
    - 10:15 AM | B001-00004218 | María Rodríguez | Tarjeta | S/ 45.00 | Verde "Aceptado" | [🖨️] [❌]
- Paginación: "Mostrando 15 comprobantes del turno".

3. MODAL MOVIMIENTO CAJA CHICA (Ancho 460px):
- Selector tipo: [📥 Entrada] | [📤 Salida / Gasto Menor] (Activo).
- Monto: "S/ 25.00" + Motivo: "Compra de cinta y bolsas para mostrador".
- Botón: [REGISTRAR MOVIMIENTO].

4. PANTALLA ARQUEO Y CIERRE DE TURNO:
- Resumen: Ventas Efectivo: S/ 1,240.00 | Yape: S/ 480.00 | Tarjeta: S/ 620.00.
- Arqueo Ciego: Conteo físico (Billetes 100: [12] | 50: [4] | 20: [7] | Monedas: [50]).
- Comparativa: Total Sistema S/ 1,390.00 vs Total Contado S/ 1,390.00.
- Balance: Chip verde destacado "Diferencia: S/ 0.00 (Cuadre Exacto)".
- Botón: [GENERAR REPORTE Z Y CERRAR TURNO] (#431B94, blanco).
```

---

## 📌 PARTE 5: FLUJO ROL ALMACENERO — INVENTARIO, KARDEX Y RECEPCIÓN (1,823 caracteres)
*Copia y pega este bloque en el quinto prompt de Figma:*

```text
[PROMPT PARTE 5/6: FLUJO ROL ALMACENERO (INVENTARIO, KARDEX Y RECEPCIÓN)]
Diseña en Figma las pantallas del Almacenero y Supervisor (1440x900px, 100% Auto-layout).

1. PANTALLA INVENTARIO GENERAL:
- Sidebar: Inicio, Inventario (Activo), Compras, Reportes.
- Header: Título "Control de Inventario" + [+ Nuevo Producto] + [Auditoría Conteo].
- 3 KPI Cards:
  * "Total Productos: 856" (Azul)
  * "En Stock Mínimo: 14" (Badge ámbar #FFFBEB, texto #B45309)
  * "Agotados: 3" (Badge rojo #FEF2F2, texto #B91C1C)
- Filtros: Buscador SKU/nombre + Categoría + Ubicación + Switch "Solo alertas".
- Tabla DataTableERP:
  * Columnas: SKU | Producto | Categoría | Ubicación | Stock (Semáforo) | Mín | Costo (S/) | Precio (S/) | Acciones.
  * Filas:
    - ACE-PRI-90 | Aceite Primor 900ml | Abarrotes | A-02 | Ámbar "4 disp." | 10 | S/ 7.20 | S/ 9.50 | [Kardex] [✏️]
    - ARR-COS-01 | Arroz Costeño 1kg | Abarrotes | A-01 | Verde "45 disp." | 15 | S/ 3.80 | S/ 4.80 | [Kardex] [✏️]
    - GAS-COC-50 | Coca Cola 500ml | Bebidas | F-01 | Rojo "0 disp." | 12 | S/ 2.50 | S/ 3.50 | [Kardex] [✏️]

2. MODAL ESCÁNER CÁMARA (Ancho 460px):
- Visor de cámara en vivo con visor rectangular y línea láser roja horizontal.
- Detección automática EAN-13/QR + botón [Capturar manual] + [Cerrar].

3. MODAL KARDEX FÍSICO-VALORIZADO (Ancho 720px):
- Header: "Kardex Valorizado: Arroz Costeño 1kg" + Stock: 45 UND.
- Tabla Kardex (Promedio Ponderado):
  * Columnas: Fecha | Doc. Ref | Concepto | Entrada | Salida | Saldo (Cant/Costo/Total).
  * Fila 1: 10/11/26 | F001-892 | Compra Proveedor | +50 / S/ 190.00 | - | 50 / S/ 3.80 / S/ 190.00
  * Fila 2: 13/11/26 | B001-4219 | Venta POS | - | -5 / S/ 19.00 | 45 / S/ 3.80 / S/ 171.00

4. PANTALLA RECEPCIÓN DE COMPRA:
- Proveedor RUC + Orden #OC-0024 + Cotejo Solicitado vs Recibido + [INGRESAR ALMACÉN].
```

---

## 📌 PARTE 6: FLUJO ROL ADMINISTRADOR — DASHBOARD, KIPU'S IA Y SUNAT (1,815 caracteres)
*Copia y pega este bloque en el sexto prompt de Figma:*

```text
[PROMPT PARTE 6/6: FLUJO ADMINISTRADOR (DASHBOARD, KIPU'S IA Y SUNAT)]
Diseña en Figma las pantallas estratégicas del Administrador y Dueño (1440x900px, 100% Auto-layout).

1. DASHBOARD PRINCIPAL DE NEGOCIO:
- Filtros: Rango [Hoy | Esta Semana | Este Mes] + Sucursal [Consolidado | Sede Central | Tienda Mostrador].
- 4 KPI Cards (Grid 4 cols):
  * "Ventas del Día": S/ 18,450.00 (Chip verde "+14.2% vs ayer" | 142 transacciones).
  * "Margen Bruto": 32.8% (S/ 6,051.60 util. estimada).
  * "Ticket Promedio": S/ 48.20.
  * "Alertas Críticas": 4 ítems agotados | 2 SUNAT pendientes.
- Gráfico Ventas (Recharts, 2 series):
  * Serie 1 Violeta #431B94: Ventas de hoy por hora (área suave).
  * Serie 2 Cian #02A1BC: Comparativa semana anterior (línea punteada).
- Widgets (2 cols):
  * Izq: "Top 5 Más Vendidos": Barras progreso (Aceite Primor, Arroz Costeño, Leche Gloria, Inca Kola).
  * Der: "Últimas Transacciones": Lista con hora, comprobante, monto y badge SUNAT "Aceptado".

2. SHEET LATERAL KIPU'S IA (Ancho 440px, deslizable der):
- Header degradado violeta: ✨ "KIPU'S IA - Asistente de Decisiones".
- Chips de consulta:
  * [¿Qué productos reabastecer hoy?]
  * [¿Cuál es mi margen neto tras gastos?]
  * [Sugerir combo promocional en Abarrotes]
- Tarjeta de Predicción de Demanda:
  * "Alerta: 'Aceite Primor 900ml' se agotará en 48 horas al ritmo actual (45 unid/día)."
  * Botón directo: [Generar Orden de Compra Sugerida] (#431B94, blanco).

3. PANTALLA CONFIGURACIÓN Y SUNAT:
- Tabs: [Usuarios y Roles (RBAC)] | [Empresa y Sucursales] | [Facturación SUNAT].
- Tab SUNAT:
  * RUC emisor, Razón Social, Usuario SOL, Clave SOL.
  * Certificado Digital (.pfx) con check verde "Válido hasta Dic 2027".
  * Switch: [Ambiente Producción SUNAT / OSE].
  * Series: Boletas "B001", Facturas "F001", Notas "NV01".
```

---

## 🚀 Cómo utilizarlos paso a paso:
1. Copia el contenido de la **Parte 1** y pégalo en la barra de prompts de Figma AI. Presiona Enter.
2. Espera que Figma genere el Design System y el Shell.
3. Copia y pega sucesivamente la **Parte 2**, luego la **Parte 3**, **Parte 4**, **Parte 5** y **Parte 6**.
4. ¡Cada bloque entra holgadamente en el límite de 2,000 caracteres sin cortarse y manteniendo el 100% de los detalles!
