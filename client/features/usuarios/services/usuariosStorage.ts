import { z } from 'zod';
import type { Usuario } from '../types/usuarios.types';

export const USUARIOS_STORAGE_KEY = 'kipus_erp_users_list';
export const USUARIOS_CHANGE_EVENT = 'kipus:users-changed';

const UsuarioSchema = z.object({
  id: z.string().min(1), username: z.string().min(1), email: z.string().email(),
  nombreCompleto: z.string().min(1), rol: z.enum(['ADMINISTRADOR', 'CAJERO', 'SUPERVISOR']),
  sucursal: z.string().min(1), avatarInitials: z.string().min(1), password: z.string().optional(),
  telefono: z.string().optional(), estado: z.enum(['ACTIVO', 'INACTIVO']),
  ultimoAcceso: z.string().optional(), createdAt: z.string().min(1), descripcion: z.string().optional(),
});

export const DEMO_ACCOUNTS: Usuario[] = [
  { id: 'user-admin', username: 'admin', email: 'admin@kipus.pe', password: 'admin123', nombreCompleto: 'Darwin Namuche (Administrador)', rol: 'ADMINISTRADOR', sucursal: 'Sede Central - Tingo María', avatarInitials: 'DN', estado: 'ACTIVO', createdAt: '2024-01-15T08:00:00Z', descripcion: 'Acceso total a todos los módulos y configuración' },
  { id: 'user-caja', username: 'caja', email: 'caja@kipus.pe', password: 'caja123', nombreCompleto: 'Pierina Ramirez (Caja & Ventas)', rol: 'CAJERO', sucursal: 'Punto de Venta 01 - Rupa Rupa', avatarInitials: 'PR', estado: 'ACTIVO', createdAt: '2024-02-01T09:30:00Z', descripcion: 'Operaciones de ventas, caja y clientes' },
  { id: 'user-super', username: 'supervisor', email: 'supervisor@kipus.pe', password: 'super123', nombreCompleto: 'Terry Pastor (Almacén & Kardex)', rol: 'SUPERVISOR', sucursal: 'Almacén 01 - Tingo María', avatarInitials: 'TP', estado: 'ACTIVO', createdAt: '2024-02-15T11:00:00Z', descripcion: 'Control de inventario, stock y compras' },
];

export const normalizeLogin = (value: string) => value.trim().toLocaleLowerCase('es');

export function readUsers(): Usuario[] {
  let raw: string | null;
  try { raw = localStorage.getItem(USUARIOS_STORAGE_KEY); }
  catch { throw new Error('No se pudo leer el directorio de usuarios del navegador. Revisa el almacenamiento e inténtalo de nuevo.'); }
  if (raw === null) return DEMO_ACCOUNTS.map(user => ({ ...user }));
  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch { throw new Error('El directorio de usuarios contiene datos ilegibles. Se conservaron para recuperación; no se hicieron cambios.'); }
  const result = z.array(UsuarioSchema).safeParse(parsed);
  if (!result.success) throw new Error('El directorio de usuarios tiene registros incompletos o inválidos. Se conservaron para recuperación; no se hicieron cambios.');
  const usernames = new Set<string>(); const emails = new Set<string>(); const ids = new Set<string>();
  for (const user of result.data) {
    const username = normalizeLogin(user.username); const email = normalizeLogin(user.email);
    if (ids.has(user.id) || usernames.has(username) || emails.has(email)) throw new Error('El directorio tiene usuarios o correos duplicados. Se conservaron los datos para revisión.');
    ids.add(user.id); usernames.add(username); emails.add(email);
  }
  return result.data as Usuario[];
}

export function writeUsers(users: Usuario[]): void {
  const parsed = z.array(UsuarioSchema).safeParse(users);
  if (!parsed.success) throw new Error('No se guardó el directorio: revisa los datos obligatorios de cada usuario.');
  try { localStorage.setItem(USUARIOS_STORAGE_KEY, JSON.stringify(parsed.data)); }
  catch { throw new Error('No se pudieron guardar los usuarios en este navegador. Libera espacio o revisa los permisos e inténtalo de nuevo.'); }
  window.dispatchEvent(new CustomEvent(USUARIOS_CHANGE_EVENT));
}

export function publicUser<T extends Usuario>(user: T): Omit<T, 'password'> {
  const { password: _password, ...safe } = user;
  return safe;
}
