import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight, Clock, Info } from 'lucide-react';
import { breadcrumbJsonLd, canonical, ogImages, SITE_URL } from '@/lib/seo';
import { CLUSTER_DATE_MODIFIED, CLUSTER_DATE_PUBLISHED } from '@/lib/seo-cluster';
import {
  LEXIKON_EINTRAEGE,
  RELEVANZ_LABEL,
  assertLexikonIntegrity,
  getEintrag,
  getKategorie,
  lesezeit,
  nachbarn,
  verwandteEintraege,
} from '@/lib/lexikon';
import { SiteShell } from '@/components/site/site-shell';
import { AlertPanel, ClosingCta, JsonLd } from '@/components/site/page/blocks';
import { PageFaq } from '@/components/site/page/faq';
import { Reveal } from '@/components/marketing/motion';
import { RelevanzBadge } from '@/components/site/lexikon/entry-card';
import { AblaufTimeline, Checklist, DetailMotionConfig, Gauges, ReadingProgress, Toc } from '@/components/site/lexikon/lexikon-detail';
import { ButtonLink, Container } from '@/design-system/site';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  assertLexikonIntegrity();
  return LEXIKON_EINTRAEGE.map((t) => ({ begriff: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ begriff: string }> }): Promise<Metadata> {
  const { begriff } = await params;
  const term = getEintrag(begriff);
  if (!term) return {};
  return {
    title: term.title,
    description: term.description,
    alternates: { canonical: canonical(`/lexikon/${term.slug}`) },
    openGraph: { type: 'article', title: term.title, description: term.description, url: `/lexikon/${term.slug}`, images: ogImages('lexikon') },
  };
}

const TOC = [
  { id: 'kosten', label: 'Kostenrahmen' },
  { id: 'ablauf', label: 'Ablauf' },
  { id: 'pruefpunkte', label: 'Prüfpunkte' },
  { id: 'faq', label: 'Häufige Fragen' },
  { id: 'verwandt', label: 'Verwandte Begriffe' },
] as const;

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

function Block({ id, index, label, title, intro, children }: { id: string; index: number; label: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`h-${id}`} className="flex scroll-mt-28 flex-col gap-6">
      <Reveal y={16} className="flex flex-col gap-2">
        <p className="text-meta font-semibold uppercase tracking-wider text-brand">{`${String(index).padStart(2, '0')} · ${label}`}</p>
        <h2 id={`h-${id}`} className="font-display text-balance text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
          {title}
        </h2>
        {intro && <p className="max-w-2xl leading-relaxed text-body">{intro}</p>}
      </Reveal>
      {children}
    </section>
  );
}

