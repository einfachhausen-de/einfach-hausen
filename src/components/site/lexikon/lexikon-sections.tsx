import Link from 'next/link';
import { ArrowRight, Droplets, FileCheck2, Flame, FolderKanban, Home, PlugZap, Waves, type LucideIcon } from 'lucide-react';
import { Reveal, Stagger } from '@/components/marketing/motion';
import {
  LEXIKON_KATEGORIEN,
  eintraegeInKategorie,
  lesezeit,
  registerBuchstabe,
  type LexikonEintrag,
  type LexikonKategorieSlug,
} from '@/lib/lexikon';
import { cn } from '@/design-system/site';
import { EntryCard, type EntryCardData } from './entry-card';

export function toCardData(e: LexikonEintrag): EntryCardData {
  const kat = LEXIKON_KATEGORIEN.find((k) => k.slug === e.kategorie);
  return {
    slug: e.slug,
    begriff: e.begriff,
    kurz: e.kurz,
    kategorie: e.kategorie,
    kategorieName: kat?.name ?? e.kategorie,
    relevanz: e.relevanz,
    stufen: e.stufen,
    lesezeit: lesezeit(e),
    synonyme: e.synonyme,
    buchstabe: registerBuchstabe(e.begriff),
  };
}

const ICONS: Record<LexikonKategorieSlug, LucideIcon> = {
  'heizung-energie': Flame,
  'feuchte-schimmel': Droplets,
  'dach-gebaeudehuelle': Home,
  'elektro-sicherheit': PlugZap,
  'sanitaer-wasser': Waves,
  'recht-pflichten': FileCheck2,
  'hausakte-organisation': FolderKanban,
};

export function KategorieIcon({ slug, className }: { slug: LexikonKategorieSlug; className?: string }) {
  const Icon = ICONS[slug];
  return <Icon className={cn('size-5', className)} aria-hidden="true" />;
}

/**
 * Raster aller Bereiche; ohne Ausschluss ist die erste Kachel dunkel und doppelt breit.
 * `reveal={false}` hält die Karten sofort sichtbar (Lexikon-Index-Vertrag: keine versteckten Kategorien vor dem Scrollen).
 */
export function KategorieBento({ exclude, reveal = true }: { exclude?: LexikonKategorieSlug; reveal?: boolean }) {
  const list = LEXIKON_KATEGORIEN.filter((k) => k.slug !== exclude);
  const cards = list.map((k, index) => {
    const entries = eintraegeInKategorie(k.slug);
    const dark = index === 0 && !exclude;
    return (
      <div key={k.slug} className={cn('flex min-w-0', dark && 'sm:col-span-2')}>
        <Link
          href={`/lexikon/kategorie/${k.slug}`}
          className={cn(
            'group flex w-full flex-col gap-3 rounded-card p-6 transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
            dark ? 'bg-brand-deep text-white hover:shadow-lift' : 'bg-white ring-1 ring-hairline hover:shadow-lift',
          )}
        >
          <span
            className={cn(
              'grid size-11 place-items-center rounded-xl transition-colors',
              dark ? 'bg-lime text-ink' : 'bg-cream text-brand group-hover:bg-lime group-hover:text-ink',
            )}
          >
            <KategorieIcon slug={k.slug} />
          </span>
          <h3 className={cn('font-display text-lg font-bold leading-snug', dark ? 'text-white' : 'text-ink')}>{k.name}</h3>
          <p className={cn('text-sm leading-relaxed', dark ? 'text-white/75' : 'text-body')}>{dark ? k.beschreibung : k.kurz}</p>
          <div className="flex flex-wrap gap-1.5" aria-hidden="true">
            {entries.slice(0, dark ? 6 : 3).map((e) => (
              <span key={e.slug} className={cn('rounded-pill px-2.5 py-0.5 text-meta', dark ? 'bg-white/10 text-white/85' : 'bg-cream text-body')}>
                {e.begriff}
              </span>
            ))}
          </div>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className={cn('text-meta font-semibold', dark ? 'text-lime' : 'text-brand')}>
              {entries.length} {entries.length === 1 ? 'Begriff' : 'Begriffe'}
            </span>
            <ArrowRight
              className={cn('size-4 transition-transform group-hover:translate-x-0.5', dark ? 'text-white' : 'text-ink')}
              aria-hidden="true"
            />
          </div>
        </Link>
      </div>
    );
  });

  const gridClass = cn('grid gap-4 sm:grid-cols-2', exclude ? 'lg:grid-cols-3' : 'lg:grid-cols-4');
  return reveal ? (
    <Stagger className={gridClass} y={16} gap={0.05}>
      {cards}
    </Stagger>
  ) : (
    <div className={gridClass}>{cards}</div>
  );
}

/** Statisches Raster mit Scroll-Reveal – für Kategorieseiten und 404. */
export function EntryGrid({ entries }: { entries: LexikonEintrag[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((e, index) => (
        <Reveal key={e.slug} delay={(index % 3) * 0.06} y={20} className="flex min-w-0">
          <EntryCard e={toCardData(e)} />
        </Reveal>
      ))}
    </div>
  );
}
