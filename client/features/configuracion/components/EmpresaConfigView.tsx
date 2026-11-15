import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatosEmpresa } from '../types/configuracion.types';
import { Building, Save, Phone, Mail, MapPin, Receipt, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface EmpresaConfigViewProps {
  empresa: DatosEmpresa;
  onUpdateEmpresa: (field: string, val: string) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export const EmpresaConfigView: React.FC<EmpresaConfigViewProps> = ({
  empresa,
  onUpdateEmpresa,
  onSave,
  isSaving,
}) => {
  const [localSaving, setLocalSaving] = useState(false);
  const [errorRuc, setErrorRuc] = useState('');

  const handleRucChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    onUpdateEmpresa('ruc', clean);
    if (clean.length > 0 && clean.length !== 11) {
      setErrorRuc('El RUC debe tener 11 dígitos numéricos.');
    } else {
      setErrorRuc('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (empresa.ruc.trim().length !== 11) {
      setErrorRuc('El RUC debe tener exactamente 11 dígitos.');
      toast.error('Corrige el RUC antes de guardar.');
      return;
    }

    setLocalSaving(true);
    try {
      await onSave();
      toast.success(
        `Datos de "${empresa.nombreComercial || empresa.razonSocial}" actualizados correctamente`
      );
    } catch {
      toast.error('Error al guardar los datos de la empresa');
    } finally {
      setLocalSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Formulario Fiscal (7 columnas) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Building className="h-4 w-4 text-primary" />
                <span>Identificación Fiscal del Emisor</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Información tributaria registrada ante SUNAT para comprobantes de pago.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">RUC del Negocio</Label>
                  <Input
                    value={empresa.ruc}
                    onChange={(e) => handleRucChange(e.target.value)}
                    className={`h-8 text-xs font-mono font-semibold ${errorRuc ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                    maxLength={11}
                    required
                  />
                  {errorRuc && (
                    <p className="text-[10.5px] text-destructive mt-0.5">{errorRuc}</p>
                  )}
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold">Razón Social Legal</Label>
                  <Input
                    value={empresa.razonSocial}
                    onChange={(e) => onUpdateEmpresa('razonSocial', e.target.value)}
                    className="h-8 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre Comercial / Marca</Label>
                  <Input
                    value={empresa.nombreComercial}
                    onChange={(e) => onUpdateEmpresa('nombreComercial', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Régimen Tributario</Label>
                  <Input
                    value={empresa.regimenTributario}
                    onChange={(e) => onUpdateEmpresa('regimenTributario', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Ubicación y Canales de Contacto</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Dirección física del establecimiento principal que figurará en el pie del ticket.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="space-y-1">
                <Label className="text-xs">Dirección Fiscal / Sede Central</Label>
                <Input
                  value={empresa.direccionFiscal}
                  onChange={(e) => onUpdateEmpresa('direccionFiscal', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Teléfonos / Central</Label>
                  <Input
                    value={empresa.telefono}
                    onChange={(e) => onUpdateEmpresa('telefono', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Correo Electrónico de Facturación</Label>
                  <Input
                    type="email"
                    value={empresa.correo}
                    onChange={(e) => onUpdateEmpresa('correo', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={isSaving || localSaving}
              className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-5 h-8 text-xs shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving || localSaving ? 'Guardando...' : 'Guardar Datos de Empresa'}</span>
            </Button>
          </div>
        </div>

        {/* Columna Derecha: Simulador de Membrete Térmico en Vivo (5 columnas) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-primary" />
              <span>Previsualización en Comprobante</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              Formato Térmico 80mm
            </span>
          </div>

          <div className="border border-border/80 rounded-lg p-5 bg-card shadow-xs font-mono text-[11px] space-y-3 border-dashed relative">
            <div className="text-center space-y-1 border-b border-border/60 pb-3">
              <p className="font-bold text-xs uppercase tracking-tight text-foreground">
                {empresa.nombreComercial || "MINIMARKET KIPU'S"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {empresa.razonSocial || "Comercial Kipu's E.I.R.L."}
              </p>
              <p className="font-semibold text-primary">
                RUC: {empresa.ruc || '20608821941'}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {empresa.direccionFiscal || 'Jr. Tito Jaime 450 - Tingo María'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Tel: {empresa.telefono || '(062) 562-180'}
              </p>
            </div>

            <div className="text-center py-1 text-[10px] text-muted-foreground space-y-0.5">
              <p className="font-bold text-foreground">BOLETA DE VENTA ELECTRÓNICA</p>
              <p>B001 - 000484</p>
              <p>15/11/2026 10:45:12</p>
            </div>

            <div className="border-t border-b border-border/60 py-1.5 text-[10px] space-y-1">
              <div className="flex justify-between font-semibold">
                <span>DESCRIPCIÓN</span>
                <span>TOTAL</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>1x ACEITE PRIMOR 900ML</span>
                <span>S/ 8.50</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>2x LECHE GLORIA AZUL 400G</span>
                <span>S/ 8.40</span>
              </div>
            </div>

            <div className="text-right text-[10px] font-bold space-y-0.5 pt-1">
              <p>TOTAL A PAGAR: S/ 16.90</p>
            </div>

            <div className="text-center text-[9px] text-muted-foreground pt-2 border-t border-border/60">
              <p className="italic">¡Gracias por su compra! Vuelva pronto.</p>
              <p className="text-[8px] text-muted-foreground/60 mt-1">Representación impresa autorizada por SUNAT</p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-border/60 bg-muted/30 text-[11px] text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Los cambios se reflejarán inmediatamente en las impresiones del punto de venta POS.</span>
          </div>
        </div>
      </div>
    </form>
  );
};
