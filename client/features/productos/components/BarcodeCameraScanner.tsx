import { useState } from 'react';
import { Camera, Keyboard, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CameraPreview } from './CameraPreview';
import { normalizarCodigo } from '../utils/codigosProducto';

interface Props { onScan: (code: string) => void; isScanning?: boolean; className?: string }

// Camera/manual presentation with the same decoder used by the product form and POS.
export function BarcodeCameraScanner({ onScan, isScanning = true, className }: Props) {
  const [mode, setMode] = useState<'camara' | 'manual'>('camara');
  const [paused, setPaused] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const read = (value: string) => {
    try {
      const normalized = normalizarCodigo(value);
      if (!normalized) throw new Error('Escanea o escribe un código.');
      setError(''); setPaused(true); setCode(''); onScan(normalized);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Revisa el código.'); }
  };
  return <div className={cn('space-y-3 rounded-lg border border-border bg-card p-3', className)}>
    <div className="flex flex-wrap gap-2 border-b border-border pb-3">
      <Button type="button" variant="outline" aria-pressed={mode === 'camara'} onClick={() => { setMode('camara'); setPaused(false); }} className={cn('min-h-11 md:min-h-9', mode === 'camara' && 'bg-primary-soft text-primary')}>
        <Camera className="mr-2 h-4 w-4" /> Cámara en vivo
      </Button>
      <Button type="button" variant="outline" aria-pressed={mode === 'manual'} onClick={() => setMode('manual')} className={cn('min-h-11 md:min-h-9', mode === 'manual' && 'bg-primary-soft text-primary')}>
        <Keyboard className="mr-2 h-4 w-4" /> Ingreso manual / Lector
      </Button>
    </div>
    {mode === 'camara' && isScanning && !paused && <CameraPreview onRead={read} onCancel={() => setPaused(true)} />}
    {mode === 'camara' && paused && <Button type="button" variant="outline" disabled={!isScanning} onClick={() => setPaused(false)}>Escanear otro código</Button>}
    {mode === 'manual' && <div className="space-y-2">
      <Label htmlFor="lector-manual">Código de barras / QR</Label>
      <div className="flex gap-2">
        <Input id="lector-manual" autoFocus value={code} disabled={!isScanning} className="font-mono text-base md:text-sm"
          aria-invalid={Boolean(error)} aria-describedby="lector-manual-error"
          onFocus={event => event.currentTarget.select()} onChange={event => { setCode(event.target.value); setError(''); }}
          onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); read(code); } }} />
        <Button type="button" variant="outline" disabled={!isScanning} onClick={() => read(code)}><Search className="mr-2 h-4 w-4" /> Consultar</Button>
      </div>
      <p className="text-xs text-muted-foreground">Escribe el código o usa el lector físico en este campo y presiona Enter.</p>
    </div>}
    {error && <p id="lector-manual-error" role="alert" className="text-sm text-danger-text">{error}</p>}
  </div>;
}
