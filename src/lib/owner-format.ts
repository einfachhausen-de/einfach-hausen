/** Owner views: SQLite timestamps are UTC; calendar dates remain dates. */
export function ownerInstant(value: string | null | undefined): Date | null {
  if (!value) return null;
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw) ? raw.replace(' ', 'T') : raw.replace(' ', 'T') + 'Z';
  const result = new Date(normalized);
  return Number.isFinite(result.getTime()) ? result : null;
}
export function ownerDate(value: string | null | undefined): string {
  if (!value) return 'Datum noch offen';
  const isDay = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = isDay ? new Date(value + 'T12:00:00Z') : ownerInstant(value);
  if (!date || !Number.isFinite(date.getTime())) return 'Datum noch offen';
  return new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', ...(isDay ? {} : { hour: '2-digit', minute: '2-digit' }) }).format(date);
}
export function ownerMaintenanceState(value: string | null | undefined, now = new Date()): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Wartung planen';
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return value < today ? 'Wartung überfällig' : value === today ? 'Wartung heute fällig' : 'Wartung geplant';
}
