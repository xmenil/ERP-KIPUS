/**
 * Tienda de Negocio Unificada (Business ERP Store) — KIPU'S ERP
 * Especializada para BODEGAS Y MINIMARKETS.
 * 
 * Sincronización e Interconexión Correlacional Total:
 * - Venta en POS / Facturación -> Descuenta Stock en Inventario + Registra salida en Kardex + Ingresa a Caja (Efectivo/Digital) + Actualiza métricas Dashboard.
 * - Compra a Proveedor -> Incrementa Stock en Inventario + Registra entrada en Kardex + Egreso en Caja (si es efectivo) + Actualiza Compras.
 * - Gastos Operativos -> Egreso en Caja (si es efectivo) + Registro en módulo de Gastos.
 * - Ajustes y Conteo Físico -> Actualiza Stock + Registra movimiento de ajuste en Kardex.
 * - Apertura / Cierre de Caja -> Cuadre de caja con diferencias, arqueos y auditoría.
 * - Persistencia en LocalStorage (KIPUS_ERP_STORAGE_V2): todo lo que simules se conserva y no se pierde al recargar.
 */

import {
  Venta,
  NuevaVentaPayload,
  Pedido,
  Cotizacion,
  Devolucion,
} from '@/features/ventas/types/ventas.types';
import { Producto, NuevoProductoPayload } from '@/features/productos/types/productos.types';
import {
  MovimientoKardex,
  NuevoMovimientoPayload,
  RecepcionMercanciaPayload,
  AjusteAuditoriaPayload,
  AjusteInventario,
  NuevoAjustePayload,
} from '@/features/inventario/types/inventario.types';
import {
  EstadoCaja,
  MovimientoCaja,
  NuevaOperacionCajaPayload,
  CajaInfo,
  CierreCaja,
  AuditoriaCaja,
  ArqueoConteo,
  AperturaCajaPayload,
  CierreCajaPayload,
} from '@/features/caja/types/caja.types';
import { Gasto, NuevoGastoPayload } from '@/features/gastos/types/gastos.types';
import { Compra, NuevaCompraPayload } from '@/features/compras/types/compras.types';
import { Cliente, NuevoClientePayload } from '@/features/clientes/types/clientes.types';
import { Proveedor, NuevoProveedorPayload } from '@/features/proveedores/types/proveedores.types';

// Clave de almacenamiento local versionada para Minimarket
const STORAGE_KEY = 'KIPUS_ERP_STORAGE_V2';

// ==========================================
// CATÁLOGO BASE DE PRODUCTOS DE BODEGA / MINIMARKET
// ==========================================
export const DEFAULT_PRODUCTOS: Producto[] = [
  // 1. Abarrotes y Granos
  {
    id: 'prod-1',
    sku: 'ARR-COS-01',
    nombre: 'Arroz Costeño Extra 1 kg',
    categoria: 'Abarrotes y Granos',
    precioCompra: 3.80,
    precioVenta: 4.80,
    stock: 45,
    stockMinimo: 15,
    unidadMedida: 'BOLSA',
    activo: true,
    ubicacion: 'Estante 1 - Abarrotes',
  },
  {
    id: 'prod-2',
    sku: 'ARR-FAR-05',
    nombre: 'Arroz Faraón Extra Añejo 5 kg',
    categoria: 'Abarrotes y Granos',
    precioCompra: 18.50,
    precioVenta: 23.50,
    stock: 18,
    stockMinimo: 8,
    unidadMedida: 'BOLSA',
    activo: true,
    ubicacion: 'Tarima 1 - Sacos y Bolsas',
  },
  {
    id: 'prod-3',
    sku: 'AZU-PAR-01',
    nombre: 'Azúcar Rubia Paramonga 1 kg',
    categoria: 'Abarrotes y Granos',
    precioCompra: 3.10,
    precioVenta: 4.00,
    stock: 32,
    stockMinimo: 10,
    unidadMedida: 'BOLSA',
    activo: true,
    ubicacion: 'Estante 1 - Abarrotes',
  },
  {
    id: 'prod-4',
    sku: 'FID-DVI-45',
    nombre: 'Fideos Don Vittorio Spaghetti 450g',
    categoria: 'Abarrotes y Granos',
    precioCompra: 2.40,
    precioVenta: 3.20,
    stock: 38,
    stockMinimo: 12,
    unidadMedida: 'PAQUETE',
    activo: true,
    ubicacion: 'Estante 1 - Pastas',
  },
  {
    id: 'prod-5',
    sku: 'FID-LAV-25',
    nombre: 'Fideos Lavaggi Canuto Corto 250g',
    categoria: 'Abarrotes y Granos',
    precioCompra: 1.40,
    precioVenta: 2.00,
    stock: 25,
    stockMinimo: 10,
    unidadMedida: 'PAQUETE',
    activo: true,
    ubicacion: 'Estante 1 - Pastas',
  },
  {
    id: 'prod-6',
    sku: 'ACE-PRI-90',
    nombre: 'Aceite Primor Clásico 900ml',
    categoria: 'Abarrotes y Granos',
    precioCompra: 7.20,
    precioVenta: 9.50,
    stock: 22,
    stockMinimo: 10,
    unidadMedida: 'BOTELLA',
    activo: true,
    ubicacion: 'Estante 2 - Aceites',
  },
  {
    id: 'prod-7',
    sku: 'ACE-COC-90',
    nombre: 'Aceite Vegetal Cocinero 900ml',
    categoria: 'Abarrotes y Granos',
    precioCompra: 6.30,
    precioVenta: 8.20,
    stock: 16,
    stockMinimo: 8,
    unidadMedida: 'BOTELLA',
    activo: true,
    ubicacion: 'Estante 2 - Aceites',
  },
  {
    id: 'prod-8',
    sku: 'ATN-FLO-17',
    nombre: 'Filete de Atún Florida en Aceite 170g',
    categoria: 'Abarrotes y Granos',
    precioCompra: 4.50,
    precioVenta: 6.20,
    stock: 28,
    stockMinimo: 12,
    unidadMedida: 'LATA',
    activo: true,
    ubicacion: 'Anaquel Conservas A-1',
  },
  {
    id: 'prod-9',
    sku: 'HAR-BFL-01',
    nombre: 'Harina Preparada Blanca Flor 1 kg',
    categoria: 'Abarrotes y Granos',
    precioCompra: 5.20,
    precioVenta: 6.80,
    stock: 14,
    stockMinimo: 6,
    unidadMedida: 'BOLSA',
    activo: true,
    ubicacion: 'Estante 1 - Repostería',
  },
  {
    id: 'prod-10',
    sku: 'SAL-EMS-01',
    nombre: 'Sal de Mesa Emsal Yodada 1 kg',
    categoria: 'Abarrotes y Granos',
    precioCompra: 1.20,
    precioVenta: 1.80,
    stock: 40,
    stockMinimo: 15,
    unidadMedida: 'BOLSA',
    activo: true,
    ubicacion: 'Estante 1 - Condimentos',
  },

  // 2. Lácteos y Desayuno
  {
    id: 'prod-11',
    sku: 'LEC-GLO-40',
    nombre: 'Leche Evaporada Gloria Azul Entera 400g',
    categoria: 'Lácteos y Desayuno',
    precioCompra: 3.40,
    precioVenta: 4.30,
    stock: 54,
    stockMinimo: 24,
    unidadMedida: 'LATA',
    activo: true,
    ubicacion: 'Estante Lácteos - Nivel 2',
  },
  {
    id: 'prod-12',
    sku: 'YOG-GLO-1L',
    nombre: 'Yogurt Gloria Batido Fresa 1 Litro',
    categoria: 'Lácteos y Desayuno',
    precioCompra: 5.10,
    precioVenta: 6.80,
    stock: 15,
    stockMinimo: 6,
    unidadMedida: 'BOTELLA',
    activo: true,
    ubicacion: 'Visicooler Lácteos 01',
  },
  {
    id: 'prod-13',
    sku: 'MAN-LAI-20',
    nombre: 'Mantequilla Laive con Sal Barra 200g',
    categoria: 'Lácteos y Desayuno',
    precioCompra: 7.40,
    precioVenta: 9.80,
    stock: 11,
    stockMinimo: 5,
    unidadMedida: 'PAQUETE',
    activo: true,
    ubicacion: 'Visicooler Lácteos 01',
  },
  {
    id: 'prod-14',
    sku: 'CAF-NES-20',
    nombre: 'Café Instantáneo Nescafé Tradición 200g',
    categoria: 'Lácteos y Desayuno',
    precioCompra: 16.80,
    precioVenta: 21.50,
    stock: 9,
    stockMinimo: 5,
    unidadMedida: 'FRASCO',
    activo: true,
    ubicacion: 'Anaquel Desayunos A-2',
  },
  {
    id: 'prod-15',
    sku: 'MIL-NES-40',
    nombre: 'Chocolatada Milo Nestlé Lata 400g',
    categoria: 'Lácteos y Desayuno',
    precioCompra: 13.50,
    precioVenta: 17.50,
    stock: 7,
    stockMinimo: 6,
    unidadMedida: 'LATA',
    activo: true,
    ubicacion: 'Anaquel Desayunos A-2',
  },
  {
    id: 'prod-16',
    sku: 'AVE-3OS-30',
    nombre: 'Avena 3 Ositos Tradicional 300g',
    categoria: 'Lácteos y Desayuno',
    precioCompra: 2.30,
    precioVenta: 3.20,
    stock: 26,
    stockMinimo: 10,
    unidadMedida: 'BOLSA',
    activo: true,
    ubicacion: 'Estante Desayunos',
  },

  // 3. Bebidas y Licores
  {
    id: 'prod-17',
    sku: 'GAS-INK-15',
    nombre: 'Gaseosa Inca Kola Sin Azúcar 1.5L',
    categoria: 'Bebidas y Licores',
    precioCompra: 5.20,
    precioVenta: 7.00,
    stock: 24,
    stockMinimo: 10,
    unidadMedida: 'BOTELLA',
    activo: true,
    ubicacion: 'Góndola Bebidas / Visicooler',
  },
  {
    id: 'prod-18',
    sku: 'GAS-INK-3L',
    nombre: 'Gaseosa Inca Kola Original 3L Retornable',
    categoria: 'Bebidas y Licores',
    precioCompra: 10.50,
    precioVenta: 13.50,
    stock: 16,
    stockMinimo: 8,
    unidadMedida: 'BOTELLA',
    activo: true,
    ubicacion: 'Zona Retornables P-1',
  },
  {
    id: 'prod-19',
    sku: 'GAS-COK-50',
    nombre: 'Gaseosa Coca-Cola Original Botella 500ml',
    categoria: 'Bebidas y Licores',
    precioCompra: 2.30,
    precioVenta: 3.00,
    stock: 36,
    stockMinimo: 15,
    unidadMedida: 'BOTELLA',
    activo: true,
    ubicacion: 'Visicooler Bebidas 02',
  },
  {
    id: 'prod-20',
    sku: 'AGU-SAN-60',
    nombre: 'Agua Mineral San Mateo Sin Gas 600ml',
    categoria: 'Bebidas y Licores',
    precioCompra: 1.50,
    precioVenta: 2.20,
    stock: 30,
    stockMinimo: 12,
    unidadMedida: 'BOTELLA',
    activo: true,
    ubicacion: 'Visicooler Bebidas 02',
  },
  {
    id: 'prod-21',
    sku: 'CER-PIL-63',
    nombre: 'Cerveza Pilsen Callao Botella 630ml',
    categoria: 'Bebidas y Licores',
    precioCompra: 5.80,
    precioVenta: 7.50,
    stock: 42,
    stockMinimo: 18,
    unidadMedida: 'BOTELLA',
    activo: true,
    ubicacion: 'Conservadora de Cervezas',
  },
  {
    id: 'prod-22',
    sku: 'CER-CUS-TR',
    nombre: 'Cerveza Cusqueña Trigo Botella 310ml',
    categoria: 'Bebidas y Licores',
    precioCompra: 4.20,
    precioVenta: 6.00,
    stock: 20,
    stockMinimo: 10,
    unidadMedida: 'BOTELLA',
    activo: true,
    ubicacion: 'Conservadora de Cervezas',
  },

  // 4. Snacks y Golosinas
  {
    id: 'prod-23',
    sku: 'GAL-CAS-ME',
    nombre: 'Galletas Casino Menta Paquete x6',
    categoria: 'Snacks y Golosinas',
    precioCompra: 3.60,
    precioVenta: 5.00,
    stock: 19,
    stockMinimo: 8,
    unidadMedida: 'PAQUETE',
    activo: true,
    ubicacion: 'Góndola Snacks',
  },
  {
    id: 'prod-24',
    sku: 'GAL-MOR-06',
    nombre: 'Galletas Morochas Chocochips Paquete x6',
    categoria: 'Snacks y Golosinas',
    precioCompra: 3.80,
    precioVenta: 5.20,
    stock: 22,
    stockMinimo: 8,
    unidadMedida: 'PAQUETE',
    activo: true,
    ubicacion: 'Góndola Snacks',
  },
  {
    id: 'prod-25',
    sku: 'SNK-LAY-16',
    nombre: "Papas Fritas Lay's Clásicas Familiar 160g",
    categoria: 'Snacks y Golosinas',
    precioCompra: 5.40,
    precioVenta: 7.50,
    stock: 14,
    stockMinimo: 8,
    unidadMedida: 'BOLSA',
    activo: true,
    ubicacion: 'Exhibidor Snacks',
  },
  {
    id: 'prod-26',
    sku: 'CHO-SUB-30',
    nombre: 'Chocolate Sublime Clásico Barra 30g',
    categoria: 'Snacks y Golosinas',
    precioCompra: 1.80,
    precioVenta: 2.50,
    stock: 40,
    stockMinimo: 15,
    unidadMedida: 'UNIDAD',
    activo: true,
    ubicacion: 'Vitrina Mostrador / Caja',
  },

  // 5. Limpieza del Hogar
  {
    id: 'prod-27',
    sku: 'DET-BOL-80',
    nombre: 'Detergente Bolívar Floral Bolsa 800g',
    categoria: 'Limpieza del Hogar',
    precioCompra: 5.80,
    precioVenta: 7.50,
    stock: 25,
    stockMinimo: 10,
    unidadMedida: 'BOLSA',
    activo: true,
    ubicacion: 'Estante Limpieza 1',
  },
  {
    id: 'prod-28',
    sku: 'LEJ-CLO-01',
    nombre: 'Lejía Clorox Tradicional 1 Litro',
    categoria: 'Limpieza del Hogar',
    precioCompra: 2.90,
    precioVenta: 4.00,
    stock: 18,
    stockMinimo: 8,
    unidadMedida: 'BOTELLA',
    activo: true,
    ubicacion: 'Estante Limpieza 1',
  },
  {
    id: 'prod-29',
    sku: 'PAP-SUA-04',
    nombre: 'Papel Higiénico Suave Rindemax Pack x4',
    categoria: 'Limpieza del Hogar',
    precioCompra: 3.90,
    precioVenta: 5.20,
    stock: 32,
    stockMinimo: 12,
    unidadMedida: 'PAQUETE',
    activo: true,
    ubicacion: 'Anaquel Papelería',
  },

  // 6. Cuidado Personal
  {
    id: 'prod-30',
    sku: 'CRE-COL-75',
    nombre: 'Crema Dental Colgate Triple Acción 75ml',
    categoria: 'Cuidado Personal',
    precioCompra: 3.20,
    precioVenta: 4.50,
    stock: 20,
    stockMinimo: 8,
    unidadMedida: 'UNIDAD',
    activo: true,
    ubicacion: 'Vitrina Cuidado Personal',
  },
];

