import Link from 'next/link';
import { Camera, FileUp, PenLine } from 'lucide-react';

/**
 * Weg-Waehler fuer "Vertrag hinzufuegen" (Betreiber 24.09.): erst aussuchen,
 * WIE man den Vertrag reinschickt — Dokument hochladen (KI-Analyse), schnell
 * abfotografieren (Handy-Kamera) oder selbst eintragen. Drei grosse Karten,
 * keine Auswahllisten-Archaeologie: die Karten SIND die Buttons.
 * `base` erlaubt echte Seite und Schaufenster mit derselben Optik.
 */
export function VertraegeAnlegeWege({ base }: { base: string }) {
  const WEGE = [
    {
      id: 'hochladen', icon: FileUp, badge: 'Empfohlen',
      title: 'Dokument hochladen',
      text: 'PDF oder Foto der Rechnung genügt. Die KI liest Anbieter, Frist und Titel aus dem Beleg — du trägst danach nur noch den Monatsbetrag nach.',
    },
    {
      id: 'scannen', icon: Camera, badge: 'Unterwegs',
      title: 'Schnell abfotografieren',
      text: 'Auf dem Handy: Vertrag auf den Tisch, Kamera an, ein Foto. Wir erkennen das Dokument und legen es in deine Hausakte.',
    },
    {
      id: 'manuell', icon: PenLine, badge: null,
      title: 'Selbst eintragen',
      text: 'Zwei Felder, fertig: Anbieter und Betrag. Laufzeit und Frist kannst du später ergänzen — wir rechnen sie vor.',
    },
  ] as const;
  return (
    <nav className="eh-anlege-wege" aria-label="Weg zum Vertrag auswählen">
      {WEGE.map((weg) => (
        <Link key={weg.id} href={`${base}?weg=${weg.id}`} className="eh-anlege-weg" {...(weg.badge === 'Empfohlen' ? { 'data-hervor': 'true' } : {})}>
          {weg.badge && <em className="eh-anlege-weg-badge">{weg.badge}</em>}
          <span className="eh-anlege-weg-ic" aria-hidden="true"><weg.icon size={22} /></span>
          <strong>{weg.title}</strong>
          <small>{weg.text}</small>
          <span className="eh-anlege-weg-go" aria-hidden="true">Auswählen →</span>
        </Link>
      ))}
    </nav>
  );
}
