# E6 — Clientes

Entrega local con `KIPUS_ERP_STORAGE_V2`; no se agregó DB ni servicio externo. La pantalla se ajustó para atender el directorio, seleccionar clientes en el POS y conservar los datos originales de cada comprobante.

## Reglas implementadas

- DNI de 8 dígitos y RUC de 11, quitando espacios y guiones antes de validar y guardar. No se consulta SUNAT ni se simula verificar el dígito de control.
- Documento único en todo el directorio, incluidos registros inactivos. El DNI `00000000` queda reservado para «Consumidor Final» y se presenta como opción aparte en Ventas.
- Alta y edición comparten validación Zod, mensajes junto al campo, foco de React Hook Form, opcionales explícitos, conservación del formulario ante fallo y protección contra doble envío.
- Clientes con comprobantes guardados no pueden cambiar su documento. Sí pueden editar nombre y contacto; cada Venta conserva el nombre y documento capturados al emitirla.
- Activar/desactivar no elimina el historial. El POS ofrece solo clientes activos; el store también rechaza una venta si el registro asociado se desactivó mientras el formulario estaba abierto.
- Ficha con ventas reales asociadas por documento. Los `totalCompras`/`saldoPendiente` heredados de los datos demo se retiraron de la lista y se señalan como no conciliados en el detalle; no se presentan como estado de cuenta.
- Directorio con búsqueda por nombre, documento y contacto, filtros de documento/estado, paginación, tabla de escritorio, tarjetas móviles y estados diferenciados de carga, vacío y error.

## Archivos

- `client/features/clientes/utils/clienteValidation.ts`: normalización y reglas compartidas.
- `client/features/clientes/components/NuevoClienteDialog.tsx`: formulario de alta/edición.
- `client/features/clientes/components/ClienteDetalleDialog.tsx`: ficha e historial de comprobantes.
- `client/features/clientes/pages/ClientesPage.tsx`: filtros, lista responsive, edición y estado.
- `client/features/clientes/services/clientesService.ts` y `types/clientes.types.ts`: servicio y contrato de actualización.
- `client/features/ventas/components/PosTerminalView.tsx`: selección de clientes activos y Consumidor Final por separado.
- `client/services/erp/erpStore.ts`: duplicados, actualización, estado, validación de ventas y protección de historial.
- `client/services/erp/erpStore.clientes.spec.ts`: 12 pruebas de validación, duplicados, persistencia y ventas históricas.

## Verificación y límites

Verificación final: `pnpm typecheck` aprobado; `pnpm test`, 147/147 pruebas en 18 archivos; `pnpm build` cliente y servidor aprobado. La suite dejó los mensajes de diagnóstico ya conocidos de ZXing/Browserslist. No se ejecutó automatización de navegador ni se guardaron imágenes, según instrucción del usuario. La interfaz aún requiere comparación manual cuando el servidor local vuelva a estar disponible. No se modificó almacenamiento del navegador del usuario; `http://localhost:8080/` estaba fuera de servicio al comenzar E6.

Las cifras antiguas de compras/saldo en el prototipo no son contabilidad conciliada. El formulario de venta aún permite escribir datos temporales para un comprobante; esos datos se guardan como fotografía de la venta y no crean una ficha en el directorio.
