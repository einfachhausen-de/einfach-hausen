import '@/components/werkbank-layout.css';
import Link from 'next/link';
import { BarChart3, BatteryCharging, CalendarDays, ChevronRight, FileText, Flame, HousePlug, MessageCircle, ShieldCheck, Smartphone, Sun, Thermometer, Users, Wifi, Wrench, Zap } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { CompareRail } from '@/components/homeowner/compare-rail';
import { VerlaufZeitleiste, type VerlaufEintrag } from '@/components/homeowner/verlauf-zeitleiste';
import { SuggestionSlider } from '@/components/homeowner/suggestion-slider';
import { EHOwnerSection } from '@/design-system';
import styles from '../eigentuemer-start.module.css';

/**
 * Schaufenster der Startseite mit festen Beispieldaten: gleiche Bausteine wie
 * /app, aber ohne Anmeldung und ohne Datenbank.
 */

const COMPARES = [
  { href: '/app/contracts?tab=vergleichen#vergleich-strom', label: 'Strom', icon: Zap, hue: 'sonne' },
  { href: '/app/contracts?tab=vergleichen#vergleich-gas', label: 'Gas', icon: Flame, hue: 'himmel' },
  { href: '/app/contracts?tab=vergleichen#vergleich-dsl', label: 'Internet', icon: Wifi, hue: 'veilchen' },
  { href: '/app/contracts?tab=vergleichen#vergleich-versicherung', label: 'Versicherung', icon: ShieldCheck, hue: 'stahl' },
  { href: '/app/contracts?tab=vergleichen#vergleich-mobilfunk', label: 'Mobilfunk', icon: Smartphone, hue: 'rose' },
  { href: '/app/contracts?tab=vergleichen', label: 'Photovoltaik', icon: Sun, hue: 'sand' },
  { href: '/app/contracts?tab=vergleichen', label: 'Heizung', icon: Thermometer, hue: 'terra' },
  { href: '/app/contracts?tab=vergleichen', label: 'Smart Home', icon: HousePlug, hue: 'blatt' },
  { href: '/app/contracts?tab=vergleichen', label: 'Wallbox', icon: BatteryCharging, hue: 'petrol' },
] as const;

const RAIL = [
  { href: '/app/jobs', label: 'Aktuelle Aufträge', value: 5, icon: Wrench, tone: undefined },
  { href: '/app/jobs', label: 'Angebote', value: 2, icon: FileText, tone: 'terra' },
  { href: '/app/partners', label: 'Ansprechpartner', value: 3, icon: Users, tone: undefined },
  { href: '/app/calendar', label: 'Termine', value: 2, icon: CalendarDays, tone: 'terra' },
] as const;

// Haus-Historie der Vorschau: eine absteigende Zeitleiste nach dem
// Live-Muster (VerlaufZeitleiste), Demo-Werte wie auf den Screenshots.
const VERLAUF: readonly VerlaufEintrag[] = [
  { id: 'u9007', titel: 'Heizungswartung', status: 'Angebote da', ton: 'warn', datum: '26.09.', iso: '2026-09-26T14:30', zusatz: 'Termin 26.09., 14:30 Uhr', href: '/app/jobs' },
  { id: 'u9003', titel: 'Badarmatur tropft', status: 'In Arbeit', ton: 'info', datum: '24.09.', iso: '2026-09-24T10:00', zusatz: 'Termin 24.09., 10:00 Uhr', href: '/app/jobs' },
  { id: 'p9005', titel: 'Thermostate tauschen', status: 'Abgeschlossen', ton: 'ok', datum: '18.09.', iso: '2026-09-18', href: '/app/jobs', vergangen: true },
  { id: 'p9006', titel: 'Dachrinne reinigen', status: 'Abgeschlossen', ton: 'ok', datum: '12.09.', iso: '2026-09-12', href: '/app/jobs', vergangen: true },
  { id: 'p9008', titel: 'Rasen mähen', status: 'Abgeschlossen', ton: 'ok', datum: '05.09.', iso: '2026-09-05', href: '/app/jobs', vergangen: true },
  { id: 'p9009', titel: 'Heizung entlüften', status: 'Abgeschlossen', ton: 'ok', datum: '28.08.', iso: '2026-08-28', href: '/app/jobs', vergangen: true },
  { id: 'p9010', titel: 'Kaminkehrer-Termin', status: 'Abgebrochen', ton: 'neutral', datum: '20.08.', iso: '2026-08-20', href: '/app/jobs', vergangen: true },
  { id: 'p9011', titel: 'Heizkörper tauschen', status: 'Abgeschlossen', ton: 'ok', datum: '02.08.', iso: '2026-08-02', href: '/app/jobs', vergangen: true }
];

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
              <Link key={compare.label} href={compare.href} className="eh-werkbank-chip" data-hue={compare.hue}>
                <compare.icon size={16} aria-hidden="true" />
                {compare.label}
              </Link>
            ))}
          </nav>
        </CompareRail>
      </EHOwnerSection>

      <EHOwnerSection title="Haus-Historie" action={{ href: '/app/jobs', label: 'Alle Vorgänge' }}>
        <VerlaufZeitleiste eintraege={VERLAUF} fuss="Nächster Termin: 26.09., 14:30 Uhr · Heizungswartung" />
      </EHOwnerSection>

      <EHOwnerSection title="Vorschläge für dich" action={{ href: '/app/contracts', label: 'Alle Verträge' }}>
        <SuggestionSlider />
      </EHOwnerSection>
      </div>
    </WerkbankRahmen>
  );
}
