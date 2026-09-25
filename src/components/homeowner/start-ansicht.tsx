import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BatteryCharging,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  FileText,
  Flame,
  HousePlug,
  ListChecks,
  MessageCircle,
  PiggyBank,
  Plus,
  ShieldCheck,
  Smartphone,
  Sun,
  Thermometer,
  Truck,
  Users,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react';
import { EHOwnerSection } from '@/design-system';
import { CompareRail } from '@/components/homeowner/compare-rail';
import { VerlaufZeitleiste, type VerlaufEintrag } from '@/components/homeowner/verlauf-zeitleiste';
import styles from '@/app/app/eigentuemer-start.module.css';

/**
 * Startseite der Eigentümer-App – eine Komposition für /app und die Vorschau
 * /app/preview. Reihenfolge nach Dringlichkeit: Gruß und Haus → genau ein
 * nächster Schritt → drei Wege → was läuft (Haus-Historie) → wo sich etwas
 * lohnt (Vorschläge, Vergleiche). Die Seiten liefern ausschließlich Daten.
 */

const klassen = (...namen: (string | false | undefined)[]) => namen.filter(Boolean).join(' ');

const schrift = {
  titel: 'text-[length:var(--eh-font-body)] font-semibold leading-[var(--eh-leading-tight)] text-ink',
  lese: 'text-[length:var(--eh-font-label)] leading-[var(--eh-leading-normal)] text-body',
  aktion: 'inline-flex items-center gap-1 text-[length:var(--eh-font-label)] font-semibold text-brand',
} as const;

export function StartKopf({ gruss, adresse }: { gruss: string; adresse: string }) {
  return (
    <header className="eh-werkbank-kopf">
      <div className="eh-werkbank-kopf-copy">
        <span data-gruss>{gruss}</span>
        <h1>{adresse || 'Mein Zuhause'}</h1>
      </div>
      <div className="eh-werkbank-kopf-tools" data-nur-desktop>
        <Link href="/app/hausmeister" className="eh-werkbank-kopf-cta">
          <Plus size={18} aria-hidden="true" />
          Neues Anliegen
        </Link>
      </div>
    </header>
  );
}

/** Genau ein nächster Schritt, in fester Rangfolge von den Seiten bestimmt. */
export type StartFokus =
  | { art: 'entscheidung'; anzahl: number; href: string }
  | { art: 'einrichtung' }
  | { art: 'termin'; titel: string; wann: string; href: string }
  | { art: 'sparen'; betrag: string; hinweis: string; href: string }
  | { art: 'ruhe' };

type FokusInhalt = { href: string; dunkel: boolean; zahl?: string; symbol: LucideIcon; titel: string; text: string };

function fokusInhalt(fokus: StartFokus): FokusInhalt {
  switch (fokus.art) {
    case 'entscheidung':
      return {
        href: fokus.href,
        dunkel: true,
        zahl: String(fokus.anzahl),
        symbol: FileText,
        titel: fokus.anzahl === 1 ? 'Angebot wartet auf deine Entscheidung' : 'Angebote warten auf deine Entscheidung',
        text: 'Vergleichen und freigeben. Kein Auftrag ohne deine Freigabe.',
      };
    case 'einrichtung':
      return {
        href: '/app/onboarding',
        dunkel: false,
        symbol: ListChecks,
        titel: 'Einrichtung abschließen',
        text: 'Ergänze die Angaben zu deinem Zuhause, damit wir passende Betriebe finden.',
      };
    case 'termin':
      return { href: fokus.href, dunkel: false, symbol: CalendarClock, titel: `Nächster Termin: ${fokus.titel}`, text: fokus.wann };
    case 'sparen':
      return { href: fokus.href, dunkel: true, symbol: PiggyBank, titel: `Bis zu ${fokus.betrag} im Jahr sparen`, text: fokus.hinweis };
    case 'ruhe':
      return {
        href: '/app/hausmeister',
        dunkel: false,
        symbol: CircleCheck,
        titel: 'Alles im Griff',
        text: 'Gerade wartet nichts auf dich. Neues Anliegen? Hier starten.',
      };
  }
}

export function StartFokusKarte({ fokus }: { fokus: StartFokus }) {
  const inhalt = fokusInhalt(fokus);
  const Symbol = inhalt.symbol;
  return (
    <Link href={inhalt.href} className="eh-werkbank-fokus" data-ruhig={inhalt.dunkel ? undefined : true}>
      {inhalt.zahl ? (
        <span className="eh-werkbank-fokus-zahl">{inhalt.zahl}</span>
      ) : (
        <span className="eh-werkbank-fokus-symbol" aria-hidden="true">
          <Symbol size={24} />
        </span>
      )}
      <span className="eh-werkbank-fokus-text">
        <strong>{inhalt.titel}</strong>
        <span>{inhalt.text}</span>
      </span>
      <span className="eh-werkbank-fokus-pfeil" aria-hidden="true">
        <ChevronRight size={20} />
      </span>
    </Link>
  );
}

