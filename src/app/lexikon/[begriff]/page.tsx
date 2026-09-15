import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronRight, Clock } from 'lucide-react';
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
import { MarketingShell } from '@/components/marketing/site-shell';
import { CtaBand, Faq, InfoPanel, LinkButton } from '@/components/marketing/ui';
import { Reveal } from '@/components/marketing/motion';
import { RelevanzBadge } from '@/components/marketing/lexikon/entry-card';
import { AblaufTimeline, Checklist, DetailMotionConfig, Gauges, ReadingProgress, Toc } from '@/components/marketing/lexikon/lexikon-detail';
import styles from '@/components/marketing/lexikon/lexikon.module.css';

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
  { id: 'definition', label: 'Definition' },
  { id: 'kosten', label: 'Kostenrahmen' },
  { id: 'ablauf', label: 'Ablauf' },
  { id: 'pruefpunkte', label: 'Prüfpunkte' },
  { id: 'faq', label: 'Häufige Fragen' },
  { id: 'verwandt', label: 'Verwandte Begriffe' },
];

const fmt = (iso: string) => new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });

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
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Lexikon', path: '/lexikon' }, { name: kat.name, path: `/lexikon/kategorie/${kat.slug}` }, { name: term.begriff, path: `/lexikon/${term.slug}` }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }} />

      <DetailMotionConfig>
        <ReadingProgress />

        <header className={styles.dHero}>
          <div className={styles.dHeroGrid}>
            <div className={styles.dHeroCopy}>
              <Reveal y={10}>
                <nav className={styles.crumbs} aria-label="Pfad">
                  <Link href="/lexikon">Lexikon</Link>
                  <ChevronRight size={14} aria-hidden="true" />
                  <Link href={`/lexikon/kategorie/${kat.slug}`}>{kat.name}</Link>
                  <ChevronRight size={14} aria-hidden="true" />
                  <span aria-current="page">{term.begriff}</span>
                </nav>
              </Reveal>
              <Reveal y={14} delay={0.05}>
                <div className={styles.dHeroTags}>
                  <RelevanzBadge relevanz={term.relevanz} />
                  <span className={styles.heroMeta}><span><Clock size={14} aria-hidden="true" /> {lesezeit(term)} Min. Lesezeit</span><span><CalendarDays size={14} aria-hidden="true" /> Stand {fmt(CLUSTER_DATE_MODIFIED)}</span></span>
                </div>
              </Reveal>
              <Reveal y={22} delay={0.1}><h1>{term.begriff}</h1></Reveal>
              <Reveal y={18} delay={0.18}><p className="lead" style={{ fontSize: 'var(--eh-lead)', lineHeight: 1.55, color: 'var(--eh-ink-soft)' }} id="definition">{term.definition}</p></Reveal>
              {term.synonyme.length > 0 && (
                <Reveal y={12} delay={0.24}>
                  <div className={styles.synonyms}>Auch bekannt als {term.synonyme.map((s) => <span key={s}>{s}</span>)}</div>
                </Reveal>
              )}
              <Reveal y={12} delay={0.3}>
                <div className={styles.dHeroActions}>
                  <LinkButton href="/#anliegen">Anliegen starten</LinkButton>
                  <LinkButton href={term.leistung.href} secondary>{term.leistung.label}</LinkButton>
                </div>
              </Reveal>
            </div>

            <Reveal y={28} delay={0.2} className={styles.glance}>
              <div className={styles.glanceHead}><span>Auf einen Blick</span><span>{RELEVANZ_LABEL[term.relevanz].label}</span></div>
              <div className={styles.kpis}>
                {term.kennzahlen.map((k) => (
                  <div key={k.label} className={styles.kpi}><small>{k.label}</small><strong>{k.value}</strong><span>{k.hint}</span></div>
                ))}
              </div>
              <Gauges stufen={term.stufen} />
              <div className={styles.glanceWhen}><small>Wann handeln</small><p>{term.wannHandeln}</p></div>
              <span className={styles.glanceNote}>Stufen sind qualitative Orientierung aus Anfrageverläufen — kein Angebot.</span>
            </Reveal>
          </div>
        </header>

        <div className={styles.body}>
          <div className={styles.bodyGrid}>
            <Toc items={TOC} />

            <article className={styles.article}>
              <section className={styles.block} id="kosten" aria-labelledby="h-kosten">
                <Reveal className={styles.blockHead} y={18}>
                  <span className={styles.blockNum}>01 · Kostenrahmen</span>
                  <h2 id="h-kosten">Womit du rechnen solltest.</h2>
                </Reveal>
                <div className={styles.costList}>
                  {term.kosten.map((k, i) => (
                    <Reveal key={k} delay={i * 0.07} y={16}><div className={styles.costItem}><i>{i + 1}</i><p>{k}</p></div></Reveal>
                  ))}
                </div>
                <Reveal y={14}><InfoPanel label="Einordnung">Kostenrahmen sind Orientierung aus Anfrageverläufen, kein Angebot. Verbindlich ist der Rahmen des Partnerbetriebs, bevor du entscheidest.</InfoPanel></Reveal>
              </section>

              <section className={styles.block} id="ablauf" aria-labelledby="h-ablauf">
                <Reveal className={styles.blockHead} y={18}>
                  <span className={styles.blockNum}>02 · Ablauf</span>
                  <h2 id="h-ablauf">In {term.ablauf.length} Schritten zum Ergebnis.</h2>
                </Reveal>
                <AblaufTimeline items={term.ablauf} />
              </section>

              <section className={styles.block} id="pruefpunkte" aria-labelledby="h-pruef">
                <Reveal className={styles.blockHead} y={18}>
                  <span className={styles.blockNum}>03 · Prüfpunkte</span>
                  <h2 id="h-pruef">Woran du merkst, dass es dich betrifft.</h2>
                  <p>Hak ab, was zutrifft. Aus mehreren Treffern wird ein konkretes Anliegen — und aus dem Anliegen ein fester Ansprechpartner.</p>
                </Reveal>
                <Checklist items={term.prüfpunkte} />
              </section>

              <section className={styles.block} id="faq" aria-labelledby="h-faq">
                <Reveal className={styles.blockHead} y={18}>
                  <span className={styles.blockNum}>04 · Häufige Fragen</span>
                  <h2 id="h-faq">{term.begriff} — Fragen und Antworten.</h2>
                </Reveal>
                <Reveal y={16}><Faq items={term.faqs.map((f) => ({ q: f.q, a: f.a }))} /></Reveal>
              </section>

              <section className={styles.block} id="verwandt" aria-labelledby="h-verwandt">
                <Reveal className={styles.blockHead} y={18}>
                  <span className={styles.blockNum}>05 · Verwandte Begriffe</span>
                  <h2 id="h-verwandt">Was du dazu noch kennen solltest.</h2>
                </Reveal>
                <div className={styles.related}>
                  {verwandt.map((v, i) => (
                    <Reveal key={v.slug} delay={i * 0.06} y={16} style={{ display: 'flex' }}>
                      <Link href={`/lexikon/${v.slug}`} className={styles.relCard} style={{ flex: 1 }}>
                        <RelevanzBadge relevanz={v.relevanz} />
                        <strong>{v.begriff}</strong>
                        <span>{v.kurz}</span>
                      </Link>
                    </Reveal>
                  ))}
                </div>
                <Reveal y={14}>
                  <div className={styles.linkList}>
                    {term.related.map((r) => (
                      <Link key={r.href} href={r.href}>{r.label}<ArrowRight size={16} aria-hidden="true" /></Link>
                    ))}
                  </div>
                </Reveal>
              </section>
            </article>
          </div>
        </div>

        <nav className={styles.navi} aria-label="Weitere Begriffe">
          <div className={styles.naviInner}>
            <Reveal y={16} style={{ display: 'flex' }}>
              <Link href={`/lexikon/${prev.slug}`} className={styles.naviCard} data-dir="prev" style={{ flex: 1 }}>
                <small><ArrowLeft size={14} aria-hidden="true" /> Vorheriger Begriff</small>
                <strong>{prev.begriff}</strong>
                <span>{prev.kurz}</span>
              </Link>
            </Reveal>
            <Reveal y={16} delay={0.06} style={{ display: 'flex' }}>
              <Link href={`/lexikon/${next.slug}`} className={styles.naviCard} data-dir="next" style={{ flex: 1 }}>
                <small>Nächster Begriff <ArrowRight size={14} aria-hidden="true" /></small>
                <strong>{next.begriff}</strong>
                <span>{next.kurz}</span>
              </Link>
            </Reveal>
          </div>
        </nav>

        <CtaBand title="Vom Begriff zu deinem Fall." text="Beschreib dein Anliegen in eigenen Worten. Du erhältst geprüfte Partner, Kostenrahmen und einen festen Ansprechpartner — kein Auftrag ohne deine Entscheidung." />
      </DetailMotionConfig>
    </MarketingShell>
  );
}
