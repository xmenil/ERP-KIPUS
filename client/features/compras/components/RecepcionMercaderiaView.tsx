import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MetricCard } from '@/components/common/MetricCard';
import { Compra, CompraItemDetalle } from '../types/compras.types';
import { comprasService } from '../services/comprasService';
import { productosService } from '@/features/productos/services/productosService';
import { Producto } from '@/features/productos/types/productos.types';
import { formatCurrency, formatDate, pluralizeUnit } from '@/utils/formatters';
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  ClipboardList,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface RecepcionMercaderiaViewProps {
  compras: Compra[];
  compraSeleccionadaId?: string | null;
  onRecepcionCompletada?: () => void;
}

interface ItemRecepcionState {
  productoId: string;
  sku: string;
  nombre: string;
  cantidadOrdenada: number;
  cantidadRecibida: number;
  costoUnitario: number;
  costoActualProducto?: number;
  stockActualProducto?: number;
}

export const RecepcionMercaderiaView: React.FC<RecepcionMercaderiaViewProps> = ({
  compras,
  compraSeleccionadaId = null,
  onRecepcionCompletada,
}) => {
  // Filtrar órdenes que se puedan recepcionar (no anuladas ni completadas)
  const ordenesPorRecepcionar = useMemo(() => {
    return compras.filter((c) => c.estado !== 'ANULADO' && c.estado !== 'RECIBIDO');
  }, [compras]);

  const [ordenActivaId, setOrdenActivaId] = useState<string>(() => {
    if (compraSeleccionadaId) return compraSeleccionadaId;
    return ordenesPorRecepcionar.length > 0 ? ordenesPorRecepcionar[0].id : '';
  });

  useEffect(() => {
    if (compraSeleccionadaId) {
      setOrdenActivaId(compraSeleccionadaId);
    } else if (!ordenActivaId && ordenesPorRecepcionar.length > 0) {
      setOrdenActivaId(ordenesPorRecepcionar[0].id);
    }
  }, [compraSeleccionadaId, ordenesPorRecepcionar]);

  const ordenActual = useMemo(() => {
    return compras.find((c) => c.id === ordenActivaId) || null;
  }, [compras, ordenActivaId]);

  // Datos del cotejo
  const [guiaRemision, setGuiaRemision] = useState('T001-000429');
  const [recepcionadoPor, setRecepcionadoPor] = useState('Carlos Vega (Almacenero)');
  const [observaciones, setObservaciones] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ítems a verificar y cotizar
  const [itemsRecepcion, setItemsRecepcion] = useState<ItemRecepcionState[]>([]);
  const [productosMap, setProductosMap] = useState<Record<string, Producto>>({});

  useEffect(() => {
    productosService.getProductos().then((prods) => {
      const map: Record<string, Producto> = {};
      prods.forEach((p) => {
        map[p.id] = p;
        if (p.sku) map[p.sku] = p;
      });
      setProductosMap(map);
    });
  }, []);

  // Inicializar items al cambiar la orden activa
  useEffect(() => {
    if (ordenActual) {
      if (ordenActual.items && ordenActual.items.length > 0) {
        setItemsRecepcion(
          ordenActual.items.map((it) => {
            const prod = productosMap[it.productoId] || productosMap[it.sku];
            return {
              productoId: it.productoId,
              sku: it.sku,
              nombre: it.nombre,
              cantidadOrdenada: it.cantidad,
              cantidadRecibida: it.cantidadRecibida ?? it.cantidad,
              costoUnitario: it.precioUnitario,
              costoActualProducto: prod?.precioCompra ?? it.precioUnitario,
              stockActualProducto: prod?.stock ?? 0,
            };
          })
        );
      } else {
        // Fallback genérico si la orden fue resumida
        setItemsRecepcion([
          {
            productoId: 'prod-item-1',
            sku: 'SKU-REC-01',
            nombre: `Lote de mercadería factura ${ordenActual.serieFactura}`,
            cantidadOrdenada: ordenActual.itemsCount || 10,
            cantidadRecibida: ordenActual.itemsCount || 10,
            costoUnitario: ordenActual.itemsCount > 0 ? +(ordenActual.total / ordenActual.itemsCount).toFixed(2) : 10,
            costoActualProducto: 10,
            stockActualProducto: 15,
          },
        ]);
      }
    } else {
      setItemsRecepcion([]);
    }
  }, [ordenActual, productosMap]);

  const handleCambiarCantidadRecibida = (index: number, val: number) => {
    const cant = Math.max(0, Math.floor(val || 0));
    setItemsRecepcion((prev) =>
      prev.map((it, i) => (i === index ? { ...it, cantidadRecibida: cant } : it))
    );
  };

  const handleCambiarCostoUnitario = (index: number, val: number) => {
    const cost = Math.max(0, +(val || 0));
    setItemsRecepcion((prev) =>
      prev.map((it, i) => (i === index ? { ...it, costoUnitario: cost } : it))
    );
  };

  const totalOrdenado = useMemo(
    () => itemsRecepcion.reduce((sum, it) => sum + it.cantidadOrdenada, 0),
    [itemsRecepcion]
  );
  const totalRecibido = useMemo(
    () => itemsRecepcion.reduce((sum, it) => sum + it.cantidadRecibida, 0),
    [itemsRecepcion]
  );
  const hayDiferencias = totalOrdenado !== totalRecibido;

  // Confirmar recepción física e ingresar al inventario
  const handleConfirmarRecepcion = async () => {
    if (!ordenActual) {
      toast.error('Selecciona una orden de compra para recepcionar.');
      return;
    }
    if (!guiaRemision.trim()) {
      toast.error('Ingresa el número de Guía de Remisión o Factura física.');
      return;
    }
    if (totalRecibido <= 0) {
      toast.error('La cantidad total recibida debe ser mayor a cero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await comprasService.recepcionarMercaderia(ordenActual.id, {
        numeroGuiaRemision: guiaRemision.trim(),
        recepcionadoPor: recepcionadoPor.trim(),
        notas: observaciones.trim() || undefined,
        items: itemsRecepcion.map((it) => ({
          productoId: it.productoId,
          sku: it.sku,
          nombre: it.nombre,
          cantidadRecibida: it.cantidadRecibida,
          costoUnitario: it.costoUnitario,
        })),
      });

      toast.success(
        `Recepción completada: ${totalRecibido} unidades ingresadas a inventario con Guía ${guiaRemision}.`
      );
      if (onRecepcionCompletada) {
        onRecepcionCompletada();
      }
    } catch {
      toast.error('No se pudo procesar la recepción física.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. KPIs Superiores de Recepción */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          title="Órdenes por Arribar"
          value={`${ordenesPorRecepcionar.length} pendientes`}
          subtitle="Esperando verificación en almacén"
          icon={Truck}
          iconColor="text-warning-text bg-warning-soft"
        />
        <MetricCard
          title="Unidades a Verificar"
          value={`${totalOrdenado} unidades`}
          subtitle="En la orden seleccionada"
          icon={Layers}
          iconColor="text-primary bg-primary/10"
        />
        <MetricCard
          title="Estado del Cotejo"
          value={
            hayDiferencias
              ? `${Math.abs(totalRecibido - totalOrdenado)} de diferencia`
              : 'Conforme al 100%'
          }
          subtitle={hayDiferencias ? 'Requiere ajuste en recepción' : 'Cantidades coinciden con la orden'}
          icon={hayDiferencias ? AlertTriangle : CheckCircle2}
          iconColor={
            hayDiferencias ? 'text-warning-text bg-warning-soft' : 'text-success-text bg-success-soft'
          }
        />
      </div>

      {/* 2. Selector de Orden y Datos de Guía */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between pb-3 border-b border-border/70">
            {/* Selector de orden pendiente */}
            <div className="space-y-1.5 w-full lg:w-96">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4 text-primary" />
                <span>Orden de compra a cotejar:</span>
              </Label>
              {ordenesPorRecepcionar.length > 0 ? (
                <Select value={ordenActivaId} onValueChange={setOrdenActivaId}>
                  <SelectTrigger className="h-9 text-xs border-border bg-card">
                    <SelectValue placeholder="Selecciona una orden..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ordenesPorRecepcionar.map((ord) => (
                      <SelectItem key={ord.id} value={ord.id} className="text-xs">
                        {ord.serieFactura} — {ord.proveedorNombre} ({formatCurrency(ord.total)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No hay órdenes pendientes en este momento. Todas están recepcionadas.
                </p>
              )}
            </div>

            {/* Datos del Proveedor y Fecha */}
            {ordenActual && (
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">{ordenActual.proveedorNombre}</span>
                  <span className="font-mono text-[11px]">(RUC: {ordenActual.proveedorRuc})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Emisión: {formatDate(ordenActual.fecha)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Formulario de cotejo físico */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-foreground">
                N° Guía de Remisión / Factura física *
              </Label>
              <Input
                placeholder="Ej. T001-000429 o F001-1234"
                value={guiaRemision}
                onChange={(e) => setGuiaRemision(e.target.value)}
                className="h-8 text-xs font-mono uppercase"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-foreground">
                Responsable de recepción
              </Label>
              <Input
                placeholder="Nombre del almacenero o receptor"
                value={recepcionadoPor}
                onChange={(e) => setRecepcionadoPor(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-foreground">
                Observaciones / Mermas físicas
              </Label>
              <Input
                placeholder="Bultos sellados, sin daños, etc."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Tabla de Verificación de Ítems e Ingreso a Stock */}
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-primary" />
                <span>Cotejo de Mercadería vs. Orden</span>
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Verifica las cantidades físicas reales que llegaron al local y confirma el costo unitario.
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setItemsRecepcion((prev) =>
                  prev.map((it) => ({ ...it, cantidadRecibida: it.cantidadOrdenada }))
                );
                toast.info('Cantidades restablecidas a los valores de la orden.');
              }}
              className="text-xs h-7 text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Marcar todo conforme</span>
            </Button>
          </div>

          {itemsRecepcion.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Selecciona una orden de compra para cargar los ítems a recepcionar.
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-border bg-card">
              <Table className="w-full min-w-[700px]">
                <TableHeader className="bg-muted/50">
                  <TableRow className="text-xs">
                    <TableHead className="py-2.5">Producto & SKU</TableHead>
                    <TableHead className="py-2.5 text-center w-28">Pedidas</TableHead>
                    <TableHead className="py-2.5 text-center w-36">Recibidas Físicas</TableHead>
                    <TableHead className="py-2.5 text-center w-32">Estado Cotejo</TableHead>
                    <TableHead className="py-2.5 text-right w-32">Costo Facturado</TableHead>
                    <TableHead className="py-2.5 text-right w-36">Costo Ponderado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsRecepcion.map((it, index) => {
                    const diff = it.cantidadRecibida - it.cantidadOrdenada;
                    const stockPrevio = it.stockActualProducto ?? 0;
                    const costoPrevio = it.costoActualProducto ?? it.costoUnitario;
                    // Cálculo de costo promedio ponderado
                    const nuevoStockTotal = stockPrevio + it.cantidadRecibida;
                    const costoPonderado =
                      nuevoStockTotal > 0
                        ? (stockPrevio * costoPrevio + it.cantidadRecibida * it.costoUnitario) /
                          nuevoStockTotal
                        : it.costoUnitario;

                    return (
                      <TableRow key={index} className="text-xs hover:bg-muted/20">
                        <TableCell className="py-2.5">
                          <span className="font-semibold text-foreground block">{it.nombre}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            SKU: {it.sku} · Stock actual: {stockPrevio} un.
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono tabular-nums font-medium py-2.5">
                          {it.cantidadOrdenada} un.
                        </TableCell>
                        <TableCell className="text-center py-2.5">
                          <Input
                            type="number"
                            min="0"
                            value={it.cantidadRecibida}
                            onChange={(e) =>
                              handleCambiarCantidadRecibida(index, parseInt(e.target.value, 10))
                            }
                            className="h-8 w-24 mx-auto text-center font-mono text-xs font-bold"
                          />
                        </TableCell>
                        <TableCell className="text-center py-2.5">
                          {diff === 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-success-soft text-success-text">
                              Conforme
                            </span>
                          ) : diff < 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                              Faltan {Math.abs(diff)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                              +{diff} sobrante
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-2.5">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={it.costoUnitario}
                            onChange={(e) =>
                              handleCambiarCostoUnitario(index, parseFloat(e.target.value))
                            }
                            className="h-8 w-24 ml-auto text-right font-mono text-xs"
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums font-semibold text-foreground py-2.5">
                          {formatCurrency(costoPonderado)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Botón de Confirmación Principal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-semibold text-foreground">Resumen:</span>
              <span>{totalRecibido} unidades listas para ingresar al inventario físico y Kardex.</span>
            </div>

            <Button
              type="button"
              disabled={isSubmitting || itemsRecepcion.length === 0}
              onClick={handleConfirmarRecepcion}
              className="w-full sm:w-auto h-9 bg-primary text-primary-foreground font-semibold text-xs gap-2 shadow-xs"
            >
              <PackageCheck className="h-4 w-4" />
              <span>Confirmar Recepción Física e Ingresar al Stock</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
