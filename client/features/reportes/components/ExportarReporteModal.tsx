import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileSpreadsheet, FileText, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportarReporteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodoLabel: string;
}

export const ExportarReporteModal: React.FC<ExportarReporteModalProps> = ({
  open,
  onOpenChange,
  periodoLabel,
}) => {
  const [formato, setFormato] = useState<'EXCEL' | 'PDF'>('EXCEL');
  const [descargando, setDescargando] = useState(false);

  const handleDescargar = () => {
    setDescargando(true);
    setTimeout(() => {
      setDescargando(false);
      onOpenChange(false);
      const ext = formato === 'EXCEL' ? 'Excel (.xlsx)' : 'PDF tributario (.pdf)';
      toast.success(`Reporte de ${periodoLabel} generado en formato ${ext}`);
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            Exportar reporte gerencial
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Descarga el consolidado de resultados, liquidación de IGV y ventas correspondientes a {periodoLabel}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-foreground">
              Formato del archivo
            </Label>
            <RadioGroup
              value={formato}
              onValueChange={(val) => setFormato(val as 'EXCEL' | 'PDF')}
              className="grid grid-cols-2 gap-3"
            >
              <label
                htmlFor="fmt-excel"
                className={`flex flex-col p-3 rounded-md border cursor-pointer transition-colors ${
                  formato === 'EXCEL'
                    ? 'border-primary bg-primary-soft/50 ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <RadioGroupItem value="EXCEL" id="fmt-excel" />
                </div>
                <span className="text-xs font-semibold text-foreground">
                  Libro Excel (.xlsx)
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Con fórmulas y tablas dinámicas
                </span>
              </label>

              <label
                htmlFor="fmt-pdf"
                className={`flex flex-col p-3 rounded-md border cursor-pointer transition-colors ${
                  formato === 'PDF'
                    ? 'border-primary bg-primary-soft/50 ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <RadioGroupItem value="PDF" id="fmt-pdf" />
                </div>
                <span className="text-xs font-semibold text-foreground">
                  Documento PDF
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Listo para imprimir o archivar
                </span>
              </label>
            </RadioGroup>
          </div>

          <div className="p-3 rounded-md bg-muted/40 border border-border/70 text-xs space-y-1">
            <span className="font-semibold text-foreground block">
              Contenido incluido en el archivo:
            </span>
            <ul className="text-muted-foreground text-[11px] space-y-0.5 list-disc list-inside">
              <li>Estado de Resultados (Ingresos, CMV, Gastos y Utilidad)</li>
              <li>Pre-liquidación de IGV Formulario 621 (Débito y Crédito fiscal)</li>
              <li>Ranking completo de rotación de productos</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={descargando}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleDescargar}
            disabled={descargando}
            className="text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{descargando ? 'Generando archivo...' : 'Descargar reporte'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
