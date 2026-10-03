---
name: kipus-ui
description: Reglas de diseño UI/UX para KIPU'S ERP (React 18, TypeScript, Tailwind 3, shadcn/Radix, Recharts). Usar siempre que se cree, rediseñe o revise una pantalla, componente, formulario, tabla, gráfico o texto de interfaz, para que el resultado parezca diseñado por una persona que conoce el negocio y no generado por IA.
---

# KIPU'S ERP — Skill de diseño frontend

## 1. Para quién y para qué se diseña

KIPU'S ERP es una herramienta de trabajo para comerciantes MYPE de Tingo María. Se usa 8 horas al día, en PC y en celular, para vender, controlar caja, inventario, kardex y comprobantes. Eso define todo:

- La interfaz sirve para trabajar rápido, no para impresionar.
- Se prioriza densidad legible, claridad de números y estados evidentes.
- Cada pantalla debe responder: qué hago aquí, cuál es la acción principal, qué pasó después de hacerla.
- Si un elemento visual no ayuda a leer, decidir o actuar, se elimina.

Principio rector: una interfaz parece hecha por una persona cuando es específica (habla del negocio real, usa datos reales, tiene decisiones consistentes) y contenida (pocos colores, pocos estilos, mucho orden). Parece hecha por IA cuando es genérica, decorada y repetitiva.

## 2. Lista de prohibiciones (los delatores de IA)

No usar nunca, salvo que el usuario lo pida explícitamente:

1. Degradados en texto, en botones, en fondos de tarjeta o en bordes.
2. Combinación morado-cian o índigo-rosa como estética general.
3. Glassmorphism, blur decorativo, blobs, esferas flotantes, rombos o formas abstractas de fondo.
4. Tríos de tarjetas "icono + título corto + frase vaga" (ej. "Simple / Seguro / Siempre contigo").
5. Un icono dentro de un círculo de color al lado de cada título o dato.
6. Títulos con peso 800/900, textos gigantes en negrita extrema, o dos líneas de titular donde la segunda tiene otro color.
7. Botones tipo píldora con sombra de color y texto en MAYÚSCULAS.
8. Sombras grandes y difusas en todo; radios de 16 a 24 px en todo.
9. Emojis como decoración de interfaz (no usarlos en botones, títulos ni estados vacíos).
10. Frases motivacionales o de marketing dentro del producto: "Impulsa tu negocio", "Bienvenido de nuevo", "Potencia tu gestión".
11. Dashboards con 4 tarjetas KPI idénticas (icono, número grande, porcentaje verde) como única composición.
12. Datos de ejemplo falsos y redondos (1,234 usuarios, 99.9%, "Lorem ipsum", "John Doe").
13. Animaciones de entrada en cada elemento, rebotes, parallax, hover que escala todo.
14. Un componente nuevo con estilo propio cuando ya existe uno en `components/ui`.

## 3. Sistema de color

Los tokens viven en `kipus-tokens.css` (bloque para `global.css`). Los componentes solo usan tokens, nunca hex sueltos.

### Separar marca de interfaz

La paleta de marca (índigo `#2A2372`, cian `#06B6D4`, púrpura `#7C3AED`, rosa `#EC4899`) es identidad: se usa en el logotipo, el favicon y materiales de marca, y puede aparecer en un detalle puntual (pantalla de carga, estado vacío de la primera vez). No es la paleta de trabajo.

La interfaz del ERP usa estos tokens:

- Superficies: `--background` `#F4F6F9`, `--card` blanco.
- Texto: `--foreground` `#111827`; `--muted-foreground` `#556274` (texto secundario, más oscuro que `#64748B` para cumplir contraste sobre el fondo gris).
- Bordes: `--border` `#DCE2EB` para tarjetas, tablas y divisores; `--input` `#8391A5` para el borde de los campos (3.2:1 sobre blanco, el usuario ve dónde escribir).
- Acento: `--primary` `#1855C6` para botón principal, navegación activa, enlaces y foco; `--primary-soft` `#EEF3FF` para fondo de ítem activo y badge informativo.

### Semánticos de negocio: base y texto separados

Cada color semántico tiene tres tokens. Se usan según el rol, no al azar:

| Significado | Relleno / icono | Texto | Fondo suave |
|---|---|---|---|
| Éxito: venta cerrada, ingreso, stock suficiente, comprobante emitido | `success` `#16A34A` | `success-text` `#15803D` | `success-soft` `#F0FDF4` |
| Advertencia: por agotarse, pendiente, arqueo sin cerrar | `warning` `#F59E0B` | `warning-text` `#B45309` | `warning-soft` `#FFFBEB` |
| Peligro: gasto, salida de caja, agotado, error | `destructive` `#DC2626` | `danger-text` `#B91C1C` | `danger-soft` `#FEF2F2` |

### Reglas

1. Un solo color de acento en la UI: `--primary`. Todo lo demás es neutro.
2. El ámbar (`warning`) nunca se usa como color de texto: tiene unos 2:1 de contraste. Para texto de advertencia, `warning-text` sobre `warning-soft`.
3. El verde `success` base solo en iconos y rellenos; montos y texto en verde usan `success-text`.
4. Los semánticos tienen un único significado y no se usan como decoración.
5. El color nunca es el único indicador de estado: acompañar con texto o icono (badge "Stock bajo", no solo un punto ámbar).
6. Badges y alertas: fondo `*-soft` + texto `*-text`. Nunca texto claro sobre fondo saturado dentro de tablas.
7. Contraste mínimo WCAG AA: 4.5:1 para texto normal, 3:1 para texto grande, bordes de campos e iconos informativos.
8. Texto secundario (fechas, descripciones, etiquetas pequeñas) con `--muted-foreground`; no usar grises más claros.
9. Modo oscuro: definido en el bloque `.dark` de `kipus-tokens.css` con superficies en tres escalones (fondo, tarjeta, elevado), sin negro puro. Activarlo solo después de revisarlo en todas las pantallas; si no se va a usar aún, no se expone el selector.
10. Un color nuevo se agrega primero como token en `global.css` y `tailwind.config`, nunca como hex suelto en un componente.

## 4. Tipografía

- Familia única: Inter, instalada en local con `@fontsource-variable/inter` (importar en `main.tsx`). No cargarla desde Google Fonts: en conexión inestable el texto salta o tarda, y en Tingo María eso importa. Pila de respaldo: `system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial`.
- Pesos permitidos: 400, 500 y 600. No usar 700 ni 800 en la UI.
- Números de dinero, cantidades, stock y columnas de montos: siempre `tabular-nums`, alineados a la derecha.
- Códigos SKU, RUC, DNI y series de comprobante (B001-000482): `font-mono` con la monoespaciada del sistema (`ui-monospace`), sin cargar fuentes extra.
- Escala fija (no inventar tamaños):
  - Página (h1): `text-2xl font-semibold` (24 px)
  - Sección (h2): `text-lg font-semibold` (18 px)
  - Subsección / título de tarjeta: `text-base font-medium` (16 px)
  - Cuerpo y celdas de tabla: `text-sm` (14 px)
  - Etiquetas, ayudas, metadatos: `text-xs text-muted-foreground` (12 px)
- Campos de formulario (`input`, `select`, `textarea`): 16 px en móvil para evitar el zoom automático de iOS, 14 px desde `md`.
- Máximo 3 tamaños distintos por pantalla además de los números destacados.
- Interlineado: `leading-tight` en títulos, `leading-normal` en cuerpo.
- No usar `tracking-tight` ni `uppercase` salvo en encabezados de tabla muy pequeños (`text-xs uppercase tracking-wide`) y de forma consistente.
- Títulos en minúsculas normales (primera letra mayúscula), no en Title Case ni en MAYÚSCULAS.
- Moneda: `S/ 1,250.00` (símbolo, espacio, separador de miles con coma, 2 decimales). Un único helper de formato en todo el proyecto.

## 5. Espaciado, rejilla, radios, sombras y bordes

- Escala de 4 px: 4, 8, 12, 16, 24, 32, 48. En Tailwind: `1, 2, 3, 4, 6, 8, 12`. No usar valores arbitrarios (`p-[13px]`).
- Espacio entre secciones de página: 24 o 32. Dentro de tarjeta: 16 o 24. Entre campo y campo en formulario: 16.
- Radios: un solo radio base (`rounded-md`, 6 px) para botones, inputs, badges y tarjetas; `rounded-lg` (8 px) para modales y paneles grandes. Nada de `rounded-2xl`/`rounded-3xl`.
- Bordes de 1 px con `--border` como separador principal. Preferir borde a sombra.
- Sombras: solo `shadow-sm` en tarjetas elevadas y `shadow-md` en menús, popovers y modales. Nunca sombras de color.
- Ancho de contenido: formularios hasta `max-w-2xl`; páginas de datos a ancho completo con márgenes laterales 16 (móvil) y 24 (escritorio).
- Alinear a una rejilla: si dos elementos parecen casi alineados, deben estarlo del todo.

