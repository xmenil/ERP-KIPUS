# E3 — Proveedores

21/10/2026. Continuación sobre `main`, referencia `5444043`. Se conservaron los cambios locales de E0–E2 y el archivo ajeno `docs/Nuevo documento de texto.txt`. Servidor existente `http://localhost:8080/`: HTTP 200 al comenzar, sin lanzar otro. Sin DB, servicios externos, commit, push ni despliegue.

## Contrato del directorio

- Fuente de verdad: `proveedores` de `KIPUS_ERP_STORAGE_V2`, con las operaciones atómicas de E1. Alta, edición, estado y baja escriben antes de confirmar; un fallo conserva memoria, almacenamiento y borrador/confirmación para reintentar.
- RUC: se eliminan espacios y guiones de formato, se exigen 11 dígitos y se rechazan duplicados en todo el directorio, incluidos inactivos. No hay consulta ni validación oficial SUNAT. La razón social y el rubro son obligatorios; contacto, correo, teléfono, dirección y datos adicionales tienen su carácter opcional visible. Correo/teléfono y límites numéricos se validan. Los días de crédito se derivan de la condición de pago.
- Una compra conserva su nombre/RUC histórico. Si existen compras con ese RUC, el proveedor no se borra ni cambia de RUC; se permite editar los demás datos o desactivarlo. Un saldo referencial positivo también impide borrar. No se reasignan ni migran compras al editar el directorio.
- Solo se borra un proveedor sin referencias ni saldo positivo, después de confirmar su nombre. Activar/desactivar también requiere confirmación y conserva el historial. Los códigos nuevos parten del máximo existente para no colisionar después de una baja.
- Compras selecciona proveedores activos. Un formulario desactualizado no puede registrar una compra con un proveedor desactivado: el store vuelve a comprobarlo. Si no hay proveedores disponibles, el formulario no inventa uno ni conserva un proveedor fijo como sustituto.
- Los datos ilegibles del directorio producen un error de lectura, no una lista vacía ni un reemplazo por ejemplos. Se conservan para recuperación. Un directorio vacío válido permanece vacío.

## Interfaz

«Proveedores» con acción principal «Nuevo proveedor». Búsqueda por nombre/RUC, filtros visibles de estado y condición de pago, orden alfabético por razón social y paginación de 20 registros con conteo. Tabla de empresa/RUC, contacto, condición, estado y acciones; en móvil se usa una lista compacta. Dos acciones visibles por registro: detalle y menú Radix.

Alta/edición usa un único formulario React Hook Form + Zod en un Sheet. Empresa/contacto y condiciones van primero; dirección y datos adicionales son desplegables. Etiquetas asociadas, error junto al campo, foco en el primero inválido, borrador conservado ante error, cierre con confirmación de descarte y bloqueo de doble envío/cierre durante el guardado. `NuevoProveedorDialog` queda como adaptador al formulario principal: no tiene consumidores activos fuera de su definición y ya no duplica lógica.

Detalle con contacto, dirección, condición, límite, notas y compras reales del store. El saldo inicial se identifica como referencia de demostración; no se presenta como una cuenta conciliada ni se fabrica una calificación de proveedor. «Copiar RUC» espera la operación real y comunica su fallo. Se retiraron la supuesta verificación SUNAT y las afirmaciones de homologación sin soporte.

Carga, vacío, ausencia de resultados, error con reintento y confirmaciones de éxito diferenciados. Tokens y componentes existentes, textos 14/12 px, títulos 24/18 px, campos 16 px en móvil y controles principales de 44 px. El cierre del Sheet se presenta en español y con área táctil ampliada en este formulario.

## CSV

`crearCsvProveedores` genera UTF-8 con BOM, coma como delimitador y CRLF entre registros. Todas las celdas se entrecomillan; comillas internas se duplican y se preservan comas, saltos y caracteres españoles. Celdas que podrían ejecutarse como fórmulas de hoja de cálculo se prefijan con apóstrofo.

«Exportar CSV» descarga todos los resultados de búsqueda/estado/pago, no solo la página visible ni todo el directorio sin filtrar. Incluye código, RUC, razón social, nombre comercial, contacto, teléfono, correo, ciudad, condición y estado. El nombre es `proveedores-filtrados.csv`; el archivo comprobado está en la ruta `csvFile` del JSON de evidencia. No se anuncia éxito mediante un temporizador ni se cambia la extensión por XLSX.

