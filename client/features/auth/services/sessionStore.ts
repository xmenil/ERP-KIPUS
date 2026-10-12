import { AuthUser } from '../types/auth.types';

export const SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const AUTH_STORAGE_KEY = 'kipus_erp_auth_user';
export const AUTH_TOKEN_KEY = 'kipus_erp_auth_token';
export const AUTH_ACTIVITY_KEY = 'kipus_erp_auth_last_activity';

export class SessionStore {
  expired = false;

  constructor(private persistent: Storage, private temporary: Storage) {}

  private storage(): Storage {
    return this.temporary.getItem(AUTH_STORAGE_KEY) ? this.temporary : this.persistent;
  }

  read(now = Date.now()): AuthUser | null {
    const storage = this.storage();
    const raw = storage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const activity = Number(storage.getItem(AUTH_ACTIVITY_KEY));
    if (!Number.isFinite(activity) || activity <= 0 || activity > now || now - activity >= SESSION_IDLE_TIMEOUT_MS) {
      this.clear(true);
      return null;
    }
    try {
      const user = JSON.parse(raw) as AuthUser;
      if (!user || typeof user.id !== 'string' || typeof user.username !== 'string') throw new Error('Invalid session');
      return user;
    } catch {
      this.clear(true);
      return null;
    }
  }

  save(user: AuthUser, remember: boolean, token: string): void {
    this.clear();
    for (const storage of [this.persistent, this.temporary]) {
      for (const key of [AUTH_STORAGE_KEY, AUTH_TOKEN_KEY, AUTH_ACTIVITY_KEY]) storage.removeItem(key);
    }
    const storage = remember ? this.persistent : this.temporary;
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    storage.setItem(AUTH_TOKEN_KEY, token);
    storage.setItem(AUTH_ACTIVITY_KEY, String(Date.now()));
  }

  touch(now = Date.now()): AuthUser | null {
    const user = this.read(now);
    if (user) {
      const storage = this.storage();
      storage.setItem(AUTH_ACTIVITY_KEY, String(now));
    }
    return user;
  }

  remaining(now = Date.now()): number {
    return Math.max(0, SESSION_IDLE_TIMEOUT_MS - (now - Number(this.storage().getItem(AUTH_ACTIVITY_KEY))));
  }

  clear(expired = false): void {
    // A tab-only session must not remove another tab's remembered session.
    const stores = this.temporary.getItem(AUTH_STORAGE_KEY)
      ? [this.temporary] : [this.persistent, this.temporary];
    for (const storage of stores) {
      for (const key of [AUTH_STORAGE_KEY, AUTH_TOKEN_KEY, AUTH_ACTIVITY_KEY]) storage.removeItem(key);
    }
    this.expired = expired;
  }
}
