'use client';

/**
 * Client-Bausteine der Lexikon-Detailseite. Nur transform/opacity, reduced-motion-fähig.
 * Ohne JavaScript sind alle Inhalte vollständig sichtbar – Bewegung kommt obendrauf.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MotionConfig, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { STUFE_LABEL, type Stufe } from '@/lib/lexikon';
import { cn } from '@/design-system/site';

const EASE = [0.22, 1, 0.36, 1] as const;

export function DetailMotionConfig({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease: EASE }}>
      {children}
    </MotionConfig>
  );
}

/** Lesefortschritt als schmale Linie am oberen Rand. */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1" aria-hidden="true">
      <motion.span className="block h-full origin-left bg-lime" style={{ scaleX }} />
    </div>
  );
}

/** Drei Orientierungsstufen als segmentierte Balken, die beim Eintritt füllen. */
export function Gauges({ stufen }: { stufen: { kosten: Stufe; aufwand: Stufe; dringlichkeit: Stufe } }) {
  const rows: Array<{ label: string; value: Stufe; hot: boolean }> = [
    { label: 'Kosten', value: stufen.kosten, hot: false },
    { label: 'Aufwand', value: stufen.aufwand, hot: false },
    { label: 'Dringlichkeit', value: stufen.dringlichkeit, hot: stufen.dringlichkeit >= 3 },
  ];
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, rowIndex) => (
        <div
          key={row.label}
          role="img"
          aria-label={`${row.label}: ${STUFE_LABEL[row.value]} (Stufe ${row.value} von 4)`}
          className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3"
        >
          <span className="text-meta font-semibold text-white/75">{row.label}</span>
          <span className="grid grid-cols-4 gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <span key={n} className="h-2 overflow-hidden rounded-pill bg-white/10">
                {n <= row.value && (
                  <motion.span
                    className={cn('block h-full origin-left', row.hot ? 'bg-coral' : 'bg-lime')}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, margin: '-10% 0px' }}
                    transition={{ duration: 0.4, ease: EASE, delay: 0.2 + rowIndex * 0.12 + n * 0.06 }}
                  />
                )}
              </span>
            ))}
          </span>
          <span className="w-16 text-right text-sm font-bold text-white">{STUFE_LABEL[row.value]}</span>
        </div>
      ))}
    </div>
  );
}

/** Sticky-Inhaltsverzeichnis mit Scroll-Spy (IntersectionObserver). */
export function Toc({ items }: { items: ReadonlyArray<{ id: string; label: string }> }) {
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const elements = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0, 1] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Inhalt dieses Eintrags" className="hidden lg:block">
      <div className="sticky top-28 flex flex-col gap-6">
        <div className="flex flex-col gap-1 border-l border-hairline">
          <p className="mb-2 pl-4 text-meta font-semibold uppercase tracking-wider text-body">Auf dieser Seite</p>
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active === item.id ? 'true' : undefined}
              className="-ml-px border-l-2 border-transparent py-1.5 pl-4 text-sm text-body transition-colors hover:text-ink aria-[current=true]:border-brand aria-[current=true]:font-semibold aria-[current=true]:text-ink"
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-2 rounded-card bg-lime-soft p-5 text-sm leading-relaxed text-body">
          <strong className="font-display text-base text-ink">Betrifft dich das?</strong>
          Beschreib dein Anliegen – Einordnung und Kostenrahmen kommen von uns.
          <Link href="/#anliegen" className="inline-flex items-center gap-1.5 font-semibold text-ink hover:underline">
            Anliegen beschreiben <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

/** Vertikale Ablauf-Timeline: Schiene füllt sich mit dem Scroll, Schritte aktivieren sich in der Lesezone. */
export function AblaufTimeline({ items }: { items: ReadonlyArray<{ title: string; text: string }> }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 55%'] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState<number>(-1);
  const step = useTransform(scrollYProgress, (value) => Math.min(items.length - 1, Math.floor(value * items.length + 0.15)));
  const active = reduce ? items.length - 1 : scrolled;

  useEffect(() => {
    if (reduce) return;
    const unsubscribe = step.on('change', (value) => setScrolled(value));
    return () => unsubscribe();
  }, [step, reduce]);

  return (
    <ol ref={ref} className="relative flex flex-col gap-4 pl-12">
      <span className="absolute bottom-4 left-[1.1rem] top-4 w-0.5 rounded-pill bg-hairline" aria-hidden="true" />
      <motion.span
        className="absolute bottom-4 left-[1.1rem] top-4 w-0.5 origin-top rounded-pill bg-brand"
        style={{ scaleY: reduce ? 1 : scaleY }}
        aria-hidden="true"
      />
      {items.map((item, index) => {
        const isActive = index <= active;
        return (
          <motion.li
            key={item.title}
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.5, ease: EASE, delay: index * 0.05 }}
            className="relative rounded-card bg-cream p-5"
          >
            <span
              className={cn(
                'absolute -left-12 top-5 grid size-9 place-items-center rounded-xl font-display text-sm font-bold transition-colors',
                isActive ? 'bg-ink text-lime' : 'bg-white text-body ring-1 ring-hairline',
              )}
              aria-hidden="true"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="font-display text-lg font-bold text-ink">{item.title}</h3>
            <p className="mt-1 leading-relaxed text-body">{item.text}</p>
          </motion.li>
        );
      })}
    </ol>
  );
}

/** Prüfpunkte als abhakbare Liste – der Fortschritt führt zum konkreten nächsten Schritt. */
export function Checklist({ items }: { items: readonly string[] }) {
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));
  const count = done.filter(Boolean).length;
  const ratio = items.length ? count / items.length : 0;
  const toggle = (index: number) => setDone((current) => current.map((value, i) => (i === index ? !value : value)));

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <motion.button
          key={item}
          type="button"
          aria-pressed={done[index]}
          onClick={() => toggle(index)}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-8% 0px' }}
          transition={{ duration: 0.45, ease: EASE, delay: index * 0.05 }}
          whileTap={{ scale: 0.99 }}
          className="group flex items-start gap-4 rounded-2xl bg-white p-4 text-left ring-1 ring-hairline transition-colors hover:ring-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand aria-pressed:bg-lime-soft aria-pressed:ring-lime-strong"
        >
          <span
            className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-cream text-ink ring-1 ring-hairline group-aria-pressed:bg-lime group-aria-pressed:ring-lime"
            aria-hidden="true"
          >
            <motion.span initial={false} animate={{ scale: done[index] ? 1 : 0, opacity: done[index] ? 1 : 0 }} className="inline-flex">
              <Check className="size-3.5" strokeWidth={3} />
            </motion.span>
          </span>
          <span className="leading-relaxed text-ink">{item}</span>
        </motion.button>
      ))}
      <div className="mt-2 flex flex-col gap-3 rounded-2xl bg-cream p-5" aria-live="polite">
        <strong className="font-display text-ink">
          {count === 0
            ? 'Hak ab, was auf dein Haus zutrifft.'
            : count === items.length
              ? 'Alle Punkte treffen zu – das ist ein klares Anliegen.'
              : `${count} von ${items.length} Punkten treffen zu.`}
        </strong>
        <span className="h-2 overflow-hidden rounded-pill bg-white" aria-hidden="true">
          <span className="block h-full origin-left rounded-pill bg-brand transition-transform duration-500" style={{ transform: `scaleX(${ratio})` }} />
        </span>
        {count > 0 && (
          <Link href="/#anliegen" className="inline-flex items-center gap-1.5 font-semibold text-ink hover:underline">
            Als Anliegen beschreiben <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
