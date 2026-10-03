/**
 * Tienda de Negocio Unificada (Business ERP Store)
 * Coordina el flujo real entre Ventas, Inventario (Kardex), Caja, Compras y Gastos.
 * Cualquier transacción en un módulo impacta inmediatamente a los módulos dependientes.
 */

import { Venta, NuevaVentaPayload } from '@/features/ventas/types/ventas.types';
import { Producto, NuevoProductoPayload } from '@/features/productos/types/productos.types';
import { MovimientoKardex, NuevoMovimientoPayload, AlmacenResumen } from '@/features/inventario/types/inventario.types';
import { EstadoCaja, MovimientoCaja, NuevaOperacionCajaPayload } from '@/features/caja/types/caja.types';
import { Gasto, NuevoGastoPayload } from '@/features/gastos/types/gastos.types';
import { Compra, NuevaCompraPayload } from '@/features/compras/types/compras.types';
import { Cliente, NuevoClientePayload } from '@/features/clientes/types/clientes.types';
import { Proveedor, NuevoProveedorPayload } from '@/features/proveedores/types/proveedores.types';

// ==========================================
// ESTADO INICIAL COMPARTIDO
// ==========================================

let productos: Producto[] = [
  {
    id: 'prod-1',
    sku: 'LUB-5W30-01',
    nombre: 'Aceite Motor Sintético 5W-30 (Galón)',
    categoria: 'Lubricantes',
    precioCompra: 75.0,
    precioVenta: 110.0,
    stock: 8,
    stockMinimo: 10,
    unidadMedida: 'GALON',
    activo: true,
  },
  {
    id: 'prod-2',
    sku: 'FLT-AIR-08',
    nombre: 'Filtro de Aire Universal Premium',
    categoria: 'Filtros',
    precioCompra: 28.0,
    precioVenta: 50.0,
    stock: 12,
    stockMinimo: 15,
    unidadMedida: 'UNIDAD',
    activo: true,
  },
  {
    id: 'prod-3',
    sku: 'BAT-12V-65',
    nombre: 'Batería 12V 65Ah Sellada',
    categoria: 'Eléctrico',
    precioCompra: 320.0,
    precioVenta: 455.0,
    stock: 5,
    stockMinimo: 12,
    unidadMedida: 'UNIDAD',
    activo: true,
  },
  {
    id: 'prod-4',
    sku: 'LIQ-FRN-04',
    nombre: 'Líquido de Frenos DOT 4 500ml',
    categoria: 'Químicos',
    precioCompra: 28.0,
    precioVenta: 48.5,
    stock: 16,
    stockMinimo: 15,
    unidadMedida: 'UNIDAD',
    activo: true,
  },
  {
    id: 'prod-5',
    sku: 'REF-ORG-01',
    nombre: 'Refrigerante Orgánico 50/50 1 Galón',
    categoria: 'Químicos',
    precioCompra: 38.0,
    precioVenta: 60.0,
    stock: 24,
    stockMinimo: 8,
    unidadMedida: 'GALON',
    activo: true,
  },
  {
    id: 'prod-6',
    sku: 'PST-FRN-CER',
    nombre: 'Pastillas de Freno Delanteras Cerámica',
    categoria: 'Frenos',
    precioCompra: 240.0,
    precioVenta: 372.5,
    stock: 18,
    stockMinimo: 5,
    unidadMedida: 'JUEGO',
    activo: true,
  },
];

