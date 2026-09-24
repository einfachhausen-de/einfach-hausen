import type { Metadata } from 'next';
import { breadcrumbJsonLd, canonical } from '@/lib/seo';
import { ProductStoryPage } from '@/components/marketing/product-story-page';

export const metadata: Metadata = { title: 'Notfall: verfügbare Hilfe in deiner Nähe suchen', description: 'Dringende Fälle einordnen und nach qualifizierten verfügbaren Helfern im regionalen Partnernetz suchen.', alternates: { canonical: canonical('/notfall') } };

export default function Page() {
  const story = {
    eyebrow: 'Notfall',
    title: 'Dringend? Wir suchen zuerst nach passender verfügbarer Hilfe.',
    text: 'Der Notfallweg berücksichtigt Nähe, Bereitschaft, Qualifikation, Bewertung und Reaktionsfähigkeit — nicht automatisch den teuersten 24/7-Notdienst.',
    primaryHref: '/register?role=homeowner', primaryLabel: 'Notfallweg öffnen',
    mood: 'urgent',
    proofLabel: 'So wird gesucht',
    alert: {
      title: 'Kein Ersatz für den Notruf',
      text: 'Bei Brand, Gasgeruch oder Gefahr für Leib und Leben sofort 112. Dieser Weg sucht verfügbare Hilfe im Partnernetz. Er garantiert sie nicht.',
    },
    proofTitle: 'Bereitschaft statt blindem Weiterleiten.', proofText: '24/7-Anbieter und lokale Partner mit hinterlegten Bereitschaftszeiten können im selben Netzwerk berücksichtigt werden.',
    image: {
      src: '/images/site/story-notfall.png',
      alt: 'Tropfende Rohrverbindung unter einer Spüle, ohne lesbare Marken',
      title: 'Ein Bild der Stelle reicht zum Einordnen.',
      text: 'Du musst das Gewerk nicht kennen. Nähe, Bereitschaft und Qualifikation entscheiden mit — nicht der höchste Notfallzuschlag. Bei Gefahr für Leib und Leben bleibt der Notruf der erste Schritt.',
    },
    related: [
      { href: '/beratung', title: 'Es kann warten', text: 'Wenn du erst eine fachliche Einschätzung brauchst, ist Beratung der ruhigere Weg.' },
      { href: '/hilfe', title: 'Hilfe & Grenzen', text: 'Was der Notfallweg leistet und wo er aufhört.' },
      { href: '/leistungen', title: 'Bereich schon klar', text: 'Heizung, Wasser, Dach oder Schloss direkt beschreiben.' },
    ],
    points: ['Nähe und aktuelle Bereitschaft fließen in die Suche ein', 'Qualifikation und Bewertung bleiben Teil des Matchings', 'Hinterlegte Notfallzuschläge werden nicht als Qualitätskriterium bevorzugt'],
    steps: [{ title: 'Notfallart wählen', text: 'Zum Beispiel Wasser, Heizung, Strom, Dach, Schloss oder Sanitär.' }, { title: 'Situation beschreiben', text: 'Ein kurzer Text hilft bei Dringlichkeit und fachlicher Einordnung.' }, { title: 'Verfügbare Hilfe suchen', text: 'Das System fragt passende Notfall-bereite Partner im regionalen Netzwerk an.' }],
    limits: ['Eine verfügbare Hilfe kann nicht garantiert werden.', 'Einfach Hausen ersetzt keinen öffentlichen Notruf.', 'Bei Brand, Gasgeruch oder akuter Gefahr für Leib und Leben wende dich sofort an die zuständigen Notrufstellen.'],
    faq: [{ q: 'Ist das ein garantierter 24/7-Notdienst?', a: 'Nein. Das System kann 24/7-Partner und lokale Bereitschaften berücksichtigen, garantiert aber keine Verfügbarkeit.' }, { q: 'Wird einfach der teuerste Notdienst gewählt?', a: 'Nein. Matching berücksichtigt unter anderem Entfernung, Qualifikation, Bewertung, Bereitschaft und Reaktionsfähigkeit.' }],
    ctaTitle: 'Ein dringender Fall an deinem Haus?', ctaText: 'Beschreib, was passiert ist. Wenn passende Hilfe im Netzwerk verfügbar ist, wird sie priorisiert gesucht.',
  } as const;
  const breadcrumb = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Notfall', path: '/notfall' }])) }} />;
  return <ProductStoryPage story={story} breadcrumb={breadcrumb} />;
}
