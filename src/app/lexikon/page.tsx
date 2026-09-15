import type { Metadata } from 'next';
import { breadcrumbJsonLd, canonical, ogImages, SITE_URL } from '@/lib/seo';
import { LEXIKON_EINTRAEGE, LEXIKON_KATEGORIEN, alleBuchstaben, eintraegeInKategorie } from '@/lib/lexikon';
import { MarketingShell } from '@/components/marketing/site-shell';
import { Steps } from '@/components/marketing/ui';
import { EHScope, EHSection, EHClosing, EHButton, EHEyebrow, EHHeading, EHText } from '@/design-system';
import { LexikonExplorer } from '@/components/marketing/lexikon/lexikon-explorer';
import { KategorieBento, toCardData } from '@/components/marketing/lexikon/lexikon-sections';

export const metadata: Metadata = {
  title: 'Lexikon: Fachbegriffe rund ums Haus, verständlich erklärt',
  description:
    'Wärmepumpe, Energieausweis, Rückstauklappe, Schimmelklasse: Definition, Kostenrahmen, Ablauf und Prüfpunkte für Eigentümer — sachlich und mit klarem nächsten Schritt.',
  alternates: { canonical: canonical('/lexikon') },
  openGraph: { type: 'website', title: 'Lexikon · Einfach Hausen', description: 'Fachbegriffe rund ums Haus, verständlich erklärt.', url: '/lexikon', images: ogImages('lexikon') },
};

// Feste, bewusst gemischte Auswahl für den Hero-Stapel: Pflicht, Empfehlung, Grundwissen.
const FEATURED = ['rueckstauklappe', 'waermepumpe', 'energieausweis'];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function Page() {
  const entries = LEXIKON_EINTRAEGE.map(toCardData);
  const categories = LEXIKON_KATEGORIEN.map((k) => ({ slug: k.slug, name: k.name, kurz: k.kurz, count: eintraegeInKategorie(k.slug).length }));
  const present = new Set(alleBuchstaben());
  const letters = ALPHABET.filter((l) => present.has(l) || ['A', 'E', 'F', 'H', 'I', 'J', 'L', 'R', 'S', 'T', 'U', 'V', 'W'].includes(l));

  const collection = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': `${SITE_URL}/lexikon#termset`,
    name: 'Einfach Hausen Lexikon',
    inLanguage: 'de',
    hasDefinedTerm: LEXIKON_EINTRAEGE.map((e) => ({
      '@type': 'DefinedTerm',
      name: e.begriff,
      description: e.kurz,
      url: canonical(`/lexikon/${e.slug}`),
      inDefinedTermSet: `${SITE_URL}/lexikon#termset`,
    })),
  };

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Lexikon', path: '/lexikon' }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collection) }} />

      <EHScope>
      <LexikonExplorer entries={entries} categories={categories} letters={letters} featured={FEATURED} />

      <EHSection compact>
        <EHEyebrow>Nach Bereich</EHEyebrow>
        <EHHeading>Sieben Bereiche, in denen Eigentümer Entscheidungen treffen.</EHHeading>
        <EHText size="lead">Jeder Bereich bündelt die Begriffe, die zusammengehören — und führt zur passenden Leistung, wenn aus Wissen ein Anliegen wird.</EHText>
        <KategorieBento reveal={false} />
      </EHSection>

      <EHSection compact>
        <EHEyebrow>So nutzt du das Lexikon</EHEyebrow>
        <EHHeading>Vom Begriff zur Entscheidung in drei Schritten.</EHHeading>
        <Steps
          items={[
            { title: 'Einordnen', text: 'Definition, Relevanz und Orientierungsstufen zeigen in 30 Sekunden, ob ein Begriff für dein Haus zählt.' },
            { title: 'Prüfpunkte abhaken', text: 'Jeder Eintrag hat eine Checkliste. Trifft mehr als ein Punkt zu, ist es kein Wissensthema mehr, sondern ein Anliegen.' },
            { title: 'Anliegen beschreiben', text: 'In eigenen Worten, ohne Fachbegriff. Einordnung, Partnerbetrieb und Kostenrahmen kommen von Einfach Hausen — entscheiden tust du.' },
          ]}
        />
      </EHSection>

      <EHClosing title="Begriff verstanden — und jetzt dein Fall." text="Beschreib dein Anliegen in eigenen Worten. Einordnung, geprüfte Partner aus deiner Region und Kostenrahmen kommen von uns. Kein Auftrag ohne deine Entscheidung." href="/register?role=homeowner" label="Hauskonto kostenlos anlegen" secondary={<EHButton href="/#anliegen" variant="secondary">Anliegen starten</EHButton>} />
      </EHScope>
    </MarketingShell>
  );
}