let ventas: Venta[] = [
  {
    id: 'v-1',
    tipoComprobante: 'BOLETA',
    serieCorrelativo: 'B001-000482',
    clienteNombre: 'Distribuidora San Juan',
    clienteDocumento: '20554433221',
    fecha: '2026-10-02 14:32',
    metodoPago: 'YAPE',
    estado: 'COMPLETADA',
    subtotal: 550.85,
    igv: 99.15,
    total: 650.0,
    items: [
      { productoId: 'prod-1', nombre: 'Aceite Motor Sintético 5W-30 (Galón)', cantidad: 5, precioUnitario: 110.0, subtotal: 550.0 },
      { productoId: 'prod-2', nombre: 'Filtro de Aire Universal Premium', cantidad: 2, precioUnitario: 50.0, subtotal: 100.0 },
    ],
  },
  {
    id: 'v-2',
    tipoComprobante: 'FACTURA',
    serieCorrelativo: 'F001-000129',
    clienteNombre: 'Constructora del Sur S.A.C.',
    clienteDocumento: '20601299443',
    fecha: '2026-10-02 13:15',
    metodoPago: 'TRANSFERENCIA',
    estado: 'COMPLETADA',
    subtotal: 1542.37,
    igv: 277.63,
    total: 1820.0,
    items: [
      { productoId: 'prod-3', nombre: 'Batería 12V 65Ah Sellada', cantidad: 4, precioUnitario: 455.0, subtotal: 1820.0 },
    ],
  },
];

let movimientosKardex: MovimientoKardex[] = [
  {
    id: 'k-1',
    fecha: '2026-10-02 14:32',
    tipo: 'SALIDA',
    motivo: 'VENTA',
    productoNombre: 'Aceite Motor Sintético 5W-30 (Galón)',
    sku: 'LUB-5W30-01',
    almacen: 'Almacén Principal',
    cantidad: 5,
    stockResultante: 8,
    referencia: 'Boleta B001-000482',
    usuario: 'Admin',
  },
  {
    id: 'k-2',
    fecha: '2026-10-02 13:15',
    tipo: 'SALIDA',
    motivo: 'VENTA',
    productoNombre: 'Batería 12V 65Ah Sellada',
    sku: 'BAT-12V-65',
    almacen: 'Almacén Principal',
    cantidad: 4,
    stockResultante: 5,
    referencia: 'Factura F001-000129',
    usuario: 'Admin',
  },
];

let estadoCaja: EstadoCaja = {
  id: 'caja-1',
  abierta: true,
  turno: 'Turno Activo (08:00 - 18:00)',
  fechaApertura: '2026-10-02 08:00',
  saldoInicial: 200.0,
  ingresosEfectivo: 350.0,
  egresosEfectivo: 50.0,
  ingresosDigitales: 2470.0,
  saldoEfectivoEsperado: 500.0,
};

let movimientosCaja: MovimientoCaja[] = [
  {
    id: 'mc-1',
    fecha: '08:00',
    tipo: 'INGRESO',
    concepto: 'Apertura de turno - Sencillo en caja',
    metodo: 'EFECTIVO',
    monto: 200.0,
    usuario: 'Admin',
  },
  {
    id: 'mc-2',
    fecha: '13:15',
    tipo: 'INGRESO',
    concepto: 'Cobro Factura F001-000129 (Transferencia)',
    metodo: 'TRANSFERENCIA',
    monto: 1820.0,
    usuario: 'Admin',
  },
  {
    id: 'mc-3',
    fecha: '14:32',
    tipo: 'INGRESO',
    concepto: 'Cobro Boleta B001-000482 (Yape)',
    metodo: 'YAPE',
    monto: 650.0,
    usuario: 'Admin',
  },
];

let gastos: Gasto[] = [
  {
    id: 'g-1',
    fecha: '2026-10-01',
    categoria: 'ALQUILER',
    descripcion: 'Alquiler local comercial mes de Octubre',
    beneficiario: 'Inmobiliaria Los Pinos S.A.C.',
    comprobante: 'Factura F002-1923',
    monto: 2200.0,
    metodoPago: 'TRANSFERENCIA',
  },
  {
    id: 'g-2',
    fecha: '2026-10-02',
    categoria: 'SERVICIOS_BASICOS',
    descripcion: 'Recibo de luz eléctrica comercial',
    beneficiario: 'Enel Distribución',
    comprobante: 'Recibo S-882194',
    monto: 340.5,
    metodoPago: 'TRANSFERENCIA',
  },
];

