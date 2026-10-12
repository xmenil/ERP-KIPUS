import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { SessionStore, SESSION_IDLE_TIMEOUT_MS, AUTH_STORAGE_KEY, AUTH_ACTIVITY_KEY, AUTH_TOKEN_KEY } from './sessionStore';
import { AuthUser } from '../types/auth.types';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: key => { values.delete(key); },
    key: index => [...values.keys()][index] ?? null,
  };
}

const user: AuthUser = { id: 'test', username: 'caja', email: 'caja@test.pe', nombreCompleto: 'Cajero', rol: 'CAJERO', sucursal: 'Central', avatarInitials: 'CA' };

describe('session inactivity', () => {
  let persistent: Storage;
  let temporary: Storage;
  let session: SessionStore;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));
    persistent = memoryStorage();
    temporary = memoryStorage();
    session = new SessionStore(persistent, temporary);
  });
  afterEach(() => vi.useRealTimers());

  it('expires at the exact idle limit and clears credentials', () => {
    session.save(user, true, 'token');
    vi.advanceTimersByTime(SESSION_IDLE_TIMEOUT_MS - 1);
    expect(session.read()).toEqual(user);
    vi.advanceTimersByTime(1);
    expect(session.touch()).toBeNull();
    expect(session.expired).toBe(true);
    for (const key of [AUTH_STORAGE_KEY, AUTH_TOKEN_KEY, AUTH_ACTIVITY_KEY]) expect(persistent.getItem(key)).toBeNull();
  });

  it('extends a live session on activity but cannot revive an expired session', () => {
    session.save(user, true, 'token');
    vi.advanceTimersByTime(SESSION_IDLE_TIMEOUT_MS - 1000);
    expect(session.touch()).toEqual(user);
    vi.advanceTimersByTime(1000);
    expect(new SessionStore(persistent, temporary).read()).toEqual(user);
    vi.advanceTimersByTime(SESSION_IDLE_TIMEOUT_MS);
    expect(new SessionStore(persistent, temporary).touch()).toBeNull();
  });

  it('restores a tab session on reload without persisting it to another tab', () => {
    session.save(user, false, 'token');
    expect(new SessionStore(persistent, temporary).read()).toEqual(user);
    expect(new SessionStore(persistent, memoryStorage()).read()).toBeNull();
  });

  it('shares activity and logout between remembered tabs', () => {
    session.save(user, true, 'token');
    const other = new SessionStore(persistent, memoryStorage());
    vi.advanceTimersByTime(SESSION_IDLE_TIMEOUT_MS - 1000);
    other.touch();
    vi.advanceTimersByTime(1000);
    expect(session.read()).toEqual(user);
    other.clear();
    expect(session.read()).toBeNull();
  });

  it('does not remove another remembered session when a tab-only session expires', () => {
    session.save(user, false, 'temporary-token');
    const other = new SessionStore(persistent, memoryStorage());
    vi.advanceTimersByTime(1000);
    other.save({ ...user, id: 'other' }, true, 'persistent-token');
    vi.advanceTimersByTime(SESSION_IDLE_TIMEOUT_MS - 1000);
    expect(session.read()).toBeNull();
    expect(other.read()?.id).toBe('other');
  });

  it.each([null, 'invalid', '0', String(Number.MAX_SAFE_INTEGER)])('rejects a legacy or invalid activity timestamp: %s', activity => {
    persistent.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    if (activity !== null) persistent.setItem(AUTH_ACTIVITY_KEY, activity);
    expect(session.read()).toBeNull();
  });

  it('rejects malformed saved user data', () => {
    session.save(user, true, 'token');
    persistent.setItem(AUTH_STORAGE_KEY, '{');
    expect(session.read()).toBeNull();
  });
});
