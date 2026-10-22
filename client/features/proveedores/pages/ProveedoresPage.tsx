import { useMemo, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryError } from "@/components/common/QueryError";
import { FormError } from "@/components/common/FormError";
import { useErpQuery } from "@/hooks/useErpQuery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
import { proveedoresService } from "../services/proveedoresService";
import { ProveedorFormDialog } from "../components/ProveedorFormDialog";
import { ProveedorDetalleModal } from "../components/ProveedorDetalleModal";
import type {
  Proveedor,
  NuevoProveedorPayload,
} from "../types/proveedores.types";
import { crearCsvProveedores } from "../utils/proveedoresCsv";
import { normalizarRuc } from "../utils/proveedorValidation";
import { erpStore } from "@/services/erp/erpStore";
import { toast } from "sonner";
const PAGE_SIZE = 20;
const isCredit = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .includes("credito");
export function ProveedoresPage() {
  const {
    data: proveedores,
    loading,
    error,
    refresh,
  } = useErpQuery(proveedoresService.getProveedores);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const [pago, setPago] = useState("TODOS");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    p: Proveedor;
    action: "borrar" | "estado";
  } | null>(null);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const compras = useMemo(() => {
    if (error) return [];
    try {
      return erpStore.getCompras();
    } catch {
      return [];
    }
  }, [proveedores, error]);
  const comprasDe = (p: Proveedor) =>
    compras.filter(
      (c) => normalizarRuc(c.proveedorRuc) === normalizarRuc(p.ruc),
    );
  const referenced = (p: Proveedor) =>
    comprasDe(p).length > 0 || (p.saldoPendiente || 0) > 0;
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    const ruc = normalizarRuc(term);
    return proveedores
      .filter(
        (p) =>
          (!term ||
            `${p.razonSocial} ${p.nombreComercial || ""} ${p.contacto}`
              .toLocaleLowerCase("es")
              .includes(term) ||
            normalizarRuc(p.ruc).includes(ruc)) &&
          (estado === "TODOS" ||
            (p.activo !== false) === (estado === "ACTIVO")) &&
          (pago === "TODOS" ||
            isCredit(p.condicionPago) === (pago === "CREDITO")),
      )
      .sort((a, b) => a.razonSocial.localeCompare(b.razonSocial, "es"));
  }, [proveedores, search, estado, pago]);
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1),
  );
  const rows = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );
  const edit = (p: Proveedor | null) => {
    setEditing(p);
    setFormOpen(true);
  };
  const save = async (data: NuevoProveedorPayload, id?: string) => {
    const p = id
      ? await proveedoresService.actualizarProveedor(id, data)
      : await proveedoresService.registrarProveedor(data);
    setSearch(p.ruc);
    setEstado("TODOS");
    setPago("TODOS");
    setPage(0);
    toast.success(
      `Proveedor ${p.razonSocial} ${id ? "actualizado" : "registrado"}`,
    );
  };
  const execute = async () => {
    if (!confirmation || lock.current) return;
    lock.current = true;
    setBusy(true);
    setActionError("");
    try {
      if (confirmation.action === "borrar") {
        await proveedoresService.eliminarProveedor(confirmation.p.id);
        toast.success(`Proveedor ${confirmation.p.razonSocial} eliminado`);
      } else {
        const p = await proveedoresService.toggleEstadoProveedor(
          confirmation.p.id,
        );
        toast.success(
          `Proveedor ${p.razonSocial} ${p.activo === false ? "desactivado" : "activado"}`,
        );
      }
      setConfirmation(null);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el cambio. Inténtalo de nuevo.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const exportCsv = () => {
    const url = URL.createObjectURL(
      new Blob([crearCsvProveedores(filtered)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "proveedores-filtrados.csv";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const status = (p: Proveedor) => (
    <span
      className={
        p.activo === false
          ? "rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
          : "rounded-md bg-success-soft px-2 py-1 text-xs text-success-text"
      }
    >
      {p.activo === false ? "Inactivo" : "Activo"}
    </span>
  );
  const actions = (p: Proveedor) => (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        onClick={() => setDetailId(p.id)}
        aria-label={`Ver detalle de ${p.razonSocial}`}
      >
        Ver detalle
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Acciones de ${p.razonSocial}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="[&_[role=menuitem]]:min-h-11 md:[&_[role=menuitem]]:min-h-9"
        >
          <DropdownMenuItem onSelect={() => edit(p)}>
            Editar proveedor
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setActionError("");
              setConfirmation({ p, action: "estado" });
            }}
          >
            {p.activo === false ? "Activar proveedor" : "Desactivar proveedor"}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={referenced(p)}
            onSelect={() => {
              setActionError("");
              setConfirmation({ p, action: "borrar" });
            }}
            className="text-danger-text"
          >
            {referenced(p)
              ? "Eliminar no disponible: tiene historial o saldo"
              : "Eliminar proveedor"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
  const detail = proveedores.find((p) => p.id === detailId) || null;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Proveedores"
        description="Contactos y condiciones de pago para tus compras."
      >
        <Button
          variant="outline"
          disabled={loading || !!error || !filtered.length}
          onClick={exportCsv}
        >
          Exportar CSV
        </Button>
        <Button onClick={() => edit(null)} disabled={!!error}>
          Nuevo proveedor
        </Button>
      </PageHeader>
      <QueryError
        message={error}
        retry={() => {
          void refresh();
        }}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="proveedores-busqueda">Buscar por nombre o RUC</Label>
          <Input
            id="proveedores-busqueda"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Ej. Distribuidora o 20100055237"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proveedores-estado">Estado</Label>
          <select
            id="proveedores-estado"
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value);
              setPage(0);
            }}
            className="h-11 md:h-9 w-full rounded-md border border-input bg-card px-3 text-base md:text-sm focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="TODOS">Todos</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="proveedores-pago">Condición de pago</Label>
          <select
            id="proveedores-pago"
            value={pago}
            onChange={(e) => {
              setPago(e.target.value);
              setPage(0);
            }}
            className="h-11 md:h-9 w-full rounded-md border border-input bg-card px-3 text-base md:text-sm focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="TODOS">Todas</option>
            <option value="CONTADO">Contado</option>
            <option value="CREDITO">Crédito</option>
          </select>
        </div>
      </div>
      {error ? null : loading ? (
        <div
          aria-label="Cargando proveedores"
          className="h-48 animate-pulse rounded-md border border-border bg-muted"
        />
      ) : !filtered.length ? (
        <div className="space-y-3 rounded-md border border-border bg-card p-6 text-sm">
          <p>
            {proveedores.length
              ? "No hay proveedores con estos filtros."
              : "Aún no registraste proveedores. Agrega el primero para seleccionarlo en Compras."}
          </p>
          {proveedores.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setEstado("TODOS");
                setPago("TODOS");
                setPage(0);
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="hidden rounded-md border border-border bg-card md:block">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Razón social / RUC</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Condición</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">{p.razonSocial}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {p.ruc}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{p.contacto || "Sin contacto"}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.telefono || p.correo || "Sin teléfono ni correo"}
                      </p>
                    </TableCell>
                    <TableCell>{p.condicionPago}</TableCell>
                    <TableCell>{status(p)}</TableCell>
                    <TableCell>{actions(p)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="divide-y divide-border rounded-md border border-border bg-card md:hidden">
            {rows.map((p) => (
              <li key={p.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium">
                      {p.razonSocial}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {p.ruc}
                    </p>
                  </div>
                  {status(p)}
                </div>
                <p className="break-words text-sm">
                  {p.contacto || "Sin contacto"} · {p.condicionPago}
                </p>
                {actions(p)}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="tabular-nums">
              Mostrando {currentPage * PAGE_SIZE + 1}–
              {Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} de{" "}
              {filtered.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={(currentPage + 1) * PAGE_SIZE >= filtered.length}
                onClick={() => setPage(currentPage + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
      <ProveedorFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        proveedorAEditar={editing}
        rucBloqueado={!!editing && comprasDe(editing).length > 0}
        onGuardar={save}
      />
      <ProveedorDetalleModal
        open={!!detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        proveedor={detail}
        onEditarClick={edit}
        compras={detail ? comprasDe(detail) : []}
      />
      <AlertDialog
        open={!!confirmation}
        onOpenChange={(value) => {
          if (!value && !lock.current) setConfirmation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmation?.action === "borrar"
                ? "¿Eliminar"
                : confirmation?.p.activo === false
                  ? "¿Activar"
                  : "¿Desactivar"}{" "}
              a {confirmation?.p.razonSocial}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.action === "borrar"
                ? "Se eliminará del directorio de este navegador. Esta acción no se puede deshacer."
                : confirmation?.p.activo === false
                  ? "Volverá a estar disponible para nuevas compras."
                  : "Se conservarán sus datos e historial. No estará disponible para nuevas compras."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FormError message={actionError} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={
                confirmation?.action === "borrar"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void execute();
              }}
            >
              {busy
                ? "Guardando…"
                : confirmation?.action === "borrar"
                  ? "Eliminar proveedor"
                  : confirmation?.p.activo === false
                    ? "Activar proveedor"
                    : "Desactivar proveedor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
export default ProveedoresPage;