let compras: Compra[] = [
  {
    id: 'c-1',
    fecha: '2026-10-01',
    proveedorNombre: 'Importadora y Distribuidora PetroPerú Repuestos',
    proveedorRuc: '20100128211',
    serieFactura: 'F001-0004921',
    total: 3500.0,
    estado: 'RECIBIDO',
    metodoPago: 'TRANSFERENCIA',
    itemsCount: 30,
  },
];

let clientes: Cliente[] = [
  {
    id: 'cli-1',
    documentoTipo: 'RUC',
    numeroDocumento: '20601299443',
    nombre: 'Constructora del Sur S.A.C.',
    telefono: '984 123 456',
    correo: 'compras@constructoradelsur.pe',
    direccion: 'Av. Ejército 720, Arequipa',
    totalCompras: 14250.0,
    saldoPendiente: 0,
    activo: true,
  },
  {
    id: 'cli-2',
    documentoTipo: 'RUC',
    numeroDocumento: '20554433221',
    nombre: 'Distribuidora San Juan',
    telefono: '991 884 122',
    correo: 'gerencia@distribuidorasanjuan.com',
    direccion: 'Jr. Huánuco 310, Lima',
    totalCompras: 8900.0,
    saldoPendiente: 480.0,
    activo: true,
  },
  {
    id: 'cli-3',
    documentoTipo: 'DNI',
    numeroDocumento: '43928174',
    nombre: 'María Elena Flores Gómez',
    telefono: '955 771 229',
    correo: 'm.flores@gmail.com',
    direccion: 'Calle Los Jazmines 145, Surco',
    totalCompras: 1450.5,
    saldoPendiente: 0,
    activo: true,
  },
];

let proveedores: Proveedor[] = [
  {
    id: 'prov-1',
    ruc: '20100128211',
    razonSocial: 'Importadora y Distribuidora PetroPerú Repuestos',
    contacto: 'Ing. Fernando Salazar',
    telefono: '998 441 200',
    correo: 'ventas@petroperurepuestos.pe',
    rubro: 'Lubricantes y Filtros',
    condicionPago: 'Crédito a 30 días',
  },
  {
    id: 'prov-2',
    ruc: '20512839912',
    razonSocial: 'Filtros y Baterías del Pacífico S.A.C.',
    contacto: 'Lic. Claudia Mendoza',
    telefono: '981 229 014',
    correo: 'cmendoza@filtrosdelpacifico.com',
    rubro: 'Baterías y Filtración',
    condicionPago: 'Contado / Transferencia',
  },
];

// ==========================================
// SUSCRIPCIÓN REACTIVA DE EVENTOS
// ==========================================
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignorar errores en callbacks desuscriptos
    }
  });
}

