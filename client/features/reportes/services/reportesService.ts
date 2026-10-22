import { erpStore } from "@/services/erp/erpStore";
import { isDateWithinRange } from "@/utils/dateRange";
import { formatDate } from "@/utils/formatters";
import type { Venta, Devolucion } from "@/features/ventas/types/ventas.types";
import type { Compra } from "@/features/compras/types/compras.types";
import type { Gasto } from "@/features/gastos/types/gastos.types";
import type { MovimientoCaja } from "@/features/caja/types/caja.types";
import type {
  PeriodoReporte,
  RangoReporte,
  Reporte,
  TopProductoReporte,
  OperacionReporte,
  SerieMensual,
} from "../types/reportes.types";

export interface DatosReporte {
  ventas: Venta[];
  devoluciones: Devolucion[];
  compras: Compra[];
  gastos: Gasto[];
  productos: {
    id: string;
    sku: string;
    nombre: string;
    categoria?: string;
    precioCompra: number;
  }[];
  movimientos: MovimientoCaja[];
}
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** UTC calendar dates match the store's ISO timestamps and date-only records. */
export function rangoPeriodo(
  periodo: PeriodoReporte,
  ahora = new Date(),
): RangoReporte {
  const year = ahora.getUTCFullYear();
  const month = ahora.getUTCMonth() - (periodo === "MES_ANTERIOR" ? 1 : 0);
  const start = new Date(
    Date.UTC(year, periodo === "ANIO_ACTUAL" ? 0 : month, 1),
  );
  const end =
    periodo === "MES_ANTERIOR" ? new Date(Date.UTC(year, month + 1, 0)) : ahora;
  const desde = start.toISOString().slice(0, 10);
  const hasta = end.toISOString().slice(0, 10);
  return {
    desde,
    hasta,
    label: `${formatDate(`${desde}T00:00:00`)} al ${formatDate(`${hasta}T00:00:00`)} (UTC)`,
  };
}

