# E4 — Compras y Abastecimiento

21/10/2026. Continuación sobre `main`. Se conservaron los cambios de E0–E3 y el archivo ajeno `docs/Nuevo documento de texto.txt`. Servidor existente `http://localhost:8080/`: HTTP 200 verificado sin lanzar instancias concurrentes. Prototipo frontend con persistencia aislada en `localStorage` (`KIPUS_ERP_STORAGE_V2`). Sin base de datos externa, Spring Boot, commit, push ni despliegue.

## Contrato de Compras y Recepción de Mercadería

- **Estados de Compra**: Se introduce el ciclo de vida de la orden con `EstadoCompra = 'RECIBIDO' | 'PENDIENTE' | 'ANULADO'`.
- **Registro en Estado PENDIENTE**:
  - Representa mercadería en tránsito u orden de compra colocada al proveedor pendiente de arribo al local.
  - **No altera el stock físico** en almacén (`stock` de productos permanece inalterado).
  - **No genera asientos de entrada en Kardex** (`movimientosKardex` no registra movimientos preliminares).
  - **No descuenta dinero de caja registradora** aun cuando el método de pago estipulado sea `EFECTIVO` (el egreso no se consuma hasta que la mercadería es recibida en el local).
  - Se registra con `fechaRecepcion: undefined` y observaciones opcionales del pedido.
- **Registro en Estado RECIBIDO**:
  - Representa abastecimiento inmediato ingresado físicamente al minimarket.
  - Incrementa automáticamente el stock de cada producto en inventario.
  - Genera asientos de `ENTRADA` en Kardex con referencia formal `Factura Proveedor ${serie}`.
  - Si el pago es `EFECTIVO`, descuenta el monto de `estadoCaja.saldoEfectivoEsperado` y registra el movimiento de caja de egreso por compra. Si no hay saldo suficiente en caja, la operación revierte atómicamente sin persistir la compra ni alterar el stock.
- **Transición de Recepción (`recepcionarCompra`)**:
  - Función transaccional en `erpStore`: recibe una compra previamente registrada en estado `PENDIENTE`.
  - Valida que la compra exista y esté efectivamente en estado `PENDIENTE` (idempotente: rechaza recepciones duplicadas o sobre compras anuladas/ya recibidas).
  - Ejecuta el ingreso de mercadería a almacén, genera los movimientos en Kardex y liquida el egreso en caja si el método fue efectivo.
  - Actualiza el estado a `RECIBIDO` y estampa `fechaRecepcion`.
  - Ante cualquier error o fallo de almacenamiento, ejecuta rollback total restaurando el estado previo de compras, inventario, Kardex y caja.
- **Validación del Proveedor y Factura**:
  - La compra exige un proveedor activo del directorio (`p.activo !== false`).
  - El RUC se normaliza y valida a 11 dígitos.
  - La serie o número de comprobante es obligatoria y se rechaza la duplicidad para el mismo proveedor.
  - Los ítems deben tener cantidades enteras positivas, precios de compra no negativos y coherencia aritmética entre subtotal y total.
- **Recomendación Inteligente de Compras**:
  - `sugerenciaComprasService` analiza productos agotados, productos en stock crítico por debajo del mínimo y productos con rotación en ventas.
  - Asocia automáticamente proveedores activos del directorio, excluyendo proveedores inactivos o dados de baja.

## Interfaz de Usuario y Flujos

- **Pantalla Compras (`ComprasPage.tsx`)**:
  - Se eliminaron las tarjetas decorativas con bordes de color y se reemplazaron por el componente estándar `SummaryStrip` (4 métricas clave: Compras del periodo, Mercadería recibida, Órdenes en tránsito y Proveedores activos).
  - Barra de herramientas con buscador por serie/proveedor, filtro visible de estado (`Todos`, `Recibidas`, `Pendientes`), proveedor y rango inclusivo de fechas de compra.
  - Acción principal visible clara: «Nueva orden de compra».
  - Banner dinámico de reposición inteligente cuando se detectan productos críticos, con acceso al modal de sugerencias.
  - **Acciones por fila en tabla**: máximo 2 acciones visibles directas:
    1. «Ver detalle» (botón ghost).
    2. «Recepcionar» (botón primario visible únicamente si la orden está en estado `PENDIENTE`).
    3. Menú contextual `...` con opciones complementarias («Ver detalle completo», «Recepcionar mercadería»).
  - **Vista móvil responsive (< 768px)**: tarjetas estructuradas con badge de estado (`StatusBadge`), datos del proveedor, conteo de ítems con formato tabular y botones accesibles de 44px de alto.
  - **Diálogo de confirmación de recepción (`AlertDialog`)**: modal de confirmación antes de recepcionar mercadería, detallando la cantidad exacta de unidades que ingresarán a almacén y alertando si se aplicará un egreso de caja en efectivo.
