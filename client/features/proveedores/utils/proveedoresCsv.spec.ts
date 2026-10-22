import { expect, it } from "vitest";
import { crearCsvProveedores } from "./proveedoresCsv";
import type { Proveedor } from "../types/proveedores.types";
it("CSV conserva español, comillas, comas y saltos; exporta solo los registros recibidos", () => {
  const p: Proveedor = {
    id: "csv-E3",
    ruc: "20987654321",
    razonSocial: 'Almacén "Peña", E3\nTingo María',
    contacto: "Ana",
    telefono: "",
    correo: "",
    rubro: "Otros",
    direccion: "",
    ciudad: "Huánuco",
    condicionPago: "Contado",
    activo: false,
  };
  const csv = crearCsvProveedores([p]);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"Almacén ""Peña"", E3\nTingo María"');
  expect(csv).toContain('"Inactivo"');
  expect(csv).not.toContain("Alicorp");
  expect(csv.endsWith("\r\n")).toBe(true);
});
it("no expone fórmulas de hoja de cálculo como celdas ejecutables", () => {
  const csv = crearCsvProveedores([
    {
      id: "csv",
      razonSocial: "=1+1",
      contacto: "@E3",
      telefono: "+51999999999",
    } as Proveedor,
  ]);
  expect(csv).toContain('"\'=1+1"');
  expect(csv).toContain('"\'@E3"');
  expect(csv).toContain('"\'+51999999999"');
});