## 6. Componentes (usar siempre shadcn/Radix existentes)

Antes de crear algo, buscar en `components/ui`. Extender con CVA, no duplicar.

**Botones**
- Una sola acción primaria por vista (`variant="default"`, color primary, sólido).
- Secundaria: `outline`. Terciaria: `ghost`. Destructiva: `destructive`, siempre con confirmación en diálogo.
- Altura 36 px en escritorio (`h-9`), 44 px en móvil para acciones táctiles.
- Texto con verbo concreto: "Registrar venta", "Guardar producto", "Cerrar caja". Nada de "Enviar" ni "Aceptar" genéricos.
- Estado de carga: spinner pequeño dentro del botón, texto cambia ("Guardando…") y queda deshabilitado.

**Inputs y formularios (React Hook Form + Zod)**
- Etiqueta visible encima del campo, siempre. El placeholder es ejemplo, no etiqueta.
- Sin iconos decorativos dentro del input, salvo buscador y mostrar/ocultar contraseña.
- Error debajo del campo, en rojo, con mensaje accionable ("El RUC debe tener 11 dígitos"), nunca "Campo inválido".
- Validar al salir del campo (`onBlur`) y al enviar. Mover el foco al primer campo con error.
- Marcar campos opcionales con "(opcional)"; no usar asteriscos rojos en todo.
- Mensajes de Zod en español, escritos para el comerciante, no técnicos.
- Teclado móvil correcto: `inputMode="numeric"` para cantidades, DNI y RUC; `inputMode="decimal"` para precios.

**Tablas (la pieza central de un ERP)**
- Encabezado fijo (sticky), filas de 40 a 44 px, texto `text-sm`.
- Montos y cantidades a la derecha con `tabular-nums`; texto a la izquierda; estados con badge.
- Acciones por fila: máximo 2 visibles, el resto en menú `…` (DropdownMenu).
- Búsqueda y filtros arriba, a la izquierda; acción principal ("Nuevo producto") arriba, a la derecha.
- Paginación o scroll virtual, con conteo ("Mostrando 1–20 de 143").
- Ordenamiento visible en columnas relevantes. Sin zebra salvo tablas muy anchas; preferir hover sutil.
- En móvil: columnas prioritarias + fila expandible, o lista de tarjetas compactas. No scroll horizontal oculto sin indicio visual.

**Tarjetas**
- Solo cuando agrupan contenido relacionado. No envolver todo en tarjetas.
- Sin tarjeta dentro de tarjeta. Sin icono decorativo en el título.
- Un KPI se muestra como: etiqueta pequeña, valor grande con `tabular-nums`, y comparación solo si es real y útil (ej. "vs. ayer S/ 320.00").

**Badges**
- Texto corto y literal ("Pagado", "Pendiente", "Anulado", "Stock bajo"). Máximo 4 colores semánticos.

**Modales (Dialog)**
- Solo para decisiones cortas o formularios breves. Formularios largos van en página o Sheet lateral.
- Título claro, botón primario a la derecha, "Cancelar" a la izquierda del primario, cierre con Esc y clic fuera salvo cambios sin guardar.

**Notificaciones (Sonner)**
- Éxito: confirmación breve con dato útil ("Venta B001-000482 registrada · S/ 85.00").
- Error: qué falló y qué hacer. Duración mayor que el éxito y con botón "Reintentar" si aplica.
- No usar toast para errores de validación de formulario.

**Navegación**
- Sidebar con módulos agrupados por flujo de trabajo (Vender, Inventario, Compras, Caja, Reportes, Configuración). Ítem activo con fondo suave y texto primary, no con barra de color llamativa.
- Breadcrumb o título claro en cada página. Atajo de búsqueda global si el volumen de datos lo justifica.

## 7. Iconos (Lucide)

- Tamaño 16 px en botones y tablas, 20 px en navegación, `strokeWidth` 1.75 consistente en todo el proyecto.
- Un icono se usa si ayuda a reconocer rápido una acción o categoría; si el texto basta, sin icono.
- Mismo icono = mismo significado en todo el sistema (un mapa central de iconos por módulo y acción).
- Nunca iconos dentro de círculos de color como adorno.

## 8. Gráficos (Recharts)

