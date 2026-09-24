import Link from 'next/link';
import { ArrowUpRight, Clock } from 'lucide-react';
import { RELEVANZ_LABEL, type Relevanz, type Stufe } from '@/lib/lexikon';
import { cn } from '@/design-system/site';

/** Serialisierbare Kartendaten – geteilt zwischen Explorer (Client) und Server-Seiten. */
export type EntryCardData = {
  slug: string;
  begriff: string;
  kurz: string;
  kategorie: string;
  kategorieName: string;
  relevanz: Relevanz;
  stufen: { kosten: Stufe; aufwand: Stufe; dringlichkeit: Stufe };
  lesezeit: number;
  synonyme: string[];
  buchstabe: string;
};

const RELEVANZ_TONE: Record<Relevanz, string> = {
  pflicht: 'bg-coral-soft text-ink',
  empfohlen: 'bg-lime-soft text-ink',
  wissen: 'bg-brand-soft text-brand',
};

export function RelevanzBadge({ relevanz, tone = 'light' }: { relevanz: Relevanz; tone?: 'light' | 'dark' }) {
  return (
    <span
      title={RELEVANZ_LABEL[relevanz].hint}
      className={cn(
        'inline-flex w-fit shrink-0 items-center rounded-pill px-2.5 py-0.5 text-meta font-semibold',
        tone === 'light' ? RELEVANZ_TONE[relevanz] : 'bg-white/10 text-lime',
      )}
    >
      {RELEVANZ_LABEL[relevanz].label}
    </span>
  );
}

export function MiniLevels({ stufen }: { stufen: EntryCardData['stufen'] }) {
  const rows: Array<[string, Stufe, boolean]> = [
    ['Kosten', stufen.kosten, false],
    ['Aufwand', stufen.aufwand, false],
    ['Dringlich', stufen.dringlichkeit, true],
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Orientierungsstufen">
      {rows.map(([label, value, hot]) => (
        <span key={label} className="inline-flex items-center gap-1.5 text-meta text-body" title={`${label}: Stufe ${value} von 4`}>
          {label}
          <span className="flex gap-0.5" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <i key={n} className={cn('h-1.5 w-3 rounded-pill', n <= value ? (hot && value >= 3 ? 'bg-coral' : 'bg-brand') : 'bg-hairline')} />
            ))}
          </span>
        </span>
      ))}
    </div>
  );
}

function Highlight({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-lime px-0.5 text-ink">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

export function EntryCard({ e, query, className }: { e: EntryCardData; query?: string; className?: string }) {
  return (
    <Link
      href={`/lexikon/${e.slug}`}
      data-slug={e.slug}
      className={cn(
        'group flex h-full w-full flex-col gap-3 rounded-card bg-white p-6 ring-1 ring-hairline transition-shadow hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-meta font-semibold uppercase tracking-wider text-brand">{e.kategorieName}</span>
        <RelevanzBadge relevanz={e.relevanz} />
      </div>
      <h3 className="font-display text-xl font-bold leading-snug text-ink">
        <Highlight text={e.begriff} query={query} />
      </h3>
      <p className="text-sm leading-relaxed text-body">{e.kurz}</p>
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-hairline pt-4">
        <MiniLevels stufen={e.stufen} />
        <span className="flex shrink-0 items-center gap-2 text-meta text-body">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {e.lesezeit} Min.
          </span>
          <span
            className="grid size-8 place-items-center rounded-pill bg-cream text-ink transition-colors group-hover:bg-lime"
            aria-hidden="true"
          >
            <ArrowUpRight className="size-4" />
          </span>
        </span>
      </div>
    </Link>
  );
}
