import { simulateDelay } from '@/services/mock/mockUtils';
import {
  MovimientoKardex,
  AlmacenResumen,
  NuevoMovimientoPayload,
} from '../types/inventario.types';
import { erpStore } from '@/services/erp/erpStore';

const almacenesFijos: AlmacenResumen[] = [
  {
    id: 'alm-1',
    nombre: 'Almacén Principal (Sede Central)',
    direccion: 'Av. Industrial 450, Lima',
    totalProductos: 142,
    stockTotalUnidades: 890,
  },
  {
    id: 'alm-2',
    nombre: 'Tienda Mostrador (Surco)',
    direccion: 'Av. Benavides 1240, Lima',
    totalProductos: 85,
    stockTotalUnidades: 310,
  },
];

export const inventarioService = {
  async getMovimientosKardex(): Promise<MovimientoKardex[]> {
    return simulateDelay(erpStore.getKardex());
  },

  async getAlmacenes(): Promise<AlmacenResumen[]> {
    return simulateDelay(almacenesFijos);
  },

  async registrarMovimiento(payload: NuevoMovimientoPayload): Promise<MovimientoKardex> {
    const mov = erpStore.registrarMovimientoAlmacen(payload);
    return simulateDelay(mov);
  },
};
