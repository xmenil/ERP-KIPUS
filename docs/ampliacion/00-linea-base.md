# E0 — Línea base de ampliación

21/10/2026. Rama `main`, HEAD `54440434a05f5cc8eb1bda3571ee2bdfc07b86ec`. Antes de trabajar solo estaban sin seguimiento el plan y `docs/Nuevo documento de texto.txt`; se conservan. Servidor existente `http://localhost:8080/`: HTTP 200, sin iniciar otro servidor.

## Inventario funcional

| Módulo / tarea principal | Acciones y fuente de verdad | Límites / entrega posterior |
|---|---|---|
| Configuración / parámetros de empresa | Consultar, editar y guardar empresa, comprobantes y preferencias: variable `mockConfiguracion`; restablecer demo: store | Guardar configuración solo afecta memoria. E2 conectará parámetros y persistencia |
| Proveedores / directorio de abastecimiento | Buscar/filtrar, alta, edición, detalle, activar/desactivar y eliminar: store V2; exportar CSV: descarga local | Revisar referencias históricas, duplicados, CSV y formularios repetidos en E3 |
| Compras / abastecer productos | Buscar/filtrar, registrar compra, sugerir reposición local y consultar; store V2 | Registro actual recibido; pendiente solo aparece en datos de ejemplo. No existe transición de recepción de compra enlazada. E4 |
| Gastos / registrar egreso | Buscar/filtrar, registrar gasto; store V2 | Efectivo afecta caja, digital no afecta efectivo. No asumir edición/anulación contable. E5 |
| Clientes / seleccionar comprador | Buscar/filtrar y alta; store V2; selección en ventas | Totales iniciales de demo; revisar documento, detalle y edición en E6 |
| Usuarios / cuentas locales demo | Buscar/filtrar, alta, edición, detalle, estado, eliminar y acciones de credenciales/exportación; clave `kipus_erp_users_list` | Escrituras silenciadas y fallback demo; autenticación local sin permisos de servidor. E7 |
| Reportes / consultar resultados | Periodo, pestañas financieras/productos/tributos, modal exportar | Factores temporales, costos estimados, series fijas; exportar anuncia archivo sin descarga. E8 |
| KIPU'S IA / consultar negocio | Preguntas, sugerencias y respuesta local por reglas | Sin modelo externo; primer registro usado para algunas conclusiones. E9 |

Inventario de controles y manejadores por archivo: `evidencias/E0/acciones-codigo.txt`. Es evidencia de código; no equivale a aprobar todos los botones en navegador. Acciones de impresión, SUNAT y recomendaciones no acreditan servicios externos ni documentos oficiales.

## Contrato local adoptado para E1

- Una operación de negocio se confirma con una sola escritura de la clave V2. Si falla, se restaura toda la memoria y no se notifica éxito. Conversiones anidadas forman parte de la misma operación.
- Compras registradas son recibidas y aplican una entrada con detalle explícito; no inventar un producto usando el primero del catálogo. Compras pendientes existentes no se reciben al consultar. Un flujo de recepción enlazado queda en E4.
- Efectivo requiere caja abierta; pagos digitales se registran separados del efectivo. Venta a crédito no constituye cobro; mixto debe tener componentes finitos no negativos que sumen el total. Sin sincronización bancaria ni cobro posterior de crédito en E1.
- No permitir ventas sin stock mientras la preferencia no esté conectada de extremo a extremo en E2. Agregar cantidades del mismo producto antes de comprobar disponibilidad.
- Series locales B001/F001/NV01, correlativo por serie a partir del máximo existente. Sin autorización SUNAT; configuración de series se conectará en E2.
- Permisos son de demostración y almacenamiento compartido por origen/perfil. E7 revisará rutas, roles y cuentas. No prometer aislamiento o seguridad de servidor.
- Conservar claves, catálogos vacíos y contenido ilegible. No borrar datos para recuperación o pruebas.

## Evidencia de navegador

`scripts/revision-ampliacion-E0.mjs` adapta el script histórico y usa Chrome con perfil nuevo aislado y sesión de administrador de prueba. Ocho rutas en 1440, 720 y 390 px: 24 navegaciones sin excepciones y sin desbordamiento de página medido. Capturas de escritorio/móvil (16 PNG) y métricas en `evidencias/E0/revision.json`. No se tocó el perfil del usuario ni las evidencias de fase 4.

Esta captura inicial no acredita teclado, contraste de todos los controles, lector de pantalla ni zoom real; se revisarán con los cambios de cada módulo. El bloqueo original sigue sin causa confirmada.

## Verificación técnica

TypeScript aprobado. Suite inicial: 58/58 pruebas, 11 archivos. Build cliente y servidor aprobados. Advertencias de ZXing en pruebas de detección y Browserslist desactualizado forman parte de la línea base.
