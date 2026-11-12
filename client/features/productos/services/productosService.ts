import { Producto, NuevoProductoPayload } from '../types/productos.types';
import { apiClient } from '@/services/api/apiClient';
import { buscarProductoPorCodigo } from '../utils/codigosProducto';

// Cache local en memoria para búsquedas instantáneas y validaciones síncronas de formularios
let localProductsCache: Producto[] = [];

export interface ListProductsQuery {
  categoria?: string;
  estado?: 'TODOS' | 'DISPONIBLE' | 'STOCK_BAJO' | 'AGOTADO' | 'INACTIVO';
  busqueda?: string;
}

export const productosService = {
  /**
   * Búsqueda síncrona en memoria para validación instantánea mientras se tipea
   */
  buscarPorCodigo(codigo: string): Producto | undefined {
    return buscarProductoPorCodigo(localProductsCache, codigo);
  },

  /**
   * Búsqueda asíncrona directa contra la base de datos (vía backend)
   */
  async buscarPorCodigoRemoto(codigo: string): Promise<Producto | null> {
    try {
      const prod = await apiClient.get<Producto | null>(
        `/productos/buscar?codigo=${encodeURIComponent(codigo)}`
      );
      return prod;
    } catch {
      return null;
    }
  },

  /**
   * Obtiene la lista completa de productos desde PostgreSQL
   */
  async getProductos(query?: ListProductsQuery): Promise<Producto[]> {
    const params = new URLSearchParams();
    if (query?.categoria && query.categoria !== 'TODAS') {
      params.append('categoria', query.categoria);
    }
    if (query?.estado && query.estado !== 'TODOS') {
      params.append('estado', query.estado);
    }
    if (query?.busqueda) {
      params.append('busqueda', query.busqueda);
    }

    const qs = params.toString();
    const prods = await apiClient.get<Producto[]>(`/productos${qs ? `?${qs}` : ''}`);
    localProductsCache = Array.isArray(prods) ? prods : [];
    return localProductsCache;
  },

  /**
   * Obtiene un producto por su UUID
   */
  async getProductoPorId(id: string): Promise<Producto> {
    return apiClient.get<Producto>(`/productos/${id}`);
  },

  /**
   * Crea un producto en el catálogo y genera el stock inicial en almacén
   */
  async crearProducto(payload: NuevoProductoPayload): Promise<Producto> {
    const nuevo = await apiClient.post<Producto>('/productos', payload);
    localProductsCache.unshift(nuevo);
    return nuevo;
  },

  /**
   * Actualiza los datos o precios de un producto
   */
  async actualizarProducto(id: string, payload: Partial<NuevoProductoPayload>): Promise<Producto> {
    const actualizado = await apiClient.put<Producto>(`/productos/${id}`, payload);
    localProductsCache = localProductsCache.map((p) => (p.id === id ? actualizado : p));
    return actualizado;
  },

  /**
   * Guarda o actualiza un producto inteligentemente según si el SKU/ID ya existe
   */
  async upsertProducto(
    payload: NuevoProductoPayload,
    id?: string
  ): Promise<{ producto: Producto; esNuevo: boolean }> {
    const endpoint = id ? `/productos/upsert?id=${encodeURIComponent(id)}` : '/productos/upsert';
    const res = await apiClient.post<{ producto: Producto; esNuevo: boolean }>(endpoint, payload);
    if (res?.esNuevo) {
      localProductsCache.unshift(res.producto);
    } else if (res?.producto) {
      localProductsCache = localProductsCache.map((p) =>
        p.id === res.producto.id ? res.producto : p
      );
    }
    return res;
  },

  /**
   * Elimina un producto (o lo desactiva si tiene movimientos históricos en Kardex)
   */
  async eliminarProducto(id: string): Promise<boolean> {
    const res = await apiClient.delete<{ eliminado: boolean; desactivado?: boolean }>(
      `/productos/${id}`
    );
    localProductsCache = localProductsCache.filter((p) => p.id !== id);
    return res?.eliminado || Boolean(res?.desactivado);
  },

  /**
   * Alterna el estado activo/inactivo del producto
   */
  async toggleEstadoProducto(id: string): Promise<Producto> {
    const modificado = await apiClient.patch<Producto>(`/productos/${id}/estado`);
    localProductsCache = localProductsCache.map((p) => (p.id === id ? modificado : p));
    return modificado;
  },
};
