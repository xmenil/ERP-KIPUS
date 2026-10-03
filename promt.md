Antes de empezar (una sola vez)
Confirma que .claude/skills/kipus-ui/SKILL.md y .claude/agents/ui-reviewer.md están en la raíz de tu repo.
Confirma que ya pegaste los tokens en global.css y tailwind.config.ts.
Abre una conversación nueva para el dashboard. Usa una conversación por módulo, porque el contexto limpio da mejores resultados.
Paso 1: Diagnóstico (todavía sin cambiar código)
Vamos a rediseñar el dashboard de KIPU'S ERP. Usa la skill kipus-ui.

Primero solo diagnostica, sin modificar archivos:
1. Ubica los archivos del dashboard (página, componentes y gráficos).
2. Usa el agente ui-reviewer para auditarlos.
3. Entrégame su informe y dime qué cambiarías primero.

Con esto Claude usa el agente para auditar el estado actual y tú ves los problemas reales antes de decidir nada.

Paso 2: Plan del rediseño (todavía sin código)
Según el informe, propón el rediseño del dashboard siguiendo kipus-ui.
Quiero ver antes de programar:
- Qué ve primero el administrador y qué acciones necesita (ventas de hoy, caja actual, productos por agotarse, comprobantes pendientes).
- La composición de la pantalla en orden de lectura (no cuatro tarjetas iguales).
- Qué gráficos se quedan, cuáles se quitan y por qué.
- Los estados de carga, vacío y error de cada bloque.
No cambies la lógica de datos ni las llamadas a la API, solo la interfaz.

Lee el plan y corrígelo con tus ideas ("quiero que la caja actual esté arriba", "quita el gráfico de X"). Este paso es el que más evita que salga algo genérico.

Paso 3: Construcción
Aprobado. Implementa el rediseño del dashboard.
Reglas: usa solo los tokens y componentes existentes de components/ui, no cambies tipos ni servicios, y respeta kipus-ui.
Trabaja por bloques y avísame al terminar cada uno.

Si es un dashboard grande, pídele que lo haga en dos o tres entregas (encabezado y resumen, gráficos, listas) y revísalas una por una.

Paso 4: Verificación con el agente
Ejecuta el agente ui-reviewer sobre el dashboard rediseñado.
Corrige todos los críticos e importantes que encuentre y vuelve a ejecutarlo hasta que quede limpio.
Después corre npx tsc --noEmit y npm run build para confirmar que no rompimos nada.

Aquí el agente hace de control de calidad: Claude corrige, el agente vuelve a revisar y se repite hasta que quede limpio.

Paso 5: Revisión visual tuya

Abre el dashboard en el navegador, tómale captura en escritorio y en móvil, y mándasela:

[captura] Se ve bien en general, pero [lo que no te gusta: el espacio entre bloques, el gráfico muy alto, etc.]. Ajusta eso manteniendo kipus-ui.

El agente detecta reglas incumplidas en el código, pero solo tú ves si la pantalla se siente bien. Este paso lo cubre.

Consejos para que funcione
Si Claude no parece aplicar la skill: nómbrala explícitamente (usa la skill kipus-ui) o escribe /kipus-ui al inicio del mensaje. Lo mismo con el agente: dile "usa el agente ui-reviewer".
No pidas todo en un solo mensaje: "rediseña el dashboard completo y que quede perfecto" da resultados peores que los cinco pasos, porque no hay punto de control.
Pega siempre el contexto de lo que no debe cambiar: lógica, rutas, tipos, llamadas a la API. Así el rediseño se queda en la interfaz.
Un módulo por conversación: al terminar el dashboard, abre una nueva para Ventas y repite el mismo flujo cambiando el nombre del módulo.