// ==========================================
// VENTAS INICIALES REALISTAS
// ==========================================
export const DEFAULT_VENTAS: Venta[] = [
  {
    id: 'v-1',
    tipoComprobante: 'BOLETA',
    serieCorrelativo: 'B001-000482',
    clienteNombre: 'Carmen Rosa Benítez',
    clienteDocumento: '41289341',
    fecha: '2026-10-04 10:15',
    metodoPago: 'YAPE',
    estado: 'COMPLETADA',
    subtotal: 31.19,
    descuento: 0,
    igv: 5.61,
    total: 36.80,
    montoRecibido: 36.80,
    vuelto: 0,
    sucursal: 'Sede Central (Tingo María)',
    caja: 'Caja 01 - Mostrador',
    vendedor: 'Juan Pérez (Cajero)',
    items: [
      { productoId: 'prod-1', nombre: 'Arroz Costeño Extra 1 kg', cantidad: 3, precioUnitario: 4.80, subtotal: 14.40 },
      { productoId: 'prod-11', nombre: 'Leche Evaporada Gloria Azul Entera 400g', cantidad: 3, precioUnitario: 4.30, subtotal: 12.90 },
      { productoId: 'prod-6', nombre: 'Aceite Primor Clásico 900ml', cantidad: 1, precioUnitario: 9.50, subtotal: 9.50 },
    ],
  },
  {
    id: 'v-2',
    tipoComprobante: 'FACTURA',
    serieCorrelativo: 'F001-000129',
    clienteNombre: 'Restaurante y Chifa El Huallaga E.I.R.L.',
    clienteDocumento: '20603418291',
    fecha: '2026-10-04 11:45',
    metodoPago: 'TRANSFERENCIA',
    estado: 'COMPLETADA',
    subtotal: 161.86,
    descuento: 0,
    igv: 29.14,
    total: 191.00,
    montoRecibido: 191.00,
    vuelto: 0,
    sucursal: 'Sede Central (Tingo María)',
    caja: 'Caja 01 - Mostrador',
    vendedor: 'Carlos Vega',
    items: [
      { productoId: 'prod-2', nombre: 'Arroz Faraón Extra Añejo 5 kg', cantidad: 4, precioUnitario: 23.50, subtotal: 94.00 },
      { productoId: 'prod-6', nombre: 'Aceite Primor Clásico 900ml', cantidad: 4, precioUnitario: 9.50, subtotal: 38.00 },
      { productoId: 'prod-4', nombre: 'Fideos Don Vittorio Spaghetti 450g', cantidad: 10, precioUnitario: 3.20, subtotal: 32.00 },
      { productoId: 'prod-18', nombre: 'Gaseosa Inca Kola Original 3L Retornable', cantidad: 2, precioUnitario: 13.50, subtotal: 27.00 },
    ],
  },
  {
    id: 'v-3',
    tipoComprobante: 'BOLETA',
    serieCorrelativo: 'B001-000483',
    clienteNombre: 'Luis Alberto Mendoza Ruiz',
    clienteDocumento: '45892301',
    fecha: '2026-10-04 13:20',
    metodoPago: 'EFECTIVO',
    estado: 'COMPLETADA',
    subtotal: 29.66,
    descuento: 0,
    igv: 5.34,
    total: 35.00,
    montoRecibido: 50.00,
    vuelto: 15.00,
    sucursal: 'Sede Central (Tingo María)',
    caja: 'Caja 01 - Mostrador',
    vendedor: 'Juan Pérez (Cajero)',
    items: [
      { productoId: 'prod-21', nombre: 'Cerveza Pilsen Callao Botella 630ml', cantidad: 3, precioUnitario: 7.50, subtotal: 22.50 },
      { productoId: 'prod-25', nombre: "Papas Fritas Lay's Clásicas Familiar 160g", cantidad: 1, precioUnitario: 7.50, subtotal: 7.50 },
      { productoId: 'prod-26', nombre: 'Chocolate Sublime Clásico Barra 30g', cantidad: 2, precioUnitario: 2.50, subtotal: 5.00 },
    ],
  },
];

// ==========================================
// PEDIDOS Y COTIZACIONES
// ==========================================
export const DEFAULT_PEDIDOS: Pedido[] = [
  {
    id: 'ped-1',
    codigo: 'PED-0041',
    clienteNombre: 'Restaurante y Chifa El Huallaga E.I.R.L.',
    clienteTelefono: '962 441 200',
    fecha: '2026-10-05 09:15',
    fechaEntrega: '2026-10-05 16:00',
    estado: 'CONFIRMADO',
    total: 174.50,
    sucursal: 'Sede Central (Tingo María)',
    notas: 'Despachar 5 sacos de arroz Faraón 5kg y 6 botellas de aceite Primor 900ml',
    items: [
      { productoId: 'prod-2', nombre: 'Arroz Faraón Extra Añejo 5 kg', cantidad: 5, precioUnitario: 23.50, subtotal: 117.50 },
      { productoId: 'prod-6', nombre: 'Aceite Primor Clásico 900ml', cantidad: 6, precioUnitario: 9.50, subtotal: 57.00 },
    ],
  },
  {
    id: 'ped-2',
    codigo: 'PED-0042',
    clienteNombre: 'Juguería & Fuente de Soda Doña Mary',
    clienteTelefono: '984 112 559',
    fecha: '2026-10-05 10:30',
    fechaEntrega: '2026-10-05 14:00',
    estado: 'PREPARANDO',
    total: 78.80,
    sucursal: 'Tienda Mostrador (Tingo María)',
    notas: '12 latas de Leche Gloria Azul y 4 botellas de Yogurt Fresa 1L',
    items: [
      { productoId: 'prod-11', nombre: 'Leche Evaporada Gloria Azul Entera 400g', cantidad: 12, precioUnitario: 4.30, subtotal: 51.60 },
      { productoId: 'prod-12', nombre: 'Yogurt Gloria Batido Fresa 1 Litro', cantidad: 4, precioUnitario: 6.80, subtotal: 27.20 },
    ],
  },
];

export const DEFAULT_COTIZACIONES: Cotizacion[] = [
  {
    id: 'cot-1',
    numero: 'COT-0018',
    clienteNombre: 'Eventos & Banquetes Selva Tropical E.I.R.L.',
    clienteDocumento: '20608821941',
    fecha: '2026-10-04',
    fechaVencimiento: '2026-10-18',
    validezDias: 14,
    estado: 'VIGENTE',
    subtotal: 461.86,
    igv: 83.14,
    total: 545.00,
    vendedor: 'Carlos Vega',
    items: [
      { productoId: 'prod-21', nombre: 'Cerveza Pilsen Callao Botella 630ml', cantidad: 48, precioUnitario: 7.50, subtotal: 360.00 },
      { productoId: 'prod-18', nombre: 'Gaseosa Inca Kola Original 3L Retornable', cantidad: 8, precioUnitario: 13.50, subtotal: 108.00 },
      { productoId: 'prod-25', nombre: "Papas Fritas Lay's Clásicas Familiar 160g", cantidad: 10, precioUnitario: 7.70, subtotal: 77.00 },
    ],
  },
];