export default async function Page({ params }: { params: Promise<{ begriff: string }> }) {
  const { begriff } = await params;
  const term = getEintrag(begriff);
  if (!term) notFound();
  const kat = getKategorie(term.kategorie)!;
  const url = canonical(`/lexikon/${term.slug}`);
  const { prev, next } = nachbarn(term);
  const verwandt = verwandteEintraege(term);

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: term.title,
    description: term.description,
    datePublished: CLUSTER_DATE_PUBLISHED,
    dateModified: CLUSTER_DATE_MODIFIED,
    inLanguage: 'de',
    author: { '@id': `${SITE_URL}/#organisation` },
    publisher: { '@id': `${SITE_URL}/#organisation` },
    mainEntityOfPage: url,
    about: { '@type': 'DefinedTerm', name: term.begriff, description: term.kurz, inDefinedTermSet: `${SITE_URL}/lexikon#termset` },
  };
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: term.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  return (
    <SiteShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Start', path: '/' },
          { name: 'Lexikon', path: '/lexikon' },
          { name: kat.name, path: `/lexikon/kategorie/${kat.slug}` },
          { name: term.begriff, path: `/lexikon/${term.slug}` },
        ])}
      />
      <JsonLd data={article} />
      <JsonLd data={faqPage} />

      <DetailMotionConfig>
        <ReadingProgress />

        <section className="bg-cream">
          <Container className="grid items-start gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 lg:py-16">
            <Reveal y={16} className="flex flex-col gap-5">
              <nav aria-label="Pfad" className="flex flex-wrap items-center gap-1.5 text-sm text-body">
                <Link href="/lexikon" className="font-semibold hover:text-ink">
                  Lexikon
                </Link>
                <ChevronRight className="size-3.5" aria-hidden="true" />
                <Link href={`/lexikon/kategorie/${kat.slug}`} className="font-semibold hover:text-ink">
                  {kat.name}
                </Link>
                <ChevronRight className="size-3.5" aria-hidden="true" />
                <span aria-current="page">{term.begriff}</span>
              </nav>
              <div className="flex flex-wrap items-center gap-3 text-meta text-body">
                <RelevanzBadge relevanz={term.relevanz} />
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden="true" /> {lesezeit(term)} Min. Lesezeit
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" aria-hidden="true" /> Stand {formatDate(CLUSTER_DATE_MODIFIED)}
                </span>
              </div>
              <h1 className="font-display text-balance text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">{term.begriff}</h1>
              <p id="definition" className="max-w-2xl text-pretty text-lg leading-relaxed text-body sm:text-xl">
                {term.definition}
              </p>
              {term.synonyme.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-body">
                  Auch bekannt als
                  {term.synonyme.map((synonym) => (
                    <span key={synonym} className="rounded-pill bg-white px-3 py-1 font-semibold text-ink ring-1 ring-hairline">
                      {synonym}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
                <ButtonLink href="/#anliegen" size="lg" arrow>
                  Anliegen beschreiben
                </ButtonLink>
                <ButtonLink href={term.leistung.href} variant="outline" size="lg">
                  {term.leistung.label}
                </ButtonLink>
              </div>
            </Reveal>

            <Reveal y={24} delay={0.12}>
              <aside aria-label="Auf einen Blick" className="flex flex-col gap-5 rounded-card bg-brand-deep p-6 text-white shadow-lift sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-meta font-semibold uppercase tracking-wider text-lime">Auf einen Blick</p>
                  <span className="text-meta font-semibold text-white/70">{RELEVANZ_LABEL[term.relevanz].label}</span>
                </div>
                <dl className="flex flex-col gap-3">
                  {term.kennzahlen.map((kennzahl) => (
                    <div key={kennzahl.label} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <dt className="text-meta font-semibold uppercase tracking-wider text-white/60">{kennzahl.label}</dt>
                      <dd className="mt-1 flex flex-col gap-0.5">
                        <span className="font-display text-xl font-bold">{kennzahl.value}</span>
                        <span className="text-sm text-white/70">{kennzahl.hint}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
                <Gauges stufen={term.stufen} />
                <div className="flex flex-col gap-1.5 border-t border-white/10 pt-4">
                  <p className="text-meta font-semibold uppercase tracking-wider text-white/60">Wann handeln</p>
                  <p className="leading-relaxed text-white/90">{term.wannHandeln}</p>
                </div>
                <p className="text-meta text-white/55">Stufen sind qualitative Orientierung aus Anfrageverläufen – kein Angebot.</p>
              </aside>
            </Reveal>
          </Container>
        </section>

        <section className="bg-white py-16 lg:py-24">
          <Container className="grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-16">
            <Toc items={TOC} />
            <article className="flex min-w-0 max-w-3xl flex-col gap-16">
              <Block id="kosten" index={1} label="Kostenrahmen" title="Womit du rechnen solltest.">
                <ol className="flex flex-col gap-3">
                  {term.kosten.map((item, index) => (
                    <li key={item} className="flex gap-4 rounded-2xl bg-cream p-4">
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
              </Block>

              <Block id="ablauf" index={2} label="Ablauf" title={`In ${term.ablauf.length} Schritten zum Ergebnis.`}>
                <AblaufTimeline items={term.ablauf} />
              </Block>

              <Block
                id="pruefpunkte"
                index={3}
                label="Prüfpunkte"
                title="Woran du merkst, dass es dich betrifft."
                intro="Hak ab, was zutrifft. Aus mehreren Treffern wird ein konkretes Anliegen – und aus dem Anliegen ein fester Ansprechpartner."
              >
                <Checklist items={term.prüfpunkte} />
              </Block>

              <Block id="faq" index={4} label="Häufige Fragen" title={`${term.begriff} – Fragen und Antworten.`}>
                <PageFaq items={term.faqs} />
              </Block>

              <Block id="verwandt" index={5} label="Verwandte Begriffe" title="Was du dazu noch kennen solltest.">
                <div className="grid gap-4 sm:grid-cols-2">
                  {verwandt.map((related) => (
                    <Link
                      key={related.slug}
                      href={`/lexikon/${related.slug}`}
                      className="group flex flex-col gap-2 rounded-card bg-white p-5 ring-1 ring-hairline transition-shadow hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <RelevanzBadge relevanz={related.relevanz} />
                      <span className="font-display text-lg font-bold text-ink">{related.begriff}</span>
                      <span className="text-sm leading-relaxed text-body">{related.kurz}</span>
                    </Link>
                  ))}
                </div>
                <ul className="flex flex-col divide-y divide-hairline rounded-card bg-cream px-5">
                  {term.related.map((related) => (
                    <li key={related.href}>
                      <Link href={related.href} className="group flex items-center justify-between gap-4 py-4 font-semibold text-ink">
                        {related.label}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Block>
            </article>
          </Container>
        </section>

        <nav aria-label="Weitere Begriffe" className="bg-cream py-12">
          <Container className="grid gap-4 sm:grid-cols-2">
            <Link
              href={`/lexikon/${prev.slug}`}
              className="group flex flex-col gap-1.5 rounded-card bg-white p-6 ring-1 ring-hairline transition-shadow hover:shadow-lift"
            >
              <span className="inline-flex items-center gap-1.5 text-meta font-semibold uppercase tracking-wider text-brand">
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" /> Vorheriger Begriff
              </span>
              <span className="font-display text-xl font-bold text-ink">{prev.begriff}</span>
              <span className="text-sm leading-relaxed text-body">{prev.kurz}</span>
            </Link>
            <Link
              href={`/lexikon/${next.slug}`}
              className="group flex flex-col items-end gap-1.5 rounded-card bg-white p-6 text-right ring-1 ring-hairline transition-shadow hover:shadow-lift"
            >
              <span className="inline-flex items-center gap-1.5 text-meta font-semibold uppercase tracking-wider text-brand">
                Nächster Begriff <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
              <span className="font-display text-xl font-bold text-ink">{next.begriff}</span>
              <span className="text-sm leading-relaxed text-body">{next.kurz}</span>
            </Link>
          </Container>
        </nav>

        <ClosingCta
          title="Vom Begriff zu deinem Fall."
          text="Beschreib dein Anliegen in eigenen Worten. Du erhältst geprüfte Partner, einen Kostenrahmen und einen festen Ansprechpartner – kein Auftrag ohne deine Entscheidung."
          primary={{ href: '/register?role=homeowner', label: 'Hauskonto kostenlos anlegen' }}
          secondary={{ href: '/#anliegen', label: 'Anliegen beschreiben' }}
        />
      </DetailMotionConfig>
    </SiteShell>
  );
}
