import { simulateDelay } from '@/services/mock/mockUtils';
import { ChatMessage, InsightPredictivo } from '../types/kipus-ia.types';
import { erpStore } from '@/services/erp/erpStore';
import { formatCurrency } from '@/utils/formatters';

export const kipusIaService = {
  async getInsights(): Promise<InsightPredictivo[]> {
    const productos = erpStore.getProductos();
    const caja = erpStore.getEstadoCaja();
    const bajoStock = productos.filter((p) => p.stock <= p.stockMinimo);

    const insights: InsightPredictivo[] = [];

    if (bajoStock.length > 0) {
      const p = bajoStock[0];
      insights.push({
        id: 'in-1',
        tipo: 'STOCK',
        titulo: `Alerta de Stock: ${p.nombre}`,
        descripcion: `Quedan solo ${p.stock} unidades en almacén (mínimo de seguridad: ${p.stockMinimo}). Riesgo de desabastecimiento.`,
        accionSugerida: `Generar orden de compra por al menos ${p.stockMinimo * 2} unidades.`,
      });
    }

    insights.push({
      id: 'in-2',
      tipo: 'FINANZAS',
      titulo: 'Control de Efectivo en Gaveta',
      descripcion: `Tienes un saldo en efectivo esperado de ${formatCurrency(
        caja.saldoEfectivoEsperado
      )} y ${formatCurrency(caja.ingresosDigitales)} en cobros electrónicos.`,
      accionSugerida: 'Mantener sencillo suficiente en caja y conciliar Yape al cierre de turno.',
    });

    insights.push({
      id: 'in-3',
      tipo: 'CLIENTE',
      titulo: 'Comportamiento de Clientes Recurrentes',
      descripcion:
        'Tus clientes con RUC generan el 65% del ticket promedio. Priorizar facturación y créditos comerciales con plazos máximos a 15 días.',
      accionSugerida: 'Fidelizar a las cuentas comerciales mediante cotizaciones rápidas.',
    });

    return simulateDelay(insights);
  },

  async responderConsulta(pregunta: string): Promise<ChatMessage> {
    const p = pregunta.toLowerCase();
    const productos = erpStore.getProductos();
    const caja = erpStore.getEstadoCaja();
    const ventas = erpStore.getVentas().filter((v) => v.estado !== 'ANULADA');
    const clientes = erpStore.getClientes();

    let respuesta =
      'Analizando datos de KIPU\'S ERP: El negocio se encuentra en operación normal con flujo comercial activo.';
    let dataPoints: { label: string; value: string }[] | undefined = undefined;

    if (p.includes('stock') || p.includes('reabastecer') || p.includes('comprar')) {
      const bajoStock = productos.filter((prod) => prod.stock <= prod.stockMinimo);
      if (bajoStock.length > 0) {
        respuesta = `He analizado tu almacén: tienes ${bajoStock.length} artículos por debajo del stock mínimo. Los más críticos son: ${bajoStock
          .slice(0, 2)
          .map((item) => `${item.nombre} (quedan ${item.stock} unid.)`)
          .join(', ')}. Te sugiero emitir órdenes de compra hoy mismo.`;
        dataPoints = bajoStock.slice(0, 3).map((item) => ({
          label: item.nombre,
          value: `${item.stock} en stock (Mín: ${item.stockMinimo})`,
        }));
      } else {
        respuesta = '¡Buenas noticias! Todos los artículos de tu catálogo se encuentran por encima del stock mínimo de seguridad.';
      }
    } else if (p.includes('caja') || p.includes('dinero') || p.includes('saldo')) {
      respuesta = `Tu estado de caja actual reporta un saldo en efectivo en gaveta de ${formatCurrency(
        caja.saldoEfectivoEsperado
      )} (Saldo inicial: ${formatCurrency(caja.saldoInicial)} + Ventas en efectivo: ${formatCurrency(
        caja.ingresosEfectivo
      )} - Egresos: ${formatCurrency(caja.egresosEfectivo)}). Además, tienes ${formatCurrency(
        caja.ingresosDigitales
      )} en billeteras digitales y transferencias.`;
      dataPoints = [
        { label: 'Efectivo en Gaveta', value: formatCurrency(caja.saldoEfectivoEsperado) },
        { label: 'Cobros Digitales (Yape/Plin/Tarj)', value: formatCurrency(caja.ingresosDigitales) },
      ];
    } else if (p.includes('venta') || p.includes('factura') || p.includes('hoy') || p.includes('producto')) {
      const totalVendido = ventas.reduce((acc, v) => acc + v.total, 0);
      respuesta = `Se han registrado ${ventas.length} comprobantes con un total facturado de ${formatCurrency(
        totalVendido
      )}. El producto más recurrente en las operaciones es el Aceite Motor 5W-30.`;
      dataPoints = [
        { label: 'Facturación Acumulada', value: formatCurrency(totalVendido) },
        { label: 'Comprobantes Emitidos', value: `${ventas.length} operaciones` },
      ];
    } else if (p.includes('cliente') || p.includes('deuda') || p.includes('cobrar')) {
      const conDeuda = clientes.filter((c) => c.saldoPendiente > 0);
      if (conDeuda.length > 0) {
        respuesta = `Tienes ${conDeuda.length} clientes con cuentas por cobrar pendientes. El monto mayor corresponde a ${
          conDeuda[0].nombre
        } con un saldo de ${formatCurrency(conDeuda[0].saldoPendiente)}.`;
        dataPoints = conDeuda.map((c) => ({
          label: c.nombre,
          value: formatCurrency(c.saldoPendiente),
        }));
      } else {
        respuesta = 'Todos los clientes registrados se encuentran con sus cuentas comerciales al día.';
      }
    }

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      content: respuesta,
      timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      dataPoints,
    };

    return simulateDelay(assistantMsg, 350);
  },
};