export const DEFAULT_DEVOLUCIONES: Devolucion[] = [
  {
    id: 'dev-1',
    ventaId: 'v-1',
    serieCorrelativo: 'B001-000480',
    fecha: '2026-10-04 14:10',
    productoNombre: 'Leche Evaporada Gloria Azul Entera 400g',
    sku: 'LEC-GLO-40',
    cantidad: 1,
    motivo: 'Cliente solicitó cambio por versión Sin Lactosa',
    montoDevuelto: 4.30,
    retornaAInventario: true,
    afectaCaja: true,
    usuario: 'Juan Pérez (Cajero)',
  },
];

// ==========================================
// KARDEX INICIAL VINCULADO
// ==========================================
export const DEFAULT_KARDEX: MovimientoKardex[] = [
  {
    id: 'k-1',
    fecha: '2026-10-04 10:15',
    tipo: 'SALIDA',
    motivo: 'VENTA',
    productoNombre: 'Arroz Costeño Extra 1 kg',
    sku: 'ARR-COS-01',
    almacen: 'Almacén Principal',
    cantidad: 3,
    stockResultante: 45,
    referencia: 'Boleta B001-000482',
    usuario: 'Juan Pérez',
    origen: 'Venta',
  },
  {
    id: 'k-2',
    fecha: '2026-10-04 10:15',
    tipo: 'SALIDA',
    motivo: 'VENTA',
    productoNombre: 'Leche Evaporada Gloria Azul Entera 400g',
    sku: 'LEC-GLO-40',
    almacen: 'Almacén Principal',
    cantidad: 3,
    stockResultante: 54,
    referencia: 'Boleta B001-000482',
    usuario: 'Juan Pérez',
    origen: 'Venta',
  },
  {
    id: 'k-3',
    fecha: '2026-10-04 10:15',
    tipo: 'SALIDA',
    motivo: 'VENTA',
    productoNombre: 'Aceite Primor Clásico 900ml',
    sku: 'ACE-PRI-90',
    almacen: 'Almacén Principal',
    cantidad: 1,
    stockResultante: 22,
    referencia: 'Boleta B001-000482',
    usuario: 'Juan Pérez',
    origen: 'Venta',
  },
  {
    id: 'k-4',
    fecha: '2026-10-04 11:45',
    tipo: 'SALIDA',
    motivo: 'VENTA',
    productoNombre: 'Arroz Faraón Extra Añejo 5 kg',
    sku: 'ARR-FAR-05',
    almacen: 'Almacén Principal',
    cantidad: 4,
    stockResultante: 18,
    referencia: 'Factura F001-000129',
    usuario: 'Carlos Vega',
    origen: 'Venta',
  },
  {
    id: 'k-5',
    fecha: '2026-10-04 13:20',
    tipo: 'SALIDA',
    motivo: 'VENTA',
    productoNombre: 'Cerveza Pilsen Callao Botella 630ml',
    sku: 'CER-PIL-63',
    almacen: 'Almacén Principal',
    cantidad: 3,
    stockResultante: 42,
    referencia: 'Boleta B001-000483',
    usuario: 'Juan Pérez',
    origen: 'Venta',
  },
  {
    id: 'k-6',
    fecha: '2026-10-03 09:20',
    tipo: 'ENTRADA',
    motivo: 'COMPRA',
    productoNombre: 'Arroz Costeño Extra 1 kg',
    sku: 'ARR-COS-01',
    almacen: 'Almacén Principal',
    cantidad: 50,
    stockResultante: 48,
    referencia: 'Factura F001-008921 (Alicorp S.A.A.)',
    usuario: 'Carlos Vega',
    origen: 'Compra',
  },
  {
    id: 'k-7',
    fecha: '2026-10-03 14:30',
    tipo: 'AJUSTE',
    motivo: 'MERMA',
    productoNombre: 'Filete de Atún Florida en Aceite 170g',
    sku: 'ATN-FLO-17',
    almacen: 'Almacén Principal',
    cantidad: 1,
    stockResultante: 28,
    referencia: 'Ajuste: Lata abollada con fuga en transporte',
    usuario: 'Carlos Vega',
    origen: 'Ajuste de inventario',
  },
];

export const DEFAULT_AJUSTES: AjusteInventario[] = [
  {
    id: 'aj-1',
    productoId: 'prod-8',
    productoNombre: 'Filete de Atún Florida en Aceite 170g',
    sku: 'ATN-FLO-17',
    stockAnterior: 29,
    nuevoStock: 28,
    diferencia: -1,
    motivo: 'Merma / daño de envase',
    observacion: 'Envase de lata abollado con fisura durante descarga de camión',
    fecha: '2026-10-03 14:30',
    usuario: 'Carlos Vega',
    almacen: 'Almacén Principal',
  },
  {
    id: 'aj-2',
    productoId: 'prod-23',
    productoNombre: 'Galletas Casino Menta Paquete x6',
    sku: 'GAL-CAS-ME',
    stockAnterior: 17,
    nuevoStock: 19,
    diferencia: 2,
    motivo: 'Conteo físico',
    observacion: '2 paquetes hallados en la parte posterior de la góndola de galletas',
    fecha: '2026-10-02 18:00',
    usuario: 'Carlos Vega',
    almacen: 'Almacén Principal',
  },
];

// ==========================================
// CAJA INICIAL DEL MINIMARKET
// ==========================================
export const DEFAULT_ESTADO_CAJA: EstadoCaja = {
  id: 'caja-1',
  nombre: 'Caja 01 - Mostrador Principal',
  sucursal: 'Sede Central (Tingo María)',
  responsable: 'Juan Pérez (Cajero)',
  abierta: true,
  estado: 'ABIERTA',
  turno: 'Turno Mañana (08:00 - 16:00)',
  fechaApertura: '2026-10-05',
  horaApertura: '08:00',
  saldoInicial: 200.0,
  ventasEfectivo: 385.0,
  otrosIngresosEfectivo: 100.0,
  egresosEfectivo: 45.0,
  saldoEfectivoEsperado: 640.0,
  ventasDigitales: {
    yape: 425.0,
    plin: 180.0,
    tarjeta: 310.0,
    transferencia: 780.0,
  },
  totalVentasDigitales: 1695.0,
  totalVentasGeneral: 2080.0,
};

export const DEFAULT_CAJAS: CajaInfo[] = [
  {
    id: 'caja-1',
    nombre: 'Caja 01 - Mostrador Principal',
    sucursal: 'Sede Central (Tingo María)',
    responsableActual: 'Juan Pérez (Cajero)',
    estado: 'ABIERTA',
    saldoActualEfectivo: 640.0,
    ventasDia: 2080.0,
    ultimaActividad: 'Hace 3 min',
    abierta: true,
  },
  {
    id: 'caja-2',
    nombre: 'Caja 02 - Rápida / Billeteras',
    sucursal: 'Sede Central (Tingo María)',
    responsableActual: 'María Santos',
    estado: 'ABIERTA',
    saldoActualEfectivo: 350.0,
    ventasDia: 1240.0,
    ultimaActividad: 'Hace 8 min',
    abierta: true,
  },
  {
    id: 'caja-3',
    nombre: 'Caja 03 - Mostrador Pasillo',
    sucursal: 'Sede Central (Tingo María)',
    responsableActual: 'Sin asignar',
    estado: 'CERRADA',
    saldoActualEfectivo: 0.0,
    ventasDia: 0.0,
    ultimaActividad: 'Ayer 20:30',
    abierta: false,
  },
];

export const DEFAULT_CIERRES_CAJA: CierreCaja[] = [
  {
    id: 'cie-101',
    cajaId: 'caja-1',
    cajaNombre: 'Caja 01 - Mostrador Principal',
    sucursal: 'Sede Central (Tingo María)',
    responsable: 'Juan Pérez (Cajero)',
    fechaApertura: '2026-10-04 08:00',
    fechaCierre: '2026-10-04',
    horaCierre: '18:15',
    saldoInicial: 200.0,
    ventasEfectivo: 1150.0,
    otrosIngresos: 50.0,
    egresos: 120.0,
    saldoEsperado: 1280.0,
    saldoContado: 1280.0,
    diferencia: 0.0,
    estado: 'CUADRADA',
    ventasTotales: 3450.0,
    totalOperaciones: 42,
  },
];

export const DEFAULT_AUDITORIA_CAJA: AuditoriaCaja[] = [
  {
    id: 'aud-1',
    usuario: 'Juan Pérez',
    accion: 'APERTURA',
    fecha: '2026-10-05',
    hora: '08:00',
    caja: 'Caja 01 - Mostrador Principal',
    sucursal: 'Sede Central (Tingo María)',
    movimiento: 'Apertura con saldo inicial de sencillo S/ 200.00',
    valorAnterior: 'CERRADA',
    valorNuevo: 'ABIERTA',
    observacion: 'Apertura de turno mañana',
  },
  {
    id: 'aud-2',
    usuario: 'Carlos Vega',
    accion: 'EGRESO',
    fecha: '2026-10-05',
    hora: '10:45',
    caja: 'Caja 01 - Mostrador Principal',
    sucursal: 'Sede Central (Tingo María)',
    movimiento: 'Egreso de S/ 45.00 para bolsas biodegradables y rollos térmicos',
    valorAnterior: 'S/ 585.00',
    valorNuevo: 'S/ 540.00',
    observacion: 'Recibo simple de librería',
  },
];

export const DEFAULT_MOVIMIENTOS_CAJA: MovimientoCaja[] = [
  {
    id: 'mc-1',
    fecha: '2026-10-05',
    hora: '08:00',
    tipo: 'INGRESO',
    concepto: 'Apertura de turno - Sencillo en caja',
    metodo: 'EFECTIVO',
    monto: 200.0,
    usuario: 'Juan Pérez',
    sucursal: 'Sede Central (Tingo María)',
    cajaNombre: 'Caja 01 - Mostrador Principal',
    origenTipo: 'APERTURA',
  },
  {
    id: 'mc-2',
    fecha: '2026-10-05',
    hora: '10:15',
    tipo: 'INGRESO',
    concepto: 'Venta B001-000482 (Carmen Rosa Benítez)',
    metodo: 'YAPE',
    monto: 36.80,
    usuario: 'Juan Pérez',
    sucursal: 'Sede Central (Tingo María)',
    cajaNombre: 'Caja 01 - Mostrador Principal',
    origenTipo: 'VENTA',
    comprobanteRef: 'B001-000482',
  },
  {
    id: 'mc-3',
    fecha: '2026-10-05',
    hora: '10:45',
    tipo: 'EGRESO',
    concepto: 'Compra de bolsas biodegradables y rollos térmicos de POS',
    metodo: 'EFECTIVO',
    monto: 45.0,
    usuario: 'Carlos Vega',
    sucursal: 'Sede Central (Tingo María)',
    cajaNombre: 'Caja 01 - Mostrador Principal',
    origenTipo: 'EGRESO_MANUAL',
    categoria: 'Útiles y Limpieza',
  },
  {
    id: 'mc-4',
    fecha: '2026-10-05',
    hora: '11:45',
    tipo: 'INGRESO',
    concepto: 'Venta F001-000129 (Chifa El Huallaga)',
    metodo: 'TRANSFERENCIA',
    monto: 191.00,
    usuario: 'Carlos Vega',
    sucursal: 'Sede Central (Tingo María)',
    cajaNombre: 'Caja 01 - Mostrador Principal',
    origenTipo: 'VENTA',
    comprobanteRef: 'F001-000129',
  },
  {
    id: 'mc-5',
    fecha: '2026-10-05',
    hora: '13:20',
    tipo: 'INGRESO',
    concepto: 'Venta B001-000483 (Luis Alberto Mendoza)',
    metodo: 'EFECTIVO',
    monto: 35.00,
    usuario: 'Juan Pérez',
    sucursal: 'Sede Central (Tingo María)',
    cajaNombre: 'Caja 01 - Mostrador Principal',
    origenTipo: 'VENTA',
    comprobanteRef: 'B001-000483',
  },
];

