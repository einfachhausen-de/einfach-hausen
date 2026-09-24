import type { Metadata } from 'next';
import { breadcrumbJsonLd, canonical } from '@/lib/seo';
import { ProductStoryPage } from '@/components/marketing/product-story-page';

export const metadata: Metadata = { title: 'Versicherungsunterstützung für dein Eigenheim', description: 'Schadenfälle zu bestehenden Aufträgen strukturiert dokumentieren und intern koordinieren — ohne automatische Meldung an den Versicherer.', alternates: { canonical: canonical('/versicherung') } };

export default function Page() {
  const story = {
    eyebrow: 'Versicherung',
    title: 'Schadenfall sauber vorbereiten. Nichts wird automatisch versendet.',
    text: 'Bei einem bereits angenommenen Auftrag kannst du einen internen Servicefall an Einfach Hausen übergeben. Unterlagen und Ausführung bleiben im Auftragskontext nachvollziehbar.',
    primaryHref: '/register?role=homeowner', primaryLabel: 'Hauskonto starten',
    mood: 'careful',
    proofLabel: 'Was der Servicefall leistet',
    alert: {
      title: 'Nichts geht automatisch an den Versicherer',
      text: 'Der Servicefall bleibt intern am Auftrag. Eine Meldung an deine Versicherung entsteht nicht von selbst.',
    },
    proofTitle: 'Dokumentation vor Aktionismus.', proofText: 'Die Funktion hilft beim Ordnen und Koordinieren — sie ist keine automatische Schadenmeldung an deine Versicherung.',
    image: {
      src: '/images/site/story-versicherung.png',
      alt: 'Geschlossene Mappe und unleserliche Unterlagen auf einem Holztisch',
      title: 'Unterlagen bleiben am Auftrag.',
      text: 'Fotos, Notizen und der bisherige Verlauf liegen im selben Vorgang. Nichts davon wird automatisch an einen Versicherer geschickt.',
    },
    related: [
      { href: '/hausakte', title: 'Hausakte', text: 'Aufträge, Rechnungen und Nachweise an einem Ort.' },
      { href: '/sicherheit', title: 'Sicherheit', text: 'Was mit deinen Unterlagen passiert und was nicht.' },
      { href: '/notfall', title: 'Akuter Schaden', text: 'Wenn zuerst Hilfe gebraucht wird, nicht die Ablage.' },
    ],
    points: ['Servicefall bleibt mit dem konkreten Auftrag verbunden', 'Vorhandene Auftrags- und Partnerdaten geben Kontext', 'Keine automatische Kontaktaufnahme mit einem Versicherer'],
    steps: [{ title: 'Bestehenden Auftrag öffnen', text: 'Versicherungsunterstützung hängt an einem eigenen, bereits angenommenen Auftrag.' }, { title: 'Klärungsbedarf beschreiben', text: 'Du beschreibst, welche Dokumentation oder Abstimmung für den Schadenfall benötigt wird.' }, { title: 'Intern koordinieren', text: 'Einfach Hausen und der zuständige Partner sehen den Servicefall im bestehenden Auftragskontext.' }],
    limits: ['Es wird nicht automatisch ein Versicherer angeschrieben.', 'Es entsteht dadurch kein neuer Handwerkerauftrag.', 'Die Funktion ersetzt keine Deckungsprüfung, Schadenregulierung oder Rechtsberatung durch einen Versicherer.'],
    faq: [{ q: 'Meldet Einfach Hausen den Schaden automatisch?', a: 'Nein. Der Servicefall wird intern dokumentiert und koordiniert; eine Versicherungsanfrage wird nicht automatisch versendet.' }, { q: 'Kann ich jeden beliebigen Schaden anlegen?', a: 'Der aktuelle Produktweg ist bewusst an einen eigenen bereits angenommenen Auftrag gebunden.' }],
    ctaTitle: 'Hausvorgänge nachvollziehbar dokumentieren.', ctaText: 'Mit dem kostenlosen Hauskonto bleiben Aufträge, Unterlagen und spätere Servicefälle in einem Zusammenhang.',
  } as const;
  const breadcrumb = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Versicherung', path: '/versicherung' }])) }} />;
  return <ProductStoryPage story={story} breadcrumb={breadcrumb} />;
}
