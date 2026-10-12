import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarcodeCameraScanner } from './BarcodeCameraScanner';

interface Props { onRead: (code: string) => void; disabled?: boolean }

export function CameraCodeReader({ onRead, disabled }: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  return <div className="space-y-2">
    <Button type="button" variant="outline" disabled={disabled} className="min-h-11 md:min-h-9" onClick={() => setOpen(value => !value)}>
      <Camera className="mr-2 h-4 w-4" strokeWidth={1.75} /> {open ? 'Cerrar lector' : 'Leer con cámara'}
    </Button>
    {open && !disabled && <BarcodeCameraScanner onScan={code => { setOpen(false); onRead(code); }} />}
  </div>;
}
