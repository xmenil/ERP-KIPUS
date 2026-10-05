import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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

export const formatMoney = formatCurrency;

export function formatNumber(value: number): string {
  return value.toLocaleString('es-PE');
}

export function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDate(dateString: string): string {
  try {
    const cleanDate = dateString.includes('T') ? parseISO(dateString) : new Date(dateString.replace(' ', 'T'));
    if (isNaN(cleanDate.getTime())) return dateString;
    return format(cleanDate, 'dd MMM yyyy', { locale: es });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const cleanDate = dateString.includes('T') ? parseISO(dateString) : new Date(dateString.replace(' ', 'T'));
    if (isNaN(cleanDate.getTime())) return dateString;
    return format(cleanDate, 'dd MMM yyyy, HH:mm', { locale: es });
  } catch {
    return dateString;
  }
}

/**
 * Pluraliza la unidad de medida según la cantidad.
 * Cubre: GALON, UNIDAD, KILO, LITRO, JUEGO, PAQUETE.
 */
export function pluralizeUnit(quantity: number, unit: string): string {
  if (!unit) return '';
  const isPlural = Math.abs(quantity) !== 1;
  const normalized = unit.trim().toUpperCase();

  switch (normalized) {
    case 'GALON':
    case 'GALÓN':
      return isPlural ? 'galones' : 'galón';
    case 'UNIDAD':
    case 'UND':
    case 'UNI':
      return isPlural ? 'unidades' : 'unidad';
    case 'KILO':
    case 'KG':
      return isPlural ? 'kilos' : 'kilo';
    case 'LITRO':
    case 'LT':
      return isPlural ? 'litros' : 'litro';
    case 'JUEGO':
    case 'JGO':
      return isPlural ? 'juegos' : 'juego';
    case 'PAQUETE':
    case 'PQT':
      return isPlural ? 'paquetes' : 'paquete';
    default: {
      const lower = unit.trim().toLowerCase();
      return isPlural ? `${lower}s` : lower;
    }
  }
}

