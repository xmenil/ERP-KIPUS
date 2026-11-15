import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { kipusIaService } from '@/features/kipus-ia/services/kipusIaService';
import { ChatMessage, InsightPredictivo } from '@/features/kipus-ia/types/kipus-ia.types';
import { toast } from 'sonner';
import {
  Sparkles,
  Bot,
  Send,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  ArrowRight,
  Package,
  ShoppingCart,
  Users,
  LineChart,
  DollarSign,
} from 'lucide-react';

export interface KipusIaAssistantViewProps {
  embedded?: boolean;
}

export const KipusIaAssistantView: React.FC<KipusIaAssistantViewProps> = ({
  embedded = false,
}) => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [insights, setInsights] = useState<InsightPredictivo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content:
        '¡Hola! Soy KIPU\'S IA, tu copiloto inteligente de gestión conectado en tiempo real a tus módulos de caja, existencias, ventas y clientes. ¿En qué puedo orientarte hoy?',
      timestamp: 'Ahora',
      statusNote: 'Conectado a la base de datos de tu negocio',
      actions: [
        { label: 'Saldo y Cuadre de Caja', query: '¿Cuál es el saldo y cuadre de mi caja?' },
        { label: 'Stock por Reabastecer', query: '¿Qué productos debo reabastecer hoy?' },
        { label: 'Ventas del Día', query: '¿Cuánto hemos vendido hoy?' },
        { label: 'Diagnóstico 360°', query: 'Dame un diagnóstico general del negocio' },
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingStep, setTypingStep] = useState('Analizando datos...');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    kipusIaService.getInsights().then(setInsights);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setTypingStep('Consultando estado del negocio...');

    try {
      setTimeout(() => setTypingStep('Correlacionando ventas, stock y caja...'), 600);
      const iaResponse = await kipusIaService.responderConsulta(query);
      setMessages((prev) => [...prev, iaResponse]);
    } catch {
      toast.error('No se pudo conectar con el motor analítico de KIPU\'S IA.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Respuesta copiada');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {!embedded ? (
        <PageHeader
          title="KIPU'S IA — Copiloto Inteligente"
          description="Predicciones de reposición, detección de quiebres de mostrador y análisis financiero en lenguaje natural"
          badge="IA Analítica en Tiempo Real"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMessages([messages[0]]);
              toast.info('Conversación reiniciada');
            }}
            className="h-9 text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reiniciar chat</span>
          </Button>
        </PageHeader>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/70">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>KIPU'S IA — Asistente Predictivo y Consultas</span>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Diagnósticos en tiempo real, recomendaciones de reposición y análisis en lenguaje natural.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMessages([messages[0]]);
              toast.info('Conversación reiniciada');
            }}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reiniciar chat</span>
          </Button>
        </div>
      )}

      {/* 1. Tarjetas de Insights Accionables */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {insights.map((ins) => (
            <Card
              key={ins.id}
              className="border border-border/80 shadow-2xs hover:border-primary/50 transition-all bg-card"
            >
              <CardContent className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {ins.tipo === 'STOCK' ? (
                      <Package className="h-4 w-4 text-amber-600" />
                    ) : ins.tipo === 'FINANZAS' ? (
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-xs font-bold text-foreground">{ins.titulo}</span>
                  </div>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-muted text-muted-foreground uppercase">
                    {ins.tipo}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {ins.descripcion}
                </p>
                <button
                  type="button"
                  onClick={() => handleSend(ins.querySugerida || ins.titulo)}
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold cursor-pointer pt-1"
                >
                  <span>{ins.accionSugerida}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 2. Chat Interactivo en Vivo */}
      <Card className="border border-border/80 shadow-xs bg-card overflow-hidden">
        <CardContent className="p-0 flex flex-col h-[480px]">
          {/* Mensajes del Chat */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-3.5 space-y-2 text-xs ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                      : 'bg-muted/50 border border-border/70 text-foreground rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>

                  {/* Acciones sugeridas con 1-clic */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                      {msg.actions.map((act, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(act.query)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-card border border-border text-foreground hover:bg-primary-soft hover:text-primary hover:border-primary/40 transition-colors shadow-2xs"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] opacity-70 pt-1">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:opacity-100 flex items-center gap-1 cursor-pointer"
                        title="Copiar texto"
                      >
                        {copiedId === msg.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>Copiar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 animate-spin" />
                </div>
                <div className="bg-muted/50 border border-border/70 rounded-xl p-3 text-xs text-muted-foreground flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>{typingStep}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Barra Inferior de Entrada */}
          <div className="p-3 bg-muted/30 border-t border-border flex items-center gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Pregunta a KIPU'S IA (ej. ¿Qué productos están por agotarse?)..."
              className="h-10 text-xs bg-card border-border"
              disabled={isTyping}
            />
            <Button
              onClick={() => handleSend()}
              disabled={isTyping || !inputText.trim()}
              className="h-10 px-4 bg-primary text-primary-foreground font-semibold text-xs gap-1.5 shadow-xs shrink-0"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Consultar</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
