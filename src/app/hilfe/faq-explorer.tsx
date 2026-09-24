'use client';

import { useMemo, useState } from 'react';
import { PageFaq } from '@/components/site/page/faq';
import { cn } from '@/design-system/site';

type Entry = { q: string; a: string; cat: string };

const ALL = 'Alle';

export function FaqExplorer({ entries }: { entries: ReadonlyArray<Entry> }) {
  const [category, setCategory] = useState<string>(ALL);
  const categories = useMemo(() => [ALL, ...Array.from(new Set(entries.map((entry) => entry.cat)))], [entries]);
  const filtered = useMemo(() => entries.filter((entry) => category === ALL || entry.cat === category), [entries, category]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Fragen nach Thema filtern">
        {categories.map((item) => {
          const count = item === ALL ? entries.length : entries.filter((entry) => entry.cat === item).length;
          const active = category === item;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(item)}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-pill px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                active ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-hairline hover:ring-ink',
              )}
            >
              {item}
              <span className={cn('rounded-pill px-1.5 text-meta', active ? 'bg-white/15 text-white' : 'bg-cream text-body')}>{count}</span>
            </button>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {`${filtered.length} Fragen im Thema ${category}`}
      </p>
      <PageFaq key={category} tone="white" items={filtered} />
    </div>
  );
}
