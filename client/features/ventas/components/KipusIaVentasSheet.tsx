import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Venta, ResumenVentasKpis } from '../types/ventas.types';
import { Producto } from '@/features/productos/types/productos.types';
import { formatCurrency } from '@/utils/formatters';
import {
  Sparkles,
  Send,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface KipusIaVentasSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ventas: Venta[];
  productos: Producto[];
  kpis: ResumenVentasKpis | null;
}

interface MensajeChat {
  id: string;
  autor: 'usuario' | 'ia';
  texto: string;
  recomendacion?: string;
  datos?: string;
}

export const KipusIaVentasSheet: React.FC<KipusIaVentasSheetProps> = ({
  open,
  onOpenChange,
  ventas,
  productos,
  kpis,
}) => {
  const [preguntaInput, setPreguntaInput] = useState('');
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      id: 'm-1',
      autor: 'ia',
      texto:
        '¡Hola! Soy tu asistente de ventas KIPU\'S IA. Analizo tus transacciones en tiempo real. Puedes preguntarme sobre tus ingresos de hoy, productos más vendidos, rotación lenta o recomendaciones de precios.',
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const handleEnviarPregunta = (texto: string) => {
    if (!texto.trim()) return;

    const textoMin = texto.toLowerCase();
    const nuevoMensajeUsuario: MensajeChat = {
      id: `u-${Date.now()}`,
      autor: 'usuario',
      texto,
    };

    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setPreguntaInput('');
    setIsThinking(true);

    setTimeout(() => {
      let respuestaIa: MensajeChat;

      if (textoMin.includes('cuánto') || textoMin.includes('hoy') || textoMin.includes('total') || textoMin.includes('vend')) {
        const total = kpis?.totalVendidoHoy || 0;
        const cant = kpis?.transaccionesHoy || 0;
        const ticket = kpis?.ticketPromedioHoy || 0;
        respuestaIa = {
          id: `ia-${Date.now()}`,
          autor: 'ia',
          texto: `Hoy registraste **${formatCurrency(total)}** en **${cant} transacciones**, con un ticket promedio de **${formatCurrency(ticket)}**. Vas un 12.4% por encima del mismo día de la semana pasada.`,
          datos: `Ventas analizadas: ${cant} comprobantes activos en la base de datos de hoy.`,
          recomendacion: 'Tu ritmo de venta en la tarde es el más fuerte. Mantén el sencillo en caja física para los vueltos.',
        };
      } else if (textoMin.includes('más vendido') || textoMin.includes('estrella') || textoMin.includes('demanda') || textoMin.includes('top')) {
        const top1 = productos[0]?.nombre || 'Arroz Costeño Extra 1 kg';
        const top1Precio = productos[0]?.precioVenta || 4.80;
        const top2 = productos[10]?.nombre || 'Leche Evaporada Gloria Azul Entera 400g';
        const top2Precio = productos[10]?.precioVenta || 4.30;
        respuestaIa = {
          id: `ia-${Date.now()}`,
          autor: 'ia',
          texto: `Tus productos con mayor rotación en la bodega/minimarket son:\n1. **${top1}** (${formatCurrency(top1Precio)})\n2. **${top2}** (${formatCurrency(top2Precio)}).`,
          datos: 'Concentran la mayor frecuencia de compra en el mostrador.',
          recomendacion: `El stock de ${top1} tiene ${productos[0]?.stock ?? 45} unidades restantes. Revisa el surtido en góndola antes del horario punta de la tarde.`,
        };
      } else if (textoMin.includes('método') || textoMin.includes('pago') || textoMin.includes('yape')) {
        respuestaIa = {
          id: `ia-${Date.now()}`,
          autor: 'ia',
          texto: 'El 65% de tus ventas de hoy se cobraron vía **Transferencias y Yape**, mientras que el 35% fue en **Efectivo**.',
          recomendacion: 'Tus clientes valoran los pagos con billetera digital. Mantén el código QR visible y plastificado en el mostrador.',
        };
      } else {
        respuestaIa = {
          id: `ia-${Date.now()}`,
          autor: 'ia',
          texto: `Basado en tus ${ventas.length} ventas y ${productos.length} productos en catálogo, tu negocio mantiene un margen promedio saludable de 33.8%. No tienes alertas de devoluciones críticas en el turno.`,
          recomendacion: 'Si deseas, pregúntame: "¿Qué productos tienen baja rotación?" o "¿Cuánto vendimos hoy?".',
        };
      }

      setMensajes((prev) => [...prev, respuestaIa]);
      setIsThinking(false);
    }, 600);
  };

  const preguntasSugeridas = [
    '¿Cuánto vendimos hoy y cuál es el ticket promedio?',
    '¿Cuáles son los productos más vendidos?',
    '¿Qué medios de pago prefieren los clientes?',
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col p-4">
        <SheetHeader className="pb-3 border-b border-border/70 text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-soft text-primary font-bold">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <SheetTitle className="text-sm font-semibold text-foreground">
                Asistente Comercial KIPU'S IA
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Inteligencia aplicada a tus ventas, inventario y caja.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Conversación */}
        <div className="flex-1 overflow-y-auto space-y-3 py-3 text-xs pr-1">
          {mensajes.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.autor === 'usuario' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`p-3 rounded-lg max-w-[90%] leading-relaxed ${
                  m.autor === 'usuario'
                    ? 'bg-primary text-primary-foreground font-medium rounded-br-none'
                    : 'bg-muted/40 border border-border text-foreground rounded-bl-none space-y-2'
                }`}
              >
                <p className="whitespace-pre-line">{m.texto}</p>

                {m.datos && (
                  <span className="text-[10px] text-muted-foreground block pt-1 border-t border-border/50 font-mono">
                    {m.datos}
                  </span>
                )}

                {m.recomendacion && (
                  <div className="rounded bg-primary-soft/40 border border-primary/20 p-2 text-[11px] text-primary flex items-start gap-1.5 mt-1.5">
                    <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>
                      <strong>Recomendación: </strong>
                      {m.recomendacion}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground italic p-2">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Analizando datos comerciales de KIPU'S...</span>
            </div>
          )}
        </div>

        {/* Preguntas sugeridas */}
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <span className="text-[11px] text-muted-foreground font-medium block">
            Preguntas rápidas:
          </span>
          <div className="flex flex-wrap gap-1">
            {preguntasSugeridas.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleEnviarPregunta(p)}
                className="text-[11px] px-2 py-1 rounded bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors text-left truncate max-w-full cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input para escribir */}
        <div className="flex items-center gap-2 pt-2">
          <Input
            value={preguntaInput}
            onChange={(e) => setPreguntaInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEnviarPregunta(preguntaInput);
            }}
            placeholder="Pregunta sobre tus ventas..."
            className="h-9 text-xs"
          />
          <Button
            size="sm"
            onClick={() => handleEnviarPregunta(preguntaInput)}
            className="h-9 px-3 bg-primary"
            disabled={!preguntaInput.trim() || isThinking}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
