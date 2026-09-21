import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { BarChart3, ChevronRight, FileText, MessageCircle, Plus, Users, Wrench } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { EHButton, EHCallout } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { primaryProperty } from '@/lib/properties';
import styles from './homeowner.module.css';

/**
 * Startseite 2026-09-22 v3:
 * - Schnellaktionen ganz oben (3 Cards: Auftrag starten / Beratung starten / Tarife vergleichen)
 * - Darunter: Mein Zuhause im Überblick mit 3 Cards: Aktuelle Aufträge / Angebote / Ansprechpartner
 * - Wartet-auf-dich komplett raus, nur Button Neues Anliegen bleibt
 */

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
        `SELECT COUNT(*) c FROM jobs WHERE homeowner_id=? AND status IN ('open','quoted','accepted','in_progress')`
      )
      .get(user.id) as { c: number }
  ).c;

  const offersCount = (
    db
      .prepare(
        `SELECT COUNT(*) c FROM quotes q JOIN jobs j ON j.id=q.job_id WHERE j.homeowner_id=? AND q.status='pending' AND j.status='quoted'`
      )
      .get(user.id) as { c: number }
  ).c;

  const contactsCount = (
    db
      .prepare(
        `SELECT COUNT(DISTINCT q.provider_id) c FROM quotes q JOIN jobs j ON j.id=q.job_id WHERE j.homeowner_id=?`
      )
      .get(user.id) as { c: number }
  ).c;

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
            <p className={styles.dashSub}>Womit du direkt weiterkommst – ohne Suchen.</p>
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

        {/* 1) Schnellaktionen ganz oben */}
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

        {/* 2) Mein Zuhause im Überblick – gleiche Karten wie darüber */}
        <section className={styles.overviewSection} aria-labelledby="overview-title">
          <p id="overview-title" className={styles.quickLabel}>
            Mein Zuhause im Überblick
          </p>
          <div className={`${styles.quickGrid} ${styles.quickGridThree}`}>
            <Link href="/app/jobs" className={styles.quickCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.quickIcon} aria-hidden="true">
                  <Wrench size={20} />
                </span>
                <span className={styles.overviewCount}>{jobsCount}</span>
              </div>
              <strong>Aktuelle Aufträge</strong>
              <small>
                {jobsCount === 0
                  ? 'Keine aktiven Aufträge – starte dein erstes Anliegen.'
                  : `${jobsCount} ${jobsCount === 1 ? 'Auftrag läuft gerade' : 'Aufträge in Bearbeitung'} – Status und nächste Schritte.`}
              </small>
              <span className={styles.quickCardArrow}>
                Aufträge ansehen <ChevronRight size={16} />
              </span>
            </Link>

            <Link href="/app/jobs" className={styles.quickCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.quickIcon} aria-hidden="true">
                  <FileText size={20} />
                </span>
                <span className={styles.overviewCount} data-tone={offersCount > 0 ? 'terra' : undefined}>
                  {offersCount}
                </span>
              </div>
              <strong>Angebote</strong>
              <small>
                {offersCount === 0
                  ? 'Keine offenen Angebote – neue Angebote erscheinen hier sofort.'
                  : `${offersCount} ${offersCount === 1 ? 'offenes Angebot wartet auf Freigabe' : 'offene Angebote warten auf Entscheidung'}.`}
              </small>
              <span className={styles.quickCardArrow}>
                Angebote prüfen <ChevronRight size={16} />
              </span>
            </Link>

            <Link href="/app/partners" className={styles.quickCard}>
              <div className={styles.overviewCardTop}>
                <span className={styles.quickIcon} aria-hidden="true">
                  <Users size={20} />
                </span>
                <span className={styles.overviewCount}>{contactsCount}</span>
              </div>
              <strong>Ansprechpartner</strong>
              <small>
                {contactsCount === 0
                  ? 'Noch keine Partner – nach dem ersten Auftrag erscheinen sie hier.'
                  : `${contactsCount} ${contactsCount === 1 ? 'Partner hat für dich gearbeitet' : 'Partner haben für dich gearbeitet'} – Kontakt und Historie.`}
              </small>
              <span className={styles.quickCardArrow}>
                Partner ansehen <ChevronRight size={16} />
              </span>
            </Link>
          </div>
        </section>
      </div>
    </WerkbankRahmen>
  );
}
