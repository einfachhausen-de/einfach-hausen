import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { breadcrumbJsonLd, canonical, ogImages, SITE_URL } from '@/lib/seo';
import { LEXIKON_KATEGORIEN, eintraegeInKategorie, getKategorie, type LexikonKategorieSlug } from '@/lib/lexikon';
import { SiteShell } from '@/components/site/site-shell';
import { ClosingCta, Heading, JsonLd, PageHero, Section } from '@/components/site/page/blocks';
import { EntryGrid, KategorieBento, KategorieIcon } from '@/components/site/lexikon/lexikon-sections';
import { ButtonLink } from '@/design-system/site';

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
    <SiteShell>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Start', path: '/' }, { name: 'Lexikon', path: '/lexikon' }, { name: kat.name, path: `/lexikon/kategorie/${kat.slug}` }])} />
      <JsonLd data={list} />

      <PageHero
        eyebrow={`Lexikon · ${entries.length} ${entries.length === 1 ? 'Begriff' : 'Begriffe'}`}
        title={kat.name}
        text={kat.beschreibung}
        actions={
          <>
            <ButtonLink href={kat.leistung.href} size="lg" arrow>
              {kat.leistung.label}
            </ButtonLink>
            <ButtonLink href="/lexikon" variant="outline" size="lg">
              Alle Bereiche
            </ButtonLink>
          </>
        }
      >
        <nav aria-label="Pfad" className="order-first flex items-center gap-3 text-sm text-body">
          <span className="grid size-11 place-items-center rounded-xl bg-ink text-lime">
            <KategorieIcon slug={kat.slug as LexikonKategorieSlug} />
          </span>
          <Link href="/lexikon" className="font-semibold hover:text-ink">
            Lexikon
          </Link>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <span aria-current="page">{kat.name}</span>
        </nav>
        {pflicht > 0 && (
          <p className="text-sm font-semibold text-body">
            <span className="mr-2 inline-block size-2 rounded-pill bg-coral align-middle" aria-hidden="true" />
            {pflicht} davon mit Pflichtcharakter
          </p>
        )}
      </PageHero>

      <Section>
        <EntryGrid entries={entries} />
      </Section>

      <Section tone="cream">
        <Heading eyebrow="Weitere Bereiche" title="Was sonst noch zusammengehört." />
        <KategorieBento exclude={kat.slug as LexikonKategorieSlug} />
      </Section>

      <ClosingCta
        title={`${kat.name}: aus Wissen wird ein Anliegen.`}
        text="Beschreib, was an deinem Haus ansteht. Einordnung, geprüfte Partner und Kostenrahmen kommen von uns – entscheiden tust du."
        primary={{ href: '/register?role=homeowner', label: 'Hauskonto kostenlos anlegen' }}
        secondary={{ href: '/#anliegen', label: 'Anliegen beschreiben' }}
      />
    </SiteShell>
  );
}
