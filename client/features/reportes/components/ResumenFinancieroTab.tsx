import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResumenFinanciero } from "../types/reportes.types";
import type { SeccionReporte } from "../utils/reporteExport";
import { TablaReporte } from "./TablaReporte";
import { formatMoney } from "@/utils/formatters";

export function ResumenFinancieroTab({
  financiero,
  periodoLabel,
  secciones,
}: {
  financiero: ResumenFinanciero;
  periodoLabel: string;
  secciones: SeccionReporte[];
}) {
  return (
    <div className="space-y-6 min-w-0">
      <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2 text-sm">
        <p>
          El costo usa los precios de compra actuales. El resultado es una
          estimación con IGV incluido, sin costo histórico; no indica dinero
          disponible en Caja.
        </p>
        {financiero.itemsSinCosto > 0 && (
          <p role="status" className="text-warning-text">
            Falta costo para {financiero.itemsSinCosto} detalle(s). El costo y
            el resultado del periodo no están disponibles.
          </p>
        )}
      </div>
      <TablaReporte {...secciones[1]} />
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Ventas menos devoluciones y gastos por mes
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {periodoLabel} · Soles (PEN). Los meses sin operaciones se omiten.
          </p>
        </CardHeader>
        <CardContent>
          {financiero.desgloseMensual.length ? (
            <div
              className="h-72 w-full"
              role="img"
              aria-label="Comparación mensual de ventas menos devoluciones y gastos. Los mismos valores están en la tabla mensual siguiente."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={financiero.desgloseMensual}
                  margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                >
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="periodo"
                    tickLine={false}
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                    minTickGap={24}
                  />
                  <YAxis
                    width={72}
                    tickFormatter={(n) => `S/ ${n}`}
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      formatMoney(value),
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="ingresos"
                    name="Ventas menos devoluciones"
                    fill="hsl(var(--chart-1))"
                  />
                  <Bar
                    dataKey="gastos"
                    name="Gastos operativos"
                    fill="hsl(var(--chart-2))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay ventas, devoluciones ni gastos en este periodo.
            </p>
          )}
        </CardContent>
      </Card>
      <TablaReporte {...secciones[2]} />
    </div>
  );
}
