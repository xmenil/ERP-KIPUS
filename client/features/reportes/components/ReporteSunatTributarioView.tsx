import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/common/MetricCard';
import { LiquidacionSunat } from '../types/reportes.types';
import { formatMoney, formatCurrency } from '@/utils/formatters';
import {
  Receipt,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Building,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReporteSunatTributarioViewProps {
  sunat: LiquidacionSunat | null;
  periodoLabel: string;
}

export const ReporteSunatTributarioView: React.FC<ReporteSunatTributarioViewProps> = ({
  sunat,
  periodoLabel,
}) => {
  if (!sunat) return null;

  const tieneSaldoPagar = sunat.igvPagar > 0;

  // Exportar TXT para PLE / SIRE
  const handleExportarTxtSire = () => {
    const rucEmpresa = '20601234567';
    const periodoSire = '202610';
    const filename = `LE${rucEmpresa}${periodoSire}00140400021112.txt`;
    const contenido = [
      `${periodoSire}|01|F001|00001234|2026-10-15|2026-10-15|01|20100055237|ALICORP S.A.A.|${sunat.baseImponibleVentas.toFixed(2)}|0.00|${sunat.igvVentasDebito.toFixed(2)}|0.00|0.00|0.00|0.00|${(sunat.baseImponibleVentas + sunat.igvVentasDebito).toFixed(2)}|PEN|1|`,
      `${periodoSire}|03|B001|00005678|2026-10-16|2026-10-16|01|45892134|CLIENTE PUBLICO|${sunat.ventasConBoleta.toFixed(2)}|0.00|0.00|0.00|0.00|0.00|0.00|${sunat.ventasConBoleta.toFixed(2)}|PEN|1|`,
    ].join('\r\n');

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Archivo TXT SIRE SUNAT descargado: ${filename}`);
  };

  // Exportar Excel Resumen
  const handleExportarExcel = () => {
    const csvContent =
      'Concepto,Base Imponible,IGV (18%),Total CPE\n' +
      `Ventas con Factura,${(sunat.ventasConFactura / 1.18).toFixed(2)},${(sunat.ventasConFactura - sunat.ventasConFactura / 1.18).toFixed(2)},${sunat.ventasConFactura.toFixed(2)}\n` +
      `Ventas con Boleta,${(sunat.ventasConBoleta / 1.18).toFixed(2)},${(sunat.ventasConBoleta - sunat.ventasConBoleta / 1.18).toFixed(2)},${sunat.ventasConBoleta.toFixed(2)}\n` +
      `Compras con Factura (Crédito Fiscal),${sunat.baseImponibleCompras.toFixed(2)},${sunat.igvComprasCredito.toFixed(2)},${(sunat.baseImponibleCompras + sunat.igvComprasCredito).toFixed(2)}\n` +
      `Liquidación Neta de IGV a Pagar,0.00,${sunat.igvPagar.toFixed(2)},${sunat.igvPagar.toFixed(2)}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Liquidacion_SUNAT_621_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Resumen tributario Form. 621 exportado en formato compatible con Excel.');
  };

  return (
    <div className="space-y-4">
      {/* 1. Alerta informativa sobre SIRE y Formulario 621 */}
      <div className="p-3.5 rounded-lg border border-warning/40 bg-warning-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-warning-text shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-warning-text">
              Liquidación Mensual de Impuestos SUNAT — Formulario Virtual 621 ({periodoLabel})
            </p>
            <p className="text-[11px] text-warning-text/90">
              Cálculo estimativo para MYPEs del Régimen General / Especial. Tus comprobantes deben validarse en el SIRE antes del vencimiento según el último dígito de tu RUC.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportarExcel}
            className="h-8 text-xs font-semibold gap-1.5 border-warning/50 bg-card hover:bg-warning/20"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Excel 621</span>
          </Button>
          <Button
            size="sm"
            onClick={handleExportarTxtSire}
            className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Generar TXT SIRE</span>
          </Button>
        </div>
      </div>

      {/* 2. Tarjetas KPI Tributarias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Débito Fiscal (IGV Ventas)"
          value={formatMoney(sunat.igvVentasDebito)}
          subtitle={`Base gravada: ${formatMoney(sunat.baseImponibleVentas)}`}
          icon={Receipt}
          iconColor="text-primary bg-primary/10"
        />
        <MetricCard
          title="Crédito Fiscal (IGV Compras)"
          value={formatMoney(sunat.igvComprasCredito)}
          subtitle={`Facturas de compra: ${formatMoney(sunat.comprasConFactura)}`}
          icon={Building}
          iconColor="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
        />
        <MetricCard
          title={tieneSaldoPagar ? 'IGV Neto a Pagar' : 'Crédito Fiscal a Favor'}
          value={formatMoney(tieneSaldoPagar ? sunat.igvPagar : sunat.creditoFiscalRemanente)}
          subtitle={
            tieneSaldoPagar
              ? 'Monto a pagar en Form. 621'
              : 'Remanente para el próximo mes'
          }
          icon={tieneSaldoPagar ? AlertTriangle : CheckCircle2}
          iconColor={
            tieneSaldoPagar ? 'text-danger-text bg-danger-soft' : 'text-success-text bg-success-soft'
          }
        />
        <MetricCard
          title="Ventas Boletas vs Facturas"
          value={formatCurrency(sunat.ventasConFactura)}
          subtitle={`Facturas B2B (${formatCurrency(sunat.ventasConBoleta)} en Boletas)`}
          icon={FileText}
          iconColor="text-info-text bg-info-soft"
        />
      </div>

      {/* 3. Desglose Contable de Débito y Crédito Fiscal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ventas Emitidas (Débito) */}
        <Card className="border border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Ventas Emitidas (Débito Fiscal)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Impuesto recaudado por comprobantes electrónicos
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs bg-card">
                Tasa 18%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Base Imponible Gravada:</span>
              <span className="font-mono font-bold text-foreground">
                {formatCurrency(sunat.baseImponibleVentas)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Ventas mediante Factura Electrónica:</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(sunat.ventasConFactura)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Ventas mediante Boleta de Venta:</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(sunat.ventasConBoleta)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 px-2.5 rounded-md bg-muted/50 font-bold border border-border/70">
              <span className="text-foreground">Total Débito Fiscal Acumulado:</span>
              <span className="font-mono text-primary text-sm">
                {formatCurrency(sunat.igvVentasDebito)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Compras Deducibles (Crédito) */}
        <Card className="border border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-3 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Compras de Proveedores (Crédito Fiscal)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Impuesto pagado con derecho a deducción tributaria
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs bg-card">
                Deducible
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Base Imponible Adquisiciones:</span>
              <span className="font-mono font-bold text-foreground">
                {formatCurrency(sunat.baseImponibleCompras)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Total Compras con Factura de Proveedor:</span>
              <span className="font-mono font-semibold text-foreground">
                {formatCurrency(sunat.comprasConFactura)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Crédito Fiscal a Favor del Mes:</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(sunat.igvComprasCredito)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 px-2.5 rounded-md bg-muted/50 font-bold border border-border/70">
              <span className="text-foreground">Liquidación SUNAT (Débito - Crédito):</span>
              <span
                className={`font-mono text-sm ${
                  tieneSaldoPagar ? 'text-danger-text' : 'text-success-text'
                }`}
              >
                {tieneSaldoPagar
                  ? `A Pagar: ${formatCurrency(sunat.igvPagar)}`
                  : `A Favor: ${formatCurrency(sunat.creditoFiscalRemanente)}`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
