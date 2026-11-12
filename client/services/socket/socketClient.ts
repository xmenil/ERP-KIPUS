import { io, Socket } from 'socket.io-client';
import { AUTH_TOKEN_KEY } from '@/features/auth/services/sessionStore';

type StatusListener = (connected: boolean) => void;

class SocketClient {
  private socket: Socket | null = null;
  private statusListeners: Set<StatusListener> = new Set();
  private fallbackListeners: Map<string, Set<Function>> = new Map();
  private isConnecting: boolean = false;

  /**
   * Inicializa la conexión WebSocket hacia el namespace /events
   */
  public connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket && !this.socket.connected) {
      this.socket.connect();
      return this.socket;
    }

    if (typeof window === 'undefined') {
      return null as any;
    }

    const token =
      localStorage.getItem(AUTH_TOKEN_KEY) ||
      sessionStorage.getItem(AUTH_TOKEN_KEY) ||
      localStorage.getItem('kipus_auth_token');

    this.socket = io('/events', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: {
        token: token || undefined,
      },
      query: {
        token: token || undefined,
      },
    });

    this.socket.on('connect', () => {
      this.notifyStatus(true);
    });

    this.socket.on('disconnect', () => {
      this.notifyStatus(false);
    });

    this.socket.on('connect_error', () => {
      this.notifyStatus(false);
    });

    return this.socket;
  }

  /**
   * Desconecta el socket activo
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.notifyStatus(false);
    }
  }

  /**
   * Actualiza el token en el handshake tras iniciar sesión
   */
  public updateToken(newToken: string | null): void {
    if (this.socket) {
      this.socket.auth = { token: newToken || undefined };
      if (this.socket.connected) {
        this.socket.disconnect().connect();
      }
    }
  }

  /**
   * Verifica si el socket está conectado actualmente
   */
  public isConnected(): boolean {
    return Boolean(this.socket?.connected);
  }

  /**
   * Suscribe un listener a un evento de socket
   */
  public on<T = any>(event: string, callback: (data: T) => void): () => void {
    if (!this.socket && typeof window === 'undefined') {
      if (!this.fallbackListeners.has(event)) {
        this.fallbackListeners.set(event, new Set());
      }
      this.fallbackListeners.get(event)!.add(callback);
      return () => {
        this.fallbackListeners.get(event)?.delete(callback);
      };
    }
    const s = this.getSocket();
    if (!s) {
      return () => {};
    }
    s.on(event, callback as any);
    return () => {
      s.off(event, callback as any);
    };
  }

  /**
   * Remueve un listener
   */
  public off(event: string, callback?: Function): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback as any);
      } else {
        this.socket.off(event);
      }
    } else {
      if (callback) {
        this.fallbackListeners.get(event)?.delete(callback);
      } else {
        this.fallbackListeners.delete(event);
      }
    }
  }

  /**
   * Emite un evento al servidor o listeners locales en entorno SSR/Test
   */
  public emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      this.fallbackListeners.get(event)?.forEach((fn) => {
        try {
          fn(data);
        } catch {
          // Ignorar
        }
      });
    }
  }

  /**
   * Suscribe a cambios de estado de conexión (online / offline)
   */
  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.isConnected());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatus(connected: boolean): void {
    this.statusListeners.forEach((fn) => {
      try {
        fn(connected);
      } catch {
        // Ignorar
      }
    });
  }

  private getSocket(): Socket | null {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }
}

export const socketClient = new SocketClient();
