import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Cotizacion, EstadoCotizacion } from '../types/ventas.types';
import { Producto } from '@/features/productos/types/productos.types';
import { Cliente } from '@/features/clientes/types/clientes.types';
import { formatCurrency } from '@/utils/formatters';
import {
  FileCheck,
  PlusCircle,
  ArrowRight,
  Search,
  Calendar,
  Clock,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';

interface CotizacionesViewProps {
  cotizaciones: Cotizacion[];
  productos: Producto[];
  clientes: Cliente[];
  onConvertirAVenta: (cotizacionId: string) => Promise<void>;
  onCrearCotizacion: (payload: Omit<Cotizacion, 'id' | 'numero' | 'fecha'>) => Promise<void>;
}

export const CotizacionesView: React.FC<CotizacionesViewProps> = ({
  cotizaciones,
  productos,
  clientes,
  onConvertirAVenta,
  onCrearCotizacion,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openModalCrear, setOpenModalCrear] = useState(false);

  // Formulario nueva cotización
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteDocumento, setClienteDocumento] = useState('');
  const [validezDias, setValidezDias] = useState(15);
  const [productoId, setProductoId] = useState(productos[0]?.id || '');
  const [cantidad, setCantidad] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prodSeleccionado = productos.find((p) => p.id === productoId) || productos[0];

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim()) {
      toast.error('Indica el nombre o razón social del cliente');
      return;
    }

    const total = (prodSeleccionado?.precioVenta || 0) * cantidad;
    const subtotal = +(total / 1.18).toFixed(2);
    const igv = +(total - subtotal).toFixed(2);

    const fechaHoy = new Date();
    const fechaVence = new Date();
    fechaVence.setDate(fechaHoy.getDate() + validezDias);

    setIsSubmitting(true);
    try {
      await onCrearCotizacion({
        clienteNombre: clienteNombre.trim(),
        clienteDocumento: clienteDocumento.trim() || '00000000',
        fechaVencimiento: fechaVence.toISOString().slice(0, 10),
        validezDias,
        estado: 'VIGENTE',
        subtotal,
        igv,
        total,
        vendedor: 'Carlos Vega',
        items: [
          {
            productoId: prodSeleccionado.id,
            nombre: prodSeleccionado.nombre,
            cantidad,
            precioUnitario: prodSeleccionado.precioVenta,
            subtotal: total,
          },
        ],
      });

      toast.success('Proforma / Cotización emitida correctamente');
      setOpenModalCrear(false);
      setClienteNombre('');
      setClienteDocumento('');
    } catch {
      toast.error('No se pudo crear la cotización');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertir = async (cot: Cotizacion) => {
    try {
      await onConvertirAVenta(cot.id);
      toast.success(`Cotización ${cot.numero} convertida a venta con éxito`);
    } catch {
      toast.error('No se pudo convertir la cotización');
    }
  };

  const badgeEstado: Record<EstadoCotizacion, { label: string; className: string }> = {
    VIGENTE: { label: 'Vigente', className: 'bg-primary-soft text-primary border border-primary/20' },
    ACEPTADA: { label: 'Aceptada', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 border border-blue-200' },
    CONVERTIDA: { label: 'Convertida a Venta', className: 'bg-success-soft text-success-text border border-success/20' },
    VENCIDA: { label: 'Vencida', className: 'bg-danger-soft text-danger-text border border-destructive/20' },
  };

  const cotizacionesFiltradas = cotizaciones.filter(
    (c) =>
      c.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clienteDocumento.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por N° cotización, cliente o RUC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <Button
          size="sm"
          onClick={() => setOpenModalCrear(true)}
          className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Nueva Proforma / Cotización</span>
        </Button>
      </div>

      {/* Tabla de cotizaciones */}
      <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 border-b border-border">
              <TableHead className="text-xs py-2.5 w-28">N° Proforma</TableHead>
              <TableHead className="text-xs py-2.5">Cliente / RUC</TableHead>
              <TableHead className="text-xs py-2.5">Artículos Cotizados</TableHead>
              <TableHead className="text-xs py-2.5">Vigencia y Vencimiento</TableHead>
              <TableHead className="text-xs py-2.5">Estado</TableHead>
              <TableHead className="text-xs py-2.5 text-right">Total Presupuestado</TableHead>
              <TableHead className="text-xs py-2.5 text-right w-44">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cotizacionesFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-xs text-muted-foreground">
                  No se encontraron cotizaciones con los filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              cotizacionesFiltradas.map((cot) => {
                const badge = badgeEstado[cot.estado] || badgeEstado.VIGENTE;
                const isConvertida = cot.estado === 'CONVERTIDA';

                return (
                  <TableRow key={cot.id} className="text-xs hover:bg-muted/20 border-b border-border/60">
                    <TableCell className="font-mono font-bold text-primary py-2.5">
                      {cot.numero}
                    </TableCell>

                    <TableCell className="py-2.5">
                      <span className="font-semibold text-foreground block">{cot.clienteNombre}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Doc: {cot.clienteDocumento}
                      </span>
                    </TableCell>

                    <TableCell className="py-2.5">
                      <span className="text-foreground block line-clamp-1">
                        {cot.items.map((it) => `${it.cantidad}x ${it.nombre}`).join(', ')}
                      </span>
                    </TableCell>

                    <TableCell className="py-2.5 font-mono text-[11px] text-muted-foreground">
                      <div>Emisión: {cot.fecha}</div>
                      <div className="text-primary">Vence: {cot.fechaVencimiento} ({cot.validezDias} días)</div>
                    </TableCell>

                    <TableCell className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </TableCell>

                    <TableCell className="py-2.5 text-right font-mono font-bold text-foreground text-sm tabular-nums">
                      {formatCurrency(cot.total)}
                    </TableCell>

                    <TableCell className="py-2.5 text-right">
                      {!isConvertida ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.info(`Imprimiendo proforma ${cot.numero}...`)}
                            className="h-7 px-2 text-[11px] gap-1"
                            title="Imprimir proforma para el cliente"
                          >
                            <Printer className="h-3 w-3" />
                            <span>Imprimir</span>
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleConvertir(cot)}
                            className="h-7 px-2 text-[11px] font-semibold gap-1 bg-primary text-primary-foreground"
                            title="Facturar proforma y emitir comprobante de venta"
                          >
                            <span>Facturar</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-medium pr-2">
                          ✓ Venta emitida
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal para Crear Nueva Cotización */}
      <Dialog open={openModalCrear} onOpenChange={setOpenModalCrear}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <FileCheck className="h-5 w-5 text-primary" />
              <span>Emitir Cotización / Proforma</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Presupuesto formal para clientes comerciales o empresas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCrear} className="space-y-3 pt-1 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Cliente / Empresa</Label>
              <Input
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej. Constructora del Sur S.A.C."
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">RUC o DNI</Label>
                <Input
                  value={clienteDocumento}
                  onChange={(e) => setClienteDocumento(e.target.value)}
                  placeholder="20601299443"
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Validez de la oferta</Label>
                <Select
                  value={String(validezDias)}
                  onValueChange={(val) => setValidezDias(Number(val))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7" className="text-xs">7 días hábiles</SelectItem>
                    <SelectItem value="15" className="text-xs">15 días calendario</SelectItem>
                    <SelectItem value="30" className="text-xs">30 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Producto a cotizar</Label>
              <Select value={productoId} onValueChange={setProductoId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.nombre} — {formatCurrency(p.precioVenta)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Cantidad a cotizar</Label>
                <Input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                  className="h-8 text-xs font-bold font-mono text-center"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Total Cotizado</Label>
                <div className="h-8 rounded border border-border bg-muted/40 flex items-center justify-center font-bold font-mono text-sm text-primary">
                  {formatCurrency((prodSeleccionado?.precioVenta || 0) * cantidad)}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenModalCrear(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="font-semibold bg-primary">
                {isSubmitting ? 'Guardando...' : 'Emitir Cotización'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
