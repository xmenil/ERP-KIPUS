import { afterEach, describe, expect, it, vi } from 'vitest';
import { buscarProductoPorCodigo } from './barcodeCatalogService';
import { Producto } from '../types/productos.types';

const producto: Producto = { id: 'p-1', sku: 'SKU-INTERNO', codigoBarras: '0012345678905', nombre: 'Producto registrado', categoria: 'Otros', precioCompra: 2, precioVenta: 3, stock: 4, stockMinimo: 1, unidadMedida: 'UNIDAD', activo: false };
afterEach(() => vi.unstubAllGlobals());

describe('integración del catálogo con códigos independientes del SKU', () => {
  it('detecta un código existente aunque el producto esté inactivo y tenga otro SKU', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await buscarProductoPorCodigo(' 0012345678905 ', [producto])).toMatchObject({ status: 'existente_en_catalogo', producto });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('admite un SKU como código heredado solo cuando el producto no tiene código asignado', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    expect(await buscarProductoPorCodigo('SKU-INTERNO', [{ ...producto, codigoBarras: undefined }])).toMatchObject({ status: 'existente_en_catalogo' });
    expect(await buscarProductoPorCodigo('SKU-INTERNO', [producto])).toMatchObject({ status: 'desconocido' });
  });
  it('no asigna productos por fragmentos de código', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    expect((await buscarProductoPorCodigo('775', [])).status).toBe('desconocido');
  });
  it('el catálogo de ejemplo no inventa precios o existencias del negocio', async () => {
    expect(await buscarProductoPorCodigo('7750106001234', [])).toMatchObject({ status: 'encontrado', datos: { precioCompra: 0, precioVenta: 0, stockSugerido: 0 } });
  });
});
