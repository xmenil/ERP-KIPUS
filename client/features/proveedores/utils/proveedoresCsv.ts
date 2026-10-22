import type { Proveedor } from "../types/proveedores.types";
function cell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function crearCsvProveedores(rows: Proveedor[]) {
  return (
    "\uFEFF" +
    [
      [
        "Código",
        "RUC",
        "Razón social",
        "Nombre comercial",
        "Contacto",
        "Teléfono",
        "Correo",
        "Ciudad",
        "Condición de pago",
        "Estado",
      ],
      ...rows.map((p) => [
        p.codigo,
        p.ruc,
        p.razonSocial,
        p.nombreComercial,
        p.contacto,
        p.telefono,
        p.correo,
        p.ciudad,
        p.condicionPago,
        p.activo === false ? "Inactivo" : "Activo",
      ]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n") +
    "\r\n"
  );
}
