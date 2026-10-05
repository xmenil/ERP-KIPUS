import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS } from '../services/authService';
import { APP_ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Play,
  User as UserIcon,
  Lock as LockIcon,
} from 'lucide-react';
import kipusLogo from '@/assets/kipus-logo.png';

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

  // Estado de la animación de bienvenida oscura al abrir la app (3 segundos)
  const [introState, setIntroState] = useState<'showing' | 'fading' | 'revealed'>('showing');

  // Ejecución de la animación oscura al montar la pantalla (3 segundos)
  useEffect(() => {
    // Transición a los 3 segundos exactos
    const fadeTimer = setTimeout(() => {
      setIntroState('fading');
    }, 3000);

    // Ocultamiento total de la cortina tras 3.7 segundos
    const revealTimer = setTimeout(() => {
      setIntroState('revealed');
    }, 3700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(revealTimer);
    };
  }, []);

  // Función para volver a ver la animación de inicio
  const replayIntroAnimation = () => {
    setIntroState('showing');

    setTimeout(() => {
      setIntroState('fading');
    }, 3000);

    setTimeout(() => {
      setIntroState('revealed');
    }, 3700);
  };

  const skipIntro = () => {
    setIntroState('fading');
    setTimeout(() => {
      setIntroState('revealed');
    }, 350);
  };

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

  // Texto que salta letra por letra en la intro
  const introHeadline = 'GESTIONA TU NEGOCIO';

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden bg-[#FAF6FD] selection:bg-[#5B1C8A]/20 selection:text-[#5B1C8A]">
      {/* Estilos CSS para el salto secuencial de las letras (onda de recarga) */}
      <style>{`
        @keyframes kipusWaveJump {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.85;
          }
          40% {
            transform: translateY(-14px) scale(1.08);
            opacity: 1;
            text-shadow: 0 0 16px rgba(0, 167, 202, 0.9), 0 0 30px rgba(112, 34, 184, 0.7);
          }
        }
        .letter-wave-jump {
          display: inline-block;
          animation: kipusWaveJump 1.3s infinite ease-in-out;
        }
      `}</style>

      {/* 
        ========================================================================
        1. ANIMACIÓN OSCURA DE 3 SEGUNDOS CON EL LOGO PURO Y LETRAS SALTANDO
        ========================================================================
      */}
      {introState !== 'revealed' && (
        <div
          onClick={skipIntro}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer transition-all duration-700 ease-in-out ${
            introState === 'fading'
              ? 'opacity-0 pointer-events-none scale-105'
              : 'opacity-100 scale-100'
          }`}
          style={{
            background:
              'radial-gradient(circle at 50% 45%, #180D2C 0%, #0D071A 55%, #050209 100%)',
          }}
          title="Haz clic para omitir la animación"
        >
          {/* Botón flotante para omitir la animación */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              skipIntro();
            }}
            className="absolute top-5 right-5 sm:top-7 sm:right-7 px-3.5 py-1.5 rounded-full text-xs font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md transition-all shadow-sm"
          >
            Omitir
          </button>

          {/* Halo ambiental suave morado y cian detrás del logo */}
          <div className="absolute w-80 h-80 sm:w-[32rem] sm:h-[32rem] rounded-full bg-gradient-to-tr from-[#5B1C8A]/45 via-[#7022B8]/35 to-[#00A7CA]/35 blur-3xl pointer-events-none animate-pulse" />

          {/* Contenedor central del logo claro y nítido */}
          <div className="relative z-10 flex flex-col items-center px-4 text-center max-w-2xl w-full">
            {/* Cápsula horizontal de alta nitidez que resalta el logo con sus colores puros originales */}
            <div className="relative mb-8 px-8 py-5 sm:px-14 sm:py-7 bg-white rounded-3xl shadow-[0_0_80px_rgba(112,34,184,0.65)] border border-white/50 backdrop-blur-md transition-transform duration-700 ease-out transform scale-100 animate-in fade-in zoom-in-95">
              <img
                src={kipusLogo}
                alt="KIPUS"
                className="h-20 sm:h-28 md:h-36 w-auto object-contain select-none"
              />
            </div>

            {/* Letras saltando una por una como recarga: GESTIONA TU NEGOCIO (una sola línea) */}
            <div className="flex items-center justify-center flex-nowrap whitespace-nowrap overflow-visible">
              {introHeadline.split('').map((char, index) => (
                <span
                  key={index}
                  className="letter-wave-jump text-base sm:text-xl md:text-2xl lg:text-3xl font-black tracking-[0.18em] sm:tracking-[0.22em] text-white select-none"
                  style={{
                    animationDelay: `${index * 0.065}s`,
                    marginRight: char === ' ' ? '0.6rem' : '0.04rem',
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        2. FONDO GENERAL EN MORADO CLARO (Medio morado claro de fondo)
        ========================================================================
      */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Resplandor superior izquierdo en morado suave */}
        <div
          className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full blur-3xl opacity-60 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(233, 213, 255, 0.75) 0%, rgba(243, 232, 255, 0.4) 60%, transparent 100%)',
          }}
        />
        {/* Resplandor inferior derecho con tinte suave morado-cian */}
        <div
          className="absolute -bottom-36 -right-36 w-[36rem] h-[36rem] rounded-full blur-3xl opacity-50 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(224, 231, 255, 0.6) 0%, rgba(245, 238, 254, 0.5) 50%, transparent 100%)',
          }}
        />
        {/* Textura sutil de puntos */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#5B1C8A 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* 
        ========================================================================
        3. PANTALLA PRINCIPAL: MITAD EL LOGO Y MITAD EL LOGIN
        ========================================================================
      */}
      <div className="relative z-10 min-h-screen w-full flex flex-col justify-between">
        {/* Barra superior móvil / tablet */}
        <header className="w-full px-4 sm:px-8 py-3 flex items-center justify-between text-xs text-muted-foreground lg:hidden">
          <span className="font-semibold text-[#5B1C8A] tracking-wider text-xs">
            KIPU'S ERP
          </span>
          <button
            type="button"
            onClick={replayIntroAnimation}
            className="flex items-center gap-1.5 text-xs text-[#5B1C8A] font-medium hover:underline bg-[#5B1C8A]/5 px-2.5 py-1 rounded-md border border-[#5B1C8A]/15"
            title="Ver animación de bienvenida de nuevo"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Ver intro</span>
          </button>
        </header>

        {/* Contenedor 50% / 50% */}
        <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center p-4 sm:p-6 lg:p-10 gap-8 lg:gap-16">
          
          {/* 
            ------------------------------------------------------------------
            COLUMNA IZQUIERDA (50% en PC): SOLO EL LOGO + "GESTIONA TU NEGOCIO"
            ------------------------------------------------------------------
          */}
          <section className="hidden lg:flex w-full lg:w-1/2 flex-col items-center text-center justify-center space-y-6 pr-4 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* LOGO EN SU COLOR ORIGINAL SIN DEGRADAR */}
            <div className="relative group">
              <img
                src={kipusLogo}
                alt="KIPUS LOGO"
                className="h-32 sm:h-40 lg:h-48 xl:h-52 w-auto object-contain drop-shadow-md select-none transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* SOLO ESTE TEXTO SOLICITADO */}
            <h1 className="text-2xl xl:text-3xl font-black tracking-[0.22em] text-[#3E1169] uppercase select-none">
              GESTIONA TU NEGOCIO
            </h1>
          </section>

          {/* 
            ------------------------------------------------------------------
            COLUMNA DERECHA (50% en PC / 100% en Móvil): FORMULARIO DE LOGIN
            ------------------------------------------------------------------
          */}
          <section className="w-full lg:w-1/2 flex flex-col items-center justify-center animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Cabecera en celular: Solo el Logo + "GESTIONA TU NEGOCIO" */}
            <div className="lg:hidden flex flex-col items-center text-center space-y-2 mb-6">
              <img
                src={kipusLogo}
                alt="KIPUS LOGO"
                className="h-20 sm:h-24 w-auto object-contain drop-shadow-sm"
              />
              <h1 className="text-base sm:text-lg font-black tracking-[0.2em] text-[#3E1169] uppercase">
                GESTIONA TU NEGOCIO
              </h1>
            </div>

            {/* Tarjeta del Formulario de Inicio de Sesión */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-[#E9D5FF] rounded-2xl shadow-lg shadow-purple-950/5 p-6 sm:p-8 space-y-5 sm:space-y-6">
              
              {/* Encabezado del Formulario */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#5B1C8A] uppercase tracking-wider bg-[#5B1C8A]/10 px-2.5 py-0.5 rounded-full">
                    Acceso al Sistema
                  </span>
                  <button
                    type="button"
                    onClick={replayIntroAnimation}
                    className="hidden lg:inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-[#5B1C8A] transition-colors"
                    title="Reproducir animación de inicio de 3 segundos"
                  >
                    <Play className="h-3 w-3" />
                    <span>Ver intro</span>
                  </button>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Iniciar sesión
                </h2>
                <p className="text-xs text-muted-foreground">
                  Ingresa tus credenciales para acceder a tu panel de trabajo
                </p>
              </div>

              {/* Mensaje de error si falla la autenticación */}
              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive animate-in fade-in"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo: Usuario o correo */}
                <div className="space-y-1.5">
                  <Label htmlFor="identifier" className="text-xs font-semibold text-foreground">
                    Usuario o correo electrónico
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="identifier"
                      name="username"
                      type="text"
                      autoComplete="username"
                      autoCapitalize="none"
                      placeholder="admin o caja@kipus.pe"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      disabled={isSubmitting}
                      className="h-10 sm:h-11 pl-9 text-sm rounded-lg border-input bg-white focus-visible:ring-2 focus-visible:ring-[#5B1C8A] transition-shadow"
                      required
                    />
                  </div>
                </div>

                {/* Campo: Contraseña */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                      Contraseña
                    </Label>
                    <a
                      href="#recuperar"
                      onClick={(e) => {
                        e.preventDefault();
                        fillDemoAccount('admin', 'admin123');
                      }}
                      className="text-xs text-[#5B1C8A] hover:underline font-medium"
                    >
                      ¿Olvidaste tu contraseña?
                    </a>
                  </div>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
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
                      className="h-10 sm:h-11 pl-9 pr-10 text-sm font-mono rounded-lg border-input bg-white focus-visible:ring-2 focus-visible:ring-[#5B1C8A] transition-shadow"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-2.5 top-2 sm:top-2.5 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-hidden focus:ring-1 focus:ring-[#5B1C8A]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Recordar sesión */}
                <div className="flex items-center space-x-2 pt-0.5">
                  <Checkbox
                    id="recordar"
                    checked={recordar}
                    onCheckedChange={(checked) => setRecordar(!!checked)}
                    className="data-[state=checked]:bg-[#5B1C8A] data-[state=checked]:border-[#5B1C8A]"
                  />
                  <Label
                    htmlFor="recordar"
                    className="text-xs text-muted-foreground font-normal cursor-pointer select-none"
                  >
                    Recordar sesión en este equipo
                  </Label>
                </div>

                {/* Botón Iniciar sesión */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 sm:h-11 rounded-lg bg-[#5B1C8A] text-white font-semibold text-sm shadow-sm transition-all hover:bg-[#4A1472] active:scale-[0.99] mt-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Iniciando sesión…</span>
                    </span>
                  ) : (
                    <span>Iniciar sesión</span>
                  )}
                </Button>
              </form>

              {/* Cuentas de prueba rápidas (1 clic) */}
              <div className="pt-4 border-t border-[#E9D5FF]/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    Cuentas de prueba (1 clic):
                  </span>
                  <span className="text-[10px] text-muted-foreground">Demo local</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {DEMO_USERS.map((demo) => {
                    const isSelected = identifier === demo.username;
                    const label =
                      demo.rol === 'ADMINISTRADOR'
                        ? 'Admin'
                        : demo.rol === 'CAJERO'
                        ? 'Cajero'
                        : 'Almacén';

                    return (
                      <button
                        key={demo.id}
                        type="button"
                        onClick={() => fillDemoAccount(demo.username, demo.password)}
                        className={`py-2 px-2 rounded-lg border text-center transition-all ${
                          isSelected
                            ? 'border-[#5B1C8A] bg-[#5B1C8A]/10 text-[#5B1C8A] font-semibold ring-1 ring-[#5B1C8A]'
                            : 'border-border bg-white text-muted-foreground hover:text-foreground hover:bg-[#FAF6FD] hover:border-[#E9D5FF]'
                        }`}
                      >
                        <span className="block text-xs leading-none font-medium">
                          {label}
                        </span>
                        <span className="block text-[10px] font-mono text-muted-foreground/80 mt-1 truncate">
                          {demo.username}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Pie institucional sobrio */}
        <footer className="w-full text-center text-xs text-muted-foreground py-4 px-4 border-t border-[#E9D5FF]/40">
          <p>© 2026 KIPU'S ERP · Sistema de Gestión Comercial · Tingo María, Perú</p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
