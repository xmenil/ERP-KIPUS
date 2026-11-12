import { describe, it, expect, vi, beforeEach } from 'vitest';
import { proveedoresService } from './proveedoresService';
import { apiClient } from '@/services/api/apiClient';
import { Proveedor, NuevoProveedorPayload } from '../types/proveedores.types';

describe('Proveedores Service — Integración REST', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtiene proveedores llamando a GET /proveedores', async () => {
    const mockProveedores: Proveedor[] = [
      {
        id: 'uuid-prv-1',
        ruc: '20100055237',
        razonSocial: 'ALICORP S.A.A.',
        contacto: 'Carlos Benavides',
        telefono: '+51 981 223 344',
        correo: 'pedidos@alicorp.com.pe',
        direccion: 'Av. Argentina 4793',
        ciudad: 'Lima',
        rubro: 'Abarrotes y Harinas',
        condicionPago: 'Crédito a 30 días',
        activo: true,
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockProveedores);

    const res = await proveedoresService.getProveedores();
    expect(getSpy).toHaveBeenCalledWith('/proveedores');
    expect(res).toEqual(mockProveedores);
  });

  it('registra un proveedor llamando a POST /proveedores', async () => {
    const payload: NuevoProveedorPayload = {
      ruc: '20100123456',
      razonSocial: 'GLORIA S.A.',
      contacto: 'Mariana Flores',
      telefono: '+51 987 111 222',
      correo: 'ventas@gloria.pe',
      rubro: 'Lácteos',
      condicionPago: 'Contado',
    };

    const mockResponse: Proveedor = {
      ...payload,
      id: 'uuid-prv-nuevo',
      activo: true,
      ciudad: '',
      direccion: '',
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

    const res = await proveedoresService.registrarProveedor(payload);
    expect(postSpy).toHaveBeenCalledWith('/proveedores', payload);
    expect(res.id).toBe('uuid-prv-nuevo');
  });

  it('elimina un proveedor llamando a DELETE /proveedores/:id', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({ eliminado: true });

    const res = await proveedoresService.eliminarProveedor('uuid-prv-1');
    expect(deleteSpy).toHaveBeenCalledWith('/proveedores/uuid-prv-1');
    expect(res).toBe(true);
  });
});