- Elegir el gráfico por la pregunta: tendencia en el tiempo → línea; comparar categorías → barras; composición con pocas partes → barra apilada o lista con porcentajes. Evitar tortas con más de 4 partes y 3D de cualquier tipo.
- Un color por serie, tomado de tokens; ingresos en verde y egresos en rojo solo cuando esa semántica aplique, en otros casos usar primary y un neutro.
- Ejes con números `tabular-nums`, formato `S/`, sin líneas de cuadrícula pesadas (solo horizontales, color `--border`).
- Tooltip con fecha formateada en español, valores con moneda y etiqueta clara.
- Siempre título que diga qué mide y en qué periodo ("Ventas diarias, últimos 30 días").
- Estados: cargando (skeleton del tamaño del gráfico), sin datos (mensaje + acción), error (mensaje + reintentar).
- Responsive con `ResponsiveContainer`; en móvil reducir marcas del eje.

## 9. Estados de la interfaz (los que más delatan una interfaz improvisada)

Cada vista con datos debe tener diseñados los cuatro estados:

1. **Cargando:** skeletons con la forma del contenido final, no spinner a pantalla completa.
2. **Vacío:** una frase concreta + la acción que lo resuelve. Ejemplo: "Aún no registraste productos. Agrega el primero o importa tu lista desde Excel." Sin ilustraciones genéricas.
3. **Error:** qué pasó, si se perdió algo, qué hacer ("No se pudo cargar el kardex. Revisa tu conexión e inténtalo de nuevo"), con botón de reintento.
4. **Éxito:** confirmación sobria y el siguiente paso natural (ej. "Imprimir comprobante" tras una venta).

Además: deshabilitar botones durante envío, evitar doble envío, conservar lo escrito si falla la red, confirmar antes de acciones irreversibles (anular comprobante, cerrar caja).

## 10. Escritura de interfaz (copy) en español peruano

- Tono: claro, directo, respetuoso, de tú. Sin jerga técnica ni anglicismos innecesarios.
- Usar el vocabulario del comerciante: venta, boleta, factura, caja, arqueo, stock, proveedor, kardex, cliente. No "transacción", "entidad" ni "recurso".
- Frases cortas con verbo. Ejemplos correctos: "Cerrar caja", "Producto sin stock", "Falta el RUC del cliente".
- Evitar exclamaciones, frases de marketing y relleno ("¡Bienvenido de nuevo!", "Todo listo").
- Mensajes de error: causa + acción. Nunca "Ocurrió un error inesperado" a secas.
- Fechas con `date-fns` y locale `es`: "03 oct 2026, 11:18". Horas en formato 24 h salvo que el usuario prefiera otro.
- Datos de ejemplo y de demo: realistas del contexto (productos de bodega, ferretería, farmacia, precios coherentes en soles, nombres peruanos reales, RUC de 11 dígitos con formato válido).

## 11. Movimiento

- Transiciones de 100 a 200 ms con `ease-out`, solo para: abrir/cerrar modales y menús, hover/focus, expandir filas, aparición de toasts.
- Sin animaciones de entrada en listas ni tablas, sin rebotes, sin movimiento continuo decorativo.
- Respetar `prefers-reduced-motion`: desactivar transiciones no esenciales.

## 12. Accesibilidad (mínimos no negociables)

- Todo operable con teclado, orden de tabulación lógico, foco visible (`ring-2 ring-primary ring-offset-2`).
- Áreas táctiles de al menos 44×44 px en móvil.
- Etiquetas asociadas a inputs (`htmlFor`/`FormLabel`), `aria-invalid` y `aria-describedby` en errores.
- Iconos solos con `aria-label`. Tablas con encabezados semánticos.
- Los diálogos de Radix ya manejan foco y Esc: no reemplazarlos con divs.
- Probar a 200% de zoom y con lector de pantalla básico en los flujos críticos (login, venta, cierre de caja).

## 13. Responsive

- Diseñar primero para el flujo de uso real: el cajero usa celular o PC en mostrador, el administrador usa PC.
- Puntos de quiebre de Tailwind estándar; sidebar colapsable en `md`, drawer en móvil.
- Acciones principales siempre alcanzables con el pulgar en móvil (barra inferior o botón fijo cuando haya flujo largo, como cobrar una venta).
- Ninguna pantalla con scroll horizontal de página completa.

## 14. Guía por pantalla clave

