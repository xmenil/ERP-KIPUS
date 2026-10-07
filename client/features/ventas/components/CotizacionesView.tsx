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
import { formatMoney } from '@/utils/formatters';
import {
  FileCheck,
  PlusCircle,
  ArrowRight,
  Search,
  Calendar,
  Clock,
  Printer,
  FileText,
  User,
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
    ACEPTADA: { label: 'Aceptada', className: 'bg-primary-soft text-primary border border-primary/30' },
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
      {/* Barra superior con buscador y acción */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por N° cotización, cliente o RUC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-xs bg-card"
          />
        </div>

        <Button
          size="sm"
          onClick={() => setOpenModalCrear(true)}
          className="h-9 sm:h-8 text-xs gap-1.5 font-medium shrink-0"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Nueva Proforma / Cotización</span>
        </Button>
      </div>

      {/* Contenido: Tabla para Desktop / Tablet y Tarjetas para Móviles */}
      {cotizacionesFiltradas.length === 0 ? (
        <Card className="rounded-md border-border bg-card">
          <CardContent className="h-32 flex flex-col items-center justify-center text-center p-4">
            <FileCheck className="h-7 w-7 text-muted-foreground mb-1.5" />
            <p className="text-xs font-semibold text-foreground">
              No se encontraron cotizaciones
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Genera una nueva proforma para registrar presupuestos de clientes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* 1. Vista Desktop / Tablet (pantallas ≥ sm): Tabla Densa con min-w protegido */}
          <div className="hidden sm:block overflow-x-auto rounded-md border border-border bg-card shadow-2xs">
            <Table className="min-w-[880px]">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b border-border">
                  <TableHead className="text-xs py-2.5 w-28 whitespace-nowrap">N° Proforma</TableHead>
                  <TableHead className="text-xs py-2.5 min-w-[160px] whitespace-nowrap">Cliente / RUC</TableHead>
                  <TableHead className="text-xs py-2.5 min-w-[200px] whitespace-nowrap">Artículos Cotizados</TableHead>
                  <TableHead className="text-xs py-2.5 min-w-[150px] whitespace-nowrap">Vigencia y Vencimiento</TableHead>
                  <TableHead className="text-xs py-2.5 w-28 whitespace-nowrap">Estado</TableHead>
                  <TableHead className="text-xs py-2.5 text-right w-28 whitespace-nowrap">Total Presupuestado</TableHead>
                  <TableHead className="text-xs py-2.5 text-right w-44 whitespace-nowrap">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cotizacionesFiltradas.map((cot) => {
                  const badge = badgeEstado[cot.estado] || badgeEstado.VIGENTE;
                  const isConvertida = cot.estado === 'CONVERTIDA';

                  return (
                    <TableRow key={cot.id} className="text-xs hover:bg-muted/20 border-b border-border/60">
                      <TableCell className="font-mono font-semibold text-primary py-2.5 whitespace-nowrap">
                        {cot.numero}
                      </TableCell>

                      <TableCell className="py-2.5 min-w-[160px]">
                        <span className="font-semibold text-foreground block">{cot.clienteNombre}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Doc: {cot.clienteDocumento}
                        </span>
                      </TableCell>

                      <TableCell className="py-2.5 min-w-[200px]">
                        <span className="text-foreground block line-clamp-1">
                          {cot.items.map((it) => `${it.cantidad}x ${it.nombre}`).join(', ')}
                        </span>
                      </TableCell>

                      <TableCell className="py-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        <div>Emisión: {cot.fecha}</div>
                        <div className="text-primary font-medium">Vence: {cot.fechaVencimiento} ({cot.validezDias} días)</div>
                      </TableCell>

                      <TableCell className="py-2.5 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${badge.className}`}>
                          {badge.label}
                        </span>
                      </TableCell>

                      <TableCell className="py-2.5 text-right font-mono font-semibold text-foreground text-sm tabular-nums whitespace-nowrap">
                        {formatMoney(cot.total)}
                      </TableCell>

                      <TableCell className="py-2.5 text-right whitespace-nowrap">
                        {!isConvertida ? (
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toast.info(`Imprimiendo proforma ${cot.numero}...`)}
                              className="h-7 px-2 text-[11px] gap-1 whitespace-nowrap"
                              title="Imprimir proforma para el cliente"
                            >
                              <Printer className="h-3 w-3" />
                              <span>Imprimir</span>
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleConvertir(cot)}
                              className="h-7 px-2 text-[11px] font-semibold gap-1 bg-primary text-primary-foreground whitespace-nowrap"
                              title="Facturar proforma y emitir comprobante de venta"
                            >
                              <span>Facturar</span>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-success-text font-medium pr-2 whitespace-nowrap">
                            ✓ Venta realizada
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* 2. Vista Móvil (pantallas < sm): Tarjetas Compactas Responsivas */}
          <div className="sm:hidden space-y-2.5">
            {cotizacionesFiltradas.map((cot) => {
              const badge = badgeEstado[cot.estado] || badgeEstado.VIGENTE;
              const isConvertida = cot.estado === 'CONVERTIDA';

              return (
                <div
                  key={cot.id}
                  className="p-3.5 rounded-md border border-border bg-card space-y-2.5 shadow-2xs"
                >
                  {/* Fila 1: Código, Estado y Total */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-primary text-xs">
                          {cot.numero}
                        </span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <h4 className="font-semibold text-foreground text-xs mt-1">
                        {cot.clienteNombre}
                      </h4>
                      <span className="text-[11px] text-muted-foreground font-mono block">
                        Doc / RUC: {cot.clienteDocumento}
                      </span>
                    </div>
                    <div className="font-mono font-semibold text-foreground text-sm tabular-nums text-right">
                      {formatMoney(cot.total)}
                    </div>
                  </div>

                  {/* Fila 2: Artículos cotizados */}
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border border-border/50">
                    <span className="text-foreground font-medium block">
                      {cot.items.map((it) => `${it.cantidad}x ${it.nombre}`).join(', ')}
                    </span>
                  </div>

                  {/* Fila 3: Vigencia y emisión */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground font-mono pt-1">
                    <span>Emisión: {cot.fecha}</span>
                    <span className="text-primary font-medium">
                      Vence: {cot.fechaVencimiento} ({cot.validezDias}d)
                    </span>
                  </div>

                  {/* Fila 4: Acciones Táctiles Móviles */}
                  {!isConvertida ? (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info(`Imprimiendo proforma ${cot.numero}...`)}
                        className="h-9 text-xs gap-1.5"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Imprimir</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleConvertir(cot)}
                        className="h-9 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground"
                      >
                        <span>Facturar</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-border/60 text-right">
                      <span className="text-xs text-success-text font-medium">
                        ✓ Cotización convertida a venta
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Conteo inferior */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-0.5">
            <span>
              Mostrando {cotizacionesFiltradas.length} de {cotizaciones.length} proformas
            </span>
            <span className="font-mono text-[11px]">
              Vendedor: Carlos Vega
            </span>
          </div>
        </div>
      )}

      {/* Modal para Crear Nueva Cotización */}
      <Dialog open={openModalCrear} onOpenChange={setOpenModalCrear}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <FileCheck className="h-5 w-5 text-primary" />
              <span>Emitir Nueva Proforma / Cotización</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Presupuesto formal para clientes con vigencia temporal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCrear} className="space-y-3 pt-1 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Cliente o Empresa</Label>
              <Input
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej. Inversiones Amazonía SAC o Juan Pérez"
                className="h-9 sm:h-8 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">DNI / RUC del Cliente</Label>
                <Input
                  value={clienteDocumento}
                  onChange={(e) => setClienteDocumento(e.target.value)}
                  placeholder="20601234567 o 45678912"
                  className="h-9 sm:h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Días de Validez</Label>
                <Select
                  value={String(validezDias)}
                  onValueChange={(val) => setValidezDias(Number(val))}
                >
                  <SelectTrigger className="h-9 sm:h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7" className="text-xs">7 días hábiles</SelectItem>
                    <SelectItem value="15" className="text-xs">15 días calendario</SelectItem>
                    <SelectItem value="30" className="text-xs">30 días calendario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Artículo a presupuestar</Label>
              <Select value={productoId} onValueChange={setProductoId}>
                <SelectTrigger className="h-9 sm:h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.nombre} — {formatMoney(p.precioVenta)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                  className="h-9 sm:h-8 text-xs font-semibold font-mono text-center"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Total Presupuestado</Label>
                <div className="h-9 sm:h-8 rounded-md border border-border bg-muted/40 flex items-center justify-center font-semibold font-mono text-sm text-primary">
                  {formatMoney((prodSeleccionado?.precioVenta || 0) * cantidad)}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenModalCrear(false)}
                disabled={isSubmitting}
                className="h-9 sm:h-8 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-9 sm:h-8 text-xs font-semibold bg-primary"
              >
                {isSubmitting ? 'Guardando...' : 'Emitir Cotización'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
