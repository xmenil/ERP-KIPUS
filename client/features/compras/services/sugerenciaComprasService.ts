import { erpStore } from '@/services/erp/erpStore';
import { Producto } from '@/features/productos/types/productos.types';
import { Proveedor } from '@/features/proveedores/types/proveedores.types';

export type MotivoSugerencia = 'AGOTADO' | 'STOCK_CRITICO' | 'ALTA_ROTACION';

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
  diasCoberturaRestante: number;
  motivo: MotivoSugerencia;
  motivoEtiqueta: string;
  prioridad: 'CRITICA' | 'ALTA' | 'MEDIA';
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
}

/**
 * Mapea la categoría de producto con el proveedor más adecuado registrado en el ERP
 */
function asignarProveedorSugerido(
  producto: Producto,
  proveedores: Proveedor[]
): { id?: string; razonSocial: string; ruc: string } {
  if (proveedores.length === 0) {
    return {
      razonSocial: 'Distribuidor Mayorista Local',
      ruc: '20100055237',
    };
  }

  const cat = producto.categoria.toLowerCase();
  const nom = producto.nombre.toLowerCase();

  // 1. Lácteos y derivados -> Leche Gloria
  if (cat.includes('lácteos') || nom.includes('gloria') || nom.includes('leche') || nom.includes('yogurt')) {
    const prov = proveedores.find(
      (p) => p.razonSocial.toLowerCase().includes('gloria') || p.rubro.toLowerCase().includes('lácteo')
    );
    if (prov) return { id: prov.id, razonSocial: prov.razonSocial, ruc: prov.ruc };
  }

  // 2. Bebidas y Gaseosas -> Arca Continental Lindley o Backus
  if (cat.includes('bebidas') || nom.includes('coca') || nom.includes('inca') || nom.includes('san luis')) {
    const prov = proveedores.find(
      (p) =>
        p.razonSocial.toLowerCase().includes('lindley') ||
        p.razonSocial.toLowerCase().includes('arca') ||
        p.rubro.toLowerCase().includes('bebida')
    );
    if (prov) return { id: prov.id, razonSocial: prov.razonSocial, ruc: prov.ruc };
  }

  if (cat.includes('licores') || nom.includes('cerveza') || nom.includes('cristal') || nom.includes('pilsen')) {
    const prov = proveedores.find(
      (p) => p.razonSocial.toLowerCase().includes('backus') || p.rubro.toLowerCase().includes('cerveza')
    );
    if (prov) return { id: prov.id, razonSocial: prov.razonSocial, ruc: prov.ruc };
  }

  // 3. Abarrotes, Harinas, Aceites, Fideos, Limpieza -> Alicorp
  if (
    cat.includes('abarrotes') ||
    cat.includes('limpieza') ||
    nom.includes('primor') ||
    nom.includes('don vittorio') ||
    nom.includes('costeño') ||
    nom.includes('bolívar')
  ) {
    const prov = proveedores.find(
      (p) => p.razonSocial.toLowerCase().includes('alicorp') || p.rubro.toLowerCase().includes('abarrotes')
    );
    if (prov) return { id: prov.id, razonSocial: prov.razonSocial, ruc: prov.ruc };
  }

  // Fallback: primer proveedor activo
  const primerProv = proveedores.find((p) => p.activo) || proveedores[0];
  return {
    id: primerProv.id,
    razonSocial: primerProv.razonSocial,
    ruc: primerProv.ruc,
  };
}

