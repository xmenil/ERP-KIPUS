import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EstadoCaja, CierreCaja, MovimientoCaja } from '../types/caja.types';
import { formatCurrency } from '@/utils/formatters';
import {
  Sparkles,
  Bot,
  Send,
  Coins,
  TrendingUp,
  AlertTriangle,
  ArrowDownCircle,
  HelpCircle,
  CornerDownRight,
} from 'lucide-react';

interface KipusIACajaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estadoCaja: EstadoCaja;
  movimientos: MovimientoCaja[];
  cierres: CierreCaja[];
}

interface MensajeChat {
  id: string;
  autor: 'IA' | 'USUARIO';
  texto: string;
  hora: string;
}

export const KipusIACajaDialog: React.FC<KipusIACajaDialogProps> = ({
  open,
  onOpenChange,
  estadoCaja,
  movimientos,
  cierres,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      id: 'm-1',
      autor: 'IA',
      texto:
        '¡Hola! Soy KIPU’S IA. Puedo responder tus preguntas operativas sobre dinero en gaveta, ventas en efectivo, cobros digitales y diferencias de caja. Elige una consulta rápida o escribe tu duda.',
      hora: 'Ahora',
    },
  ]);

  const PREGUNTAS_RAPIDAS = [
    '¿Cuánto dinero entró hoy?',
    '¿Cuánto se vendió en efectivo?',
    '¿Hubo diferencias en las cajas?',
    '¿Cuál fue el total de egresos de hoy?',
  ];

  const resolverRespuesta = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('entró') || q.includes('ingreso') || q.includes('total')) {
      const totalIngresado =
        estadoCaja.ventasEfectivo +
        estadoCaja.otrosIngresosEfectivo +
        estadoCaja.totalVentasDigitales;
      return `Hoy han ingresado en total ${formatCurrency(
        totalIngresado
      )} sumando efectivo y medios digitales. En efectivo ingresaron ${formatCurrency(
        estadoCaja.ventasEfectivo + estadoCaja.otrosIngresosEfectivo
      )} (${formatCurrency(estadoCaja.ventasEfectivo)} por ventas y ${formatCurrency(
        estadoCaja.otrosIngresosEfectivo
      )} por aportes manuales). En billeteras digitales y tarjetas entraron ${formatCurrency(
        estadoCaja.totalVentasDigitales
      )}.`;
    }

    if (q.includes('efectivo') || q.includes('vendió')) {
      return `Se han registrado ${formatCurrency(
        estadoCaja.ventasEfectivo
      )} en ventas cobradas en efectivo físico en tu caja durante el turno activo. El saldo actual total en gaveta sumando el sencillo de apertura es de ${formatCurrency(
        estadoCaja.saldoEfectivoEsperado
      )}.`;
    }

    if (q.includes('diferencia') || q.includes('cuadre') || q.includes('arqueo')) {
      const cierresConDiferencia = cierres.filter((c) => Math.abs(c.diferencia) >= 0.05);
      if (cierresConDiferencia.length === 0) {
        return 'Excelente noticia: Todos los cierres registrados en el historial se encuentran completamente cuadrados con diferencia de S/ 0.00.';
      }
      return `En el historial se registran ${cierresConDiferencia.length} cierre(s) con diferencia. El más reciente registró una diferencia de ${formatCurrency(
        cierresConDiferencia[0].diferencia
      )} en la caja ${cierresConDiferencia[0].cajaNombre} el ${cierresConDiferencia[0].fechaCierre}.`;
    }

    if (q.includes('egreso') || q.includes('gasto') || q.includes('salida')) {
      return `El total de egresos registrados en efectivo desde la caja hoy asciende a ${formatCurrency(
        estadoCaja.egresosEfectivo
      )}. Se componen de compras menores y gastos operativos de tienda.`;
    }

    return `Tu caja '${estadoCaja.nombre}' está ABIERTA con un saldo esperado en efectivo de ${formatCurrency(
      estadoCaja.saldoEfectivoEsperado
    )}, habiendo iniciado con ${formatCurrency(
      estadoCaja.saldoInicial
    )}. Tienes registradas ${movimientos.length} operaciones en este turno.`;
  };

  const handleEnviar = (consulta?: string) => {
    const texto = consulta || inputQuery;
    if (!texto.trim()) return;

    const ahora = new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const respuesta = resolverRespuesta(texto);

    setMensajes((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, autor: 'USUARIO', texto, hora: ahora },
      { id: `ia-${Date.now()}`, autor: 'IA', texto: respuesta, hora: ahora },
    ]);

    setInputQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Cabecera */}
        <DialogHeader className="p-4 border-b border-border/60 bg-muted/20 flex flex-row items-center gap-3 space-y-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              KIPU’S IA • Consultas de Caja
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pregunta lo que necesites saber sobre tu dinero en lenguaje cotidiano.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Historial de Chat */}
        <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
          {mensajes.map((m) => {
            const esIA = m.autor === 'IA';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 text-xs ${
                  esIA ? 'items-start' : 'items-end flex-row-reverse'
                }`}
              >
                {esIA && (
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    esIA
                      ? 'bg-muted/40 border border-border text-foreground rounded-tl-xs'
                      : 'bg-primary text-primary-foreground rounded-tr-xs'
                  }`}
                >
                  <p>{m.texto}</p>
                  <span
                    className={`block text-[10px] mt-1 ${
                      esIA ? 'text-muted-foreground' : 'text-primary-foreground/75'
                    }`}
                  >
                    {m.hora}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preguntas Rápidas */}
        <div className="p-3 bg-muted/30 border-t border-border/60 space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground block">
            Preguntas sugeridas:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PREGUNTAS_RAPIDAS.map((pr) => (
              <button
                key={pr}
                type="button"
                onClick={() => handleEnviar(pr)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-card hover:bg-muted text-foreground border border-border/80 transition-colors flex items-center gap-1"
              >
                <CornerDownRight className="h-3 w-3 text-primary" />
                {pr}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border/60 flex items-center gap-2 bg-card">
          <Input
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEnviar()}
            placeholder="Pregunta a KIPU'S IA sobre tu caja..."
            className="h-9 text-xs"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => handleEnviar()}
            disabled={!inputQuery.trim()}
            className="h-9 px-3 gap-1"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
