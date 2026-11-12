/**
 * Servicio de retroalimentación sonora para operaciones en el Punto de Venta (POS).
 * Utiliza Web Audio API nativo para reproducir tonos sintetizados sin dependencias de archivos externos (.mp3/.wav).
 */

class AudioFeedbackService {
  private audioCtx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('kipus_pos_sound_muted');
      this.muted = storedMute === 'true';
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Consulta si los sonidos están silenciados
   */
  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Activa o desactiva los sonidos del POS
   */
  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('kipus_pos_sound_muted', String(muted));
    }
  }

  /**
   * Beep agudo corto (1200 Hz): Escaneo exitoso de producto o agregado al carrito
   */
  public playSuccessBeep(): void {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // AudioContext fallback silencioso
    }
  }

  /**
   * Beep grave descendente (380 Hz -> 220 Hz): Código no encontrado o stock agotado
   */
  public playErrorBeep(): void {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.22);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Fallback
    }
  }

  /**
   * Acorde armónico ascendente (C5 - E5 - G5): Venta cobrada con éxito y gaveta abierta
   */
  public playCashChime(): void {
    if (this.muted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const frequencies = [523.25, 659.25, 783.99]; // Acorde Do Mayor (C5 - E5 - G5)
      const now = ctx.currentTime;

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.2, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.35);
      });
    } catch {
      // Fallback
    }
  }
}

export const audioFeedbackService = new AudioFeedbackService();

