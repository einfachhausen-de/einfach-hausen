import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { breadcrumbJsonLd, canonical, ogImages, SITE_URL } from '@/lib/seo';
import { BLOG_POSTS, CLUSTER_DATE_MODIFIED, CLUSTER_DATE_PUBLISHED } from '@/lib/seo-cluster';
import { MarketingShell } from '@/components/marketing/site-shell';
import { Steps } from '@/components/marketing/ui';
import { EHScope, EHSection, EHPageHero, EHList, EHCallout, EHFAQ, EHRelated, EHClosing, EHButton, EHEyebrow, EHHeading, EHText, EHProse } from '@/design-system';

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: canonical(`/blog/${post.slug}`) },
    openGraph: { type: 'article', title: post.title, description: post.description, url: `/blog/${post.slug}`, images: ogImages('blog') },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();
  const url = canonical(`/blog/${post.slug}`);
  const blogPosting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: CLUSTER_DATE_PUBLISHED,
    dateModified: CLUSTER_DATE_MODIFIED,
    inLanguage: 'de',
    author: { '@id': `${SITE_URL}/#organisation` },
    publisher: { '@id': `${SITE_URL}/#organisation` },
    mainEntityOfPage: url,
  };
  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Ratgeber', path: '/blog' }, { name: post.title, path: `/blog/${post.slug}` }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPosting) }} />
      <EHScope>
      <EHPageHero
        eyebrow="Ratgeber"
        title={post.title}
        text={post.description}
        actions={<><EHButton href="/#anliegen" arrow>Anliegen starten</EHButton><EHButton href="/leistungen/heizung" variant="secondary">Heizung als Leistung im Überblick</EHButton></>}
      />
      <EHSection compact>
        <EHEyebrow>Problem</EHEyebrow>
        <EHHeading>Worum es geht.</EHHeading>
        <EHProse>
          {post.problem.map((t) => (<p key={t.slice(0, 24)}>{t}</p>))}
        </EHProse>
      </EHSection>
      <EHSection compact>
        <EHEyebrow>Optionen</EHEyebrow>
        <EHHeading>Drei Wege, ehrlich sortiert.</EHHeading>
        <Steps items={post.optionen.map((o) => ({ title: o.title, text: o.text }))} />
      </EHSection>
      <EHSection compact>
        <EHEyebrow>Kostenrahmen</EHEyebrow>
        <EHHeading>Womit du rechnen solltest.</EHHeading>
        <EHList label="Kostenrahmen" items={post.kosten.map((k, i) => ({ id: 'kosten-' + i, title: k }))} />
        <EHCallout title="Einordnung">Kostenrahmen sind Orientierung aus Anfrageverläufen, kein Angebot. Verbindlich ist der Rahmen des Partnerbetriebs, bevor du entscheidest.</EHCallout>
      </EHSection>
      <EHSection compact>
        <EHEyebrow>Prüfpunkte</EHEyebrow>
        <EHHeading>Aus unserer Einordnung: das hilft sofort.</EHHeading>
        <EHList label="Prüfpunkte" items={post.prüfpunkte.map((p, i) => ({ id: 'pruef-' + i, title: p }))} />
      </EHSection>
      <EHSection compact>
        <EHEyebrow>Entscheidung</EHEyebrow>
        <EHHeading>Der nächste sinnvolle Schritt.</EHHeading>
        <EHList label="Entscheidung" items={post.entscheidung.map((e, i) => ({ id: 'entscheidung-' + i, title: e }))} />
      </EHSection>
      <EHSection compact>
        <EHEyebrow>Häufige Fragen</EHEyebrow>
        <EHHeading>Zum Artikel.</EHHeading>
        <EHFAQ items={post.faqs.map((f) => ({ q: f.q, a: f.a }))} />
      </EHSection>
      <EHSection compact>
        <EHEyebrow>Weiterlesen</EHEyebrow>
        <EHHeading>Passende Seiten im Cluster.</EHHeading>
        <EHRelated items={post.related.map((r) => ({ title: r.label, href: r.href }))} />
      </EHSection>
      <EHClosing title="Beschreib deinen Fall in eigenen Worten." text="Du erhältst Partner, Kostenrahmen und einen festen Ansprechpartner. Erst dann entscheidest du." href="/register?role=homeowner" label="Hauskonto kostenlos anlegen" secondary={<EHButton href="/#anliegen" variant="secondary">Anliegen starten</EHButton>} />
      </EHScope>
    </MarketingShell>
  );
}
