import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Proveedor } from '../types/proveedores.types';
import { formatCurrency } from '@/utils/formatters';
import {
  Phone,
  Mail,
  MapPin,
  Edit,
  Copy,
  Check,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ProveedorDetalleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedor: Proveedor | null;
  onEditarClick: (prov: Proveedor) => void;
}

export const ProveedorDetalleModal: React.FC<ProveedorDetalleModalProps> = ({
  open,
  onOpenChange,
  proveedor,
  onEditarClick,
}) => {
  const navigate = useNavigate();
  const [copiado, setCopiado] = useState(false);
  const [activeTab, setActiveTab] = useState<'DATOS' | 'COMPRAS'>('DATOS');

  if (!proveedor) return null;

  const handleCopiarRuc = () => {
    navigator.clipboard.writeText(proveedor.ruc);
    setCopiado(true);
    toast.success('RUC copiado al portapapeles');
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleIrACompras = () => {
    onOpenChange(false);
    navigate('/compras');
  };

  const cleanPhone = proveedor.telefono ? proveedor.telefono.replace(/\s+/g, '') : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-lg">
        {/* Cabecera con Avatar e Identidad de Empresa */}
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                {proveedor.nombreComercial
                  ? proveedor.nombreComercial.slice(0, 2).toUpperCase()
                  : proveedor.razonSocial.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base sm:text-lg font-semibold text-foreground">
                    {proveedor.nombreComercial || proveedor.razonSocial}
                  </DialogTitle>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      proveedor.activo !== false
                        ? 'bg-success-soft text-success-text border border-success/20'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {proveedor.activo !== false ? 'Homologado' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {proveedor.razonSocial}
                </p>
              </div>
            </div>

            {/* Código y Botón de Editar */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEditarClick(proveedor);
                }}
                className="h-8 text-xs font-semibold gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Editar</span>
              </Button>
            </div>
          </div>

          {/* RUC con Copiar */}
          <div className="flex items-center gap-2 pt-2 text-xs">
            <span className="text-muted-foreground">RUC Fiscal:</span>
            <button
              type="button"
              onClick={handleCopiarRuc}
              className="inline-flex items-center gap-1 font-mono font-semibold text-foreground bg-muted/50 hover:bg-muted px-2 py-0.5 rounded border border-border transition-colors cursor-pointer"
              title="Copiar RUC"
            >
              <span>{proveedor.ruc}</span>
              {copiado ? (
                <Check className="h-3 w-3 text-success-text" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
            <span className="text-[11px] text-muted-foreground">•</span>
            <span className="text-[11px] text-primary font-medium">{proveedor.rubro}</span>
          </div>
        </DialogHeader>

        {/* Barra de Tabs del Detalle */}
        <div className="flex items-center border-b border-border/60 px-4 sm:px-6 bg-card text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('DATOS')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'DATOS'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Ficha General y Contacto
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COMPRAS')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'COMPRAS'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Condiciones y Compras
          </button>
        </div>

        {/* Contenido según Tab con Scroll interior */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'DATOS' ? (
            <div className="space-y-4">
              {/* Canales Rápidos de Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Teléfono */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Teléfono
                    </span>
                    <span className="text-xs font-semibold text-foreground font-mono">
                      {proveedor.telefono || 'No registrado'}
                    </span>
                  </div>
                  {cleanPhone && (
                    <a
                      href={`tel:${cleanPhone}`}
                      className="p-1.5 rounded-md bg-card border border-border text-primary hover:bg-muted transition-colors"
                      title="Llamar"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="p-3 rounded-lg bg-success-soft/50 border border-success/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-success-text uppercase font-semibold block">
                      WhatsApp Asesor
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {proveedor.contacto || 'Asesor'}
                    </span>
                  </div>
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/51${cleanPhone}?text=Hola,%20nos%20comunicamos%20desde%20KIPUS%20ERP`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-md bg-card border border-success/30 text-success-text hover:bg-success-soft transition-colors"
                      title="Abrir chat de WhatsApp"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {/* Email */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                      Email Pedidos
                    </span>
                    <span className="text-xs font-semibold text-foreground line-clamp-1">
                      {proveedor.correo || 'No registrado'}
                    </span>
                  </div>
                  {proveedor.correo && (
                    <a
                      href={`mailto:${proveedor.correo}`}
                      className="p-1.5 rounded-md bg-card border border-border text-primary hover:bg-muted transition-colors"
                      title="Enviar correo"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Ubicación y Domicilio Fiscal */}
              <div className="p-4 rounded-lg bg-card border border-border space-y-2 text-xs">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  Dirección y Domicilio Fiscal
                </span>
                <p className="text-foreground font-medium pl-5">
                  {proveedor.direccion || 'Sin dirección registrada'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-5 pt-1 text-[11px] text-muted-foreground">
                  <div>
                    <span>Ciudad:</span> <strong className="text-foreground">{proveedor.ciudad || 'Lima'}</strong>
                  </div>
                  <div>
                    <span>Provincia:</span> <strong className="text-foreground">{proveedor.provincia || 'Lima'}</strong>
                  </div>
                  <div>
                    <span>Código Postal:</span> <strong className="text-foreground font-mono">{proveedor.codigoPostal || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Descripción / Notas */}
              {proveedor.descripcion && (
                <div className="p-3.5 rounded-lg bg-muted/20 border border-border text-xs space-y-1">
                  <span className="font-semibold text-foreground block">
                    Notas y Políticas del Proveedor:
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    {proveedor.descripcion}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* TAB: CONDICIONES Y COMPRAS */
            <div className="space-y-4">
              {/* Tarjetas de Resumen Financiero */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-card border border-border space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Total Comprado Histórico
                  </span>
                  <div className="text-2xl font-bold text-foreground font-mono tabular-nums">
                    {formatCurrency(proveedor.totalCompras || 0)}
                  </div>
                  <span className="text-[10px] text-muted-foreground block">
                    Volumen total de facturación acumulada
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-card border border-border space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Saldo Pendiente de Pago
                  </span>
                  <div
                    className={`text-2xl font-bold font-mono tabular-nums ${
                      (proveedor.saldoPendiente || 0) > 0 ? 'text-danger-text' : 'text-success-text'
                    }`}
                  >
                    {formatCurrency(proveedor.saldoPendiente || 0)}
                  </div>
                  <span className="text-[10px] text-muted-foreground block">
                    {(proveedor.saldoPendiente || 0) > 0
                      ? 'Cuentas por pagar pendientes de liquidación'
                      : 'Al día, sin deudas pendientes'}
                  </span>
                </div>
              </div>

              {/* Condiciones Comerciales Acordadas */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border text-xs space-y-2.5">
                <span className="font-semibold text-foreground block">
                  Términos de Crédito y Pago:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Condición comercial:</span>
                    <span className="font-semibold text-foreground">{proveedor.condicionPago}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Días de crédito:</span>
                    <span className="font-semibold text-foreground font-mono tabular-nums">
                      {proveedor.diasCredito ? `${proveedor.diasCredito} días` : 'Contado'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Límite de crédito:</span>
                    <span className="font-semibold text-foreground font-mono tabular-nums">
                      {proveedor.limiteCredito ? formatCurrency(proveedor.limiteCredito) : 'Sin límite'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Fecha registro:</span>
                    <span className="font-medium text-foreground">{proveedor.fechaRegistro || '2025'}</span>
                  </div>
                </div>
              </div>

              {/* Botón para Emitir Orden de Compra */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    ¿Necesitas abastecer mercadería?
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Genera una orden de compra o recepciona mercadería en almacén.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleIrACompras}
                  className="font-semibold text-xs gap-1.5 shrink-0"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Ir a Compras</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-3 sm:p-4 border-t border-border/60 bg-muted/20 shrink-0 flex flex-row items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-9 font-medium"
          >
            Cerrar ficha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
