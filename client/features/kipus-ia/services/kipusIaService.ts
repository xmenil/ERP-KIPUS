import { erpStore } from "@/services/erp/erpStore";
import {
  calcularReporte,
  rangoPeriodo,
  type DatosReporte,
} from "@/features/reportes/services/reportesService";
import type { RangoReporte } from "@/features/reportes/types/reportes.types";
import type { Cliente } from "@/features/clientes/types/clientes.types";
import type { Producto } from "@/features/productos/types/productos.types";
import type { EstadoCaja } from "@/features/caja/types/caja.types";
import { formatMoney, formatDate } from "@/utils/formatters";
import type { ChatMessage, PeriodoConsulta } from "../types/kipus-ia.types";

export interface DatosAsistente extends DatosReporte {
  productos: Producto[];
  clientes: Cliente[];
  caja: EstadoCaja;
}
export function rangoConsulta(
  periodo: PeriodoConsulta,
  ahora = new Date(),
): RangoReporte {
  if (
    periodo === "ESTE_MES" ||
    periodo === "MES_ANTERIOR" ||
    periodo === "ANIO_ACTUAL"
  )
    return rangoPeriodo(periodo, ahora);
  const fin = new Date(ahora);
  if (periodo === "AYER") fin.setUTCDate(fin.getUTCDate() - 1);
  const inicio = new Date(fin);
  inicio.setUTCDate(
    inicio.getUTCDate() -
      (periodo === "ULTIMOS_7_DIAS"
        ? 6
        : periodo === "ULTIMOS_30_DIAS"
          ? 29
          : 0),
  );
  const desde = inicio.toISOString().slice(0, 10),
    hasta = fin.toISOString().slice(0, 10);
  return {
    desde,
    hasta,
    label: `${formatDate(`${desde}T00:00:00`)} al ${formatDate(`${hasta}T00:00:00`)} (UTC)`,
  };
}
const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
export function stockCritico(productos: Producto[]) {
  return productos
    .filter((p) => p.activo !== false && p.stock <= p.stockMinimo)
    .sort((a, b) => {
      const aAgotado = a.stock <= 0,
        bAgotado = b.stock <= 0;
      return (
        Number(bAgotado) - Number(aAgotado) ||
        a.stock / Math.max(1, a.stockMinimo) -
          b.stock / Math.max(1, b.stockMinimo) ||
        a.stock - b.stock ||
        a.id.localeCompare(b.id)
      );
    });
}
export function clientesConSaldo(clientes: Cliente[]) {
  // The directory has inherited balances, not a reconciled receivables ledger.
  return clientes
    .filter((c) => Number.isFinite(c.saldoPendiente) && c.saldoPendiente > 0)
    .sort(
      (a, b) => b.saldoPendiente - a.saldoPendiente || a.id.localeCompare(b.id),
    );
}
function periodoPregunta(
  p: string,
  seleccionado: PeriodoConsulta,
): PeriodoConsulta | null {
  const opciones: PeriodoConsulta[] = [];
  if (/\bhoy\b/.test(p)) opciones.push("HOY");
  if (/\bayer\b/.test(p)) opciones.push("AYER");
  if (/ultimos? (7|siete) dias/.test(p)) opciones.push("ULTIMOS_7_DIAS");
  if (/ultimos? (30|treinta) dias/.test(p)) opciones.push("ULTIMOS_30_DIAS");
  if (/mes (pasado|anterior)/.test(p)) opciones.push("MES_ANTERIOR");
  if (/este mes|mes actual|del mes(?! (pasado|anterior))/.test(p))
    opciones.push("ESTE_MES");
  if (/este ano|ano actual/.test(p)) opciones.push("ANIO_ACTUAL");
  // Unsupported dates are clarified rather than silently replaced by the selected period.
  if (
    /\b\d{4}\b|\d{1,2}[/-]\d{1,2}|manana|semana|trimestre|semestre|anteayer|hace |\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|septiembre|octubre|noviembre|diciembre)\b|ultimo|pasad|anterior/.test(
      p.replace(
        /ultimos? (7|siete|30|treinta) dias|mes (pasado|anterior)/g,
        "",
      ),
    )
  )
    return null;
  return opciones.length > 1 ? null : opciones[0] || seleccionado;
}
let secuencia = 0;
export function responderPregunta(
  pregunta: string,
  datos: DatosAsistente,
  seleccionado: PeriodoConsulta = "ESTE_MES",
  ahora = new Date(),
): ChatMessage {
  const p = normalizar(pregunta);
  const mensaje: ChatMessage = {
    id: `ia-${ahora.getTime()}-${++secuencia}`,
    sender: "assistant",
    timestamp: ahora.toISOString(),
    content: "",
  };
  const aclarar = (texto: string) => ({
    ...mensaje,
    content: texto,
    fuente: "Asistente local basado en reglas",
  });
  if (!p || p.length > 500)
    return aclarar(
      "Escribe una pregunta de hasta 500 caracteres sobre ventas, productos vendidos, stock, caja, gastos o saldos de clientes.",
    );
  if (
    /\b(crea|crear|genera|generar|registra|registrar|anula|anular|elimina|eliminar|guarda|guardar|modifica|modificar|paga|pagar)\b/.test(
      p,
    )
  ) {
    const ruta = /compra|orden|pedido/.test(p)
      ? "/compras"
      : /gasto/.test(p)
        ? "/gastos"
        : /venta/.test(p)
          ? "/ventas"
          : /cliente|deuda/.test(p)
            ? "/clientes"
            : /caja/.test(p)
              ? "/caja"
              : "/inventario";
    return {
      ...mensaje,
      content:
        "Esta consulta no ha creado ni cambiado registros. Revisa los datos en el módulo correspondiente y usa su formulario y confirmación para realizar la operación.",
      fuente: "Ayuda de navegación; sin cambios guardados",
      enlace: { label: "Revisar el módulo", ruta },
    };
  }
  if (/predi|pronostic|proyect|proximo|futuro/.test(p))
    return aclarar(
      "No realizo predicciones. Puedo consultar ventas registradas por periodo, stock actual, caja o saldos guardados de clientes.",
    );
  const periodo = periodoPregunta(p, seleccionado);
  if (!periodo)
    return aclarar(
      "Precisa un solo periodo: hoy, ayer, últimos 7 días, últimos 30 días, mes actual, mes anterior o año actual. No puedo responder ese rango con seguridad.",
    );
  const esDeuda =
    /\b(deuda|deudas|debe|deben|cobrar|deudor|deudores)\b|moros|saldo.*cliente|cliente.*saldo/.test(
      p,
    );
  const esStock = /stock|reabaste|reponer|reposicion|comprar/.test(p);
  const esCaja = !esDeuda && /caja|efectivo|dinero|saldo/.test(p);
  const esProducto = /mas vendido|mayor rotacion|ranking|producto.*vend/.test(
    p,
  );
  const esGasto = /gast|egreso/.test(p);
  const esVenta =
    !esProducto && /venta|vendi|facturacion|facturad|cobro/.test(p);
  if (
    [esDeuda, esStock, esCaja, esProducto, esGasto, esVenta].filter(Boolean)
      .length !== 1
  )
    return aclarar(
      "Haz una consulta a la vez. Por ejemplo: «¿Cuál es el producto más vendido del mes?» o «¿Qué cliente tiene la mayor deuda?». También puedo consultar stock, caja, ventas y gastos.",
    );
  if (esDeuda || esStock || esCaja) {
    const periodoExplicito = /hoy|ayer|dias|semana|mes|ano/.test(p);
    if (periodoExplicito && periodo !== "HOY")
      return aclarar(
        "Stock, caja y saldos de clientes muestran su estado actual. No dispongo de una reconstrucción histórica. Pregunta por el estado actual; para ventas y gastos sí puedes elegir un periodo.",
      );
    mensaje.alcance =
      "Estado actual al consultar; no usa el selector de periodo";
  }
  if (esStock) {
    const criticos = stockCritico(datos.productos);
    mensaje.fuente = "Catálogo: productos activos, stock y mínimo configurado";
    mensaje.content = !datos.productos.some((p) => p.activo !== false)
      ? "No hay productos activos en el catálogo. Registra productos para consultar el stock."
      : !criticos.length
        ? "No hay productos activos en el mínimo configurado o por debajo de él."
        : `Hay ${criticos.length} productos activos en el mínimo o por debajo. Se ordenan primero los agotados y luego por proporción de stock respecto del mínimo. Revisa existencias y cantidades antes de preparar una compra; no se ha generado ninguna orden.`;
    mensaje.dataPoints = criticos.slice(0, 5).map((p) => ({
      label: `${p.nombre} · ${p.sku}`,
      value: `${p.stock} ${p.unidadMedida.toLowerCase()} · mínimo ${p.stockMinimo}`,
    }));
    mensaje.enlace = {
      label: "Revisar reposición en Compras",
      ruta: "/compras",
    };
  } else if (esDeuda) {
    const deudores = clientesConSaldo(datos.clientes);
    mensaje.fuente =
      "Directorio de Clientes: saldoPendiente guardado, incluidos clientes inactivos";
    const maximo = deudores[0]?.saldoPendiente;
    const mayores = deudores.filter((c) => c.saldoPendiente === maximo);
    mensaje.content = !datos.clientes.length
      ? "No hay clientes registrados."
      : !deudores.length
        ? "No hay saldos positivos guardados en las fichas."
        : `El mayor saldo guardado es ${formatMoney(maximo)} y corresponde a ${mayores.map((c) => c.nombre).join(", ")}. Hay ${deudores.length} fichas con saldo positivo. Estos saldos heredados del prototipo no están conciliados con ventas ni cobros; no acreditan deuda exigible ni que las demás cuentas estén al día.`;
    if (!deudores.length)
      mensaje.content += " Las fichas no son un estado de cuenta conciliado.";
    mensaje.dataPoints = deudores.slice(0, 5).map((c) => ({
      label: `${c.nombre}${c.activo === false ? " (inactivo)" : ""}`,
      value: formatMoney(c.saldoPendiente),
    }));
    mensaje.enlace = {
      label: "Consultar fichas de clientes",
      ruta: "/clientes",
    };
  } else if (esCaja) {
    const c = datos.caja;
    mensaje.fuente = "Caja: estado y cifras del turno guardado";
    mensaje.content = `La caja está ${c.abierta ? "abierta" : "cerrada"}. ${c.abierta ? "El efectivo esperado del turno" : "El efectivo esperado del último turno guardado"} es ${formatMoney(c.saldoEfectivoEsperado)}. No es un conteo físico ni confirma el saldo bancario. Cálculo del turno: saldo inicial + ventas en efectivo + otros ingresos en efectivo − egresos.`;
    mensaje.dataPoints = [
      { label: "Saldo inicial", value: formatMoney(c.saldoInicial) },
      { label: "Ventas en efectivo", value: formatMoney(c.ventasEfectivo) },
      {
        label: "Otros ingresos en efectivo",
        value: formatMoney(c.otrosIngresosEfectivo),
      },
      { label: "Egresos en efectivo", value: formatMoney(c.egresosEfectivo) },
      {
        label: "Efectivo esperado guardado",
        value: formatMoney(c.saldoEfectivoEsperado),
      },
      {
        label: "Cobros digitales del turno guardado",
        value: formatMoney(c.totalVentasDigitales),
      },
    ];
    mensaje.enlace = { label: "Consultar Caja", ruta: "/caja" };
  } else {
    const rango = rangoConsulta(periodo, ahora);
    const reporte = calcularReporte(datos, rango);
    mensaje.alcance = rango.label;
    mensaje.fuente =
      "Mismos cálculos de Reportes: ventas completadas, devoluciones en su fecha y gastos activos";
    if (esProducto) {
      const ranking = [...reporte.productos].sort(
        (a, b) =>
          b.unidadesVendidas - a.unidadesVendidas ||
          a.productoId.localeCompare(b.productoId),
      );
      const top = ranking[0];
      const mayores =
        top && top.unidadesVendidas > 0
          ? ranking.filter((p) => p.unidadesVendidas === top.unidadesVendidas)
          : [];
      mensaje.content = !mayores.length
        ? "No hay productos con unidades netas vendidas positivas en este periodo. Las devoluciones pueden dejar unidades en cero o negativas."
        : `Por unidades netas (ventas completadas menos devoluciones), el primer lugar corresponde a ${mayores.map((p) => p.nombre).join(", ")} con ${top.unidadesVendidas} unidades por producto. Incluye ventas a crédito; no equivale al producto con mayor cobro.`;
      mensaje.dataPoints = ranking.slice(0, 5).map((p) => ({
        label: `${p.nombre} · ${p.sku}`,
        value: `${p.unidadesVendidas} unidades netas · ${formatMoney(p.totalRecaudado)}`,
      }));
    } else if (esGasto) {
      const gastos = reporte.operaciones.filter((o) => o.tipo === "GASTO");
      mensaje.content = gastos.length
        ? `Hay ${gastos.length} gastos activos del periodo por ${formatMoney(reporte.financiero.gastosOperativos)}, considerando todos los medios de pago. Se excluyen anulados según su estado actual.`
        : "No hay gastos activos en este periodo.";
      mensaje.dataPoints = [
        {
          label: "Gastos activos",
          value: formatMoney(reporte.financiero.gastosOperativos),
        },
      ];
    } else {
      const f = reporte.financiero;
      mensaje.content = `Ventas completadas menos devoluciones: ${formatMoney(f.ventasTotales)}, con IGV incluido. Se excluyen pendientes y anuladas. Las devoluciones se descuentan en su propia fecha, aunque provengan de ventas anteriores. Los cobros se muestran aparte y solo incluyen movimientos registrados en Caja; el crédito no se supone cobrado.`;
      mensaje.dataPoints = [
        { label: "Ventas registradas", value: formatMoney(f.ventasBrutas) },
        { label: "Devoluciones", value: formatMoney(f.devoluciones) },
        {
          label: "Ventas menos devoluciones",
          value: formatMoney(f.ventasTotales),
        },
        {
          label: "Ventas a crédito registradas",
          value: formatMoney(f.ventasCredito),
        },
        {
          label: "Cobros netos registrados",
          value: formatMoney(f.cobrosRegistrados),
        },
      ];
    }
    mensaje.enlace = { label: "Contrastar en Reportes", ruta: "/reportes" };
  }
  return mensaje;
}
export const kipusIaService = {
  async responderConsulta(
    pregunta: string,
    periodo: PeriodoConsulta = "ESTE_MES",
  ): Promise<ChatMessage> {
    return responderPregunta(
      pregunta,
      {
        ventas: erpStore.getVentas(),
        devoluciones: erpStore.getDevoluciones(),
        gastos: erpStore.getGastos(),
        compras: erpStore.getCompras(),
        productos: erpStore.getProductos(),
        movimientos: erpStore.getMovimientosCaja(),
        clientes: erpStore.getClientes(),
        caja: erpStore.getEstadoCaja(),
      },
      periodo,
    );
  },
};
