# Plan Maestro de Rediseño UI/UX — Módulo de Administración (KIPU'S ERP)

Este documento establece la estrategia y el plan de ejecución por fases para reorganizar el módulo de **Administración** del ERP. El objetivo es erradicar la sobrecarga visual (*cognitive overload*), mejorar la navegabilidad y construir una interfaz operativa eficiente para comerciantes y administradores, fundamentada estrictamente en las **10 Heurísticas de Usabilidad de Jakob Nielsen** y las **Leyes de la Gestalt**.

---

## 1. Fundamentos de Diseño Aplicados al ERP

```
                        ┌──────────────────────────────────────┐
                        │   PRINCIPIOS RECTORES DE DISEÑO      │
                        └──────────────────┬───────────────────┘
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                   ▼
┌─────────────────────────────────┐                       ┌─────────────────────────────────┐
│     HEURÍSTICAS DE NIELSEN      │                       │        LEYES DE LA GESTALT      │
├─────────────────────────────────┤                       ├─────────────────────────────────┤
│ • H1: Visibilidad del estado    │                       │ • Proximidad: Agrupación lógica │
│ • H2: Lenguaje del comerciante  │                       │ • Cerramiento: Regiones claras  │
│ • H3: Control y reversibilidad  │                       │ • Similitud: Consistencia visual│
│ • H4: Consistencia y estándares │                       │ • Continuidad: Lectura natural  │
│ • H5: Prevención de errores     │                       │ • Figura / Fondo: Contraste foco│
│ • H8: Minimalismo operativo     │                       │ • Simetría: Orden y balance     │
└─────────────────────────────────┘                       └─────────────────────────────────┘
```

### 1.1. Las 10 Heurísticas de Jakob Nielsen en KIPU'S ERP

| Heurística | Problema Actual en Administración | Solución Rediseñada |
|---|---|---|
| **H1: Visibilidad del estado del sistema** | El usuario no sabe si SUNAT está conectada o si el certificado digital (.pfx) está por vencer a menos que intente emitir un comprobante. | Se crea un **"Health Badge"** prominente en el submenú de Facturación (ej. `● SUNAT: Producción Activo` y `Certificado: Válido hasta 2027`). |
| **H2: Correspondencia con el mundo real** | Parámetros técnicos mostrados con jerga de base de datos o términos abstractos. | Términos comerciales peruanos directos: RUC, Razón Social, Serie de Boleta, Ticketeras, Turno de caja. |
| **H3: Control y libertad del usuario** | Modales masivos donde cancelar descarta cambios sin confirmación o donde no hay retorno visual claro. | Botones de "Cancelar" explícitos, paneles laterales tipo *Sheet* cerrables con `Esc` y confirmación antes de perder datos no guardados. |
| **H4: Consistencia y estándares** | Vistas embebidas dentro de pestañas horizontales con estilos heterogéneos y botones desalineados. | Patrón estandarizado: PageHeader unificado, una sola acción primaria violeta (`#431B94`), tablas con el mismo layout de columnas. |
| **H5: Prevención de errores** | Riesgo de modificar series de facturación y romper correlativos legales ante SUNAT. | Campos críticos protegidos con candado/confirmación (`Solo lectura` por defecto con botón "Modificar serie bajo advertencia"). |
| **H6: Reconocimiento antes que recuerdo** | Para asignar permisos a un cajero o vincular una sucursal, el usuario debe recordar IDs o formatos. | Selects descriptivos con autocompletado, badges de roles con etiquetas explícitas y previsualización gráfica. |
| **H7: Flexibilidad y eficiencia de uso** | Administrador tiene que hacer scroll infinito y cambiar de tabs para ver configuraciones comunes. | Submenús directos en el Sidebar, atajos de búsqueda rápida y filtros por rol de 1 solo clic. |
| **H8: Estética y diseño minimalista** | **Sobrecarga crítica:** Formularios con más de 25 campos visibles simultáneamente sin priorización. | **Divulgación Progresiva (*Progressive Disclosure*):** Mostrar resumen primero; campos avanzados ocultos en secciones colapsables o drawers. |
| **H9: Ayuda para reconocer errores** | Notificaciones flotantes genéricas ("Error al guardar") sin indicar qué input falló. | Mensajes de validación en rojo debajo del input correspondiente con instrucción de reparación ("El RUC debe tener 11 dígitos numéricos"). |
| **H10: Ayuda y documentación** | Ausencia de contexto en parámetros como el tamaño de papel térmico (80mm vs 58mm). | Tooltips discretos con icono `Info` y micro-textos explicativos orientados al comerciante. |