const AKTIONEN = [
  {
    href: '/app/hausmeister',
    icon: Wrench,
    titel: 'Handwerker finden',
    text: 'Reparatur, Wartung oder Umbau – Anliegen beschreiben und passenden Betrieb finden.',
    weiter: 'Anliegen beschreiben',
    primaer: true,
  },
  {
    href: '/app/consultation',
    icon: MessageCircle,
    titel: 'Beratung starten',
    text: 'Eine Frage zu deinem Zuhause klären – mit Hausmanager oder Fachberatung.',
    weiter: 'Frage stellen',
    primaer: false,
  },
  {
    href: '/app/contracts#vergleiche',
    icon: BarChart3,
    titel: 'Tarife vergleichen',
    text: 'Strom, Gas, Internet oder Versicherung prüfen und laufende Kosten senken.',
    weiter: 'Vergleich öffnen',
    primaer: false,
  },
] as const;

export function StartSchnellaktionen() {
  return (
    <section className={styles.quickSection} aria-labelledby="start-schnellaktionen">
      <p id="start-schnellaktionen" className={styles.quickLabel}>Schnellaktionen</p>
      <div className={klassen(styles.quickGrid, styles.quickGridThree, 'eh-quick-grid')}>
        {AKTIONEN.map((aktion) => (
          <Link
            key={aktion.href}
            href={aktion.href}
            className={klassen(styles.quickCard, aktion.primaer && styles.quickCardPrimary, 'eh-quick-card', aktion.primaer && 'eh-quick-primary')}
          >
            <span className={styles.quickIcon}>
              <aktion.icon size={20} aria-hidden="true" />
            </span>
            <strong>{aktion.titel}</strong>
            <small>{aktion.text}</small>
            <span className={styles.quickCardArrow}>
              <span className="eh-quick-pfeiltext">{aktion.weiter}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export type StartVorschlag = {
  id: string;
  titel: string;
  text: string;
  weiter: string;
  href: string;
  symbol: 'wartung' | 'sperrmuell' | 'versicherung' | 'sparen';
};

const VORSCHLAG_SYMBOLE: Record<StartVorschlag['symbol'], LucideIcon> = {
  wartung: CalendarCheck,
  sperrmuell: Truck,
  versicherung: ShieldCheck,
  sparen: PiggyBank,
};

export const START_VORSCHLAEGE: readonly StartVorschlag[] = [
  {
    id: 'wartung',
    titel: 'Wartungs-Check',
    text: 'Heizung, Lüftung und Dachrinne vor der kalten Jahreszeit prüfen – fällige Termine stehen in deinem Jahresplan.',
    weiter: 'Zum Jahresplan',
    href: '/app/year',
    symbol: 'wartung',
  },
  {
    id: 'versicherung',
    titel: 'Versicherungs-Check',
    text: 'Hausrat, Haftpflicht und Gebäude gegenprüfen – Lücken finden und doppelte Beiträge vermeiden.',
    weiter: 'Verträge vergleichen',
    href: '/app/contracts#vergleiche',
    symbol: 'versicherung',
  },
  {
    id: 'sperrmuell',
    titel: 'Sperrmüll',
    text: 'Großes und Sperriges loswerden: Anliegen schildern, Termin und Abstellort stimmen wir mit dem Betrieb ab.',
    weiter: 'Sperrmüll anmelden',
    href: '/app/hausmeister',
    symbol: 'sperrmuell',
  },
];

/** Alle Vorschläge auf einen Blick statt eines selbstlaufenden Karussells. */
export function StartVorschlaege({ eintraege }: { eintraege: readonly StartVorschlag[] }) {
  return (
    <ul className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-white" aria-label="Vorschläge für dich">
      {eintraege.map((vorschlag) => {
        const Symbol = VORSCHLAG_SYMBOLE[vorschlag.symbol];
        return (
          <li key={vorschlag.id} className="border-t border-hairline first:border-t-0">
            <Link
              href={vorschlag.href}
              className="flex items-start gap-4 p-4 transition-colors hover:bg-cream focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-coral motion-reduce:transition-none sm:items-center"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand" aria-hidden="true">
                <Symbol size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className={schrift.titel}>{vorschlag.titel}</span>
                <span className={schrift.lese}>{vorschlag.text}</span>
                <span className={klassen(schrift.aktion, 'pt-1 sm:hidden')}>
                  {vorschlag.weiter}
                  <ChevronRight size={16} aria-hidden="true" />
                </span>
              </span>
              <span className={klassen(schrift.aktion, 'hidden shrink-0 sm:inline-flex')}>
                {vorschlag.weiter}
                <ChevronRight size={16} aria-hidden="true" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const VERGLEICHE = [
  { href: '/app/contracts#vergleich-strom', label: 'Strom', icon: Zap, hue: 'sonne' },
  { href: '/app/contracts#vergleich-gas', label: 'Gas', icon: Flame, hue: 'himmel' },
  { href: '/app/contracts#vergleich-dsl', label: 'Internet', icon: Wifi, hue: 'veilchen' },
  { href: '/app/contracts#vergleich-versicherung', label: 'Versicherung', icon: ShieldCheck, hue: 'stahl' },
  { href: '/app/contracts#vergleich-mobilfunk', label: 'Mobilfunk', icon: Smartphone, hue: 'rose' },
  { href: '/app/contracts#vergleiche', label: 'Photovoltaik', icon: Sun, hue: 'sand' },
  { href: '/app/contracts#vergleiche', label: 'Heizung', icon: Thermometer, hue: 'terra' },
  { href: '/app/contracts#vergleiche', label: 'Smart Home', icon: HousePlug, hue: 'blatt' },
  { href: '/app/contracts#vergleiche', label: 'Wallbox', icon: BatteryCharging, hue: 'petrol' },
] as const;

export function StartVergleiche() {
  return (
    <CompareRail label="Verträge und Vergleiche">
      <nav className="eh-werkbank-chips" aria-label="Verträge und Vergleiche">
        {VERGLEICHE.map((vergleich) => (
          <Link key={vergleich.label} href={vergleich.href} className="eh-werkbank-chip" data-hue={vergleich.hue}>
            <vergleich.icon size={16} aria-hidden="true" />
            {vergleich.label}
          </Link>
        ))}
      </nav>
    </CompareRail>
  );
}

export type StartKennzahlen = { auftraege: number; angebote: number; kontakte: number; termine: number };

/** Rechte Spalte: dieselben echten Zahlen wie Menüleiste und Fokus, als ruhige Übersicht. */
export function StartRail({ werte }: { werte: StartKennzahlen }) {
  const zeilen = [
    { href: '/app/jobs', label: 'Laufende Aufträge', wert: werte.auftraege, icon: Wrench, hinweis: false },
    { href: '/app/jobs', label: 'Offene Angebote', wert: werte.angebote, icon: FileText, hinweis: werte.angebote > 0 },
    { href: '/app/messages', label: 'Ansprechpartner', wert: werte.kontakte, icon: Users, hinweis: false },
    { href: '/app/calendar', label: 'Anstehende Termine', wert: werte.termine, icon: CalendarDays, hinweis: werte.termine > 0 },
  ];
  return (
    <>
      <p className="eh-werkbank-rail-h">Mein Zuhause im Überblick</p>
      <div className="eh-rail-stats">
        {zeilen.map((zeile) => (
          <Link key={zeile.label} href={zeile.href} className={styles.railStat}>
            <span className={styles.railStatIcon} aria-hidden="true">
              <zeile.icon size={15} />
            </span>
            <span className={styles.railStatLabel}>{zeile.label}</span>
            <strong className={styles.railStatValue} data-tone={zeile.hinweis ? 'terra' : undefined}>{zeile.wert}</strong>
          </Link>
        ))}
      </div>
    </>
  );
}

export function StartAnsicht({
  gruss,
  adresse,
  fokus,
  verlauf,
  stand,
  vorschlaege,
  vergleicheHref = '/app/angebote',
}: {
  gruss: string;
  adresse: string;
  fokus: StartFokus;
  verlauf: readonly VerlaufEintrag[];
  stand?: string;
  vorschlaege: readonly StartVorschlag[];
  vergleicheHref?: string;
}) {
  return (
    <>
      <StartKopf gruss={gruss} adresse={adresse} />
      <StartFokusKarte fokus={fokus} />
      <div className={styles.sections}>
        <StartSchnellaktionen />
        <EHOwnerSection title="Haus-Historie" action={{ href: '/app/jobs', label: 'Alle Vorgänge' }}>
          <VerlaufZeitleiste eintraege={verlauf} stand={stand} />
        </EHOwnerSection>
        {vorschlaege.length > 0 && (
          <EHOwnerSection title="Vorschläge für dich">
            <StartVorschlaege eintraege={vorschlaege} />
          </EHOwnerSection>
        )}
        <EHOwnerSection title="Verträge & Vergleiche" action={{ href: vergleicheHref, label: 'Alle ansehen' }}>
          <StartVergleiche />
        </EHOwnerSection>
      </div>
    </>
  );
}
