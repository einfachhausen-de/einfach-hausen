import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Container, SectionHeading } from '../ui';

const FAQ = [
  {
    q: 'Kostet mich Einfach Hausen wirklich nichts?',
    a: 'Ja. Das Hauskonto mit allen Funktionen ist für Eigentümer dauerhaft kostenlos. Handwerkerleistungen bezahlst du direkt an den Betrieb – zu dem Preis, den du vorher freigegeben hast. Wir nehmen keine Provision.',
  },
  {
    q: 'Wie funktioniert der Tarifwechsel?',
    a: 'Du lädst deinen aktuellen Vertrag oder deine Abrechnung hoch. Wir vergleichen und zeigen dir günstigere Tarife. Wenn du dich für einen entscheidest, übernehmen wir den Wechsel inklusive Kündigung beim alten Anbieter. Ohne deine Bestätigung passiert nichts.',
  },
  {
    q: 'Wer sind die Handwerker?',
    a: 'Eigenständige Betriebe aus deiner Region, die wir persönlich prüfen: Gewerbe, Qualifikationen, Versicherung und Referenzen. Deine Anfrage wird nicht an fünf Betriebe verkauft – du bekommst einen passenden Partner mit Name, Gesicht und Telefonnummer.',
  },
  {
    q: 'Was kann der KI-Hausmanager?',
    a: 'Er beantwortet Fragen rund um dein Haus, erklärt Rechnungen und Angebote, erkennt Fristen in Dokumenten, erinnert dich an Wartungen und bereitet Handwerker-Anfragen vor. Entscheidungen triffst immer du.',
  },
  {
    q: 'Was passiert mit meinen Daten?',
    a: 'Sie bleiben bei dir. Wir hosten in der EU, verkaufen keine Daten und geben Informationen nur an den Betrieb oder Anbieter weiter, den du ausdrücklich bestätigst.',
  },
  {
    q: 'Gibt es Einfach Hausen schon in meiner Region?',
    a: 'Tarifvergleich, Hausakte und KI-Hausmanager sind nicht an eine Region gebunden. Das Handwerker-Netz bauen wir Region für Region aus – leg dein Konto an und du siehst sofort, was bei dir schon geht.',
  },
] as const;

export function HomeFaq() {
  return (
    <section className="bg-cream py-20 lg:py-28">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col gap-6">
          <SectionHeading eyebrow="Häufige Fragen" title="Noch Fragen? Hier sind die Antworten." />
          <p className="text-body">
            Mehr findest du in der{' '}
            <Link href="/hilfe" className="font-semibold text-brand underline underline-offset-4">
              Hilfe
            </Link>{' '}
            oder du{' '}
            <Link href="/kontakt" className="font-semibold text-brand underline underline-offset-4">
              schreibst uns
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-2xl bg-white p-6 open:shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold text-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream transition-transform group-open:rotate-45">
                  <Plus className="size-4" aria-hidden="true" />
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-body">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
