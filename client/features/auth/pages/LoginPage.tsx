import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  User as UserIcon,
  Lock as LockIcon,
  Store,
  Mail,
  Phone,
  Sparkles,
  Info,
} from 'lucide-react';

// Letras independientes extraídas en alta resolución y transparencia
import letterK from '@/assets/letters/k.png';
import letterI from '@/assets/letters/i.png';
import letterP from '@/assets/letters/p.png';
import letterU from '@/assets/letters/u.png';
import letterS from '@/assets/letters/s.png';
import kipusLogoFull from '@/assets/kipus-logo.png';

interface LoginPageProps {
  defaultMode?: 'login' | 'register';
}

export const LoginPage: React.FC<LoginPageProps> = ({ defaultMode }) => {
  const { user, login, register, isAuthenticated, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegisterRoute = location.pathname === APP_ROUTES.REGISTER || defaultMode === 'register';
  const [authMode, setAuthMode] = useState<'login' | 'register'>(isRegisterRoute ? 'register' : 'login');

  // Campos de Iniciar Sesión (comienzan vacíos)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recordar, setRecordar] = useState(true);

  // Campos de Crear Cuenta de Tienda
  const [regNombreTienda, setRegNombreTienda] = useState('');
  const [regNombreCompleto, setRegNombreCompleto] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regTelefono, setRegTelefono] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Sincronizar authMode si la URL cambia
  useEffect(() => {
    if (location.pathname === APP_ROUTES.REGISTER) {
      setAuthMode('register');
    } else if (location.pathname === APP_ROUTES.LOGIN && !defaultMode) {
      setAuthMode('login');
    }
  }, [location.pathname, defaultMode]);

  // Mostrar la introducción en cada acceso al login, también tras expirar la sesión.
  const [introState, setIntroState] = useState<'showing' | 'fading' | 'revealed'>('showing');
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === 'visible');

  useEffect(() => {
    if (sessionExpired) setIntroState('showing');
  }, [sessionExpired]);

  useEffect(() => {
    const onVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setPageVisible(visible);
      if (visible) setIntroState((current) => (current === 'revealed' ? current : 'showing'));
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Efecto de temporizador de 3 segundos para la animación oscura
  useEffect(() => {
    if (introState === 'revealed' || !pageVisible) return;

    const timer = setTimeout(() => {
      setIntroState(introState === 'showing' ? 'fading' : 'revealed');
    }, introState === 'showing' ? 3000 : 700);

    return () => clearTimeout(timer);
  }, [introState, pageVisible]);

  const skipIntro = () => {
    setIntroState('fading');
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.rol === 'SUPER_ADMIN') {
        navigate(APP_ROUTES.SUPER_ADMIN, { replace: true });
        return;
      }
      const origin =
        (location.state as { from?: { pathname?: string } })?.from?.pathname ||
        APP_ROUTES.DASHBOARD;
      navigate(origin, { replace: true });
    }
  }, [isAuthenticated, user?.rol, navigate, location]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const tienda = regNombreTienda.trim();
    const dueno = regNombreCompleto.trim();
    const username = regUsername.trim().toLowerCase();
    const email = regEmail.trim().toLowerCase();
    const pass = regPassword.trim();
    const telefono = regTelefono.trim();

    if (!tienda) {
      setErrorMessage('Ingresa el nombre de tu tienda o negocio.');
      return;
    }
    if (!dueno) {
      setErrorMessage('Ingresa tu nombre y apellido completo.');
      return;
    }
    if (!username) {
      setErrorMessage('Ingresa un nombre de usuario para iniciar sesión.');
      return;
    }
    if (/\s/.test(username)) {
      setErrorMessage('El nombre de usuario no puede contener espacios.');
      return;
    }
    if (!email) {
      setErrorMessage('Ingresa tu correo electrónico.');
      return;
    }
    if (!email.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      return;
    }
    if (!pass || pass.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await register({
        nombreTienda: tienda,
        nombreCompleto: dueno,
        username,
        email,
        password: pass,
        telefono: telefono || undefined,
        recordar: true,
      });

      if (ok) {
        navigate(APP_ROUTES.DASHBOARD, { replace: true });
      } else {
        setErrorMessage('No se pudo registrar la tienda. Intenta con otro usuario o correo.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(
      'Para restablecer tu contraseña, solicita asistencia al administrador de tu tienda o al Super Administrador de KIPU\'S.'
    );
  };

  // Arreglo de letras independientes con su animación desfasada
  const logoLetters = [
    { src: letterK, alt: 'K', delay: '0s' },
    { src: letterI, alt: 'i', delay: '0.12s' },
    { src: letterP, alt: 'p', delay: '0.24s' },
    { src: letterU, alt: 'u', delay: '0.36s' },
    { src: letterS, alt: 's', delay: '0.48s' },
  ];

  // Palabras que saltan independientemente
  const words = ['GESTIONA', 'TU', 'NEGOCIO'];

  return (
    <div className="login-light min-h-screen w-full relative overflow-x-hidden bg-[#FAF6FD] text-foreground selection:bg-[#5B1C8A]/20 selection:text-[#5B1C8A]">
      {/* Estilos CSS para el salto de letras y palabras en la intro */}
      <style>{`
        @keyframes kipusLetterWave {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          35% {
            transform: translateY(-24px) scale(1.08);
          }
        }
        @keyframes kipusWordWave {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.85;
          }
          40% {
            transform: translateY(-12px);
            opacity: 1;
            text-shadow: 0 0 20px rgba(0, 167, 202, 0.95), 0 0 35px rgba(112, 34, 184, 0.8);
          }
        }
        .letter-bounce-item {
          display: inline-block;
          animation: kipusLetterWave 1.4s infinite ease-in-out;
          filter: drop-shadow(0 0 22px rgba(112, 34, 184, 0.75)) drop-shadow(0 0 32px rgba(0, 167, 202, 0.55));
        }
        .word-bounce-item {
          display: inline-block;
          animation: kipusWordWave 1.4s infinite ease-in-out;
        }
      `}</style>

      {/* 
        ========================================================================
        1. INTRO OSCURA (3 SEGUNDOS): LETRAS INDEPENDIENTES SALTANDO
        ========================================================================
      */}
      {introState !== 'revealed' && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
            introState === 'fading'
              ? 'opacity-0 pointer-events-none scale-105'
              : 'opacity-100 scale-100'
          }`}
          style={{
            background:
              'radial-gradient(circle at 50% 48%, #16082B 0%, #0D051B 55%, #050209 100%)',
          }}
        >
          {/* Botón flotante para omitir la intro */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              skipIntro();
            }}
            className="absolute top-6 right-6 text-white/50 hover:text-white text-xs px-3 py-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            Saltar intro ✕
          </button>

          <div
            onClick={skipIntro}
            className="flex flex-col items-center justify-center gap-6 px-4 cursor-pointer select-none text-center"
          >
            {/* Letras saltando */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 py-2">
              {logoLetters.map((letter, idx) => (
                <div
                  key={idx}
                  className="letter-bounce-item"
                  style={{ animationDelay: letter.delay }}
                >
                  <img
                    src={letter.src}
                    alt={letter.alt}
                    className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto object-contain pointer-events-none"
                    style={{
                      backgroundColor: 'transparent',
                      mixBlendMode: 'normal',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Palabras inferiores saltando */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-5 mt-2">
              {words.map((word, index) => (
                <span
                  key={word}
                  className="word-bounce-item font-black tracking-[0.25em] sm:tracking-[0.3em] text-white text-sm sm:text-base md:text-xl uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
                  style={{ animationDelay: `${index * 0.22}s` }}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        2. VISTA PRINCIPAL
        ========================================================================
      */}
      <div className="min-h-screen flex flex-col justify-between">
        {/* Contenido centrado */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
          <section
            aria-label="Acceso a KIPU'S ERP"
            className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          >
            {/* Lado Izquierdo: Marca oficial Kipus + Lema */}
            <div className="flex flex-col items-center justify-center gap-4 text-center select-none py-2">
              <img
                src={kipusLogoFull}
                alt="KIPU'S ERP"
                className="h-20 sm:h-24 w-auto object-contain drop-shadow-sm"
              />
              <h1 className="text-base sm:text-lg font-black tracking-[0.2em] text-[#3E1169] uppercase">
                GESTIONA TU NEGOCIO
              </h1>
            </div>

            {/* Lado Derecho: Tarjeta de Autenticación / Registro */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-[#E9D5FF] rounded-2xl shadow-lg shadow-purple-950/5 p-6 sm:p-8 space-y-5 sm:space-y-6">
              {/* Encabezado dinámico según modo */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#5B1C8A] uppercase tracking-wider bg-[#5B1C8A]/10 px-2.5 py-0.5 rounded-full inline-block">
                  {authMode === 'login' ? 'Acceso al Sistema' : 'Nueva Tienda'}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta de tienda'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {authMode === 'login'
                    ? 'Ingresa tus credenciales para acceder a tu panel de trabajo'
                    : 'Registra tu negocio para comenzar a gestionar ventas e inventario'}
                </p>
              </div>

              {/* Mensaje de sesión expirada */}
              {sessionExpired && authMode === 'login' && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-md border border-border bg-warning-soft p-3 text-sm text-warning-text"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>Tu sesión se cerró por inactividad. Ingresa tus credenciales para continuar.</p>
                </div>
              )}

              {/* Mensaje de información (ej. olvidaste contraseña) */}
              {infoMessage && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 animate-in fade-in">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                  <span className="leading-snug">{infoMessage}</span>
                </div>
              )}

              {/* Mensaje de error */}
              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive animate-in fade-in"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* ========================================================
                  FORMULARIO 1: INICIAR SESIÓN (Inputs completamente limpios)
                  ======================================================== */}
              {authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                        autoComplete="off"
                        autoCapitalize="none"
                        placeholder=""
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
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-[#5B1C8A] hover:underline font-medium cursor-pointer"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div className="relative">
                      <LockIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder=""
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
                        className="absolute right-2.5 top-2 sm:top-2.5 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-hidden focus:ring-1 focus:ring-[#5B1C8A] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

                  {/* Opción Crear Cuenta (Reemplaza los botones de demo) */}
                  <div className="pt-4 border-t border-[#E9D5FF]/80 text-center">
                    <p className="text-xs text-muted-foreground">
                      ¿No tienes una cuenta de tienda?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setInfoMessage(null);
                          setAuthMode('register');
                        }}
                        className="font-semibold text-[#5B1C8A] hover:text-[#4A1472] hover:underline cursor-pointer transition-colors"
                      >
                        Crear cuenta
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* ========================================================
                  FORMULARIO 2: CREAR CUENTA DE TIENDA
                  ======================================================== */}
              {authMode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  {/* Nombre de la Tienda */}
                  <div className="space-y-1">
                    <Label htmlFor="regNombreTienda" className="text-xs font-semibold text-foreground">
                      Nombre de la Tienda o Negocio <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="regNombreTienda"
                        type="text"
                        placeholder=""
                        value={regNombreTienda}
                        onChange={(e) => setRegNombreTienda(e.target.value)}
                        disabled={isSubmitting}
                        className="h-10 pl-9 text-sm rounded-lg border-input bg-white focus-visible:ring-2 focus-visible:ring-[#5B1C8A]"
                        required
                      />
                    </div>
                  </div>

                  {/* Nombre Completo del Dueño */}
                  <div className="space-y-1">
                    <Label htmlFor="regNombreCompleto" className="text-xs font-semibold text-foreground">
                      Tu Nombre Completo (Dueño / Administrador) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="regNombreCompleto"
                        type="text"
                        placeholder=""
                        value={regNombreCompleto}
                        onChange={(e) => setRegNombreCompleto(e.target.value)}
                        disabled={isSubmitting}
                        className="h-10 pl-9 text-sm rounded-lg border-input bg-white focus-visible:ring-2 focus-visible:ring-[#5B1C8A]"
                        required
                      />
                    </div>
                  </div>

                  {/* Usuario de login */}
                  <div className="space-y-1">
                    <Label htmlFor="regUsername" className="text-xs font-semibold text-foreground">
                      Usuario para inicio de sesión <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="regUsername"
                        type="text"
                        autoCapitalize="none"
                        autoComplete="off"
                        placeholder=""
                        value={regUsername}
                        onChange={(e) =>
                          setRegUsername(e.target.value.toLowerCase().replace(/\s/g, ''))
                        }
                        disabled={isSubmitting}
                        className="h-10 pl-9 text-sm font-mono rounded-lg border-input bg-white focus-visible:ring-2 focus-visible:ring-[#5B1C8A]"
                        required
                      />
                    </div>
                  </div>

                  {/* Correo Electrónico */}
                  <div className="space-y-1">
                    <Label htmlFor="regEmail" className="text-xs font-semibold text-foreground">
                      Correo Electrónico <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="regEmail"
                        type="email"
                        placeholder=""
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        disabled={isSubmitting}
                        className="h-10 pl-9 text-sm rounded-lg border-input bg-white focus-visible:ring-2 focus-visible:ring-[#5B1C8A]"
                        required
                      />
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div className="space-y-1">
                    <Label htmlFor="regPassword" className="text-xs font-semibold text-foreground">
                      Contraseña (mínimo 6 caracteres) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <LockIcon className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="regPassword"
                        type={regShowPassword ? 'text' : 'password'}
                        placeholder=""
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        disabled={isSubmitting}
                        className="h-10 pl-9 pr-10 text-sm font-mono rounded-lg border-input bg-white focus-visible:ring-2 focus-visible:ring-[#5B1C8A]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setRegShowPassword(!regShowPassword)}
                        aria-label={regShowPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md cursor-pointer"
                      >
                        {regShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Teléfono opcional */}
                  <div className="space-y-1">
                    <Label htmlFor="regTelefono" className="text-xs font-semibold text-foreground">
                      Teléfono / WhatsApp de contacto <span className="text-muted-foreground text-[10px] font-normal">(Opcional)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="regTelefono"
                        type="text"
                        placeholder=""
                        value={regTelefono}
                        onChange={(e) => setRegTelefono(e.target.value)}
                        disabled={isSubmitting}
                        className="h-10 pl-9 text-sm rounded-lg border-input bg-white focus-visible:ring-2 focus-visible:ring-[#5B1C8A]"
                      />
                    </div>
                  </div>

                  {/* Botón de envío */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 sm:h-11 rounded-lg bg-[#5B1C8A] text-white font-semibold text-sm shadow-sm transition-all hover:bg-[#4A1472] active:scale-[0.99] mt-2 cursor-pointer gap-2"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creando tienda…</span>
                      </span>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Crear mi tienda y empezar</span>
                      </>
                    )}
                  </Button>

                  {/* Volver a Iniciar sesión */}
                  <div className="pt-3 border-t border-[#E9D5FF]/80 text-center">
                    <p className="text-xs text-muted-foreground">
                      ¿Ya tienes una cuenta de tienda?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage(null);
                          setInfoMessage(null);
                          setAuthMode('login');
                        }}
                        className="font-semibold text-[#5B1C8A] hover:text-[#4A1472] hover:underline cursor-pointer transition-colors"
                      >
                        Iniciar sesión
                      </button>
                    </p>
                  </div>
                </form>
              )}
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