// ==========================================
// GASTOS OPERATIVOS DEL MINIMARKET
// ==========================================
export const DEFAULT_GASTOS: Gasto[] = [
  {
    id: 'g-1',
    fecha: '2026-10-01',
    categoria: 'ALQUILER',
    descripcion: 'Alquiler local comercial Minimarket Jr. Tito Jaime',
    beneficiario: 'Inmobiliaria Tingo María S.A.C.',
    comprobante: 'Factura F002-1923',
    monto: 1500.0,
    metodoPago: 'TRANSFERENCIA',
  },
  {
    id: 'g-2',
    fecha: '2026-10-02',
    categoria: 'SERVICIOS_BASICOS',
    descripcion: 'Recibo comercial de energía eléctrica (Visicoolers y congeladoras)',
    beneficiario: 'Electro Oriente S.A.',
    comprobante: 'Recibo S-882194',
    monto: 245.0,
    metodoPago: 'TRANSFERENCIA',
  },
  {
    id: 'g-3',
    fecha: '2026-10-05',
    categoria: 'OTROS',
    descripcion: 'Bolsas biodegradables con asa y rollos térmicos 80mm',
    beneficiario: 'Librería e Imprenta La Selva',
    comprobante: 'Boleta B004-9128',
    monto: 45.0,
    metodoPago: 'EFECTIVO',
  },
];

// ==========================================
// COMPRAS A DISTRIBUIDORES DE ALIMENTOS
// ==========================================
export const DEFAULT_COMPRAS: Compra[] = [
  {
    id: 'c-1',
    fecha: '2026-10-03',
    proveedorNombre: 'Alicorp S.A.A.',
    proveedorRuc: '20100055237',
    serieFactura: 'F001-008921',
    total: 1850.0,
    estado: 'RECIBIDO',
    metodoPago: 'TRANSFERENCIA',
    itemsCount: 120,
  },
  {
    id: 'c-2',
    fecha: '2026-10-04',
    proveedorNombre: 'Arca Continental Lindley S.A.',
    proveedorRuc: '20100107843',
    serieFactura: 'F002-004120',
    total: 680.0,
    estado: 'RECIBIDO',
    metodoPago: 'TRANSFERENCIA',
    itemsCount: 48,
  },
  {
    id: 'c-3',
    fecha: '2026-10-05',
    proveedorNombre: 'Leche Gloria S.A.',
    proveedorRuc: '20100190797',
    serieFactura: 'F001-003412',
    total: 940.0,
    estado: 'RECIBIDO',
    metodoPago: 'CREDITO_30_DIAS',
    itemsCount: 72,
  },
];

// ==========================================
// CLIENTES REALES DEL COMERCIO
// ==========================================
export const DEFAULT_CLIENTES: Cliente[] = [
  {
    id: 'cli-1',
    documentoTipo: 'DNI',
    numeroDocumento: '00000000',
    nombre: 'Consumidor Final',
    telefono: '-',
    correo: '-',
    direccion: 'Mostrador Tienda',
    totalCompras: 450.0,
    saldoPendiente: 0,
    activo: true,
  },
  {
    id: 'cli-2',
    documentoTipo: 'DNI',
    numeroDocumento: '41289341',
    nombre: 'Carmen Rosa Benítez',
    telefono: '991 445 210',
    correo: 'carmen.benitez@gmail.com',
    direccion: 'Jr. Huánuco 312, Tingo María',
    totalCompras: 340.0,
    saldoPendiente: 0,
    activo: true,
  },
  {
    id: 'cli-3',
    documentoTipo: 'DNI',
    numeroDocumento: '45892301',
    nombre: 'Luis Alberto Mendoza Ruiz',
    telefono: '984 551 229',
    correo: 'luis.mendoza@hotmail.com',
    direccion: 'Av. Tito Jaime 520, Tingo María',
    totalCompras: 215.0,
    saldoPendiente: 0,
    activo: true,
  },
  {
    id: 'cli-4',
    documentoTipo: 'RUC',
    numeroDocumento: '20603418291',
    nombre: 'Restaurante y Chifa El Huallaga E.I.R.L.',
    telefono: '962 441 200',
    correo: 'compras@chifaelhuallaga.pe',
    direccion: 'Jr. Raimondi 410, Tingo María',
    totalCompras: 2450.0,
    saldoPendiente: 0,
    activo: true,
  },
  {
    id: 'cli-5',
    documentoTipo: 'RUC',
    numeroDocumento: '10429182741',
    nombre: 'Juguería & Fuente de Soda Doña Mary',
    telefono: '984 112 559',
    correo: 'mary.jugueria@gmail.com',
    direccion: 'Jr. Monzón 115, Tingo María',
    totalCompras: 1180.0,
    saldoPendiente: 65.0,
    activo: true,
  },
];

// ==========================================
// PROVEEDORES REALES DE CONSUMO MASIVO
// ==========================================
export const DEFAULT_PROVEEDORES: Proveedor[] = [
  {
    id: 'prov-1',
    codigo: 'PRV-001',
    ruc: '20100055237',
    razonSocial: 'Alicorp S.A.A.',
    nombreComercial: 'Alicorp',
    contacto: 'Marco Antonio Solís',
    telefono: '981 223 344',
    correo: 'pedidos@alicorp.com.pe',
    direccion: 'Av. Argentina 4793, Callao (Distribución Tingo María)',
    ciudad: 'Tingo María',
    provincia: 'Leoncio Prado',
    pais: 'Perú',
    codigoPostal: '10131',
    rubro: 'Abarrotes y Alimentos',
    condicionPago: 'Crédito a 30 días',
    diasCredito: 30,
    limiteCredito: 30000,
    totalCompras: 18500.0,
    saldoPendiente: 1850.0,
    descripcion: 'Distribuidor oficial de arroz Costeño, aceites Primor/Cocinero, fideos Don Vittorio y harinas Blanca Flor.',
    activo: true,
    calificacion: 5,
    fechaRegistro: '2025-01-15',
  },
  {
    id: 'prov-2',
    codigo: 'PRV-002',
    ruc: '20100190797',
    razonSocial: 'Leche Gloria S.A.',
    nombreComercial: 'Gloria',
    contacto: 'Patricia Benavides',
    telefono: '994 551 220',
    correo: 'ventas.oriente@gloria.com.pe',
    direccion: 'Av. República de Panamá 2461, Lima',
    ciudad: 'Tingo María',
    provincia: 'Leoncio Prado',
    pais: 'Perú',
    codigoPostal: '10131',
    rubro: 'Lácteos y Derivados',
    condicionPago: 'Crédito a 30 días',
    diasCredito: 30,
    limiteCredito: 15000,
    totalCompras: 12400.0,
    saldoPendiente: 940.0,
    descripcion: 'Suministro mayorista de leche evaporada Gloria, yogures, mantequillas y conservas.',
    activo: true,
    calificacion: 5,
    fechaRegistro: '2025-02-10',
  },
  {
    id: 'prov-3',
    codigo: 'PRV-003',
    ruc: '20100107843',
    razonSocial: 'Arca Continental Lindley S.A.',
    nombreComercial: 'Coca-Cola / Arca Continental',
    contacto: 'Roberto Chumpitaz',
    telefono: '955 667 889',
    correo: 'pedidos@arcacontal.com',
    direccion: 'Planta Huánuco - Av. Universitaria 890',
    ciudad: 'Huánuco',
    provincia: 'Huánuco',
    pais: 'Perú',
    codigoPostal: '10001',
    rubro: 'Bebidas y Gaseosas',
    condicionPago: 'Contado / Transferencia',
    diasCredito: 0,
    limiteCredito: 10000,
    totalCompras: 9800.0,
    saldoPendiente: 0.0,
    descripcion: 'Distribuidor oficial de Inca Kola, Coca-Cola, Fanta, Sprite y agua San Luis.',
    activo: true,
    calificacion: 5,
    fechaRegistro: '2025-03-01',
  },
  {
    id: 'prov-4',
    codigo: 'PRV-004',
    ruc: '20100113610',
    razonSocial: 'Unión de Cervecerías Peruanas Backus y Johnston S.A.A.',
    nombreComercial: 'Backus',
    contacto: 'Walter Cárdenas',
    telefono: '944 332 110',
    correo: 'atencion.selva@backus.com.pe',
    direccion: 'Distribuidora Pucallpa - Tingo María',
    ciudad: 'Tingo María',
    provincia: 'Leoncio Prado',
    pais: 'Perú',
    codigoPostal: '10131',
    rubro: 'Bebidas y Licores',
    condicionPago: 'Contado',
    diasCredito: 0,
    limiteCredito: 12000,
    totalCompras: 14200.0,
    saldoPendiente: 0.0,
    descripcion: 'Distribución de cervezas Pilsen Callao, Cristal, Cusqueña y agua San Mateo.',
    activo: true,
    calificacion: 5,
    fechaRegistro: '2025-03-20',
  },
  {
    id: 'prov-5',
    codigo: 'PRV-005',
    ruc: '20542318991',
    razonSocial: 'Distribuidora Selva Central E.I.R.L.',
    nombreComercial: 'Selva Central Mayorista',
    contacto: 'Julio César Pérez',
    telefono: '962 100 240',
    correo: 'selvacentral.ventas@gmail.com',
    direccion: 'Jr. Tito Jaime 840, Tingo María',
    ciudad: 'Tingo María',
    provincia: 'Leoncio Prado',
    pais: 'Perú',
    codigoPostal: '10131',
    rubro: 'Distribuidor Mayorista Local',
    condicionPago: 'Crédito a 15 días',
    diasCredito: 15,
    limiteCredito: 6000,
    totalCompras: 6700.0,
    saldoPendiente: 450.0,
    descripcion: 'Distribuidor local de snacks Lay’s, galletas Field/Mondelez, chocolates y confitería.',
    activo: true,
    calificacion: 4,
    fechaRegistro: '2025-05-12',
  },
  {
    id: 'prov-6',
    codigo: 'PRV-006',
    ruc: '20601839210',
    razonSocial: 'DonDocument Rollos & Empaques S.A.C.',
    nombreComercial: 'DonDocument POS',
    contacto: 'Marcos Villegas',
    telefono: '944 567 890',
    correo: 'pedidos@dondocument.com',
    direccion: 'Av. Nicolás Arriola 450, Lima',
    ciudad: 'Lima',
    provincia: 'Lima',
    pais: 'Perú',
    codigoPostal: '15021',
    rubro: 'Papelería y Rollos POS',
    condicionPago: 'Contado',
    diasCredito: 0,
    limiteCredito: 3000,
    totalCompras: 1250.0,
    saldoPendiente: 0.0,
    descripcion: 'Rollos térmicos de 80mm y 57mm para ticketeras y POS de minimarket, bolsas biodegradables.',
    activo: true,
    calificacion: 5,
    fechaRegistro: '2025-07-08',
  },
];

