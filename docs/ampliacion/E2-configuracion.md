# E2 — Configuración persistente

21/10/2026. Continuación de E0/E1 sobre `main`, sin commit, push ni despliegue. Servidor existente en `http://localhost:8080/`, HTTP 200 al comenzar; no se inició otro. Se conservaron los cambios locales anteriores y `docs/Nuevo documento de texto.txt`.

## Contrato y funcionamiento

- Clave nueva: `KIPUS_ERP_CONFIGURACION_V1`. La configuración es compartida por el origen/perfil y permanece al recargar o cerrar sesión. Sin DB, servicios externos ni sincronización entre equipos.
- Ausencia inicial: se ofrecen los datos de ejemplo sin escribir automáticamente. Contenido ilegible o error de lectura: se informa el problema y se bloquea el formulario; no se reemplaza por valores iniciales. Guardar valida primero, comprueba que el contenido vigente es legible y escribe antes de notificar a consumidores. Un fallo conserva el borrador y la configuración vigente.
- Empresa: RUC de 11 dígitos, razón social, sede y dirección obligatorios. Nombre comercial, teléfono, correo y régimen tributario opcionales. Cadenas recortadas, correo y formato de teléfono validados. El RUC se valida por formato; no es una consulta a SUNAT.
- Navegación: nombre comercial o razón social y RUC en el pie del menú; sede en la cabecera y sede predeterminada de Ventas. Se retiró el nombre fijo «Comercial Los Andes S.A.C.».
- Nuevas ventas guardan `emisor` con una copia de los datos vigentes. El detalle y la confirmación muestran el emisor conservado; cambiar la empresa después no reescribe ventas anteriores. Los comprobantes históricos sin esa copia se identifican en el detalle, sin atribuirles retrospectivamente el emisor actual.

## Parámetros ofrecidos y límites

| Parámetro | Comportamiento real de E2 |
|---|---|
| B001 / F001 / NV01 | Series locales fijas de solo lectura; sin autorización SUNAT |
| Siguiente número | Se calcula desde el máximo existente por serie con la misma función que usa la emisión; no se modifica manualmente. La reserva y todos los efectos de la venta permanecen en una sola escritura V2 |
| IGV | 18% fijo, incluido en precios; nota de venta sin desglose. No se ofrece edición de tasas sin cálculo general implementado |
| Moneda | PEN fija; no hay conversión a USD |
| Venta sin stock | No permitida, visible como restricción fija. No se ofrece un checkbox activo que contradiga al store o al POS. El servicio rechaza configuraciones que intenten habilitarla |
| Régimen tributario | Dato informativo del emisor; no realiza liquidación o trámite tributario |

`series` se conserva en el contrato de configuración por compatibilidad del frontend; sus números guardados no son un contador de emisión. La pantalla usa `erpStore.getSeriesComprobantes()` como fuente operativa. La tasa y moneda tampoco se ofrecen como conversión de importes históricos.

El alcance de E2 resuelve la discrepancia de `permitirVentaSinStock` mediante una restricción explícita de solo lectura, conforme al criterio E2.4. Habilitar ventas negativas exige un encargo que conecte todos sus recorridos; no se declara implementado.

## Interfaz

Título «Configuración», una acción principal «Guardar configuración» y secciones Empresa, Comprobantes y Preferencias, con ancho `max-w-2xl`. Formulario React Hook Form + Zod, validación al salir/enviar, etiquetas asociadas, errores junto al campo, foco en el primer inválido y bloqueo de doble envío. Los fallos de guardado se muestran con `FormError` y no borran campos.

Aviso de cambios pendientes, confirmación al seguir un enlace interno y advertencia del navegador al recargar/cerrar con un borrador. Las cuentas y los datos demo quedan fuera del formulario principal. Restablecer requiere un diálogo que enumera los datos operativos reemplazados, conserva configuración/cuentas/sesión y mantiene la confirmación abierta ante un fallo. Las pruebas de restablecimiento usan exclusivamente almacenamiento aislado.

Tokens existentes, controles de 44 px en móvil, campos de 16 px en móvil/14 px escritorio, títulos 24/18 px y series monoespaciadas. No se añadieron degradados, tarjetas decorativas ni colores nuevos.

## Archivos

- `client/features/configuracion/services/configuracionStorage.ts`: clave, datos iniciales, validación, lectura/escritura y suscripción.
- `configuracionService.ts`, `hooks/useConfiguracion.ts`, `types/configuracion.types.ts`: API local, consumidores reactivos y nombre de sede.
- `pages/ConfiguracionPage.tsx`: formulario, parámetros reales, reintento, cambios pendientes y confirmación de restablecimiento.
- `client/components/layout/AppHeader.tsx`, `AppSidebar.tsx`: empresa y sede vigentes.
- `client/services/erp/erpStore.ts`, `client/features/ventas/types/ventas.types.ts`, `pages/VentasPage.tsx`, `components/VentaDetalleModal.tsx`, `VentaCompletadaModal.tsx`: numeración compartida y emisor histórico de nuevas ventas.
- `configuracionService.spec.ts`, `scripts/revision-ampliacion-E2.mjs` y extensión del runner local: regresiones y evidencia aislada.

## Incidencias y verificación

H03/P0: el servicio anterior conservaba `mockConfiguracion` en memoria y no escribía al guardar, confirmado en el código inicial. La regresión comprueba guardar, reinicializar y leer; el navegador comprueba recarga y cierre/inicio de sesión.

E2-02/P1: nombre fijo contradictorio en el menú y numeración estática en Configuración. Se conectaron empresa/sede y el cálculo real del siguiente comprobante; una prueba compara el número mostrado con el emitido.

E2-03/P0: el restablecimiento anterior se ejecutaba directamente desde el botón. Se añadió confirmación y separación del guardado; pruebas aisladas verifican cancelación y conservación de configuración/cuentas, incluyendo un fallo de escritura del ERP.

Resultados finales de TypeScript, suite, build y navegador en `seguimiento.md`. Logs: `pruebas-E2.txt`, `build-E2.txt`, `navegador-E2.txt`. Evidencia: `evidencias/E2/revision.json` y PNG. No atribuir una inspección de código a un recorrido de navegador.

Cierre: TypeScript aprobado, 103 pruebas aprobadas (13 archivos), build cliente/servidor aprobado y `git diff --check` sin errores. Chrome aislado verifica las operaciones descritas, recarga y cierre/inicio de sesión reales, sin excepciones. Ocho capturas y medidas sin desbordamiento a 1440/720/390 px. Contraste del mensaje de error: 5,83:1 claro y 6,17:1 oscuro. Cancelar el diálogo demo no cambia V2; la prueba aislada de lógica ejecuta restablecimiento normal/fallido y conserva configuración/cuentas.

## Comparar y continuar

Ruta: `http://localhost:8080/configuracion`. Antes: `evidencias/E0/configuracion-1440.png` y `configuracion-390.png`. Después: `evidencias/E2/configuracion-1440.png`, `configuracion-720.png`, `configuracion-390.png` y capturas de validación, error, confirmación y oscuro.

Repetir en perfil aislado: `$env:KIPUS_REVISION_ETAPA='E2'; node scripts/revision-ampliacion-E0.mjs`.

E3 es la próxima entrega del plan. Siguen pendientes E3–E10, incluida la revisión completa de permisos, reportes, impresión/exportación y recorridos integrados. No se reactivó la fase 5 anterior ni se acredita lector de pantalla o zoom real 200% por las capturas de esta etapa.