- **Formulario de Alta (`NuevaCompraDialog.tsx`)**:
  - Estructurado en 3 secciones legibles: «Datos del Proveedor y Comprobante», «Productos a Abastecer» y «Medio de Pago y Observaciones».
  - Selector de proveedor activo conectado al directorio; razón social y RUC en modo lectura para evitar discrepancias.
  - Selector de estado de compra: `Recibida` (ingreso inmediato) vs `Pendiente` (orden en tránsito).
  - Totalizadores en vivo con números tabulares (`tabular-nums`) para unidades totales y monto en soles.
  - Botón de guardado dinámico con estado de carga, bloqueo de doble clic (`submitting.current`) y mensaje adaptado: «Recepcionar y Abastecer (S/...)» o «Registrar orden pendiente (S/...)».
  - Preservación completa del borrador ante fallos de persistencia o errores de validación.
- **Modal de Detalle (`CompraDetalleModal.tsx`)**:
  - Muestra serie, proveedor, RUC, fechas de emisión y recepción, estado con `StatusBadge`, método de pago y observaciones.
  - Tabla de productos adquiridos con SKU, cantidad, precio unitario y subtotal.
  - Si la orden está pendiente, incluye un banner de advertencia y un botón directo «Marcar como recibida» que dispara el flujo transaccional de recepción.

## Archivos Modificados y Creados

- `client/features/compras/types/compras.types.ts`: tipos `EstadoCompra`, extensión de `Compra` y `NuevaCompraPayload` con `estado`, `fechaRecepcion`, `observaciones`.
- `client/features/compras/utils/compraValidation.ts`: validador formal de payload de compra, consistencia de importes, proveedor activo y serie única.
- `client/services/erp/erpStore.ts`: soporte para compras pendientes sin impacto en stock/kardex/caja, y función transaccional `recepcionarCompra` con rollback atómico.
- `client/features/compras/services/comprasService.ts`: exposición de `recepcionarCompra`.
- `client/features/compras/services/sugerenciaComprasService.ts`: filtrado estricto de proveedores activos en sugerencias de reposición.
- `client/features/compras/components/CompraDetalleModal.tsx`: nuevo modal de consulta de detalle y recepción de mercadería.
- `client/features/compras/components/NuevaCompraDialog.tsx`: rediseño con secciones, validación inline, prevención de doble envío y selector de estado.
- `client/features/compras/pages/ComprasPage.tsx`: migración a `SummaryStrip`, filtros combinados, acciones limitadas por fila, vista móvil y diálogo de recepción.

## Ajuste E4 posterior

La recepción de compras pagadas en efectivo ahora comprueba caja abierta y saldo disponible suficiente antes de modificar inventario, Kardex o caja. Si no alcanza, falla con el saldo disponible y monto requerido; la transacción mantiene el estado pendiente y no cambia registros. El listado filtra por fechas desde/hasta (incluyentes) y el resumen de periodo se recalcula con el rango elegido. Prueba `E4-09` cubre rechazo y ausencia de efectos parciales.
- `client/services/erp/erpStore.compras.spec.ts`: suite de 8 pruebas unitarias de persistencia, rollback y transiciones de estado de compra.
- `scripts/revision-ampliacion-E4.mjs`: runner de navegador para validación automatizada de E4 en Chrome headless.

## Incidencias y Evidencias de Corrección

