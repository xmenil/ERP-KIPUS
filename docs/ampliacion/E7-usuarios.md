# E7 — Usuarios y permisos del prototipo

## Entrega

El directorio y el inicio de sesión ahora leen la misma lista local en `kipus_erp_users_list`. La lista se valida antes de usarla; los datos corruptos se conservan y la pantalla muestra el error con reintento. Las escrituras fallidas se propagan al formulario y no se presenta éxito. Los nombres de usuario y correos se guardan normalizados, las cuentas duplicadas se rechazan y las consultas del directorio no incluyen contraseñas.

El acceso genérico por contraseñas `admin123`/`123456` fue retirado. Se mantienen tres cuentas demo explícitas en el login: `admin`, `caja` y `supervisor`; sus claves solo sirven mientras el registro local correspondiente conserve esas claves. Una cuenta demo desactivada se mantiene como inactiva y no se combina con una segunda copia activa. Las cuentas demo secundarias se desactivan al retirarlas; no se recrean automáticamente.

La matriz de navegación local es:

| Rol | Rutas permitidas |
|---|---|
| Administrador | Todos los módulos |
| Cajero | Resumen, Ventas, Caja y Clientes |
| Supervisor | Resumen, Productos, Inventario, Compras, Proveedores y Clientes |

El menú y `ProtectedRoute` consultan la misma matriz. Los cambios de rol actualizan la sesión abierta y desactivar/eliminar su cuenta termina esa sesión. Se impide desactivar, degradar o retirar el último administrador activo. El detalle del usuario ya no presenta un último acceso inventado; exportación CSV y copia de correo reportan éxito solo cuando la acción ocurrió.

## Alcance y recuperación

Este ERP guarda las cuentas y sus contraseñas en texto dentro del almacenamiento local del navegador. La matriz de roles limita las rutas de la interfaz; no protege endpoints ni equivale a autenticación/autorización de servidor. No usar estas cuentas para datos reales sensibles.

La recuperación disponible dentro del prototipo es editar la propia cuenta mientras exista una sesión de administrador activa, o pedir a otro administrador que cambie la contraseña. La aplicación impide retirar al último administrador. Si el directorio queda ilegible, no se borra automáticamente: conserva `kipus_erp_users_list` y solicita reintentar tras recuperar/restaurar una copia válida de ese valor. No existe recuperación remota ni enlace de restablecimiento; el texto de login indica contactar al administrador. No ejecutar “restablecer datos demo” para recuperar usuarios, pues afectaría otros datos del prototipo.

## Verificación

- TypeScript: aprobado.
- Vitest: 155/155 pruebas en 21 archivos; se añadieron 8 pruebas para persistencia/autenticación/roles.
- Build: cliente y servidor aprobados. Advertencias existentes de Browserslist y diagnósticos internos de ZXing en pruebas de lectura; no fallaron pruebas.
- No se ejecutó script de navegador ni se generaron capturas, según la indicación del usuario. El servidor existente respondió HTTP 200; no se inició otro y no se modificó el perfil de datos del navegador.
- Revisión manual disponible para comparar: `http://localhost:8080/login` y, con cuenta administradora, `http://localhost:8080/usuarios`.

No se hizo commit, push ni despliegue. Pendiente: verificar visualmente cada rol y los cambios de sesión en el navegador cuando se solicite; los permisos locales no son seguridad de producción.
