import { simulateDelay } from '@/services/mock/mockUtils';
import {
  MovimientoStock,
  MovimientoKardex,
  AlmacenResumen,
  ItemStockDetalle,
  AjusteInventario,
  NuevoAjustePayload,
  NuevoMovimientoPayload,
  RecepcionMercanciaPayload,
  AjusteAuditoriaPayload,
  EstadoStock,
} from '../types/inventario.types';
import { erpStore } from '@/services/erp/erpStore';

const almacenesFijos: AlmacenResumen[] = [
  {
    id: 'alm-1',
    nombre: 'Almacén Principal / Trastienda (Sede Central)',
    direccion: 'Jr. Tito Jaime 450, Tingo María',
    totalProductos: 30,
    stockTotalUnidades: 745,
    responsable: 'Carlos Vega (Encargado Almacén)',
    zonas: ['Estante 1 (Abarrotes y Granos)', 'Estante 2 (Lácteos y Pastas)', 'Tarima (Sacos Arroz y Azúcar)', 'Depósito de Bebidas'],
  },
  {
    id: 'alm-2',
    nombre: 'Sala de Ventas / Mostrador (Atención)',
    direccion: 'Jr. Tito Jaime 450, Tingo María',
    totalProductos: 30,
    stockTotalUnidades: 350,
    responsable: 'Juan Pérez (Cajero / Atención)',
    zonas: ['Góndola Central', 'Visicooler Bebidas y Lácteos', 'Vitrina Mostrador / Golosinas', 'Estante Limpieza'],
  },
];

export const inventarioService = {
  /**
   * Obtiene la lista unificada de existencias actuales con sus niveles de stock y costos.
   */
  async getProductosStock(): Promise<ItemStockDetalle[]> {
    const productos = erpStore.getProductos();
    const items: ItemStockDetalle[] = productos.map((p) => {
      let estadoNivel: EstadoStock = 'DISPONIBLE';
      if (p.stock <= 0) {
        estadoNivel = 'AGOTADO';
      } else if (p.stock <= p.stockMinimo) {
        estadoNivel = 'STOCK_BAJO';
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
        almacen: 'Almacén Principal (Sede Central)',
      };
    });

    return simulateDelay(items);
  },

  /**
   * Obtiene el historial de entradas, salidas y ajustes de stock.
   */
  async getMovimientos(): Promise<MovimientoStock[]> {
    const kardex = erpStore.getKardex();
    const normalizados: MovimientoStock[] = kardex.map((k) => {
      let origen = k.origen;
      if (!origen) {
        if (k.motivo === 'COMPRA') origen = 'Compra';
        else if (k.motivo === 'VENTA') origen = 'Venta';
        else if (k.motivo === 'MERMA' || k.motivo === 'AUDITORIA_CONTEO') origen = 'Ajuste de inventario';
        else if (k.motivo === 'INVENTARIO_INICIAL') origen = 'Inventario inicial';
        else origen = k.tipo === 'ENTRADA' ? 'Entrada' : k.tipo === 'SALIDA' ? 'Salida' : 'Ajuste';
      }

      return {
        ...k,
        origen,
      };
    });
    return simulateDelay(normalizados);
  },

  /**
   * Alias de getMovimientos para compatibilidad hacia atrás.
   */
  async getMovimientosKardex(): Promise<MovimientoKardex[]> {
    return this.getMovimientos();
  },

  /**
   * Obtiene el listado de ajustes de inventario realizados.
   */
  async getAjustes(): Promise<AjusteInventario[]> {
    return simulateDelay(erpStore.getAjustesInventario());
  },

  /**
   * Registra un nuevo ajuste individual de stock con confirmación previa.
   */
  async registrarAjuste(payload: NuevoAjustePayload): Promise<AjusteInventario> {
    const ajuste = erpStore.registrarAjusteInventario(payload);
    return simulateDelay(ajuste);
  },

  /**
   * Aplica ajustes masivos provenientes del conteo físico.
   */
  async aplicarAjustesFisicos(
    items: { productoId: string; stockFisico: number; motivo?: string }[]
  ): Promise<AjusteInventario[]> {
    const ajustes = erpStore.aplicarAjustesFisicos(items);
    return simulateDelay(ajustes);
  },

  /**
   * Almacenes disponibles en el sistema.
   */
  async getAlmacenes(): Promise<AlmacenResumen[]> {
    return simulateDelay(almacenesFijos);
  },

  // Métodos de compatibilidad previa
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
