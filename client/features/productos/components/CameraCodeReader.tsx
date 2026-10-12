import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CameraScanner, mensajeErrorCamara } from '../services/cameraScanner';
import type { CameraCodeMode } from '../services/cameraDetection';

interface Props { onRead: (code: string) => void; disabled?: boolean }

export function CameraCodeReader({ onRead, disabled }: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  return <div className="space-y-2">
    <Button type="button" variant="outline" disabled={disabled} className="min-h-11 md:min-h-9" onClick={() => setOpen(true)}>
      <Camera className="mr-2 h-4 w-4" strokeWidth={1.75} /> Leer con cámara
    </Button>
    {open && !disabled && <CameraPreview onCancel={() => setOpen(false)} onRead={code => { setOpen(false); onRead(code); }} />}
  </div>;
}

function CameraPreview({ onRead, onCancel }: { onRead: (code: string) => void; onCancel: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const callbackRef = useRef(onRead);
  callbackRef.current = onRead;
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState('automatic');
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<CameraCodeMode>('todos');
  const [help, setHelp] = useState(false);

  useEffect(() => {
    let active = true;
    const scanner = new CameraScanner();
    const video = videoRef.current;
    setError('');
    setReady(false);
    setHelp(false);
    const helpTimer = window.setTimeout(() => { if (active) setHelp(true); }, 12000);
    const suspend = () => { if (document.hidden) onCancel(); };
    const leave = () => { scanner.stop(); onCancel(); };
    document.addEventListener('visibilitychange', suspend);
    window.addEventListener('pagehide', leave);
    async function start() {
      if (!window.isSecureContext) {
        setError('La cámara necesita una conexión HTTPS. En esta computadora también puedes usar localhost.');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Este navegador no permite acceder a la cámara. Prueba con un navegador actualizado o escribe el código.');
        return;
      }
      try {
        const [{ BrowserMultiFormatReader }, { crearHintsCamara, mejorarEnfoque }] = await Promise.all([
          import('@zxing/browser'), import('../services/cameraDetection'),
        ]);
        if (!active || !video) return;
        await scanner.start(video, new BrowserMultiFormatReader(crearHintsCamara(mode), { delayBetweenScanAttempts: 150, tryPlayVideoTimeout: 15000 }),
          async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
              width: { ideal: 1920 }, height: { ideal: 1080 },
              ...(deviceId === 'automatic' ? { facingMode: { ideal: 'environment' } } : { deviceId: { exact: deviceId } }),
            } });
            if (active) await mejorarEnfoque(stream);
            return stream;
          },
          code => { if (active) callbackRef.current(code); },
          failure => { if (active) { setReady(false); setError(mensajeErrorCamara(failure)); } });
        if (!active) return;
        setReady(true);
        // Device listing is optional; a blocked list must not interrupt a working camera.
        try {
          const available = await navigator.mediaDevices.enumerateDevices();
          if (active) setDevices(available.filter(device => device.kind === 'videoinput' && device.deviceId));
        } catch { /* Keep scanning with the camera already opened. */ }
      } catch (failure) {
        scanner.stop();
        if (active) setError(mensajeErrorCamara(failure));
      }
    }
    void start();
    return () => {
      active = false;
      window.clearTimeout(helpTimer);
      scanner.stop();
      if (video) video.srcObject = null;
      document.removeEventListener('visibilitychange', suspend);
      window.removeEventListener('pagehide', leave);
    };
    // The result callback stays current without restarting the stream on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, attempt, mode]);

  return <section aria-label="Lectura con cámara" className="space-y-3 rounded-md border border-border p-3">
    <p className="text-sm">Apunta al QR o código de barras. La cámara se cerrará después de una lectura.</p>
    <div className="space-y-2">
      <Label htmlFor="tipo-codigo-camara">Tipo de código</Label>
      <Select value={mode} onValueChange={value => setMode(value as CameraCodeMode)}>
        <SelectTrigger id="tipo-codigo-camara"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">QR y códigos de barras</SelectItem>
          <SelectItem value="barras">Código de barras</SelectItem>
          <SelectItem value="qr">QR</SelectItem>
        </SelectContent>
      </Select>
    </div>
    {devices.length > 1 && <div className="space-y-2">
      <Label htmlFor="seleccion-camara">Cámara</Label>
      <Select value={deviceId} onValueChange={setDeviceId}>
        <SelectTrigger id="seleccion-camara"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="automatic">Automática (preferir cámara trasera)</SelectItem>
          {devices.map((device, index) => <SelectItem key={device.deviceId} value={device.deviceId}>{device.label || `Cámara ${index + 1}`}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>}
    <video ref={videoRef} autoPlay muted playsInline aria-label="Vista de la cámara" className="aspect-video w-full rounded-md bg-muted object-contain" />
    <p aria-live="polite" className="text-xs text-muted-foreground">{error ? '' : ready ? 'Buscando código. Mantén el producto quieto y con buena luz.' : 'Abriendo cámara… Permite el acceso cuando lo solicite el navegador.'}</p>
    {error && <p role="alert" className="text-sm text-danger-text">{error}</p>}
    {help && ready && !error && <p role="status" className="text-sm text-muted-foreground">Aún no se reconoce el código. Selecciona su tipo y coloca el código completo, horizontal y enfocado frente a la cámara. Aléjalo si se ve borroso y evita reflejos. Si hay varias cámaras traseras, prueba otra.</p>}
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>Cerrar cámara</Button>
      {(error || help) && <Button type="button" variant="outline" onClick={() => setAttempt(value => value + 1)}>Reintentar</Button>}
    </div>
  </section>;
}
