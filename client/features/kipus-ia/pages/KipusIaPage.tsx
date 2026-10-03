import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { kipusIaService } from '../services/kipusIaService';
import { ChatMessage, InsightPredictivo } from '../types/kipus-ia.types';
import {
  Sparkles,
  Bot,
  Send,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  PackageSearch,
} from 'lucide-react';

export const KipusIaPage: React.FC = () => {
  const [insights, setInsights] = useState<InsightPredictivo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content:
        '¡Hola! Soy KIPU\'S IA, tu asistente de gestión empresarial. Tengo acceso a tus datos de ventas, almacén, caja y compras para responder cualquier duda de tu negocio.',
      timestamp: 'Ahora',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    kipusIaService.getInsights().then(setInsights);
  }, []);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await kipusIaService.responderConsulta(query);
      setMessages((prev) => [...prev, response]);
    } finally {
      setIsTyping(false);
    }
  };

  const sugerenciasRapidas = [
    '¿Qué productos debo reabastecer hoy?',
    '¿Cuál es el saldo y balance de mi caja?',
    '¿Cuál es el producto más vendido del mes?',
    '¿Qué clientes tienen saldos por cobrar?',
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="KIPU'S IA — Copiloto de Inteligencia de Negocio"
        description="Analítica predictiva, optimización de compras y asesoría en tiempo real para tu PYME"
        badge="Copilot Activo"
      />

      {/* Insights Predictivos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((ins) => (
          <Card key={ins.id} className="border-border/80 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {ins.tipo === 'STOCK' ? (
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                ) : ins.tipo === 'FINANZAS' ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <UserCheck className="h-4 w-4 text-blue-500" />
                )}
                <CardTitle className="text-xs font-bold text-foreground">{ins.titulo}</CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground pt-1">
                {ins.descripcion}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/15 text-[11px] text-foreground">
                <span className="font-semibold text-primary block">Sugerencia KIPU'S:</span>
                {ins.accionSugerida}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chat Interactivo */}
      <Card className="border-border/80 flex flex-col h-[520px]">
        <CardHeader className="border-b border-border/60 py-3 px-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Consultas en Lenguaje Natural</CardTitle>
              <CardDescription className="text-xs">
                Pregunta sobre cualquier aspecto operativo, financiero o de inventario
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Mensajes del chat */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => {
            const isMe = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-md rounded-xl p-3.5 text-[13px] leading-relaxed shadow-2xs ${
                    isMe
                      ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                      : 'bg-card border border-border text-foreground rounded-tl-none'
                  }`}
                >
                  <p>{m.content}</p>

                  {m.dataPoints && (
                    <div className="mt-2.5 pt-2 border-t border-border/60 space-y-1.5">
                      {m.dataPoints.map((dp, i) => (
                        <div key={i} className="flex justify-between font-semibold text-xs">
                          <span className="text-muted-foreground">{dp.label}:</span>
                          <span className="text-primary font-mono font-bold">{dp.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <span
                    className={`block text-[10px] mt-2 font-mono ${
                      isMe ? 'text-primary-foreground/75 text-right' : 'text-muted-foreground'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <Bot className="h-4 w-4 animate-spin text-primary" />
              <span>Analizando datos contables y operacionales de la empresa...</span>
            </div>
          )}
        </CardContent>

        {/* Sugerencias Rápidas y Caja de Input */}
        <div className="p-3 border-t border-border/60 space-y-2.5 bg-muted/20">
          <div className="flex flex-wrap gap-1.5">
            {sugerenciasRapidas.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                className="text-xs px-3 py-1 rounded-full bg-card border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-foreground font-medium transition-colors shadow-2xs"
              >
                {sug}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe tu consulta sobre stock, caja, ventas o clientes..."
              className="h-9 text-[13px] bg-card"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isTyping || !inputText.trim()}
              className="gap-1.5 bg-primary text-primary-foreground font-semibold px-4"
            >
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preguntar</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default KipusIaPage;