// ==========================================
// VARIABLES DE ESTADO EN MEMORIA
// ==========================================
let productos: Producto[] = structuredClone(DEFAULT_PRODUCTOS);
let ventas: Venta[] = structuredClone(DEFAULT_VENTAS);
let pedidos: Pedido[] = structuredClone(DEFAULT_PEDIDOS);
let cotizaciones: Cotizacion[] = structuredClone(DEFAULT_COTIZACIONES);
let devoluciones: Devolucion[] = structuredClone(DEFAULT_DEVOLUCIONES);
let movimientosKardex: MovimientoKardex[] = structuredClone(DEFAULT_KARDEX);
let ajustesInventario: AjusteInventario[] = structuredClone(DEFAULT_AJUSTES);
let estadoCaja: EstadoCaja = structuredClone(DEFAULT_ESTADO_CAJA);
let cajas: CajaInfo[] = structuredClone(DEFAULT_CAJAS);
let cierresCaja: CierreCaja[] = structuredClone(DEFAULT_CIERRES_CAJA);
let auditoriaCaja: AuditoriaCaja[] = structuredClone(DEFAULT_AUDITORIA_CAJA);
let movimientosCaja: MovimientoCaja[] = structuredClone(DEFAULT_MOVIMIENTOS_CAJA);
let gastos: Gasto[] = structuredClone(DEFAULT_GASTOS);
let compras: Compra[] = structuredClone(DEFAULT_COMPRAS);
let clientes: Cliente[] = structuredClone(DEFAULT_CLIENTES);
let proveedores: Proveedor[] = structuredClone(DEFAULT_PROVEEDORES);

// ==========================================
// PERSISTENCIA EN LOCALSTORAGE
// ==========================================
function loadStateFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.productos) && parsed.productos.length > 0) {
      productos = parsed.productos;
      ventas = parsed.ventas || [];
      pedidos = parsed.pedidos || [];
      cotizaciones = parsed.cotizaciones || [];
      devoluciones = parsed.devoluciones || [];
      movimientosKardex = parsed.movimientosKardex || [];
      ajustesInventario = parsed.ajustesInventario || [];
      estadoCaja = parsed.estadoCaja || structuredClone(DEFAULT_ESTADO_CAJA);
      cajas = parsed.cajas || structuredClone(DEFAULT_CAJAS);
      cierresCaja = parsed.cierresCaja || [];
      auditoriaCaja = parsed.auditoriaCaja || [];
      movimientosCaja = parsed.movimientosCaja || [];
      gastos = parsed.gastos || [];
      compras = parsed.compras || [];
      clientes = parsed.clientes || [];
      proveedores = parsed.proveedores || [];
      return true;
    }
  } catch (err) {
    console.warn('[erpStore] Error al leer estado de localStorage:', err);
  }
  return false;
}

function saveStateToStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      productos,
      ventas,
      pedidos,
      cotizaciones,
      devoluciones,
      movimientosKardex,
      ajustesInventario,
      estadoCaja,
      cajas,
      cierresCaja,
      auditoriaCaja,
      movimientosCaja,
      gastos,
      compras,
      clientes,
      proveedores,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[erpStore] Error al guardar estado en localStorage:', err);
  }
}

// Inicialización de la persistencia
if (typeof window !== 'undefined') {
  // Limpieza preventiva de versiones anteriores obsoletas
  try {
    localStorage.removeItem('KIPUS_ERP_STORAGE');
  } catch {}

  const loaded = loadStateFromStorage();
  if (!loaded) {
    saveStateToStorage();
  }
}

// ==========================================
// SUSCRIPCIÓN REACTIVA DE EVENTOS
// ==========================================
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  saveStateToStorage();
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignorar errores en callbacks
    }
  });
}

export function subscribeToErp(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Sincronización en tiempo real entre múltiples pestañas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      if (loadStateFromStorage()) {
        listeners.forEach((listener) => {
          try {
            listener();
          } catch {}
        });
      }
    }
  });
}

