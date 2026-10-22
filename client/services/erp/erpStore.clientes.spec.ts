import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { NuevoClientePayload } from '@/features/clientes/types/clientes.types';
import type { NuevaVentaPayload } from '@/features/ventas/types/ventas.types';

const KEY = 'KIPUS_ERP_STORAGE_V2';
let values: Map<string, string>;
let setItem: ReturnType<typeof vi.fn>;
const payload = (overrides: Partial<NuevoClientePayload> = {}): NuevoClientePayload => ({
  documentoTipo: 'DNI', numeroDocumento: '20-987 654', nombre: 'Cliente E6', telefono: '', correo: '', direccion: '', ...overrides,
});
const venta = (doc: string, name = 'Cliente E6'): NuevaVentaPayload => ({
  tipoComprobante: 'BOLETA', clienteNombre: name, clienteDocumento: doc, metodoPago: 'CREDITO',
  items: [{ productoId: 'prod-1', nombre: 'Arroz', cantidad: 1, precioUnitario: 4.8 }],
});
async function load() { vi.resetModules(); return import('./erpStore'); }

beforeEach(() => {
  values = new Map();
  setItem = vi.fn((key: string, value: string) => { values.set(key, value); });
  vi.stubGlobal('window', { addEventListener: vi.fn() });
  vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.resetModules(); });

it('normaliza DNI y rechaza documentos duplicados incluso si el registro está inactivo', async () => {
  const { erpStore: s } = await load();
  const cliente = s.crearCliente(payload());
  expect(cliente.numeroDocumento).toBe('20987654');
  s.toggleEstadoCliente(cliente.id);
  const before = values.get(KEY);
  expect(() => s.crearCliente(payload({ numeroDocumento: '20 987-654' }))).toThrow('Ya existe');
  expect(values.get(KEY)).toBe(before);
});

it.each([
  payload({ numeroDocumento: '1234567' }),
  payload({ documentoTipo: 'RUC', numeroDocumento: '12345678' }),
  payload({ documentoTipo: 'RUC', numeroDocumento: '20-987 65432' }),
  payload({ numeroDocumento: '00000000' }),
  payload({ correo: 'correo-inválido' }),
  payload({ nombre: ' ' }),
])('rechaza documento o datos inválidos sin modificar el directorio', async draft => {
  const { erpStore: s } = await load();
  const before = values.get(KEY);
  const clientesAntes = s.getClientes();
  expect(() => s.crearCliente(draft)).toThrow();
  expect(values.get(KEY)).toBe(before);
  expect(s.getClientes()).toEqual(clientesAntes);
});

it('una escritura fallida conserva memoria y permite reintentar el alta', async () => {
  const { erpStore: s } = await load();
  const before = s.getClientes();
  const persisted = values.get(KEY);
  setItem.mockImplementationOnce(() => { throw new Error('QuotaExceededError'); });
  expect(() => s.crearCliente(payload())).toThrow('No se pudo guardar');
  expect(s.getClientes()).toEqual(before);
  expect(values.get(KEY)).toBe(persisted);
  expect(s.crearCliente(payload()).numeroDocumento).toBe('20987654');
});

it('una edición duplicada o fallida no altera el registro y permite reintentar', async () => {
  const { erpStore: s } = await load();
  const primero = s.crearCliente(payload({ documentoTipo: 'RUC', numeroDocumento: '20987654321' }));
  const segundo = s.crearCliente(payload({ documentoTipo: 'RUC', numeroDocumento: '20608821941', nombre: 'Otra empresa' }));
  const beforeDuplicate = values.get(KEY);
  expect(() => s.actualizarCliente(segundo.id, { numeroDocumento: '20987654321' })).toThrow('otro cliente');
  expect(values.get(KEY)).toBe(beforeDuplicate);
  const beforeFailure = s.getClientes();
  const raw = values.get(KEY);
  setItem.mockImplementationOnce(() => { throw new Error('QuotaExceededError'); });
  expect(() => s.actualizarCliente(primero.id, { nombre: 'Nombre guardado al reintentar' })).toThrow('No se pudo guardar');
  expect(s.getClientes()).toEqual(beforeFailure);
  expect(values.get(KEY)).toBe(raw);
  expect(s.actualizarCliente(primero.id, { nombre: 'Nombre guardado al reintentar' }).nombre).toBe('Nombre guardado al reintentar');
});

it('edita datos del directorio, protege el documento con historial y conserva la venta original', async () => {
  const { erpStore: s } = await load();
  const cliente = s.crearCliente(payload());
  const comprobante = s.emitirVenta(venta(cliente.numeroDocumento, cliente.nombre));
  expect(comprobante.clienteDocumento).toBe('20987654');
  expect(() => s.actualizarCliente(cliente.id, { numeroDocumento: '20987655' })).toThrow('comprobantes emitidos');
  const actualizado = s.actualizarCliente(cliente.id, { nombre: 'Cliente Editado' });
  expect(actualizado.nombre).toBe('Cliente Editado');
  expect(s.getVentas().find(v => v.id === comprobante.id)?.clienteNombre).toBe('Cliente E6');
  expect(s.getVentas().find(v => v.id === comprobante.id)?.clienteDocumento).toBe('20987654');
});

it('bloquea ventas con un cliente inactivo y reserva Consumidor Final', async () => {
  const { erpStore: s } = await load();
  const cliente = s.crearCliente(payload());
  s.toggleEstadoCliente(cliente.id);
  const before = values.get(KEY);
  expect(() => s.emitirVenta(venta(cliente.numeroDocumento))).toThrow('cliente está inactivo');
  expect(values.get(KEY)).toBe(before);
  expect(() => s.actualizarCliente('cli-1', { nombre: 'Otro nombre' })).toThrow('reservado');
  expect(() => s.toggleEstadoCliente('cli-1')).toThrow('reservado');
});

it('el servicio informa documentos guardados inválidos y conserva el almacenamiento original', async () => {
  const { erpStore: s } = await load();
  s.crearCliente(payload());
  const saved = JSON.parse(values.get(KEY)!);
  saved.clientes[0].numeroDocumento = '123';
  const raw = JSON.stringify(saved);
  values.set(KEY, raw);
  vi.resetModules();
  const service = (await import('@/features/clientes/services/clientesService')).clientesService;
  await expect(service.getClientes()).rejects.toThrow('directorio de clientes');
  expect(values.get(KEY)).toBe(raw);
});
