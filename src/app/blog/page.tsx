import type { Metadata } from 'next';
import { breadcrumbJsonLd, canonical, ogBlock } from '@/lib/seo';
import { BLOG_POSTS } from '@/lib/seo-cluster';
import { MarketingShell } from '@/components/marketing/site-shell';
import { EHScope, EHSection, EHPageHero, EHServiceIndex, EHClosing, EHButton, EHEyebrow, EHHeading } from '@/design-system';

export const metadata: Metadata = {
  title: 'Ratgeber rund ums Eigenheim',
  description: 'Praxisnahe Ratgeber: Heizungswartung, Bad-Sanierung, Schimmel. Problem, Optionen, Kostenrahmen, Entscheidung.',
  alternates: { canonical: canonical('/blog') },
  openGraph: ogBlock({ url: '/blog', title: 'Ratgeber rund ums Eigenheim', description: 'Praxisnahe Ratgeber: Heizungswartung, Bad-Sanierung, Schimmel. Problem, Optionen, Kostenrahmen, Entscheidung.', motiv: 'blog' }),
};

export default function Page() {
  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Ratgeber', path: '/blog' }])) }} />
      <EHScope>
      <EHPageHero
        eyebrow="Ratgeber"
        title="Verstehen, einordnen, dann entscheiden."
        text="Praxisnahe Orientierung für Eigentümer: Problem, Optionen, Kostenrahmen und klare Entscheidungswege ohne Fachchinesisch."
        actions={<><EHButton href="/leistungen/heizung" arrow>Heizung im Überblick</EHButton><EHButton href="/lexikon" variant="secondary">Zum Fachlexikon</EHButton></>}
      />
      <EHSection compact>
        <EHEyebrow>Wissenssammlung</EHEyebrow>
        <EHHeading>Aktuelle Ratgeber &amp; Leitfäden</EHHeading>
        <EHServiceIndex items={BLOG_POSTS.map((p) => ({ title: p.title, text: p.description, href: `/blog/${p.slug}`, label: 'Ratgeber-Artikel' }))} />
      </EHSection>
      <EHClosing title="Dein Vorhaben ist konkreter als ein Ratgeber?" text="Beschreib dein Anliegen in eigenen Worten. Wir finden passende Meisterbetriebe und ermitteln den genauen Kostenrahmen." href="/register?role=homeowner" label="Hauskonto kostenlos anlegen" secondary={<EHButton href="/#anliegen" variant="secondary">Anliegen starten</EHButton>} />
      </EHScope>
    </MarketingShell>
  );
}
