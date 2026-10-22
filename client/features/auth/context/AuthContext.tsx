import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, LoginCredentials, AuthContextType } from '../types/auth.types';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { AUTH_STORAGE_KEY, AUTH_ACTIVITY_KEY, AUTH_TOKEN_KEY } from '../services/sessionStore';
import { USUARIOS_CHANGE_EVENT, USUARIOS_STORAGE_KEY } from '@/features/usuarios/services/usuariosStorage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    try {
      const existing = authService.getCurrentUser();
      if (existing) {
        setUser(existing);
      }
      setSessionExpired(authService.sessionExpired);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout>;
    let lastWrite = 0;
    const check = (activity = false) => {
      clearTimeout(timer);
      try {
        const current = authService.getCurrentUser();
        if (!current || current.id !== user.id) {
          setSessionExpired(authService.sessionExpired);
          setUser(null);
          return;
        }
        if (current.rol !== user.rol || current.username !== user.username || current.email !== user.email || current.nombreCompleto !== user.nombreCompleto || current.sucursal !== user.sucursal || current.avatarInitials !== user.avatarInitials) setUser(current);
        if (activity && Date.now() - lastWrite >= 1000) {
          authService.registerActivity();
          lastWrite = Date.now();
        }
        timer = setTimeout(() => check(), authService.remainingIdleTime());
      } catch {
        setUser(null);
      }
    };
    const onActivity = () => check(true);
    const onResume = () => check();
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage &&
          (event.key === null || [AUTH_STORAGE_KEY, AUTH_ACTIVITY_KEY, AUTH_TOKEN_KEY, USUARIOS_STORAGE_KEY].includes(event.key))) check();
    };
    const onUsersChanged = () => check();
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, onActivity, { passive: true, capture: true }));
    window.addEventListener('focus', onResume);
    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('storage', onStorage);
    window.addEventListener(USUARIOS_CHANGE_EVENT, onUsersChanged);
    check();
    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, onActivity, true));
      window.removeEventListener('focus', onResume);
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(USUARIOS_CHANGE_EVENT, onUsersChanged);
    };
  }, [user]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.login(credentials);
      setUser(loggedUser);
      setSessionExpired(false);
      toast.success(`¡Bienvenido de nuevo, ${loggedUser.nombreCompleto}!`);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setSessionExpired(false);
    toast.info('Sesión finalizada correctamente');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        sessionExpired,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
