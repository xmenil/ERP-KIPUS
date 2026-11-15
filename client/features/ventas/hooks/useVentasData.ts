import { useState, useEffect, useCallback } from 'react';
import { ventasService } from '../services/ventasService';
import { productosService } from '@/features/productos/services/productosService';
import { clientesService } from '@/features/clientes/services/clientesService';
import {
  Venta,
  NuevaVentaPayload,
  Pedido,
  Cotizacion,
  ResumenVentasKpis,
  EstadoPedido,
} from '../types/ventas.types';
import { Producto } from '@/features/productos/types/productos.types';
import { Cliente } from '@/features/clientes/types/clientes.types';
import { subscribeToErp } from '@/services/erp/erpStore';
import { useSocketEvent } from '@/services/socket/useSocketEvent';
import { toast } from 'sonner';

export function useVentasData() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [kpis, setKpis] = useState<ResumenVentasKpis | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vData, pData, cData, pedData, cotData, kData] = await Promise.all([
        ventasService.getVentas(),
        productosService.getProductos(),
        clientesService.getClientes(),
        ventasService.getPedidos(),
        ventasService.getCotizaciones(),
        ventasService.getKpisVentas(),
      ]);
      setVentas(vData);
      setProductos(pData);
      setClientes(cData);
      setPedidos(pedData);
      setCotizaciones(cotData);
      setKpis(kData);
    } catch {
      toast.error('Error al sincronizar datos de ventas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return subscribeToErp(() => fetchData());
  }, [fetchData]);

  useSocketEvent('stock:actualizado', (data: { productoId: string; delta: number; nuevoStock: number }) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === data.productoId ? { ...p, stock: data.nuevoStock ?? p.stock } : p))
    );
  });

  useSocketEvent('ventas:nueva_venta', () => {
    ventasService.getVentas().then(setVentas);
    ventasService.getKpisVentas().then(setKpis);
  });

  const emitirVenta = async (payload: NuevaVentaPayload): Promise<Venta> => {
    const nueva = await ventasService.crearVenta(payload);
    await fetchData();
    return nueva;
  };

  const anularVenta = async (id: string, motivo: string) => {
    await ventasService.anularVenta(id, motivo);
    await fetchData();
  };

  const cambiarEstadoPedido = async (id: string, est: EstadoPedido) => {
    await ventasService.cambiarEstadoPedido(id, est);
    await fetchData();
  };

  const convertirPedidoAVenta = async (id: string) => {
    await ventasService.convertirPedidoAVenta(id);
    await fetchData();
  };

  const crearPedido = async (p: Omit<Pedido, 'id' | 'codigo' | 'fecha'>) => {
    await ventasService.crearPedido(p);
    await fetchData();
  };

  const convertirCotizacionAVenta = async (id: string) => {
    await ventasService.convertirCotizacionAVenta(id);
    await fetchData();
  };

  const crearCotizacion = async (c: Omit<Cotizacion, 'id' | 'numero' | 'fecha'>) => {
    await ventasService.crearCotizacion(c);
    await fetchData();
  };

  return {
    ventas,
    productos,
    clientes,
    pedidos,
    cotizaciones,
    kpis,
    loading,
    fetchData,
    emitirVenta,
    anularVenta,
    cambiarEstadoPedido,
    convertirPedidoAVenta,
    crearPedido,
    convertirCotizacionAVenta,
    crearCotizacion,
  };
}
