import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/common/PageHeader";
import { FormError } from "@/components/common/FormError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { configuracionService } from "../services/configuracionService";
import { configuracionSchema } from "../services/configuracionStorage";
import {
  ConfiguracionSistema,
  DatosEmpresa,
  SerieComprobante,
} from "../types/configuracion.types";
import { erpStore, subscribeToErp } from "@/services/erp/erpStore";
import { toast } from "sonner";

type Formulario = ConfiguracionSistema;
const campos: {
  key: keyof DatosEmpresa;
  label: string;
  optional?: boolean;
  mode?: "numeric" | "email" | "tel";
}[] = [
  { key: "ruc", label: "RUC", mode: "numeric" },
  { key: "razonSocial", label: "Razón social" },
  { key: "nombreComercial", label: "Nombre comercial", optional: true },
  { key: "nombreSede", label: "Nombre de la sede" },
  { key: "direccionFiscal", label: "Dirección fiscal" },
  { key: "correo", label: "Correo de contacto", optional: true, mode: "email" },
  { key: "telefono", label: "Teléfono", optional: true, mode: "tel" },
  { key: "regimenTributario", label: "Régimen tributario", optional: true },
];

export const ConfiguracionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [series, setSeries] = useState<SerieComprobante[]>([]);
  const [seriesError, setSeriesError] = useState("");
  const [reload, setReload] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [leaving, setLeaving] = useState<string | null>(null);
  const saving = useRef(false);
  const resetLock = useRef(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Formulario>({
    resolver: zodResolver(configuracionSchema) as Resolver<Formulario>,
    mode: "onBlur",
    shouldFocusError: true,
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    configuracionService
      .getConfiguracion()
      .then((data) => {
        if (active) reset(configuracionSchema.parse(data));
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reload, reset]);
  useEffect(() => {
    const update = () => {
      try {
        setSeries(erpStore.getSeriesComprobantes());
        setSeriesError("");
      } catch (error) {
        setSeriesError(
          error instanceof Error
            ? error.message
            : "No se pudieron leer las series.",
        );
      }
    };
    update();
    return subscribeToErp(update);
  }, []);
  useEffect(() => {
    if (!isDirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const click = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest?.("a[href]");
      if (!link || event.ctrlKey || event.metaKey || event.button !== 0) return;
      const href = link.getAttribute("href");
      if (href && href.startsWith("/") && href !== location.pathname) {
        event.preventDefault();
        event.stopPropagation();
        setLeaving(href);
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [isDirty]);

  const save = async (data: Formulario) => {
    if (saving.current) return;
    saving.current = true;
    setSaveError("");
    try {
      const saved = await configuracionService.guardarConfiguracion(data);
      reset(configuracionSchema.parse(saved));
      toast.success("Configuración guardada en este navegador");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar. Conserva los campos e inténtalo de nuevo.",
      );
    } finally {
      saving.current = false;
    }
  };
  const restoreDemo = async () => {
    if (resetLock.current) return;
    resetLock.current = true;
    setResetting(true);
    setResetError("");
    try {
      erpStore.restablecerDatosMinimarket();
      setResetOpen(false);
      toast.success(
        "Datos de demostración restablecidos. La empresa y las cuentas se conservaron.",
      );
    } catch (error) {
      setResetError(
        error instanceof Error
          ? error.message
          : "No se pudieron restablecer los datos. Inténtalo de nuevo.",
      );
    } finally {
      resetLock.current = false;
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Datos del negocio y parámetros de este navegador."
      >
        {!loading && !loadError && (
          <Button
            form="configuracion-form"
            type="submit"
            disabled={isSubmitting}
            className="h-11 md:h-9"
          >
            {isSubmitting ? "Guardando…" : "Guardar configuración"}
          </Button>
        )}
      </PageHeader>
      {loading ? (
        <div
          aria-label="Cargando configuración"
          className="max-w-2xl space-y-4"
        >
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
          <div className="h-64 animate-pulse rounded-md bg-muted" />
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="max-w-2xl space-y-4 rounded-md border border-destructive bg-danger-soft p-4 text-sm text-danger-text"
        >
          <p>{loadError}</p>
          <Button
            variant="outline"
            onClick={() => setReload((value) => value + 1)}
          >
            Reintentar lectura
          </Button>
        </div>
      ) : (
        <>
          <form
            id="configuracion-form"
            noValidate
            onSubmit={handleSubmit(save)}
            className="max-w-2xl space-y-6"
          >
            <p role="status" className="text-sm text-muted-foreground">
              {isDirty
                ? "Tienes cambios sin guardar."
                : "Los datos se comparten en este navegador. No se sincronizan con otros equipos."}
            </p>
            <FormError message={saveError} />
            <section
              aria-labelledby="empresa-titulo"
              className="space-y-4 rounded-md border border-border bg-card p-4 md:p-6"
            >
              <h2 id="empresa-titulo" className="text-lg font-semibold">
                Empresa
              </h2>
              <p className="text-sm text-muted-foreground">
                El nombre y RUC aparecen en la navegación. Las nuevas ventas
                conservan una copia de estos datos del emisor.
              </p>
              <fieldset
                disabled={isSubmitting}
                className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2"
              >
                {campos.map(({ key, label, optional, mode }) => {
                  const error = errors.empresa?.[key];
                  const id = `config-${key}`;
                  return (
                    <div
                      key={key}
                      className={
                        key === "direccionFiscal"
                          ? "space-y-2 md:col-span-2"
                          : "space-y-2"
                      }
                    >
                      <Label htmlFor={id}>
                        {label}
                        {optional ? " (opcional)" : ""}
                      </Label>
                      <Input
                        id={id}
                        inputMode={mode}
                        {...register(`empresa.${key}`)}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${id}-error` : undefined}
                        className={
                          key === "ruc"
                            ? "h-11 md:h-9 text-base md:text-sm font-mono"
                            : "h-11 md:h-9 text-base md:text-sm"
                        }
                      />
                      {error && (
                        <p
                          id={`${id}-error`}
                          className="text-sm text-danger-text"
                        >
                          {error.message}
                        </p>
                      )}
                    </div>
                  );
                })}
              </fieldset>
            </section>
            <section
              aria-labelledby="comprobantes-titulo"
              className="space-y-4 rounded-md border border-border bg-card p-4 md:p-6"
            >
              <h2 id="comprobantes-titulo" className="text-lg font-semibold">
                Comprobantes
              </h2>
              <p className="text-sm text-muted-foreground">
                Series locales fijas. El siguiente número se calcula desde las
                ventas guardadas; no se modifica manualmente. Son comprobantes
                de demostración, sin autorización SUNAT.
              </p>
              {seriesError ? (
                <FormError message={seriesError} />
              ) : (
                <ul className="divide-y divide-border">
                  {series.map((s) => (
                    <li
                      key={s.serie}
                      className="flex flex-wrap justify-between gap-3 py-3 text-sm"
                    >
                      <span>{s.tipo}</span>
                      <span className="font-mono tabular-nums">
                        {s.serie}-{String(s.siguienteNumero).padStart(6, "0")}{" "}
                        <span className="font-sans text-xs text-muted-foreground">
                          siguiente
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section
              aria-labelledby="preferencias-titulo"
              className="space-y-4 rounded-md border border-border bg-card p-4 md:p-6"
            >
              <h2 id="preferencias-titulo" className="text-lg font-semibold">
                Preferencias
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="config-moneda">Moneda</Label>
                  <Input
                    id="config-moneda"
                    value="PEN · Soles (S/)"
                    readOnly
                    className="h-11 md:h-9 text-base md:text-sm bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="config-igv">IGV incluido en precios</Label>
                  <Input
                    id="config-igv"
                    value="18 %"
                    readOnly
                    className="h-11 md:h-9 text-base md:text-sm bg-muted"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Moneda y tasa fijas para los cálculos actuales. La nota de venta
                no desglosa IGV.
              </p>
              <p className="text-sm">
                <span className="font-medium">
                  Venta sin stock: no permitida.
                </span>{" "}
                La opción permanece fija hasta que todos los flujos admitan
                stock negativo de forma coherente.
              </p>
            </section>
          </form>
          <section className="max-w-2xl space-y-3 border-t border-border pt-6">
            <h2 className="text-lg font-semibold">Cuentas del equipo</h2>
            <p className="text-sm text-muted-foreground">
              Gestiona las cuentas locales del prototipo.
            </p>
            <Button variant="outline" asChild>
              <Link to="/usuarios">Administrar usuarios</Link>
            </Button>
          </section>
          <section className="max-w-2xl space-y-3 border-t border-border pt-6">
            <h2 className="text-lg font-semibold">Datos de demostración</h2>
            <p className="text-sm text-muted-foreground">
              Reemplaza los registros operativos por los ejemplos iniciales.
              Conserva la configuración de empresa y las cuentas.
            </p>
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                setResetError("");
                setResetOpen(true);
              }}
            >
              Restablecer datos de demostración
            </Button>
          </section>
        </>
      )}
      <AlertDialog
        open={resetOpen}
        onOpenChange={(value) => {
          if (!resetLock.current) setResetOpen(value);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Restablecer los datos de demostración?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se reemplazarán productos, ventas, pedidos, cotizaciones,
              devoluciones, inventario, kardex, caja, compras, gastos, clientes
              y proveedores de este navegador. Esta acción elimina sus registros
              actuales. La configuración de empresa, las cuentas y la sesión se
              conservarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FormError message={resetError} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetting}
              onClick={(event) => {
                event.preventDefault();
                void restoreDemo();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting
                ? "Restableciendo…"
                : "Restablecer datos de demostración"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={leaving !== null}
        onOpenChange={(value) => {
          if (!value) setLeaving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tienes cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Si sales de Configuración se perderán los cambios que aún no
              guardaste.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const destination = leaving;
                setLeaving(null);
                if (destination) navigate(destination);
              }}
            >
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default ConfiguracionPage;
