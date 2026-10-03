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
import { formatCurrency } from '@/utils/formatters';
import {
  RotateCcw,
  Search,
  AlertCircle,
  CheckCircle2,
  PackageCheck,
  Receipt,
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
        {/* FORMULARIO DE DEVOLUCIÓN (5 de 12 columnas)                               */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5">
          <Card className="border-border/80 shadow-xs">
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
                  <Select
                    value={ventaId || ventas[0]?.id || ''}
                    onValueChange={handleSelectVenta}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Elige un comprobante..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ventas
                        .filter((v) => v.estado === 'COMPLETADA')
                        .map((v) => (
                          <SelectItem key={v.id} value={v.id} className="text-xs">
                            {v.serieCorrelativo} — {v.clienteNombre} ({formatCurrency(v.total)})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Seleccionar Producto dentro de la venta */}
                {ventaSeleccionada && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">2. Artículo que el cliente devuelve</Label>
                    <Select
                      value={productoId || productosEnVenta[0]?.productoId || ''}
                      onValueChange={setProductoId}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {productosEnVenta.map((it) => (
                          <SelectItem key={it.productoId} value={it.productoId} className="text-xs">
                            {it.nombre} (Compró {it.cantidad} unid. a {formatCurrency(it.precioUnitario)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* 3. Cantidad a devolver */}
                {productoSeleccionado && (
                  <div className="grid grid-cols-2 gap-3 p-2.5 rounded bg-muted/30 border border-border">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Cantidad devuelta</Label>
                      <Input
                        type="number"
                        min="1"
                        max={productoSeleccionado.cantidad}
                        value={cantidad}
                        onChange={(e) => setCantidad(Number(e.target.value))}
                        className="h-8 text-xs font-bold font-mono text-center bg-card"
                        required
                      />
                    </div>
                    <div className="text-right flex flex-col justify-center">
                      <span className="text-[10px] text-muted-foreground">Monto a reembolsar</span>
                      <span className="text-base font-bold font-mono text-primary tabular-nums">
                        {formatCurrency(cantidad * productoSeleccionado.precioUnitario)}
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Motivo */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">3. Motivo de la devolución</Label>
                  <Select value={motivo} onValueChange={setMotivo}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Error de compra del cliente (cambio conforme)">
                        Error de compra del cliente (producto en buen estado)
                      </SelectItem>
                      <SelectItem value="Falla de fábrica o deterioro">
                        Falla de fábrica / Deterioro
                      </SelectItem>
                      <SelectItem value="Vencimiento o caducidad">
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
        {/* HISTORIAL DE DEVOLUCIONES REGISTRADAS (7 de 12 columnas)                   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por comprobante, artículo o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {devolucionesFiltradas.length} registradas
            </span>
          </div>

          <div className="overflow-x-auto rounded border border-border bg-card shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b border-border">
                  <TableHead className="text-xs py-2.5">Fecha y Comprobante</TableHead>
                  <TableHead className="text-xs py-2.5">Artículo Devuelto</TableHead>
                  <TableHead className="text-xs py-2.5 text-center">Cant.</TableHead>
                  <TableHead className="text-xs py-2.5 text-right">Reembolso</TableHead>
                  <TableHead className="text-xs py-2.5">Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devolucionesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center text-xs text-muted-foreground">
                      No hay devoluciones registradas con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  devolucionesFiltradas.map((dev) => (
                    <TableRow key={dev.id} className="text-xs hover:bg-muted/20 border-b border-border/60">
                      <TableCell className="py-2.5">
                        <span className="font-mono font-bold text-foreground block">
                          {dev.serieCorrelativo}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">{dev.fecha}</span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="font-semibold text-foreground block">{dev.productoNombre}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">SKU: {dev.sku}</span>
                      </TableCell>
                      <TableCell className="py-2.5 text-center font-bold font-mono text-sm tabular-nums">
                        {dev.cantidad}
                      </TableCell>
                      <TableCell className="py-2.5 text-right font-mono font-bold text-rose-600 tabular-nums">
                        -{formatCurrency(dev.montoDevuelto)}
                      </TableCell>
                      <TableCell className="py-2.5 text-[11px] text-muted-foreground max-w-[150px]">
                        <span className="truncate block" title={dev.motivo}>
                          {dev.motivo}
                        </span>
                        <span className="text-[10px] text-foreground">Por: {dev.usuario}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};
