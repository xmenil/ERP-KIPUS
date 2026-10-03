/**
 * Funciones formateadoras estándar para KIPU'S ERP.
 * Garantizan consistencia en la visualización de montos, porcentajes y fechas.
 */

export function formatCurrency(
  amount: number,
  currency: 'PEN' | 'USD' = 'PEN'
): string {
  const symbol = currency === 'PEN' ? 'S/' : '$';
  return `${symbol} ${amount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('es-PE');
}

export function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