---

### 1.2. Leyes de la Gestalt para Reducir la Sobrecarga Visual

1. **Ley de Región Común y Cerramiento (*Common Region*):**
   * En lugar de apilar tarjetas dentro de tarjetas, cada subsección se delimita con bordes limpios de 1px (`border-border`), fondo blanco sobre lienzo `#F4F6F9`, con padding estricto de 16px o 24px.
2. **Ley de Proximidad (*Proximity*):**
   * Los inputs se agrupan por afinidad semántica (ej. bloque "Identificación Fiscal", bloque "Contacto comercial"). El espacio entre campos de un mismo grupo es de 12px; entre bloques distintos es de 24px.
3. **Ley de Similitud (*Similarity*):**
   * Todos los identificadores (RUC, DNI, Series de boleta, códigos de ticket) usan tipografía monoespaciada (`font-mono font-medium`). Los montos usan siempre `tabular-nums` alineados a la derecha.
4. **Ley de Figura y Fondo (*Figure/Ground*):**
   * Mayor diferenciación entre el fondo de trabajo (`bg-background`) y los elementos interactivos (`bg-card`), evitando efectos de desenfoque o degradados que fatigan la vista tras jornadas de 8 horas.

---

## 2. Nueva Arquitectura de Información del Módulo de Administración

En el Sidebar principal, el ítem **Administración** pasa a desplegar una estructura jerárquica de **5 submódulos especializados**:

```
🛡️ ADMINISTRACIÓN
 │
 ├── 👥 1. Usuarios y Roles          (/administracion?tab=usuarios)
 │    ├── Vista Principal: Directorio limpio de usuarios + métricas operativas
 │    ├── Drawer Lateral: Creación y edición (evita modales superpuestos)
 │    └── Filtro Rápido: Chips [Todos | Administradores | Cajeros | Almaceneros | Inactivos]
 │
 ├── 🏢 2. Empresa y Sucursales      (/administracion?tab=empresa)
 │    ├── Columna 1: Formulario fiscal (RUC, Razón Social, Dirección, Teléfono)
 │    └── Columna 2: Simulador interactivo en vivo del membrete de ticket impreso
 │
 ├── 🧾 3. Facturación y SUNAT       (/administracion?tab=sunat)
 │    ├── Health Card: Estado del servicio SUNAT / OSE + Vigencia del Certificado .pfx
 │    ├── Credenciales: Usuario SOL, Clave SOL, Entorno (Beta / Producción)
 │    └── Series Oficiales: Boletas (B001), Facturas (F001), Notas de Crédito (FC01/BC01)
 │
 ├── 🖨️ 4. Hardware y Periféricos    (/administracion?tab=hardware)
 │    ├── Selector visual de papel térmico (Botones interactivos: 80 mm | 58 mm)
 │    ├── Opciones de impresión: Corte automático, apertura de gaveta de dinero
 │    ├── Feedback Sonoro: Activación de pitido al registrar cobro exitoso
 │    └── Botón de Verificación: "Imprimir ticket de prueba real"
 │
 └── ⚙️ 5. Parámetros del Sistema    (/administracion?tab=sistema)
      ├── Impuestos y Moneda: Tasa IGV (18%), Moneda base (PEN S/)
      └── Políticas Operativas: Límites de descuento, alertas de stock crítico
```

---

## 3. Plan de Trabajo en Fases y Tareas (con Checklists)

