/**
 * Tienda de Negocio Unificada (Business ERP Store)
 * Coordina el flujo real entre Ventas, Inventario (Kardex), Caja, Compras y Gastos.
 * Cualquier transacción en un módulo impacta inmediatamente a los módulos dependientes.
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
  AlmacenResumen,
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
    ubicacion: 'Estante A-1 (Pasillo Central)',
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
    ubicacion: 'Estante B-2 (Zona Filtros)',
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
    ubicacion: 'Piso 1 - Tarima Baterías',
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
    ubicacion: 'Anaquel C-3 (Mostrador)',
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
    ubicacion: 'Estante A-3 (Líquidos)',
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
    ubicacion: 'Vitrina 2 - Repuestos',
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
    descuento: 0,
    igv: 99.15,
    total: 650.0,
    montoRecibido: 650.0,
    vuelto: 0,
    sucursal: 'Sede Central (Tingo María)',
    caja: 'Caja 01 - Mostrador',
    vendedor: 'Carlos Vega',
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
    descuento: 0,
    igv: 277.63,
    total: 1820.0,
    montoRecibido: 1820.0,
    vuelto: 0,
    sucursal: 'Sede Central (Tingo María)',
    caja: 'Caja 01 - Mostrador',
    vendedor: 'Carlos Vega',
    items: [
      { productoId: 'prod-3', nombre: 'Batería 12V 65Ah Sellada', cantidad: 4, precioUnitario: 455.0, subtotal: 1820.0 },
    ],
  },
];

let pedidos: Pedido[] = [
  {
    id: 'ped-1',
    codigo: 'PED-0041',
    clienteNombre: 'Distribuidora San Juan',
    clienteTelefono: '991 884 122',
    fecha: '2026-10-03 10:15',
    fechaEntrega: '2026-10-04 15:00',
    estado: 'CONFIRMADO',
    total: 440.0,
    sucursal: 'Sede Central (Tingo María)',
    notas: 'Despachar en caja sellada con guía de remisión',
    items: [
      { productoId: 'prod-1', nombre: 'Aceite Motor Sintético 5W-30 (Galón)', cantidad: 4, precioUnitario: 110.0, subtotal: 440.0 },
    ],
  },
  {
    id: 'ped-2',
    codigo: 'PED-0042',
    clienteNombre: 'Taller Mecánico El Chispazo',
    clienteTelefono: '955 120 443',
    fecha: '2026-10-03 11:30',
    fechaEntrega: '2026-10-03 18:00',
    estado: 'PREPARANDO',
    total: 390.0,
    sucursal: 'Tienda Mostrador (Tingo María)',
    notas: 'Recoge en tienda en moto',
    items: [
      { productoId: 'prod-4', nombre: 'Líquido de Frenos DOT 4 500ml', cantidad: 6, precioUnitario: 48.5, subtotal: 291.0 },
      { productoId: 'prod-2', nombre: 'Filtro de Aire Universal Premium', cantidad: 2, precioUnitario: 49.5, subtotal: 99.0 },
    ],
  },
];

let cotizaciones: Cotizacion[] = [
  {
    id: 'cot-1',
    numero: 'COT-0018',
    clienteNombre: 'Constructora del Sur S.A.C.',
    clienteDocumento: '20601299443',
    fecha: '2026-10-02',
    fechaVencimiento: '2026-10-16',
    validezDias: 14,
    estado: 'VIGENTE',
    subtotal: 2182.2,
    igv: 392.8,
    total: 2575.0,
    vendedor: 'Carlos Vega',
    items: [
      { productoId: 'prod-3', nombre: 'Batería 12V 65Ah Sellada', cantidad: 5, precioUnitario: 455.0, subtotal: 2275.0 },
      { productoId: 'prod-5', nombre: 'Refrigerante Orgánico 50/50 1 Galón', cantidad: 5, precioUnitario: 60.0, subtotal: 300.0 },
    ],
  },
];

let devoluciones: Devolucion[] = [
  {
    id: 'dev-1',
    ventaId: 'v-1',
    serieCorrelativo: 'B001-000480',
    fecha: '2026-10-01 16:10',
    productoNombre: 'Filtro de Aire Universal Premium',
    sku: 'FLT-AIR-08',
    cantidad: 1,
    motivo: 'Cliente equivocó modelo de vehículo, cambio conforme',
    montoDevuelto: 50.0,
    retornaAInventario: true,
    afectaCaja: true,
    usuario: 'Carlos Vega',
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
    usuario: 'Carlos Vega',
    origen: 'Venta',
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
    usuario: 'Carlos Vega',
    origen: 'Venta',
  },
  {
    id: 'k-3',
    fecha: '2026-10-01 10:15',
    tipo: 'AJUSTE',
    motivo: 'MERMA',
    productoNombre: 'Líquido de Frenos DOT 4 500ml',
    sku: 'LIQ-FRN-04',
    almacen: 'Almacén Principal',
    cantidad: 2,
    stockResultante: 16,
    referencia: 'Ajuste: Merma / rotura de envase',
    usuario: 'Carlos Vega',
    origen: 'Ajuste de inventario',
  },
  {
    id: 'k-4',
    fecha: '2026-09-30 09:20',
    tipo: 'ENTRADA',
    motivo: 'COMPRA',
    productoNombre: 'Refrigerante Orgánico 50/50 1 Galón',
    sku: 'REF-ORG-01',
    almacen: 'Almacén Principal',
    cantidad: 15,
    stockResultante: 24,
    referencia: 'Factura F002-8821 (Distribuidora Selva)',
    usuario: 'Almacenero / Admin',
    origen: 'Compra',
  },
  {
    id: 'k-5',
    fecha: '2026-09-28 17:40',
    tipo: 'AJUSTE',
    motivo: 'AUDITORIA_CONTEO',
    productoNombre: 'Filtro de Aire Universal Premium',
    sku: 'FLT-AIR-08',
    almacen: 'Almacén Principal',
    cantidad: 2,
    stockResultante: 12,
    referencia: 'Ajuste: Conteo físico',
    usuario: 'Almacenero / Admin',
    origen: 'Ajuste de inventario',
  },
];

let ajustesInventario: AjusteInventario[] = [
  {
    id: 'aj-1',
    productoId: 'prod-4',
    productoNombre: 'Líquido de Frenos DOT 4 500ml',
    sku: 'LIQ-FRN-04',
    stockAnterior: 18,
    nuevoStock: 16,
    diferencia: -2,
    motivo: 'Merma / daño de envase',
    observacion: 'Envase con fisura durante traslado a vitrina',
    fecha: '2026-10-01 10:15',
    usuario: 'Carlos Vega',
    almacen: 'Almacén Principal',
  },
  {
    id: 'aj-2',
    productoId: 'prod-2',
    productoNombre: 'Filtro de Aire Universal Premium',
    sku: 'FLT-AIR-08',
    stockAnterior: 10,
    nuevoStock: 12,
    diferencia: 2,
    motivo: 'Conteo físico',
    observacion: '2 unidades encontradas en anaquel posterior',
    fecha: '2026-09-28 17:40',
    usuario: 'Almacenero / Admin',
    almacen: 'Almacén Principal',
  },
];

let estadoCaja: EstadoCaja = {
  id: 'caja-1',
  nombre: 'Caja 01 - Mostrador Principal',
  sucursal: 'Sede Central (Tingo María)',
  responsable: 'Juan Pérez',
  abierta: true,
  estado: 'ABIERTA',
  turno: 'Turno Mañana (08:00 - 16:00)',
  fechaApertura: '2026-10-03',
  horaApertura: '08:00',
  saldoInicial: 200.0,
  ventasEfectivo: 350.0,
  otrosIngresosEfectivo: 150.0,
  egresosEfectivo: 50.0,
  saldoEfectivoEsperado: 650.0,
  ventasDigitales: {
    yape: 580.0,
    plin: 325.0,
    tarjeta: 700.0,
    transferencia: 1820.0,
  },
  totalVentasDigitales: 3425.0,
  totalVentasGeneral: 3775.0,
};

let cajas: CajaInfo[] = [
  {
    id: 'caja-1',
    nombre: 'Caja 01 - Mostrador Principal',
    sucursal: 'Sede Central (Tingo María)',
    responsableActual: 'Juan Pérez',
    estado: 'ABIERTA',
    saldoActualEfectivo: 650.0,
    ventasDia: 3775.0,
    ultimaActividad: 'Hace 5 min',
    abierta: true,
  },
  {
    id: 'caja-2',
    nombre: 'Caja 02 - Rápida / Billeteras',
    sucursal: 'Sede Central (Tingo María)',
    responsableActual: 'María López',
    estado: 'ABIERTA',
    saldoActualEfectivo: 420.0,
    ventasDia: 1890.0,
    ultimaActividad: 'Hace 12 min',
    abierta: true,
  },
  {
    id: 'caja-3',
    nombre: 'Caja 03 - Mostrador Secundario',
    sucursal: 'Sede Central (Tingo María)',
    responsableActual: 'Sin asignar',
    estado: 'CERRADA',
    saldoActualEfectivo: 0.0,
    ventasDia: 0.0,
    ultimaActividad: 'Ayer 20:00',
    abierta: false,
  },
  {
    id: 'caja-4',
    nombre: 'Caja 01 - Principal Huánuco',
    sucursal: 'Sucursal Huánuco',
    responsableActual: 'Carlos Vega',
    estado: 'ABIERTA',
    saldoActualEfectivo: 1120.0,
    ventasDia: 2450.0,
    ultimaActividad: 'Hace 18 min',
    abierta: true,
  },
  {
    id: 'caja-5',
    nombre: 'Caja 02 - Huánuco Express',
    sucursal: 'Sucursal Huánuco',
    responsableActual: 'Ana Gómez',
    estado: 'CERRADA',
    saldoActualEfectivo: 0.0,
    ventasDia: 0.0,
    ultimaActividad: 'Ayer 19:30',
    abierta: false,
  },
  {
    id: 'caja-6',
    nombre: 'Caja 01 - Aucayacu',
    sucursal: 'Sucursal Aucayacu',
    responsableActual: 'Pedro Ramírez',
    estado: 'ABIERTA',
    saldoActualEfectivo: 840.0,
    ventasDia: 1630.0,
    ultimaActividad: 'Hace 25 min',
    abierta: true,
  },
];

let cierresCaja: CierreCaja[] = [
  {
    id: 'cie-101',
    cajaId: 'caja-1',
    cajaNombre: 'Caja 01 - Mostrador Principal',
    sucursal: 'Sede Central (Tingo María)',
    responsable: 'Juan Pérez',
    fechaApertura: '2026-10-02 08:00',
    fechaCierre: '2026-10-02',
    horaCierre: '18:15',
    saldoInicial: 200.0,
    ventasEfectivo: 1450.0,
    otrosIngresos: 100.0,
    egresos: 250.0,
    saldoEsperado: 1500.0,
    saldoContado: 1500.0,
    diferencia: 0.0,
    estado: 'CUADRADA',
    ventasTotales: 3650.0,
    totalOperaciones: 28,
  },
  {
    id: 'cie-100',
    cajaId: 'caja-1',
    cajaNombre: 'Caja 01 - Mostrador Principal',
    sucursal: 'Sede Central (Tingo María)',
    responsable: 'Juan Pérez',
    fechaApertura: '2026-10-01 08:00',
    fechaCierre: '2026-10-01',
    horaCierre: '18:30',
    saldoInicial: 200.0,
    ventasEfectivo: 1200.0,
    otrosIngresos: 50.0,
    egresos: 180.0,
    saldoEsperado: 1270.0,
    saldoContado: 1260.0,
    diferencia: -10.0,
    estado: 'CON_DIFERENCIA',
    motivoDiferencia: 'Error involuntario en vuelto de cliente',
    observaciones: 'Faltante de S/ 10 asumido según política de caja',
    ventasTotales: 2980.0,
    totalOperaciones: 22,
  },
  {
    id: 'cie-099',
    cajaId: 'caja-2',
    cajaNombre: 'Caja 02 - Rápida / Billeteras',
    sucursal: 'Sede Central (Tingo María)',
    responsable: 'María López',
    fechaApertura: '2026-10-02 09:00',
    fechaCierre: '2026-10-02',
    horaCierre: '17:45',
    saldoInicial: 150.0,
    ventasEfectivo: 850.0,
    otrosIngresos: 0.0,
    egresos: 60.0,
    saldoEsperado: 940.0,
    saldoContado: 940.0,
    diferencia: 0.0,
    estado: 'CUADRADA',
    ventasTotales: 4120.0,
    totalOperaciones: 39,
  },
];

let auditoriaCaja: AuditoriaCaja[] = [
  {
    id: 'aud-1',
    usuario: 'Juan Pérez',
    accion: 'APERTURA',
    fecha: '2026-10-03',
    hora: '08:00',
    caja: 'Caja 01 - Mostrador Principal',
    sucursal: 'Sede Central (Tingo María)',
    movimiento: 'Apertura con saldo inicial S/ 200.00',
    valorAnterior: 'CERRADA',
    valorNuevo: 'ABIERTA',
    observacion: 'Inicio de turno sin incidencias',
  },
  {
    id: 'aud-2',
    usuario: 'Admin',
    accion: 'EGRESO',
    fecha: '2026-10-03',
    hora: '11:15',
    caja: 'Caja 01 - Mostrador Principal',
    sucursal: 'Sede Central (Tingo María)',
    movimiento: 'Egreso de S/ 50.00 para compra de insumos de limpieza',
    valorAnterior: 'S/ 550.00',
    valorNuevo: 'S/ 500.00',
    observacion: 'Autorizado por Supervisor',
  },
  {
    id: 'aud-3',
    usuario: 'Juan Pérez',
    accion: 'INGRESO',
    fecha: '2026-10-03',
    hora: '12:30',
    caja: 'Caja 01 - Mostrador Principal',
    sucursal: 'Sede Central (Tingo María)',
    movimiento: 'Ingreso de S/ 150.00 (Reposición de sencillo de tesorería)',
    valorAnterior: 'S/ 500.00',
    valorNuevo: 'S/ 650.00',
  },
  {
    id: 'aud-4',
    usuario: 'María López',
    accion: 'APERTURA',
    fecha: '2026-10-03',
    hora: '08:30',
    caja: 'Caja 02 - Rápida / Billeteras',
    sucursal: 'Sede Central (Tingo María)',
    movimiento: 'Apertura con saldo inicial S/ 150.00',
    valorAnterior: 'CERRADA',
    valorNuevo: 'ABIERTA',
  },
];

let movimientosCaja: MovimientoCaja[] = [
  {
    id: 'mc-1',
    fecha: '2026-10-03',
    hora: '08:00',
    tipo: 'INGRESO',
    concepto: 'Apertura de turno - Sencillo en caja',
    metodo: 'EFECTIVO',
    monto: 200.0,
    usuario: 'Juan Pérez',
    sucursal: 'Sede Central (Tingo María)',
    cajaNombre: 'Caja 01',
    origenTipo: 'APERTURA',
  },
  {
    id: 'mc-2',
    fecha: '2026-10-03',
    hora: '10:15',
    tipo: 'INGRESO',
    concepto: 'Venta B001-000482 - Filtro de Aceite',
    metodo: 'EFECTIVO',
    monto: 85.0,
    usuario: 'Juan Pérez',
    sucursal: 'Sede Central (Tingo María)',
    cajaNombre: 'Caja 01',
    origenTipo: 'VENTA',
    comprobanteRef: 'B001-000482',
  },
  {
    id: 'mc-3',
    fecha: '2026-10-03',
    hora: '11:15',
    tipo: 'EGRESO',
    concepto: 'Compra de artículos de limpieza e higiene',
    metodo: 'EFECTIVO',
    monto: 50.0,
    usuario: 'Juan Pérez',
    sucursal: 'Sede Central (Tingo María)',
    cajaNombre: 'Caja 01',
    origenTipo: 'EGRESO_MANUAL',
    categoria: 'Útiles y Limpieza',
    observaciones: 'Comprado en bodega contigua',
  },
  {
    id: 'mc-4',
    fecha: '2026-10-03',
    hora: '12:30',
    tipo: 'INGRESO',
    concepto: 'Reposición de sencillo desde tesorería',
    metodo: 'EFECTIVO',
    monto: 150.0,
    usuario: 'Juan Pérez',
    sucursal: 'Sede Central (Tingo María)',
    cajaNombre: 'Caja 01',
    origenTipo: 'INGRESO_MANUAL',
    categoria: 'Sencillo Tesorería',
  },
  {
    id: 'mc-5',
    fecha: '2026-10-03',
    hora: '13:10',
    tipo: 'INGRESO',
    concepto: 'Venta F001-000129 - Batería 12V 65Ah',
    metodo: 'TRANSFERENCIA',
    monto: 1820.0,
    usuario: 'Juan Pérez',
    sucursal: 'Sede Central (Tingo María)',
    cajaNombre: 'Caja 01',
    origenTipo: 'VENTA',
    comprobanteRef: 'F001-000129',
  },
  {
    id: 'mc-6',
    fecha: '2026-10-03',
    hora: '14:20',
    tipo: 'INGRESO',
    concepto: 'Venta B001-000483 - Aceite Sintético 5W-30',
    metodo: 'YAPE',
    monto: 580.0,
    usuario: 'Juan Pérez',
    sucursal: 'Sede Central (Tingo María)',
    cajaNombre: 'Caja 01',
    origenTipo: 'VENTA',
    comprobanteRef: 'B001-000483',
  },
  {
    id: 'mc-7',
    fecha: '2026-10-03',
    hora: '14:35',
    tipo: 'INGRESO',
    concepto: 'Venta B001-000484 - Bujías Iridium x4',
    metodo: 'PLIN',
    monto: 325.0,
    usuario: 'Juan Pérez',
    sucursal: 'Sede Central (Tingo María)',
    cajaNombre: 'Caja 01',
    origenTipo: 'VENTA',
    comprobanteRef: 'B001-000484',
  },
  {
    id: 'mc-8',
    fecha: '2026-10-03',
    hora: '15:10',
    tipo: 'INGRESO',
    concepto: 'Venta B001-000485 - Pastillas de Freno',
    metodo: 'TARJETA',
    monto: 700.0,
    usuario: 'Juan Pérez',
    sucursal: 'Sede Central (Tingo María)',
    cajaNombre: 'Caja 01',
    origenTipo: 'VENTA',
    comprobanteRef: 'B001-000485',
  },
  {
    id: 'mc-9',
    fecha: '2026-10-03',
    hora: '15:40',
    tipo: 'INGRESO',
    concepto: 'Venta NV01-000502 - Refrigerante 50/50',
    metodo: 'EFECTIVO',
    monto: 265.0,
    usuario: 'Juan Pérez',
    sucursal: 'Sede Central (Tingo María)',
    cajaNombre: 'Caja 01',
    origenTipo: 'VENTA',
    comprobanteRef: 'NV01-000502',
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
    codigo: 'PRV-001',
    ruc: '20100128211',
    razonSocial: 'Importadora y Distribuidora PetroPerú Repuestos S.A.C.',
    nombreComercial: 'PetroPerú Repuestos',
    contacto: 'Ing. Fernando Salazar',
    telefono: '998 441 200',
    correo: 'ventas@petroperurepuestos.pe',
    direccion: 'Av. Elmer Faucett 3450, Callao',
    ciudad: 'Lima',
    provincia: 'Callao',
    pais: 'Perú',
    codigoPostal: '07031',
    rubro: 'Lubricantes y Filtros',
    condicionPago: 'Crédito a 30 días',
    diasCredito: 30,
    limiteCredito: 25000,
    totalCompras: 38450.0,
    saldoPendiente: 3500.0,
    descripcion: 'Distribuidor mayorista oficial de lubricantes industriales y filtros de alta rotación.',
    activo: true,
    calificacion: 5,
    fechaRegistro: '2025-03-15',
  },
  {
    id: 'prov-2',
    codigo: 'PRV-002',
    ruc: '20512839912',
    razonSocial: 'Filtros y Baterías del Pacífico S.A.C.',
    nombreComercial: 'Baterías del Pacífico',
    contacto: 'Lic. Claudia Mendoza',
    telefono: '981 229 014',
    correo: 'cmendoza@filtrosdelpacifico.com',
    direccion: 'Jr. Huánuco 1240, La Victoria',
    ciudad: 'Lima',
    provincia: 'Lima',
    pais: 'Perú',
    codigoPostal: '15018',
    rubro: 'Baterías y Filtración',
    condicionPago: 'Contado / Transferencia',
    diasCredito: 0,
    limiteCredito: 10000,
    totalCompras: 19800.0,
    saldoPendiente: 0.0,
    descripcion: 'Proveedor de baterías automotrices 12V 65Ah y 13 placas con garantía de 12 meses.',
    activo: true,
    calificacion: 4,
    fechaRegistro: '2025-06-20',
  },
  {
    id: 'prov-3',
    codigo: 'PRV-003',
    ruc: '20601839210',
    razonSocial: 'DonDocument Corporación Gráfica e Impresiones S.A.C.',
    nombreComercial: 'DonDocument',
    contacto: 'Marcos Villegas',
    telefono: '944 567 890',
    correo: 'pedidos@dondocument.com',
    direccion: 'Av. Nicolás Arriola 450, San Luis',
    ciudad: 'Lima',
    provincia: 'Lima',
    pais: 'Perú',
    codigoPostal: '15021',
    rubro: 'Papelería y Comprobantes',
    condicionPago: 'Crédito a 15 días',
    diasCredito: 15,
    limiteCredito: 5000,
    totalCompras: 4200.0,
    saldoPendiente: 650.0,
    descripcion: 'Suministro de rollos térmicos de 80mm para ticketera POS y papelería corporativa.',
    activo: true,
    calificacion: 5,
    fechaRegistro: '2025-08-10',
  },
  {
    id: 'prov-4',
    codigo: 'PRV-004',
    ruc: '20492817429',
    razonSocial: 'Comercializadora y Distribuidora Novelier S.A.C.',
    nombreComercial: 'Novelier Insumos',
    contacto: 'Gabriel López',
    telefono: '999 888 888',
    correo: 'contacto@novelier.pe',
    direccion: 'Carretera Central Km 9.5, Ate',
    ciudad: 'Lima',
    provincia: 'Lima',
    pais: 'Perú',
    codigoPostal: '15487',
    rubro: 'Útiles y Limpieza',
    condicionPago: 'Contado',
    diasCredito: 0,
    limiteCredito: 3000,
    totalCompras: 2150.0,
    saldoPendiente: 0.0,
    descripcion: 'Artículos de higiene, bolsas ecológicas de despacho y material de empaque.',
    activo: true,
    calificacion: 4,
    fechaRegistro: '2025-11-04',
  },
  {
    id: 'prov-5',
    codigo: 'PRV-005',
    ruc: '20381928471',
    razonSocial: 'Salubres & Seguridad Industrial S.A.C.',
    nombreComercial: 'Salubres EPP',
    contacto: 'Dra. Méndez Pelayo',
    telefono: '974 444 333',
    correo: 'ventas@salubres.pe',
    direccion: 'Av. Colonial 1890, Cercado de Lima',
    ciudad: 'Lima',
    provincia: 'Lima',
    pais: 'Perú',
    codigoPostal: '15082',
    rubro: 'Seguridad y EPP',
    condicionPago: 'Crédito a 30 días',
    diasCredito: 30,
    limiteCredito: 8000,
    totalCompras: 7600.0,
    saldoPendiente: 1200.0,
    descripcion: 'Guantes de nitrilo para taller, mascarillas, cascos y botiquines reglamentarios.',
    activo: true,
    calificacion: 5,
    fechaRegistro: '2026-01-18',
  },
  {
    id: 'prov-6',
    codigo: 'PRV-006',
    ruc: '20194827361',
    razonSocial: 'Reparaciones y Repuestos Mecánicos ReparaDOX S.A.',
    nombreComercial: 'ReparaDOX',
    contacto: 'Carlos Ferrando',
    telefono: '912 345 678',
    correo: 'carlos@reparadox.com',
    direccion: 'Jr. Zorritos 890, Breña',
    ciudad: 'Lima',
    provincia: 'Lima',
    pais: 'Perú',
    codigoPostal: '15083',
    rubro: 'Repuestos Automotrices',
    condicionPago: 'Crédito a 45 días',
    diasCredito: 45,
    limiteCredito: 15000,
    totalCompras: 14900.0,
    saldoPendiente: 2800.0,
    descripcion: 'Pastillas de frenos cerámicas, bujías de iridio y componentes de suspensión.',
    activo: true,
    calificacion: 4,
    fechaRegistro: '2026-02-02',
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
  getCajas: () => [...cajas],
  getCierresCaja: () => [...cierresCaja],
  getAuditoriaCaja: () => [...auditoriaCaja],
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
      clienteNombre: payload.clienteNombre,
      clienteDocumento: payload.clienteDocumento,
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
      vendedor: payload.vendedor || 'Carlos Vega',
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
        almacen: payload.sucursal || 'Almacén Principal',
        cantidad: item.cantidad,
        stockResultante: stockNuevo,
        referencia: `${payload.tipoComprobante} ${serieCorrelativo}`,
        usuario: payload.vendedor || 'Admin',
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
      concepto: `Cobro ${serieCorrelativo} (${payload.clienteNombre})`,
      metodo: metodoCaja,
      monto: total,
      usuario: payload.vendedor || 'Admin',
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
      const dig = total - ef;
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
      const ahora = new Date();
      const fecha = ahora.toISOString().slice(0, 10);
      const hora = ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      movimientosCaja = [
        {
          id: `mc-${Date.now()}`,
          fecha,
          hora,
          tipo: 'EGRESO',
          concepto: `Pago Factura Compra ${payload.serieFactura}`,
          metodo: 'EFECTIVO',
          monto: payload.total,
          usuario: 'Admin',
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
      const fecha = ahora;
      const hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      movimientosCaja = [
        {
          id: `mc-${Date.now()}`,
          fecha,
          hora,
          tipo: 'EGRESO',
          concepto: `Gasto: ${payload.descripcion}`,
          metodo: 'EFECTIVO',
          monto: payload.monto,
          usuario: 'Admin',
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

  // Creación en catálogo
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
      ciudad: payload.ciudad || 'Lima',
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
   * FLUJO: RECEPCIÓN DE MERCANCÍA (Vinculado a Compras/Proveedores)
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
      usuario: 'Almacenero / Admin',
    };

    movimientosKardex = [movKardex, ...movimientosKardex];
    notify();
    return movKardex;
  },

  /**
   * FLUJO: AUDITORÍA Y AJUSTE DE CONTEO FÍSICO (Vinculado a Control de Mermas)
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
    const motivo =
      diferencia < 0 ? 'MERMA' : 'AUDITORIA_CONTEO';

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
      usuario: 'Auditor / Dueño',
    };

    movimientosKardex = [movKardex, ...movimientosKardex];
    notify();
    return movKardex;
  },

  /**
   * MÓDULO INVENTARIO: AJUSTES DE INVENTARIO
   */
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

      if (diferencia === 0) return; // No requiere ajuste si coincide

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
  // PEDIDOS (Gestión de ventas anticipadas)
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
  // COTIZACIONES / PROFORMAS
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
    const montoTotalDevuelto = montoUnitario * payload.cantidad;

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
      usuario: 'Carlos Vega',
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
        usuario: 'Carlos Vega',
      };
      movimientosKardex = [movKardex, ...movimientosKardex];
    }

    // Egreso de caja por reembolso al cliente si afecta caja
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
          usuario: 'Carlos Vega',
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
        };
        movimientosKardex = [movKardex, ...movimientosKardex];
      }
    });

    // Reembolso de caja si fue efectivo
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
          usuario: 'Admin',
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

  /**
   * FLUJO 6: GESTIÓN OPERATIVA DE CAJA
   */
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


