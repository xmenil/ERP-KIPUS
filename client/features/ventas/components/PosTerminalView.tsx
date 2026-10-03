import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ItemVenta,
  NuevaVentaPayload,
  TipoComprobante,
  MetodoPago,
  PagoMixtoDesglose,
  Venta,
} from '../types/ventas.types';
import { Producto } from '@/features/productos/types/productos.types';
import { Cliente } from '@/features/clientes/types/clientes.types';
import { CobroModal } from './CobroModal';
import { VentaCompletadaModal } from './VentaCompletadaModal';
import { formatCurrency } from '@/utils/formatters';
import {
  Search,
  Barcode,
  Mic,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  Percent,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface PosTerminalViewProps {
  productos: Producto[];
  clientes: Cliente[];
  onEmitirVenta: (payload: NuevaVentaPayload) => Promise<Venta>;
  sucursalActiva?: string;
  cajaActiva?: string;
  vendedorActivo?: string;
}

export const PosTerminalView: React.FC<PosTerminalViewProps> = ({
  productos,
  clientes,
  onEmitirVenta,
  sucursalActiva = 'Sede Central (Tingo María)',
  cajaActiva = 'Caja 01 - Mostrador',
  vendedorActivo = 'Carlos Vega',
}) => {
  // Carrito de compras
  const [carrito, setCarrito] = useState<ItemVenta[]>([]);

  // Búsqueda y categoría
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('TODAS');

  // Cliente
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final');
  const [clienteDocumento, setClienteDocumento] = useState('00000000');
  const [mostrarSelectorCliente, setMostrarSelectorCliente] = useState(false);

  // Descuento
  const [mostrarDescuento, setMostrarDescuento] = useState(false);
  const [tipoDescuento, setTipoDescuento] = useState<'MONTO' | 'PORCENTAJE'>('MONTO');
  const [valorDescuento, setValorDescuento] = useState<number>(0);

  // Comprobante
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('BOLETA');

  // Modales
  const [openCobroModal, setOpenCobroModal] = useState(false);
  const [ventaCompletada, setVentaCompletada] = useState<Venta | null>(null);
  const [openCompletadaModal, setOpenCompletadaModal] = useState(false);

  // Asistente por voz interactivo
  const [modoVozActivo, setModoVozActivo] = useState(false);
  const [fraseVoz, setFraseVoz] = useState('');

  // Categorías únicas
  const categorias = ['TODAS', ...Array.from(new Set(productos.map((p) => p.categoria)))];

  // Filtrado de productos
  const productosFiltrados = productos.filter((p) => {
    const matchCat = categoriaActiva === 'TODAS' || p.categoria === categoriaActiva;
    const matchSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // Agregar al carrito
  const handleAgregarProducto = (prod: Producto) => {
    if (prod.stock <= 0) {
      toast.error(`"${prod.nombre}" está agotado en inventario.`);
      return;
    }

    setCarrito((prev) => {
      const existe = prev.find((item) => item.productoId === prod.id);
      if (existe) {
        if (existe.cantidad >= prod.stock) {
          toast.warning(`No puedes agregar más: Stock máximo alcanzado (${prod.stock} unid.)`);
          return prev;
        }
        return prev.map((item) =>
          item.productoId === prod.id
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precioUnitario,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          productoId: prod.id,
          sku: prod.sku,
          nombre: prod.nombre,
          cantidad: 1,
          precioUnitario: prod.precioVenta,
          subtotal: prod.precioVenta,
        },
      ];
    });

    toast.success(`+1 ${prod.nombre}`, { duration: 1200 });
  };

  // Modificar cantidad
  const handleModificarCantidad = (productoId: string, delta: number) => {
    const prodCatalogo = productos.find((p) => p.id === productoId);
    setCarrito((prev) =>
      prev
        .map((item) => {
          if (item.productoId === productoId) {
            const nuevaCantidad = item.cantidad + delta;
            if (nuevaCantidad <= 0) return null;
            if (prodCatalogo && nuevaCantidad > prodCatalogo.stock) {
              toast.warning(`Stock máximo disponible: ${prodCatalogo.stock} unid.`);
              return item;
            }
            return {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: nuevaCantidad * item.precioUnitario,
            };
          }
          return item;
        })
        .filter(Boolean) as ItemVenta[]
    );
  };

  const handleEliminarItem = (productoId: string) => {
    setCarrito((prev) => prev.filter((item) => item.productoId !== productoId));
  };

  const handleVaciarCarrito = () => {
    if (carrito.length === 0) return;
    setCarrito([]);
    setValorDescuento(0);
    toast.info('Carrito de ventas vaciado');
  };

  // Cálculos financieros
  const subtotalBruto = carrito.reduce((acc, it) => acc + it.subtotal, 0);
  const descuentoCalculado =
    tipoDescuento === 'PORCENTAJE'
      ? +((subtotalBruto * valorDescuento) / 100).toFixed(2)
      : Math.min(subtotalBruto, valorDescuento);

  const total = Math.max(0, +(subtotalBruto - descuentoCalculado).toFixed(2));
  const subtotalNeto = tipoComprobante === 'NOTA_VENTA' ? total : +(total / 1.18).toFixed(2);
  const igv = +(total - subtotalNeto).toFixed(2);

  // Escaneo simulado
  const handleSimularEscaner = () => {
    if (productos.length > 0) {
      const prodAleatorio = productos[Math.floor(Math.random() * productos.length)];
      handleAgregarProducto(prodAleatorio);
      toast.success(`Escáner detectó SKU: ${prodAleatorio.sku}`);
    }
  };

  // Comando de voz interpretado por IA
  const handleInterpretarVoz = (frase: string) => {
    const fraseMin = frase.toLowerCase();
    let agregados = 0;

    productos.forEach((prod) => {
      const palabrasClave = prod.nombre.toLowerCase().split(' ');
      const coincide = palabrasClave.some((p) => p.length > 3 && fraseMin.includes(p));

      if (coincide && prod.stock > 0) {
        handleAgregarProducto(prod);
        agregados++;
      }
    });

    if (agregados > 0) {
      toast.success(`KIPU'S IA interpretó tu solicitud: ${agregados} producto(s) añadidos.`);
      setFraseVoz('');
      setModoVozActivo(false);
    } else {
      toast.error('No se identificó ningún producto del catálogo en la frase.');
    }
  };

  // Atajos de teclado para cajeros rápidos (F12 = Cobrar, Esc = Cerrar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' && carrito.length > 0 && !openCobroModal) {
        e.preventDefault();
        setOpenCobroModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carrito.length, openCobroModal]);

  // Ejecutar cobro confirmado
  const handleConfirmarCobroFinal = async (datosCobro: {
    metodoPago: MetodoPago;
    montoRecibido: number;
    vuelto: number;
    desglosePagoMixto?: PagoMixtoDesglose;
  }) => {
    const payload: NuevaVentaPayload = {
      tipoComprobante,
      clienteNombre,
      clienteDocumento,
      metodoPago: datosCobro.metodoPago,
      desglosePagoMixto: datosCobro.desglosePagoMixto,
      montoRecibido: datosCobro.montoRecibido,
      vuelto: datosCobro.vuelto,
      descuento: descuentoCalculado,
      items: carrito.map((it) => ({
        productoId: it.productoId,
        sku: it.sku,
        nombre: it.nombre,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
      })),
      sucursal: sucursalActiva,
      caja: cajaActiva,
      vendedor: vendedorActivo,
    };

    const ventaEmitida = await onEmitirVenta(payload);
    setVentaCompletada(ventaEmitida);
    setOpenCompletadaModal(true);
    setCarrito([]);
    setValorDescuento(0);
    setClienteNombre('Consumidor Final');
    setClienteDocumento('00000000');
  };

  return (
    <div className="space-y-3">
      {/* Barra de estado del Punto de Venta */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-border bg-card p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <span>{sucursalActiva}</span>
          </div>
          <span className="text-border">|</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="font-medium text-foreground">{cajaActiva}</span>
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" title="Caja abierta" />
          </div>
          <span className="text-border">|</span>
          <div className="text-muted-foreground">
            Cajero: <span className="font-medium text-foreground">{vendedorActivo}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSimularEscaner}
            className="inline-flex items-center gap-1 rounded border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            title="Simular lectura de escáner láser de código de barras"
          >
            <Barcode className="h-3.5 w-3.5" />
            <span>Lector Código</span>
          </button>

          <button
            type="button"
            onClick={() => setModoVozActivo(!modoVozActivo)}
            className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
              modoVozActivo
                ? 'border-primary bg-primary-soft text-primary font-semibold'
                : 'border-border bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Voz KIPU'S IA</span>
          </button>
        </div>
      </div>

      {/* Input de voz asistente si está activo */}
      {modoVozActivo && (
        <div className="rounded-lg border border-primary/40 bg-primary-soft/30 p-3 space-y-2 animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-primary flex items-center gap-1.5">
              <Mic className="h-4 w-4" />
              Dictado rápido por voz (KIPU'S IA):
            </span>
            <span className="text-[11px] text-muted-foreground">
              Ej: "Agregar 2 Aceites y 1 Batería"
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Escribe o dicta: ej. 'Dos galones de aceite y un filtro de aire'..."
              value={fraseVoz}
              onChange={(e) => setFraseVoz(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInterpretarVoz(fraseVoz);
              }}
              className="h-8 text-xs bg-card"
            />
            <Button
              size="sm"
              onClick={() => handleInterpretarVoz(fraseVoz)}
              className="h-8 text-xs font-semibold"
            >
              Interpretar
            </Button>
          </div>
        </div>
      )}

      {/* Distribución del POS: Catálogo (Izquierda) + Carrito (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* ========================================================================= */}
        {/* COLUMNA IZQUIERDA: CATÁLOGO Y BÚSQUEDA (7 de 12 columnas)                 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-3">
          {/* Barra de búsqueda amplia */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto por nombre, SKU o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs sm:text-sm bg-card shadow-2xs font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Selector de categorías visuales */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaActiva(cat)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  categoriaActiva === cat
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-card text-muted-foreground border border-border hover:bg-muted/40'
                }`}
              >
                {cat === 'TODAS' ? 'Todos los productos' : cat}
              </button>
            ))}
          </div>

          {/* Grid de productos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
            {productosFiltrados.length === 0 ? (
              <div className="col-span-full h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-lg bg-card">
                <ShoppingCart className="h-6 w-6 text-muted-foreground mb-1.5" />
                <p className="text-xs font-medium text-foreground">No se encontraron productos</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Prueba cambiando la categoría o término de búsqueda.
                </p>
              </div>
            ) : (
              productosFiltrados.map((prod) => {
                const enCarrito = carrito.find((it) => it.productoId === prod.id);
                const isAgotado = prod.stock <= 0;
                const isBajo = prod.stock > 0 && prod.stock <= prod.stockMinimo;

                return (
                  <button
                    key={prod.id}
                    type="button"
                    disabled={isAgotado}
                    onClick={() => handleAgregarProducto(prod)}
                    className={`relative flex flex-col justify-between p-3 rounded-lg border text-left transition-all select-none cursor-pointer ${
                      isAgotado
                        ? 'opacity-50 border-border bg-muted/30 cursor-not-allowed'
                        : enCarrito
                        ? 'border-primary bg-primary-soft/20 shadow-xs ring-1 ring-primary'
                        : 'border-border bg-card hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                    }`}
                  >
                    {/* Badge de cantidad ya en carrito */}
                    {enCarrito && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-xs">
                        {enCarrito.cantidad}
                      </span>
                    )}

                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-mono block">
                        {prod.sku}
                      </span>
                      <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
                        {prod.nombre}
                      </h4>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-border/60 flex items-end justify-between">
                      <div className="font-mono">
                        <span className="text-[10px] text-muted-foreground block">Precio</span>
                        <span className="text-sm font-bold text-foreground tabular-nums">
                          {formatCurrency(prod.precioVenta)}
                        </span>
                      </div>

                      {/* Stock semántico */}
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded tabular-nums ${
                          isAgotado
                            ? 'bg-danger-soft text-danger-text'
                            : isBajo
                            ? 'bg-warning-soft text-warning-text'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isAgotado ? 'Agotado' : `${prod.stock} disp.`}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA DERECHA: CARRITO Y COBRO (5 de 12 columnas)                       */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5">
          <Card className="border-border/80 shadow-xs sticky top-3">
            <CardContent className="p-3.5 space-y-3">
              {/* Encabezado del carrito */}
              <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
                <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <span>Carrito de Venta</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    ({carrito.reduce((acc, it) => acc + it.cantidad, 0)} ítems)
                  </span>
                </div>

                {carrito.length > 0 && (
                  <button
                    type="button"
                    onClick={handleVaciarCarrito}
                    className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                  >
                    Vaciar
                  </button>
                )}
              </div>

              {/* Selector de Cliente rápido */}
              <div className="rounded-md border border-border/80 bg-muted/30 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
                    <User className="h-3 w-3 text-primary" />
                    Cliente:
                  </span>
                  <button
                    type="button"
                    onClick={() => setMostrarSelectorCliente(!mostrarSelectorCliente)}
                    className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                  >
                    {mostrarSelectorCliente ? 'Ocultar' : 'Cambiar cliente'}
                  </button>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-foreground truncate max-w-[210px]">
                    {clienteNombre}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {clienteDocumento}
                  </span>
                </div>

                {/* Desplegable para seleccionar cliente registrado o escribir uno nuevo */}
                {mostrarSelectorCliente && (
                  <div className="pt-2 border-t border-border/60 space-y-2 animate-in fade-in-50 duration-150">
                    <Select
                      onValueChange={(cliId) => {
                        if (cliId === 'consumidor-final') {
                          setClienteNombre('Consumidor Final');
                          setClienteDocumento('00000000');
                        } else {
                          const cli = clientes.find((c) => c.id === cliId);
                          if (cli) {
                            setClienteNombre(cli.nombre);
                            setClienteDocumento(cli.numeroDocumento);
                            if (cli.numeroDocumento.length === 11) {
                              setTipoComprobante('FACTURA');
                            }
                          }
                        }
                        setMostrarSelectorCliente(false);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-card">
                        <SelectValue placeholder="Seleccionar cliente del directorio..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consumidor-final" className="text-xs">
                          Consumidor Final (Venta rápida sin datos)
                        </SelectItem>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.nombre} · {c.documentoTipo}: {c.numeroDocumento}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Nombre / Razón social"
                        value={clienteNombre}
                        onChange={(e) => setClienteNombre(e.target.value)}
                        className="h-7 text-xs bg-card"
                      />
                      <Input
                        placeholder="DNI o RUC"
                        value={clienteDocumento}
                        onChange={(e) => setClienteDocumento(e.target.value)}
                        className="h-7 text-xs font-mono bg-card"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de productos en el carrito */}
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                {carrito.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-3 border border-dashed border-border rounded bg-muted/20">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground mb-1" />
                    <p className="text-xs font-medium text-foreground">El carrito está vacío</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Haz clic en los productos de la izquierda para agregarlos.
                    </p>
                  </div>
                ) : (
                  carrito.map((item) => (
                    <div
                      key={item.productoId}
                      className="flex items-center justify-between p-2 rounded-md border border-border/70 bg-card hover:bg-muted/20 text-xs transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <span className="font-semibold text-foreground block truncate">
                          {item.nombre}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {formatCurrency(item.precioUnitario)} c/u
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Controles de cantidad */}
                        <div className="flex items-center rounded border border-border bg-background">
                          <button
                            type="button"
                            onClick={() => handleModificarCantidad(item.productoId, -1)}
                            className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-7 text-center font-mono font-bold text-xs tabular-nums text-foreground">
                            {item.cantidad}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleModificarCantidad(item.productoId, 1)}
                            className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Subtotal del ítem */}
                        <span className="w-16 text-right font-mono font-bold text-xs text-foreground tabular-nums">
                          {formatCurrency(item.subtotal)}
                        </span>

                        {/* Eliminar ítem */}
                        <button
                          type="button"
                          onClick={() => handleEliminarItem(item.productoId)}
                          className="p-1 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Descuentos opcionales */}
              {carrito.length > 0 && (
                <div className="pt-2 border-t border-border/60">
                  {!mostrarDescuento ? (
                    <button
                      type="button"
                      onClick={() => setMostrarDescuento(true)}
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium cursor-pointer"
                    >
                      <Percent className="h-3 w-3" />
                      <span>+ Aplicar descuento a la venta</span>
                    </button>
                  ) : (
                    <div className="rounded border border-border bg-muted/30 p-2 space-y-1.5 animate-in fade-in-50 duration-150">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-foreground">
                          Descuento autorizado:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setMostrarDescuento(false);
                            setValorDescuento(0);
                          }}
                          className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                        >
                          Quitar descuento
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={tipoDescuento}
                          onValueChange={(v: 'MONTO' | 'PORCENTAJE') => setTipoDescuento(v)}
                        >
                          <SelectTrigger className="h-7 text-[11px] w-28 bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MONTO" className="text-xs">S/ Fijo</SelectItem>
                            <SelectItem value="PORCENTAJE" className="text-xs">% Porcentaje</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          type="number"
                          min="0"
                          value={valorDescuento || ''}
                          onChange={(e) => setValorDescuento(Math.max(0, Number(e.target.value)))}
                          placeholder={tipoDescuento === 'MONTO' ? 'Monto S/' : '%'}
                          className="h-7 text-xs font-mono font-bold bg-card text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Resumen de totales */}
              <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal gravado:</span>
                  <span className="font-mono tabular-nums">{formatCurrency(subtotalNeto)}</span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>IGV (18%):</span>
                  <span className="font-mono tabular-nums">{formatCurrency(igv)}</span>
                </div>

                {descuentoCalculado > 0 && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                    <span>Descuento aplicado:</span>
                    <span className="font-mono tabular-nums">-{formatCurrency(descuentoCalculado)}</span>
                  </div>
                )}

                {/* TOTAL GIGANTE */}
                <div className="pt-2 border-t border-border/80 flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Total a Cobrar:
                  </span>
                  <span className="text-2xl font-black font-mono tabular-nums text-primary">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Botón Gigante de COBRAR */}
              <Button
                type="button"
                disabled={carrito.length === 0}
                onClick={() => setOpenCobroModal(true)}
                className="w-full h-11 text-sm font-bold bg-primary text-primary-foreground shadow-sm gap-2"
              >
                <span>COBRAR</span>
                <span className="font-mono text-base">({formatCurrency(total)})</span>
                <span className="text-[10px] opacity-80 font-normal ml-auto hidden sm:inline">
                  [F12]
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Cobro */}
      <CobroModal
        open={openCobroModal}
        onOpenChange={setOpenCobroModal}
        total={total}
        tipoComprobante={tipoComprobante}
        onTipoComprobanteChange={setTipoComprobante}
        clienteNombre={clienteNombre}
        clienteDocumento={clienteDocumento}
        onConfirmarCobro={handleConfirmarCobroFinal}
      />

      {/* Modal de Venta Completada */}
      <VentaCompletadaModal
        open={openCompletadaModal}
        onOpenChange={setOpenCompletadaModal}
        venta={ventaCompletada}
        onNuevaVenta={() => {
          setOpenCompletadaModal(false);
          setVentaCompletada(null);
        }}
      />
    </div>
  );
};
