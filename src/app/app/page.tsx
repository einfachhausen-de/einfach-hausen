import '@/components/werkbank-layout.css';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import {
  START_VORSCHLAEGE,
  StartAnsicht,
  StartRail,
  type StartFokus,
  type StartVorschlag,
} from '@/components/homeowner/start-ansicht';
import type { VerlaufEintrag } from '@/components/homeowner/verlauf-zeitleiste';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ownerInstant } from '@/lib/owner-format';
import { primaryProperty } from '@/lib/properties';
import { SAVINGS_KINDS, contractKindLabel, estimateSavings, yearlyCents } from '@/lib/contracts';
import { euroExact } from '@/lib/format';

/**
 * Startseite der Eigentümer-App. Die Komposition liegt in
 * `components/homeowner/start-ansicht.tsx` (gemeinsam mit /app/preview);
 * hier entstehen ausschließlich die echten Daten und der eine Fokus.
 */

/** "24.09." – kurz, tabellarisch, sortiert wird am ISO-Wert. */
function shortDay(value: string | null): string {
  if (!value) return '';
  const raw = String(value);
  const isDay = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const instant = isDay ? new Date(`${raw}T12:00:00Z`) : ownerInstant(raw);
  if (!instant) return raw.slice(0, 10);
  return new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit' }).format(instant);
}

/** Uhrzeit eines Termins (HH:MM) – nur wenn echte Zeit steckt. */
function shortTime(value: string | null): string | null {
  if (!value) return null;
  const m = /(\d{2}):(\d{2})/.exec(String(value));
  return m ? `${m[1]}:${m[2]}` : null;
}

