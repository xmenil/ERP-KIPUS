import { erpStore } from "@/services/erp/erpStore";
import type { Producto } from "@/features/productos/types/productos.types";
import type { Proveedor } from "@/features/proveedores/types/proveedores.types";
import type { Venta, Devolucion } from "@/features/ventas/types/ventas.types";
import { isDateWithinRange } from "@/utils/dateRange";

export type MotivoSugerencia = "AGOTADO" | "STOCK_CRITICO" | "ALTA_ROTACION";
export interface RecomendacionCompraItem {
  productoId: string;
  sku: string;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  stockActual: number;
  stockMinimo: number;
  unidadesVendidas: number;
  velocidadVentaDiaria: number;
  diasCoberturaRestante: number | null;
  motivo: MotivoSugerencia;
  motivoEtiqueta: string;
  prioridad: "CRITICA" | "ALTA" | "MEDIA";
  cantidadSugerida: number;
  precioCompraUnitario: number;
  subtotalEstimado: number;
  proveedorId?: string;
  proveedorNombre: string;
  proveedorRuc: string;
  seleccionado: boolean;
}
export interface ResumenSugerenciaCompras {
  items: RecomendacionCompraItem[];
  totalProductosSugeridos: number;
  totalUnidadesSugeridas: number;
  inversionTotalEstimada: number;
  conteoAgotados: number;
  conteoCriticos: number;
  conteoAltaRotacion: number;
  desde: string;
  hasta: string;
}
export interface DatosSugerencias {
  productos: Producto[];
  proveedores: Proveedor[];
  ventas: Venta[];
  devoluciones: Devolucion[];
}
/** Suggested quantities are reviewable rules, never a purchase or demand forecast. */
export function calcularSugerencias(
  datos: DatosSugerencias,
  ahora = new Date(),
): ResumenSugerenciaCompras {
  const hasta = ahora.toISOString().slice(0, 10),
    inicio = new Date(ahora);
  inicio.setUTCDate(inicio.getUTCDate() - 29);
  const desde = inicio.toISOString().slice(0, 10);
  const dentro = (fecha: string) => isDateWithinRange(fecha, desde, hasta);
  const vigentes = datos.ventas.filter((v) => v.estado === "COMPLETADA");
  const ventasPorId = new Map(vigentes.map((v) => [v.id, v]));
  const vendidos = new Map<string, number>();
  for (const v of vigentes.filter((v) => dentro(v.fecha)))
    for (const item of v.items)
      vendidos.set(
        item.productoId,
        (vendidos.get(item.productoId) || 0) + item.cantidad,
      );
  for (const d of datos.devoluciones.filter((d) => dentro(d.fecha))) {
    const venta = ventasPorId.get(d.ventaId);
    if (!venta) continue;
    const id =
      d.productoId || venta.items.find((i) => i.sku === d.sku)?.productoId;
    if (id) vendidos.set(id, (vendidos.get(id) || 0) - d.cantidad);
  }
  // Without a product/vendor relationship, do not assign an arbitrary supplier.
  const activos = datos.proveedores.filter((p) => p.activo !== false);
  const proveedor = activos.length === 1 ? activos[0] : undefined;
  const items: RecomendacionCompraItem[] = [];
  for (const p of datos.productos.filter((p) => p.activo !== false)) {
    const unidades = vendidos.get(p.id) || 0;
    const velocidad = Math.max(0, unidades) / 30;
    const cobertura =
      velocidad > 0 ? Math.round((p.stock / velocidad) * 10) / 10 : null;
    const motivo: MotivoSugerencia | null =
      p.stock <= 0
        ? "AGOTADO"
        : p.stock <= p.stockMinimo
          ? "STOCK_CRITICO"
          : unidades >= 8 && cobertura !== null && cobertura <= 6
            ? "ALTA_ROTACION"
            : null;
    if (!motivo) continue;
    const objetivo = Math.max(p.stockMinimo * 2, Math.ceil(velocidad * 15));
    const cantidad = Math.max(0, Math.ceil(objetivo - p.stock));
    items.push({
      productoId: p.id,
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoria,
      unidadMedida: p.unidadMedida,
      stockActual: p.stock,
      stockMinimo: p.stockMinimo,
      unidadesVendidas: unidades,
      velocidadVentaDiaria: velocidad,
      diasCoberturaRestante: cobertura,
      motivo,
      motivoEtiqueta:
        motivo === "AGOTADO"
          ? "Agotado"
          : motivo === "STOCK_CRITICO"
            ? "En el mínimo o por debajo"
            : "Cobertura de hasta 6 días al ritmo observado",
      prioridad:
        motivo === "AGOTADO"
          ? "CRITICA"
          : motivo === "STOCK_CRITICO"
            ? "ALTA"
            : "MEDIA",
      cantidadSugerida: cantidad,
      precioCompraUnitario: p.precioCompra,
      subtotalEstimado: Math.round(cantidad * p.precioCompra * 100) / 100,
      proveedorId: proveedor?.id,
      proveedorNombre:
        proveedor?.razonSocial || "Elegir proveedor en el formulario",
      proveedorRuc: proveedor?.ruc || "",
      seleccionado: cantidad > 0,
    });
  }
  const prioridad = { CRITICA: 0, ALTA: 1, MEDIA: 2 };
  items.sort(
    (a, b) =>
      prioridad[a.prioridad] - prioridad[b.prioridad] ||
      a.stockActual / Math.max(1, a.stockMinimo) -
        b.stockActual / Math.max(1, b.stockMinimo) ||
      a.productoId.localeCompare(b.productoId),
  );
  return {
    items,
    desde,
    hasta,
    totalProductosSugeridos: items.length,
    totalUnidadesSugeridas: items.reduce(
      (sum, i) => sum + i.cantidadSugerida,
      0,
    ),
    inversionTotalEstimada:
      Math.round(items.reduce((sum, i) => sum + i.subtotalEstimado, 0) * 100) /
      100,
    conteoAgotados: items.filter((i) => i.motivo === "AGOTADO").length,
    conteoCriticos: items.filter((i) => i.motivo === "STOCK_CRITICO").length,
    conteoAltaRotacion: items.filter((i) => i.motivo === "ALTA_ROTACION")
      .length,
  };
}
export const sugerenciaComprasService = {
  obtenerSugerencias(): ResumenSugerenciaCompras {
    return calcularSugerencias({
      productos: erpStore.getProductos(),
      proveedores: erpStore.getProveedores(),
      ventas: erpStore.getVentas(),
      devoluciones: erpStore.getDevoluciones(),
    });
  },
};
