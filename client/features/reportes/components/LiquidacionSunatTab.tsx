import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LiquidacionSunat } from '../types/reportes.types';
import { formatMoney } from '@/utils/formatters';
import { Landmark, FileText, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface LiquidacionSunatTabProps {
  sunat: LiquidacionSunat | null;
  periodoLabel: string;
}

export const LiquidacionSunatTab: React.FC<LiquidacionSunatTabProps> = ({
  sunat,
  periodoLabel,
}) => {
  if (!sunat) return null;

  const tieneSaldoPagar = sunat.igvPagar > 0;

  return (
    <div className="space-y-6">
      {/* Tarjeta Informativa de Calendario SUNAT */}
      <div className="p-3.5 rounded-md border border-warning/40 bg-warning-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-warning-text shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-warning-text">
              Declaración mensual SUNAT — Formulario Virtual 621 ({periodoLabel})
            </p>
            <p className="text-xs text-warning-text/90 mt-0.5">
              Cálculo estimativo del IGV para MYPEs. Los comprobantes deben estar validados en el SIRE antes del cronograma según el último dígito de tu RUC.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs border-warning/50 text-warning-text bg-warning-soft shrink-0">
          Régimen MYPE / General
        </Badge>
      </div>

      {/* Grid de Débito y Crédito Fiscal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna 1: Ventas Emitidas (Débito Fiscal) */}
        <Card className="rounded-md border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Ventas emitidas (Débito fiscal)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Impuesto cobrado en comprobantes del período
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs border-border bg-card">
                Tasa 18%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-center text-xs py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Base imponible gravada:</span>
              <span className="font-mono font-medium text-foreground tabular-nums">
                {formatMoney(sunat.baseImponibleVentas)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Ventas con Boleta de Venta:</span>
              <span className="font-mono tabular-nums text-foreground">
                {formatMoney(sunat.ventasConBoleta)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Ventas con Factura electrónica:</span>
              <span className="font-mono tabular-nums text-foreground">
                {formatMoney(sunat.ventasConFactura)}
              </span>
            </div>

            <div className="p-2.5 rounded-md bg-muted/40 border border-border/70 flex justify-between items-center text-xs mt-2">
              <span className="font-semibold text-foreground">
                Total Débito Fiscal IGV (18%):
              </span>
              <span className="font-mono font-semibold tabular-nums text-primary">
                {formatMoney(sunat.igvVentasDebito)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Columna 2: Compras con Factura (Crédito Fiscal) */}
        <Card className="rounded-md border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Compras sustentadas (Crédito fiscal)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Impuesto deducible de facturas de proveedores
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs border-border bg-card">
                Deducible
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-center text-xs py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Base imponible de compras:</span>
              <span className="font-mono font-medium text-foreground tabular-nums">
                {formatMoney(sunat.baseImponibleCompras)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Compras totales con comprobante:</span>
              <span className="font-mono tabular-nums text-foreground">
                {formatMoney(sunat.comprasConFactura)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs py-1.5 border-b border-border/60">
              <span className="text-muted-foreground">Gastos con factura validados:</span>
              <span className="text-xs text-muted-foreground">
                Sincronizado con módulo de gastos
              </span>
            </div>

            <div className="p-2.5 rounded-md bg-success-soft border border-success/30 flex justify-between items-center text-xs mt-2">
              <span className="font-semibold text-success-text">
                Total Crédito Fiscal IGV a favor:
              </span>
              <span className="font-mono font-semibold tabular-nums text-success-text">
                {formatMoney(sunat.igvComprasCredito)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saldo Final Estimado de IGV */}
      <Card className="rounded-md border-border bg-card shadow-xs">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {tieneSaldoPagar
                    ? 'Saldo preliminar de IGV a pagar a SUNAT:'
                    : 'Crédito fiscal remanente a favor del negocio:'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Diferencia aritmética: Débito fiscal facturado (S/ {sunat.igvVentasDebito.toFixed(2)}) menos Crédito fiscal deducible (S/ {sunat.igvComprasCredito.toFixed(2)}).
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div
                className={`font-mono text-2xl font-semibold tabular-nums ${
                  tieneSaldoPagar ? 'text-primary' : 'text-success-text'
                }`}
              >
                {formatMoney(tieneSaldoPagar ? sunat.igvPagar : sunat.creditoFiscalRemanente)}
              </div>
              <span className="text-xs text-muted-foreground">
                {tieneSaldoPagar ? 'A pagar en declaración mensual' : 'Se traslada al mes siguiente'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
