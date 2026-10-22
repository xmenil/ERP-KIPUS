import { simulateDelay } from "@/services/mock/mockUtils";
import { Proveedor, NuevoProveedorPayload } from "../types/proveedores.types";
import { erpStore } from "@/services/erp/erpStore";
import { proveedorSchema } from "../utils/proveedorValidation";

export const proveedoresService = {
  async getProveedoresActivos(): Promise<Proveedor[]> {
    return (await proveedoresService.getProveedores()).filter(
      (p) => p.activo !== false,
    );
  },
  async getProveedores(): Promise<Proveedor[]> {
    const rows = erpStore.getProveedores();
    if (
      rows.some(
        (p) =>
          !proveedorSchema.safeParse(p).success ||
          (p.activo !== undefined && typeof p.activo !== "boolean"),
      )
    )
      throw new Error(
        "Hay datos de proveedores que no se pueden leer. Conserva el almacenamiento para recuperarlos; no se reemplazaron registros.",
      );
    return simulateDelay(rows);
  },

  async registrarProveedor(payload: NuevoProveedorPayload): Promise<Proveedor> {
    const prov = erpStore.crearProveedor(payload);
    return simulateDelay(prov);
  },

  async actualizarProveedor(
    id: string,
    payload: Partial<NuevoProveedorPayload>,
  ): Promise<Proveedor> {
    const prov = erpStore.actualizarProveedor(id, payload);
    return simulateDelay(prov);
  },

  async eliminarProveedor(id: string): Promise<boolean> {
    const res = erpStore.eliminarProveedor(id);
    return simulateDelay(res);
  },

  async toggleEstadoProveedor(id: string): Promise<Proveedor> {
    const prov = erpStore.toggleEstadoProveedor(id);
    return simulateDelay(prov);
  },
};
