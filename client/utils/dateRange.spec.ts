import { describe, expect, it } from 'vitest';
import { isDateWithinRange } from './dateRange';

describe('isDateWithinRange', () => {
  it('incluye ambos extremos y admite fechas con hora', () => {
    expect(isDateWithinRange('2026-10-01', '2026-10-01', '2026-10-05')).toBe(true);
    expect(isDateWithinRange('2026-10-05T22:30:00', '2026-10-01', '2026-10-05')).toBe(true);
  });
  it('excluye fechas fuera de rango, rangos invertidos y valores inválidos', () => {
    expect(isDateWithinRange('2026-09-30', '2026-10-01', '')).toBe(false);
    expect(isDateWithinRange('2026-10-03', '2026-10-05', '2026-10-01')).toBe(false);
    expect(isDateWithinRange('sin fecha')).toBe(false);
  });
  it('sin límites acepta fechas válidas', () => {
    expect(isDateWithinRange('2024-02-29')).toBe(true);
    expect(isDateWithinRange('2025-02-29')).toBe(false);
  });
});
