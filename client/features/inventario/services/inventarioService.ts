import { simulateDelay } from '@/services/mock/mockUtils';
import {
  MovimientoKardex,
  AlmacenResumen,
  NuevoMovimientoPayload,
  ItemStockDetalle,
  RecepcionMercanciaPayload,
  AjusteAuditoriaPayload,
  EstadoNivelStock,
} from '../types/inventario.types';
import { erpStore } from '@/services/erp/erpStore';

const almacenesFijos: AlmacenResumen[] = [
  {
    id: 'alm-1',
    nombre: 'Almacén Principal (Sede Central)',
    direccion: 'Jr. Miraflores 450, Tingo María',
    totalProductos: 142,
    stockTotalUnidades: 890,
    responsable: 'Carlos Vega (Almacenero)',
    zonas: ['Estante A (Lubricantes)', 'Estante B (Filtros)', 'Piso 1 (Baterías)'],
  },
  {
    id: 'alm-2',
    nombre: 'Tienda Mostrador (Atención al Público)',
    direccion: 'Av. Tito Jaime 230, Tingo María',
    totalProductos: 85,
    stockTotalUnidades: 310,
    responsable: 'María Santos (Cajera / Mostrador)',
    zonas: ['Vitrina 1', 'Vitrina 2', 'Anaquel Mostrador C'],
  },
];

export const inventarioService = {
  async getMovimientosKardex(): Promise<MovimientoKardex[]> {
    return simulateDelay(erpStore.getKardex());
  },

  async getAlmacenes(): Promise<AlmacenResumen[]> {
    return simulateDelay(almacenesFijos);
  },

  async getProductosStock(): Promise<ItemStockDetalle[]> {
    const productos = erpStore.getProductos();
    const items: ItemStockDetalle[] = productos.map((p) => {
      let estadoNivel: EstadoNivelStock = 'SUFICIENTE';
      if (p.stock <= 0) {
        estadoNivel = 'AGOTADO';
      } else if (p.stock <= p.stockMinimo) {
        estadoNivel = 'POR_AGOTARSE';
      }

      return {
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        categoria: p.categoria,
        stock: p.stock,
        stockMinimo: p.stockMinimo,
        unidadMedida: p.unidadMedida,
        precioCompra: p.precioCompra,
        precioVenta: p.precioVenta,
        ubicacion: p.ubicacion || 'Estante General',
        estadoNivel,
        valorizadoCosto: +(p.stock * p.precioCompra).toFixed(2),
        valorizadoVenta: +(p.stock * p.precioVenta).toFixed(2),
      };
    });

    return simulateDelay(items);
  },

  async registrarMovimiento(payload: NuevoMovimientoPayload): Promise<MovimientoKardex> {
    const mov = erpStore.registrarMovimientoAlmacen(payload);
    return simulateDelay(mov);
  },

  async recepcionarMercancia(payload: RecepcionMercanciaPayload): Promise<MovimientoKardex> {
    const mov = erpStore.recepcionarMercancia(payload);
    return simulateDelay(mov);
  },

  async registrarAjusteAuditoria(payload: AjusteAuditoriaPayload): Promise<MovimientoKardex> {
    const mov = erpStore.registrarAjusteAuditoria(payload);
    return simulateDelay(mov);
  },
};

