# E1 — Consistencia de operaciones locales

21/10/2026. Implementación sobre `5444043`, sin commit ni publicación. La fase 5 anterior sigue cancelada.

## Resultado funcional

`client/services/erp/erpStore.ts` envuelve todas las mutaciones en una operación síncrona: clona el estado anterior, aplica los cambios, escribe una sola vez `KIPUS_ERP_STORAGE_V2` y después notifica. Un error de validación o escritura restaura todos los módulos y se propaga al servicio/formulario. Los métodos anidados (pedido/cotización → venta) comparten la operación exterior; no guardan una venta a mitad de la conversión. Los getters entregan copias, evitando mutaciones externas de referencias internas.

Se conserva la clave V2, los catálogos vacíos y las claves independientes de autenticación/usuarios. JSON, colecciones, detalles o importes ilegibles bloquean la escritura y se conservan para recuperación; no se reemplazan silenciosamente. El guardado continúa siendo local al navegador. Esta operación no implementa un bloqueo distribuido entre pestañas ni sincronización entre equipos.

Validaciones: cantidades finitas positivas; stock físico finito no negativo; producto activo y existente; stock acumulado entre ítems repetidos; precios/importes/descuentos/pagos finitos; compra con detalle y totales coherentes. Una compra sin detalle ya no abastece arbitrariamente al primer producto. Se conserva el detalle comprado. El comprobante repetido del mismo proveedor se rechaza después de normalizarlo para comparar.

Cobros: efectivo, cada componente digital y crédito se distinguen. Mixto exige suma exacta al céntimo y crea un movimiento por componente; crédito no crea cobro ni aumenta las ventas digitales. Efectivo en compras/gastos y los cobros requieren caja abierta. Compra/gasto digital no reduce efectivo. Un ingreso manual digital ya no se presenta como una venta. El saldo de la caja activa se actualiza en la misma operación.

Identificadores combinan tiempo, secuencia y sufijo aleatorio. Los correlativos se calculan con el máximo de cada serie existente, no con el número de ventas. Reintentar una conversión ya entregada/convertida se rechaza. Los envíos intencionales separados de ventas siguen siendo operaciones diferentes.

## Resultado de interfaz

- Compras, Gastos, Clientes y Proveedores usan `useErpQuery`: una lectura por cambio, descarte de respuestas antiguas/desmontadas y error con reintento distinto de lista vacía. Se eliminó la inserción manual que competía con la suscripción.
- Compras, Gastos, Clientes, Proveedores y Caja propagan el rechazo al diálogo. Los campos no se limpian ni se cierra el formulario después de fallar. Los formularios intervenidos bloquean envíos repetidos y cierre accidental durante el guardado.
- Cobro muestra el error del store dentro del diálogo y enfoca el aviso. Al abrir toma el total actual del carrito, en lugar del total cero de su montaje; los valores iniciales del pago mixto suman exactamente el total.
- `FormError` comunica el error y recibe foco; `QueryError` ofrece reintento. Gastos tiene etiquetas asociadas y campos numéricos con teclado decimal. Se conservan tokens neutros/violeta/semánticos existentes.
- Ajuste de inventario mantiene la confirmación y los datos ante fallo, muestra la causa y bloquea doble confirmación.

Esto atiende la interfaz necesaria para E1. El rediseño completo de los ocho módulos corresponde a E2–E9 y no se declara realizado aquí.

## Incidencias y trazabilidad

Todos los casos usan administrador de prueba, Chrome headless aislado y datos identificados con E1. Las pruebas de lógica usan un Map exclusivo, sin el navegador del usuario.

| ID / prioridad | Pasos y resultado observado antes | Corrección / repetición |
|---|---|---|
| H01 / P0 | Forzar `setItem` a fallar al vender, comprar, gastar, ajustar o ingresar caja: no rechazaba y dejaba memoria modificada | Transacción común y escritura estricta; comparar memoria y cadena persistida antes/después, reintentar y reinicializar |
| H02 / P0 | Vender 0, -1, NaN, Infinity o más de 45 unidades de prod-1: aceptado | Validación previa y suma por producto; ningún registro cambia |
| E1-03 / P0 | Mixto creaba un ingreso íntegro como efectivo; crédito también creaba ingreso y aumentaba digital | Movimientos por componente y crédito sin cobro; pruebas de saldos y medios |
| E1-04 / P0 | Página capturaba error de compra/gasto/cliente/proveedor/caja y el diálogo continuaba por éxito | Propagación al formulario, borrador y reintento; evidencia de navegador |
| E1-05 / P0 | Conversión anidada confirmaba una venta antes de cambiar el pedido | Profundidad compartida y una escritura exterior; fallo, reintento y rechazo de reconversión probados |
| E1-06 / P1 | El modal de cobro retenía el total inicial cero y el mixto redondeaba a enteros | Inicialización al abrir con total vigente y reparto en céntimos; recorrido de POS |
| E1-07 / P1 | Listas podían publicar respuestas antiguas o duplicar la inserción con la suscripción | Consulta común con invalidación y única fuente de actualización |

Reproducción previa: `evidencias/E0/reproduccion-H01-H02.txt`, 14 fallos antes de modificar el store. Regresiones: `client/services/erp/erpStore.operaciones.spec.ts`. Commit de corrección: ninguno, por alcance del encargo.

## Verificación y comparación

- Suite completa: 87 pruebas en 12 archivos. Registro: `pruebas-E1.txt`.
- TypeScript y build de cliente/servidor aprobados; log de compilación `build-E1.txt`.
- Navegador: `evidencias/E1/revision.json`, capturas y `navegador-E1.txt`. Quince navegaciones en 1440/720/390 px sin desbordamiento de página medido y cero excepciones. Las cinco operaciones rechazan almacenamiento fallido sin modificar memoria ni persistencia y después guardan normalmente. Los cinco formularios conservan borrador/confirmación, muestran el error y admiten un reintento sin duplicarse ante doble clic. Gastos y Compras se comprobaron tras recarga; la suite comprueba reinicialización de las cinco operaciones. Cobro enfoca su error y tiene captura en claro/oscuro a 390 px.
- Iniciales: `evidencias/E0/<modulo>-1440.png` y `<modulo>-390.png`. Cambios: `evidencias/E1/`; se añaden capturas de los errores y reintentos. Repetir con `$env:KIPUS_REVISION_ETAPA='E1'; node scripts/revision-ampliacion-E0.mjs`.
- Comparar en el servidor existente: `/ventas`, `/compras`, `/gastos`, `/inventario?tab=ajustes`, `/caja`, `/proveedores` y `/clientes`. Los datos identificados de prueba solo existen en el perfil aislado del script.

## Pendientes explícitos

E2 conectará configuración, series y `permitirVentaSinStock`; mientras tanto no se vende con stock insuficiente. E4 implementará, si corresponde, la recepción enlazada de compras pendientes; consultar una compra pendiente no modifica stock. E7 revisará el almacenamiento de usuarios y permisos demo. E8 revisará reportes, anulaciones/devoluciones históricas, periodos y exportaciones. E10 conserva su matriz integrada, zoom real 200%, lector de pantalla y revisión visual completa de todos los módulos. No se acredita una evaluación humana ni se declara resuelto el bloqueo original.
