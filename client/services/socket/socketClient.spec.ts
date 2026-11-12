import { describe, it, expect, vi, beforeEach } from 'vitest';
import { socketClient } from './socketClient';

describe('socketClient (Fase 9 WebSockets Multi-Terminal)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('permite registrar listeners de cambio de estado y consultar isConnected()', () => {
    let currentStatus = false;
    const unsub = socketClient.onStatusChange((connected) => {
      currentStatus = connected;
    });

    expect(typeof currentStatus).toBe('boolean');
    expect(typeof socketClient.isConnected()).toBe('boolean');

    // Desuscribir
    expect(() => unsub()).not.toThrow();
  });

  it('permite suscribirse a eventos, recibir emisiones y desuscribirse limpiamente', () => {
    const mockCallback = vi.fn();
    const unsub = socketClient.on('stock:actualizado', mockCallback);

    expect(typeof unsub).toBe('function');

    // Emitir evento
    socketClient.emit('stock:actualizado', { productoId: 'prod-123', nuevoStock: 45 });
    expect(mockCallback).toHaveBeenCalledWith({ productoId: 'prod-123', nuevoStock: 45 });

    // Desuscribir
    unsub();

    // Emitir de nuevo no debe invocar al callback
    socketClient.emit('stock:actualizado', { productoId: 'prod-123', nuevoStock: 40 });
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('permite actualizar el token de autenticación sin fallar', () => {
    expect(() => socketClient.updateToken('dummy-jwt-token-xyz')).not.toThrow();
    expect(() => socketClient.updateToken(null)).not.toThrow();
  });
});
