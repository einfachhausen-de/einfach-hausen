import type { Metadata } from 'next';
import { breadcrumbJsonLd, canonical } from '@/lib/seo';
import { ProductStoryPage } from '@/components/marketing/product-story-page';

export const metadata: Metadata = { title: 'Beratung: erst einen Fachmann fragen', description: 'Einen passenden geprüften Ansprechpartner finden, ohne automatisch einen Auftrag oder Preis auszulösen.', alternates: { canonical: canonical('/beratung') } };

export default function Page() {
  const story = {
    eyebrow: 'Beratung',
    title: 'Erst einen Fachmann fragen. Noch kein Auftrag.',
    text: 'Du schilderst dein Thema und kannst einen passenden geprüften Ansprechpartner aus deiner Region finden. Daraus entsteht noch kein Auftrag und kein Preis.',
    primaryHref: '/register?role=homeowner', primaryLabel: 'Beratung starten',
    mood: 'calm',
    proofTitle: 'Persönlicher Kontakt, ohne Buchungszwang.', proofText: 'Beratung ist im Produkt bewusst von einer Beauftragung getrennt.',
    image: {
      src: '/images/site/story-beratung.png',
      alt: 'Person von hinten am Laptop im Wohnzimmer, Bildschirm ohne lesbaren Inhalt',
      title: 'Erst verstehen. Noch nichts beauftragen.',
      text: 'Du schilderst das Thema in deinen Worten. Ein passender Ansprechpartner kann sich melden. Daraus wird kein Auftrag, solange du ihn nicht ausdrücklich startest.',
    },
    related: [
      { href: '/notfall', title: 'Es ist dringend', text: 'Wenn es nicht warten kann, ist der Notfallweg der richtige Einstieg — kein Beratungsgespräch.' },
      { href: '/so-funktionierts', title: 'So funktioniert’s', text: 'Frage, Gespräch oder Auftrag: du entscheidest den nächsten Schritt.' },
      { href: '/leistungen', title: 'Leistungen', text: 'Wenn du schon weißt, welcher Bereich betroffen ist.' },
    ],
    points: ['Konkreter Ansprechpartner statt anonymer Lead-Verteilung', 'Foto oder Video kann am privaten Vorgang ergänzt werden', 'Aus demselben Thema kann später bewusst ein Auftrag werden'],
    steps: [{ title: 'Thema beschreiben', text: 'Sag, wobei du fachlichen Rat brauchst.' }, { title: 'Ansprechpartner finden', text: 'Ein passender geprüfter Partner kann die Kontaktanfrage übernehmen.' }, { title: 'Danach frei entscheiden', text: 'Du kannst nur sprechen oder später separat einen Auftrag organisieren.' }],
    limits: ['Keine automatische Beauftragung und kein automatischer Preis.', 'Verfügbarkeit hängt von Thema, Region und aktiven Partnern ab.', 'Bei akuter Gefahr ist Beratung nicht der richtige Einstieg; nutze den öffentlichen Notruf bzw. den Notfallweg.'],
    faq: [{ q: 'Muss ich danach etwas buchen?', a: 'Nein. Beratung und Auftrag sind getrennte Entscheidungen.' }, { q: 'Kann daraus später ein Auftrag werden?', a: 'Ja. Derselbe Kontakt kann später aus dem Thema einen Auftrag machen, wenn du das ausdrücklich möchtest.' }],
    ctaTitle: 'Du brauchst erst eine fachliche Einschätzung?', ctaText: 'Starte kostenlos mit deinem Hauskonto und entscheide erst nach dem Gespräch über weitere Schritte.',
  } as const;
  const breadcrumb = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Beratung', path: '/beratung' }])) }} />;
  return <ProductStoryPage story={story} breadcrumb={breadcrumb} />;
}
