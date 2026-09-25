import type { Metadata } from 'next';
import { breadcrumbJsonLd, canonical } from '@/lib/seo';
import { ProductStoryPage } from '@/components/marketing/product-story-page';

export const metadata: Metadata = { title: 'Immobilienbewertung & Verkauf organisieren', description: 'Bewertung dokumentieren, passende Maklerprofile vergleichen und Kontaktdaten erst nach ausdrücklicher Freigabe teilen.', alternates: { canonical: canonical('/immobilienverkauf') } };

export default function Page() {
  const story = {
    eyebrow: 'Immobilienverkauf',
    title: 'Bewerten, passende Makler finden, Daten bewusst freigeben.',
    text: 'Dein Haus bleibt der zentrale Datensatz. Bewertung, Verkaufsinteresse und Makler-Matching werden nachvollziehbar organisiert, ohne private Hausdaten automatisch offenzulegen.',
    primaryHref: '/register?role=homeowner', primaryLabel: 'Hauskonto starten',
    mood: 'value',
    proofLabel: 'Was du behältst',
    alert: {
      title: 'Daten bleiben bei dir, bis du freigibst',
      text: 'Kontaktdaten und die Objektzusammenfassung werden erst nach ausdrücklicher Freigabe sichtbar.',
    },
    proofTitle: 'Verkaufsprozess mit Datenkontrolle.', proofText: 'Makler werden anhand aktiver Suchprofile mit Objektmerkmalen abgeglichen. Kontaktdaten und Objektzusammenfassung werden erst nach ausdrücklicher Freigabe sichtbar.',
    image: {
      src: '/images/site/story-immobilie.png',
      alt: 'Modernes Einfamilienhaus ohne Schild, Hausnummer oder Kennzeichen',
      title: 'Das Haus bleibt der Datensatz. Die Freigabe bleibt deine.',
      text: 'Bewertung und Makler-Suche laufen nachvollziehbar. Private Nachrichten, Rechnungen und die vollständige Hausakte bleiben außerhalb der Verkaufsfreigabe.',
    },
    related: [
      { href: '/hausakte', title: 'Hausakte', text: 'Der Bestand, aus dem eine Bewertung überhaupt sinnvoll wird.' },
      { href: '/so-funktionierts', title: 'So funktioniert’s', text: 'Nichts wird weitergegeben, bevor du es freigibst.' },
      { href: '/sicherheit', title: 'Sicherheit', text: 'Welche Daten ein Makler sehen kann und welche nicht.' },
    ],
    points: ['Bewertungsanfragen und vorhandene Einschätzungen bleiben getrennt dokumentiert', 'Makler-Matching berücksichtigt Suchgebiet, Immobilientyp, Nutzung, Flächen und Preisprofil', 'Private Nachrichten, Zahlungen, Rechnungen, Versicherungen und vollständige Dokumente bleiben außerhalb der Verkaufsfreigabe'],
    steps: [{ title: 'Bewertung dokumentieren', text: 'Eine neue Bewertung kann angefragt oder eine bereits vorhandene Wertspanne nachvollziehbar gespeichert werden.' }, { title: 'Verkaufsinteresse starten', text: 'Das System sucht nach passenden aktiven, geprüften Maklerprofilen.' }, { title: 'Freigabe bewusst erteilen', text: 'Erst du gibst Kontaktdaten und Objektzusammenfassung zweckgebunden für die Verkaufsanbahnung frei.' }],
    limits: ['Eine angefragte Bewertung ist noch kein automatisch berechneter Marktwert.', 'Ohne passenden aktiven Makler-Treffer werden keine Kontaktdaten freigegeben.', 'Eine Freigabe ist zweckgebunden und kann im Produkt widerrufen werden.'],
    faq: [{ q: 'Werden meine Hausdokumente automatisch an Makler gegeben?', a: 'Nein. Der Verkaufsprozess gibt nicht automatisch private Nachrichten, Zahlungen, Rechnungen, Versicherungen oder vollständige Hausdokumente frei.' }, { q: 'Ist eine Bewertungsanfrage schon eine verbindliche Bewertung?', a: 'Nein. Anfrage und vorhandene konkrete Wertspanne werden bewusst als unterschiedliche Zustände geführt.' }],
    ctaTitle: 'Dein Haus verkaufen, ohne die Datenkontrolle abzugeben.', ctaText: 'Starte mit deinem Hauskonto. Bewertung und Maklerprozess bleiben nachvollziehbar und unter deiner Freigabe.',
  } as const;
  const breadcrumb = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Immobilienverkauf', path: '/immobilienverkauf' }])) }} />;
  return <ProductStoryPage story={story} breadcrumb={breadcrumb} />;
}
