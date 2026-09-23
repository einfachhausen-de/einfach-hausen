import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { BarChart3, BatteryCharging, CalendarDays, ChevronRight, FileText, Flame, HousePlug, MessageCircle, ShieldCheck, Smartphone, Sun, Thermometer, Users, Wifi, Wrench, Zap } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { CompareRail } from '@/components/homeowner/compare-rail';
import { SuggestionSlider } from '@/components/homeowner/suggestion-slider';
import { EHButton, EHCallout, EHOwnerSection } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ownerInstant } from '@/lib/owner-format';
import { primaryProperty } from '@/lib/properties';
import styles from './eigentuemer-start.module.css';

/**
 * Startseite der Eigentümer-App.
 *
 * Werkbank-Kopf, Fokus-Zeile, Schnellaktionen und Sektionsrahmen kommen aus
 * der Bibliothek; die drei eigenen Sektionen (Vergleiche, Haus-Historie,
 * Schiene) und die Vorschlagskarte liegen im begleitenden Modul
 * `eigentuemer-start.module.css` – nur Tokens, keine Rohwerte, keine Verläufe.
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

/** Uhrzeit eines Termins (HH:MM, Berlin) – nur wenn echte Zeit steckt. */
function shortTime(value: string | null): string | null {
  if (!value) return null;
  const m = /(\d{2}):(\d{2})/.exec(String(value));
  return m ? `${m[1]}:${m[2]}` : null;
}

/** Heutiges Datum als erste Zeile des Werkbank-Kopfes, z. B. „Dienstag, 22. September". */
function todayEyebrow(): string {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}

