import { Usuario, NuevoUsuarioPayload } from '../types/usuarios.types';
import { simulateDelay } from '@/services/mock/mockUtils';
import { normalizeLogin, publicUser, readUsers, writeUsers } from './usuariosStorage';

function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'US'; }
function unique(users: Usuario[], id: string, username: string, email: string) {
  if (users.some(user => user.id !== id && normalizeLogin(user.username) === username)) throw new Error(`El usuario "${username}" ya está registrado.`);
  if (users.some(user => user.id !== id && normalizeLogin(user.email) === email)) throw new Error(`El correo "${email}" ya está registrado.`);
}
function ensureAdmin(users: Usuario[]) {
  if (!users.some(user => user.rol === 'ADMINISTRADOR' && user.estado === 'ACTIVO')) throw new Error('Debe quedar al menos un administrador activo.');
}

class UsuariosService {
  async getUsuarios(): Promise<Usuario[]> { return simulateDelay(readUsers().map(user => publicUser(user) as Usuario), 120); }
  async getUsuarioById(id: string): Promise<Usuario | null> {
    const user = readUsers().find(item => item.id === id);
    return simulateDelay(user ? publicUser(user) as Usuario : null, 80);
  }
  async crearUsuario(payload: NuevoUsuarioPayload): Promise<Usuario> {
    const users = readUsers();
    const username = normalizeLogin(payload.username); const email = normalizeLogin(payload.email);
    if (payload.nombreCompleto.trim().length < 3 || username.length < 3 || !email || !payload.sucursal.trim()) throw new Error('Completa nombre, usuario (mínimo 3 caracteres), correo y sucursal.');
    if (!payload.password?.trim() || payload.password.trim().length < 6) throw new Error('La contraseña inicial debe tener al menos 6 caracteres.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Ingresa un correo válido.');
    unique(users, '', username, email);
    const user: Usuario = {
      id: `user-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
      username, email, nombreCompleto: payload.nombreCompleto.trim(), rol: payload.rol,
      sucursal: payload.sucursal.trim(), avatarInitials: initials(payload.nombreCompleto), password: payload.password.trim(),
      telefono: payload.telefono?.trim() || '', estado: payload.estado || 'ACTIVO', createdAt: new Date().toISOString(), descripcion: payload.descripcion?.trim() || '',
    };
    const next = [user, ...users]; ensureAdmin(next); writeUsers(next);
    return simulateDelay(publicUser(user) as Usuario, 150);
  }
  async actualizarUsuario(id: string, payload: Partial<NuevoUsuarioPayload>): Promise<Usuario> {
    const users = readUsers(); const index = users.findIndex(user => user.id === id);
    if (index < 0) throw new Error('Usuario no encontrado.');
    const current = users[index];
    const username = normalizeLogin(payload.username ?? current.username); const email = normalizeLogin(payload.email ?? current.email);
    if (!username || !email || !(payload.nombreCompleto ?? current.nombreCompleto).trim() || !(payload.sucursal ?? current.sucursal).trim()) throw new Error('Nombre, usuario, correo y sucursal son obligatorios.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Ingresa un correo válido.');
    if (payload.password !== undefined && payload.password.length > 0 && payload.password.trim().length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
    unique(users, id, username, email);
    const updated: Usuario = { ...current, ...payload, username, email, nombreCompleto: (payload.nombreCompleto ?? current.nombreCompleto).trim(), sucursal: (payload.sucursal ?? current.sucursal).trim(), avatarInitials: initials(payload.nombreCompleto ?? current.nombreCompleto), password: payload.password?.trim() || current.password };
    const next = [...users]; next[index] = updated;
    ensureAdmin(next);
    writeUsers(next);
    return simulateDelay(publicUser(updated) as Usuario, 150);
  }
  async eliminarUsuario(id: string): Promise<boolean> {
    const users = readUsers(); const target = users.find(user => user.id === id);
    if (!target) throw new Error('Usuario no encontrado.');
    if (id === 'user-admin') throw new Error('La cuenta demo principal no se puede eliminar; cambia su contraseña o desactívala cuando exista otro administrador activo.');
    if (['user-caja', 'user-super'].includes(id)) {
      const next = users.map(user => user.id === id ? { ...user, estado: 'INACTIVO' as const } : user);
      ensureAdmin(next); writeUsers(next);
      return simulateDelay(true, 150);
    }
    const next = users.filter(user => user.id !== id); ensureAdmin(next); writeUsers(next);
    return simulateDelay(true, 150);
  }
  async toggleEstadoUsuario(id: string): Promise<Usuario> {
    const users = readUsers(); const target = users.find(user => user.id === id);
    if (!target) throw new Error('Usuario no encontrado.');
    const updated = { ...target, estado: target.estado === 'ACTIVO' ? 'INACTIVO' as const : 'ACTIVO' as const };
    const next = users.map(user => user.id === id ? updated : user);
    ensureAdmin(next);
    writeUsers(next);
    return simulateDelay(publicUser(updated) as Usuario, 150);
  }
}

export const usuariosService = new UsuariosService();
