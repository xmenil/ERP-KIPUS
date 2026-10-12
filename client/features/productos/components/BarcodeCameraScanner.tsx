import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Camera,
  CameraOff,
  Zap,
  ZapOff,
  Search,
  ScanBarcode,
  Keyboard,
  Sparkles,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { EJEMPLOS_ESCANER_BODEGA } from '../services/barcodeCatalogService';
import { cn } from '@/lib/utils';

// Definición de tipos para BarcodeDetector de la Web API nativa
interface DetectedBarcode {
  rawValue: string;
  format: string;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): {
        detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
      };
      getSupportedFormats(): Promise<string[]>;
    };
  }
}

interface BarcodeCameraScannerProps {
  onScan: (code: string) => void;
  isScanning?: boolean;
  className?: string;
}

/**
 * Sonido sintético de "beep" exitoso de escáner usando la Web Audio API estándar
 */
function emitirBeepEscaner() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1850, ctx.currentTime); // Tono agudo característico de lector POS
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Si el navegador bloquea audio sin interacción previa, ignorar en silencio
  }
}

export const BarcodeCameraScanner: React.FC<BarcodeCameraScannerProps> = ({
  onScan,
  isScanning = true,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [inputManual, setInputManual] = useState('');
  const [detectorSupported, setDetectorSupported] = useState(false);
  const [tabModo, setTabModo] = useState<'camara' | 'manual'>('camara');

  // Último código escaneado con cooldown para evitar dobles lecturas instantáneas
  const ultimoCodigoRef = useRef<string>('');
  const ultimoTiempoRef = useRef<number>(0);

  // Procesar código leído
  const handleCodigoDetectado = useCallback(
    (codigoLimpio: string) => {
      const ahora = Date.now();
      if (
        ultimoCodigoRef.current === codigoLimpio &&
        ahora - ultimoTiempoRef.current < 2200
      ) {
        return; // Ignorar lecturas repetidas en menos de 2.2 segundos
      }

      ultimoCodigoRef.current = codigoLimpio;
      ultimoTiempoRef.current = ahora;
      emitirBeepEscaner();
      onScan(codigoLimpio);
    },
    [onScan]
  );

  // Iniciar la cámara web / trasera
  const iniciarCamara = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Este navegador no tiene soporte de cámara.');
        setTabModo('manual');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Cámara trasera en móviles
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);

        // Revisar si soporta linterna (torch)
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? track.getCapabilities() : null;
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        }
      }
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraError('Permiso de cámara denegado. Puedes ingresar el código manualmente o usar una pistola lectora USB.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraError('No se detectó ninguna cámara conectada en este equipo.');
      } else {
        setCameraError('No se pudo acceder a la cámara. Usa el ingreso manual o escáner USB.');
      }
      setCameraActive(false);
      setTabModo('manual');
    }
  }, []);

  // Detener la cámara
  const detenerCamara = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  }, []);

  // Alternar linterna
  const toggleLinterna = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await (track as MediaStreamTrack & { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch {
      // Ignorar si el navegador no permite cambiar torch
    }
  };

  // Ciclo de detección de código de barras mediante BarcodeDetector nativo
  useEffect(() => {
    const isSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    setDetectorSupported(isSupported);

    if (!isSupported || !cameraActive || !isScanning) return;

    let detector: InstanceType<NonNullable<typeof window.BarcodeDetector>> | null = null;
    try {
      detector = new window.BarcodeDetector!({
        formats: [
          'ean_13',
          'ean_8',
          'code_128',
          'code_39',
          'upc_a',
          'upc_e',
          'qr_code',
          'itf',
        ],
      });
    } catch {
      detector = null;
    }

    if (!detector) return;

    let cancelado = false;
    const detectarCuadro = async () => {
      if (cancelado || !videoRef.current || videoRef.current.readyState < 2) {
        if (!cancelado) {
          animationFrameRef.current = requestAnimationFrame(detectarCuadro);
        }
        return;
      }

      try {
        const codigos = await detector!.detect(videoRef.current);
        if (codigos && codigos.length > 0 && !cancelado) {
          const primer = codigos[0];
          if (primer.rawValue) {
            handleCodigoDetectado(primer.rawValue.trim());
          }
        }
      } catch {
        // Fallos de cuadro son normales durante movimientos rápidos
      }

      if (!cancelado) {
        // Esperar 120ms entre detecciones para no sobrecargar la GPU
        setTimeout(() => {
          if (!cancelado) {
            animationFrameRef.current = requestAnimationFrame(detectarCuadro);
          }
        }, 120);
      }
    };

    animationFrameRef.current = requestAnimationFrame(detectarCuadro);

    return () => {
      cancelado = true;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraActive, isScanning, handleCodigoDetectado]);

  // Listener para pistola lectora de código de barras USB/Bluetooth física
  useEffect(() => {
    let buffer = '';
    let ultimoKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      // No interferir si el usuario está escribiendo en un input o textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const ahora = Date.now();
      // Las pistolas lectoras envían teclas con diferencia de <40ms entre sí
      if (ahora - ultimoKeyTime > 150) {
        buffer = '';
      }
      ultimoKeyTime = ahora;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          e.preventDefault();
          handleCodigoDetectado(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleCodigoDetectado]);

  // Manejo de encendido/apagado al montar o cambiar de tab
  useEffect(() => {
    if (tabModo === 'camara' && isScanning) {
      iniciarCamara();
    } else {
      detenerCamara();
    }
    return () => {
      detenerCamara();
    };
  }, [tabModo, isScanning, iniciarCamara, detenerCamara]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputManual.trim()) {
      handleCodigoDetectado(inputManual.trim());
      setInputManual('');
    }
  };

  return (
    <div className={cn('flex flex-col gap-3 rounded-lg border border-border bg-card p-3', className)}>
      {/* Selector de modo: Cámara vs Manual / Pistola */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={tabModo === 'camara' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTabModo('camara')}
            className={cn(
              'h-8 text-xs font-medium gap-1.5',
              tabModo === 'camara' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            )}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Cámara en vivo</span>
          </Button>

          <Button
            type="button"
            variant={tabModo === 'manual' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTabModo('manual')}
            className={cn(
              'h-8 text-xs font-medium gap-1.5',
              tabModo === 'manual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            )}
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Ingreso manual / Pistola</span>
          </Button>
        </div>

        {tabModo === 'camara' && cameraActive && hasTorch && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleLinterna}
            className="h-7 px-2 text-xs gap-1 border-border"
            title="Encender o apagar flash"
          >
            {torchOn ? <ZapOff className="h-3.5 w-3.5 text-amber-500" /> : <Zap className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{torchOn ? 'Luz apagada' : 'Luz'}</span>
          </Button>
        )}
      </div>

      {/* Modo 1: Cámara en vivo */}
      {tabModo === 'camara' && (
        <div className="space-y-2.5">
          <div className="relative aspect-video w-full overflow-hidden rounded-md bg-neutral-950 flex items-center justify-center border border-border/80">
            {/* Video */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />

            {/* Máscara de mira y guía de escaneo */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Cuadro objetivo */}
                <div className="relative w-64 h-36 border-2 border-primary/90 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                  {/* Esquinas destacadas */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />

                  {/* Línea láser animada */}
                  <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse top-1/2 -translate-y-1/2" />

                  <span className="absolute -bottom-6 left-0 right-0 text-center text-[11px] font-medium text-white/90 drop-shadow">
                    Centra el código de barras aquí
                  </span>
                </div>
              </div>
            )}

            {/* Estado de error o sin cámara */}
            {!cameraActive && (
              <div className="p-4 text-center max-w-sm flex flex-col items-center gap-2 text-white">
                <CameraOff className="h-8 w-8 text-neutral-400" />
                <p className="text-xs text-neutral-300">
                  {cameraError || 'Iniciando sensor de cámara…'}
                </p>
                {cameraError && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={iniciarCamara}
                    className="h-7 text-xs bg-neutral-900 border-neutral-700 text-neutral-200 mt-1"
                  >
                    <RotateCw className="h-3.5 w-3.5 mr-1" />
                    Reintentar cámara
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span className="flex items-center gap-1">
              <ScanBarcode className="h-3.5 w-3.5 text-primary" />
              {detectorSupported
                ? 'Detección automática activa (EAN-13, UPC, Code 128)'
                : 'Enfoca el código de barras nítidamente'}
            </span>
            <span className="font-mono text-[10px]">KIPU&apos;S SCAN</span>
          </div>
        </div>
      )}

      {/* Modo 2: Ingreso Manual o Pistola Lectora */}
      {tabModo === 'manual' && (
        <div className="space-y-3">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <ScanBarcode className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={inputManual}
                onChange={(e) => setInputManual(e.target.value)}
                placeholder="Digita el código EAN o dispara con la pistola…"
                className="pl-9 h-9 text-xs font-mono font-bold bg-background"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={!inputManual.trim()}
              className="h-9 px-3 text-xs bg-primary text-primary-foreground font-semibold shrink-0"
            >
              <Search className="h-3.5 w-3.5 mr-1" />
              Consultar
            </Button>
          </form>

          <div className="rounded-md border border-border/60 bg-muted/20 p-2.5 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Soporte para Pistola USB / Bluetooth:</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Apunta y dispara directamente al producto. El sistema detecta el código automáticamente y cargará sus datos al instante.
            </p>
          </div>
        </div>
      )}

      {/* Botones de prueba rápida con productos reales de bodega en Perú */}
      <div className="pt-2 border-t border-border/50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Prueba rápida con productos de bodega (demo):
          </span>
          <span className="text-[10px] text-muted-foreground">1 clic</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EJEMPLOS_ESCANER_BODEGA.slice(0, 6).map((item) => (
            <button
              key={item.codigo}
              type="button"
              onClick={() => handleCodigoDetectado(item.codigo)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted/60 hover:bg-primary-soft hover:text-primary text-[11px] text-foreground border border-border/60 transition-colors"
              title={`Simular escaneo de ${item.label} (${item.codigo})`}
            >
              <span className="font-medium">{item.label}</span>
              <span className="text-[9px] font-mono text-muted-foreground">
                ({item.codigo.slice(-4)})
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
