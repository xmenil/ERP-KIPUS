import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/context/AuthContext";
import { canAccessPath } from "@/features/auth/permissions/rolePermissions";
import { formatDateTime } from "@/utils/formatters";
import { createLatestRequest } from "@/lib/latestRequest";
import { kipusIaService } from "../services/kipusIaService";
import type { ChatMessage, PeriodoConsulta } from "../types/kipus-ia.types";

const ejemplos = [
  "¿Qué stock debo reponer?",
  "¿Cuál es el producto más vendido?",
  "¿Qué cliente tiene la mayor deuda?",
  "¿Cuánto vendí?",
  "¿Cuál es el efectivo de caja?",
  "¿Cuánto gasté?",
];
const periodos: { value: PeriodoConsulta; label: string }[] = [
  { value: "HOY", label: "Hoy" },
  { value: "AYER", label: "Ayer" },
  { value: "ULTIMOS_7_DIAS", label: "Últimos 7 días" },
  { value: "ULTIMOS_30_DIAS", label: "Últimos 30 días" },
  { value: "ESTE_MES", label: "Mes actual, hasta hoy" },
  { value: "MES_ANTERIOR", label: "Mes anterior completo" },
  { value: "ANIO_ACTUAL", label: "Año actual, hasta hoy" },
];
export default function KipusIaPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [periodo, setPeriodo] = useState<PeriodoConsulta>("ESTE_MES");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState<{
    query: string;
    periodo: PeriodoConsulta;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const sending = useRef(false);
  const requests = useRef(createLatestRequest());
  useEffect(
    () => () => {
      requests.current.invalidate();
    },
    [],
  );
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages.length, busy]);

  const consultar = async (
    query: string,
    seleccionado: PeriodoConsulta,
    reintento = false,
  ) => {
    if (sending.current) return;
    const texto = query.trim();
    if (!texto || texto.length > 500) {
      setError("Escribe una pregunta de 1 a 500 caracteres.");
      inputRef.current?.focus();
      return;
    }
    sending.current = true;
    const request = requests.current.begin();
    setBusy(true);
    setError("");
    setFailed(null);
    if (!reintento)
      setMessages((prev) => [
        ...prev,
        {
          id: `u-${request}-${Date.now()}`,
          sender: "user",
          content: texto,
          timestamp: new Date().toISOString(),
        },
      ]);
    try {
      const respuesta = await kipusIaService.responderConsulta(
        texto,
        seleccionado,
      );
      if (!requests.current.isCurrent(request)) return;
      setMessages((prev) => [...prev, respuesta]);
      setInput("");
    } catch (cause) {
      if (!requests.current.isCurrent(request)) return;
      setError(
        `No se pudo consultar los datos locales. ${cause instanceof Error ? cause.message : "Inténtalo de nuevo."}`,
      );
      setFailed({ query: texto, periodo: seleccionado });
      setInput(texto);
    } finally {
      if (requests.current.isCurrent(request)) {
        setBusy(false);
        sending.current = false;
        inputRef.current?.focus();
      }
    }
  };
  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        title="KIPU'S IA"
        description="Asistente local para consultar ventas, productos, stock, caja, gastos y saldos guardados."
      />
      <p className="text-sm text-muted-foreground">
        Funciona con reglas y datos de este navegador. No usa IA externa ni hace
        predicciones. Las respuestas no registran operaciones. La conversación
        se conserva solo mientras permanezcas en esta pantalla.
      </p>
      <div className="space-y-2 sm:max-w-sm">
        <Label htmlFor="ia-periodo">
          Periodo para ventas, productos vendidos y gastos
        </Label>
        <Select
          value={periodo}
          onValueChange={(value) => setPeriodo(value as PeriodoConsulta)}
          disabled={busy}
        >
          <SelectTrigger id="ia-periodo" className="h-11 md:h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodos.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Fechas UTC inclusivas. Si escribes otro periodo admitido en la
          pregunta, se usará ese periodo. Stock, caja y saldos de clientes
          siempre son actuales.
        </p>
      </div>
      <Card className="shadow-none min-w-0">
        <CardContent className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">Consultas</h2>
          <div
            ref={logRef}
            role="log"
            aria-label="Conversación con el asistente local"
            aria-live="polite"
            aria-relevant="additions"
            aria-busy={busy}
            tabIndex={0}
            className="max-h-96 overflow-y-auto space-y-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {!messages.length && (
              <p className="py-6 text-sm text-muted-foreground">
                Aún no has hecho consultas. Elige un ejemplo o escribe una
                pregunta sobre los datos del negocio.
              </p>
            )}
            {messages.map((m) => (
              <article
                key={m.id}
                className={`space-y-2 rounded-md p-4 text-sm ${m.sender === "user" ? "bg-muted" : "border border-border"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">
                    {m.sender === "user" ? "Tú" : "Asistente local"}
                  </h3>
                  <time
                    dateTime={m.timestamp}
                    className="text-xs text-muted-foreground"
                  >
                    {formatDateTime(m.timestamp)}
                  </time>
                </div>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                {m.alcance && (
                  <p className="text-xs text-muted-foreground">
                    Alcance: {m.alcance}
                  </p>
                )}
                {!!m.dataPoints?.length && (
                  <dl className="divide-y divide-border">
                    {m.dataPoints.map((d, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1 py-2 sm:flex-row sm:justify-between sm:gap-4"
                      >
                        <dt className="break-words text-muted-foreground">
                          {d.label}
                        </dt>
                        <dd className="text-right tabular-nums font-medium">
                          {d.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {m.fuente && (
                  <p className="text-xs text-muted-foreground">
                    Fuente: {m.fuente}.
                  </p>
                )}
                {m.enlace && canAccessPath(user?.rol, m.enlace.ruta) && (
                  <Button asChild variant="outline" className="h-11 md:h-9">
                    <Link to={m.enlace.ruta}>{m.enlace.label}</Link>
                  </Button>
                )}
              </article>
            ))}
          </div>
          <p role="status" className="text-xs text-muted-foreground">
            {busy
              ? "Consultando datos locales…"
              : messages.length
                ? "Puedes hacer otra consulta o contrastar la respuesta en su módulo."
                : "Listo para consultar."}
          </p>
          {error && (
            <div
              role="alert"
              id="ia-error"
              className="space-y-2 rounded-md border border-destructive bg-danger-soft p-3 text-sm text-danger-text"
            >
              <p>{error}</p>
              {failed && (
                <Button
                  variant="outline"
                  className="h-11 md:h-9"
                  disabled={busy}
                  onClick={() =>
                    void consultar(failed.query, failed.periodo, true)
                  }
                >
                  Reintentar la consulta
                </Button>
              )}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void consultar(input, periodo);
            }}
            className="space-y-2"
          >
            <Label htmlFor="ia-pregunta">Pregunta sobre tu negocio</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                ref={inputRef}
                id="ia-pregunta"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError("");
                  setFailed(null);
                }}
                maxLength={500}
                readOnly={busy}
                aria-describedby={error ? "ia-error ia-ayuda" : "ia-ayuda"}
                className="h-11 md:h-9 text-base md:text-sm"
                placeholder="Ej.: ¿Cuál es el producto más vendido del mes?"
              />
              <Button
                type="submit"
                disabled={busy || !input.trim()}
                className="h-11 md:h-9"
              >
                {busy ? "Consultando…" : "Consultar"}
              </Button>
            </div>
            <p id="ia-ayuda" className="text-xs text-muted-foreground">
              Una pregunta a la vez; hasta 500 caracteres. Para crear una compra
              o cambiar datos, usa el formulario del módulo correspondiente.
            </p>
          </form>
        </CardContent>
      </Card>
      <section className="space-y-3">
        <h2 className="text-base font-medium">Ejemplos de consultas</h2>
        <div className="flex flex-wrap gap-2">
          {ejemplos.map((texto) => (
            <Button
              key={texto}
              type="button"
              variant="outline"
              className="h-auto min-h-11 whitespace-normal text-left md:min-h-9"
              disabled={busy}
              onClick={() => {
                setInput(texto);
                void consultar(texto, periodo);
              }}
            >
              {texto}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
