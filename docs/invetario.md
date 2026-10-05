Listed directory inventario
Listed directory components
Viewed InventarioPage.tsx:1-160
Viewed InventarioPage.tsx:250-400
Viewed InventarioFlowBanner.tsx:1-100
Viewed inventarioService.ts:1-89

El **Módulo de Inventario** de KIPU'S ERP es el centro operativo encargado de **controlar las existencias físicas, valorizar el stock en dinero y registrar la trazabilidad histórica de cada entrada y salida (Kardex)** de la empresa.

Al ser un prototipo donde la lógica reside en el cliente ([erpStore.ts](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/services/erp/erpStore.ts)), el módulo está completamente interconectado de forma reactiva con los demás módulos (Ventas, Compras y Caja).

---

### 1. ¿Qué hace este módulo? (Objetivo de Negocio)

Responde a las cuatro preguntas críticas de cualquier comercio o ferretería/repuestera:
1. **¿Cuánto stock tengo y dónde está ubicado?** (Estantes, pasillos, vitrinas o sedes).
2. **¿Qué productos están por terminarse o ya se agotaron?** (Alertas automáticas comparando `stock` vs `stockMinimo`).
3. **¿Cuánto dinero tengo inmovilizado en mercadería?** (Valorizado a precio de costo y a precio de venta).
4. **¿Por qué varió el stock?** (Historial auditable de quién, cuándo y con qué comprobante ingresó o salió un producto).

---

### 2. Estructura y Vistas: El Flujo Operativo en 6 Etapas

La pantalla principal ([InventarioPage.tsx](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/pages/InventarioPage.tsx)) está guiada por un banner visual ([InventarioFlowBanner.tsx](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/features/inventario/components/InventarioFlowBanner.tsx)) y organizada en **6 pestañas de trabajo**:

#### Pestaña 1: Control de Niveles de Stock (`TablaControlStock.tsx`)
* **Qué contiene:** Una tabla densa con el catálogo completo de existencias.
* **Semáforo de estados:**
  * **Suficiente:** Stock holgado por encima del mínimo.
  * **Por agotarse:** `stock <= stockMinimo` (requiere reposición urgente).
  * **Agotado:** `stock === 0`.
* **Seguridad y roles:** Si el usuario conectado tiene rol `CAJERO`, las columnas de costo e inversión se ocultan automáticamente (`useAuth`).
* **Acciones directas:** Botones rápidos por fila para `+ Recibir` mercadería o `Cotejar` en conteo físico.

#### Pestaña 2: Recepción de Mercancía (`RecepcionMercanciaDialog.tsx`)
* **Qué hace:** Registra la llegada de compras desde proveedores con Guía de Remisión o Factura física.
* **Cómo impacta:** Incrementa inmediatamente las unidades del producto en el catálogo y actualiza el costo de adquisición si vino a un precio distinto.

#### Pestaña 3: Registro de Movimientos / Kardex Continuo
* **Qué hace:** Libro diario de almacén. Registra cada transacción cronológicamente con:
  * **Tipo:** `ENTRADA` (compra o ajuste positivo), `SALIDA` (venta POS, merma o consumo interno) o `AJUSTE`.
  * **Cantidad y Stock Resultante:** Saldo que quedó después de la operación.
  * **Referencia y Usuario:** Boleta/Factura que lo motivó y el nombre de quien operó el sistema.
* **Filtros rápidos:** Búsqueda por SKU/descripción, filtro por tipo (Entrada/Salida/Ajuste) y filtro por almacén/sede.

#### Pestaña 4: Auditorías y Conteo Físico (`ModuloAuditoriaFisica.tsx` + `AuditoriaConteoDialog.tsx`)
* **Qué hace:** Resuelve las discrepancias entre lo que dice el sistema y lo que realmente hay en el estante (conteo ciego o cotejo físico).
* **Manejo de mermas y sobrantes:**
  * Si el conteo físico es menor al sistema, genera una **Salida por Merma / Deterioro / Pérdida**.
  * Si es mayor, genera una **Entrada por Ajuste de Inventario**.
  * Requiere un motivo u observación obligatoria para evitar ajustes arbitrarios sin justificación.

#### Pestaña 5: Clasificación y Multialmacén
* **Qué hace:** Muestra el desglose de existencias por almacén físico:
  * *Almacén Principal (Jr. Miraflores)* vs *Tienda Mostrador (Av. Tito Jaime)*.
  * Zonas y ubicaciones (Estante A, Vitrina 1, Tarimas de baterías).

#### Pestaña 6: Análisis y Rotación (`AnalisisRotacionReporte.tsx`)
* **Qué hace:** Reporte de salud del inventario:
  * Clasificación de rotación (alta rotación vs baja rotación / stock dormido).
  * Inversión monetaria desglosada por categoría (Lubricantes, Filtros, Químicos, Frenos, etc.).

---

### 3. ¿Cómo funciona por dentro? (Mecanismo y Reactividad)

Toda la persistencia y coordinación ocurre en tiempo real en [erpStore.ts](file:///c:/Users/ThikPad/Desktop/ERP-KIPUS/client/services/erp/erpStore.ts):

```
     [VENTAS (POS)]                [COMPRAS / RECEPCIÓN]              [AJUSTES DE AUDITORÍA]
            │                                 │                                  │
     Descuenta stock                  Aumenta stock                       Corrige stock
    al cobrar boleta                 al recibir guía                     físico vs sistema
            │                                 │                                  │
            ▼                                 ▼                                  ▼
     ┌─────────────────────────────────────────────────────────────────────────────┐
     │                             erpStore (en memoria)                           │
     │  - Actualiza Producto.stock                                                 │
     │  - Genera MovimientoKardex (con fecha, usuario, tipo y stock resultante)    │
     │  - Notifica a los suscriptores: notify() -> subscribeToErp()               │
     └─────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
                    Todos los componentes se refrescan al instante
```

* **Sin backend (Prototipo reactivo):** Cualquier acción realizada en una venta en el mostrador descuenta el inventario de inmediato; si abres la pestaña de Inventario o Kardex, ya verás el nuevo stock y el registro correspondiente sin necesidad de recargar la página.