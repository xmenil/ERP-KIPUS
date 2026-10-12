import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseVoiceSearchOptions {
  onTranscript?: (texto: string, esFinal: boolean) => void;
  lang?: string;
}

// Tipos para Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
  }
}

/**
 * Emite un tono sutil al abrir y cerrar el micrófono usando Web Audio API
 */
function reproducirTonoMicrofono(tipo: 'inicio' | 'fin') {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const frecInicial = tipo === 'inicio' ? 680 : 880;
    const frecFinal = tipo === 'inicio' ? 1050 : 440;

    osc.frequency.setValueAtTime(frecInicial, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frecFinal, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch {
    // Si el navegador bloquea audio antes de interacción, continuar
  }
}

export function useVoiceSearch({ onTranscript, lang = 'es-PE' }: UseVoiceSearchOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const hasSpeech =
      typeof window !== 'undefined' &&
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    setIsSupported(hasSpeech);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignorar si ya estaba detenido
      }
    }
    setIsListening(false);
    reproducirTonoMicrofono('fin');
  }, []);

  const startListening = useCallback(async () => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      // Fallback: verificar acceso a micrófono vía getUserMedia
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          toast.info(
            'Micrófono activo. Tu navegador no soporta reconocimiento de voz nativo (Web Speech API). Usa Chrome o Edge para dictado automático.'
          );
        } else {
          toast.error('Este navegador no tiene soporte de micrófono.');
        }
      } catch {
        toast.error('Permiso de micrófono denegado en el navegador.');
      }
      return;
    }

    try {
      // Solicitar acceso a micrófono primero para asegurar permisos en Chrome
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
        } catch {
          toast.error('No se pudo acceder al micrófono. Verifica los permisos de tu navegador.');
          return;
        }
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignorar
        }
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        reproducirTonoMicrofono('inicio');
        toast.info('Micrófono activado. Di el nombre del producto...');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let textoCompleto = '';
        let esFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          textoCompleto += res[0].transcript;
          if (res.isFinal) {
            esFinal = true;
          }
        }

        const textoLimpio = textoCompleto.trim();
        setTranscript(textoLimpio);
        if (onTranscript) {
          onTranscript(textoLimpio, esFinal);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Permiso de micrófono denegado. Permite el acceso en la barra del navegador.');
        } else if (event.error === 'no-speech') {
          toast('No se escuchó ninguna voz. Intenta hablar más cerca del micrófono.');
        } else if (event.error !== 'aborted') {
          toast.error(`Error de reconocimiento de voz: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      setIsListening(false);
      toast.error('No se pudo iniciar el micrófono.');
    }
  }, [lang, onTranscript]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
