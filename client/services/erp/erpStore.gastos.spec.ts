import { describe, it, expect, beforeEach } from 'vitest';
import { erpStore } from './erpStore';
import { CategoriaGasto } from '@/features/gastos/types/gastos.types';

describe('erpStore - Gastos y Egresos Operativos (E5)', () => {
  beforeEach(() => {
    erpStore.restablecerDatosMinimarket();
    // Asegurar que la caja esté abierta para pruebas de efectivo
    const estado = erpStore.getEstadoCaja();
    if (!estado.abierta) {
      erpStore.abrirCaja({
        cajaId: 'caja-1',
        sucursal: 'Sede Central',
        responsable: 'Administrador',
        saldoInicial: 300,
      });
    }
  });

  it('G01: registra gasto en efectivo descontando de caja y creando movimiento', () => {
    const estadoInicial = erpStore.getEstadoCaja();
    const saldoInicial = estadoInicial.saldoEfectivoEsperado;
    const egresosInicial = estadoInicial.egresosEfectivo;

    const gasto = erpStore.registrarGasto({
      categoria: 'SERVICIOS_BASICOS',
      descripcion: 'Pago de luz Electro Oriente',
      beneficiario: 'Electro Oriente',
      comprobante: 'REC-0921',
      monto: 85.5,
      metodoPago: 'EFECTIVO',
    });

    expect(gasto.id).toBeDefined();
    expect(gasto.monto).toBe(85.5);
    expect(gasto.estado).toBe('REGISTRADO');

    // Comprobar que aparece en el listado
    const listado = erpStore.getGastos();
    expect(listado.some((g) => g.id === gasto.id)).toBe(true);

    // Comprobar saldo en caja
    const estadoFinal = erpStore.getEstadoCaja();
    expect(estadoFinal.saldoEfectivoEsperado).toBeCloseTo(saldoInicial - 85.5, 2);
    expect(estadoFinal.egresosEfectivo).toBeCloseTo(egresosInicial + 85.5, 2);

    // Comprobar movimiento de caja
    const movimientos = erpStore.getMovimientosCaja();
    const mov = movimientos.find((m) => m.concepto.includes('Pago de luz') && m.tipo === 'EGRESO');
    expect(mov).toBeDefined();
    expect(mov?.monto).toBe(85.5);
    expect(mov?.metodo).toBe('EFECTIVO');
  });

  it('G02: registra gasto por transferencia sin descontar dinero físico de caja', () => {
    const estadoInicial = erpStore.getEstadoCaja();
    const saldoInicial = estadoInicial.saldoEfectivoEsperado;
    const egresosEfectivoInicial = estadoInicial.egresosEfectivo;

    const gasto = erpStore.registrarGasto({
      categoria: 'ALQUILER',
      descripcion: 'Arriendo mensual local',
      beneficiario: 'Inmobiliaria Tingo María',
      comprobante: 'FAC-001',
      monto: 1200,
      metodoPago: 'TRANSFERENCIA',
    });

    expect(gasto.id).toBeDefined();
    expect(gasto.metodoPago).toBe('TRANSFERENCIA');

    // Caja física no se altera
    const estadoFinal = erpStore.getEstadoCaja();
    expect(estadoFinal.saldoEfectivoEsperado).toBe(saldoInicial);
    expect(estadoFinal.egresosEfectivo).toBe(egresosEfectivoInicial);
  });

  it('G03: rechaza gasto en efectivo si la caja está cerrada', () => {
    // Cerrar caja
    const estado = erpStore.getEstadoCaja();
    erpStore.cerrarCaja({
      saldoContado: estado.saldoEfectivoEsperado,
      diferencia: 0,
      observaciones: 'Cierre para prueba',
    });
    expect(erpStore.getEstadoCaja().abierta).toBe(false);

    expect(() =>
      erpStore.registrarGasto({
        categoria: 'OTROS',
        descripcion: 'Compra de bolsas',
        beneficiario: 'Varios',
        comprobante: 's/n',
        monto: 20,
        metodoPago: 'EFECTIVO',
      })
    ).toThrow(/abre la caja/i);
  });

  it('G04: permite registrar gasto bancario/digital incluso con la caja cerrada', () => {
    // Cerrar caja
    const estado = erpStore.getEstadoCaja();
    erpStore.cerrarCaja({
      saldoContado: estado.saldoEfectivoEsperado,
      diferencia: 0,
      observaciones: 'Cierre para prueba',
    });

    const gasto = erpStore.registrarGasto({
      categoria: 'MANTENIMIENTO',
      descripcion: 'Reparación de visicooler pagado con Yape',
      beneficiario: 'Técnico Frío',
      comprobante: 'RH-102',
      monto: 90,
      metodoPago: 'YAPE',
    });

    expect(gasto.id).toBeDefined();
    expect(gasto.metodoPago).toBe('YAPE');
    expect(erpStore.getGastos().some((g) => g.id === gasto.id)).toBe(true);
  });

  it('G05: rechaza gasto en efectivo si supera el saldo disponible en caja', () => {
    const estado = erpStore.getEstadoCaja();
    const montoExcesivo = estado.saldoEfectivoEsperado + 5000;

    expect(() =>
      erpStore.registrarGasto({
        categoria: 'OTROS',
        descripcion: 'Gasto desmesurado en efectivo',
        beneficiario: 'Varios',
        comprobante: 's/n',
        monto: montoExcesivo,
        metodoPago: 'EFECTIVO',
      })
    ).toThrow(/insuficiente/i);
  });

  it('G06: valida campos obligatorios (monto > 0, categoría válida, descripción)', () => {
    expect(() =>
      erpStore.registrarGasto({
        categoria: 'OTROS',
        descripcion: '',
        monto: 50,
        metodoPago: 'EFECTIVO',
      })
    ).toThrow(/concepto o descripción/i);

    expect(() =>
      erpStore.registrarGasto({
        categoria: 'CATEGORIA_INVENTADA' as CategoriaGasto,
        descripcion: 'Test categoría',
        monto: 50,
        metodoPago: 'EFECTIVO',
      })
    ).toThrow(/categoría/i);

    expect(() =>
      erpStore.registrarGasto({
        categoria: 'OTROS',
        descripcion: 'Gasto monto cero',
        monto: 0,
        metodoPago: 'EFECTIVO',
      })
    ).toThrow(/monto/i);
  });

  it('G07: revierte atómicamente si la persistencia falla', async () => {
    const estadoInicial = erpStore.getEstadoCaja();
    const saldoInicial = estadoInicial.saldoEfectivoEsperado;
    const gastosIniciales = erpStore.getGastos().length;

    // Simular error de almacenamiento usando vi.stubGlobal
    const mockStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError simulado');
      },
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    };
    const prevWindow = (globalThis as unknown as { window?: unknown }).window;
    const prevLocalStorage = (globalThis as unknown as { localStorage?: unknown }).localStorage;

    (globalThis as unknown as { window: unknown }).window = { addEventListener: () => {} };
    (globalThis as unknown as { localStorage: unknown }).localStorage = mockStorage;

    try {
      expect(() =>
        erpStore.registrarGasto({
          categoria: 'LOGISTICA',
          descripcion: 'Flete de mercadería',
          beneficiario: 'Transportes Selva',
          comprobante: 'GUIA-091',
          monto: 50,
          metodoPago: 'EFECTIVO',
        })
      ).toThrow(/no se pudo guardar/i);

      // Verificar que el estado volvió al inicial
      expect(erpStore.getGastos().length).toBe(gastosIniciales);
      expect(erpStore.getEstadoCaja().saldoEfectivoEsperado).toBe(saldoInicial);
    } finally {
      if (prevWindow !== undefined) {
        (globalThis as unknown as { window: unknown }).window = prevWindow;
      } else {
        delete (globalThis as unknown as { window?: unknown }).window;
      }
      if (prevLocalStorage !== undefined) {
        (globalThis as unknown as { localStorage: unknown }).localStorage = prevLocalStorage;
      } else {
        delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
      }
    }
  });

  it('G08: anula gasto en efectivo reembolsando el dinero a la caja registradora', () => {
    const gasto = erpStore.registrarGasto({
      categoria: 'MANTENIMIENTO',
      descripcion: 'Pintura para fachada',
      beneficiario: 'Ferretería Selva',
      comprobante: 'BOL-551',
      monto: 60,
      metodoPago: 'EFECTIVO',
    });

    const saldoDespuesGasto = erpStore.getEstadoCaja().saldoEfectivoEsperado;

    // Anular el gasto
    const anulado = erpStore.anularGasto(gasto.id, 'Error en comprobante');
    expect(anulado.estado).toBe('ANULADO');
    expect(anulado.motivoAnulacion).toBe('Error en comprobante');

    // Caja recupera el saldo
    const estadoFinal = erpStore.getEstadoCaja();
    expect(estadoFinal.saldoEfectivoEsperado).toBeCloseTo(saldoDespuesGasto + 60, 2);

    // No se puede volver a anular
    expect(() => erpStore.anularGasto(gasto.id)).toThrow(/ya se encuentra anulado/i);
  });
});
