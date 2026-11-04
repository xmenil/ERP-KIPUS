import { simulateDelay } from '@/services/mock/mockUtils';
import { ChatMessage, InsightPredictivo, ChatAction } from '../types/kipus-ia.types';
import { erpStore } from '@/services/erp/erpStore';
import { formatCurrency } from '@/utils/formatters';
import { APP_ROUTES } from '@/constants/routes';

export const kipusIaService = {
  async getInsights(): Promise<InsightPredictivo[]> {
    const productos = erpStore.getProductos();
    const caja = erpStore.getEstadoCaja();
    const clientes = erpStore.getClientes();
    const bajoStock = productos.filter((p) => p.stock <= p.stockMinimo);
    const conDeuda = clientes.filter((c) => c.saldoPendiente > 0);

    const insights: InsightPredictivo[] = [];

    // 1. Insight de Stock (Alerta o Rotación)
    if (bajoStock.length > 0) {
      const p = bajoStock[0];
      insights.push({
        id: 'in-1',
        tipo: 'STOCK',
        titulo: `Alerta de Stock: ${p.nombre}`,
        descripcion: `Quedan solo ${p.stock} unidades en almacén (mínimo de seguridad: ${p.stockMinimo}). Riesgo de desabastecimiento.`,
        accionSugerida: `Generar orden de compra por al menos ${p.stockMinimo * 2} unidades.`,
        querySugerida: `¿Qué productos debo reabastecer hoy?`,
      });
    } else {
      insights.push({
        id: 'in-1',
        tipo: 'STOCK',
        titulo: 'Rotación Saludable de Almacén',
        descripcion: `Todos los ${productos.length} artículos del catálogo cuentan con stock por encima del nivel de seguridad.`,
        accionSugerida: 'Monitorear la rotación de los productos de mayor salida (Arroz, Aceite, Azúcar).',
        querySugerida: '¿Cuáles son los productos con menor stock disponible?',
      });
    }

    // 2. Insight de Finanzas / Caja
    insights.push({
      id: 'in-2',
      tipo: 'FINANZAS',
      titulo: 'Control de Efectivo en Gaveta',
      descripcion: `Tienes un saldo en efectivo esperado de ${formatCurrency(
        caja.saldoEfectivoEsperado
      )} y ${formatCurrency(caja.totalVentasDigitales)} en cobros electrónicos.`,
      accionSugerida: 'Mantener sencillo suficiente en caja y conciliar Yape al cierre de turno.',
      querySugerida: '¿Cuál es el saldo y cuadre de mi caja?',
    });

    // 3. Insight de Clientes / Ventas
    if (conDeuda.length > 0) {
      const totalDeuda = conDeuda.reduce((acc, c) => acc + c.saldoPendiente, 0);
      insights.push({
        id: 'in-3',
        tipo: 'CLIENTE',
        titulo: 'Cuentas por Cobrar Pendientes',
        descripcion: `Tienes ${conDeuda.length} clientes con créditos comerciales por un total de ${formatCurrency(
          totalDeuda
        )}. El mayor saldo es de ${conDeuda[0].nombre}.`,
        accionSugerida: 'Enviar recordatorios amigables de cobranza para asegurar liquidez semanal.',
        querySugerida: '¿Qué clientes tienen saldos por cobrar pendientes?',
      });
    } else {
      insights.push({
        id: 'in-3',
        tipo: 'CLIENTE',
        titulo: 'Comportamiento de Clientes Recurrentes',
        descripcion:
          'Tus clientes con RUC generan el 65% del ticket promedio. Priorizar facturación y créditos comerciales con plazos máximos a 15 días.',
        accionSugerida: 'Fidelizar a las cuentas comerciales mediante cotizaciones rápidas.',
        querySugerida: '¿Quiénes son mis mejores clientes comerciales?',
      });
    }

    return simulateDelay(insights, 250);
  },

  async responderConsulta(pregunta: string): Promise<ChatMessage> {
    const raw = pregunta.trim();
    const p = raw.toLowerCase();

    const productos = erpStore.getProductos();
    const caja = erpStore.getEstadoCaja();
    const ventas = erpStore.getVentas().filter((v) => v.estado !== 'ANULADA');
    const clientes = erpStore.getClientes();
    const bajoStock = productos.filter((prod) => prod.stock <= prod.stockMinimo);
    const agotados = productos.filter((prod) => prod.stock === 0);
    const conDeuda = clientes.filter((c) => c.saldoPendiente > 0);

    let respuesta = '';
    let dataPoints: { label: string; value: string; badge?: string }[] | undefined = undefined;
    let actions: ChatAction[] | undefined = undefined;
    let category: ChatMessage['category'] = 'ANALISIS';
    let statusNote = 'Datos sincronizados en tiempo real con el ERP';

    // 1. INTENT: CAJA / EFECTIVO / CUADRE / ARQUEO / DINERO / YAPE / PLIN / SENCILLO
    if (
      p.includes('caja') ||
      p.includes('cuadre') ||
      p.includes('arqueo') ||
      p.includes('efectivo') ||
      p.includes('gaveta') ||
      p.includes('dinero') ||
      p.includes('saldo') ||
      p.includes('sencillo') ||
      p.includes('yape') ||
      p.includes('plin') ||
      p.includes('billetera')
    ) {
      category = 'FINANZAS';
      const esSoloDigital = p.includes('yape') || p.includes('plin') || p.includes('digital');

      if (esSoloDigital) {
        respuesta = `En cobros digitales y transferencias tienes acumulado ${formatCurrency(
          caja.totalVentasDigitales
        )} hoy. El desglose es: Yape ${formatCurrency(
          caja.ventasDigitales.yape
        )}, Plin ${formatCurrency(caja.ventasDigitales.plin)} y POS Tarjetas ${formatCurrency(
          caja.ventasDigitales.tarjeta
        )}.`;
        dataPoints = [
          { label: 'Yape (BCP)', value: formatCurrency(caja.ventasDigitales.yape), badge: 'Digital' },
          { label: 'Plin (Interbank/BBVA)', value: formatCurrency(caja.ventasDigitales.plin), badge: 'Digital' },
          { label: 'Tarjetas POS (Izipay/Niubiz)', value: formatCurrency(caja.ventasDigitales.tarjeta), badge: 'Digital' },
          { label: 'Total Digital del Turno', value: formatCurrency(caja.totalVentasDigitales), badge: 'Total' },
        ];
        actions = [
          { label: 'Ver Cuadre de Caja', path: '/ventas?tab=caja' },
          { label: 'Ver Movimientos del Turno', path: '/ventas?tab=caja' },
        ];
      } else {
        const retiroSugerido = caja.saldoEfectivoEsperado > 800;
        respuesta = `Tu estado de caja actual reporta un saldo en gaveta de ${formatCurrency(
          caja.saldoEfectivoEsperado
        )} en efectivo. Se inició con ${formatCurrency(
          caja.saldoInicial
        )} de sencillo, se han sumado ${formatCurrency(
          caja.ventasEfectivo
        )} por ventas en efectivo y se han descontado ${formatCurrency(
          caja.egresosEfectivo
        )} en egresos menores. ${
          retiroSugerido
            ? '💡 Sugerencia de seguridad: Superas los S/ 800.00 en gaveta; se aconseja realizar un retiro preventivo a caja fuerte.'
            : 'El nivel de sencillo es adecuado para operar sin problemas de vuelto.'
        }`;

        dataPoints = [
          { label: 'Efectivo disponible en gaveta', value: formatCurrency(caja.saldoEfectivoEsperado), badge: 'Gaveta' },
          { label: 'Cobros electrónicos (Yape/Plin/POS)', value: formatCurrency(caja.totalVentasDigitales), badge: 'Digital' },
          { label: 'Sencillo inicial de turno', value: formatCurrency(caja.saldoInicial) },
          { label: 'Total general ventas hoy', value: formatCurrency(caja.totalVentasGeneral) },
        ];

        actions = [
          { label: 'Realizar Cuadre de Caja', path: '/ventas?tab=caja', variant: 'primary' },
          { label: 'Registrar Ingreso / Egreso', path: '/ventas?tab=caja' },
        ];
      }
    }

    // 2. INTENT: STOCK / INVENTARIO / REABASTECER / AGOTADO / ALMACÉN / COMPRAS
    else if (
      p.includes('stock') ||
      p.includes('inventario') ||
      p.includes('reabastecer') ||
      p.includes('comprar') ||
      p.includes('agotado') ||
      p.includes('almacen') ||
      p.includes('almacén') ||
      p.includes('pedido') ||
      p.includes('kardex')
    ) {
      category = 'STOCK';

      if (bajoStock.length > 0) {
        const listaNombres = bajoStock
          .slice(0, 3)
          .map((i) => `• ${i.nombre}: quedan ${i.stock} (mínimo ${i.stockMinimo})`)
          .join('\n');

        const presupuestoEstimado = bajoStock.reduce(
          (sum, i) => sum + (i.stockMinimo * 2 - i.stock) * i.precioCompra,
          0
        );

        respuesta = `He analizado tu almacén: detecté ${bajoStock.length} artículo(s) por debajo de su stock de seguridad${
          agotados.length > 0 ? ` (de los cuales ${agotados.length} están completamente agotados)` : ''
        }.\n\nLos más críticos para venta diaria son:\n${listaNombres}\n\nSe estima una inversión aproximada de ${formatCurrency(
          presupuestoEstimado
        )} para reponer el inventario óptimo con tus proveedores habituales.`;

        dataPoints = bajoStock.slice(0, 3).map((item) => ({
          label: item.nombre,
          value: `${item.stock} unid.`,
          badge: item.stock === 0 ? 'Agotado' : 'Crítico',
        }));

        actions = [
          { label: 'Ver Inventario y Stock', path: APP_ROUTES.INVENTARIO, variant: 'primary' },
          { label: 'Generar Orden de Compra', path: APP_ROUTES.COMPRAS },
        ];
      } else {
        respuesta = `¡Excelente! Los ${productos.length} productos registrados en tu catálogo cuentan con stock suficiente por encima del mínimo de seguridad. Tu inventario está cubierto para las operaciones de la semana.`;
        dataPoints = [
          { label: 'Total productos monitoreados', value: `${productos.length} artículos` },
          { label: 'Productos bajo mínimo', value: '0 artículos', badge: 'Óptimo' },
        ];
        actions = [{ label: 'Explorar Catálogo', path: APP_ROUTES.INVENTARIO }];
      }
    }

    // 3. INTENT: VENTAS / FACTURAS / BOLETAS / COMBO / COMPROBANTES / HOY / FACTURACIÓN
    else if (
      p.includes('venta') ||
      p.includes('vendido') ||
      p.includes('factura') ||
      p.includes('boleta') ||
      p.includes('comprobante') ||
      p.includes('facturacion') ||
      p.includes('facturación') ||
      p.includes('cuanto hemos vendido') ||
      p.includes('cuánto hemos vendido') ||
      p.includes('cuanto vendi') ||
      p.includes('cuánto vendí')
    ) {
      category = 'VENTAS';
      const totalVendido = ventas.reduce((acc, v) => acc + v.total, 0);
      const ticketPromedio = ventas.length > 0 ? totalVendido / ventas.length : 0;
      const prodMasRecurrente = productos.length > 0 ? productos[0].nombre : 'Arroz Costeño Extra 1 kg';

      respuesta = `Hoy se han registrado ${ventas.length} comprobantes con una facturación total de ${formatCurrency(
        totalVendido
      )}. El ticket promedio de compra se ubica en ${formatCurrency(
        ticketPromedio
      )} por cliente. El artículo con mayor frecuencia de salida en mostrador es "${prodMasRecurrente}".`;

      dataPoints = [
        { label: 'Facturación Acumulada Hoy', value: formatCurrency(totalVendido), badge: 'Ventas' },
        { label: 'Comprobantes Emitidos', value: `${ventas.length} transacciones` },
        { label: 'Ticket Promedio', value: formatCurrency(ticketPromedio) },
        { label: 'Artículo más vendido', value: prodMasRecurrente },
      ];

      actions = [
        { label: 'Punto de Venta (Nueva Venta)', path: APP_ROUTES.VENTAS, variant: 'primary' },
        { label: 'Ver Reporte de Ventas', path: APP_ROUTES.REPORTES },
      ];
    }

    // 4. INTENT: CLIENTES / DEUDAS / COBRAR / CRÉDITO / FIADO / CUENTAS POR COBRAR
    else if (
      p.includes('cliente') ||
      p.includes('deuda') ||
      p.includes('cobrar') ||
      p.includes('credito') ||
      p.includes('crédito') ||
      p.includes('fiado') ||
      p.includes('cuenta por cobrar')
    ) {
      category = 'CLIENTES';

      if (conDeuda.length > 0) {
        const totalDeuda = conDeuda.reduce((acc, c) => acc + c.saldoPendiente, 0);
        const topDeudor = conDeuda[0];

        respuesta = `Tienes ${conDeuda.length} cliente(s) con créditos comerciales pendientes por cobrar, sumando un total de ${formatCurrency(
          totalDeuda
        )}. El monto principal corresponde a "${topDeudor.nombre}" (${topDeudor.documentoTipo}: ${topDeudor.numeroDocumento}) con un saldo pendiente de ${formatCurrency(
          topDeudor.saldoPendiente
        )}.`;

        dataPoints = conDeuda.slice(0, 3).map((c) => ({
          label: c.nombre,
          value: formatCurrency(c.saldoPendiente),
          badge: c.documentoTipo,
        }));

        actions = [
          { label: 'Ver Directorio de Clientes', path: APP_ROUTES.CLIENTES, variant: 'primary' },
          { label: 'Registrar Cobranza', path: APP_ROUTES.CLIENTES },
        ];
      } else {
        respuesta = `¡Todo en orden! Todos tus clientes registrados están al día en sus pagos. No hay cuentas por cobrar vencidas en este momento.`;
        dataPoints = [
          { label: 'Total clientes comerciales', value: `${clientes.length} registrados` },
          { label: 'Cuentas morosas', value: '0 pendientes', badge: 'Al día' },
        ];
        actions = [{ label: 'Ver Directorio de Clientes', path: APP_ROUTES.CLIENTES }];
      }
    }

    // 5. INTENT: PRODUCTOS ESTRELLA / RANKING / MÁS VENDIDO / CATEGORÍAS
    else if (
      p.includes('mas vendido') ||
      p.includes('más vendido') ||
      p.includes('estrella') ||
      p.includes('ranking') ||
      p.includes('producto lider') ||
      p.includes('margen')
    ) {
      category = 'VENTAS';
      const prodTop1 = productos[0]?.nombre || 'Arroz Costeño Extra 1 kg';
      const prodTop2 = productos[1]?.nombre || 'Aceite Primor Clásico 900 ml';
      const prodTop3 = productos[2]?.nombre || 'Azúcar Rubia Cartavio 1 kg';

      respuesta = `Tus productos con mayor rotación e impacto en margen en Tingo María son:\n1. ${prodTop1} (Líder en ventas diarias)\n2. ${prodTop2} (Alta rotación familiar)\n3. ${prodTop3} (Compra recurrente)\n\nSe recomienda tener siempre al menos 1 semana de stock de cobertura para estos tres artículos.`;

      dataPoints = [
        { label: '1er Lugar', value: prodTop1, badge: 'Líder' },
        { label: '2do Lugar', value: prodTop2 },
        { label: '3er Lugar', value: prodTop3 },
      ];

      actions = [
        { label: 'Ver Catálogo Completo', path: APP_ROUTES.INVENTARIO },
        { label: 'Ver Reportes de Rentabilidad', path: APP_ROUTES.REPORTES },
      ];
    }

    // 6. INTENT: DIAGNÓSTICO GENERAL / RESUMEN 360 / CÓMO VA EL NEGOCIO
    else if (
      p.includes('diagnostico') ||
      p.includes('diagnóstico') ||
      p.includes('resumen') ||
      p.includes('balance') ||
      p.includes('como va') ||
      p.includes('cómo va') ||
      p.includes('situacion') ||
      p.includes('situación') ||
      p.includes('general')
    ) {
      category = 'ANALISIS';
      const totalVendido = ventas.reduce((acc, v) => acc + v.total, 0);
      const totalDeuda = conDeuda.reduce((acc, c) => acc + c.saldoPendiente, 0);

      respuesta = `Diagnóstico Ejecutivo 360° de KIPU'S ERP para hoy:\n• Caja: Operativa con ${formatCurrency(
        caja.saldoEfectivoEsperado
      )} en gaveta y ${formatCurrency(caja.totalVentasDigitales)} en canales digitales.\n• Ventas: ${
        ventas.length
      } comprobantes emitidos por un total de ${formatCurrency(totalVendido)}.\n• Almacén: ${
        bajoStock.length > 0
          ? `${bajoStock.length} artículos requieren abastecimiento pronto.`
          : 'Stock cubierto en todos los productos.'
      }\n• Cuentas por cobrar: ${
        conDeuda.length > 0 ? `${formatCurrency(totalDeuda)} pendientes de cobro.` : 'Al día, sin deudas críticas.'
      }`;

      dataPoints = [
        { label: 'Efectivo en Gaveta', value: formatCurrency(caja.saldoEfectivoEsperado) },
        { label: 'Cobros Digitales', value: formatCurrency(caja.totalVentasDigitales) },
        { label: 'Ventas de Hoy', value: formatCurrency(totalVendido) },
        { label: 'Alertas de Stock', value: `${bajoStock.length} críticas`, badge: bajoStock.length > 0 ? 'Atención' : 'Ok' },
      ];

      actions = [
        { label: 'Ver Dashboard Ejecutivo', path: APP_ROUTES.DASHBOARD, variant: 'primary' },
        { label: 'Ir a Cuadre de Caja', path: '/ventas?tab=caja' },
      ];
    }

    // 7. INTENT: CONSEJOS / OPTIMIZACIÓN / SUGERENCIAS / MEJORAS
    else if (
      p.includes('consejo') ||
      p.includes('recomienda') ||
      p.includes('recomendacion') ||
      p.includes('recomendación') ||
      p.includes('optimizar') ||
      p.includes('mejorar') ||
      p.includes('ganar mas') ||
      p.includes('ganar más')
    ) {
      category = 'ANALISIS';
      respuesta = `Tres recomendaciones prioritarias para maximizar el rendimiento de tu negocio hoy:\n1. Cuadre y concilio de Yape/Plin: Revisa los cobros QR antes de cerrar el turno para evitar diferencias al fin del día.\n2. Compra anticipada de canasta básica: Los granos y aceites rotan rápido; conviene pactar descuentos por volumen con mayoristas.\n3. Incentivar compras con factura a negocios locales: Los restaurantes y hospedajes compran con ticket 3 veces mayor.`;

      dataPoints = [
        { label: 'Prioridad 1', value: 'Cuadre riguroso de caja' },
        { label: 'Prioridad 2', value: 'Abastecimiento de alta rotación' },
        { label: 'Prioridad 3', value: 'Fidelización comercial con RUC' },
      ];

      actions = [
        { label: 'Ver Cuadre de Caja', path: '/ventas?tab=caja' },
        { label: 'Ver Reportes Comerciales', path: APP_ROUTES.REPORTES },
      ];
    }

    // 8. INTENT: SALUDOS / QUÉ HACES / AYUDA / INICIO
    else if (
      p.includes('hola') ||
      p.includes('buenos dias') ||
      p.includes('buenas tardes') ||
      p.includes('buenas noches') ||
      p.includes('ayuda') ||
      p.includes('que puedes hacer') ||
      p.includes('qué puedes hacer') ||
      p.includes('quien eres') ||
      p.includes('quién eres')
    ) {
      category = 'AYUDA';
      respuesta = `¡Hola! Soy KIPU'S IA, tu copiloto inteligente de gestión. Estoy conectada a tu base de datos de caja, almacén, ventas, kardex y clientes en tiempo real.\n\nPuedes preguntarme sobre:\n• Dinero en gaveta y cuadre de caja diario\n• Productos con stock crítico por reabastecer\n• Total facturado hoy y ticket promedio\n• Deudas comerciales y clientes morosos\n• Consejos para optimizar compras y márgenes`;

      dataPoints = [
        { label: 'Módulos integrados', value: 'Caja, Almacén, Ventas, Clientes', badge: 'Conectado' },
        { label: 'Tiempo de respuesta', value: 'Instantáneo', badge: 'En línea' },
      ];

      actions = [
        { label: 'Consultar Cuadre de Caja', query: '¿Cuál es el saldo y cuadre de mi caja?' },
        { label: 'Consultar Stock Crítico', query: '¿Qué productos debo reabastecer hoy?' },
        { label: 'Consultar Ventas del Día', query: '¿Cuánto hemos vendido hoy?' },
        { label: 'Diagnóstico 360°', query: 'Dame un diagnóstico general del negocio' },
      ];
    }

    // 9. FALLBACK INTELIGENTE
    else {
      category = 'ANALISIS';
      const totalVendido = ventas.reduce((acc, v) => acc + v.total, 0);

      respuesta = `He analizado tu consulta en KIPU'S ERP. Actualmente tu negocio opera de manera continua:\n• Caja en gaveta: ${formatCurrency(
        caja.saldoEfectivoEsperado
      )} en efectivo más ${formatCurrency(caja.totalVentasDigitales)} por medios electrónicos.\n• Facturación del turno: ${formatCurrency(
        totalVendido
      )} en ${ventas.length} comprobantes.\n• Almacén: ${
        bajoStock.length > 0 ? `${bajoStock.length} productos con stock por revisar.` : 'Catálogo con stock adecuado.'
      }\n\n¿Deseas profundizar en algún módulo específico como caja, productos o clientes?`;

      dataPoints = [
        { label: 'Saldo en Gaveta', value: formatCurrency(caja.saldoEfectivoEsperado) },
        { label: 'Facturación Hoy', value: formatCurrency(totalVendido) },
        { label: 'Productos en Catálogo', value: `${productos.length} artículos` },
      ];

      actions = [
        { label: 'Ver Cuadre de Caja', path: '/ventas?tab=caja' },
        { label: 'Ver Inventario', path: APP_ROUTES.INVENTARIO },
        { label: 'Ver Ventas (POS)', path: APP_ROUTES.VENTAS },
      ];
    }

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      content: respuesta,
      timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      dataPoints,
      actions,
      category,
      statusNote,
    };

    return simulateDelay(assistantMsg, 400);
  },
};
