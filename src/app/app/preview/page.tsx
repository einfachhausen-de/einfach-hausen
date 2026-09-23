import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { BarChart3, BatteryCharging, CalendarDays, ChevronRight, FileText, Flame, HousePlug, MessageCircle, ShieldCheck, Smartphone, Sun, Thermometer, Users, Wifi, Wrench, Zap } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { CompareRail } from '@/components/homeowner/compare-rail';
import { SuggestionSlider } from '@/components/homeowner/suggestion-slider';
import { EHOwnerSection } from '@/design-system';
import styles from '../eigentuemer-start.module.css';

/**
 * Schaufenster der Startseite mit festen Beispieldaten: gleiche Bausteine wie
 * /app, aber ohne Anmeldung und ohne Datenbank.
 */

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

const RAIL = [
  { href: '/app/jobs', label: 'Aktuelle Aufträge', value: 5, icon: Wrench, tone: undefined },
  { href: '/app/jobs', label: 'Angebote', value: 2, icon: FileText, tone: 'terra' },
  { href: '/app/partners', label: 'Ansprechpartner', value: 3, icon: Users, tone: undefined },
  { href: '/app/calendar', label: 'Termine', value: 2, icon: CalendarDays, tone: 'terra' },
] as const;

const UPCOMING = [
  { id: 9003, title: 'Badarmatur tropft', status: 'In Arbeit', when: '24.09.', time: '10:00' },
  { id: 9007, title: 'Heizungswartung', status: 'Angebote da', when: '26.09.', time: '14:30' },
] as const;

const PAST = [
  { id: 9005, title: 'Thermostate tauschen', status: 'Abgeschlossen', when: '18.09.' },
  { id: 9006, title: 'Dachrinne reinigen', status: 'Abgeschlossen', when: '12.09.' },
  { id: 9008, title: 'Rasen mähen', status: 'Abgeschlossen', when: '05.09.' },
] as const;

function tone(status: string): 'ok' | 'info' | 'warn' | 'neutral' {
  if (status === 'Abgeschlossen' || status === 'Erledigt') return 'ok';
  if (status === 'In Arbeit') return 'info';
  if (status === 'Angebote da') return 'warn';
  return 'neutral';
}

export default function Preview() {
  const address = 'Fixturestraße 1, 46325 Borken';

  return (
    <WerkbankRahmen
      role="homeowner"
      active="/app"
      brandSub={address}
      rail={
        <>
          <p className="eh-werkbank-rail-h">Mein Zuhause im Überblick</p>
          {RAIL.map((item) => (
            <Link key={item.label} href={item.href} className={styles.railStat}>
              <span className={styles.railStatIcon} aria-hidden="true"><item.icon size={15} /></span>
              <span className={styles.railStatLabel}>{item.label}</span>
              <strong className={styles.railStatValue} data-tone={item.tone}>{item.value}</strong>
            </Link>
          ))}
        </>
      }
    >
      <header className="eh-werkbank-kopf">
        <div className="eh-werkbank-kopf-copy">
          <span>Dienstag, 22. September</span>
          <h1>{address}</h1>
          <span>Jeremy Schulze</span>
        </div>
        <div className="eh-werkbank-kopf-tools">
          <Link href="/app/hausmeister" className="eh-werkbank-kopf-cta">+ Anliegen</Link>
        </div>
      </header>

      <Link href="/app/jobs" className="eh-werkbank-fokus" aria-label="0 offene Entscheidungen">
        <span className="eh-werkbank-fokus-zahl">0</span>
        <span className="eh-werkbank-fokus-text">
          <strong>Warten auf dich</strong>
          <span>Entscheidungen offen</span>
        </span>
        <span className="eh-werkbank-fokus-pfeil" aria-hidden="true"><ChevronRight size={20} /></span>
      </Link>

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
          <div className={styles.historyPanel}>
            <div className={styles.historyPanelHead}>
              <span className={styles.historyPanelTitle}>Anstehendes</span>
              <span className={styles.historyPanelCount}>{UPCOMING.length}</span>
            </div>
            <ol className={styles.historyList} aria-label="Anstehendes">
              {UPCOMING.map((job) => (
                <li key={job.id}>
                  <Link href="/app/jobs" className={styles.historyRow}>
                    <span className={styles.historyRowMain}>
                      <span className={styles.historyRowTitle}>{job.title}</span>
                      <span className={styles.historyRowMeta}>
                        <span className={styles.historyRowStatus} data-tone={tone(job.status)}>{job.status}</span>
                      </span>
                    </span>
                    <time className={styles.historyRowWhen} dateTime={job.when}>
                      <span className={styles.historyRowDate}>{job.when}</span>
                      <span className={styles.historyRowTime}>{job.time} Uhr</span>
                    </time>
                    <ChevronRight size={16} className={styles.historyRowChevron} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <div className={styles.historyPanel}>
            <div className={styles.historyPanelHead}>
              <span className={styles.historyPanelTitle}>Vergangenes</span>
              <span className={styles.historyPanelCount}>{PAST.length}</span>
            </div>
            <ol className={styles.historyList} aria-label="Vergangenes">
              {PAST.map((job) => (
                <li key={job.id}>
                  <Link href="/app/jobs" className={styles.historyRow}>
                    <span className={styles.historyRowMain}>
                      <span className={styles.historyRowTitle}>{job.title}</span>
                      <span className={styles.historyRowMeta}>
                        <span className={styles.historyRowStatus} data-tone={tone(job.status)}>{job.status}</span>
                      </span>
                    </span>
                    <time className={styles.historyRowWhen} dateTime={job.when}>
                      <span className={styles.historyRowDate}>{job.when}</span>
                    </time>
                    <ChevronRight size={16} className={styles.historyRowChevron} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
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