export function subscribeToErp(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
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
  getGastos: () => [...gastos],
  getCompras: () => [...compras],
  getClientes: () => [...clientes],
  getProveedores: () => [...proveedores],

  /**
   * FLUJO 1: EMITIR VENTA
   * Efecto Dominó:
   * 1. Registra venta.
   * 2. Descuenta stock del producto en catálogo.
   * 3. Registra movimiento en Kardex (SALIDA - VENTA).
   * 4. Ingresa dinero a Caja (Efectivo o Digital).
   * 5. Suma compra al cliente si existe.
   */
  emitirVenta: (payload: NuevaVentaPayload): Venta => {
    const total = payload.items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
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
      clienteNombre: payload.clienteNombre,
      clienteDocumento: payload.clienteDocumento,
      fecha: ahora,
      metodoPago: payload.metodoPago,
      estado: 'COMPLETADA',
      subtotal,
      igv,
      total,
      items: payload.items.map((it) => ({
        ...it,
        subtotal: it.cantidad * it.precioUnitario,
      })),
    };

    // 1. Guardar Venta
    ventas = [nuevaVenta, ...ventas];

    // 2. Descontar Stock & Generar Kardex por cada ítem
    payload.items.forEach((item) => {
      const prod = productos.find((p) => p.id === item.productoId || p.nombre === item.nombre);
      const stockAnterior = prod ? prod.stock : 20;
      const stockNuevo = Math.max(0, stockAnterior - item.cantidad);

      if (prod) {
        prod.stock = stockNuevo;
      }

      // Registro en Kardex
      const movKardex: MovimientoKardex = {
        id: `k-${Date.now()}-${Math.random()}`,
        fecha: ahora,
        tipo: 'SALIDA',
        motivo: 'VENTA',
        productoNombre: item.nombre,
        sku: prod?.sku || 'SKU-GEN',
        almacen: 'Almacén Principal',
        cantidad: item.cantidad,
        stockResultante: stockNuevo,
        referencia: `${payload.tipoComprobante} ${serieCorrelativo}`,
        usuario: 'Admin',
      };
      movimientosKardex = [movKardex, ...movimientosKardex];
    });

    // 3. Impacto en Caja
    const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const movCaja: MovimientoCaja = {
      id: `mc-${Date.now()}`,
      fecha: hora,
      tipo: 'INGRESO',
      concepto: `Cobro ${serieCorrelativo} (${payload.clienteNombre})`,
      metodo: payload.metodoPago,
      monto: total,
      usuario: 'Admin',
    };
    movimientosCaja = [movCaja, ...movimientosCaja];

    if (payload.metodoPago === 'EFECTIVO') {
      estadoCaja.ingresosEfectivo += total;
      estadoCaja.saldoEfectivoEsperado += total;
    } else {
      estadoCaja.ingresosDigitales += total;
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
   * 1. Registra compra.
   * 2. Incrementa el stock en el inventario/kardex.
   * 3. Si fue en efectivo, descuenta de Caja.
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
        usuario: 'Admin',
      };
      movimientosKardex = [movKardex, ...movimientosKardex];
    }

    // Si se pagó en efectivo, egreso de caja
    if (payload.metodoPago === 'EFECTIVO') {
      const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      movimientosCaja = [
        {
          id: `mc-${Date.now()}`,
          fecha: hora,
          tipo: 'EGRESO',
          concepto: `Pago Factura Compra ${payload.serieFactura}`,
          metodo: 'EFECTIVO',
          monto: payload.total,
          usuario: 'Admin',
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
   * FLUJO 3: REGISTRAR GASTO
   * 1. Registra egreso.
   * 2. Si es en efectivo, descuenta de Caja.
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
          fecha: hora,
          tipo: 'EGRESO',
          concepto: `Gasto: ${payload.descripcion}`,
          metodo: 'EFECTIVO',
          monto: payload.monto,
          usuario: 'Admin',
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
      usuario: 'Admin',
    };

    movimientosKardex = [nuevo, ...movimientosKardex];
    notify();
    return nuevo;
  },

  /**
   * FLUJO 5: OPERACIÓN DIRECTA DE CAJA
   */
  registrarOperacionCaja: (payload: NuevaOperacionCajaPayload): MovimientoCaja => {
    const nuevo: MovimientoCaja = {
      id: `mc-${Date.now()}`,
      fecha: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      tipo: payload.tipo,
      concepto: payload.concepto,
      metodo: payload.metodo,
      monto: payload.monto,
      usuario: 'Admin',
    };

    movimientosCaja = [nuevo, ...movimientosCaja];

    if (payload.metodo === 'EFECTIVO') {
      if (payload.tipo === 'INGRESO') {
        estadoCaja.ingresosEfectivo += payload.monto;
        estadoCaja.saldoEfectivoEsperado += payload.monto;
      } else {
        estadoCaja.egresosEfectivo += payload.monto;
        estadoCaja.saldoEfectivoEsperado -= payload.monto;
      }
    } else {
      estadoCaja.ingresosDigitales += payload.monto;
    }

    notify();
    return nuevo;
  },

  // Creación en catálogo
  crearProducto: (payload: NuevoProductoPayload): Producto => {
    const nuevo: Producto = {
      id: `prod-${Date.now()}`,
      ...payload,
      activo: true,
    };
    productos = [nuevo, ...productos];
    notify();
    return nuevo;
  },

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
    const nuevo: Proveedor = {
      id: `prov-${Date.now()}`,
      ...payload,
    };
    proveedores = [nuevo, ...proveedores];
    notify();
    return nuevo;
  },
};
