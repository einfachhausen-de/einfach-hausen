import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { breadcrumbJsonLd, canonical, ogImages, SITE_URL } from '@/lib/seo';
import { LEXIKON_KATEGORIEN, eintraegeInKategorie, getKategorie, type LexikonKategorieSlug } from '@/lib/lexikon';
import { MarketingShell } from '@/components/marketing/site-shell';
import { CtaBand, LinkButton, Section } from '@/components/marketing/ui';
import { Reveal, Stagger } from '@/components/marketing/motion';
import { EntryGrid, KategorieBento, KategorieIcon } from '@/components/marketing/lexikon/lexikon-sections';
import styles from '@/components/marketing/lexikon/lexikon.module.css';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return LEXIKON_KATEGORIEN.map((k) => ({ kategorie: k.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ kategorie: string }> }): Promise<Metadata> {
  const { kategorie } = await params;
  const kat = getKategorie(kategorie);
  if (!kat) return {};
  const n = eintraegeInKategorie(kat.slug).length;
  return {
    title: `${kat.name}: ${n} Begriffe erklärt`,
    description: kat.beschreibung,
    alternates: { canonical: canonical(`/lexikon/kategorie/${kat.slug}`) },
    openGraph: { type: 'website', title: `${kat.name} · Lexikon`, description: kat.beschreibung, url: `/lexikon/kategorie/${kat.slug}`, images: ogImages('lexikon') },
  };
}

export default async function Page({ params }: { params: Promise<{ kategorie: string }> }) {
  const { kategorie } = await params;
  const kat = getKategorie(kategorie);
  if (!kat) notFound();
  const entries = eintraegeInKategorie(kat.slug);
  const pflicht = entries.filter((e) => e.relevanz === 'pflicht').length;

  const list = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${kat.name} — Lexikon`,
    url: canonical(`/lexikon/kategorie/${kat.slug}`),
    itemListElement: entries.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.begriff, url: canonical(`/lexikon/${e.slug}`) })),
    isPartOf: `${SITE_URL}/lexikon#termset`,
  };

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Lexikon', path: '/lexikon' }, { name: kat.name, path: `/lexikon/kategorie/${kat.slug}` }])) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(list) }} />

      <header className={styles.dHero}>
        <div className={styles.dHeroGrid}>
          <Stagger className={styles.dHeroCopy} gap={0.08}>
            <nav className={styles.crumbs} aria-label="Pfad">
              <Link href="/lexikon">Lexikon</Link>
              <ChevronRight size={14} aria-hidden="true" />
              <span aria-current="page">{kat.name}</span>
            </nav>
            <span className={styles.catIcon}><KategorieIcon slug={kat.slug as LexikonKategorieSlug} /></span>
            <h1>{kat.name}</h1>
            <p className="lead" style={{ fontSize: 'var(--eh-lead)', lineHeight: 1.55, color: 'var(--eh-ink-soft)' }}>{kat.beschreibung}</p>
            <div className={styles.heroMeta}>
              <span>{entries.length} {entries.length === 1 ? 'Begriff' : 'Begriffe'}</span>
              {pflicht > 0 && <span>{pflicht} davon mit Pflichtcharakter</span>}
            </div>
            <div className={styles.dHeroActions}>
              <LinkButton href={kat.leistung.href}>{kat.leistung.label}</LinkButton>
              <LinkButton href="/lexikon" secondary>Alle Bereiche</LinkButton>
            </div>
          </Stagger>
        </div>
      </header>

      <Section tone="surface" tight>
        <EntryGrid entries={entries} />
      </Section>

      <Section tone="soft" eyebrow="Weitere Bereiche" title="Was sonst noch zusammengehört.">
        <KategorieBento exclude={kat.slug} />
      </Section>

      <Reveal>
        <CtaBand title={`${kat.name}: aus Wissen wird ein Anliegen.`} text="Beschreib, was an deinem Haus ansteht. Einordnung, geprüfte Partner und Kostenrahmen kommen von uns — entscheiden tust du." />
      </Reveal>
    </MarketingShell>
  );
}
