import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Info } from 'lucide-react';
import { breadcrumbJsonLd, canonical, ogImages, SITE_URL } from '@/lib/seo';
import { BLOG_POSTS, CLUSTER_DATE_MODIFIED, CLUSTER_DATE_PUBLISHED } from '@/lib/seo-cluster';
import { SiteShell } from '@/components/site/site-shell';
import { AlertPanel, ClosingCta, Heading, JsonLd, LinkCards, PageHero, Prose, Section, StepList } from '@/components/site/page/blocks';
import { PageFaq } from '@/components/site/page/faq';
import { Reveal, Stagger } from '@/components/marketing/motion';
import { ButtonLink, CheckList } from '@/design-system/site';

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

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

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
  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug);

  return (
    <SiteShell>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Ratgeber', path: '/blog' }, { name: post.title, path: `/blog/${post.slug}` }])} />
      <JsonLd data={blogPosting} />

      <PageHero
        eyebrow="Ratgeber"
        title={post.title}
        text={post.description}
        actions={
          <>
            <ButtonLink href="/#anliegen" size="lg" arrow>
              Anliegen beschreiben
            </ButtonLink>
            <ButtonLink href="/blog" variant="outline" size="lg">
              Alle Ratgeber
            </ButtonLink>
          </>
        }
      >
        <nav aria-label="Pfad" className="order-first flex flex-wrap items-center gap-1.5 text-sm text-body">
          <Link href="/blog" className="font-semibold hover:text-ink">
            Ratgeber
          </Link>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <span aria-current="page" className="line-clamp-1">
            {post.title}
          </span>
          <span className="mx-2 text-hairline" aria-hidden="true">
            |
          </span>
          <span>Stand {formatDate(CLUSTER_DATE_MODIFIED)}</span>
        </nav>
      </PageHero>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Heading eyebrow="Problem" title="Worum es geht." />
          <Reveal y={16}>
            <Prose>
              {post.problem.map((text) => (
                <p key={text.slice(0, 24)} className="first:mt-0">
                  {text}
                </p>
              ))}
            </Prose>
          </Reveal>
        </div>
      </Section>

      <Section tone="cream">
        <Heading eyebrow="Optionen" title="Drei Wege, ehrlich sortiert." />
        <StepList steps={post.optionen} />
      </Section>

      <Section>
        <Stagger className="grid gap-5 lg:grid-cols-2" y={20}>
          <div className="flex h-full flex-col gap-5 rounded-card bg-cream p-7 sm:p-9">
            <p className="text-meta font-semibold uppercase tracking-wider text-brand">Kostenrahmen</p>
            <h2 className="font-display text-2xl font-bold leading-snug text-ink sm:text-3xl">Womit du rechnen solltest.</h2>
            <ol className="flex flex-col gap-3">
              {post.kosten.map((item, index) => (
                <li key={item} className="flex gap-4 rounded-2xl bg-white p-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-ink font-display text-sm font-bold text-lime" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed text-ink">{item}</span>
                </li>
              ))}
            </ol>
            <AlertPanel icon={Info} title="Einordnung">
              Kostenrahmen sind Orientierung aus Anfrageverläufen, kein Angebot. Verbindlich ist der Rahmen des Partnerbetriebs, bevor du entscheidest.
            </AlertPanel>
          </div>
          <div className="flex h-full flex-col gap-5 rounded-card bg-lime-soft p-7 sm:p-9">
            <p className="text-meta font-semibold uppercase tracking-wider text-brand">Prüfpunkte</p>
            <h2 className="font-display text-2xl font-bold leading-snug text-ink sm:text-3xl">Das hilft sofort.</h2>
            <CheckList items={post.prüfpunkte} />
          </div>
        </Stagger>
      </Section>

      <Section tone="dark">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
          <Heading tone="dark" eyebrow="Entscheidung" title="Der nächste sinnvolle Schritt." />
          <Reveal y={16}>
            <CheckList tone="dark" items={post.entscheidung} />
          </Reveal>
        </div>
      </Section>

      <Section tone="cream">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Heading eyebrow="Häufige Fragen" title="Zum Artikel." />
          <PageFaq tone="white" items={post.faqs} />
        </div>
      </Section>

      <Section>
        <Heading eyebrow="Weiterlesen" title="Passende Seiten im Cluster." />
        <LinkCards
          items={[
            ...post.related.map((related) => ({ label: 'Weiterführend', title: related.label, href: related.href })),
            ...otherPosts.map((other) => ({ label: 'Ratgeber', title: other.title, href: `/blog/${other.slug}` })),
          ].slice(0, 6)}
        />
      </Section>

      <ClosingCta
        title="Beschreib deinen Fall in eigenen Worten."
        text="Du erhältst passende Partner, einen Kostenrahmen und einen festen Ansprechpartner. Erst dann entscheidest du."
        primary={{ href: '/register?role=homeowner', label: 'Hauskonto kostenlos anlegen' }}
        secondary={{ href: '/#anliegen', label: 'Anliegen beschreiben' }}
      />
    </SiteShell>
  );
}