## Archivos de la entrega

- `client/services/erp/erpStore.ts`: normalización, duplicados, referencias, baja/estado, códigos y rechazo de compra con proveedor inactivo.
- `client/features/proveedores/utils/proveedorValidation.ts`: reglas compartidas entre store/formulario.
- `services/proveedoresService.ts`: lectura validada y selección de activos.
- `pages/ProveedoresPage.tsx`, `components/ProveedorFormDialog.tsx`, `ProveedorDetalleModal.tsx`, `NuevoProveedorDialog.tsx`: directorio, acciones, formulario único y detalle.
- `utils/proveedoresCsv.ts`, `proveedoresCsv.spec.ts`: generación CSV y regresiones de codificación/escape.
- `client/features/compras/components/NuevaCompraDialog.tsx`: selección activa, datos del directorio de solo lectura y estado sin proveedores.
- `client/components/ui/sheet.tsx`: etiqueta de cierre en español.
- `client/services/erp/erpStore.proveedores.spec.ts`, `scripts/revision-ampliacion-E3.mjs` y extensión del runner: pruebas de operaciones y navegador aislado.

## Incidencias y evidencia

Rol: administrador de prueba. Navegador: Chrome headless con perfil nuevo del runner; nombres/RUC identificados como E3. Pruebas de lógica: Map aislado, sin acceder al perfil del usuario.

| ID / prioridad | Antes | Corrección y repetición |
|---|---|---|
| E3-01 / P0 | RUC sin normalizar, duplicados activos/inactivos aceptados | Validación compartida, conflicto junto al RUC y regresiones de cero efectos |
| E3-02 / P0 | Baja y cambio de RUC posibles pese a compras | Bloqueo en store y UI; desactivación mantiene el historial de compra registrado antes de editar |
| E3-03 / P1 | CSV exportaba el directorio completo y no escapaba las comillas internas | Filtros compartidos con la pantalla; descarga real y lectura de archivo con un registro que contiene «Peña», comillas y coma |
| E3-04 / P1 | Formulario duplicado, verificación SUNAT simulada y pantalla recargada | Formulario único, sin afirmaciones oficiales, tabla/lista con detalles y menú accesibles |
| E3-05 / P0 | Proveedor inactivo seleccionable para compras | Solo activos en selector y comprobación al registrar; prueba de formulario antiguo después de desactivar |

Reproducción antes de modificar el store: `evidencias/E3/reproduccion.txt`, 7 fallos y 4 pruebas de persistencia ya aprobadas por E1. La exportación anterior se identificó por inspección de código; no se atribuye una descarga histórica a una prueba que no se ejecutó.

Resultados finales en `seguimiento.md`. Logs de esta entrega: `pruebas-E3.txt`, `build-E3.txt`, `navegador-E3.txt`; evidencia y medidas: `evidencias/E3/revision.json`. Se distingue la prueba de lógica de los recorridos efectivamente operados en navegador. No se acredita una prueba manual en Excel ni una evaluación humana de usabilidad.

Cierre técnico: TypeScript, 119 pruebas (15 archivos), build cliente/servidor y `git diff --check` aprobados. Navegador: seis navegaciones de las dos rutas a tres anchos, sin desbordamiento ni excepciones; alta/edición/estado/baja con errores y reintentos, compra vinculada, historial conservado y descarga CSV verificados. Datos ilegibles conservados y estados vacío/sin resultados distintos. Los cuatro pares de texto/estado medidos cumplen 4,5:1 en claro y oscuro. Detalle y menús operados con Esc/teclado.

## Comparación y pendientes

Rutas: `http://localhost:8080/proveedores` y `http://localhost:8080/compras`. Capturas iniciales: `evidencias/E0/proveedores-1440.png` y `proveedores-390.png`; actuales: `evidencias/E3/`, incluyendo formulario, historial, confirmación, vacío, errores y oscuro. El CSV real se conserva bajo `evidencias/E3/descargas/<ejecucion>/`.

Repetir en perfil aislado: `$env:KIPUS_REVISION_ETAPA='E3'; node scripts/revision-ampliacion-E0.mjs`.

La próxima entrega es E4, Compras. Persisten los límites locales y las referencias comerciales de demostración; E4/E8 revisarán el tratamiento completo de compras/saldos/reportes. E10 mantiene zoom real 200%, lector de pantalla y recorridos integrados. No se reactivó la fase 5 anterior.
