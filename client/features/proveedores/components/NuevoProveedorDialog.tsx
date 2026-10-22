import { ProveedorFormDialog } from "./ProveedorFormDialog";
import type { NuevoProveedorPayload } from "../types/proveedores.types";
// Adaptador para consumidores antiguos; el formulario y la validación son únicos.
export function NuevoProveedorDialog({
  open,
  onOpenChange,
  onProveedorRegistrado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProveedorRegistrado: (payload: NuevoProveedorPayload) => Promise<void>;
}) {
  return (
    <ProveedorFormDialog
      open={open}
      onOpenChange={onOpenChange}
      onGuardar={onProveedorRegistrado}
    />
  );
}