**Login**
- Un solo bloque centrado o dos columnas con la columna de marca sobria: logo, una frase concreta sobre lo que hace el sistema y, si existe, una captura real del dashboard o una foto real del comercio local. Sin ilustraciones abstractas ni tarjetas de beneficios.
- Formulario: usuario o correo, contraseña con mostrar/ocultar, botón sólido "Iniciar sesión", un único enlace "¿Olvidaste tu contraseña?".
- Cuentas demo discretas en una línea bajo el formulario, con el rol y el usuario consistentes entre sí.
- Error de credenciales visible bajo el formulario y estado de carga en el botón.

**Punto de venta / Nueva venta**
- Búsqueda de producto siempre enfocada, con soporte de lector de código de barras.
- Lista de ítems con cantidad editable, precio y subtotal alineado a la derecha; total grande y fijo.
- Acción primaria única: "Cobrar". Medio de pago con selector simple. Comprobante (boleta/factura) como opción clara.
- Todo el flujo debe poder hacerse con teclado en escritorio.

**Inventario y kardex**
- Tabla densa con filtros por categoría y estado de stock; badges semánticos de stock (suficiente, bajo, agotado).
- Kardex en orden cronológico con entrada, salida y saldo en columnas numéricas alineadas.

**Caja**
- Estado de caja siempre visible (abierta/cerrada, monto actual). Apertura y cierre como flujos guiados con arqueo y diferencia destacada.

**Dashboard**
- Empezar por lo accionable: ventas de hoy, caja actual, productos por agotarse, comprobantes pendientes. Variar la composición (no cuatro tarjetas iguales), con un gráfico principal y listas cortas con acciones.

## 15. Reglas de código para que el diseño se mantenga

- Colores, radios y sombras solo desde tokens de Tailwind/CSS variables; prohibido hex o valores arbitrarios en componentes.
- Variantes con CVA; no duplicar clases largas en cada archivo. Usar `cn()` para componer.
- Un componente de formato central: `formatMoney`, `formatDate`, `formatDocumento` (RUC/DNI). Ningún componente formatea por su cuenta.
- Tipos de TypeScript del dominio (Producto, Venta, Comprobante, MovimientoKardex) compartidos entre formulario, tabla y gráfico.
- Evitar `style={{}}` inline y `!important`.
- Cada componente nuevo nace con sus estados (hover, focus, disabled, loading, error) resueltos.

## 16. Proceso de trabajo al diseñar o revisar una pantalla

1. Identificar el usuario (cajero, administrador, almacenero) y la tarea principal de la pantalla.
2. Definir la acción primaria única y el orden de lectura (qué se ve primero, segundo, tercero).
3. Reutilizar componentes de `components/ui` y patrones de pantallas existentes.
4. Escribir primero el copy real y los datos de ejemplo realistas, después maquetar.
5. Aplicar escala de espaciado, tipografía y color de las secciones 3 a 5.
6. Diseñar los cuatro estados (cargando, vacío, error, éxito).
7. Verificar teclado, foco, contraste y vista móvil.
8. Pasar el checklist final.

## 17. Checklist final antes de entregar

Marcar cada punto. Si uno falla, corregir antes de entregar.

- [ ] Hay una sola acción primaria visible por vista.
- [ ] No hay degradados, glassmorphism, blobs ni sombras de color.
- [ ] Solo se usa el acento `--primary` y los tres colores semánticos con su significado.
- [ ] Tipografía Inter con pesos 400/500/600 y escala fija; montos con `tabular-nums` a la derecha; códigos en `font-mono`.
- [ ] Espaciados de la escala de 4 px y un único radio base.
- [ ] No hay tríos de tarjetas decorativas ni iconos en círculos de color.
- [ ] El copy es específico del negocio, en español peruano, con verbos concretos.
- [ ] Datos de ejemplo realistas (soles, RUC/DNI válidos en formato, productos locales).
- [ ] Existen estados de carga, vacío, error y éxito.
- [ ] Formularios con etiqueta visible, errores accionables y teclado móvil correcto.
- [ ] Foco visible, contraste AA, áreas táctiles de 44 px en móvil.
- [ ] Funciona en móvil sin scroll horizontal de página.
- [ ] Animaciones de 100–200 ms, solo funcionales.
- [ ] Se reutilizaron componentes existentes y tokens; no hay valores arbitrarios.

## 18. Referencias para calibrar el criterio

Observar cuánto vacío, cuán pocos colores y cuánta información real usan: Linear, Stripe Dashboard, Mercury, Vercel, GitHub, Notion. Para ERPs y POS: revisar cómo muestran tablas densas, estados de stock y flujos de cobro en productos como Odoo, Square y Shopify POS, y adaptar el patrón al contexto de Tingo María, no copiar el aspecto.