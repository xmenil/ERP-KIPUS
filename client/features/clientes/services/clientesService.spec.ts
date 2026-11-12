import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clientesService } from './clientesService';
import { apiClient } from '@/services/api/apiClient';
import { Cliente, NuevoClientePayload } from '../types/clientes.types';

describe('Clientes Service — Integración REST', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtiene la lista de clientes llamando a GET /clientes', async () => {
    const mockClientes: Cliente[] = [
      {
        id: 'uuid-cli-1',
        documentoTipo: 'DNI',
        numeroDocumento: '45892134',
        nombre: 'Juan Carlos Pérez Mendoza',
        telefono: '+51 987 654 321',
        correo: 'jperez@gmail.com',
        direccion: 'Jr. Miraflores 345, Tingo María',
        totalCompras: 1250.5,
        saldoPendiente: 0,
        activo: true,
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockClientes);

    const res = await clientesService.getClientes();
    expect(getSpy).toHaveBeenCalledWith('/clientes');
    expect(res).toEqual(mockClientes);
  });

  it('registra un cliente llamando a POST /clientes', async () => {
    const payload: NuevoClientePayload = {
      documentoTipo: 'DNI',
      numeroDocumento: '77889900',
      nombre: 'Rosa María Chávez',
      telefono: '+51 999 888 777',
      correo: 'rchavez@gmail.com',
      direccion: 'Av. Universitaria 120',
    };

    const mockResponse: Cliente = {
      ...payload,
      id: 'uuid-cli-nuevo',
      totalCompras: 0,
      saldoPendiente: 0,
      activo: true,
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

    const res = await clientesService.registrarCliente(payload);
    expect(postSpy).toHaveBeenCalledWith('/clientes', payload);
    expect(res.id).toBe('uuid-cli-nuevo');
  });

  it('busca un cliente por documento llamando a GET /clientes/buscar', async () => {
    const mockCliente: Cliente = {
      id: 'uuid-cli-1',
      documentoTipo: 'DNI',
      numeroDocumento: '45892134',
      nombre: 'Juan Carlos Pérez Mendoza',
      telefono: '+51 987 654 321',
      correo: 'jperez@gmail.com',
      direccion: 'Jr. Miraflores 345, Tingo María',
      totalCompras: 1250.5,
      saldoPendiente: 0,
      activo: true,
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockCliente);

    const res = await clientesService.buscarPorDocumento('45892134');
    expect(getSpy).toHaveBeenCalledWith('/clientes/buscar?documento=45892134');
    expect(res?.nombre).toBe('Juan Carlos Pérez Mendoza');
  });
});

