'use client';

/**
 * Lexikon-Explorer: kompakter Kopf mit Suche („/“ fokussiert), Filter nach Bereich
 * und A–Z, Ergebnisraster mit Layout-Animation beim Umsortieren.
 *
 * Motion-Vertrag: transform/opacity, eine Kurve, keine Dauerschleife.
 * `MotionConfig reducedMotion="user"` zeigt bei reduzierter Bewegung sofort den Endzustand.
 */

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, Search, X } from 'lucide-react';
import { Container, Eyebrow, cn } from '@/design-system/site';
import { EntryCard, RelevanzBadge, type EntryCardData } from './entry-card';

export type ExplorerCategory = { slug: string; name: string; kurz: string; count: number };

type Props = {
  entries: EntryCardData[];
  categories: ExplorerCategory[];
  letters: string[];
  featured: string[];
};

const EASE = [0.22, 1, 0.36, 1] as const;
const QUICK_TERMS = ['Wärmepumpe', 'Schimmel', 'Energieausweis', 'Rückstau', 'FI-Schalter'] as const;

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').toLowerCase();
}

const chipClass = (active: boolean) =>
  cn(
    'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill px-3.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    active ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-hairline hover:ring-ink',
  );

export function LexikonExplorer({ entries, categories, letters, featured }: Props) {
  const [query, setQuery] = useState('');
  const [kategorie, setKategorie] = useState<string | null>(null);
  const [buchstabe, setBuchstabe] = useState<string | null>(null);
  const deferred = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === 'Escape' && document.activeElement === inputRef.current) {
        setQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const q = normalize(deferred.trim());
  const results = useMemo(
    () =>
      entries.filter((e) => {
        if (kategorie && e.kategorie !== kategorie) return false;
        if (buchstabe && e.buchstabe !== buchstabe) return false;
        if (!q) return true;
        return normalize([e.begriff, e.kurz, e.kategorieName, ...e.synonyme].join(' ')).includes(q);
      }),
    [entries, kategorie, buchstabe, q],
  );

  const availableLetters = useMemo(
    () => new Set(entries.filter((e) => !kategorie || e.kategorie === kategorie).map((e) => e.buchstabe)),
    [entries, kategorie],
  );

  const reset = useCallback(() => {
    setQuery('');
    setKategorie(null);
    setBuchstabe(null);
  }, []);
  const hasFilter = Boolean(q) || Boolean(kategorie) || Boolean(buchstabe);
  const activeCategory = categories.find((c) => c.slug === kategorie);
  const featuredEntries = featured
    .map((slug) => entries.find((e) => e.slug === slug))
    .filter((e): e is EntryCardData => Boolean(e))
    .slice(0, 3);

  const title = q
    ? `Treffer für „${deferred.trim()}“`
    : activeCategory
      ? activeCategory.name
      : buchstabe
        ? `Begriffe mit ${buchstabe}`
        : 'Alle Begriffe, alphabetisch';

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease: EASE }}>
      <section className="bg-cream">
        <Container className="grid items-center gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-16">
          <div className="flex flex-col gap-5">
            <Eyebrow>{`Lexikon · ${entries.length} Begriffe · ${categories.length} Bereiche`}</Eyebrow>
            <h1 className="font-display text-balance text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Fachbegriffe, die dir Entscheidungen abnehmen.
            </h1>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-body">
              Jeder Eintrag beantwortet dieselben vier Fragen: Was ist das, was kostet es, wie läuft es ab – und betrifft es mein Haus?
            </p>
            <div className="flex flex-col gap-3">
              <label className="flex h-14 items-center gap-3 rounded-pill bg-white px-5 shadow-card ring-1 ring-hairline focus-within:ring-2 focus-within:ring-brand">
                <Search className="size-5 shrink-0 text-body" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Begriff, Synonym oder Thema suchen …"
                  aria-label="Lexikon durchsuchen"
                  autoComplete="off"
                  enterKeyHint="search"
                  className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-body [&::-webkit-search-cancel-button]:hidden"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Suche leeren"
                    className="grid size-8 place-items-center rounded-pill bg-cream text-ink hover:bg-lime"
                  >
                    <X className="size-4" />
                  </button>
                ) : (
                  <kbd className="hidden rounded-md bg-cream px-2 py-0.5 text-meta font-semibold text-body sm:inline" aria-hidden="true">
                    /
                  </kbd>
                )}
              </label>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-body">Häufig gesucht:</span>
                {QUICK_TERMS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setQuery(term);
                      inputRef.current?.focus();
                    }}
                    className="rounded-pill bg-white px-3 py-1 font-semibold text-ink ring-1 ring-hairline transition-colors hover:bg-lime hover:ring-lime"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden flex-col gap-3 lg:flex" aria-label="Ausgewählte Einträge">
            {featuredEntries.map((e, index) => (
              <motion.div
                key={e.slug}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
                className={cn(index === 1 && 'lg:ml-8', index === 2 && 'lg:ml-16')}
              >
                <Link
                  href={`/lexikon/${e.slug}`}
                  className="group flex flex-col gap-2 rounded-card bg-white p-5 shadow-card ring-1 ring-hairline transition-shadow hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-meta font-semibold uppercase tracking-wider text-brand">{e.kategorieName}</span>
                    <RelevanzBadge relevanz={e.relevanz} />
                  </div>
                  <p className="font-display text-lg font-bold text-ink">{e.begriff}</p>
                  <p className="line-clamp-2 text-sm leading-relaxed text-body">{e.kurz}</p>
                  <span className="inline-flex items-center gap-1 text-meta font-semibold text-ink">
                    Eintrag öffnen <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section id="begriffe" aria-labelledby="ergebnis-titel" className="scroll-mt-24 bg-white pb-16 pt-10 lg:pb-24">
        <Container className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-meta font-semibold uppercase tracking-wider text-brand">{hasFilter ? 'Gefiltert' : 'Glossar'}</p>
              <h2 id="ergebnis-titel" className="font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
                {title}
              </h2>
            </div>
            <p className="text-sm text-body" aria-live="polite">
              <strong className="text-ink">{results.length}</strong> von {entries.length} Begriffen
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-card bg-cream p-4" role="group" aria-label="Lexikon filtern">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="w-12 shrink-0 text-meta font-semibold uppercase tracking-wider text-body">Bereich</span>
              <button
                type="button"
                aria-pressed={kategorie === null}
                className={chipClass(kategorie === null)}
                onClick={() => {
                  setKategorie(null);
                  setBuchstabe(null);
                }}
              >
                Alle <span className="text-meta opacity-70">{entries.length}</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  aria-pressed={kategorie === c.slug}
                  className={chipClass(kategorie === c.slug)}
                  onClick={() => {
                    setKategorie(kategorie === c.slug ? null : c.slug);
                    setBuchstabe(null);
                  }}
                >
                  {c.name} <span className="text-meta opacity-70">{c.count}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="w-12 shrink-0 text-meta font-semibold uppercase tracking-wider text-body">A–Z</span>
              {letters.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  aria-pressed={buchstabe === letter}
                  aria-label={`Begriffe mit ${letter}`}
                  disabled={!availableLetters.has(letter)}
                  onClick={() => setBuchstabe(buchstabe === letter ? null : letter)}
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-35',
                    buchstabe === letter ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-lime disabled:hover:bg-white',
                  )}
                >
                  {letter}
                </button>
              ))}
              {hasFilter && (
                <button type="button" onClick={reset} className={cn(chipClass(false), 'ml-auto')}>
                  <X className="size-3.5" aria-hidden="true" /> Zurücksetzen
                </button>
              )}
            </div>
          </div>

          <LayoutGroup>
            <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {results.map((e) => (
                  <motion.div
                    key={e.slug}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
                    transition={{ layout: { duration: 0.45, ease: EASE }, duration: 0.4, ease: EASE }}
                    className="flex min-w-0"
                  >
                    <EntryCard e={e} query={q ? deferred.trim() : undefined} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>

          <AnimatePresence>
            {results.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-start gap-4 rounded-card bg-lime-soft p-8"
              >
                <h3 className="font-display text-2xl font-bold text-ink">Dazu haben wir noch keinen Eintrag.</h3>
                <p className="max-w-2xl leading-relaxed text-body">
                  Du musst den Begriff nicht kennen, um Hilfe zu bekommen. Beschreib dein Anliegen in eigenen Worten – Einordnung, Kostenrahmen und
                  Ansprechpartner kommen von uns.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/#anliegen"
                    className="inline-flex h-11 items-center gap-2 rounded-pill bg-ink px-5 text-sm font-semibold text-white hover:bg-brand-deep"
                  >
                    Anliegen beschreiben <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                  <button type="button" onClick={reset} className={chipClass(false)}>
                    Alle Begriffe zeigen
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Container>
      </section>
    </MotionConfig>
  );
}