/** „Sa., 26.09., 14:30 Uhr“ – Wochentag hilft mehr als ein nacktes Datum. */
function terminWann(value: string): string {
  const raw = String(value);
  const instant = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00Z`) : ownerInstant(raw);
  const tag = instant
    ? new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short', day: '2-digit', month: '2-digit' }).format(instant)
    : shortDay(raw);
  const zeit = shortTime(raw);
  return zeit ? `${tag}, ${zeit} Uhr` : tag;
}

/** Gruß nach Berliner Tageszeit. */
function tageszeitGruss(): string {
  const stunde = Number(
    new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date())
      .find((part) => part.type === 'hour')?.value ?? 12,
  );
  if (stunde < 11) return 'Guten Morgen';
  if (stunde < 18) return 'Guten Tag';
  return 'Guten Abend';
}

/** Zustand eines Vorgangs: Text plus Registerton, nie Farbe allein. */
function jobStatus(status: string): { label: string; tone: VerlaufEintrag['ton'] } {
  switch (status) {
    case 'open': return { label: 'Offen', tone: 'neutral' };
    case 'quoted': return { label: 'Angebote da', tone: 'warn' };
    case 'accepted': return { label: 'Beauftragt', tone: 'info' };
    case 'in_progress': return { label: 'In Arbeit', tone: 'info' };
    case 'done':
    case 'completed': return { label: 'Abgeschlossen', tone: 'ok' };
    case 'cancelled': return { label: 'Storniert', tone: 'neutral' };
    default: return { label: status, tone: 'neutral' };
  }
}

type HistoryRow = { id: number; title: string; status: string; shown_at: string; next_at: string | null };
type ContractRow = { id: number; kind: string; provider: string; cost_amount: number | null; cost_interval: string };

export default async function Dashboard() {
  const user = await requireUser('homeowner');
  const profile = db.prepare('SELECT address,postcode,onboarding_step FROM homeowner_profiles WHERE user_id=?').get(user.id) as { address?: string; postcode?: string; onboarding_step?: string } | undefined;
  const property = primaryProperty(user.id);
  const address = property?.address || profile?.address || '';
  const vorname = (user.first_name || '').trim();

  const jobsCount = (db.prepare(`SELECT COUNT(*) c FROM jobs WHERE homeowner_id=? AND status IN ('open','quoted','accepted','in_progress')`).get(user.id) as { c: number }).c;
  const offersCount = (db.prepare(`SELECT COUNT(*) c FROM quotes q JOIN jobs j ON j.id=q.job_id WHERE j.homeowner_id=? AND q.status='pending' AND j.status='quoted'`).get(user.id) as { c: number }).c;
  const firstDecision = db.prepare(`SELECT j.id FROM quotes q JOIN jobs j ON j.id=q.job_id WHERE j.homeowner_id=? AND q.status='pending' AND j.status='quoted' ORDER BY datetime(q.created_at) DESC LIMIT 1`).get(user.id) as { id: number } | undefined;
  const contactsCount = (db.prepare(`SELECT COUNT(DISTINCT q.provider_id) c FROM quotes q JOIN jobs j ON j.id=q.job_id WHERE j.homeowner_id=?`).get(user.id) as { c: number }).c;
  const appointmentsCount = (db.prepare(`SELECT COUNT(*) c FROM appointments WHERE homeowner_id=? AND datetime(start_at) >= datetime('now') AND status != 'cancelled'`).get(user.id) as { c: number }).c;

  // Spar-Check: der ergiebigste laufende Vertrag – Fokus, wenn sonst nichts
  // wartet, sonst erster Vorschlag.
  const contracts = db.prepare(`SELECT id, kind, provider, cost_amount, cost_interval FROM house_contracts WHERE homeowner_id=? AND status='active'`).all(user.id) as ContractRow[];
  let bestSaving: { art: string; anbieter: string; betrag: string; href: string } | null = null;
  if (contracts.length > 0) {
    const best = contracts
      .filter((r) => (SAVINGS_KINDS as readonly string[]).includes(r.kind))
      .map((r) => ({ r, e: estimateSavings({ kind: r.kind, yearlyCents: yearlyCents(r.cost_amount, r.cost_interval), postcode: profile?.postcode || '', householdSize: null, hasLoyaltyBonus: false, switchWilling: true }) }))
      .filter((x) => x.e)
      .sort((a, b) => (b.e?.highCents ?? 0) - (a.e?.highCents ?? 0))[0];
    if (best?.e) {
      bestSaving = { art: contractKindLabel(best.r.kind), anbieter: best.r.provider, betrag: euroExact(best.e.highCents), href: `/app/contracts?vertrag=${best.r.id}` };
    }
  }

  // Anstehendes: laufende und offene Vorgänge, nach nächstem Termin, sonst letzte Aktivität.
  const upcomingHistory = db.prepare(`
    SELECT j.id, j.title, j.status, j.updated_at AS shown_at,
      (SELECT MIN(a.start_at) FROM appointments a
        WHERE a.job_id=j.id AND a.status='confirmed' AND datetime(a.start_at) >= datetime('now')
      ) AS next_at
    FROM jobs j
    WHERE j.homeowner_id=? AND j.status IN ('open','quoted','accepted','in_progress')
    ORDER BY datetime(COALESCE(
      (SELECT MIN(a.start_at) FROM appointments a
        WHERE a.job_id=j.id AND a.status='confirmed' AND datetime(a.start_at) >= datetime('now')),
      j.updated_at)) ASC
    LIMIT 6
  `).all(user.id) as HistoryRow[];

  // Vergangenes: abgeschlossene und stornierte Vorgänge, neueste zuerst.
  const pastHistory = db.prepare(`
    SELECT id, title, status, updated_at AS shown_at, NULL AS next_at
    FROM jobs
    WHERE homeowner_id=? AND status IN ('completed','done','cancelled')
    ORDER BY datetime(updated_at) DESC LIMIT 18
  `).all(user.id) as HistoryRow[];

  const verlauf: VerlaufEintrag[] = [...upcomingHistory.map((job) => ({ ...job, past: false })), ...pastHistory.map((job) => ({ ...job, past: true }))]
    .map((job) => {
      const meta = jobStatus(job.status);
      const when = job.next_at ?? job.shown_at;
      const zeit = job.next_at ? shortTime(job.next_at) : null;
      return {
        id: String(job.id),
        titel: job.title,
        status: meta.label,
        ton: meta.tone,
        datum: shortDay(when),
        iso: when ? String(when).slice(0, 10) : undefined,
        zusatz: job.next_at ? (zeit ? `Termin ${shortDay(job.next_at)}, ${zeit} Uhr` : `Termin ${shortDay(job.next_at)}`) : undefined,
        vergangen: job.past,
        href: `/app/jobs/${job.id}`,
      };
    })
    .sort((a, b) => (b.iso ?? '').localeCompare(a.iso ?? ''));

  // Genau ein Fokus, feste Rangfolge: Entscheidung vor Einrichtung vor Termin
  // vor Sparpotenzial; wartet nichts, sagt die Seite das ehrlich.
  const naechsterTermin = upcomingHistory.find((job) => job.next_at);
  const einrichtungOffen = Boolean(profile?.onboarding_step && profile.onboarding_step !== 'done');
  const fokus: StartFokus =
    offersCount > 0
      ? { art: 'entscheidung', anzahl: offersCount, href: firstDecision ? `/app/jobs/${firstDecision.id}` : '/app/jobs' }
      : einrichtungOffen
        ? { art: 'einrichtung' }
        : naechsterTermin?.next_at
          ? { art: 'termin', titel: naechsterTermin.title, wann: terminWann(naechsterTermin.next_at), href: `/app/jobs/${naechsterTermin.id}` }
          : bestSaving
            ? { art: 'sparen', betrag: bestSaving.betrag, hinweis: `${bestSaving.art} bei ${bestSaving.anbieter} – die Rechnung dahinter liegt in deiner Hausakte.`, href: bestSaving.href }
            : { art: 'ruhe' };

  const sparVorschlag: StartVorschlag | null =
    contracts.length === 0
      ? { id: 'vertraege-erfassen', titel: 'Verträge erfassen, Spar-Check starten', text: 'Strom, Internet, Versicherung: nur den Anbieter eintragen. Wir prüfen automatisch, ob dein Tarif zu teuer ist.', weiter: 'Ersten Vertrag anlegen', href: '/app/contracts#vertrag-anlegen', symbol: 'sparen' }
      : bestSaving && fokus.art !== 'sparen'
        ? { id: 'spar-check', titel: `Spar-Check: ${bestSaving.art}`, text: `Bei ${bestSaving.anbieter} sind bis zu ${bestSaving.betrag} pro Jahr drin – die Rechnung dahinter liegt in deiner Hausakte.`, weiter: 'Spar-Check ansehen', href: bestSaving.href, symbol: 'sparen' }
        : null;
  const vorschlaege = sparVorschlag ? [sparVorschlag, ...START_VORSCHLAEGE] : START_VORSCHLAEGE;

  return (
    <WerkbankRahmen
      role="homeowner"
      active="/app"
      brandSub={address}
      rail={<StartRail werte={{ auftraege: jobsCount, angebote: offersCount, kontakte: contactsCount, termine: appointmentsCount }} />}
    >
      <StartAnsicht
        gruss={vorname ? `${tageszeitGruss()}, ${vorname}` : tageszeitGruss()}
        adresse={address}
        fokus={fokus}
        verlauf={verlauf}
        stand={shortDay(new Date().toISOString())}
        vorschlaege={vorschlaege}
      />
    </WerkbankRahmen>
  );
}
