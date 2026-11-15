import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Cliente } from '../types/clientes.types';
import { clientesService } from '../services/clientesService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Receipt,
  MessageSquare,
  Copy,
  Check,
  Edit,
  DollarSign,
  AlertTriangle,
  History,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface ClienteDetalleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente | null;
  onEditarClick?: (cliente: Cliente) => void;
  onAbonarClick?: (cliente: Cliente) => void;
}

export const ClienteDetalleSheet: React.FC<ClienteDetalleSheetProps> = ({
  open,
  onOpenChange,
  cliente,
  onEditarClick,
  onAbonarClick,
}) => {
  const [copiado, setCopiado] = useState(false);
  const [compras, setCompras] = useState<any[]>([]);
  const [loadingCompras, setLoadingCompras] = useState(false);

  useEffect(() => {
    if (cliente && open) {
      setLoadingCompras(true);
      clientesService
        .getHistorialCompras(cliente.numeroDocumento)
        .then((data) => setCompras(data))
        .finally(() => setLoadingCompras(false));
    }
  }, [cliente, open]);

  if (!cliente) return null;

  const handleCopiarDoc = () => {
    navigator.clipboard.writeText(cliente.numeroDocumento);
    setCopiado(true);
    toast.success(`${cliente.documentoTipo} ${cliente.numeroDocumento} copiado al portapapeles`);
    setTimeout(() => setCopiado(false), 2000);
  };

  const cleanPhone = cliente.telefono ? cliente.telefono.replace(/\s+/g, '') : '';
  const mensajeWhatsapp = encodeURIComponent(
    `Hola ${cliente.nombre}, le saludamos de KIPU'S ERP. Le recordamos que su cuenta registra un saldo de ${formatCurrency(cliente.saldoPendiente || 0)}. ¡Muchas gracias por su preferencia!`
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto flex flex-col p-6">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-base shrink-0">
                {cliente.nombre.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <SheetTitle className="text-base font-bold text-foreground text-left leading-tight">
                  {cliente.nombre}
                </SheetTitle>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleCopiarDoc}
                    className="inline-flex items-center gap-1 font-mono font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    title="Copiar documento"
                  >
                    <span>{cliente.documentoTipo}: {cliente.numeroDocumento}</span>
                    {copiado ? <Check className="h-3 w-3 text-success-text" /> : <Copy className="h-3 w-3" />}
                  </button>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground uppercase">
                    {cliente.tipoCliente || 'MINORISTA'}
                  </span>
                </div>
              </div>
            </div>

            {cliente.saldoPendiente > 0 ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-danger-soft text-danger-text border border-destructive/20 shrink-0">
                Debe {formatCurrency(cliente.saldoPendiente)}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-success-soft text-success-text border border-success/20 shrink-0">
                Al día
              </span>
            )}
          </div>

          {/* Botones de Contacto Rápido */}
          <div className="flex items-center gap-2 pt-2">
            {cleanPhone && (
              <a
                href={`https://wa.me/51${cleanPhone}?text=${mensajeWhatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-success-soft text-success-text hover:bg-success-soft/80 font-semibold text-xs transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
            {cleanPhone && (
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-border text-foreground hover:bg-muted font-medium text-xs transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Llamar</span>
              </a>
            )}
            {onEditarClick && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5"
                onClick={() => onEditarClick(cliente)}
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Editar</span>
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Resumen Métrico Rápido */}
        <div className="grid grid-cols-3 gap-2 py-3 text-center border-b border-border/70">
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Compras Acum.</span>
            <span className="font-mono font-bold text-xs text-foreground">
              {formatCurrency(cliente.totalCompras || 0)}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Saldo Fiado</span>
            <span
              className={`font-mono font-bold text-xs ${
                (cliente.saldoPendiente || 0) > 0 ? 'text-danger-text' : 'text-success-text'
              }`}
            >
              {formatCurrency(cliente.saldoPendiente || 0)}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Límite Crédito</span>
            <span className="font-mono font-bold text-xs text-muted-foreground">
              {formatCurrency(cliente.limiteCredito || 300)}
            </span>
          </div>
        </div>

        {/* Pestañas de Detalle */}
        <Tabs defaultValue="compras" className="w-full flex-1 pt-2 space-y-3">
          <TabsList className="w-full bg-muted/60 p-0.5 grid grid-cols-2">
            <TabsTrigger value="compras" className="text-xs font-semibold py-1">
              Historial de Compras ({compras.length})
            </TabsTrigger>
            <TabsTrigger value="datos" className="text-xs font-semibold py-1">
              Datos & Ubicación
            </TabsTrigger>
          </TabsList>

          {/* Pestaña: Historial de Compras */}
          <TabsContent value="compras" className="space-y-3 m-0 focus-visible:outline-none">
            {loadingCompras ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Cargando historial de compras...
              </div>
            ) : compras.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                <Receipt className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="font-semibold text-foreground">Aún no registra compras asociadas</p>
                <p className="text-[11px]">Las boletas o facturas emitidas aparecerán aquí.</p>
              </div>
            ) : (
              <div className="border border-border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="text-xs">
                      <TableHead className="py-2">Comprobante</TableHead>
                      <TableHead className="py-2">Fecha</TableHead>
                      <TableHead className="py-2 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compras.map((v) => (
                      <TableRow key={v.id} className="text-xs">
                        <TableCell className="py-2">
                          <span className="font-mono font-semibold text-primary block">{v.serieNumero}</span>
                          <span className="text-[10px] text-muted-foreground">{v.tipoComprobante}</span>
                        </TableCell>
                        <TableCell className="py-2 font-mono text-muted-foreground text-[11px]">
                          {formatDate(v.fecha)}
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono font-bold text-foreground">
                          {formatCurrency(v.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Pestaña: Datos & Ubicación */}
          <TabsContent value="datos" className="space-y-3 m-0 focus-visible:outline-none text-xs">
            <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/60">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Dirección</span>
                  <span className="text-foreground font-medium">
                    {cliente.direccion || 'Sin dirección registrada'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1 border-t border-border/40">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Correo Electrónico</span>
                  <span className="text-foreground font-medium">{cliente.correo || 'Sin correo registrado'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1 border-t border-border/40">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Estado de Crédito</span>
                  <span className="text-foreground font-medium">
                    Límite autorizado: {formatCurrency(cliente.limiteCredito || 300)} · Saldo ocupado:{' '}
                    {formatCurrency(cliente.saldoPendiente || 0)}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <SheetFooter className="pt-4 border-t border-border flex flex-col sm:flex-row gap-2">
          {cliente.saldoPendiente > 0 && onAbonarClick && (
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onAbonarClick(cliente);
              }}
              className="w-full sm:w-auto text-xs bg-primary text-primary-foreground font-semibold gap-1.5"
            >
              <DollarSign className="h-4 w-4" />
              <span>Registrar Abono a Deuda</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cerrar Ficha
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