/** Zustand eines Vorgangs: Text plus Registerton, nie Farbe allein. */
function jobStatus(status: string): { label: string; tone: 'neutral' | 'info' | 'ok' | 'warn' } {
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

/** Die sechs Vergleiche als kleine Kacheln einer Reihe. */
const COMPARES = [
  { href: '/app/contracts?tab=vergleichen#vergleich-strom', label: 'Strom', icon: Zap },
  { href: '/app/contracts?tab=vergleichen#vergleich-gas', label: 'Gas', icon: Flame },
  { href: '/app/contracts?tab=vergleichen#vergleich-dsl', label: 'Internet', icon: Wifi },
  { href: '/app/contracts?tab=vergleichen#vergleich-versicherung', label: 'Versicherung', icon: ShieldCheck },
  { href: '/app/contracts?tab=vergleichen#vergleich-mobilfunk', label: 'Mobilfunk', icon: Smartphone },
  { href: '/app/contracts?tab=vergleichen', label: 'Photovoltaik', icon: Sun },
  { href: '/app/contracts?tab=vergleichen', label: 'Heizung', icon: Thermometer },
  { href: '/app/contracts?tab=vergleichen', label: 'Smart Home', icon: HousePlug },
  { href: '/app/contracts?tab=vergleichen', label: 'Wallbox', icon: BatteryCharging },
] as const;

type HistoryRow = { id: number; title: string; status: string; shown_at: string; next_at: string | null };

export default async function Dashboard() {
  const user = await requireUser('homeowner');
  const profile = db.prepare('SELECT address,postcode,onboarding_step FROM homeowner_profiles WHERE user_id=?').get(user.id) as { address?: string; postcode?: string; onboarding_step?: string } | undefined;
  const property = primaryProperty(user.id);
  const address = property?.address || profile?.address || '';
  const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

  const jobsCount = (db.prepare(`SELECT COUNT(*) c FROM jobs WHERE homeowner_id=? AND status IN ('open','quoted','accepted','in_progress')`).get(user.id) as { c: number }).c;
  const offersCount = (db.prepare(`SELECT COUNT(*) c FROM quotes q JOIN jobs j ON j.id=q.job_id WHERE j.homeowner_id=? AND q.status='pending' AND j.status='quoted'`).get(user.id) as { c: number }).c;
  const firstDecision = db.prepare(`SELECT j.id FROM quotes q JOIN jobs j ON j.id=q.job_id WHERE j.homeowner_id=? AND q.status='pending' AND j.status='quoted' ORDER BY datetime(q.created_at) DESC LIMIT 1`).get(user.id) as { id: number } | undefined;
  const contactsCount = (db.prepare(`SELECT COUNT(DISTINCT q.provider_id) c FROM quotes q JOIN jobs j ON j.id=q.job_id WHERE j.homeowner_id=?`).get(user.id) as { c: number }).c;
  const appointmentsCount = (db.prepare(`SELECT COUNT(*) c FROM appointments WHERE homeowner_id=? AND datetime(start_at) >= datetime('now') AND status != 'cancelled'`).get(user.id) as { c: number }).c;

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
    ORDER BY datetime(updated_at) DESC LIMIT 6
  `).all(user.id) as HistoryRow[];

  return (
    <WerkbankRahmen
      role="homeowner"
      active="/app"
      brandSub={address}
      rail={
        <>
          <p className="eh-werkbank-rail-h">Mein Zuhause im Überblick</p>
          <Link href="/app/jobs" className={styles.railStat}>
            <span className={styles.railStatIcon} aria-hidden="true"><Wrench size={15} /></span>
            <span className={styles.railStatLabel}>Aktuelle Aufträge</span>
            <strong className={styles.railStatValue}>{jobsCount}</strong>
          </Link>
          <Link href="/app/jobs" className={styles.railStat}>
            <span className={styles.railStatIcon} aria-hidden="true"><FileText size={15} /></span>
            <span className={styles.railStatLabel}>Angebote</span>
            <strong className={styles.railStatValue} data-tone={offersCount > 0 ? 'terra' : undefined}>{offersCount}</strong>
          </Link>
          <Link href="/app/partners" className={styles.railStat}>
            <span className={styles.railStatIcon} aria-hidden="true"><Users size={15} /></span>
            <span className={styles.railStatLabel}>Ansprechpartner</span>
            <strong className={styles.railStatValue}>{contactsCount}</strong>
          </Link>
          <Link href="/app/calendar" className={styles.railStat}>
            <span className={styles.railStatIcon} aria-hidden="true"><CalendarDays size={15} /></span>
            <span className={styles.railStatLabel}>Termine</span>
            <strong className={styles.railStatValue} data-tone={appointmentsCount > 0 ? 'terra' : undefined}>{appointmentsCount}</strong>
          </Link>
        </>
      }
    >
      <header className="eh-werkbank-kopf">
        <div className="eh-werkbank-kopf-copy">
          <span>{todayEyebrow()}</span>
          <h1>{address || 'Adresse ergänzen'}</h1>
          {userName && <span>{userName}</span>}
        </div>
        <div className="eh-werkbank-kopf-tools">
          <Link href="/app/hausmeister" className="eh-werkbank-kopf-cta">+ Anliegen</Link>
        </div>
      </header>

      <Link
        href={firstDecision ? `/app/jobs/${firstDecision.id}` : '/app/jobs'}
        className="eh-werkbank-fokus"
        aria-label={`${offersCount} offene Entscheidungen`}
      >
        <span className="eh-werkbank-fokus-zahl">{offersCount}</span>
        <span className="eh-werkbank-fokus-text">
          <strong>Warten auf dich</strong>
          <span>Entscheidungen offen</span>
        </span>
        <span className="eh-werkbank-fokus-pfeil" aria-hidden="true"><ChevronRight size={20} /></span>
      </Link>

      {profile?.onboarding_step && profile.onboarding_step !== 'done' && (
        <EHCallout title="Einrichtung unvollständig">
          <p>Ergänze die Angaben zu deinem Zuhause, damit wir passende Betriebe finden.</p>
          <EHButton href="/app/onboarding" variant="secondary">Einrichtung fortsetzen</EHButton>
        </EHCallout>
      )}

      <div className={styles.sections}>
        {/* 1) Schnellaktionen – eigene Optik wie am 22.09.2026 */}
        <section className={styles.quickSection} aria-labelledby="quick-title">
          <p id="quick-title" className={styles.quickLabel}>Schnellaktionen</p>
          <div className={`${styles.quickGrid} ${styles.quickGridThree}`}>
            <Link href="/app/hausmeister" className={`${styles.quickCard} ${styles.quickCardPrimary}`}>
              <span className={styles.quickIcon}><Wrench size={20} /></span>
              <strong>Auftrag starten</strong>
              <small>Handwerker, Wartung oder Reparatur – Auftrag anlegen und passenden Betrieb finden.</small>
              <span className={styles.quickCardArrow}>Auftrag starten <ChevronRight size={16} aria-hidden="true" /></span>
            </Link>
            <Link href="/app/consultation" className={styles.quickCard}>
              <span className={styles.quickIcon}><MessageCircle size={20} /></span>
              <strong>Beratung starten</strong>
              <small>Frage zu deinem Zuhause klären – mit Hausmanager oder Fachberatung sprechen.</small>
              <span className={styles.quickCardArrow}>Beratung starten <ChevronRight size={16} aria-hidden="true" /></span>
            </Link>
            <Link href="/app/contracts?tab=vergleichen" className={styles.quickCard}>
              <span className={styles.quickIcon}><BarChart3 size={20} /></span>
              <strong>Tarife vergleichen</strong>
              <small>Versicherung, Energie oder Verträge prüfen – Tarife vergleichen und sparen.</small>
              <span className={styles.quickCardArrow}>Tarife vergleichen <ChevronRight size={16} aria-hidden="true" /></span>
            </Link>
          </div>
        </section>

      <EHOwnerSection title="Verträge & Vergleiche" action={{ href: '/app/contracts?tab=vergleichen', label: 'Alle Vergleiche' }}>
        <CompareRail label="Verträge und Vergleiche">
          <nav className="eh-werkbank-chips" aria-label="Verträge und Vergleiche">
            {COMPARES.map((compare) => (
              <Link key={compare.label} href={compare.href} className="eh-werkbank-chip">
                <compare.icon size={16} aria-hidden="true" />
                {compare.label}
              </Link>
            ))}
          </nav>
        </CompareRail>
      </EHOwnerSection>

      <EHOwnerSection title="Haus-Historie" action={{ href: '/app/jobs', label: 'Alle Vorgänge' }}>
        <div className={styles.historyCols}>
          {/* Reihenfolge im Markup: Anstehendes zuerst (mobil). Auf breiten
              Schirmen dreht das Modul die Spalten auf Vergangenes links. */}
          <div className={styles.historyPanel}>
            <div className={styles.historyPanelHead}>
              <span className={styles.historyPanelTitle}>Anstehendes</span>
              {upcomingHistory.length > 0 && <span className={styles.historyPanelCount}>{upcomingHistory.length}</span>}
            </div>
            {upcomingHistory.length > 0 ? (
              <ol className={styles.historyList} aria-label="Anstehendes">
                {upcomingHistory.map((job) => {
                  const meta = jobStatus(job.status);
                  const when = job.next_at ?? job.shown_at;
                  const time = shortTime(job.next_at);
                  return (
                    <li key={job.id}>
                      <Link href={`/app/jobs/${job.id}`} className={styles.historyRow}>
                        <span className={styles.historyRowMain}>
                          <span className={styles.historyRowTitle}>{job.title}</span>
                          <span className={styles.historyRowMeta}>
                            <span className={styles.historyRowStatus} data-tone={meta.tone}>{meta.label}</span>
                          </span>
                        </span>
                        <time className={styles.historyRowWhen} dateTime={when}>
                          <span className={styles.historyRowDate}>{shortDay(when)}</span>
                          {time && <span className={styles.historyRowTime}>{time} Uhr</span>}
                        </time>
                        <ChevronRight size={16} className={styles.historyRowChevron} aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className={styles.historyColEmpty}>Aktuell nichts anstehend.</p>
            )}
          </div>

          <div className={styles.historyPanel}>
            <div className={styles.historyPanelHead}>
              <span className={styles.historyPanelTitle}>Vergangenes</span>
              {pastHistory.length > 0 && <span className={styles.historyPanelCount}>{pastHistory.length}</span>}
            </div>
            {pastHistory.length > 0 ? (
              <ol className={styles.historyList} aria-label="Vergangenes">
                {pastHistory.map((job) => {
                  const meta = jobStatus(job.status);
                  return (
                    <li key={job.id}>
                      <Link href={`/app/jobs/${job.id}`} className={styles.historyRow}>
                        <span className={styles.historyRowMain}>
                          <span className={styles.historyRowTitle}>{job.title}</span>
                          <span className={styles.historyRowMeta}>
                            <span className={styles.historyRowStatus} data-tone={meta.tone}>{meta.label}</span>
                          </span>
                        </span>
                        <time className={styles.historyRowWhen} dateTime={job.shown_at}>
                          <span className={styles.historyRowDate}>{shortDay(job.shown_at)}</span>
                        </time>
                        <ChevronRight size={16} className={styles.historyRowChevron} aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className={styles.historyColEmpty}>Noch keine abgeschlossenen Vorgänge.</p>
            )}
          </div>
        </div>
      </EHOwnerSection>

      <EHOwnerSection title="Vorschläge für dich" action={{ href: '/app/contracts', label: 'Alle Verträge' }}>
        <SuggestionSlider />
      </EHOwnerSection>
      </div>
    </WerkbankRahmen>
  );
}