### **Fase 1: Reestructuración de la Navegación y Enrutamiento (Sidebar)**
> **Meta:** Permitir acceso directo a cada subcategoría administrativa sin depender de pestañas internas anidadas ni saltos bruscos.

- [x] **Tarea 1.1:** Actualizar [routes.ts](file:///c:/Users/ThikPad/Desktop/PROYECTOS/ERP-KIPUS/ERP-KIPUS-FRONTEND/client/constants/routes.ts) para registrar los sub-ítems oficiales bajo `APP_ROUTES.ADMINISTRACION`:
  - [x] Sub-ítem `Usuarios y Roles` (`/administracion?tab=usuarios`, icono `Users`)
  - [x] Sub-ítem `Empresa y Sucursales` (`/administracion?tab=empresa`, icono `Building`)
  - [x] Sub-ítem `Facturación y SUNAT` (`/administracion?tab=sunat`, icono `FileCheck`)
  - [x] Sub-ítem `Hardware y POS` (`/administracion?tab=hardware`, icono `Printer`)
  - [x] Sub-ítem `Parámetros del Sistema` (`/administracion?tab=sistema`, icono `Settings`)
- [x] **Tarea 1.2:** Ajustar [AppSidebar.tsx](file:///c:/Users/ThikPad/Desktop/PROYECTOS/ERP-KIPUS/ERP-KIPUS-FRONTEND/client/components/layout/AppSidebar.tsx) para renderizar automáticamente los `subItems` de Administración cuando la ruta activa sea `/administracion`.
- [x] **Tarea 1.3:** Adaptar [AdministracionPage.tsx](file:///c:/Users/ThikPad/Desktop/PROYECTOS/ERP-KIPUS/ERP-KIPUS-FRONTEND/client/features/administracion/pages/AdministracionPage.tsx) para sincronizar bidireccionalmente el submenú activo con el query param `?tab=...` y renderizar el componente correspondiente.

---

### **Fase 2: Descomposición de Monolitos y Rediseño de Vistas Especializadas**
> **Meta:** Romper los archivos sobrecargados de 500 y 700 líneas en vistas modulares (<200 líneas cada una) enfocadas en un solo propósito.

- [x] **Tarea 2.1: Reorganización de `Usuarios y Permisos`**
  - [x] Eliminar tarjetas KPI estáticas que saturan el área vertical de la pantalla.
  - [x] Crear barra de herramientas ergonómica: `[ Buscador por DNI / Nombre ]` + `[ Chips de Rol ]` + `[ Botón: + Nuevo usuario ]`.
  - [x] Rediseñar la tabla de usuarios: Columnas estrictas (Usuario/Nombre, Rol con badge sutil, Sucursal asignada, Estado con punto verde/gris, Acciones `···`).
  - [x] Reemplazar el diálogo modal saturado (`UsuarioFormDialog.tsx`) por un **Drawer lateral (`Sheet`)**, permitiendo revisar la lista de usuarios de fondo mientras se edita uno.

- [x] **Tarea 2.2: Vista `Empresa y Sucursales` (Layout 2 Columnas con Feedback Inmediato)**
  - [x] Crear componente modular `client/features/configuracion/components/EmpresaConfigView.tsx`.
  - [x] Columna Izquierda: Formulario dividido por Gestalt en tarjetas semánticas (Identificación fiscal y Contacto).
  - [x] Columna Derecha: **Visualizador interactivo de Membrete térmico**. Conforme el usuario escribe el Nombre Comercial, RUC o Dirección, el ticket de ejemplo a la derecha se actualiza en tiempo real (Principio H1 y H2).

- [x] **Tarea 2.3: Vista `Facturación y SUNAT` (Control y Prevención de Errores)**
  - [x] Crear componente modular `client/features/configuracion/components/SunatConfigView.tsx`.
  - [x] **Health-Check Card:** Tarjeta superior con semáforo de conexión (`SUNAT Conectado / Certificado Válido`).
  - [x] **Credenciales SOL:** Campos protegidos tipo contraseña para Usuario SOL y Clave SOL con botón para probar credenciales antes de guardar.
  - [x] **Series y Correlativos:** Tabla clara de series autorizadas con indicador del último número emitido y advertencia visual para evitar saltos correlativos.

- [x] **Tarea 2.4: Vista `Hardware y Periféricos POS` (Configuración Táctil e Intuitiva)**
  - [x] Crear componente modular `client/features/configuracion/components/HardwarePosView.tsx`.
  - [x] Selector gráfico de formato de ticket: dos tarjetas seleccionables (80mm con vista ancha estándar, 58mm para ticketeras portátiles compactas).
  - [x] Controles de hardware en fila con toggle switches accesibles:
    - [x] Auto-imprimir comprobante al cobrar
    - [x] Corte automático de papel
    - [x] Pulso eléctrico para abrir gaveta
    - [x] Señal auditiva de cobro exitoso
  - [x] Botón primario de verificación: `[ 🖨️ Imprimir Ticket de Prueba ]` que valide el funcionamiento real del dispositivo conectado.

- [x] **Tarea 2.5: Vista `Parámetros del Sistema` (Configuración Esencial)**
  - [x] Crear componente modular `client/features/configuracion/components/ParametrosSistemaView.tsx`.
  - [x] Tarjetas condensadas para valores estables: Tasa de IGV (18% estándar Perú), Moneda principal (Soles PEN), Margen de ganancia sugerido en compras.

---

### **Fase 3: Refinamiento de Interacción y Ergonomía Visual**
> **Meta:** Pulir detalles sensoriales y de interacción según el Skill `kipus-ui`.

- [x] **Tarea 3.1:** Unificar botones y jerarquía de acciones: Solo un botón primario violeta (`bg-primary`) por vista. Las acciones de descarte o secundarias en variante `outline`.
- [x] **Tarea 3.2:** Integrar notificaciones contextuales con `Sonner`: Mensajes breves que confirmen la acción con datos reales (ej. *"Impresora configurada en 80mm"* en vez de *"Configuración guardada"*).
- [x] **Tarea 3.3:** Validaciones en tiempo real: Mensajes en español claro bajo el input con error antes del envío (RUC 11 dígitos, contraseñas mínimas, correo con formato).
- [x] **Tarea 3.4:** Compatibilidad y adaptación a pantallas de 1366x768px (pantallas comunes en mostradores de negocios comerciales de provincias).

---

### **Fase 4: Verificación, Pruebas y Control de Calidad**
> **Meta:** Garantizar cero errores de compilación, regresiones o inconsistencias de estado.

- [x] **Tarea 4.1:** Verificación de navegación mediante URLs directas (Deep linking: probar `?tab=hardware`, `?tab=sunat`, etc.).
- [x] **Tarea 4.2:** Ejecución de pruebas unitarias existentes con `pnpm test` (106 pruebas pasadas).
- [x] **Tarea 4.3:** Compilación en limpio con `pnpm build` asegurando bundle optimizado y cero warnings de TypeScript.

---

## 4. Matriz Comparativa: Antes vs. Después

| Aspecto | Estado Actual | Estado Propuesto (KIPU'S UI) |
|---|---|---|
| **Acceso a funciones** | 1 solo botón general en menú lateral que obliga a navegar entre tabs genéricos. | 5 submenús explícitos en el Sidebar con iconos y rutas directas. |
| **Carga visual** | 25 campos y 5 tarjetas amontonadas verticalmente en una sola página. | Vistas especializadas por temática con no más de 6-8 campos por vista. |
| **Formularios de usuarios** | Modal centrado de 16KB que bloquea toda la vista de datos. | Sheet lateral deslizable ergonómico con scroll independiente. |
| **Configuración de tickets** | Inputs de texto planos donde hay que adivinar cómo saldrá impreso. | Simulador en tiempo real del ticket térmico con preview inmediato. |
| **Facturación SUNAT** | Series mezcladas con datos de hardware y tasa de IGV. | Módulo exclusivo de SUNAT con health-check visual y protección contra errores. |