export const sugerenciaComprasService = {
  /**
   * Analiza el inventario actual, las ventas registradas y los movimientos de Kardex
   * para generar una recomendación inteligente de compras por stock y rotación.
   */
  obtenerSugerencias(): ResumenSugerenciaCompras {
    const productos = erpStore.getProductos();
    const ventas = erpStore.getVentas();
    const kardex = erpStore.getKardex();
    const proveedores = erpStore.getProveedores();

    // 1. Mapear ventas por producto (cantidad acumulada en POS y salidas de Kardex)
    const ventasPorProducto: Record<string, number> = {};

    // Ventas registradas
    ventas.forEach((v) => {
      v.items.forEach((it) => {
        const keyId = it.productoId || '';
        const keyNom = it.nombre.toLowerCase();
        if (keyId) ventasPorProducto[keyId] = (ventasPorProducto[keyId] || 0) + it.cantidad;
        ventasPorProducto[keyNom] = (ventasPorProducto[keyNom] || 0) + it.cantidad;
      });
    });

    // Salidas de Kardex
    kardex
      .filter((k) => k.tipo === 'SALIDA')
      .forEach((k) => {
        const keyNom = k.productoNombre.toLowerCase();
        const keySku = k.sku.toLowerCase();
        ventasPorProducto[keyNom] = (ventasPorProducto[keyNom] || 0) + k.cantidad;
        ventasPorProducto[keySku] = (ventasPorProducto[keySku] || 0) + k.cantidad;
      });

    const itemsRecomendados: RecomendacionCompraItem[] = [];

    productos.forEach((prod) => {
      const stock = prod.stock;
      const stockMin = Math.max(1, prod.stockMinimo || 5);
      const vendidos = Math.max(
        ventasPorProducto[prod.id] || 0,
        ventasPorProducto[prod.nombre.toLowerCase()] || 0,
        ventasPorProducto[prod.sku.toLowerCase()] || 0
      );

      // Ritmo de venta diario estimado (ventana de 7 días o mínimo de referencia)
      const velocidadDiaria = Math.max(0.4, +(vendidos / 7).toFixed(1));
      const diasCobertura = stock > 0 ? Math.round(stock / velocidadDiaria) : 0;

      let motivo: MotivoSugerencia | null = null;
      let motivoEtiqueta = '';
      let prioridad: 'CRITICA' | 'ALTA' | 'MEDIA' = 'MEDIA';

      // REGLA 1: Producto totalmente Agotado (Stock 0)
      if (stock === 0) {
        motivo = 'AGOTADO';
        motivoEtiqueta = 'Agotado · Quiebre de stock';
        prioridad = 'CRITICA';
      }
      // REGLA 2: Stock Crítico por debajo o igual al stock mínimo
      else if (stock <= stockMin) {
        motivo = 'STOCK_CRITICO';
        motivoEtiqueta = `Stock bajo · Mínimo de alerta: ${stockMin}`;
        prioridad = 'ALTA';
      }
      // REGLA 3: Alta Rotación con stock próximo a agotarse
      else if (vendidos >= 8 && diasCobertura <= 6) {
        motivo = 'ALTA_ROTACION';
        motivoEtiqueta = `Alta rotación (${vendidos} und vendidas) · Dura ${diasCobertura} días`;
        prioridad = 'MEDIA';
      }

      // Si califica para recomendación de reposición
      if (motivo) {
        // Cálculo de cantidad a comprar para abastecer a un nivel óptimo
        // Stock objetivo: entre 2 y 3 veces el stock mínimo, o demanda de 15 días
        const stockObjetivo = Math.max(stockMin * 2.5, Math.ceil(velocidadDiaria * 15), 12);
        const deficit = Math.max(1, stockObjetivo - stock);

        // Ajustar a múltiplos comerciales típicos (mínimo 6 o múltiplos de 6/12)
        let cantidadSugerida = Math.ceil(deficit / 6) * 6;
        if (cantidadSugerida < 6) cantidadSugerida = 6;

        const costoUnit = prod.precioCompra > 0 ? prod.precioCompra : +(prod.precioVenta * 0.75).toFixed(2);
        const subtotal = +(cantidadSugerida * costoUnit).toFixed(2);
        const provSugerido = asignarProveedorSugerido(prod, proveedores);

        itemsRecomendados.push({
          productoId: prod.id,
          sku: prod.sku,
          nombre: prod.nombre,
          categoria: prod.categoria,
          unidadMedida: prod.unidadMedida || 'UNIDAD',
          stockActual: stock,
          stockMinimo: stockMin,
          unidadesVendidas: vendidos,
          velocidadVentaDiaria: velocidadDiaria,
          diasCoberturaRestante: diasCobertura,
          motivo,
          motivoEtiqueta,
          prioridad,
          cantidadSugerida,
          precioCompraUnitario: costoUnit,
          subtotalEstimado: subtotal,
          proveedorId: provSugerido.id,
          proveedorNombre: provSugerido.razonSocial,
          proveedorRuc: provSugerido.ruc,
          seleccionado: true,
        });
      }
    });

    // Ordenar por prioridad: CRITICA (Agotados) primero, luego ALTA (Críticos), luego MEDIA (Alta rotación)
    const ordenPrioridad = { CRITICA: 0, ALTA: 1, MEDIA: 2 };
    itemsRecomendados.sort((a, b) => {
      const pDiff = ordenPrioridad[a.prioridad] - ordenPrioridad[b.prioridad];
      if (pDiff !== 0) return pDiff;
      return a.stockActual - b.stockActual;
    });

    const conteoAgotados = itemsRecomendados.filter((i) => i.motivo === 'AGOTADO').length;
    const conteoCriticos = itemsRecomendados.filter((i) => i.motivo === 'STOCK_CRITICO').length;
    const conteoAltaRotacion = itemsRecomendados.filter((i) => i.motivo === 'ALTA_ROTACION').length;
    const totalUnidades = itemsRecomendados.reduce((acc, i) => acc + i.cantidadSugerida, 0);
    const inversionTotal = +itemsRecomendados.reduce((acc, i) => acc + i.subtotalEstimado, 0).toFixed(2);

    return {
      items: itemsRecomendados,
      totalProductosSugeridos: itemsRecomendados.length,
      totalUnidadesSugeridas: totalUnidades,
      inversionTotalEstimada: inversionTotal,
      conteoAgotados,
      conteoCriticos,
      conteoAltaRotacion,
    };
  },
};
