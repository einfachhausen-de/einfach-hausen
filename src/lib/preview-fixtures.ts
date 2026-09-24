/**
 * Feste Vorsau-Zeilen fuer die oeffentlichen Schaufenster-Seiten
 * (/app/preview/*). Ein Ort fuer die Demo-Zahlen, damit Vorschau-Vertraege
 * und Vorschau-Angebote nie auseinanderlaufen. Fristen relativ zum
 * Besuchsdatum, damit alle Zustaende (heute, bald, entspannt, verpasst)
 * immer lebendig aussehen.
 */
export type PreviewFristRow = {
  id: number; kind: string; provider: string; tariff: string; contract_number: string;
  cost_amount: number | null; cost_interval: string; started_at: string | null;
  term_months: number | null; renewal_months: number | null; cancellation_days: number | null;
  cancellation_deadline: string | null; notice: string; document_title: string;
  document_path: string | null; status: string;
};

export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const inDays = (n: number) => iso(new Date(Date.now() + n * 86_400_000));

export function previewVertraege(): PreviewFristRow[] {
  return [
    { id: 901, kind: 'strom', provider: 'Stadtwerke Duisburg', tariff: 'Basis Strom 12', contract_number: 'SWD-4413902', cost_amount: 4190, cost_interval: 'month', started_at: '2025-10-01', term_months: 12, renewal_months: 12, cancellation_days: 0, cancellation_deadline: inDays(0), notice: 'Kündigen heute noch möglich — danach ein Jahr länger gebunden.', document_title: '', document_path: null, status: 'active' },
    { id: 902, kind: 'dsl', provider: 'Telekom', tariff: 'MagentaZuhause XL', contract_number: 'TK-77120931', cost_amount: 4495, cost_interval: 'month', started_at: '2024-10-31', term_months: 24, renewal_months: 12, cancellation_days: 30, cancellation_deadline: inDays(7), notice: 'Router-Miete enthalten; Wechsel prüfen.', document_title: '', document_path: null, status: 'active' },
    { id: 903, kind: 'versicherung', provider: 'HUK24', tariff: 'Hausrat Komfort', contract_number: 'HUK-90221', cost_amount: 12800, cost_interval: 'year', started_at: '2021-11-01', term_months: 12, renewal_months: 12, cancellation_days: 30, cancellation_deadline: inDays(39), notice: 'Wohnfläche nach Umbau anpassen.', document_title: '', document_path: null, status: 'active' },
    { id: 904, kind: 'mobilfunk', provider: 'O2', tariff: 'Mobile M', contract_number: 'O2-3110884', cost_amount: 2999, cost_interval: 'month', started_at: '2025-05-01', term_months: 24, renewal_months: 12, cancellation_days: 30, cancellation_deadline: inDays(221), notice: '', document_title: '', document_path: null, status: 'active' },
    { id: 905, kind: 'gas', provider: 'Fluxio Energie', tariff: 'Fluxio Fix 24', contract_number: 'FLX-55201', cost_amount: 6400, cost_interval: 'month', started_at: '2024-01-15', term_months: 24, renewal_months: 12, cancellation_days: 30, cancellation_deadline: inDays(-14), notice: 'Gekündigt zum Jahresende — Bestätigung liegt in der Hausakte.', document_title: '', document_path: null, status: 'cancelled' },
  ];
}

/** PLZ + Haushaltgroesse der Vorschau — identisch in Vertraege- und Angebote-Schaufenster. */
export const PREVIEW_RECHNUNG = { postcode: '47055', householdSize: 3 };
