import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { BarChart3, ChevronRight, Clock, MessageCircle, Plus, Wrench } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { EHButton, EHCallout } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ownerInstant } from '@/lib/owner-format';
import { primaryProperty } from '@/lib/properties';
import styles from './homeowner.module.css';

/**
 * Startseite 2026-09-22 – reduziert auf Wunsch:
 * - Wartet-auf-dich komplett raus (ausser Button Neues Anliegen)
 * - Ganz oben: Aktuelle Vorgänge
 * - Darunter: Schnellaktionen mit nur 3 Cards
 *   Auftrag starten / Beratung starten / Tarife vergleichen
 */

function shortDay(value: string): string {
  const raw = String(value);
  const isDay = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const instant = isDay ? new Date(`${raw}T12:00:00Z`) : ownerInstant(raw);
  if (!instant) return raw.slice(0, 10);
  return new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit' }).format(instant);
}

function statusLabel(status: string): { label: string; tone: 'warn' | 'info' | 'ok' | 'neutral' } {
  switch (status) {
    case 'open':
      return { label: 'Offen', tone: 'neutral' };
    case 'quoted':
      return { label: 'Angebote da', tone: 'warn' };
    case 'accepted':
      return { label: 'Beauftragt', tone: 'info' };
    case 'in_progress':
      return { label: 'In Arbeit', tone: 'info' };
    case 'done':
      return { label: 'Erledigt', tone: 'ok' };
    default:
      return { label: status, tone: 'neutral' };
  }
}

