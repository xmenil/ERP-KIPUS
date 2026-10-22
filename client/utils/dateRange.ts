/** Compares local business dates inclusively; timestamps are reduced to YYYY-MM-DD. */
export function isDateWithinRange(value: string, from = '', to = ''): boolean {
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const parsed = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== day) return false;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return !from || !to || from <= to;
}
