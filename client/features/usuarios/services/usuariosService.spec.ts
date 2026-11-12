import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usuariosService } from './usuariosService';
import { apiClient } from '@/services/api/apiClient';
import { Usuario, NuevoUsuarioPayload } from '../types/usuarios.types';

describe('Usuarios Service — Integración REST', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('obtiene la lista de usuarios llamando a GET /usuarios con filtros de rol y estado', async () => {
    const mockUsuarios: Usuario[] = [
      {
        id: 'u-1',
        username: 'admin',
        email: 'admin@kipus.pe',
        nombreCompleto: 'Darwin Namuche',
        rol: 'ADMINISTRADOR',
        sucursal: 'Sede Central - Tingo María',
        avatarInitials: 'DN',
        estado: 'ACTIVO',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockUsuarios);

    const result = await usuariosService.getUsuarios({ rol: 'ADMINISTRADOR', estado: 'ACTIVO' });
    expect(getSpy).toHaveBeenCalledWith('/usuarios?rol=ADMINISTRADOR&estado=ACTIVO');
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('admin');
  });

  it('permite registrar un nuevo usuario llamando a POST /usuarios', async () => {
    const payload: NuevoUsuarioPayload = {
      username: 'cajero_turno_tarde',
      email: 'cajero_tarde@kipus.pe',
      nombreCompleto: 'Rosa Flores Torres',
      rol: 'CAJERO',
      sucursal: 'Sede Central - Tingo María',
      password: 'password123',
      telefono: '998877665',
    };

    const mockResponse: Usuario = {
      id: 'u-new',
      username: payload.username,
      email: payload.email,
      nombreCompleto: payload.nombreCompleto,
      rol: payload.rol,
      sucursal: payload.sucursal,
      avatarInitials: 'RF',
      estado: 'ACTIVO',
      createdAt: '2026-11-12T11:00:00.000Z',
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse);

    const res = await usuariosService.crearUsuario(payload);
    expect(postSpy).toHaveBeenCalledWith('/usuarios', expect.objectContaining({
      username: 'cajero_turno_tarde',
      email: 'cajero_tarde@kipus.pe',
      nombreCompleto: 'Rosa Flores Torres',
      rol: 'CAJERO',
    }));
    expect(res.id).toBe('u-new');
    expect(res.avatarInitials).toBe('RF');
  });

  it('permite actualizar un usuario por su ID llamando a PUT /usuarios/:id', async () => {
    const mockActualizado: Usuario = {
      id: 'u-1',
      username: 'admin',
      email: 'admin_nuevo@kipus.pe',
      nombreCompleto: 'Darwin Namuche Ramos',
      rol: 'ADMINISTRADOR',
      sucursal: 'Sede Central - Tingo María',
      avatarInitials: 'DN',
      estado: 'ACTIVO',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValueOnce(mockActualizado);

    const res = await usuariosService.actualizarUsuario('u-1', {
      nombreCompleto: 'Darwin Namuche Ramos',
      email: 'admin_nuevo@kipus.pe',
    });

    expect(putSpy).toHaveBeenCalledWith('/usuarios/u-1', {
      nombreCompleto: 'Darwin Namuche Ramos',
      email: 'admin_nuevo@kipus.pe',
    });
    expect(res.email).toBe('admin_nuevo@kipus.pe');
  });

  it('permite alternar el estado de un usuario llamando a PATCH /usuarios/:id/estado', async () => {
    const mockResponse: Usuario = {
      id: 'u-2',
      username: 'caja',
      email: 'caja@kipus.pe',
      nombreCompleto: 'Pierina Ramirez',
      rol: 'CAJERO',
      sucursal: 'Punto de Venta 01',
      avatarInitials: 'PR',
      estado: 'INACTIVO',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce(mockResponse);

    const res = await usuariosService.toggleEstadoUsuario('u-2');
    expect(patchSpy).toHaveBeenCalledWith('/usuarios/u-2/estado');
    expect(res.estado).toBe('INACTIVO');
  });
});

