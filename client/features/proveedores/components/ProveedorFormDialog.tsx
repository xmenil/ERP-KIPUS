import { useEffect, useRef, useState } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/common/FormError";
import { proveedorSchema } from "../utils/proveedorValidation";
import type {
  Proveedor,
  NuevoProveedorPayload,
} from "../types/proveedores.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardar: (payload: NuevoProveedorPayload, id?: string) => Promise<void>;
  proveedorAEditar?: Proveedor | null;
  rucBloqueado?: boolean;
}
const condiciones = [
  "Contado",
  "Contado / Transferencia",
  "Crédito a 15 días",
  "Crédito a 30 días",
  "Crédito a 45 días",
  "Crédito a 60 días",
];
const defaults: NuevoProveedorPayload = {
  ruc: "",
  razonSocial: "",
  nombreComercial: "",
  contacto: "",
  telefono: "",
  correo: "",
  direccion: "",
  ciudad: "Tingo María",
  provincia: "",
  pais: "Perú",
  codigoPostal: "",
  rubro: "Abarrotes y Alimentos",
  condicionPago: "Contado",
  diasCredito: 0,
  limiteCredito: 0,
  descripcion: "",
};
const principales: {
  key:
    | "ruc"
    | "razonSocial"
    | "nombreComercial"
    | "contacto"
    | "telefono"
    | "correo";
  label: string;
  optional?: boolean;
}[] = [
  { key: "ruc", label: "RUC" },
  { key: "razonSocial", label: "Razón social" },
  { key: "nombreComercial", label: "Nombre comercial", optional: true },
  { key: "contacto", label: "Persona de contacto", optional: true },
  { key: "telefono", label: "Teléfono", optional: true },
  { key: "correo", label: "Correo", optional: true },
];
export function ProveedorFormDialog({
  open,
  onOpenChange,
  onGuardar,
  proveedorAEditar,
  rucBloqueado = false,
}: Props) {
  const lock = useRef(false);
  const [saveError, setSaveError] = useState("");
  const [discard, setDiscard] = useState(false);
  const {
    register,
    reset,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NuevoProveedorPayload>({
    defaultValues: defaults,
    resolver: zodResolver(proveedorSchema) as Resolver<NuevoProveedorPayload>,
    mode: "onBlur",
    shouldFocusError: true,
  });
  useEffect(() => {
    if (open) {
      reset({ ...defaults, ...proveedorAEditar });
      setSaveError("");
    }
  }, [open, proveedorAEditar, reset]);
  const requestClose = (value: boolean) => {
    if (lock.current) return;
    if (!value && isDirty) setDiscard(true);
    else onOpenChange(value);
  };
  const save = async (data: NuevoProveedorPayload) => {
    if (lock.current) return;
    lock.current = true;
    setSaveError("");
    try {
      await onGuardar(data, proveedorAEditar?.id);
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar. Conserva los campos e inténtalo de nuevo.";
      if (message.includes("RUC"))
        setError("ruc", { type: "server", message }, { shouldFocus: true });
      else setSaveError(message);
    } finally {
      lock.current = false;
    }
  };
  const field = (
    key: keyof NuevoProveedorPayload,
    label: string,
    numeric = false,
  ) => (
    <div className="space-y-2" key={key}>
      <Label htmlFor={`proveedor-${key}`}>{label}</Label>
      {key === "descripcion" ? (
        <Textarea
          id={`proveedor-${key}`}
          {...register(key)}
          rows={3}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `proveedor-${key}-error` : undefined}
          className="text-base md:text-sm"
        />
      ) : (
        <Input
          id={`proveedor-${key}`}
          {...register(
            key,
            numeric
              ? {
                  setValueAs: (value) =>
                    value === "" ? undefined : Number(value),
                }
              : {},
          )}
          type={numeric ? "number" : "text"}
          min={numeric ? 0 : undefined}
          step={numeric ? "0.01" : undefined}
          inputMode={numeric ? "decimal" : undefined}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `proveedor-${key}-error` : undefined}
          className="h-11 md:h-9 text-base md:text-sm"
        />
      )}
      {errors[key] && (
        <p id={`proveedor-${key}-error`} className="text-sm text-danger-text">
          {errors[key]?.message}
        </p>
      )}
    </div>
  );
  return (
    <>
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent className="flex w-full sm:max-w-2xl flex-col overflow-hidden p-0 [&>button]:grid [&>button]:h-11 [&>button]:w-11 [&>button]:place-items-center">
          <SheetHeader className="border-b border-border p-4 pr-12 md:p-6">
            <SheetTitle>
              {proveedorAEditar ? "Editar proveedor" : "Nuevo proveedor"}
            </SheetTitle>
            <SheetDescription>
              Datos de contacto y condiciones para abastecer tu negocio. No
              realiza consultas a SUNAT.
            </SheetDescription>
          </SheetHeader>
          <form
            id="proveedor-form"
            noValidate
            onSubmit={handleSubmit(save)}
            className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6"
          >
            <FormError message={saveError} />
            <fieldset disabled={isSubmitting} className="space-y-6">
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Empresa y contacto</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {principales.map(({ key, label, optional }) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`proveedor-${key}`}>
                        {label}
                        {optional ? " (opcional)" : ""}
                      </Label>
                      <Input
                        id={`proveedor-${key}`}
                        {...register(key)}
                        readOnly={key === "ruc" && rucBloqueado}
                        inputMode={
                          key === "ruc"
                            ? "numeric"
                            : key === "telefono"
                              ? "tel"
                              : key === "correo"
                                ? "email"
                                : undefined
                        }
                        aria-invalid={!!errors[key]}
                        aria-describedby={
                          errors[key]
                            ? `proveedor-${key}-error`
                            : key === "ruc" && rucBloqueado
                              ? "proveedor-ruc-ayuda"
                              : undefined
                        }
                        className={
                          key === "ruc"
                            ? "h-11 md:h-9 text-base md:text-sm font-mono"
                            : "h-11 md:h-9 text-base md:text-sm"
                        }
                      />
                      {errors[key] && (
                        <p
                          id={`proveedor-${key}-error`}
                          className="text-sm text-danger-text"
                        >
                          {errors[key]?.message}
                        </p>
                      )}
                      {key === "ruc" && rucBloqueado && (
                        <p
                          id="proveedor-ruc-ayuda"
                          className="text-xs text-muted-foreground"
                        >
                          El RUC se conserva porque tiene compras registradas.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Condiciones de compra</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {field("rubro", "Rubro")}
                  <div className="space-y-2">
                    <Label htmlFor="proveedor-condicionPago">
                      Condición de pago
                    </Label>
                    <select
                      id="proveedor-condicionPago"
                      {...register("condicionPago")}
                      className="h-11 md:h-9 w-full rounded-md border border-input bg-background px-3 text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {!condiciones.includes(
                        proveedorAEditar?.condicionPago || "Contado",
                      ) && <option>{proveedorAEditar?.condicionPago}</option>}
                      {condiciones.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  {field(
                    "limiteCredito",
                    "Límite de crédito (S/) · opcional",
                    true,
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Los días de crédito se obtienen de la condición de pago. El
                  límite es una referencia comercial; no autoriza pagos.
                </p>
              </section>
              <details className="space-y-4 border-t border-border pt-4">
                <summary className="cursor-pointer text-sm font-medium">
                  Dirección y datos adicionales (opcionales)
                </summary>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {field("direccion", "Dirección (opcional)")}
                  {field("ciudad", "Ciudad (opcional)")}
                  {field("provincia", "Provincia (opcional)")}
                  {field("pais", "País (opcional)")}
                  {field("codigoPostal", "Código postal (opcional)")}
                  {field("descripcion", "Notas (opcional)")}
                </div>
              </details>
            </fieldset>
          </form>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border p-4">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => requestClose(false)}
            >
              Cancelar
            </Button>
            <Button form="proveedor-form" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : "Guardar proveedor"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Descartar los cambios del proveedor?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Los campos que todavía no guardaste se perderán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDiscard(false);
                onOpenChange(false);
              }}
            >
              Descartar cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
