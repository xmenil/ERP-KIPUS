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
import { Pedido, EstadoPedido } from '../types/ventas.types';
import { Producto } from '@/features/productos/types/productos.types';
import { Cliente } from '@/features/clientes/types/clientes.types';
import { formatMoney } from '@/utils/formatters';
import {
  ShoppingBag,
  Plus,
  Clock,
  CheckCircle2,
  Package,
  Check,
  Send,
  ArrowRight,
  Search,
  PlusCircle,
  Phone,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface PedidosViewProps {
  pedidos: Pedido[];
  productos: Producto[];
  clientes: Cliente[];
  onCambiarEstado: (id: string, nuevoEstado: EstadoPedido) => Promise<void>;
  onConvertirAVenta: (pedidoId: string) => Promise<void>;
  onCrearPedido: (payload: Omit<Pedido, 'id' | 'codigo' | 'fecha'>) => Promise<void>;
}

export const PedidosView: React.FC<PedidosViewProps> = ({
  pedidos,
  productos,
  clientes,
  onCambiarEstado,
  onConvertirAVenta,
  onCrearPedido,
}) => {
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | EstadoPedido>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [openModalCrear, setOpenModalCrear] = useState(false);

  // Formulario nuevo pedido
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [productoId, setProductoId] = useState(productos[0]?.id || '');
  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prodSeleccionado = productos.find((p) => p.id === productoId) || productos[0];

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim()) {
      toast.error('Indica el nombre del cliente');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCrearPedido({
        clienteNombre: clienteNombre.trim(),
        clienteTelefono: clienteTelefono.trim() || undefined,
        fechaEntrega: fechaEntrega || undefined,
        estado: 'PENDIENTE',
        total: (prodSeleccionado?.precioVenta || 0) * cantidad,
        sucursal: 'Sede Central (Tingo María)',
        notas: notas.trim() || undefined,
        items: [
          {
            productoId: prodSeleccionado.id,
            nombre: prodSeleccionado.nombre,
            cantidad,
            precioUnitario: prodSeleccionado.precioVenta,
            subtotal: prodSeleccionado.precioVenta * cantidad,
          },
        ],
      });

      toast.success('Pedido registrado con éxito');
      setOpenModalCrear(false);
      setClienteNombre('');
      setClienteTelefono('');
      setNotas('');
    } catch {
      toast.error('No se pudo crear el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacturar = async (pedido: Pedido) => {
    try {
      await onConvertirAVenta(pedido.id);
      toast.success(`Pedido ${pedido.codigo} facturado y convertido a venta.`);
    } catch {
      toast.error('No se pudo convertir el pedido');
    }
  };

  const estadosBadge: Record<EstadoPedido, { label: string; className: string }> = {
    PENDIENTE: { label: 'Pendiente', className: 'bg-muted text-muted-foreground' },
    CONFIRMADO: { label: 'Confirmado', className: 'bg-primary-soft text-primary border border-primary/20' },
    PREPARANDO: { label: 'En Preparación', className: 'bg-warning-soft text-warning-text border border-warning/20' },
    LISTO: { label: 'Listo p/ Entrega', className: 'bg-primary-soft text-primary border border-primary/30' },
    ENTREGADO: { label: 'Entregado / Facturado', className: 'bg-success-soft text-success-text border border-success/20' },
    CANCELADO: { label: 'Cancelado', className: 'bg-danger-soft text-danger-text border border-destructive/20' },
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    const matchEstado = filtroEstado === 'TODOS' || p.estado === filtroEstado;
    const matchSearch =
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchEstado && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Barra superior con filtros y acción */}
      <div className="flex flex-col xl:flex-row gap-2.5 items-stretch xl:items-center justify-between">
        <div className="relative w-full xl:w-72 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por código de pedido o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-xs bg-card"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Segmented controls de estados con scroll horizontal en móvil */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['TODOS', 'PENDIENTE', 'CONFIRMADO', 'PREPARANDO', 'LISTO', 'ENTREGADO'].map((est) => (
              <button
                key={est}
                type="button"
                onClick={() => setFiltroEstado(est as any)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer whitespace-nowrap font-medium ${
                  filtroEstado === est
                    ? 'bg-primary text-primary-foreground border-primary font-semibold'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
                }`}
              >
                {est === 'TODOS' ? 'Todos' : est}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => setOpenModalCrear(true)}
            className="h-9 sm:h-8 text-xs gap-1.5 font-medium shrink-0"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Nuevo Pedido</span>
          </Button>
        </div>
      </div>

      {/* Contenido: Tabla para Desktop / Tablet y Tarjetas para Móviles */}
      {pedidosFiltrados.length === 0 ? (
        <Card className="rounded-md border-border bg-card">
          <CardContent className="h-32 flex flex-col items-center justify-center text-center p-4">
            <ShoppingBag className="h-7 w-7 text-muted-foreground mb-1.5" />
            <p className="text-xs font-semibold text-foreground">
              No se encontraron pedidos
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Prueba cambiando el filtro de estado o la búsqueda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* 1. Vista Desktop / Tablet (pantallas ≥ sm): Tabla Densa protegida con min-w */}
          <div className="hidden sm:block overflow-x-auto rounded-md border border-border bg-card shadow-2xs">
            <Table className="min-w-[880px]">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b border-border">
                  <TableHead className="text-xs py-2.5 w-28 whitespace-nowrap">N° Pedido</TableHead>
                  <TableHead className="text-xs py-2.5 min-w-[160px] whitespace-nowrap">Cliente & Contacto</TableHead>
                  <TableHead className="text-xs py-2.5 min-w-[200px] whitespace-nowrap">Productos</TableHead>
                  <TableHead className="text-xs py-2.5 min-w-[140px] whitespace-nowrap">Fecha / Entrega</TableHead>
                  <TableHead className="text-xs py-2.5 w-28 whitespace-nowrap">Estado</TableHead>
                  <TableHead className="text-xs py-2.5 text-right w-24 whitespace-nowrap">Total</TableHead>
                  <TableHead className="text-xs py-2.5 text-right w-44 whitespace-nowrap">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidosFiltrados.map((ped) => {
                  const badge = estadosBadge[ped.estado] || estadosBadge.PENDIENTE;
                  const isFinalizado = ped.estado === 'ENTREGADO' || ped.estado === 'CANCELADO';

                  return (
                    <TableRow key={ped.id} className="text-xs hover:bg-muted/20 border-b border-border/60">
                      <TableCell className="font-mono font-semibold text-primary py-2.5 whitespace-nowrap">
                        {ped.codigo}
                      </TableCell>

                      <TableCell className="py-2.5 min-w-[160px]">
                        <span className="font-semibold text-foreground block">{ped.clienteNombre}</span>
                        {ped.clienteTelefono && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Tel: {ped.clienteTelefono}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-2.5 min-w-[200px]">
                        <span className="text-foreground block line-clamp-1">
                          {ped.items.map((it) => `${it.cantidad}x ${it.nombre}`).join(', ')}
                        </span>
                        {ped.notas && (
                          <span className="text-[10px] text-muted-foreground italic truncate block">
                            Nota: {ped.notas}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        <div>Emisión: {ped.fecha}</div>
                        {ped.fechaEntrega && (
                          <div className="text-primary font-medium">Entrega: {ped.fechaEntrega}</div>
                        )}
                      </TableCell>

                      <TableCell className="py-2.5 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${badge.className}`}>
                          {badge.label}
                        </span>
                      </TableCell>

                      <TableCell className="py-2.5 text-right font-mono font-semibold text-foreground text-sm tabular-nums whitespace-nowrap">
                        {formatMoney(ped.total)}
                      </TableCell>

                      <TableCell className="py-2.5 text-right whitespace-nowrap">
                        {!isFinalizado ? (
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <Select
                              value={ped.estado}
                              onValueChange={(val: EstadoPedido) => onCambiarEstado(ped.id, val)}
                            >
                              <SelectTrigger className="h-7 text-[11px] w-28 bg-card">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDIENTE" className="text-xs">Pendiente</SelectItem>
                                <SelectItem value="CONFIRMADO" className="text-xs">Confirmar</SelectItem>
                                <SelectItem value="PREPARANDO" className="text-xs">Preparando</SelectItem>
                                <SelectItem value="LISTO" className="text-xs">Listo</SelectItem>
                                <SelectItem value="CANCELADO" className="text-xs text-danger-text">Cancelar</SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              size="sm"
                              onClick={() => handleFacturar(ped)}
                              className="h-7 px-2 text-[11px] font-semibold gap-1 whitespace-nowrap"
                              title="Emitir venta y descontar de inventario"
                            >
                              <span>Facturar</span>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-medium pr-2 whitespace-nowrap">
                            {ped.estado === 'ENTREGADO' ? '✓ Facturado' : '✕ Cancelado'}
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
            {pedidosFiltrados.map((ped) => {
              const badge = estadosBadge[ped.estado] || estadosBadge.PENDIENTE;
              const isFinalizado = ped.estado === 'ENTREGADO' || ped.estado === 'CANCELADO';

              return (
                <div
                  key={ped.id}
                  className="p-3.5 rounded-md border border-border bg-card space-y-2.5 shadow-2xs"
                >
                  {/* Fila 1: Código, Estado y Total */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-primary text-xs">
                          {ped.codigo}
                        </span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <h4 className="font-semibold text-foreground text-xs mt-1">
                        {ped.clienteNombre}
                      </h4>
                    </div>
                    <div className="font-mono font-semibold text-foreground text-sm tabular-nums text-right">
                      {formatMoney(ped.total)}
                    </div>
                  </div>

                  {/* Fila 2: Artículos y Notas */}
                  <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border border-border/50">
                    <span className="text-foreground font-medium block">
                      {ped.items.map((it) => `${it.cantidad}x ${it.nombre}`).join(', ')}
                    </span>
                    {ped.notas && (
                      <span className="text-[11px] italic text-muted-foreground block mt-0.5">
                        Nota: {ped.notas}
                      </span>
                    )}
                  </div>

                  {/* Fila 3: Metadatos de contacto y fecha */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground font-mono pt-1">
                    {ped.clienteTelefono ? (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {ped.clienteTelefono}
                      </span>
                    ) : (
                      <span>Sin teléfono</span>
                    )}
                    <span>
                      {ped.fechaEntrega ? `Entrega: ${ped.fechaEntrega}` : `Emisión: ${ped.fecha}`}
                    </span>
                  </div>

                  {/* Fila 4: Acciones Táctiles Móviles */}
                  {!isFinalizado ? (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                      <Select
                        value={ped.estado}
                        onValueChange={(val: EstadoPedido) => onCambiarEstado(ped.id, val)}
                      >
                        <SelectTrigger className="h-9 text-xs bg-card">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDIENTE" className="text-xs">Pendiente</SelectItem>
                          <SelectItem value="CONFIRMADO" className="text-xs">Confirmar</SelectItem>
                          <SelectItem value="PREPARANDO" className="text-xs">Preparando</SelectItem>
                          <SelectItem value="LISTO" className="text-xs">Listo</SelectItem>
                          <SelectItem value="CANCELADO" className="text-xs text-danger-text">Cancelar</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        onClick={() => handleFacturar(ped)}
                        className="h-9 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground"
                      >
                        <span>Facturar</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-border/60 text-right">
                      <span className="text-xs text-muted-foreground font-medium">
                        {ped.estado === 'ENTREGADO' ? '✓ Pedido facturado' : '✕ Pedido cancelado'}
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
              Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos
            </span>
            <span className="font-mono text-[11px]">
              Filtro: {filtroEstado}
            </span>
          </div>
        </div>
      )}

      {/* Modal para Crear Nuevo Pedido */}
      <Dialog open={openModalCrear} onOpenChange={setOpenModalCrear}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span>Registrar Nuevo Pedido Anticipado</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Guarda el encargo de tu cliente antes de despachar o cobrar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCrear} className="space-y-3 pt-1 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Nombre del Cliente</Label>
              <Input
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej. Distribuidora San Juan o María Elena"
                className="h-9 sm:h-8 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Teléfono / WhatsApp</Label>
                <Input
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  placeholder="984 123 456"
                  className="h-9 sm:h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Fecha y Hora Entrega</Label>
                <Input
                  type="datetime-local"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  className="h-9 sm:h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Producto a encargar</Label>
              <Select value={productoId} onValueChange={setProductoId}>
                <SelectTrigger className="h-9 sm:h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.nombre} — {formatMoney(p.precioVenta)} (Disp: {p.stock})
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
                <Label className="text-xs font-medium">Total Estimado</Label>
                <div className="h-9 sm:h-8 rounded-md border border-border bg-muted/40 flex items-center justify-center font-semibold font-mono text-sm text-primary">
                  {formatMoney((prodSeleccionado?.precioVenta || 0) * cantidad)}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Notas o indicaciones</Label>
              <Input
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Recoge en moto a las 5pm"
                className="h-9 sm:h-8 text-xs"
              />
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
                {isSubmitting ? 'Guardando...' : 'Crear Pedido'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
