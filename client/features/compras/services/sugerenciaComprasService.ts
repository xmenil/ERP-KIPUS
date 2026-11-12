import { apiClient } from '@/services/api/apiClient';
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

let cachedSugerencias: ResumenSugerenciaCompras = {
  items: [],
  totalProductosSugeridos: 0,
  totalUnidadesSugeridas: 0,
  inversionTotalEstimada: 0,
  conteoAgotados: 0,
  conteoCriticos: 0,
  conteoAltaRotacion: 0,
};

export const sugerenciaComprasService = {
  /**
   * Obtiene sugerencias inteligentes de compras desde la API REST del backend
   */
  async fetchSugerencias(): Promise<ResumenSugerenciaCompras> {
    try {
      const resp = await apiClient.get<any>('/compras/sugerencias');
      if (resp && Array.isArray(resp.items)) {
        const mapped: ResumenSugerenciaCompras = {
          items: resp.items.map((it: any) => ({
            productoId: it.productoId,
            sku: it.sku,
            nombre: it.nombre,
            categoria: it.categoria,
            unidadMedida: 'UNIDAD',
            stockActual: it.stockActual,
            stockMinimo: it.stockMinimo,
            unidadesVendidas: 0,
            velocidadVentaDiaria: 1,
            diasCoberturaRestante: it.stockActual > 0 ? Math.round(it.stockActual / 1) : 0,
            motivo: it.nivelUrgencia === 'AGOTADO' ? 'AGOTADO' : 'STOCK_CRITICO',
            motivoEtiqueta:
              it.nivelUrgencia === 'AGOTADO'
                ? 'Agotado · Quiebre de stock'
                : `Stock bajo · Mínimo de alerta: ${it.stockMinimo}`,
            prioridad:
              it.nivelUrgencia === 'AGOTADO'
                ? 'CRITICA'
                : it.nivelUrgencia === 'CRITICO'
                ? 'ALTA'
                : 'MEDIA',
            cantidadSugerida: it.stockSugeridoCompra,
            precioCompraUnitario: it.costoUnitarioEstimado,
            subtotalEstimado: it.inversionEstimada,
            proveedorNombre: it.proveedorSugerido?.razonSocial || 'Distribuidor Mayorista',
            proveedorRuc: it.proveedorSugerido?.ruc || '20100055237',
            seleccionado: true,
          })),
          totalProductosSugeridos: resp.totalProductosSugeridos || 0,
          totalUnidadesSugeridas: resp.totalUnidadesSugeridas || 0,
          inversionTotalEstimada: resp.inversionTotalEstimada || 0,
          conteoAgotados: resp.conteoAgotados || 0,
          conteoCriticos: resp.conteoCriticos || 0,
          conteoAltaRotacion: resp.conteoAltaRotacion || 0,
        };
        cachedSugerencias = mapped;
        return mapped;
      }
    } catch (e) {
      console.warn('No se pudo obtener sugerencias remotas de compras:', e);
    }
    return cachedSugerencias;
  },

  /**
   * Obtiene la recomendación actual de compras (sincronizada o en caché)
   */
  obtenerSugerencias(): ResumenSugerenciaCompras {
    // Si la caché está vacía, iniciamos una carga en segundo plano
    if (cachedSugerencias.items.length === 0) {
      this.fetchSugerencias();
    }
    return cachedSugerencias;
  },
};
