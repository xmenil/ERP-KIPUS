import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { NuevaCompraPayload, CompraItemDetalle } from '../types/compras.types';
import { productosService } from '@/features/productos/services/productosService';
import { proveedoresService } from '@/features/proveedores/services/proveedoresService';
import { Producto } from '@/features/productos/types/productos.types';
import { Proveedor } from '@/features/proveedores/types/proveedores.types';
import { formatCurrency, formatNumber, pluralizeUnit } from '@/utils/formatters';
import {
  Truck,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  PackageCheck,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NuevaCompraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompraRegistrada: (payload: NuevaCompraPayload) => Promise<void>;
  itemsIniciales?: CompraItemDetalle[] | null;
  proveedorInicial?: { razonSocial: string; ruc: string } | null;
  onAbrirRecomendacion?: () => void;
}

export const NuevaCompraDialog: React.FC<NuevaCompraDialogProps> = ({
  open,
  onOpenChange,
  onCompraRegistrada,
  itemsIniciales = null,
  proveedorInicial = null,
  onAbrirRecomendacion,
}) => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorSeleccionadoId, setProveedorSeleccionadoId] = useState<string>('');
  const [proveedorNombre, setProveedorNombre] = useState('Alicorp S.A.A.');
  const [proveedorRuc, setProveedorRuc] = useState('20100055237');
  const [serieFactura, setSerieFactura] = useState('');
  const [metodoPago, setMetodoPago] = useState('TRANSFERENCIA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorInput, setErrorInput] = useState<string | null>(null);

  const [catalogo, setCatalogo] = useState<Producto[]>([]);
  const [itemsCompra, setItemsCompra] = useState<CompraItemDetalle[]>([]);
  const [productoAAgregarId, setProductoAAgregarId] = useState('');

  // Cargar catálogo y proveedores
  useEffect(() => {
    if (open) {
      Promise.all([
        productosService.getProductos(),
        proveedoresService.getProveedores(),
      ]).then(([prods, provs]) => {
        setCatalogo(prods);
        setProveedores(provs);

        // Si se pasaron items desde la recomendación inteligente
        if (itemsIniciales && itemsIniciales.length > 0) {
          setItemsCompra(itemsIniciales);
        } else if (prods.length > 0) {
          // Si no hay items, iniciar con 1 producto del catálogo
          const p = prods[0];
          setItemsCompra([
            {
              productoId: p.id,
              sku: p.sku,
              nombre: p.nombre,
              cantidad: 24,
              precioUnitario: p.precioCompra,
              subtotal: +(24 * p.precioCompra).toFixed(2),
            },
          ]);
        }

        // Configurar proveedor inicial
        if (proveedorInicial) {
          setProveedorNombre(proveedorInicial.razonSocial);
          setProveedorRuc(proveedorInicial.ruc);
          const matchProv = provs.find((p) => p.ruc === proveedorInicial.ruc);
          if (matchProv) setProveedorSeleccionadoId(matchProv.id);
        } else if (provs.length > 0) {
          setProveedorSeleccionadoId(provs[0].id);
          setProveedorNombre(provs[0].razonSocial);
          setProveedorRuc(provs[0].ruc);
        }

        setSerieFactura(`F001-${Math.floor(1000 + Math.random() * 9000)}`);
      });
    }
  }, [open, itemsIniciales, proveedorInicial]);

  const handleSelectProveedor = (provId: string) => {
    setProveedorSeleccionadoId(provId);
    const prov = proveedores.find((p) => p.id === provId);
    if (prov) {
      setProveedorNombre(prov.razonSocial);
      setProveedorRuc(prov.ruc);
    }
  };

  // Cálculos automáticos de la orden de compra
  const totalCalculado = +itemsCompra.reduce((sum, it) => sum + it.subtotal, 0).toFixed(2);
  const itemsCountTotal = itemsCompra.reduce((sum, it) => sum + it.cantidad, 0);

  // Manejar cambios en la lista de ítems
  const handleCambiarCantidadItem = (index: number, cantidad: number) => {
    const cantLimpia = Math.max(1, Math.floor(cantidad || 1));
    setItemsCompra((prev) =>
      prev.map((it, i) => {
        if (i === index) {
          return {
            ...it,
            cantidad: cantLimpia,
            subtotal: +(cantLimpia * it.precioUnitario).toFixed(2),
          };
        }
        return it;
      })
    );
  };

  const handleCambiarPrecioItem = (index: number, precio: number) => {
    const precioLimpio = Math.max(0, +(precio || 0));
    setItemsCompra((prev) =>
      prev.map((it, i) => {
        if (i === index) {
          return {
            ...it,
            precioUnitario: precioLimpio,
            subtotal: +(it.cantidad * precioLimpio).toFixed(2),
          };
        }
        return it;
      })
    );
  };

  const handleEliminarItem = (index: number) => {
    if (itemsCompra.length <= 1) {
      toast.error('La orden debe contener al menos 1 producto.');
      return;
    }
    setItemsCompra((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAgregarProducto = () => {
    if (!productoAAgregarId) return;
    const prod = catalogo.find((p) => p.id === productoAAgregarId);
    if (!prod) return;

    // Si ya está, incrementar cantidad
    const indexExistente = itemsCompra.findIndex((i) => i.productoId === prod.id);
    if (indexExistente >= 0) {
      handleCambiarCantidadItem(indexExistente, itemsCompra[indexExistente].cantidad + 12);
      toast.info(`Se sumaron 12 unidades a ${prod.nombre}`);
    } else {
      setItemsCompra((prev) => [
        ...prev,
        {
          productoId: prod.id,
          sku: prod.sku,
          nombre: prod.nombre,
          cantidad: 12,
          precioUnitario: prod.precioCompra,
          subtotal: +(12 * prod.precioCompra).toFixed(2),
        },
      ]);
    }
    setProductoAAgregarId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInput(null);

    if (!proveedorNombre.trim()) {
      setErrorInput('Ingresa la razón social del proveedor.');
      return;
    }
    if (itemsCompra.length === 0) {
      setErrorInput('Agrega al menos un producto a la orden de compra.');
      return;
    }
    if (totalCalculado <= 0) {
      setErrorInput('El monto total de la factura debe ser mayor a S/ 0.00.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCompraRegistrada({
        proveedorNombre: proveedorNombre.trim(),
        proveedorRuc: proveedorRuc.trim() || '20100055237',
        serieFactura: serieFactura.trim() || `F001-${Math.floor(1000 + Math.random() * 9000)}`,
        total: totalCalculado,
        metodoPago,
        itemsCount: itemsCountTotal,
        items: itemsCompra,
        origenSugerencia: Boolean(itemsIniciales && itemsIniciales.length > 0),
      });
      onOpenChange(false);
      setErrorInput(null);
    } catch {
      setErrorInput('Ocurrió un error al registrar la compra. Inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <span>Nueva Orden de Compra y Recepción</span>
                  {itemsIniciales && itemsIniciales.length > 0 && (
                    <span className="text-[10px] font-semibold bg-primary-soft text-primary px-2 py-0.5 rounded">
                      Sugerida por Ventas/Stock
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Registra la compra de mercadería. El inventario en almacén y Kardex se actualizarán automáticamente.
                </DialogDescription>
              </div>
            </div>

            {onAbrirRecomendacion && (!itemsIniciales || itemsIniciales.length === 0) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAbrirRecomendacion}
                className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary-soft"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ver recomendación</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Datos del Proveedor y Factura */}
          <div className="rounded-lg border border-border bg-card p-3.5 space-y-3">
            <div className="text-xs font-bold text-foreground">Datos del Proveedor y Comprobante</div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-foreground">Proveedor Registrado</Label>
                <Select value={proveedorSeleccionadoId} onValueChange={handleSelectProveedor}>
                  <SelectTrigger className="h-8 text-xs border-border bg-background">
                    <SelectValue placeholder="Elegir proveedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        {p.razonSocial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-foreground">Razón Social</Label>
                <Input
                  value={proveedorNombre}
                  onChange={(e) => setProveedorNombre(e.target.value)}
                  className="h-8 text-xs border-border bg-background font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-foreground">RUC (11 dígitos)</Label>
                <Input
                  value={proveedorRuc}
                  onChange={(e) => setProveedorRuc(e.target.value)}
                  maxLength={11}
                  className="h-8 text-xs font-mono border-border bg-background"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-foreground">N° Factura / Serie de Compra</Label>
                <Input
                  value={serieFactura}
                  onChange={(e) => setSerieFactura(e.target.value)}
                  placeholder="F001-008921"
                  className="h-8 text-xs font-mono uppercase border-border bg-background font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-foreground">Medio de Pago</Label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger className="h-8 text-xs border-border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRANSFERENCIA" className="text-xs">
                      Transferencia Bancaria (BCP / BBVA / Interbank)
                    </SelectItem>
                    <SelectItem value="EFECTIVO" className="text-xs">
                      Efectivo (Descuenta automáticamente de Caja)
                    </SelectItem>
                    <SelectItem value="CREDITO_30_DIAS" className="text-xs">
                      Crédito a 30 días
                    </SelectItem>
                    <SelectItem value="TARJETA" className="text-xs">
                      Tarjeta Débito / Crédito
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tabla de Productos a Abastecer */}
          <div className="rounded-lg border border-border bg-card p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
              <div>
                <span className="text-xs font-bold text-foreground">
                  Productos a Ingresar al Almacén ({itemsCompra.length})
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Puedes ajustar las unidades a comprar y el costo de adquisición de cada artículo.
                </p>
              </div>

              {/* Selector para agregar producto adicional */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <Select value={productoAAgregarId} onValueChange={setProductoAAgregarId}>
                  <SelectTrigger className="h-7 w-48 text-xs border-border bg-background">
                    <SelectValue placeholder="+ Agregar otro producto..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {catalogo.map((prod) => (
                      <SelectItem key={prod.id} value={prod.id} className="text-xs">
                        {prod.nombre} (Stock: {prod.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAgregarProducto}
                  disabled={!productoAAgregarId}
                  className="h-7 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Añadir
                </Button>
              </div>
            </div>

            {/* Lista tabular de ítems */}
            <div className="border border-border/80 rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="border-border">
                    <TableHead className="text-xs font-semibold py-2 px-2.5">Producto</TableHead>
                    <TableHead className="text-xs font-semibold py-2 px-2.5 text-center w-28">
                      Cantidad
                    </TableHead>
                    <TableHead className="text-xs font-semibold py-2 px-2.5 text-right w-28">
                      Costo Unit. (S/)
                    </TableHead>
                    <TableHead className="text-xs font-semibold py-2 px-2.5 text-right w-28">
                      Subtotal (S/)
                    </TableHead>
                    <TableHead className="w-10 text-center py-2 px-1"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsCompra.map((item, index) => (
                    <TableRow key={`${item.productoId}-${index}`} className="border-border/60">
                      <TableCell className="py-2 px-2.5">
                        <div className="font-semibold text-xs text-foreground line-clamp-1">
                          {item.nombre}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">{item.sku}</div>
                      </TableCell>

                      <TableCell className="py-1 px-2 text-center">
                        <Input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => handleCambiarCantidadItem(index, Number(e.target.value))}
                          className="h-7 w-20 mx-auto text-xs font-mono font-bold text-center tabular-nums bg-background border-border"
                        />
                      </TableCell>

                      <TableCell className="py-1 px-2 text-right">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.precioUnitario}
                          onChange={(e) => handleCambiarPrecioItem(index, Number(e.target.value))}
                          className="h-7 w-20 ml-auto text-xs font-mono font-bold text-right tabular-nums bg-background border-border"
                        />
                      </TableCell>

                      <TableCell className="text-right py-2 px-2.5 font-mono text-xs font-bold tabular-nums text-foreground">
                        {formatCurrency(item.subtotal)}
                      </TableCell>

                      <TableCell className="text-center py-2 px-1">
                        <button
                          type="button"
                          onClick={() => handleEliminarItem(index)}
                          className="text-muted-foreground hover:text-danger-text p-1 transition-colors"
                          title="Eliminar de la orden"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totalizadores en vivo */}
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/20 border border-border/60 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Total de unidades a ingresar:</span>
                <span className="font-mono font-bold text-foreground tabular-nums">
                  {formatNumber(itemsCountTotal)} {pluralizeUnit(itemsCountTotal, 'unidad')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Total de la Factura:</span>
                <span className="text-base font-bold font-mono text-primary tabular-nums">
                  {formatCurrency(totalCalculado)}
                </span>
              </div>
            </div>
          </div>

          {errorInput && (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorInput}</span>
            </div>
          )}
        </form>

        <DialogFooter className="p-3 sm:p-4 border-t border-border bg-muted/20 shrink-0 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-9 text-xs"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || itemsCompra.length === 0 || totalCalculado <= 0}
            className="h-9 text-xs bg-primary text-primary-foreground font-semibold hover:bg-primary-hover shadow-xs gap-1.5"
          >
            {isSubmitting ? (
              <span>Registrando ingreso…</span>
            ) : (
              <>
                <PackageCheck className="h-4 w-4" />
                <span>Recepcionar y Abastecer ({formatCurrency(totalCalculado)})</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
