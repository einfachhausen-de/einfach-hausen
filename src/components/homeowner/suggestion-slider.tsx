'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, ChevronLeft, ChevronRight, ShieldCheck, Truck } from 'lucide-react';
import { EHText } from '@/design-system';
import styles from '@/app/app/eigentuemer-start.module.css';

export type SuggestionIconKey = 'wartung' | 'sperrmuell' | 'versicherung';

export type Suggestion = {
  id: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  iconKey: SuggestionIconKey;
};

/**
 * Vorschläge für die Startseite der Eigentümer-App: genau eine Karte sichtbar,
 * alle fünf Sekunden der nächste Vorschlag. Nur Layout aus dem begleitenden
 * Modul; die Farbe der Karte kommt aus den Tokens (Papierfläche).
 */
export const DASHBOARD_SUGGESTIONS: Suggestion[] = [
  {
    id: 'wartung',
    title: 'Wartungs-Check',
    text: 'Heizung, Lüftung und Dachrinne vor der kalten Jahreszeit prüfen – fällige Termine siehst du in deinem Jahresplan.',
    cta: 'Zum Jahresplan',
    href: '/app/year',
    iconKey: 'wartung',
  },
  {
    id: 'sperrmuell',
    title: 'Sperrmüll',
    text: 'Großes und Sperriges loswerden: Anliegen schildern – wir stimmen Termin und Abstellort mit dem passenden Betrieb ab.',
    cta: 'Sperrmüll anmelden',
    href: '/app/hausmeister',
    iconKey: 'sperrmuell',
  },
  {
    id: 'versicherung',
    title: 'Versicherungs-Check',
    text: 'Hausrat, Haftpflicht und Gebäude gegenprüfen – Lücken finden und doppelte Beiträge rechtzeitig vermeiden.',
    cta: 'Verträge vergleichen',
    href: '/app/contracts#vergleiche',
    iconKey: 'versicherung',
  },
];

const ICONS: Record<SuggestionIconKey, typeof CalendarCheck> = {
  wartung: CalendarCheck,
  sperrmuell: Truck,
  versicherung: ShieldCheck,
};

const ROTATE_MS = 5000;

export function SuggestionSlider({ items = DASHBOARD_SUGGESTIONS }: { items?: Suggestion[] }) {
  const [index, setIndex] = useState(0);
  const count = items.length;
  const safeIndex = count > 0 ? index % count : 0;

  // Läuft immer automatisch weiter (5 s je Vorschlag); Punkte und Pfeile
  // greifen unabhängig davon ein. Keine Pause-Bedingung.
  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % count), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [count]);

  if (count === 0) return null;
  const item = items[safeIndex];
  const Icon = ICONS[item.iconKey] ?? CalendarCheck;

  return (
    <div>
      <article key={item.id} className={styles.suggestCard} aria-live="polite">
        <span className={styles.suggestIcon} aria-hidden="true"><Icon size={22} /></span>
        <div className={styles.suggestBody}>
          <strong>{item.title}</strong>
          <EHText size="meta">{item.text}</EHText>
          <Link className={styles.suggestCta} href={item.href}>
            {item.cta}
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </article>

      <div className={styles.suggestControls}>
        <div className={styles.suggestDots}>
          {items.map((entry, i) => (
            <button
              key={entry.id}
              type="button"
              className={styles.suggestDot}
              aria-current={i === safeIndex ? 'page' : undefined}
              aria-label={`Vorschlag ${i + 1} von ${count}: ${entry.title}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <button
          type="button"
          className={styles.suggestNav}
          aria-label="Vorheriger Vorschlag"
          onClick={() => setIndex((safeIndex - 1 + count) % count)}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.suggestNav}
          aria-label="Nächster Vorschlag"
          onClick={() => setIndex((safeIndex + 1) % count)}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
