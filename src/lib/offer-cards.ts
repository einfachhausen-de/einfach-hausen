import { db } from './db';
import { dateLabel, euro } from './format';

/**
 * Angebote als Entscheidung: eine Karte je Vorgang, die offenen Angebote als
 * Auswahl, das guenstigste vorausgewaehlt. Chat und Vorgangsseite lesen dieselbe
 * Quelle, damit beide dieselbe Empfehlung zeigen. Nur buchbare Angebote kommen
 * vor: gepruefter Betrieb, aktiver Partnervertrag, Vorgang noch offen.
 * Betriebe, deren Angebot nicht gewaehlt werden kann, erscheinen hier nicht.
 */
export type OfferOption = { key: string; provider: string; price: string; note: string; markers: string[] };
export type OfferCard = { jobId: number; jobHref: string; subject: string; question: string; options: OfferOption[] };

const BUCHBAR = "q.status='pending' AND j.status IN ('open','quoted') AND p.verified=1 AND c.status='active'";
type Zeile = {
  quote_id: number; amount: number; available_at: string | null; job_id: number; title: string; updated_at: string;
  business_name: string | null; rating_count: number | null; distance_km: number | null; emergency_mode: string | null;
};

function zeilen(bedingung: string, args: Array<string | number>): Zeile[] {
  return db.prepare(`SELECT q.id quote_id,q.amount,q.available_at,j.id job_id,j.title,j.updated_at,p.business_name,p.rating_count,
      (SELECT d.distance_km FROM job_dispatches d WHERE d.job_id=q.job_id AND d.provider_id=q.provider_id) distance_km,
      pref.emergency_mode
    FROM quotes q
    JOIN jobs j ON j.id=q.job_id
    JOIN provider_profiles p ON p.user_id=q.provider_id
    JOIN partner_contracts c ON c.provider_id=q.provider_id
    LEFT JOIN provider_preferences pref ON pref.provider_id=q.provider_id
    WHERE ${BUCHBAR} AND ${bedingung}
    ORDER BY q.amount ASC, q.id ASC`).all(...args) as Zeile[];
}

/** Auszeichnungen wie im Vergleich auf der Vorgangsseite - dieselben Begriffe. */
function auszeichnungen(zeile: Zeile, guenstigst: number, schnellster: number | null): string[] {
  const markers: string[] = [];
  if (Number(zeile.amount) === guenstigst) markers.push('Günstigstes');
  if (zeile.quote_id === schnellster) markers.push('Schnellster Termin');
  if (!zeile.rating_count) markers.push('Neu im Netzwerk');
  if (zeile.emergency_mode === '24_7') markers.push('24/7 Notdienst');
  return markers;
}

function notiz(zeile: Zeile): string {
  const termin = zeile.available_at ? `Verfügbar: ${dateLabel(zeile.available_at)}` : 'Termin nach Abstimmung';
  const entfernung = zeile.distance_km === null || zeile.distance_km === undefined
    ? '' : ` · ${Number(zeile.distance_km).toFixed(1)} km`;
  return termin + entfernung;
}

function karte(rows: Zeile[]): OfferCard {
  const guenstigst = Math.min(...rows.map(zeile => Number(zeile.amount)));
  const schnellster = rows.filter(zeile => zeile.available_at)
    .sort((a, b) => String(a.available_at).localeCompare(String(b.available_at)))[0]?.quote_id ?? null;
  return {
    jobId: Number(rows[0].job_id),
    jobHref: `/app/jobs/${rows[0].job_id}`,
    subject: String(rows[0].title || 'Auftrag'),
    question: 'Soll ich dieses Angebot buchen?',
    options: rows.map(zeile => ({
      key: String(zeile.quote_id),
      provider: String(zeile.business_name || 'Betrieb'),
      price: euro(Number(zeile.amount)),
      note: notiz(zeile),
      markers: auszeichnungen(zeile, guenstigst, schnellster),
    })),
  };
}

export function offerCard(homeownerId: number, jobId: number): OfferCard | null {
  const rows = zeilen('j.homeowner_id=? AND j.id=?', [homeownerId, jobId]);
  return rows.length ? karte(rows) : null;
}

/** Alle Vorgaenge mit offenen Angeboten, der zuletzt bewegte zuerst. */
export function offerCards(homeownerId: number, maxJobs = 3): OfferCard[] {
  const gruppen = new Map<number, Zeile[]>();
  for (const zeile of zeilen('j.homeowner_id=?', [homeownerId])) {
    const liste = gruppen.get(Number(zeile.job_id)) ?? [];
    liste.push(zeile);
    gruppen.set(Number(zeile.job_id), liste);
  }
  return [...gruppen.values()]
    .sort((a, b) => String(b[0].updated_at).localeCompare(String(a[0].updated_at)))
    .slice(0, maxJobs)
    .map(karte);
}
