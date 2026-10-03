import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS } from '../services/authService';
import { APP_ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [recordar, setRecordar] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const origin =
        (location.state as { from?: { pathname?: string } })?.from?.pathname ||
        APP_ROUTES.DASHBOARD;
      navigate(origin, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMessage('Ingresa tu usuario o correo electrónico.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Ingresa tu contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await login({
        identifier: cleanId,
        password: cleanPass,
        recordar,
      });

      if (ok) {
        const origin =
          (location.state as { from?: { pathname?: string } })?.from?.pathname ||
          APP_ROUTES.DASHBOARD;
        navigate(origin, { replace: true });
      } else {
        setErrorMessage('Usuario o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.');
      }
    } catch {
      setErrorMessage('No se pudo conectar con el servidor. Revisa tu conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (username: string, pass: string) => {
    setIdentifier(username);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-background p-4 sm:p-6 lg:p-8">
      {/* Encabezado mínimo */}
      <header className="w-full max-w-sm mx-auto flex items-center justify-between text-xs text-muted-foreground pt-2">
        
      </header>

      {/* Tarjeta central de acceso */}
      <main className="w-full max-w-sm mx-auto my-auto py-6">
        <div className="bg-card border border-border rounded-md shadow-xs p-6 sm:p-8 space-y-6">
          {/* Título de la pantalla */}
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-center text-foreground tracking-tight">
              Iniciar sesión
            </h1>
          </div>

          {/* Mensaje de error visible si la autenticación falla */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-xs font-medium text-foreground">
                Usuario o correo
              </Label>
              <Input
                id="identifier"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                placeholder="ej. admin o caja@kipus.pe"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isSubmitting}
                className="h-9 text-sm rounded-md border-input bg-background"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-foreground">
                  Contraseña
                </Label>
                <a
                  href="#recuperar"
                  onClick={(e) => {
                    e.preventDefault();
                    fillDemoAccount('admin', 'admin123');
                  }}
                  className="text-xs text-primary hover:underline font-normal"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isSubmitting}
                  className="h-9 pr-9 text-sm font-mono rounded-md border-input bg-background"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-0.5">
              <Checkbox
                id="recordar"
                checked={recordar}
                onCheckedChange={(checked) => setRecordar(!!checked)}
              />
              <Label
                htmlFor="recordar"
                className="text-xs text-muted-foreground font-normal cursor-pointer select-none"
              >
                Recordar sesión en este equipo
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-9 rounded-md bg-primary text-primary-foreground font-medium text-sm shadow-xs transition-colors hover:bg-primary/90 mt-2"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Iniciando sesión…</span>
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </form>

          {/* Cuentas de prueba discretas para evaluación */}
          <div className="pt-4 border-t border-border space-y-2">
            <span className="text-xs text-muted-foreground block font-medium">
              Cuentas de prueba (1 clic):
            </span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {DEMO_USERS.map((demo) => {
                const isSelected = identifier === demo.username;
                const label =
                  demo.rol === 'ADMINISTRADOR'
                    ? 'Administrador'
                    : demo.rol === 'CAJERO'
                    ? 'Cajero'
                    : 'Almacén';

                return (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => fillDemoAccount(demo.username, demo.password)}
                    className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span>{label}</span>
                    <span className="text-[11px] font-mono text-muted-foreground ml-1.5">
                      ({demo.username})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Pie institucional sobrio */}
      <footer className="w-full max-w-sm mx-auto text-center text-xs text-muted-foreground pb-2">
        <p>© 2026 - KIPU'S</p>
      </footer>
    </div>
  );
};

export default LoginPage;
