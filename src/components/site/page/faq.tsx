'use client';

import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/design-system/site';

/**
 * Website-FAQ für Unterseiten. Wie SiteFaq, akzeptiert aber verlinkte Antworten
 * (ReactNode). Zustand reist über aria-expanded, nicht über Klassen.
 */
export function PageFaq({
  items,
  tone = 'cream',
}: {
  items: ReadonlyArray<{ q: string; a: React.ReactNode }>;
  tone?: 'cream' | 'white';
}) {
  const baseId = useId();
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => {
        const isExpanded = expanded === index;
        const buttonId = `${baseId}-q-${index}`;
        const panelId = `${baseId}-a-${index}`;
        return (
          <li key={item.q} className={cn('rounded-2xl', tone === 'cream' ? 'bg-cream' : 'bg-white')}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isExpanded}
                aria-controls={panelId}
                onClick={() => setExpanded(isExpanded ? null : index)}
                className="group flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl p-6 text-left font-display text-lg font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {item.q}
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-pill transition-transform group-aria-expanded:rotate-45 group-aria-expanded:bg-lime',
                    tone === 'cream' ? 'bg-white' : 'bg-cream',
                  )}
                  aria-hidden="true"
                >
                  <Plus className="size-4" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isExpanded}
              className="px-6 pb-6 leading-relaxed text-body [&_a]:font-semibold [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4"
            >
              {item.a}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