export function calcularReporte(
  datos: DatosReporte,
  rango: RangoReporte,
): Reporte {
  const dentro = (fecha: string) =>
    isDateWithinRange(fecha, rango.desde, rango.hasta);
  const vigentes = datos.ventas.filter((v) => v.estado === "COMPLETADA");
  const ventas = vigentes.filter((v) => dentro(v.fecha));
  const porId = new Map(vigentes.map((v) => [v.id, v]));
  const devoluciones = datos.devoluciones.filter(
    (d) => dentro(d.fecha) && porId.has(d.ventaId),
  );
  const gastos = datos.gastos.filter(
    (g) => g.estado !== "ANULADO" && dentro(g.fecha),
  );
  const compras = datos.compras.filter(
    (c) => c.estado === "RECIBIDO" && dentro(c.fechaRecepcion || c.fecha),
  );
  const movimientos = datos.movimientos.filter(
    (m) =>
      dentro(m.fecha) &&
      (m.origenTipo === "VENTA" || m.origenTipo === "DEVOLUCION"),
  );
  const catalogo = new Map(datos.productos.map((p) => [p.id, p]));
  const productos = new Map<string, TopProductoReporte>();
  const meses = new Map<string, SerieMensual>();
  const operaciones: OperacionReporte[] = [];
  let costo = 0,
    sinCosto = 0;
  const mes = (fecha: string) => {
    const key = fecha.slice(0, 7);
    if (!meses.has(key))
      meses.set(key, {
        periodo: key,
        ingresos: 0,
        costos: 0,
        gastos: 0,
        utilidad: 0,
      });
    return meses.get(key)!;
  };
  const acumularProducto = (
    id: string,
    nombre: string,
    sku: string,
    unidades: number,
    monto: number,
  ) => {
    const p = catalogo.get(id);
    const row = productos.get(id) || {
      productoId: id,
      nombre,
      sku: sku || p?.sku || id,
      categoria: p?.categoria,
      unidadesVendidas: 0,
      totalRecaudado: 0,
      porcentajeVenta: 0,
    };
    row.unidadesVendidas += unidades;
    row.totalRecaudado += monto;
    productos.set(id, row);
  };
  const acumularCosto = (
    id: string | undefined,
    unidades: number,
    fecha: string,
  ) => {
    const valor = id ? catalogo.get(id)?.precioCompra : undefined;
    const bucket = mes(fecha);
    if (valor === undefined || !Number.isFinite(valor) || valor < 0) {
      sinCosto++;
      bucket.costos = null;
      return;
    }
    const monto = valor * unidades;
    costo += monto;
    if (bucket.costos !== null) bucket.costos += monto;
  };
  let bruto = 0,
    devuelto = 0,
    credito = 0,
    baseVentas = 0,
    igvVentas = 0,
    boletas = 0,
    facturas = 0;
  for (const v of ventas) {
    bruto += v.total;
    if (v.metodoPago === "CREDITO") credito += v.total;
    mes(v.fecha).ingresos += v.total;
    if (v.tipoComprobante !== "NOTA_VENTA") {
      baseVentas += v.subtotal;
      igvVentas += v.igv;
    }
    if (v.tipoComprobante === "BOLETA") boletas += v.total;
    if (v.tipoComprobante === "FACTURA") facturas += v.total;
    const sumaItems = v.items.reduce((sum, item) => sum + item.subtotal, 0);
    if (!v.items.length) {
      sinCosto++;
      mes(v.fecha).costos = null;
    }
    let asignado = 0,
      pesoAcumulado = 0;
    for (const [index, item] of v.items.entries()) {
      pesoAcumulado += item.subtotal;
      const importe =
        index === v.items.length - 1
          ? round(v.total - asignado)
          : round(
              (sumaItems > 0
                ? round((pesoAcumulado * v.total) / sumaItems)
                : 0) - asignado,
            );
      asignado = round(asignado + importe);
      // Allocate document discounts proportionally using the saved sale total.
      acumularProducto(
        item.productoId,
        item.nombre,
        item.sku || "",
        item.cantidad,
        importe,
      );
      acumularCosto(item.productoId, item.cantidad, v.fecha);
    }
    operaciones.push({
      fecha: v.fecha,
      tipo: "VENTA",
      referencia: v.serieCorrelativo,
      concepto: v.clienteNombre,
      monto: v.total,
    });
  }
  for (const d of devoluciones) {
    const venta = porId.get(d.ventaId)!;
    devuelto += d.montoDevuelto;
    mes(d.fecha).ingresos -= d.montoDevuelto;
    if (venta.tipoComprobante !== "NOTA_VENTA" && venta.total > 0) {
      baseVentas -= (d.montoDevuelto * venta.subtotal) / venta.total;
      igvVentas -= (d.montoDevuelto * venta.igv) / venta.total;
    }
    if (venta.tipoComprobante === "BOLETA") boletas -= d.montoDevuelto;
    if (venta.tipoComprobante === "FACTURA") facturas -= d.montoDevuelto;
    const id =
      d.productoId || venta.items.find((i) => i.sku === d.sku)?.productoId;
    acumularProducto(
      id || `devolucion-${d.sku}`,
      d.productoNombre,
      d.sku,
      -d.cantidad,
      -d.montoDevuelto,
    );
    if (d.retornaAInventario) acumularCosto(id, -d.cantidad, d.fecha);
    operaciones.push({
      fecha: d.fecha,
      tipo: "DEVOLUCION",
      referencia: d.serieCorrelativo,
      concepto: d.productoNombre,
      monto: -d.montoDevuelto,
    });
  }
  let egresos = 0;
  for (const g of gastos) {
    egresos += g.monto;
    mes(g.fecha).gastos += g.monto;
    operaciones.push({
      fecha: g.fecha,
      tipo: "GASTO",
      referencia: g.comprobante || g.id,
      concepto: g.descripcion,
      monto: g.monto,
    });
  }
  let cobros = 0;
  for (const m of movimientos) {
    const monto = m.tipo === "INGRESO" ? m.monto : -m.monto;
    cobros += monto;
    operaciones.push({
      fecha: m.fecha,
      tipo: "COBRO",
      referencia: m.comprobanteRef || m.id,
      concepto: m.concepto,
      monto,
    });
  }
  for (const c of compras)
    operaciones.push({
      fecha: c.fechaRecepcion || c.fecha,
      tipo: "COMPRA",
      referencia: c.serieFactura,
      concepto: c.proveedorNombre,
      monto: c.total,
    });
  const neto = round(bruto - devuelto);
  const costoVentas = sinCosto ? null : round(costo);
  const utilidadBruta = costoVentas === null ? null : round(neto - costoVentas);
  const utilidad =
    utilidadBruta === null ? null : round(utilidadBruta - egresos);
  const financiero = {
    ventasTotales: neto,
    ventasBrutas: round(bruto),
    devoluciones: round(devuelto),
    ventasCredito: round(credito),
    cobrosRegistrados: round(cobros),
    costoVentas,
    utilidadBruta,
    gastosOperativos: round(egresos),
    utilidadNeta: utilidad,
    margenNetoPorcentaje:
      utilidad !== null && neto > 0 ? round((utilidad / neto) * 100) : null,
    itemsSinCosto: sinCosto,
    desgloseMensual: [...meses.values()]
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .map((m) => ({
        ...m,
        ingresos: round(m.ingresos),
        costos: m.costos === null ? null : round(m.costos),
        gastos: round(m.gastos),
        utilidad:
          m.costos === null ? null : round(m.ingresos - m.costos - m.gastos),
      })),
    filas: [
      { concepto: "Ventas registradas, incluido IGV", monto: round(bruto) },
      { concepto: "Devoluciones del periodo", monto: round(devuelto) },
      { concepto: "Ventas menos devoluciones", monto: neto },
      {
        concepto: "Costo estimado al precio de compra actual",
        monto: costoVentas,
      },
      {
        concepto: "Resultado bruto estimado, incluido IGV",
        monto: utilidadBruta,
      },
      { concepto: "Gastos operativos activos", monto: round(egresos) },
      { concepto: "Resultado estimado, incluido IGV", monto: utilidad },
      {
        concepto: "Ventas a crédito registradas (sin inferir saldo)",
        monto: round(credito),
      },
      { concepto: "Cobros netos registrados en Caja", monto: round(cobros) },
    ],
  };
  const totalCompras = round(compras.reduce((sum, c) => sum + c.total, 0));
  const baseCompras = round(totalCompras / 1.18);
  const igvCompras = round(totalCompras - baseCompras);
  const saldo = round(igvVentas - igvCompras);
  const sunat = {
    baseImponibleVentas: round(baseVentas),
    igvVentasDebito: round(igvVentas),
    baseImponibleCompras: baseCompras,
    igvComprasCredito: igvCompras,
    igvPagar: Math.max(0, saldo),
    creditoFiscalRemanente: Math.max(0, -saldo),
    ventasConBoleta: round(boletas),
    ventasConFactura: round(facturas),
    comprasConFactura: totalCompras,
    filas: [
      { concepto: "Boletas menos devoluciones", monto: round(boletas) },
      { concepto: "Facturas menos devoluciones", monto: round(facturas) },
      {
        concepto: "Base de ventas guardada, ajustada por devoluciones",
        monto: round(baseVentas),
      },
      {
        concepto: "IGV de ventas guardado, ajustado por devoluciones",
        monto: round(igvVentas),
      },
      {
        concepto: "Compras recibidas (validación fiscal no disponible)",
        monto: totalCompras,
      },
      { concepto: "Base de compras simulada al 18%", monto: baseCompras },
      { concepto: "IGV de compras simulado al 18%", monto: igvCompras },
      { concepto: "Diferencia positiva simulada", monto: Math.max(0, saldo) },
      { concepto: "Diferencia negativa simulada", monto: Math.max(0, -saldo) },
    ],
  };
  return {
    rango,
    financiero,
    sunat,
    productos: [...productos.values()]
      .map((p) => ({
        ...p,
        totalRecaudado: round(p.totalRecaudado),
        porcentajeVenta: neto > 0 ? round((p.totalRecaudado / neto) * 100) : 0,
      }))
      .sort(
        (a, b) =>
          b.totalRecaudado - a.totalRecaudado ||
          a.productoId.localeCompare(b.productoId),
      ),
    operaciones: operaciones.sort((a, b) => a.fecha.localeCompare(b.fecha)),
  };
}

export const reportesService = {
  async getReporte(periodo: PeriodoReporte = "ESTE_MES"): Promise<Reporte> {
    return calcularReporte(
      {
        ventas: erpStore.getVentas(),
        devoluciones: erpStore.getDevoluciones(),
        compras: erpStore.getCompras(),
        gastos: erpStore.getGastos(),
        productos: erpStore.getProductos(),
        movimientos: erpStore.getMovimientosCaja(),
      },
      rangoPeriodo(periodo),
    );
  },
};
