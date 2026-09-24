import type { Metadata } from 'next';
import { Compass, ListChecks, Scale } from 'lucide-react';
import { breadcrumbJsonLd, canonical, ogBlock } from '@/lib/seo';
import { BLOG_POSTS } from '@/lib/seo-cluster';
import { SiteShell } from '@/components/site/site-shell';
import { ClosingCta, FeatureCards, Heading, JsonLd, LinkCards, PageHero, Section } from '@/components/site/page/blocks';
import { ButtonLink } from '@/design-system/site';

export const metadata: Metadata = {
  title: 'Ratgeber rund ums Eigenheim',
  description: 'Praxisnahe Ratgeber: Heizungswartung, Bad-Sanierung, Schimmel. Problem, Optionen, Kostenrahmen, Entscheidung.',
  alternates: { canonical: canonical('/blog') },
  openGraph: ogBlock({ url: '/blog', title: 'Ratgeber rund ums Eigenheim', description: 'Praxisnahe Ratgeber: Heizungswartung, Bad-Sanierung, Schimmel. Problem, Optionen, Kostenrahmen, Entscheidung.', motiv: 'blog' }),
};

export default function Page() {
  return (
    <SiteShell>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Ratgeber', path: '/blog' }])} />
      <PageHero
        eyebrow="Ratgeber"
        title="Verstehen, einordnen, dann entscheiden."
        text="Praxisnahe Orientierung für Eigentümer: Problem, Optionen, Kostenrahmen und klare Entscheidungswege ohne Fachchinesisch."
        actions={
          <>
            <ButtonLink href="#artikel" size="lg" arrow>
              Zu den Ratgebern
            </ButtonLink>
            <ButtonLink href="/lexikon" variant="outline" size="lg">
              Zum Fachlexikon
            </ButtonLink>
          </>
        }
      />

      <Section id="artikel">
        <Heading eyebrow="Wissenssammlung" title="Aktuelle Ratgeber & Leitfäden" />
        <LinkCards items={BLOG_POSTS.map((post) => ({ label: 'Ratgeber-Artikel', title: post.title, text: post.description, href: `/blog/${post.slug}` }))} />
      </Section>

      <Section tone="cream">
        <Heading eyebrow="Aufbau" title="Jeder Ratgeber beantwortet dieselben Fragen." />
        <FeatureCards
          items={[
            { icon: Compass, title: 'Worum es geht', text: 'Das Problem in normalen Worten – woran du es erkennst und warum es sich lohnt, hinzuschauen.' },
            { icon: Scale, title: 'Optionen & Kostenrahmen', text: 'Drei Wege, ehrlich sortiert, mit Orientierung aus Anfrageverläufen. Kein Angebot, aber eine Einordnung.' },
            { icon: ListChecks, title: 'Prüfpunkte & nächster Schritt', text: 'Was du sofort prüfen kannst – und wann aus Wissen ein konkretes Anliegen wird.' },
          ]}
        />
      </Section>

      <ClosingCta
        title="Dein Vorhaben ist konkreter als ein Ratgeber?"
        text="Beschreib dein Anliegen in eigenen Worten. Wir suchen passende geprüfte Betriebe und nennen dir vorab einen Kostenrahmen."
        primary={{ href: '/register?role=homeowner', label: 'Hauskonto kostenlos anlegen' }}
        secondary={{ href: '/#anliegen', label: 'Anliegen beschreiben' }}
      />
    </SiteShell>
  );
}
