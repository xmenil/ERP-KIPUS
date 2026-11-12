import { useEffect, useRef } from 'react';
import { audioFeedbackService } from '../services/audioFeedbackService';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minBarcodeLength?: number;
  maxKeystrokeInterval?: number; // ms entre caracteres (típico escáner: 10-35ms)
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  minBarcodeLength = 3,
  maxKeystrokeInterval = 50,
  enabled = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar teclas modificadoras solitarias
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return;
      }

      const now = performance.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Si pasa demasiado tiempo entre caracteres, reiniciar el buffer
      if (timeDiff > maxKeystrokeInterval) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const barcode = bufferRef.current.trim();
        if (barcode.length >= minBarcodeLength) {
          // Detectado escaneo de código de barras por hardware
          e.preventDefault();
          e.stopPropagation();
          onScanRef.current(barcode);
          bufferRef.current = '';
        }
        return;
      }

      // Acumular caracteres alfanuméricos y símbolos comunes de códigos de barras
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, minBarcodeLength, maxKeystrokeInterval]);
}

