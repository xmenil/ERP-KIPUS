# E5 — Gastos y Caja

21/10/2026. Continuación sobre `main`. Se conservaron los cambios de E0–E4 y el archivo ajeno `docs/Nuevo documento de texto.txt`. Servidor existente `http://localhost:8080/`: HTTP 200 verificado sin lanzar instancias concurrentes. Prototipo frontend con persistencia aislada en `localStorage` (`KIPUS_ERP_STORAGE_V2`). Sin base de datos externa, Spring Boot, commit, push ni despliegue.

> [!NOTE]
> Por instrucción expresa del usuario, en esta etapa no se ejecutaron los scripts lentos de automatización de navegador en Chrome headless (`revision-ampliacion-*.mjs`), concentrando la verificación en la lógica de negocio, pruebas unitarias transaccionales (`vitest`), tipado estricto de TypeScript y diseño UI/UX según las reglas de `kipus-ui`.

## Contrato de Gastos y Egresos Operativos

- **Categorías Operativas**:
  `ALQUILER`, `SERVICIOS_BASICOS`, `PLANILLA`, `LOGISTICA`, `MANTENIMIENTO`, `MARKETING`, `OTROS`.
- **Medios de Pago Soportados**:
  `EFECTIVO`, `TRANSFERENCIA`, `YAPE`, `PLIN`, `TARJETA`.
- **Interconexión con Caja Registradora**:
  - **Pagos en Efectivo (`EFECTIVO`)**:
    - Exige que la caja esté abierta (`exigirCajaAbierta()`). Si la caja está cerrada, se rechaza la operación con mensaje explicativo.
    - Valida que el efectivo disponible en caja sea suficiente (`estadoCaja.saldoEfectivoEsperado >= monto`). Si el efectivo es insuficiente, rechaza la operación evitando saldos negativos irreales.
    - Descuenta inmediatamente el dinero de `saldoEfectivoEsperado`, suma al acumulador de `egresosEfectivo` y genera un asiento formal en `movimientosCaja` con tipo `EGRESO`, concepto, beneficiario, comprobante y categoría.
  - **Pagos Digitales y Bancarios (`TRANSFERENCIA`, `YAPE`, `PLIN`, `TARJETA`)**:
    - No descuenta dinero de la caja física de mostrador, reflejando que los fondos salieron de una cuenta bancaria o billetera digital externa.
    - Se permite su registro aun con la caja de mostrador cerrada (por ejemplo, el pago del alquiler o luz ejecutado por el propietario fuera del horario de atención del cajero).
- **Consistencia y Rollback Atómico**:
  - Operación encapsulada en la capa `transactional()`.
  - Ante cualquier error o fallo de almacenamiento en `localStorage`, se ejecuta un rollback integral que restaura el saldo de caja, los movimientos y el listado de gastos sin efectos parciales.
- **Flujo de Anulación Transaccional (`anularGasto`)**:
  - Si el usuario anula un gasto registrado por error:
    - Si el gasto fue pagado en efectivo, **reintegra automáticamente el importe al saldo disponible en caja**, reduce `egresosEfectivo` y registra un movimiento de auditoría en caja de tipo `INGRESO` referenciando el comprobante original.
    - Si el gasto fue digital, actualiza el estado a `ANULADO` sin alterar la caja física.
    - Se estampa `fechaAnulacion` y `motivoAnulacion`.
    - No se permite anular dos veces el mismo egreso (idempotencia).

## Interfaz de Usuario y UX (`kipus-ui`)

- **Pantalla Gastos (`GastosPage.tsx`)**:
  - Reemplazo de las tarjetas métricas dispersas por `SummaryStrip` con 4 métricas calculadas en tiempo real con `tabular-nums`:
    1. Total egresos del periodo (con conteo de comprobantes activos).
    2. Efectivo de caja registradora (con porcentaje sobre el total).
    3. Pagos bancarios y digitales (subtítulo informativo).
    4. Rubro de mayor costo (categoría y monto acumulado).
  - Barra de filtros con búsqueda, categoría, medio de pago, estado y rango inclusivo de fechas:
    - Buscador por concepto, beneficiario o comprobante.
    - Selector de categoría (con conteo por categoría).
    - Selector de medio de pago (`Todos`, `Efectivo`, `Transferencia`, `Yape/Plin`, `Tarjeta`).
    - Selector de estado (`Todos`, `Activos`, `Anulados`).
  - Tabla de escritorio con máximo 2 acciones por fila:
    - Botón ghost «Ver detalle».
    - Menú contextual `...` con opciones «Ver detalle completo» y «Anular egreso».
  - Vista móvil responsive (< 768px): tarjetas estructuradas con badge de categoría, datos del beneficiario, comprobante, monto y botón «Ver detalle».
  - Uso estricto del color: color rojo (`text-danger-text`) reservado con significado para el importe de egreso o estado anulado; no se satura la pantalla con bordes de color.