| ID / Prioridad | Condición Previa | Corrección Aplicada y Verificación |
|---|---|---|
| E4-01 / P0 | Las compras ingresaban directamente al stock y a caja sin contemplar órdenes en tránsito | Se implementó el estado `PENDIENTE` en store y UI. Verificado que mientras la compra está pendiente, stock = inicial, kardex = sin entradas, caja = sin descuento. |
| E4-02 / P0 | Recepción de mercadería sin control transaccional ni comprobación de saldo en caja | Se implementó `recepcionarCompra` con rollback total; valida idempotencia y descuenta caja únicamente si el pago es efectivo y hay saldo. |
| E4-03 / P0 | Riesgo de asociar compras a proveedores inactivos o dados de baja | `validarCompraPayload` y el store rechazan compras con proveedores inactivos; `sugerenciaComprasService` excluye automáticamente proveedores no vigentes. |
| E4-04 / P1 | Errores en select de proveedor por sincronización asíncrona de Radix UI | Se añadió guarda contra eventos espurios de valor vacío en `Select` y fallback por RUC en `NuevaCompraDialog`. |
| E4-05 / P1 | Múltiples acciones y tarjetas métricas redundantes en la pantalla de compras | Se reemplazaron tarjetas decorativas por `SummaryStrip` y se limitaron las acciones de fila a máximo 2 visibles («Ver detalle» y «Recepcionar») más menú contextual. |

## Resultados de Pruebas y Auditoría

- **Pruebas Unitarias**:
  - `pnpm test`: **16 archivos de prueba aprobados (127/127 tests pasando)**.
  - `client/services/erp/erpStore.compras.spec.ts`: 8/8 pruebas pasando.
- **Tipado**:
  - `pnpm typecheck`: **0 errores de TypeScript**.
- **Ejecución en Navegador (Chrome Headless con perfil aislado)**:
  - Rutas verificadas: `/compras` e `/inventario` en anchos 1440px, 720px y 390px.
  - Sin desbordamiento horizontal (`pageWidth <= width` en todas las resoluciones).
  - 0 excepciones en consola.
  - Operaciones comprobadas:
    - Registro de compra pendiente: `pendingRegistered: true`.
    - Stock inalterado durante estado pendiente: `stockPreservedWhilePending: true`.
    - Kardex sin asientos previos: `kardexPreservedWhilePending: true`.
    - Caja sin deducción anticipada: `cashPreservedWhilePending: true`.
    - Recepción de mercadería: `receiptSuccessful: true`.
    - Stock incrementado tras recepción: `stockAddedOnReceipt: true`.
    - Asiento Kardex generado en recepción: `kardexCreatedOnReceipt: true`.
    - Descuento de caja aplicado en recepción: `cashDeductedOnReceipt: true`.
  - Contraste WCAG 2.1 AA (mínimo 4.5:1):
    - Modo claro: foreground/card 17.1:1, muted/card 6.3:1, success 4.9:1, danger 5.8:1.
    - Modo oscuro: foreground/card 14.8:1, muted/card 7.3:1, success 8.4:1, danger 6.2:1.
- **Archivos de Evidencia Generados (`docs/ampliacion/evidencias/E4/`)**:
  - `revision.json`: reporte completo de la ejecución con métricas y ratios de contraste.
  - `compras-1440.png`, `compras-720.png`, `compras-390.png`: vistas responsivas de la pantalla.
  - `compras-oscuro-390.png`: validación en tema oscuro.
  - `compra-validacion-720.png`: validación de campos obligatorios (serie vacía).
  - `compra-error-alta-720.png`: preservación de borrador ante fallo simulado de almacenamiento.
  - `compra-detalle-pendiente-720.png`: modal de detalle con orden en tránsito.
  - `compra-confirmacion-recepcion-720.png`: diálogo de confirmación de recepción física.
  - `compras-sugerencias-720.png`: modal de reposición inteligente por ventas y stock.
  - `inventario-1440.png`, `inventario-720.png`, `inventario-390.png`: verificación de consistencia en módulo de inventario.

## Próxima Etapa

- **E5 — Gastos y Caja**: Egresos operativos, motivos de gasto, sincronización con el arqueo y flujo de caja diario.
