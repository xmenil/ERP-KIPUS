import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Devolucion, Venta } from '../types/ventas.types';
import { formatMoney } from '@/utils/formatters';
import {
  RotateCcw,
  Search,
  AlertCircle,
  CheckCircle2,
  PackageCheck,
  Receipt,
  User,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

interface DevolucionesViewProps {
  ventas: Venta[];
  devoluciones: Devolucion[];
  onRegistrarDevolucion: (payload: {
    ventaId: string;
    productoId: string;
    cantidad: number;
    motivo: string;
    retornaAInventario: boolean;
    afectaCaja: boolean;
  }) => Promise<void>;
  ventaPreseleccionada?: Venta | null;
}

export const DevolucionesView: React.FC<DevolucionesViewProps> = ({
  ventas,
  devoluciones,
  onRegistrarDevolucion,
  ventaPreseleccionada,
}) => {
  const [ventaId, setVentaId] = useState<string>(ventaPreseleccionada?.id || '');
  const [productoId, setProductoId] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [motivo, setMotivo] = useState('Error de compra del cliente (cambio conforme)');
  const [retornaAInventario, setRetornaAInventario] = useState(true);
  const [afectaCaja, setAfectaCaja] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const ventaSeleccionada = ventas.find((v) => v.id === ventaId);
  const productosEnVenta = ventaSeleccionada?.items || [];
  const productoSeleccionado = productosEnVenta.find((p) => p.productoId === productoId) || productosEnVenta[0];

  const handleSelectVenta = (id: string) => {
    setVentaId(id);
    const v = ventas.find((item) => item.id === id);
    if (v && v.items.length > 0) {
      setProductoId(v.items[0].productoId);
      setCantidad(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ventaSeleccionada || !productoSeleccionado) {
      toast.error('Selecciona la venta y el producto a devolver');
      return;
    }

    if (cantidad <= 0 || cantidad > productoSeleccionado.cantidad) {
      toast.error(`La cantidad a devolver debe estar entre 1 y ${productoSeleccionado.cantidad}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegistrarDevolucion({
        ventaId: ventaSeleccionada.id,
        productoId: productoSeleccionado.productoId,
        cantidad: Number(cantidad),
        motivo,
        retornaAInventario,
        afectaCaja,
      });

      toast.success(
        `Devolución de ${cantidad} unid. de ${productoSeleccionado.nombre} registrada con éxito`
      );
      setCantidad(1);
    } catch {
      toast.error('No se pudo registrar la devolución');
    } finally {
      setIsSubmitting(false);
    }
  };

  const devolucionesFiltradas = devoluciones.filter(
    (d) =>
      d.serieCorrelativo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.motivo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ========================================================================= */}
        {/* FORMULARIO DE DEVOLUCIÓN (5 de 12 columnas en escritorio)                 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5">
          <Card className="border-border/80 shadow-xs rounded-md">
            <CardContent className="p-4 space-y-3.5">
              <div className="space-y-1 border-b border-border/70 pb-2.5">
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  Registrar Devolución de Mercadería
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Busca el comprobante emitido para reingresar el producto al stock y reintegrar el dinero en caja si corresponde.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                {/* 1. Seleccionar Venta */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">1. Seleccionar comprobante de venta</Label>
                  <Select value={ventaId} onValueChange={handleSelectVenta}>
                    <SelectTrigger className="h-9 sm:h-8 text-xs">
                      <SelectValue placeholder="Selecciona una venta emitida..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ventas
                        .filter((v) => v.estado === 'COMPLETADA')
                        .map((v) => (
                          <SelectItem key={v.id} value={v.id} className="text-xs">
                            <span className="font-mono font-semibold">{v.serieCorrelativo}</span> — {v.clienteNombre} ({formatMoney(v.total)})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Seleccionar Producto */}
                {ventaSeleccionada && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">2. Producto a retornar</Label>
                    <Select
                      value={productoId || productosEnVenta[0]?.productoId}
                      onValueChange={setProductoId}
                    >
                      <SelectTrigger className="h-9 sm:h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {productosEnVenta.map((item) => (
                          <SelectItem key={item.productoId} value={item.productoId} className="text-xs">
                            {item.nombre} (Vendidas: {item.cantidad} unid.)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* 3. Cantidad y Reembolso */}
                {productoSeleccionado && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">
                        Cantidad (Máx: {productoSeleccionado.cantidad})
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max={productoSeleccionado.cantidad}
                        value={cantidad}
                        onChange={(e) => setCantidad(Number(e.target.value))}
                        className="h-9 sm:h-8 font-semibold font-mono text-center text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Monto a Devolver</Label>
                      <div className="h-9 sm:h-8 rounded-md border border-border bg-danger-soft flex items-center justify-center font-semibold font-mono text-xs text-danger-text tabular-nums">
                        -{formatMoney(productoSeleccionado.precioUnitario * cantidad)}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Motivo */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Motivo de la devolución</Label>
                  <Select value={motivo} onValueChange={setMotivo}>
                    <SelectTrigger className="h-9 sm:h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Error de compra del cliente (cambio conforme)">
                        Error de compra del cliente
                      </SelectItem>
                      <SelectItem value="Producto defectuoso / empaque dañado">
                        Producto defectuoso / empaque dañado
                      </SelectItem>
                      <SelectItem value="Vencimiento de fecha">
                        Vencimiento de fecha
                      </SelectItem>
                      <SelectItem value="Despacho erróneo en mostrador">
                        Despacho erróneo en mostrador
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 5. Opciones de Impacto */}
                <div className="space-y-2 pt-1 border-t border-border/60">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="retornaInv"
                      checked={retornaAInventario}
                      onCheckedChange={(c) => setRetornaAInventario(!!c)}
                    />
                    <label htmlFor="retornaInv" className="text-xs text-foreground font-medium cursor-pointer">
                      Reingresar unidades al stock del almacén (Kardex)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="afectaCaja"
                      checked={afectaCaja}
                      onCheckedChange={(c) => setAfectaCaja(!!c)}
                    />
                    <label htmlFor="afectaCaja" className="text-xs text-foreground font-medium cursor-pointer">
                      Reembolsar dinero de caja chica (egreso en turno)
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !ventaSeleccionada}
                  className="w-full h-9 font-semibold text-xs gap-1.5 mt-2 bg-primary"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{isSubmitting ? 'Procesando...' : 'Confirmar Devolución'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* HISTORIAL DE DEVOLUCIONES REGISTRADAS (7 de 12 columnas en escritorio)    */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por comprobante, artículo o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs bg-card"
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono text-right">
              {devolucionesFiltradas.length} registradas
            </span>
          </div>

          {devolucionesFiltradas.length === 0 ? (
            <Card className="rounded-md border-border bg-card">
              <CardContent className="h-32 flex flex-col items-center justify-center text-center p-4">
                <RotateCcw className="h-7 w-7 text-muted-foreground mb-1.5" />
                <p className="text-xs font-semibold text-foreground">
                  No hay devoluciones registradas
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Las devoluciones que registres desde comprobantes se listarán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* 1. Vista Desktop / Tablet (pantallas ≥ sm): Tabla Densa protegida */}
              <div className="hidden sm:block overflow-x-auto rounded-md border border-border bg-card shadow-2xs">
                <Table className="min-w-[680px]">
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-b border-border">
                      <TableHead className="text-xs py-2.5 whitespace-nowrap">Fecha y Comprobante</TableHead>
                      <TableHead className="text-xs py-2.5 min-w-[160px] whitespace-nowrap">Artículo Devuelto</TableHead>
                      <TableHead className="text-xs py-2.5 text-center whitespace-nowrap">Cant.</TableHead>
                      <TableHead className="text-xs py-2.5 text-right whitespace-nowrap">Reembolso</TableHead>
                      <TableHead className="text-xs py-2.5 min-w-[140px] whitespace-nowrap">Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devolucionesFiltradas.map((dev) => (
                      <TableRow key={dev.id} className="text-xs hover:bg-muted/20 border-b border-border/60">
                        <TableCell className="py-2.5 whitespace-nowrap">
                          <span className="font-mono font-semibold text-foreground block">
                            {dev.serieCorrelativo}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">{dev.fecha}</span>
                        </TableCell>
                        <TableCell className="py-2.5 min-w-[160px]">
                          <span className="font-semibold text-foreground block">{dev.productoNombre}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">SKU: {dev.sku}</span>
                        </TableCell>
                        <TableCell className="py-2.5 text-center font-semibold font-mono text-sm tabular-nums whitespace-nowrap">
                          {dev.cantidad}
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono font-semibold text-danger-text tabular-nums whitespace-nowrap">
                          -{formatMoney(dev.montoDevuelto)}
                        </TableCell>
                        <TableCell className="py-2.5 text-[11px] text-muted-foreground min-w-[140px]">
                          <span className="truncate block" title={dev.motivo}>
                            {dev.motivo}
                          </span>
                          <span className="text-[10px] text-foreground">Por: {dev.usuario}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 2. Vista Móvil (pantallas < sm): Tarjetas Compactas Responsivas */}
              <div className="sm:hidden space-y-2.5">
                {devolucionesFiltradas.map((dev) => (
                  <div
                    key={dev.id}
                    className="p-3.5 rounded-md border border-border bg-card space-y-2 shadow-2xs text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-semibold text-primary block">
                          {dev.serieCorrelativo}
                        </span>
                        <h4 className="font-semibold text-foreground text-xs mt-0.5">
                          {dev.productoNombre}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-mono block">
                          SKU: {dev.sku}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-semibold text-danger-text text-sm tabular-nums block">
                          -{formatMoney(dev.montoDevuelto)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {dev.cantidad} unid. devueltas
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate max-w-[180px]">
                        Motivo: {dev.motivo}
                      </span>
                      <span className="font-mono text-[10px]">{dev.fecha}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Conteo inferior */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-0.5">
                <span>
                  Mostrando {devolucionesFiltradas.length} de {devoluciones.length} devoluciones
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