export default async function Dashboard() {
  const user = await requireUser('homeowner');
  const profile = db
    .prepare('SELECT address,postcode,onboarding_step FROM homeowner_profiles WHERE user_id=?')
    .get(user.id) as { address?: string; postcode?: string; onboarding_step?: string } | undefined;
  const property = primaryProperty(user.id);
  const address = property?.address || profile?.address || '';
  const firstName = user.first_name || 'dort';

  const jobsCount = (
    db
      .prepare(
        `SELECT COUNT(*) c FROM jobs WHERE homeowner_id=? AND request_kind='service' AND status IN ('open','quoted','accepted','in_progress')`
      )
      .get(user.id) as { c: number }
  ).c;

  const recentJobs = db
    .prepare(
      `SELECT id,title,status,updated_at FROM jobs WHERE homeowner_id=? AND request_kind='service' ORDER BY datetime(updated_at) DESC LIMIT 6`
    )
    .all(user.id) as { id: number; title: string; status: string; updated_at: string }[];

  const documentCount = (
    db.prepare(`SELECT COUNT(*) c FROM documents d JOIN jobs j ON j.id=d.job_id WHERE j.homeowner_id=?`).get(user.id) as {
      c: number;
    }
  ).c;

  const profileFields = [
    !!(user.first_name && user.last_name),
    !!(user as { phone?: string }).phone,
    !!profile?.address,
    !!profile?.postcode,
  ];
  const profileFilled = profileFields.filter(Boolean).length;
  const profilePct = Math.round((profileFilled / profileFields.length) * 100);

  return (
    <WerkbankRahmen
      role="homeowner"
      active="/app"
      brandSub={address}
      rail={
        <>
          <p className="eh-werkbank-rail-h">Kontext dieser Seite</p>
          <div className="eh-werkbank-karte">
            <h4>Dein Zuhause</h4>
            <div className="eh-werkbank-bar">
              <i style={{ width: `${profilePct}%` }} />
            </div>
            <div className="eh-werkbank-row">
              <span>Profil vollständig</span>
              <span>
                {profilePct}% · {profileFilled} von {profileFields.length}
              </span>
            </div>
            <div className="eh-werkbank-row">
              <span>Offene Vorgänge</span>
              <span>{jobsCount}</span>
            </div>
            <div className="eh-werkbank-row">
              <span>Dokumente</span>
              <span>{documentCount}</span>
            </div>
            {profilePct < 100 && (
              <Link href="/app/profile" className="eh-werkbank-go">
                Profil vervollständigen →
              </Link>
            )}
          </div>
          <div className="eh-werkbank-karte">
            <h4>Hilfe</h4>
            <p className={styles.railHelp}>Dein Hausmanager beantwortet Fragen zu Vorgängen, Terminen und Unterlagen.</p>
            <Link href="/app/hausmanager" className="eh-werkbank-go">
              Hausmanager fragen →
            </Link>
          </div>
          {profile?.onboarding_step && profile.onboarding_step !== 'done' && (
            <div className="eh-werkbank-karte">
              <h4>Einrichtung</h4>
              <p className={styles.railHelp}>Ergänze die Angaben zu deinem Zuhause, damit Aufträge schneller starten.</p>
              <Link href="/app/onboarding" className="eh-werkbank-go">
                Einrichtung fortsetzen →
              </Link>
            </div>
          )}
        </>
      }
    >
      <div className={styles.dashRoot}>
        <header className={styles.dashHeader}>
          <div className={styles.dashHeaderCopy}>
            <p className={styles.dashEyebrow}>{address ? address : 'Dein Zuhause'} · Eigentümer-App</p>
            <h1 className={styles.dashTitle}>Hallo {firstName}, dein Zuhause im Überblick</h1>
            <p className={styles.dashSub}>
              Was gerade läuft und womit du direkt weiterkommst – ohne Suchen.
            </p>
          </div>
          <div className={styles.dashHeaderActions}>
            <Link className={styles.dashPrimaryAction} href="/app/hausmeister">
              <Plus size={18} /> Neues Anliegen
            </Link>
          </div>
        </header>

        {profile?.onboarding_step && profile.onboarding_step !== 'done' && (
          <EHCallout title="Einrichtung unvollständig">
            <p>Ergänze die Angaben zu deinem Zuhause, damit wir passende Betriebe finden.</p>
            <EHButton href="/app/onboarding" variant="secondary">
              Einrichtung fortsetzen
            </EHButton>
          </EHCallout>
        )}

        {/* 1) Ganz oben: Aktuelle Vorgänge */}
        <section className={styles.sectionCard} aria-labelledby="jobs-title">
          <header className={styles.sectionCardHeader}>
            <h2 id="jobs-title">Aktuelle Vorgänge</h2>
            <Link href="/app/jobs">Alle Aufträge →</Link>
          </header>
          {recentJobs.length > 0 ? (
            <ul className={styles.sectionList} aria-label="Aktuelle Vorgänge">
              {recentJobs.map((job) => {
                const meta = statusLabel(job.status);
                return (
                  <li key={job.id}>
                    <Link href={`/app/jobs/${job.id}`} className={styles.contentsLink}>
                      <span className={styles.itemIcon}>
                        <Clock size={18} />
                      </span>
                      <span className={styles.itemMain}>
                        <b>{job.title}</b>
                        <small>
                          {shortDay(job.updated_at)} · Nr. {job.id}
                        </small>
                      </span>
                      <span className={styles.itemMeta}>
                        <span
                          className={`${styles.pill} ${meta.tone === 'warn' ? styles.pillWarn : meta.tone === 'info' ? styles.pillInfo : styles.pill}`}
                        >
                          {meta.label}
                        </span>
                        <ChevronRight size={16} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>
                <Wrench size={22} />
              </span>
              <p>Noch keine Vorgänge. Starte mit deinem ersten Anliegen.</p>
              <Link href="/app/hausmeister">Anliegen erstellen</Link>
            </div>
          )}
        </section>

        {/* 2) Darunter: Schnellaktionen – nur 3 Cards */}
        <section className={styles.quickSection} aria-labelledby="quick-title">
          <p id="quick-title" className={styles.quickLabel}>
            Schnellaktionen
          </p>
          <div className={`${styles.quickGrid} ${styles.quickGridThree}`}>
            <Link href="/app/hausmeister" className={`${styles.quickCard} ${styles.quickCardPrimary}`}>
              <span className={styles.quickIcon} aria-hidden="true">
                <Wrench size={20} />
              </span>
              <strong>Auftrag starten</strong>
              <small>Handwerker, Wartung oder Reparatur – Auftrag anlegen und passenden Betrieb finden.</small>
              <span className={styles.quickCardArrow}>
                Auftrag starten <ChevronRight size={16} />
              </span>
            </Link>
            <Link href="/app/consultation" className={styles.quickCard}>
              <span className={styles.quickIcon} aria-hidden="true">
                <MessageCircle size={20} />
              </span>
              <strong>Beratung starten</strong>
              <small>Frage zu deinem Zuhause klären – mit Hausmanager oder Fachberatung sprechen.</small>
              <span className={styles.quickCardArrow}>
                Beratung starten <ChevronRight size={16} />
              </span>
            </Link>
            <Link href="/app/plans" className={styles.quickCard}>
              <span className={styles.quickIcon} aria-hidden="true">
                <BarChart3 size={20} />
              </span>
              <strong>Tarife vergleichen</strong>
              <small>Versicherung, Energie oder Verträge prüfen – Tarife vergleichen und sparen.</small>
              <span className={styles.quickCardArrow}>
                Tarife vergleichen <ChevronRight size={16} />
              </span>
            </Link>
          </div>
        </section>
      </div>
    </WerkbankRahmen>
  );
}
