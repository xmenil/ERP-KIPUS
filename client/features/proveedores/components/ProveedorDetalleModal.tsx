import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatters";
import { toast } from "sonner";
import type { Proveedor } from "../types/proveedores.types";
import type { Compra } from "@/features/compras/types/compras.types";
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedor: Proveedor | null;
  onEditarClick: (prov: Proveedor) => void;
  compras?: Compra[];
}
export function ProveedorDetalleModal({
  open,
  onOpenChange,
  proveedor: p,
  onEditarClick,
  compras = [],
}: Props) {
  const [copying, setCopying] = useState(false);
  if (!p) return null;
  const copy = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(p.ruc);
      toast.success("RUC copiado");
    } catch {
      toast.error("No se pudo copiar el RUC. Selecciona el texto y cópialo.");
    } finally {
      setCopying(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="break-words pr-6">
            {p.razonSocial}
          </DialogTitle>
          <DialogDescription>
            Datos del directorio y compras registradas en este navegador.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 text-sm">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ["RUC", p.ruc],
              ["Estado", p.activo === false ? "Inactivo" : "Activo"],
              ["Nombre comercial", p.nombreComercial],
              ["Contacto", p.contacto],
              ["Teléfono", p.telefono],
              ["Correo", p.correo],
              ["Dirección", p.direccion],
              ["Ciudad", p.ciudad],
              ["Provincia", p.provincia],
              ["País", p.pais],
              ["Código postal", p.codigoPostal],
              ["Rubro", p.rubro],
              ["Condición de pago", p.condicionPago],
              [
                "Límite de crédito referencial",
                formatCurrency(p.limiteCredito || 0),
              ],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className={label === "RUC" ? "font-mono" : "break-words"}>
                  {value || "No registrado"}
                </dd>
              </div>
            ))}
          </dl>
          {p.descripcion && (
            <div>
              <h2 className="text-lg font-semibold">Notas</h2>
              <p className="break-words">{p.descripcion}</p>
            </div>
          )}
          <section className="space-y-3 border-t border-border pt-4">
            <h2 className="text-lg font-semibold">Compras registradas</h2>
            <p className="text-xs text-muted-foreground">
              Se conserva el nombre y RUC registrados en cada compra. Los
              importes iniciales del directorio son referencias de demostración;
              no son una cuenta por pagar conciliada.
            </p>
            <p>
              Saldo referencial del directorio:{" "}
              <span className="tabular-nums">
                {formatCurrency(p.saldoPendiente || 0)}
              </span>
            </p>
            {compras.length ? (
              <ul className="max-h-48 divide-y divide-border overflow-y-auto">
                {compras.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap justify-between gap-2 py-3"
                  >
                    <span className="font-mono">{c.serieFactura}</span>
                    <span>{c.proveedorNombre}</span>
                    <span>{c.estado}</span>
                    <span className="tabular-nums">
                      {formatCurrency(c.total)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                No hay compras registradas con este RUC.
              </p>
            )}
          </section>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            disabled={copying}
            onClick={() => {
              void copy();
            }}
          >
            {copying ? "Copiando…" : "Copiar RUC"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onEditarClick(p);
            }}
          >
            Editar proveedor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
