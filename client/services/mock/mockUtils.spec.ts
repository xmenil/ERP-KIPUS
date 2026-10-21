import { afterEach, describe, expect, it, vi } from 'vitest';
import { simulateDelay } from './mockUtils';

afterEach(() => vi.useRealTimers());
describe('consultas simuladas', () => {
  it('rechaza datos no clonables sin dejar pendiente la consulta', async () => {
    await expect(simulateDelay({ callback: () => {} })).rejects.toThrow();
  });
  it('conserva la instantánea al consultar y respeta la demora configurada', async () => {
    vi.useFakeTimers();
    const source = { items: [{ stock: 3 }] };
    const promise = simulateDelay(source);
    source.items[0].stock = 9;
    await vi.advanceTimersByTimeAsync(250);
    expect(await promise).toEqual({ items: [{ stock: 3 }] });
    expect((await promise).items).not.toBe(source.items);
  });
});
