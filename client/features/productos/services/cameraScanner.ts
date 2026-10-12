export interface DecoderControls { stop: () => void }
export interface CameraDecoder {
  decodeFromStream: (stream: MediaStream, video: HTMLVideoElement,
    callback: (result: { getText: () => string } | undefined, error?: unknown) => void) => Promise<DecoderControls>;
}

// Own the stream explicitly so cancellation also works while permission or playback is pending.
export class CameraScanner {
  private stopped = false;
  private delivered = false;
  private stream?: MediaStream;
  private controls?: DecoderControls;

  stop() {
    this.stopped = true;
    const controls = this.controls;
    const stream = this.stream;
    this.controls = undefined;
    this.stream = undefined;
    try { controls?.stop(); }
    finally { stream?.getTracks().forEach(track => track.stop()); }
  }

  async start(video: HTMLVideoElement, decoder: CameraDecoder,
    acquire: () => Promise<MediaStream>, onRead: (code: string) => void,
    onError?: (error: unknown) => void) {
    if (this.stopped) return;
    const stream = await acquire();
    this.stream = stream;
    if (this.stopped) { this.stop(); return; }
    try {
      const controls = await decoder.decodeFromStream(stream, video, (result, error) => {
        if (this.stopped || this.delivered) return;
        if (error) {
          const kind = typeof (error as { getKind?: unknown }).getKind === 'function'
            ? (error as { getKind: () => string }).getKind() : '';
          if (['NotFoundException', 'ChecksumException', 'FormatException'].includes(kind)) return;
          this.stop();
          onError?.(error);
          return;
        }
        if (!result || this.stopped || this.delivered) return;
        this.delivered = true;
        const code = result.getText();
        this.stop();
        onRead(code);
      });
      if (this.stopped) controls.stop();
      else this.controls = controls;
    } catch (error) {
      this.stop();
      throw error;
    }
  }
}

export function mensajeErrorCamara(error: unknown): string {
  const name = error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'No se permitió usar la cámara. Habilita el permiso en tu navegador y vuelve a intentar.';
  if (name === 'NotFoundError') return 'No se encontró una cámara. Conecta una webcam o utiliza otro dispositivo.';
  if (name === 'NotReadableError' || name === 'AbortError') return 'No se pudo abrir la cámara. Cierra otras aplicaciones que la estén usando y vuelve a intentar.';
  if (name === 'OverconstrainedError') return 'Esta cámara no está disponible. Selecciona otra y vuelve a intentar.';
  return 'No se pudo iniciar la lectura. Reintenta o escribe el código manualmente.';
}
