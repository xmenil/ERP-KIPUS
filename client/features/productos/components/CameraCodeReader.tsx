import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarcodeCameraScanner } from './BarcodeCameraScanner';
import { cn } from '@/lib/utils';

interface Props { onRead: (code: string) => void; disabled?: boolean; className?: string }

export function CameraCodeReader({ onRead, disabled, className }: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  return <div className="space-y-1">
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      className={cn("h-8 px-2.5 text-xs font-medium cursor-pointer shrink-0 gap-1.5", className)}
      onClick={() => setOpen(value => !value)}
    >
      <Camera className="h-3.5 w-3.5" strokeWidth={1.75} />
      <span>{open ? 'Cerrar cámara' : 'Cámara'}</span>
    </Button>
    {open && !disabled && <BarcodeCameraScanner onScan={code => { setOpen(false); onRead(code); }} />}
  </div>;
}
