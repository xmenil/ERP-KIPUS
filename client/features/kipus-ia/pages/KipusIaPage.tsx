import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { kipusIaService } from '../services/kipusIaService';
import { ChatMessage, InsightPredictivo, ChatAction } from '../types/kipus-ia.types';
import { toast } from 'sonner';
import {
  Sparkles,
  Bot,
  Send,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  RotateCcw,
  Copy,
  Check,
  ArrowRight,
  Mic,
  MicOff,
  Coins,
  Package,
  ShoppingCart,
  Users,
  LineChart,
} from 'lucide-react';

export interface KipusIaPageProps {
  embedded?: boolean;
}

export const KipusIaPage: React.FC<KipusIaPageProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [insights, setInsights] = useState<InsightPredictivo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content:
        '¡Hola! Soy KIPU\'S IA, tu asistente de gestión empresarial conectado en tiempo real a tus módulos de caja, almacén, ventas y clientes. ¿En qué puedo orientarte hoy?',
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
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    kipusIaService.getInsights().then(setInsights);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setTypingStep('Consultando base de datos de caja y almacén...');

    const timer = setTimeout(() => {
      setTypingStep('Generando diagnóstico y recomendaciones...');
    }, 280);

    try {
      const response = await kipusIaService.responderConsulta(query);
      setMessages((prev) => [...prev, response]);
    } catch {
      toast.error('No se pudo procesar la consulta');
    } finally {
      clearTimeout(timer);
      setIsTyping(false);
    }
  };

  const handleActionClick = (action: ChatAction) => {
    if (action.path) {
      navigate(action.path);
    } else if (action.query) {
      handleSend(action.query);
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Respuesta copiada al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        content:
          'Conversación reiniciada. Estoy listo para ayudarte con tu caja, stock, comprobantes o clientes.',
        timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        statusNote: 'Base de datos operativa',
        actions: [
          { label: 'Saldo y Cuadre de Caja', query: '¿Cuál es el saldo y cuadre de mi caja?' },
          { label: 'Stock Crítico', query: '¿Qué productos debo reabastecer hoy?' },
          { label: 'Diagnóstico 360°', query: 'Dame un diagnóstico general del negocio' },
        ],
      },
    ]);
    toast.info('Chat reiniciado');
  };

  const handleVoiceSimulation = () => {
    if (isListening) return;
    setIsListening(true);
    toast.info('Escuchando consulta de voz...');

    setTimeout(() => {
      const simulatedVoices = [
        '¿Cuál es el saldo y cuadre de mi caja?',
        '¿Qué productos debo reabastecer hoy?',
        '¿Cuánto hemos vendido hoy y por qué medios?',
        'Dame un diagnóstico general del negocio',
      ];
      const randomQuery = simulatedVoices[Math.floor(Math.random() * simulatedVoices.length)];
      setInputText(randomQuery);
      setIsListening(false);
      handleSend(randomQuery);
    }, 1500);
  };

  const sugerenciasRapidas = [
    { label: 'Cuadre de caja', query: '¿Cuál es el saldo y cuadre de mi caja?', icon: Coins },
    { label: 'Stock crítico', query: '¿Qué productos debo reabastecer hoy?', icon: Package },
    { label: 'Ventas de hoy', query: '¿Cuánto hemos vendido hoy?', icon: ShoppingCart },
    { label: 'Clientes con deuda', query: '¿Qué clientes tienen saldos por cobrar?', icon: Users },
    { label: 'Producto más vendido', query: '¿Cuál es el producto más vendido?', icon: TrendingUp },
    { label: 'Diagnóstico 360°', query: 'Dame un diagnóstico general del negocio', icon: LineChart },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeader
            title="KIPU'S IA — Copiloto de Inteligencia de Negocio"
            description="Analítica predictiva, optimización de compras y asesoría en tiempo real para tu PYME"
            badge="Copilot Activo • Datos en tiempo real"
          />

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSend('Dame un diagnóstico general del negocio')}
              className="h-8 text-xs font-medium gap-1.5 border-border"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Simular diagnóstico rápido</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              title="Reiniciar chat"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Limpiar chat</span>
            </Button>
          </div>
        </div>
      )}

      {/* Tarjetas de Insights Predictivos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((ins) => (
          <Card
            key={ins.id}
            className="border-border/80 flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => ins.querySugerida && handleSend(ins.querySugerida)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {ins.tipo === 'STOCK' ? (
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                  ) : ins.tipo === 'FINANZAS' ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <UserCheck className="h-4 w-4 text-blue-500 shrink-0" />
                  )}
                  <CardTitle className="text-xs font-semibold text-foreground">
                    {ins.titulo}
                  </CardTitle>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {ins.tipo}
                </span>
              </div>
              <CardDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
                {ins.descripcion}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-2.5 rounded-md bg-primary-soft border border-primary/20 text-xs text-foreground flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-semibold text-primary block text-[11px]">Sugerencia KIPU'S:</span>
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {ins.accionSugerida}
                  </span>
                </div>
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Sparkles className="h-3 w-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chat Interactivo */}
      <Card className="border-border/80 flex flex-col h-[560px] shadow-xs overflow-hidden bg-card">
        {/* Cabecera del chat */}
        <CardHeader className="border-b border-border/60 py-3 px-4 shrink-0 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Consultas en Lenguaje Natural
                  </CardTitle>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-success-soft text-success-text border border-success/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    Motor en línea
                  </span>
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  Pregunta sobre dinero en caja, cuadre diario, stock, comprobantes o cuentas por cobrar
                </CardDescription>
              </div>
            </div>

            <span className="text-[11px] text-muted-foreground hidden sm:inline-flex items-center gap-1 font-mono">
              KIPU'S IA v2.4
            </span>
          </div>
        </CardHeader>

        {/* Mensajes del chat con scroll */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isMe = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-lg p-3.5 text-xs sm:text-[13px] leading-relaxed shadow-2xs ${
                    isMe
                      ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                      : 'bg-card border border-border text-foreground rounded-tl-none space-y-3'
                  }`}
                >
                  {/* Contenido del texto formateado */}
                  <div className="whitespace-pre-line text-xs sm:text-[13px]">
                    {m.content}
                  </div>

                  {/* Datos analíticos (Data Points) */}
                  {m.dataPoints && m.dataPoints.length > 0 && (
                    <div className="pt-2 border-t border-border/70 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.dataPoints.map((dp, i) => (
                        <div
                          key={i}
                          className="p-2 rounded bg-muted/40 border border-border flex items-center justify-between text-xs"
                        >
                          <span className="text-muted-foreground text-[11px] font-medium truncate mr-2">
                            {dp.label}
                          </span>
                          <span className="text-foreground font-mono font-semibold tabular-nums text-xs shrink-0">
                            {dp.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botones de acción directa */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {m.actions.map((act, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant={act.variant === 'primary' ? 'default' : 'outline'}
                          onClick={() => handleActionClick(act)}
                          className={`h-7 px-2.5 text-[11px] gap-1 rounded font-medium ${
                            act.variant === 'primary'
                              ? 'bg-primary text-primary-foreground'
                              : 'border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Pie de mensaje con metadatos y botón de copiar */}
                  <div
                    className={`flex items-center justify-between pt-1 text-[10px] ${
                      isMe ? 'text-primary-foreground/75' : 'text-muted-foreground border-t border-border/40'
                    }`}
                  >
                    <span>{m.statusNote || m.timestamp}</span>

                    {!isMe && (
                      <button
                        onClick={() => handleCopyMessage(m.content, m.id)}
                        className="inline-flex items-center gap-1 hover:text-foreground transition-colors p-0.5 rounded"
                        title="Copiar respuesta"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="h-3 w-3 text-success" />
                            <span className="text-success">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium p-2">
              <Bot className="h-4 w-4 animate-spin text-primary" />
              <span className="animate-pulse">{typingStep}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Sugerencias Rápidas y Caja de Input */}
        <div className="p-3 border-t border-border/60 space-y-2.5 bg-muted/20 shrink-0">
          {/* Pills de preguntas frecuentes */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] text-muted-foreground font-medium shrink-0 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              Consultas:
            </span>
            {sugerenciasRapidas.map((sug, i) => {
              const IconComp = sug.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSend(sug.query)}
                  disabled={isTyping}
                  className="text-xs px-2.5 py-1 rounded-md bg-card border border-border hover:bg-primary-soft hover:text-primary hover:border-primary/40 text-foreground font-medium transition-colors shrink-0 flex items-center gap-1 shadow-2xs disabled:opacity-50"
                >
                  <IconComp className="h-3 w-3 text-muted-foreground" />
                  <span>{sug.label}</span>
                </button>
              );
            })}
          </div>

          {/* Formulario de texto */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe tu consulta sobre caja, stock, ventas o clientes..."
                className="h-9 text-xs sm:text-[13px] bg-card pr-9 border-border"
                disabled={isTyping || isListening}
              />
              <button
                type="button"
                onClick={handleVoiceSimulation}
                disabled={isTyping || isListening}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors ${
                  isListening ? 'text-primary animate-pulse' : ''
                }`}
                title="Simular consulta de voz"
              >
                {isListening ? (
                  <Mic className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={isTyping || isListening || !inputText.trim()}
              className="gap-1.5 bg-primary text-primary-foreground font-semibold px-4 h-9 text-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Preguntar</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default KipusIaPage;
