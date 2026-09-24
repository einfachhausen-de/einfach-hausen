'use client';

import { useId, useState } from 'react';
import { Plus } from 'lucide-react';

/** Designsystem 1.1 · Website-FAQ. Zustand reist über aria-expanded, nicht über Klassen. */
export function SiteFaq({ items }: { items: ReadonlyArray<{ q: string; a: string }> }) {
  const baseId = useId();
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => {
        const isExpanded = expanded === index;
        const buttonId = `${baseId}-q-${index}`;
        const panelId = `${baseId}-a-${index}`;
        return (
          <li key={item.q} className="rounded-2xl bg-white">
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isExpanded}
                aria-controls={panelId}
                onClick={() => setExpanded(isExpanded ? null : index)}
                className="group flex w-full items-center justify-between gap-4 rounded-2xl p-6 text-left font-display text-lg font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {item.q}
                <span className="grid size-8 shrink-0 place-items-center rounded-pill bg-cream transition-transform group-aria-expanded:rotate-45 group-aria-expanded:bg-lime">
                  <Plus className="size-4" aria-hidden="true" />
                </span>
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isExpanded} className="px-6 pb-6">
              <p className="leading-relaxed text-body">{item.a}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
