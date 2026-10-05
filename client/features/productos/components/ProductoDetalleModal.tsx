import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Producto } from '../types/productos.types';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import {
  Package,
  Edit,
  Trash2,
  Copy,
  Check,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Hash,
  Scale,
  MapPin,
  DollarSign,
  Boxes,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductoDetalleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto: Producto | null;
  onEditarClick: (prod: Producto) => void;
  onEliminarClick: (prod: Producto) => void;
  puedeVerCostos?: boolean;
}

export const ProductoDetalleModal: React.FC<ProductoDetalleModalProps> = ({
  open,
  onOpenChange,
  producto,
  onEditarClick,
  onEliminarClick,
  puedeVerCostos = true,
}) => {
  const [copiado, setCopiado] = useState(false);

  if (!producto) return null;

  const margenSoles = +(producto.precioVenta - producto.precioCompra).toFixed(2);
  const margenPorcentaje =
    producto.precioVenta > 0
      ? +((margenSoles / producto.precioVenta) * 100).toFixed(1)
      : 0;

  const estaAgotado = producto.stock === 0;
  const esStockBajo = producto.stock <= producto.stockMinimo && !estaAgotado;

  const valorizadoCosto = +(producto.stock * producto.precioCompra).toFixed(2);
  const valorizadoVenta = +(producto.stock * producto.precioVenta).toFixed(2);

  const handleCopiarSku = () => {
    navigator.clipboard.writeText(producto.sku);
    setCopiado(true);
    toast.success(`SKU ${producto.sku} copiado al portapapeles`);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-xl">
        {/* Cabecera con Identidad del Producto */}
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                <Package className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    {producto.nombre}
                  </DialogTitle>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                      estaAgotado
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200'
                        : esStockBajo
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200'
                    }`}
                  >
                    {estaAgotado
                      ? 'Sin Stock'
                      : esStockBajo
                      ? 'Stock Bajo'
                      : 'Stock Óptimo'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{producto.categoria}</span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={handleCopiarSku}
                    className="inline-flex items-center gap-1 font-mono font-bold text-primary hover:underline"
                    title="Copiar SKU"
                  >
                    <Hash className="h-3 w-3" />
                    <span>{producto.sku}</span>
                    {copiado ? (
                      <Check className="h-3 w-3 text-emerald-600 ml-0.5" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Botones de acción rápida en cabecera */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEditarClick(producto);
                }}
                className="h-8 text-xs gap-1.5 border-border"
              >
                <Edit className="h-3.5 w-3.5 text-primary" />
                <span>Editar</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEliminarClick(producto);
                }}
                className="h-8 text-xs gap-1.5 border-border text-danger-text hover:bg-danger-soft hover:border-destructive/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Eliminar</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Contenido con Métricas y Datos del Producto */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Tarjetas KPI de Precios y Ganancia */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {puedeVerCostos && (
              <div className="p-3 rounded-lg bg-card border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium block">
                  Precio Costo
                </span>
                <span className="text-base sm:text-lg font-mono font-bold text-foreground tabular-nums">
                  {formatCurrency(producto.precioCompra)}
                </span>
              </div>
            )}

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
              <span className="text-[11px] text-primary font-semibold block">
                Precio Venta (Público)
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-primary tabular-nums">
                {formatCurrency(producto.precioVenta)}
              </span>
            </div>

            {puedeVerCostos && (
              <div className="p-3 rounded-lg bg-card border border-border space-y-1 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium">Margen</span>
                  <span className="text-[11px] font-bold text-emerald-600">
                    +{margenPorcentaje}%
                  </span>
                </div>
                <span className="text-base sm:text-lg font-mono font-bold text-emerald-600 tabular-nums">
                  +{formatCurrency(margenSoles)}
                </span>
              </div>
            )}
          </div>

          {/* Tarjetas de Existencias y Almacén */}
          <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-3">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Boxes className="h-4 w-4 text-primary" />
              Nivel de Existencias y Control de Inventario
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-muted-foreground block">Stock Disponible</span>
                <span className="text-lg font-mono font-bold text-foreground tabular-nums">
                  {formatNumber(producto.stock)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  {producto.unidadMedida.toLowerCase()}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-muted-foreground block">Stock Mínimo (Alerta)</span>
                <span className="text-lg font-mono font-bold text-muted-foreground tabular-nums">
                  {formatNumber(producto.stockMinimo)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  {producto.unidadMedida.toLowerCase()}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] text-muted-foreground block">Ubicación</span>
                <span className="text-xs font-medium text-foreground">
                  {producto.ubicacion || 'Mostrador principal'}
                </span>
              </div>
            </div>
          </div>

          {/* Valorización en Almacén */}
          {puedeVerCostos && (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-card border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium block">
                  Valorizado al Costo
                </span>
                <span className="text-sm sm:text-base font-mono font-bold text-foreground tabular-nums">
                  {formatCurrency(valorizadoCosto)}
                </span>
                <span className="text-[10px] text-muted-foreground block">Capital invertido en stock</span>
              </div>

              <div className="p-3 rounded-lg bg-card border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium block">
                  Valorizado a la Venta
                </span>
                <span className="text-sm sm:text-base font-mono font-bold text-primary tabular-nums">
                  {formatCurrency(valorizadoVenta)}
                </span>
                <span className="text-[10px] text-muted-foreground block">Ingreso potencial bruto</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 sm:p-6 pt-3 border-t border-border bg-muted/10 shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            ID: <span className="font-mono">{producto.id}</span>
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