// ==========================================
// API UNIFICADA DEL ERP STORE
// ==========================================
export const erpStore = {
  // Getters
  getProductos: () => [...productos],
  getVentas: () => [...ventas],
  getKardex: () => [...movimientosKardex],
  getEstadoCaja: () => ({ ...estadoCaja }),
  getMovimientosCaja: () => [...movimientosCaja],
  getCajas: () => [...cajas],
  getCierresCaja: () => [...cierresCaja],
  getAuditoriaCaja: () => [...auditoriaCaja],
  getGastos: () => [...gastos],
  getCompras: () => [...compras],
  getClientes: () => [...clientes],
  getProveedores: () => [...proveedores],

  /**
   * Restablece todos los datos de prueba a los valores por defecto del Minimarket.
   */
  restablecerDatosMinimarket: () => {
    productos = structuredClone(DEFAULT_PRODUCTOS);
    ventas = structuredClone(DEFAULT_VENTAS);
    pedidos = structuredClone(DEFAULT_PEDIDOS);
    cotizaciones = structuredClone(DEFAULT_COTIZACIONES);
    devoluciones = structuredClone(DEFAULT_DEVOLUCIONES);
    movimientosKardex = structuredClone(DEFAULT_KARDEX);
    ajustesInventario = structuredClone(DEFAULT_AJUSTES);
    estadoCaja = structuredClone(DEFAULT_ESTADO_CAJA);
    cajas = structuredClone(DEFAULT_CAJAS);
    cierresCaja = structuredClone(DEFAULT_CIERRES_CAJA);
    auditoriaCaja = structuredClone(DEFAULT_AUDITORIA_CAJA);
    movimientosCaja = structuredClone(DEFAULT_MOVIMIENTOS_CAJA);
    gastos = structuredClone(DEFAULT_GASTOS);
    compras = structuredClone(DEFAULT_COMPRAS);
    clientes = structuredClone(DEFAULT_CLIENTES);
    proveedores = structuredClone(DEFAULT_PROVEEDORES);
    notify();
  },

  /**
   * FLUJO 1: EMITIR VENTA (POS / FACTURACIÓN)
   * Impactos Correlacionales:
   * 1. Registra la venta con su comprobante (Boleta, Factura, Nota de Venta).
   * 2. Descuenta stock del producto en el catálogo.
   * 3. Registra movimiento en Kardex (SALIDA - VENTA) con stock resultante real.
   * 4. Ingresa dinero a Caja (Efectivo en gaveta o Billeteras Digitales).
   * 5. Actualiza total de compras del cliente.
   * 6. Actualiza métricas del Dashboard en tiempo real.
   */
  emitirVenta: (payload: NuevaVentaPayload): Venta => {
    const subtotalBruto = payload.items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
    const descuento = payload.descuento || 0;
    const total = Math.max(0, +(subtotalBruto - descuento).toFixed(2));
    const subtotal = payload.tipoComprobante === 'NOTA_VENTA' ? total : +(total / 1.18).toFixed(2);
    const igv = +(total - subtotal).toFixed(2);

    const prefix = payload.tipoComprobante === 'FACTURA' ? 'F001' : payload.tipoComprobante === 'BOLETA' ? 'B001' : 'NV01';
    const nextNum = String(ventas.length + 501).padStart(6, '0');
    const serieCorrelativo = `${prefix}-${nextNum}`;
    const ahora = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const nuevaVenta: Venta = {
      id: `v-${Date.now()}`,
      tipoComprobante: payload.tipoComprobante,
      serieCorrelativo,
      clienteNombre: payload.clienteNombre || 'Consumidor Final',
      clienteDocumento: payload.clienteDocumento || '00000000',
      fecha: ahora,
      metodoPago: payload.metodoPago,
      desglosePagoMixto: payload.desglosePagoMixto,
      montoRecibido: payload.montoRecibido || total,
      vuelto: payload.vuelto || 0,
      estado: 'COMPLETADA',
      subtotal,
      descuento,
      igv,
      total,
      sucursal: payload.sucursal || 'Sede Central (Tingo María)',
      caja: payload.caja || 'Caja 01 - Mostrador',
      vendedor: payload.vendedor || 'Juan Pérez (Cajero)',
      items: payload.items.map((it) => ({
        ...it,
        subtotal: +(it.cantidad * it.precioUnitario).toFixed(2),
      })),
    };

    // 1. Guardar Venta
    ventas = [nuevaVenta, ...ventas];

    // 2. Descontar Stock & Generar Kardex por cada ítem vendido
    payload.items.forEach((item) => {
      const prod = productos.find((p) => p.id === item.productoId || p.nombre === item.nombre);
      const stockAnterior = prod ? prod.stock : 20;
      const stockNuevo = Math.max(0, stockAnterior - item.cantidad);

      if (prod) {
        prod.stock = stockNuevo;
      }

      // Registro estricto en Kardex
      const movKardex: MovimientoKardex = {
        id: `k-${Date.now()}-${Math.random()}`,
        fecha: ahora,
        tipo: 'SALIDA',
        motivo: 'VENTA',
        productoNombre: item.nombre,
        sku: prod?.sku || 'SKU-GEN',
        almacen: payload.sucursal || 'Almacén Principal',
        cantidad: item.cantidad,
        stockResultante: stockNuevo,
        referencia: `${payload.tipoComprobante} ${serieCorrelativo}`,
        usuario: payload.vendedor || 'Cajero',
        origen: 'Venta',
      };
      movimientosKardex = [movKardex, ...movimientosKardex];
    });

    // 3. Impacto en Caja
    const fechaHoy = ahora.slice(0, 10);
    const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const metodoCaja: 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA' | 'TRANSFERENCIA' =
      payload.metodoPago === 'MIXTO' || payload.metodoPago === 'CREDITO'
        ? 'EFECTIVO'
        : payload.metodoPago;

    const movCaja: MovimientoCaja = {
      id: `mc-${Date.now()}`,
      fecha: fechaHoy,
      hora,
      tipo: 'INGRESO',
      concepto: `Cobro ${serieCorrelativo} (${nuevaVenta.clienteNombre})`,
      metodo: metodoCaja,
      monto: total,
      usuario: payload.vendedor || 'Juan Pérez',
      sucursal: payload.sucursal || estadoCaja.sucursal,
      cajaNombre: estadoCaja.nombre,
      origenTipo: 'VENTA',
      comprobanteRef: serieCorrelativo,
    };
    movimientosCaja = [movCaja, ...movimientosCaja];

    if (payload.metodoPago === 'EFECTIVO') {
      estadoCaja.ventasEfectivo += total;
      estadoCaja.saldoEfectivoEsperado += total;
      estadoCaja.totalVentasGeneral += total;
    } else if (payload.metodoPago === 'MIXTO' && payload.desglosePagoMixto) {
      const ef = payload.desglosePagoMixto.efectivo || 0;
      const dig = Math.max(0, total - ef);
      estadoCaja.ventasEfectivo += ef;
      estadoCaja.saldoEfectivoEsperado += ef;
      estadoCaja.totalVentasDigitales += dig;
      estadoCaja.totalVentasGeneral += total;
    } else {
      if (payload.metodoPago === 'YAPE') estadoCaja.ventasDigitales.yape += total;
      else if (payload.metodoPago === 'PLIN') estadoCaja.ventasDigitales.plin += total;
      else if (payload.metodoPago === 'TARJETA') estadoCaja.ventasDigitales.tarjeta += total;
      else if (payload.metodoPago === 'TRANSFERENCIA') estadoCaja.ventasDigitales.transferencia += total;
      estadoCaja.totalVentasDigitales += total;
      estadoCaja.totalVentasGeneral += total;
    }

    // Actualizar saldo de la caja activa
    const idxCaja = cajas.findIndex((c) => c.id === estadoCaja.id);
    if (idxCaja >= 0) {
      cajas[idxCaja].saldoActualEfectivo = estadoCaja.saldoEfectivoEsperado;
      cajas[idxCaja].ventasDia += total;
      cajas[idxCaja].ultimaActividad = `Venta ${serieCorrelativo} a las ${hora}`;
    }

    // 4. Actualizar Cliente
    const cli = clientes.find((c) => c.numeroDocumento === payload.clienteDocumento);
    if (cli) {
      cli.totalCompras += total;
    }

    notify();
    return nuevaVenta;
  },

  /**
   * FLUJO 2: REGISTRAR COMPRA A PROVEEDOR
   * 1. Registra la factura o comprobante del proveedor.
   * 2. Incrementa el stock en el inventario/kardex del producto abastecido.
   * 3. Si fue pagada en efectivo, descuenta dinero de Caja y añade movimiento de egreso.
   */
  registrarCompra: (payload: NuevaCompraPayload & { productoId?: string }): Compra => {
    const ahora = new Date().toISOString().slice(0, 10);
    const nuevaCompra: Compra = {
      id: `c-${Date.now()}`,
      fecha: ahora,
      estado: 'RECIBIDO',
      proveedorNombre: payload.proveedorNombre,
      proveedorRuc: payload.proveedorRuc,
      serieFactura: payload.serieFactura,
      total: payload.total,
      metodoPago: payload.metodoPago,
      itemsCount: payload.itemsCount,
    };

    compras = [nuevaCompra, ...compras];

    // Aumentar stock del producto seleccionado o el primero
    const prod = productos.find((p) => p.id === payload.productoId) || productos[0];
    if (prod) {
      prod.stock += payload.itemsCount;
      const movKardex: MovimientoKardex = {
        id: `k-${Date.now()}`,
        fecha: ahora,
        tipo: 'ENTRADA',
        motivo: 'COMPRA',
        productoNombre: prod.nombre,
        sku: prod.sku,
        almacen: 'Almacén Principal',
        cantidad: payload.itemsCount,
        stockResultante: prod.stock,
        referencia: `Factura Proveedor ${payload.serieFactura}`,
        usuario: 'Carlos Vega',
        origen: 'Compra',
      };
      movimientosKardex = [movKardex, ...movimientosKardex];
    }

    // Si se pagó en efectivo, egreso de caja
    if (payload.metodoPago === 'EFECTIVO') {
      const ahoraDate = new Date();
      const hora = ahoraDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      movimientosCaja = [
        {
          id: `mc-${Date.now()}`,
          fecha: ahora,
          hora,
          tipo: 'EGRESO',
          concepto: `Pago Factura Compra ${payload.serieFactura} (${payload.proveedorNombre})`,
          metodo: 'EFECTIVO',
          monto: payload.total,
          usuario: 'Carlos Vega',
          sucursal: estadoCaja.sucursal,
          cajaNombre: estadoCaja.nombre,
          origenTipo: 'GASTO',
          comprobanteRef: payload.serieFactura,
        },
        ...movimientosCaja,
      ];
      estadoCaja.egresosEfectivo += payload.total;
      estadoCaja.saldoEfectivoEsperado -= payload.total;
    }

    notify();
    return nuevaCompra;
  },

  /**
   * FLUJO 3: REGISTRAR GASTO OPERATIVO
   * 1. Registra el egreso en el módulo de Gastos.
   * 2. Si es en efectivo, descuenta inmediatamente de Caja y genera registro de auditoría.
   */
  registrarGasto: (payload: NuevoGastoPayload): Gasto => {
    const ahora = new Date().toISOString().slice(0, 10);
    const nuevoGasto: Gasto = {
      id: `g-${Date.now()}`,
      fecha: ahora,
      ...payload,
    };
    gastos = [nuevoGasto, ...gastos];

    if (payload.metodoPago === 'EFECTIVO') {
      const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      movimientosCaja = [
        {
          id: `mc-${Date.now()}`,
          fecha: ahora,
          hora,
          tipo: 'EGRESO',
          concepto: `Gasto: ${payload.descripcion}`,
          metodo: 'EFECTIVO',
          monto: payload.monto,
          usuario: 'Administrador',
          sucursal: estadoCaja.sucursal,
          cajaNombre: estadoCaja.nombre,
          origenTipo: 'GASTO',
          categoria: payload.categoria,
          comprobanteRef: payload.comprobante,
        },
        ...movimientosCaja,
      ];
      estadoCaja.egresosEfectivo += payload.monto;
      estadoCaja.saldoEfectivoEsperado -= payload.monto;
    }

    notify();
    return nuevoGasto;
  },

  /**
   * FLUJO 4: MOVIMIENTO MANUAL DE ALMACÉN
   */
  registrarMovimientoAlmacen: (payload: NuevoMovimientoPayload): MovimientoKardex => {
    const prod = productos.find((p) => p.sku === payload.sku || p.nombre === payload.productoNombre);
    let nuevoStock = prod ? prod.stock : 10;

    if (payload.tipo === 'ENTRADA') {
      nuevoStock += payload.cantidad;
    } else if (payload.tipo === 'SALIDA') {
      nuevoStock = Math.max(0, nuevoStock - payload.cantidad);
    } else {
      nuevoStock = payload.cantidad;
    }

    if (prod) {
      prod.stock = nuevoStock;
    }

    const nuevo: MovimientoKardex = {
      id: `k-${Date.now()}`,
      fecha: new Date().toISOString().replace('T', ' ').slice(0, 16),
      tipo: payload.tipo,
      motivo: payload.motivo,
      productoNombre: payload.productoNombre,
      sku: payload.sku,
      almacen: payload.almacen,
      cantidad: payload.cantidad,
      stockResultante: nuevoStock,
      referencia: payload.referencia || 'Ajuste de Almacén',
      usuario: 'Carlos Vega',
      origen: 'Ajuste de inventario',
    };

    movimientosKardex = [nuevo, ...movimientosKardex];
    notify();
    return nuevo;
  },

  /**
   * FLUJO 5: OPERACIÓN DIRECTA DE CAJA (Ingreso / Retiro de efectivo)
   */
  registrarOperacionCaja: (payload: NuevaOperacionCajaPayload): MovimientoCaja => {
    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10);
    const hora = ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const nuevo: MovimientoCaja = {
      id: `mc-${Date.now()}`,
      fecha,
      hora,
      tipo: payload.tipo,
      concepto: payload.concepto,
      metodo: payload.metodo,
      monto: payload.monto,
      usuario: estadoCaja.responsable || 'Juan Pérez',
      sucursal: estadoCaja.sucursal,
      cajaNombre: estadoCaja.nombre,
      origenTipo: payload.tipo === 'INGRESO' ? 'INGRESO_MANUAL' : 'EGRESO_MANUAL',
      categoria: payload.categoria,
      observaciones: payload.observaciones,
    };

    movimientosCaja = [nuevo, ...movimientosCaja];

    if (payload.metodo === 'EFECTIVO') {
      if (payload.tipo === 'INGRESO') {
        estadoCaja.otrosIngresosEfectivo += payload.monto;
        estadoCaja.saldoEfectivoEsperado += payload.monto;
      } else {
        estadoCaja.egresosEfectivo += payload.monto;
        estadoCaja.saldoEfectivoEsperado -= payload.monto;
      }
    } else {
      if (payload.tipo === 'INGRESO') {
        if (payload.metodo === 'YAPE') estadoCaja.ventasDigitales.yape += payload.monto;
        else if (payload.metodo === 'PLIN') estadoCaja.ventasDigitales.plin += payload.monto;
        else if (payload.metodo === 'TARJETA') estadoCaja.ventasDigitales.tarjeta += payload.monto;
        else if (payload.metodo === 'TRANSFERENCIA') estadoCaja.ventasDigitales.transferencia += payload.monto;
        estadoCaja.totalVentasDigitales += payload.monto;
      }
    }

    // Auditoría
    auditoriaCaja = [
      {
        id: `aud-${Date.now()}`,
        usuario: estadoCaja.responsable || 'Juan Pérez',
        accion: payload.tipo,
        fecha,
        hora,
        caja: estadoCaja.nombre,
        sucursal: estadoCaja.sucursal,
        movimiento: `${payload.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'} de S/ ${payload.monto.toFixed(2)}: ${payload.concepto}`,
        observacion: payload.observaciones,
      },
      ...auditoriaCaja,
    ];

    notify();
    return nuevo;
  },

  // ==========================================
  // GESTIÓN DE CATÁLOGO DE PRODUCTOS
  // ==========================================
  crearProducto: (payload: NuevoProductoPayload): Producto => {
    const skuNormalizado = payload.sku.trim().toLowerCase();
    const skuExiste = productos.some((p) => p.sku.trim().toLowerCase() === skuNormalizado);
    if (skuExiste) {
      throw new Error(`El código SKU "${payload.sku}" ya se encuentra registrado en el catálogo.`);
    }

    const nuevo: Producto = {
      id: `prod-${Date.now()}`,
      ...payload,
      activo: true,
    };
    productos = [nuevo, ...productos];
    notify();
    return nuevo;
  },

  actualizarProducto: (id: string, payload: Partial<NuevoProductoPayload>): Producto => {
    const idx = productos.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Producto no encontrado');
    if (payload.sku) {
      const skuNormalizado = payload.sku.trim().toLowerCase();
      const existe = productos.some((p) => p.id !== id && p.sku.trim().toLowerCase() === skuNormalizado);
      if (existe) {
        throw new Error(`El código SKU "${payload.sku}" ya se encuentra registrado en otro producto.`);
      }
    }
    productos[idx] = {
      ...productos[idx],
      ...payload,
    };
    notify();
    return productos[idx];
  },

  eliminarProducto: (id: string): boolean => {
    productos = productos.filter((p) => p.id !== id);
    notify();
    return true;
  },

  toggleEstadoProducto: (id: string): Producto => {
    const prod = productos.find((p) => p.id === id);
    if (!prod) throw new Error('Producto no encontrado');
    prod.activo = !prod.activo;
    notify();
    return prod;
  },

  // ==========================================
  // CLIENTES Y PROVEEDORES
  // ==========================================
  crearCliente: (payload: NuevoClientePayload): Cliente => {
    const nuevo: Cliente = {
      id: `cli-${Date.now()}`,
      ...payload,
      totalCompras: 0,
      saldoPendiente: 0,
      activo: true,
    };
    clientes = [nuevo, ...clientes];
    notify();
    return nuevo;
  },

  crearProveedor: (payload: NuevoProveedorPayload): Proveedor => {
    const nextNum = String(proveedores.length + 1).padStart(3, '0');
    const nuevo: Proveedor = {
      id: `prov-${Date.now()}`,
      codigo: `PRV-${nextNum}`,
      ...payload,
      direccion: payload.direccion || 'Sin dirección registrada',
      ciudad: payload.ciudad || 'Tingo María',
      totalCompras: 0,
      saldoPendiente: 0,
      activo: true,
      calificacion: 5,
      fechaRegistro: new Date().toISOString().slice(0, 10),
    };
    proveedores = [nuevo, ...proveedores];
    notify();
    return nuevo;
  },

  actualizarProveedor: (id: string, payload: Partial<NuevoProveedorPayload>): Proveedor => {
    const idx = proveedores.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Proveedor no encontrado');
    proveedores[idx] = {
      ...proveedores[idx],
      ...payload,
    };
    notify();
    return proveedores[idx];
  },

  eliminarProveedor: (id: string): boolean => {
    proveedores = proveedores.filter((p) => p.id !== id);
    notify();
    return true;
  },

  toggleEstadoProveedor: (id: string): Proveedor => {
    const prov = proveedores.find((p) => p.id === id);
    if (!prov) throw new Error('Proveedor no encontrado');
    prov.activo = !prov.activo;
    notify();
    return prov;
  },

  /**
   * RECEPCIÓN DE MERCADERÍA
   */
  recepcionarMercancia: (payload: RecepcionMercanciaPayload): MovimientoKardex => {
    const prod = productos.find((p) => p.id === payload.productoId || p.sku === payload.sku || p.nombre === payload.productoNombre);
    const ahora = new Date().toISOString().replace('T', ' ').slice(0, 16);

    let nuevoStock = payload.cantidad;
    let productoNombre = payload.productoNombre;
    let sku = payload.sku;

    if (prod) {
      prod.stock += payload.cantidad;
      nuevoStock = prod.stock;
      productoNombre = prod.nombre;
      sku = prod.sku;
      if (payload.costoUnitario && payload.costoUnitario > 0) {
        prod.precioCompra = payload.costoUnitario;
      }
    }

    const movKardex: MovimientoKardex = {
      id: `k-${Date.now()}`,
      fecha: ahora,
      tipo: 'ENTRADA',
      motivo: 'COMPRA',
      productoNombre,
      sku,
      almacen: payload.almacen || 'Almacén Principal',
      cantidad: payload.cantidad,
      stockResultante: nuevoStock,
      referencia: `Guía/Fac. ${payload.guiaFactura} (${payload.proveedorNombre})`,
      usuario: 'Carlos Vega',
      origen: 'Compra',
    };

    movimientosKardex = [movKardex, ...movimientosKardex];
    notify();
    return movKardex;
  },

  /**
   * AUDITORÍA Y AJUSTE DE CONTEO FÍSICO
   */
  registrarAjusteAuditoria: (payload: AjusteAuditoriaPayload): MovimientoKardex => {
    const prod = productos.find((p) => p.id === payload.productoId);
    const ahora = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const stockAnterior = prod ? prod.stock : 0;
    const nuevoStock = Math.max(0, payload.stockReal);
    const diferencia = nuevoStock - stockAnterior;

    if (prod) {
      prod.stock = nuevoStock;
    }

    const tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' =
      diferencia > 0 ? 'ENTRADA' : diferencia < 0 ? 'SALIDA' : 'AJUSTE';
    const motivo = diferencia < 0 ? 'MERMA' : 'AUDITORIA_CONTEO';

    const detalleReferencia =
      payload.observacion ||
      `Cotejo físico: Sistema (${stockAnterior}) vs Físico (${nuevoStock}) · Dif: ${diferencia >= 0 ? '+' : ''}${diferencia}`;

    const movKardex: MovimientoKardex = {
      id: `k-${Date.now()}`,
      fecha: ahora,
      tipo,
      motivo,
      productoNombre: prod ? prod.nombre : 'Producto',
      sku: prod ? prod.sku : 'SKU-AJUSTE',
      almacen: payload.almacen || 'Almacén Principal',
      cantidad: Math.abs(diferencia),
      stockResultante: nuevoStock,
      referencia: detalleReferencia,
      usuario: 'Carlos Vega',
      origen: 'Ajuste de inventario',
    };

    movimientosKardex = [movKardex, ...movimientosKardex];
    notify();
    return movKardex;
  },

  // ==========================================
  // AJUSTES DE INVENTARIO
  // ==========================================
  getAjustesInventario: (): AjusteInventario[] => [...ajustesInventario],

  registrarAjusteInventario: (payload: NuevoAjustePayload): AjusteInventario => {
    const prod = productos.find((p) => p.id === payload.productoId);
    if (!prod) throw new Error('Producto no encontrado');

    const ahora = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const stockAnterior = prod.stock;
    const nuevoStock = Math.max(0, payload.nuevoStock);
    const diferencia = nuevoStock - stockAnterior;

    prod.stock = nuevoStock;

    const nuevoAjuste: AjusteInventario = {
      id: `aj-${Date.now()}`,
      productoId: prod.id,
      productoNombre: prod.nombre,
      sku: prod.sku,
      stockAnterior,
      nuevoStock,
      diferencia,
      motivo: payload.motivo,
      observacion: payload.observacion,
      fecha: ahora,
      usuario: 'Carlos Vega',
      almacen: payload.almacen || 'Almacén Principal',
    };

    ajustesInventario = [nuevoAjuste, ...ajustesInventario];

    const tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' =
      diferencia > 0 ? 'ENTRADA' : diferencia < 0 ? 'SALIDA' : 'AJUSTE';

    const movKardex: MovimientoKardex = {
      id: `k-${Date.now()}`,
      fecha: ahora,
      tipo,
      motivo: diferencia < 0 ? 'MERMA' : 'AUDITORIA_CONTEO',
      productoNombre: prod.nombre,
      sku: prod.sku,
      almacen: payload.almacen || 'Almacén Principal',
      cantidad: Math.abs(diferencia),
      stockResultante: nuevoStock,
      referencia: `Ajuste: ${payload.motivo}${payload.observacion ? ` (${payload.observacion})` : ''}`,
      usuario: 'Carlos Vega',
      origen: 'Ajuste de inventario',
    };

    movimientosKardex = [movKardex, ...movimientosKardex];
    notify();
    return nuevoAjuste;
  },

  aplicarAjustesFisicos: (items: { productoId: string; stockFisico: number; motivo?: string }[]): AjusteInventario[] => {
    const ahora = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const nuevosAjustes: AjusteInventario[] = [];

    items.forEach((item) => {
      const prod = productos.find((p) => p.id === item.productoId);
      if (!prod) return;

      const stockAnterior = prod.stock;
      const nuevoStock = Math.max(0, item.stockFisico);
      const diferencia = nuevoStock - stockAnterior;

      if (diferencia === 0) return;

      prod.stock = nuevoStock;

      const aj: AjusteInventario = {
        id: `aj-${Date.now()}-${prod.id}`,
        productoId: prod.id,
        productoNombre: prod.nombre,
        sku: prod.sku,
        stockAnterior,
        nuevoStock,
        diferencia,
        motivo: item.motivo || 'Inventario físico',
        observacion: `Ajuste automático por conteo físico (Sistema: ${stockAnterior}, Físico: ${nuevoStock})`,
        fecha: ahora,
        usuario: 'Carlos Vega',
        almacen: 'Almacén Principal',
      };

      nuevosAjustes.push(aj);

      const tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' =
        diferencia > 0 ? 'ENTRADA' : 'SALIDA';

      const movKardex: MovimientoKardex = {
        id: `k-${Date.now()}-${prod.id}`,
        fecha: ahora,
        tipo,
        motivo: 'AUDITORIA_CONTEO',
        productoNombre: prod.nombre,
        sku: prod.sku,
        almacen: 'Almacén Principal',
        cantidad: Math.abs(diferencia),
        stockResultante: nuevoStock,
        referencia: `Inventario físico: ${diferencia > 0 ? '+' : ''}${diferencia} unid.`,
        usuario: 'Carlos Vega',
        origen: 'Ajuste de inventario',
      };

      movimientosKardex = [movKardex, ...movimientosKardex];
    });

    if (nuevosAjustes.length > 0) {
      ajustesInventario = [...nuevosAjustes, ...ajustesInventario];
      notify();
    }

    return nuevosAjustes;
  },

  // ==========================================
  // PEDIDOS
  // ==========================================
  getPedidos: () => [...pedidos],

  crearPedido: (payload: Omit<Pedido, 'id' | 'codigo' | 'fecha'>): Pedido => {
    const nuevo: Pedido = {
      id: `ped-${Date.now()}`,
      codigo: `PED-${String(pedidos.length + 43).padStart(4, '0')}`,
      fecha: new Date().toISOString().replace('T', ' ').slice(0, 16),
      ...payload,
    };
    pedidos = [nuevo, ...pedidos];
    notify();
    return nuevo;
  },

  cambiarEstadoPedido: (id: string, nuevoEstado: Pedido['estado']): void => {
    pedidos = pedidos.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p));
    notify();
  },

  convertirPedidoAVenta: (pedidoId: string): Venta => {
    const pedido = pedidos.find((p) => p.id === pedidoId);
    if (!pedido) throw new Error('Pedido no encontrado');

    const venta = erpStore.emitirVenta({
      tipoComprobante: 'BOLETA',
      clienteNombre: pedido.clienteNombre,
      clienteDocumento: '00000000',
      metodoPago: 'EFECTIVO',
      items: pedido.items.map((it) => ({
        productoId: it.productoId,
        nombre: it.nombre,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
      })),
      sucursal: pedido.sucursal,
    });

    pedido.estado = 'ENTREGADO';
    notify();
    return venta;
  },

  // ==========================================
  // COTIZACIONES
  // ==========================================
  getCotizaciones: () => [...cotizaciones],

  crearCotizacion: (payload: Omit<Cotizacion, 'id' | 'numero' | 'fecha'>): Cotizacion => {
    const nueva: Cotizacion = {
      id: `cot-${Date.now()}`,
      numero: `COT-${String(cotizaciones.length + 19).padStart(4, '0')}`,
      fecha: new Date().toISOString().slice(0, 10),
      ...payload,
    };
    cotizaciones = [nueva, ...cotizaciones];
    notify();
    return nueva;
  },

  convertirCotizacionAVenta: (cotizacionId: string): Venta => {
    const cot = cotizaciones.find((c) => c.id === cotizacionId);
    if (!cot) throw new Error('Cotización no encontrada');

    const venta = erpStore.emitirVenta({
      tipoComprobante: cot.clienteDocumento.length === 11 ? 'FACTURA' : 'BOLETA',
      clienteNombre: cot.clienteNombre,
      clienteDocumento: cot.clienteDocumento,
      metodoPago: 'TRANSFERENCIA',
      items: cot.items.map((it) => ({
        productoId: it.productoId,
        nombre: it.nombre,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
      })),
    });

    cot.estado = 'CONVERTIDA';
    notify();
    return venta;
  },

  // ==========================================
  // DEVOLUCIONES Y ANULACIONES
  // ==========================================
  getDevoluciones: () => [...devoluciones],

  registrarDevolucion: (payload: {
    ventaId: string;
    productoId: string;
    cantidad: number;
    motivo: string;
    retornaAInventario: boolean;
    afectaCaja: boolean;
  }): Devolucion => {
    const venta = ventas.find((v) => v.id === payload.ventaId);
    const prod = productos.find((p) => p.id === payload.productoId);
    const ahora = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const itemVenta = venta?.items.find((it) => it.productoId === payload.productoId);
    const montoUnitario = itemVenta ? itemVenta.precioUnitario : prod?.precioVenta || 0;
    const montoTotalDevuelto = +(montoUnitario * payload.cantidad).toFixed(2);

    const nuevaDevolucion: Devolucion = {
      id: `dev-${Date.now()}`,
      ventaId: payload.ventaId,
      serieCorrelativo: venta?.serieCorrelativo || 'V-S/N',
      fecha: ahora,
      productoNombre: prod?.nombre || itemVenta?.nombre || 'Artículo',
      sku: prod?.sku || 'SKU-DEV',
      cantidad: payload.cantidad,
      motivo: payload.motivo,
      montoDevuelto: montoTotalDevuelto,
      retornaAInventario: payload.retornaAInventario,
      afectaCaja: payload.afectaCaja,
      usuario: 'Juan Pérez',
    };

    devoluciones = [nuevaDevolucion, ...devoluciones];

    // Reingreso al stock si retorna al almacén
    if (payload.retornaAInventario && prod) {
      prod.stock += payload.cantidad;
      const movKardex: MovimientoKardex = {
        id: `k-${Date.now()}`,
        fecha: ahora,
        tipo: 'ENTRADA',
        motivo: 'AUDITORIA_CONTEO',
        productoNombre: prod.nombre,
        sku: prod.sku,
        almacen: venta?.sucursal || 'Almacén Principal',
        cantidad: payload.cantidad,
        stockResultante: prod.stock,
        referencia: `Devolución ${venta?.serieCorrelativo}: ${payload.motivo}`,
        usuario: 'Juan Pérez',
        origen: 'Ajuste de inventario',
      };
      movimientosKardex = [movKardex, ...movimientosKardex];
    }

    // Egreso de caja si se entregó efectivo al cliente
    if (payload.afectaCaja) {
      const ahoraDate = new Date();
      const fecha = ahoraDate.toISOString().slice(0, 10);
      const hora = ahoraDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      movimientosCaja = [
        {
          id: `mc-${Date.now()}`,
          fecha,
          hora,
          tipo: 'EGRESO',
          concepto: `Reembolso por devolución ${venta?.serieCorrelativo}`,
          metodo: 'EFECTIVO',
          monto: montoTotalDevuelto,
          usuario: 'Juan Pérez',
          sucursal: venta?.sucursal || estadoCaja.sucursal,
          cajaNombre: estadoCaja.nombre,
          origenTipo: 'DEVOLUCION',
          comprobanteRef: venta?.serieCorrelativo,
        },
        ...movimientosCaja,
      ];
      estadoCaja.egresosEfectivo += montoTotalDevuelto;
      estadoCaja.saldoEfectivoEsperado -= montoTotalDevuelto;
    }

    notify();
    return nuevaDevolucion;
  },

  anularVenta: (id: string, motivo: string): Venta => {
    const venta = ventas.find((v) => v.id === id);
    if (!venta) throw new Error('Venta no encontrada');

    venta.estado = 'ANULADA';
    venta.motivoAnulacion = motivo;
    const ahora = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Reingresar stock de todos los ítems
    venta.items.forEach((item) => {
      const prod = productos.find((p) => p.id === item.productoId || p.nombre === item.nombre);
      if (prod) {
        prod.stock += item.cantidad;
        const movKardex: MovimientoKardex = {
          id: `k-${Date.now()}-${Math.random()}`,
          fecha: ahora,
          tipo: 'ENTRADA',
          motivo: 'AUDITORIA_CONTEO',
          productoNombre: item.nombre,
          sku: prod.sku,
          almacen: venta.sucursal || 'Almacén Principal',
          cantidad: item.cantidad,
          stockResultante: prod.stock,
          referencia: `Anulación ${venta.serieCorrelativo}: ${motivo}`,
          usuario: 'Carlos Vega',
          origen: 'Ajuste de inventario',
        };
        movimientosKardex = [movKardex, ...movimientosKardex];
      }
    });

    // Reembolso de caja si fue en efectivo
    if (venta.metodoPago === 'EFECTIVO') {
      const ahoraDate = new Date();
      const fecha = ahoraDate.toISOString().slice(0, 10);
      const hora = ahoraDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      movimientosCaja = [
        {
          id: `mc-${Date.now()}`,
          fecha,
          hora,
          tipo: 'EGRESO',
          concepto: `Anulación comprobante ${venta.serieCorrelativo}`,
          metodo: 'EFECTIVO',
          monto: venta.total,
          usuario: 'Administrador',
          sucursal: venta.sucursal || estadoCaja.sucursal,
          cajaNombre: estadoCaja.nombre,
          origenTipo: 'VENTA',
          comprobanteRef: venta.serieCorrelativo,
        },
        ...movimientosCaja,
      ];
      estadoCaja.egresosEfectivo += venta.total;
      estadoCaja.saldoEfectivoEsperado -= venta.total;
    }

    notify();
    return venta;
  },

  // ==========================================
  // OPERACIONES DE CAJA (APERTURA, CIERRE, ARQUEO)
  // ==========================================
  abrirCaja: (payload: AperturaCajaPayload): EstadoCaja => {
    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10);
    const hora = ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    estadoCaja = {
      id: payload.cajaId || 'caja-1',
      nombre: payload.cajaId === 'caja-2' ? 'Caja 02 - Rápida / Billeteras' : 'Caja 01 - Mostrador Principal',
      sucursal: payload.sucursal || 'Sede Central (Tingo María)',
      responsable: payload.responsable || 'Juan Pérez',
      abierta: true,
      estado: 'ABIERTA',
      turno: `Turno (${hora})`,
      fechaApertura: fecha,
      horaApertura: hora,
      saldoInicial: payload.saldoInicial,
      ventasEfectivo: 0,
      otrosIngresosEfectivo: 0,
      egresosEfectivo: 0,
      saldoEfectivoEsperado: payload.saldoInicial,
      ventasDigitales: { yape: 0, plin: 0, tarjeta: 0, transferencia: 0 },
      totalVentasDigitales: 0,
      totalVentasGeneral: 0,
    };

    const movApertura: MovimientoCaja = {
      id: `mc-${Date.now()}`,
      fecha,
      hora,
      tipo: 'INGRESO',
      concepto: 'Apertura de turno - Sencillo en caja',
      metodo: 'EFECTIVO',
      monto: payload.saldoInicial,
      usuario: payload.responsable,
      sucursal: payload.sucursal,
      cajaNombre: estadoCaja.nombre,
      origenTipo: 'APERTURA',
      observaciones: payload.observaciones,
    };
    movimientosCaja = [movApertura, ...movimientosCaja];

    const idx = cajas.findIndex((c) => c.id === estadoCaja.id);
    if (idx >= 0) {
      cajas[idx].abierta = true;
      cajas[idx].estado = 'ABIERTA';
      cajas[idx].responsableActual = payload.responsable;
      cajas[idx].saldoActualEfectivo = payload.saldoInicial;
      cajas[idx].ultimaActividad = 'Apertura de turno';
    }

    auditoriaCaja = [
      {
        id: `aud-${Date.now()}`,
        usuario: payload.responsable,
        accion: 'APERTURA',
        fecha,
        hora,
        caja: estadoCaja.nombre,
        sucursal: estadoCaja.sucursal,
        movimiento: `Apertura con saldo inicial S/ ${payload.saldoInicial.toFixed(2)}`,
        valorAnterior: 'CERRADA',
        valorNuevo: 'ABIERTA',
        observacion: payload.observaciones,
      },
      ...auditoriaCaja,
    ];

    notify();
    return { ...estadoCaja };
  },

  cerrarCaja: (payload: CierreCajaPayload): CierreCaja => {
    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10);
    const hora = ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    const nuevoCierre: CierreCaja = {
      id: `cie-${Date.now()}`,
      cajaId: estadoCaja.id,
      cajaNombre: estadoCaja.nombre,
      sucursal: estadoCaja.sucursal,
      responsable: estadoCaja.responsable,
      fechaApertura: `${estadoCaja.fechaApertura} ${estadoCaja.horaApertura}`,
      fechaCierre: fecha,
      horaCierre: hora,
      saldoInicial: estadoCaja.saldoInicial,
      ventasEfectivo: estadoCaja.ventasEfectivo,
      otrosIngresos: estadoCaja.otrosIngresosEfectivo,
      egresos: estadoCaja.egresosEfectivo,
      saldoEsperado: estadoCaja.saldoEfectivoEsperado,
      saldoContado: payload.saldoContado,
      diferencia: payload.diferencia,
      estado: Math.abs(payload.diferencia) < 0.01 ? 'CUADRADA' : 'CON_DIFERENCIA',
      motivoDiferencia: payload.motivoDiferencia,
      observaciones: payload.observaciones,
      ventasTotales: estadoCaja.totalVentasGeneral,
      totalOperaciones: movimientosCaja.length,
    };

    cierresCaja = [nuevoCierre, ...cierresCaja];
    estadoCaja.abierta = false;
    estadoCaja.estado = 'CERRADA';

    const idx = cajas.findIndex((c) => c.id === estadoCaja.id);
    if (idx >= 0) {
      cajas[idx].abierta = false;
      cajas[idx].estado = 'CERRADA';
      cajas[idx].saldoActualEfectivo = 0;
      cajas[idx].ultimaActividad = `Cierre a las ${hora}`;
    }

    auditoriaCaja = [
      {
        id: `aud-${Date.now()}`,
        usuario: estadoCaja.responsable,
        accion: 'CIERRE',
        fecha,
        hora,
        caja: estadoCaja.nombre,
        sucursal: estadoCaja.sucursal,
        movimiento: `Cierre de turno. Esperado: S/ ${nuevoCierre.saldoEsperado.toFixed(2)}, Contado: S/ ${nuevoCierre.saldoContado.toFixed(2)} (Dif: S/ ${nuevoCierre.diferencia.toFixed(2)})`,
        valorAnterior: 'ABIERTA',
        valorNuevo: 'CERRADA',
        observacion: payload.motivoDiferencia || payload.observaciones,
      },
      ...auditoriaCaja,
    ];

    notify();
    return nuevoCierre;
  },

  registrarArqueo: (arqueo: ArqueoConteo): void => {
    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10);
    const hora = ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    auditoriaCaja = [
      {
        id: `aud-${Date.now()}`,
        usuario: arqueo.responsable,
        accion: 'ARQUEO',
        fecha,
        hora,
        caja: estadoCaja.nombre,
        sucursal: estadoCaja.sucursal,
        movimiento: `Conteo de dinero. Esperado: S/ ${arqueo.efectivoEsperado.toFixed(2)}, Contado: S/ ${arqueo.efectivoContado.toFixed(2)} (Dif: S/ ${arqueo.diferencia.toFixed(2)})`,
        observacion: arqueo.motivoDiferencia || arqueo.observaciones,
      },
      ...auditoriaCaja,
    ];

    notify();
  },
};
