import { apiClient } from '@/services/api/apiClient';

export interface CategoriaItem {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface UnidadMedidaItem {
  id: string;
  codigo: string;
  codigoSunat?: string;
  nombre: string;
}

export const categoriasService = {
  /**
   * Obtiene las categorías de productos desde PostgreSQL
   */
  async getCategorias(): Promise<CategoriaItem[]> {
    const data = await apiClient.get<CategoriaItem[]>('/categorias');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Registra una nueva categoría de productos
   */
  async crearCategoria(nombre: string, descripcion?: string): Promise<CategoriaItem> {
    return apiClient.post<CategoriaItem>('/categorias', { nombre, descripcion });
  },

  /**
   * Obtiene el catálogo de unidades de medida (estándar y códigos SUNAT)
   */
  async getUnidadesMedida(): Promise<UnidadMedidaItem[]> {
    const data = await apiClient.get<UnidadMedidaItem[]>('/unidades-medida');
    return Array.isArray(data) ? data : [];
  },
};

