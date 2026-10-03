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
import { Proveedor } from '../types/proveedores.types';
import { formatCurrency } from '@/utils/formatters';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Calendar,
  ExternalLink,
  Edit,
  Copy,
  Check,
  ShoppingBag,
  Clock,
  Sparkles,
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
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Cabecera con Avatar e Identidad de Empresa */}
        <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                {proveedor.nombreComercial
                  ? proveedor.nombreComercial.slice(0, 2).toUpperCase()
                  : proveedor.razonSocial.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold text-foreground">
                    {proveedor.nombreComercial || proveedor.razonSocial}
                  </DialogTitle>
                  <span
                    className={`inline-flex items-center px-2 py-0.2 rounded-full text-[11px] font-bold ${
                      proveedor.activo !== false
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {proveedor.activo !== false ? '🟢 Homologado' : 'Inactivo'}
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
              className="inline-flex items-center gap-1 font-mono font-bold text-foreground bg-muted/50 hover:bg-muted px-2 py-0.5 rounded border border-border transition-colors"
              title="Copiar RUC"
            >
              <span>{proveedor.ruc}</span>
              {copiado ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
            <span className="text-[11px] text-muted-foreground">•</span>
            <span className="text-[11px] text-primary font-medium">{proveedor.rubro}</span>
          </div>
        </DialogHeader>

        {/* Barra de Tabs del Detalle */}
        <div className="flex items-center border-b border-border/60 px-6 bg-card text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('DATOS')}
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors ${
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
            className={`py-2.5 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'COMPRAS'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Condiciones y Compras
          </button>
        </div>

        {/* Contenido según Tab */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {activeTab === 'DATOS' ? (
            <div className="space-y-4">
              {/* Canales Rápidos de Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Teléfono */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border/70 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      Teléfono
                    </span>
                    <span className="text-xs font-bold text-foreground font-mono">
                      {proveedor.telefono || 'No registrado'}
                    </span>
                  </div>
                  {cleanPhone && (
                    <a
                      href={`tel:${cleanPhone}`}
                      className="p-1.5 rounded-lg bg-card border border-border text-primary hover:bg-primary/5 transition-colors"
                      title="Llamar"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                      WhatsApp Asesor
                    </span>
                    <span className="text-xs font-bold text-emerald-950">
                      {proveedor.contacto || 'Asesor'}
                    </span>
                  </div>
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/51${cleanPhone}?text=Hola,%20nos%20comunicamos%20desde%20KIPUS%20ERP`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Abrir chat de WhatsApp"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {/* Email */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border/70 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      Email Pedidos
                    </span>
                    <span className="text-xs font-semibold text-foreground line-clamp-1">
                      {proveedor.correo || 'No registrado'}
                    </span>
                  </div>
                  {proveedor.correo && (
                    <a
                      href={`mailto:${proveedor.correo}`}
                      className="p-1.5 rounded-lg bg-card border border-border text-primary hover:bg-primary/5 transition-colors"
                      title="Enviar correo"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Ubicación y Domicilio Fiscal */}
              <div className="p-4 rounded-xl bg-card border border-border space-y-2 text-xs">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  Dirección y Domicilio Fiscal
                </span>
                <p className="text-foreground font-medium pl-5">
                  {proveedor.direccion || 'Sin dirección registrada'}
                </p>
                <div className="grid grid-cols-3 gap-2 pl-5 pt-1 text-[11px] text-muted-foreground">
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
                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 text-xs space-y-1">
                  <span className="font-bold text-foreground block">
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
              {/* Tarjetas de Resumen Financiero con este Proveedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-card border border-border space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Total Comprado Histórico
                  </span>
                  <div className="text-2xl font-bold text-foreground tabular-nums">
                    {formatCurrency(proveedor.totalCompras || 0)}
                  </div>
                  <span className="text-[10px] text-muted-foreground block">
                    Volumen total de facturación acumulada
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Saldo Pendiente de Pago
                  </span>
                  <div
                    className={`text-2xl font-bold tabular-nums ${
                      (proveedor.saldoPendiente || 0) > 0 ? 'text-rose-600' : 'text-emerald-700'
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
              <div className="p-4 rounded-xl bg-muted/30 border border-border/70 text-xs space-y-2.5">
                <span className="font-bold text-foreground block">
                  Términos de Crédito y Pago:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Condición comercial:</span>
                    <span className="font-bold text-foreground">{proveedor.condicionPago}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Días de crédito concedidos:</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {proveedor.diasCredito ? `${proveedor.diasCredito} días` : 'Contado'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Límite de crédito autorizado:</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {proveedor.limiteCredito ? formatCurrency(proveedor.limiteCredito) : 'Sin límite'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Fecha de homologación:</span>
                    <span className="font-medium text-foreground">{proveedor.fechaRegistro || '2025'}</span>
                  </div>
                </div>
              </div>

              {/* Botón para Emitir Orden de Compra */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    ¿Necesitas abastecer mercadería?
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Genera una orden de compra o recepciona mercadería en almacén.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleIrACompras}
                  className="font-semibold text-xs gap-1.5"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Ir a Compras
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border/60 bg-muted/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs"
          >
            Cerrar ficha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
