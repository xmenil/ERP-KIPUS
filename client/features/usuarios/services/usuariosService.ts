import { Usuario, NuevoUsuarioPayload, UserRole } from '../types/usuarios.types';
import { simulateDelay } from '@/services/mock/mockUtils';

const STORAGE_KEY = 'kipus_erp_users_list';

const USUARIOS_INICIALES: Usuario[] = [
  {
    id: 'user-admin',
    username: 'admin',
    email: 'admin@kipus.pe',
    password: 'admin123',
    nombreCompleto: 'Darwin Namuche (Administrador)',
    rol: 'ADMINISTRADOR',
    sucursal: 'Sede Central - Tingo María',
    avatarInitials: 'DN',
    telefono: '+51 962 112 334',
    estado: 'ACTIVO',
    ultimoAcceso: 'Hoy, 09:42 AM',
    createdAt: '2024-01-15T08:00:00Z',
    descripcion: 'Acceso total a todos los módulos y configuración',
  },
  {
    id: 'user-caja',
    username: 'caja',
    email: 'caja@kipus.pe',
    password: 'caja123',
    nombreCompleto: 'Pierina Ramirez (Caja & Ventas)',
    rol: 'CAJERO',
    sucursal: 'Punto de Venta 01 - Rupa Rupa',
    avatarInitials: 'PR',
    telefono: '+51 984 556 778',
    estado: 'ACTIVO',
    ultimoAcceso: 'Ayer, 06:15 PM',
    createdAt: '2024-02-01T09:30:00Z',
    descripcion: 'Operaciones de ventas, caja chica y comprobantes',
  },
  {
    id: 'user-super',
    username: 'supervisor',
    email: 'supervisor@kipus.pe',
    password: 'super123',
    nombreCompleto: 'Terry Pastor (Almacén & Kardex)',
    rol: 'SUPERVISOR',
    sucursal: 'Almacén 01 - Tingo María',
    avatarInitials: 'TP',
    telefono: '+51 951 889 001',
    estado: 'ACTIVO',
    ultimoAcceso: 'Hace 3 días',
    createdAt: '2024-02-15T11:00:00Z',
    descripcion: 'Control de inventario, stock y recepción de compras',
  },
];

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (nombre.substring(0, 2) || 'US').toUpperCase();
}

class UsuariosService {
  private getStoredUsuarios(): Usuario[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(USUARIOS_INICIALES));
        return USUARIOS_INICIALES;
      }
      return JSON.parse(data);
    } catch {
      return USUARIOS_INICIALES;
    }
  }

  private saveStoredUsuarios(usuarios: Usuario[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
    } catch (e) {
      console.error('Error saving users to localStorage:', e);
    }
  }

  public async getUsuarios(): Promise<Usuario[]> {
    const list = this.getStoredUsuarios();
    return simulateDelay(list, 150);
  }

  public async getUsuarioById(id: string): Promise<Usuario | null> {
    const list = this.getStoredUsuarios();
    const found = list.find((u) => u.id === id) || null;
    return simulateDelay(found, 100);
  }

  public async crearUsuario(payload: NuevoUsuarioPayload): Promise<Usuario> {
    const list = this.getStoredUsuarios();

    // Validar si username o email ya existen
    const cleanUsername = payload.username.trim().toLowerCase();
    const cleanEmail = payload.email.trim().toLowerCase();

    if (list.some((u) => u.username.toLowerCase() === cleanUsername)) {
      throw new Error(`El nombre de usuario "${payload.username}" ya está registrado`);
    }

    if (list.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`El correo electrónico "${payload.email}" ya está en uso`);
    }

    const nuevo: Usuario = {
      id: `user-${Date.now()}`,
      username: payload.username.trim(),
      email: payload.email.trim(),
      nombreCompleto: payload.nombreCompleto.trim(),
      rol: payload.rol,
      sucursal: payload.sucursal.trim() || 'Sede Central - Tingo María',
      avatarInitials: getInitials(payload.nombreCompleto),
      password: payload.password || '123456',
      telefono: payload.telefono?.trim() || '',
      estado: payload.estado || 'ACTIVO',
      ultimoAcceso: 'Nunca',
      createdAt: new Date().toISOString(),
      descripcion: payload.descripcion || '',
    };

    const updated = [nuevo, ...list];
    this.saveStoredUsuarios(updated);
    return simulateDelay(nuevo, 250);
  }

  public async actualizarUsuario(id: string, payload: Partial<NuevoUsuarioPayload>): Promise<Usuario> {
    const list = this.getStoredUsuarios();
    const index = list.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new Error('Usuario no encontrado');
    }

    const actual = list[index];

    // Si cambió de username o email, validar duplicados
    if (payload.username && payload.username.trim().toLowerCase() !== actual.username.toLowerCase()) {
      const cleanUsername = payload.username.trim().toLowerCase();
      if (list.some((u) => u.id !== id && u.username.toLowerCase() === cleanUsername)) {
        throw new Error(`El nombre de usuario "${payload.username}" ya está en uso por otra cuenta`);
      }
    }

    if (payload.email && payload.email.trim().toLowerCase() !== actual.email.toLowerCase()) {
      const cleanEmail = payload.email.trim().toLowerCase();
      if (list.some((u) => u.id !== id && u.email.toLowerCase() === cleanEmail)) {
        throw new Error(`El correo electrónico "${payload.email}" ya está en uso por otra cuenta`);
      }
    }

    const actualizado: Usuario = {
      ...actual,
      ...payload,
      nombreCompleto: payload.nombreCompleto ? payload.nombreCompleto.trim() : actual.nombreCompleto,
      username: payload.username ? payload.username.trim() : actual.username,
      email: payload.email ? payload.email.trim() : actual.email,
      avatarInitials: payload.nombreCompleto ? getInitials(payload.nombreCompleto) : actual.avatarInitials,
      password: payload.password ? payload.password : actual.password,
    };

    list[index] = actualizado;
    this.saveStoredUsuarios(list);
    return simulateDelay(actualizado, 250);
  }

  public async eliminarUsuario(id: string): Promise<boolean> {
    const list = this.getStoredUsuarios();

    // No permitir eliminar el admin principal
    if (id === 'user-admin') {
      throw new Error('No se puede eliminar la cuenta principal de Administrador');
    }

    const filtered = list.filter((u) => u.id !== id);
    if (filtered.length === list.length) {
      throw new Error('Usuario no encontrado');
    }

    this.saveStoredUsuarios(filtered);
    return simulateDelay(true, 250);
  }

  public async toggleEstadoUsuario(id: string): Promise<Usuario> {
    const list = this.getStoredUsuarios();
    const index = list.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new Error('Usuario no encontrado');
    }

    if (id === 'user-admin') {
      throw new Error('No se puede desactivar la cuenta principal de Administrador');
    }

    const actual = list[index];
    const nuevoEstado = actual.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    actual.estado = nuevoEstado;

    this.saveStoredUsuarios(list);
    return simulateDelay(actual, 200);
  }
}

export const usuariosService = new UsuariosService();