- **Formulario de Registro (`NuevoGastoDialog.tsx`)**:
  - Formulario estructurado en 3 bloques claros:
    1. Clasificación y Medio de Pago (con indicador en vivo del saldo disponible en caja si se selecciona efectivo).
    2. Concepto y Comprobante (concepto obligatorio, beneficiario y comprobante opcionales).
    3. Monto a Desembolsar (campo numérico formateado en soles).
  - Bloqueo de doble clic (`submitting.current`).
  - Alerta de error accesible con `FormError`.
  - Preservación íntegra de los campos ante fallos de persistencia.
- **Modal de Detalle (`GastoDetalleModal.tsx`)**:
  - Vista completa del egreso: concepto, categoría, comprobante, beneficiario, fecha, hora, medio de pago, usuario que registró, sucursal y caja de procedencia.
  - Explicación contextual de si afectó la caja física o una cuenta bancaria.
  - Flujo de anulación asistido por diálogo de confirmación (`AlertDialog`) que explica claramente si habrá reintegro de dinero a la caja registradora.

## Archivos Creados y Modificados

- `client/features/gastos/types/gastos.types.ts`: extensión de `Gasto` y `NuevoGastoPayload` con `hora`, `usuario`, `sucursal`, `cajaNombre`, `estado`, `fechaAnulacion`, `motivoAnulacion`.
- `client/features/gastos/utils/gastoValidation.ts`: esquema Zod de validación, mapeo de etiquetas y validador `validarGastoPayload`.
- `client/services/erp/erpStore.ts`: actualización de `registrarGasto` con validación de saldo en caja, fechas y función `anularGasto` con reversión de caja.
- `client/features/gastos/services/gastosService.ts`: exposición de `anularGasto`.
- `client/features/gastos/components/GastoDetalleModal.tsx`: nuevo componente modal de consulta y anulación.
- `client/features/gastos/components/NuevoGastoDialog.tsx`: rediseño con secciones, comprobación de saldo en vivo y prevención de doble envío.
- `client/features/gastos/pages/GastosPage.tsx`: migración a `SummaryStrip`, filtros combinados, tabla con acciones acotadas y vista móvil.

## Ajuste E5 posterior

El directorio de gastos permite filtrar desde/hasta por fecha de registro; los extremos se incluyen. El resumen del periodo (egresos activos, efectivo, pagos digitales y categoría principal) usa ese mismo rango, excluyendo anulados como antes. Al no haber resultados, el mensaje reconoce los filtros. El cálculo de reportes por periodo y el tratamiento contable de anulaciones en Reportes sigue en E8.
- `client/services/erp/erpStore.gastos.spec.ts`: suite de 8 pruebas unitarias de persistencia, caja y reversión atómica.

## Resultados de Pruebas y Auditoría

- **Pruebas Unitarias (`vitest`)**:
  - `pnpm test`: **17 archivos de prueba aprobados (135/135 tests pasando)**.
  - `client/services/erp/erpStore.gastos.spec.ts`: **8/8 pruebas pasando**:
    - G01: Descuento de caja y creación de movimiento en efectivo.
    - G02: Gasto por transferencia sin alterar caja física.
    - G03: Rechazo de pago en efectivo con caja cerrada.
    - G04: Aceptación de gasto digital/bancario con caja cerrada.
    - G05: Rechazo de gasto en efectivo superior al saldo en caja.
    - G06: Validación de campos obligatorios y montos no positivos.
    - G07: Rollback atómico ante fallo de persistencia.
    - G08: Anulación con reintegro automático de saldo a caja.
- **Tipado de TypeScript**:
  - `pnpm typecheck`: **0 errores**.
- **Compilación de Producción**:
  - `pnpm build`: **Bundle SPA y SSR compilados con éxito**.

## Próxima Etapa

- **E6 — Clientes**: Directorio de clientes, búsqueda por documento (DNI/RUC), clientes varios/consumidor final, selección fluida en POS de Ventas y resguardo del historial de comprobantes.
