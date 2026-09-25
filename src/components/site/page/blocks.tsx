/**
 * Unterseiten-Bausteine der Website (Designsystem 1.1 · Website-Baukasten).
 *
 * Komponiert ausschließlich aus @/design-system/site und den Theme-Tokens aus
 * src/app/globals.css. Bewegung kommt aus der vorhandenen Motion-Schicht
 * (Reveal/Stagger): kurz, endlich, nur transform/opacity, reduced-motion zeigt
 * sofort den Endzustand, ohne JavaScript ist nichts versteckt.
 *
 * Abwechslung zwischen Seiten entsteht über Tonalität (cream/white/dark), Layout
 * (split/center) und den Inhalt der Bildseite – nicht über neue Farben oder Stile.
 */
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, Info, type LucideIcon } from 'lucide-react';
import { Reveal, Stagger } from '@/components/marketing/motion';
import { ButtonLink, CheckList, Container, ExampleBadge, Eyebrow, SectionHeading, cn, houseEdgeClass } from '@/design-system/site';
import { OWNER_ASSURANCES, PARTNER_ASSURANCES } from './assurances';

type Tone = 'white' | 'cream' | 'dark';

const sectionTone: Record<Tone, string> = {
  white: 'bg-white text-ink',
  cream: 'bg-cream text-ink',
  dark: 'bg-brand-deep text-white',
};

const heroTone: Record<Tone, string> = {
  cream: 'bg-cream',
  white: 'border-b border-hairline bg-white',
  dark: 'bg-brand-deep',
};

/** Belegte Zusagen, Quelle und Regeln in ./assurances.ts. */
export { OWNER_ASSURANCES, PARTNER_ASSURANCES };

/** Entlastung direkt am Handlungsort: beantwortet „Was kostet mich das?“, bevor jemand zögert. */
export function AssuranceList({
  items,
  tone = 'light',
  align = 'left',
  className,
}: {
  items: readonly string[];
  tone?: 'light' | 'dark';
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <ul className={cn('flex flex-wrap gap-x-6 gap-y-2', align === 'center' && 'justify-center', className)}>
      {items.map((item) => (
        <li key={item} className={cn('flex items-center gap-2 text-sm font-semibold', tone === 'light' ? 'text-ink' : 'text-white/85')}>
          <span className="grid size-5 shrink-0 place-items-center rounded-pill bg-lime text-ink" aria-hidden="true">
            <Check className="size-3" strokeWidth={3} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function PageHero({
  eyebrow,
  title,
  text,
  actions,
  notice,
  aside,
  children,
  tone = 'cream',
  layout = 'split',
  assurances,
}: {
  eyebrow: string;
  title: React.ReactNode;
  text: React.ReactNode;
  actions?: React.ReactNode;
  /** Shown before the buttons, so a warning is read before the next step. */
  notice?: React.ReactNode;
  aside?: React.ReactNode;
  /** Split: unter dem Text. Center: volle Breite unter dem Kopf (z. B. Einstiegskacheln). */
  children?: React.ReactNode;
  tone?: Tone;
  layout?: 'split' | 'center';
  assurances?: readonly string[];
}) {
  const dark = tone === 'dark';
  const centered = layout === 'center';
  const split = Boolean(aside) && !centered;
  const layoutClass = split ? 'items-center lg:grid-cols-[1.1fr_0.9fr] lg:gap-16' : centered ? 'gap-10 lg:gap-14' : 'max-w-5xl';

  return (
    <section className={heroTone[tone]}>
      <Container className={cn('grid gap-12 py-14 lg:py-20', layoutClass)}>
        <Reveal y={16} className={cn('flex flex-col gap-6', centered && 'mx-auto max-w-4xl items-center text-center')}>
          <Eyebrow tone={dark ? 'dark' : 'light'}>{eyebrow}</Eyebrow>
          <h1
            className={cn(
              'font-display text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl',
              dark ? 'text-white' : 'text-ink',
            )}
          >
            {title}
          </h1>
          <p className={cn('max-w-2xl text-pretty text-lg leading-relaxed sm:text-xl', dark ? 'text-white/75' : 'text-body')}>{text}</p>
          {notice}
          {actions && <div className={cn('flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap', centered && 'sm:justify-center')}>{actions}</div>}
          {assurances && assurances.length > 0 && (
            <AssuranceList items={assurances} tone={dark ? 'dark' : 'light'} align={centered ? 'center' : 'left'} className="pt-1" />
          )}
          {!centered && children}
        </Reveal>
        {centered && children && (
          <Reveal y={24} delay={0.1}>
            {children}
          </Reveal>
        )}
        {aside && (
          <Reveal y={24} delay={0.15} className={cn(centered && 'mx-auto w-full max-w-3xl')}>
            {aside}
          </Reveal>
        )}
      </Container>
    </section>
  );
}

export function Section({
  tone = 'white',
  id,
  children,
  className,
}: {
  tone?: Tone;
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn('scroll-mt-24 py-16 lg:py-24', sectionTone[tone], className)}>
      <Container className="flex flex-col gap-10 lg:gap-14">{children}</Container>
    </section>
  );
}

export function Heading(props: React.ComponentProps<typeof SectionHeading>) {
  return (
    <Reveal y={16}>
      <SectionHeading {...props} />
    </Reveal>
  );
}

/**
 * Aktenumschlag: Beispielkarte mit Hauskante und Registerlinien. Klar als Beispiel
 * gekennzeichnet, keine echten Kundendaten. `dark` auf hellen Flächen, `light` auf dunklen.
 */
export function ExampleCard({
  label,
  title,
  rows,
  note,
  tone = 'dark',
}: {
  label: string;
  title: string;
  rows: ReadonlyArray<{ title: string; text: string }>;
  note?: string;
  tone?: 'dark' | 'light';
}) {
  const dark = tone === 'dark';
  return (
    <figure className={cn('flex flex-col gap-6 rounded-card p-7 sm:p-9', houseEdgeClass, dark ? 'bg-brand-deep text-white' : 'bg-white text-ink shadow-card')}>
      <figcaption className={cn('flex items-center gap-3 pr-10 text-meta font-semibold uppercase tracking-wider', dark ? 'text-lime' : 'text-brand')}>
        <span className={cn('h-0.5 w-6 shrink-0', dark ? 'bg-lime' : 'bg-brand')} aria-hidden="true" />
        {label}
      </figcaption>
      <p className={cn('font-display text-2xl font-bold leading-snug sm:text-3xl', dark ? 'text-white' : 'text-ink')}>{title}</p>
      <Stagger className={cn('flex flex-col border-t', dark ? 'border-white/15' : 'border-hairline')} y={12}>
        {rows.map((row, index) => (
          <div key={row.title} className={cn('grid grid-cols-[2.25rem_1fr] gap-3 border-b py-4', dark ? 'border-white/15' : 'border-hairline')}>
            <span className={cn('font-display text-base font-bold tabular-nums', dark ? 'text-lime' : 'text-brand')} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div className="flex flex-col gap-1">
              <p className={cn('font-semibold', dark ? 'text-white' : 'text-ink')}>{row.title}</p>
              <p className={cn('leading-relaxed', dark ? 'text-white/70' : 'text-body')}>{row.text}</p>
            </div>
          </div>
        ))}
      </Stagger>
      {note && <p className={cn('text-meta', dark ? 'text-white/65' : 'text-body')}>{note}</p>}
    </figure>
  );
}

/**
 * Hero-Bild mit Hauskante und optionaler Notiz über dem Bild. Die Notiz ist kein Bedienelement
 * und liegt bewusst außerhalb der geschnittenen Ecke. Illustrative Bildwelt bleibt gekennzeichnet.
 */
export function HeroPhoto({
  src,
  alt,
  priority = true,
  caption = 'Illustrative Bildwelt, keine Kundenaussage.',
  tone = 'light',
  badge,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  caption?: string | null;
  tone?: 'light' | 'dark';
  badge?: { label: string; title: string; icon?: LucideIcon };
}) {
  const BadgeIcon = badge?.icon ?? Check;
  return (
    <figure className="flex flex-col gap-3">
      <div className="relative">
        <div className={cn('relative aspect-[4/5] w-full overflow-hidden rounded-card sm:aspect-[6/5] lg:aspect-[4/5]', houseEdgeClass)}>
          <Image src={src} alt={alt} fill priority={priority} sizes="(min-width: 1024px) 42vw, 100vw" className="object-cover" />
        </div>
        {badge && (
          <div className="absolute -bottom-6 left-4 right-4 flex items-start gap-3 rounded-card bg-white p-4 shadow-lift ring-1 ring-hairline sm:left-6 sm:right-auto sm:max-w-sm sm:p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-lime text-ink" aria-hidden="true">
              <BadgeIcon className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-meta font-semibold uppercase tracking-wider text-brand">{badge.label}</span>
              <span className="font-display text-base font-bold leading-snug text-ink sm:text-lg">{badge.title}</span>
            </div>
          </div>
        )}
      </div>
      {caption && <figcaption className={cn('text-meta', badge && 'pt-6', tone === 'dark' ? 'text-white/65' : 'text-body')}>{caption}</figcaption>}
    </figure>
  );
}

/**
 * Einstieg nach Absicht statt nach Gewerk: drei große Kacheln statt zwölf Kategorien.
 * Weniger Auswahl am Anfang, der erste Satz ist vorbereitet.
 */
export function IntentTiles({
  items,
}: {
  items: ReadonlyArray<{ icon: LucideIcon; title: string; text: string; href: string; accent?: 'lime' | 'brand' | 'coral' }>;
}) {
  const accents = { lime: 'bg-lime text-ink', brand: 'bg-brand-soft text-brand', coral: 'bg-coral-soft text-coral' } as const;
  return (
    <Stagger className="grid gap-4 text-left md:grid-cols-3" y={20} gap={0.06}>
      {items.map(({ icon: Icon, title, text, href, accent = 'lime' }) => (
        <Link
          key={href}
          href={href}
          className="group flex h-full flex-col gap-5 rounded-card bg-white p-6 shadow-card ring-1 ring-hairline transition-[box-shadow,translate] duration-200 hover:shadow-lift motion-safe:hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-7"
        >
          <span className={cn('grid size-14 place-items-center rounded-2xl', accents[accent])} aria-hidden="true">
            <Icon className="size-7" />
          </span>
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-2xl font-bold leading-tight text-ink">{title}</h2>
            <p className="leading-relaxed text-body">{text}</p>
          </div>
          <span className="mt-auto inline-flex items-center gap-2 font-semibold text-brand transition-colors group-hover:text-ink">
            Damit starten
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>
      ))}
    </Stagger>
  );
}

const STEP_BREAKPOINTS = {
  md: {
    item: 'md:flex-col md:gap-6',
    line: 'md:left-15 md:top-6 md:-mt-px md:ml-0 md:h-0 md:w-[calc(100%_-_2.5rem)] md:border-l-0 md:border-t-2',
    body: 'md:pt-0',
  },
  lg: {
    item: 'lg:flex-col lg:gap-6',
    line: 'lg:left-15 lg:top-6 lg:-mt-px lg:ml-0 lg:h-0 lg:w-[calc(100%_-_2.5rem)] lg:border-l-0 lg:border-t-2',
    body: 'lg:pt-0',
  },
} as const;
const STEP_COLUMNS: Record<number, string> = { 2: 'md:grid-cols-2 md:gap-8', 3: 'md:grid-cols-3 md:gap-8', 4: 'lg:grid-cols-4 lg:gap-8' };

/** Ablauf als Weg: nummerierte Stationen mit Verbindungslinie statt gleichförmiger Karten. */
export function StepList({
  steps,
  tone = 'light',
}: {
  steps: ReadonlyArray<{ title: string; text: React.ReactNode }>;
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  const horizontal = steps.length >= 2 && steps.length <= 4;
  const bp = steps.length === 4 ? STEP_BREAKPOINTS.lg : STEP_BREAKPOINTS.md;
  const last = steps.length - 1;

  return (
    <Stagger className={cn('grid gap-10', horizontal && STEP_COLUMNS[steps.length])} y={20}>
      {steps.map((step, index) => (
        <div key={step.title} className={cn('relative flex gap-5', horizontal && bp.item)}>
          {index < last && (
            <span
              aria-hidden="true"
              className={cn(
                'absolute left-6 top-15 -ml-px h-[calc(100%_-_2rem)] border-l-2 border-dashed',
                dark ? 'border-lime/40' : 'border-brand/30',
                horizontal && bp.line,
              )}
            />
          )}
          <span
            className={cn(
              'grid size-12 shrink-0 place-items-center rounded-pill font-display text-lg font-bold tabular-nums',
              dark ? 'bg-lime text-ink' : 'bg-ink text-lime',
            )}
            aria-hidden="true"
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className={cn('flex flex-col gap-2 pt-2.5', horizontal && bp.body)}>
            <h3 className={cn('font-display text-xl font-bold leading-snug', dark ? 'text-white' : 'text-ink')}>{step.title}</h3>
            <p className={cn('max-w-md leading-relaxed', dark ? 'text-white/75' : 'text-body')}>{step.text}</p>
          </div>
        </div>
      ))}
    </Stagger>
  );
}

export function FeatureCards({
  items,
  tone = 'light',
  columns = 3,
  variant = 'cards',
}: {
  items: ReadonlyArray<{ title: string; text: React.ReactNode; icon?: LucideIcon }>;
  tone?: 'light' | 'dark';
  columns?: 2 | 3;
  /** `register`: Registerlinien statt Kartenraster – für Prinzipien und Regeln. */
  variant?: 'cards' | 'register';
}) {
  const dark = tone === 'dark';

  if (variant === 'register') {
    return (
      <Stagger className={cn('grid gap-x-12', columns === 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2')} y={16}>
        {items.map(({ title, text, icon: Icon }, index) => (
          <div key={title} className={cn('flex gap-5 border-t-2 py-7', dark ? 'border-white/15' : 'border-ink/10')}>
            <span
              className={cn('grid size-11 shrink-0 place-items-center rounded-xl', dark ? 'bg-lime text-ink' : 'bg-ink text-lime')}
              aria-hidden="true"
            >
              {Icon ? <Icon className="size-5" /> : <span className="font-display text-base font-bold tabular-nums">{String(index + 1).padStart(2, '0')}</span>}
            </span>
            <div className="flex flex-col gap-2">
              <h3 className={cn('font-display text-lg font-bold leading-snug', dark ? 'text-white' : 'text-ink')}>{title}</h3>
              <p className={cn('leading-relaxed', dark ? 'text-white/75' : 'text-body')}>{text}</p>
            </div>
          </div>
        ))}
      </Stagger>
    );
  }

  return (
    <Stagger className={cn('grid gap-5', columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')} y={20}>
      {items.map(({ title, text, icon: Icon }) => (
        <div
          key={title}
          className={cn('flex h-full flex-col gap-3 rounded-card p-7', dark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-white ring-1 ring-hairline')}
        >
          {Icon && (
            <span
              className={cn('mb-2 grid size-12 place-items-center rounded-2xl', dark ? 'bg-lime text-ink' : 'bg-brand-soft text-brand')}
              aria-hidden="true"
            >
              <Icon className="size-6" />
            </span>
          )}
          <h3 className={cn('font-display text-lg font-bold leading-snug', dark ? 'text-white' : 'text-ink')}>{title}</h3>
          <p className={cn('leading-relaxed', dark ? 'text-white/75' : 'text-body')}>{text}</p>
        </div>
      ))}
    </Stagger>
  );
}

export function LinkCards({
  items,
  columns = 3,
  variant = 'card',
}: {
  items: ReadonlyArray<{ label?: string; title: string; text?: string; href: string; icon?: LucideIcon }>;
  columns?: 2 | 3 | 4;
  /** `prompt`: Beispielsätze als Nachricht mit „Übernehmen“ – nimmt die Angst vor dem leeren Feld. */
  variant?: 'card' | 'prompt';
}) {
  const grid = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[columns];

  if (variant === 'prompt') {
    return (
      <Stagger className={cn('grid gap-4', grid)} y={16} gap={0.05}>
        {items.map(({ label, title, text, href }) => (
          <Link
            key={href + title}
            href={href}
            className="group flex h-full flex-col gap-4 rounded-card rounded-bl-md bg-cream p-6 transition-colors hover:bg-lime-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {label && <span className="text-meta font-semibold uppercase tracking-wider text-brand">{label}</span>}
            <p className="font-display text-xl font-bold leading-snug text-ink">{title}</p>
            <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-pill bg-white px-4 py-2 text-sm font-semibold text-ink ring-1 ring-hairline transition-colors group-hover:bg-ink group-hover:text-white group-hover:ring-ink">
              {text ?? 'Übernehmen'}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </Stagger>
    );
  }

  return (
    <Stagger className={cn('grid gap-4', grid)} y={16} gap={0.05}>
      {items.map(({ label, title, text, href, icon: Icon }) => (
        <Link
          key={href + title}
          href={href}
          className="group flex h-full flex-col gap-3 rounded-card bg-white p-6 ring-1 ring-hairline transition-[box-shadow,translate] duration-200 hover:shadow-lift motion-safe:hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <div className="mb-1 flex items-start justify-between gap-4">
            {Icon ? (
              <span
                className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand transition-colors group-hover:bg-lime group-hover:text-ink"
                aria-hidden="true"
              >
                <Icon className="size-6" />
              </span>
            ) : (
              label && <span className="pt-2 text-meta font-semibold uppercase tracking-wider text-brand">{label}</span>
            )}
            <span
              className="grid size-9 shrink-0 place-items-center rounded-pill bg-cream text-ink transition-colors group-hover:bg-ink group-hover:text-lime"
              aria-hidden="true"
            >
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          {Icon && label && <span className="text-meta font-semibold uppercase tracking-wider text-brand">{label}</span>}
          <h3 className="font-display text-lg font-bold leading-snug text-ink">{title}</h3>
          {text && <p className="text-sm leading-relaxed text-body">{text}</p>}
        </Link>
      ))}
    </Stagger>
  );
}

/** Ehrliche Grenzen: gehören sichtbar zur Seite, nicht ins Kleingedruckte. */
export function HonestLimits({ title = 'Ehrlich eingeordnet', items }: { title?: string; items: readonly React.ReactNode[] }) {
  return (
    <Reveal y={16}>
      <div className="grid gap-8 rounded-card bg-lime-soft p-7 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div className="flex flex-col gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-ink text-lime" aria-hidden="true">
            <Info className="size-5" />
          </span>
          <h3 className="font-display text-2xl font-bold leading-tight text-ink">{title}</h3>
          <p className="leading-relaxed text-body">Keine Versprechen, die wir nicht halten können. Damit du weißt, worauf du dich verlassen kannst.</p>
        </div>
        <ul className="flex flex-col divide-y divide-ink/10">
          {items.map((item, index) => (
            <li key={index} className="py-4 leading-relaxed text-ink first:pt-0 last:pb-0">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

/**
 * Seitenabschluss. `points` macht daraus eine Entscheidungsfläche: links die Handlung,
 * rechts die belegten Antworten auf die letzten Zweifel. `dark` für Seiten mit hellem Kopf.
 */
export function ClosingCta({
  title,
  text,
  primary,
  secondary,
  tone = 'lime',
  points,
}: {
  title: string;
  text: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
  tone?: 'lime' | 'dark';
  points?: readonly string[];
}) {
  const dark = tone === 'dark';
  const split = Boolean(points && points.length > 0);

  return (
    <section className="bg-white py-16 lg:py-24">
      <Container>
        <Reveal y={24}>
          <div
            className={cn(
              'rounded-card px-6 py-14 sm:px-12 lg:py-20',
              houseEdgeClass,
              dark ? 'bg-brand-deep' : 'bg-lime',
              split ? 'lg:px-16' : 'text-center',
            )}
          >
            <div className={cn(split ? 'grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16' : 'mx-auto flex max-w-3xl flex-col items-center')}>
              <div className={cn('flex flex-col gap-6', split ? 'items-start' : 'items-center')}>
                <h2 className={cn('font-display text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl', dark ? 'text-white' : 'text-ink')}>
                  {title}
                </h2>
                <p className={cn('max-w-xl text-pretty text-lg', dark ? 'text-white/75' : 'text-ink/75')}>{text}</p>
                <div className="flex flex-col items-center gap-3 sm:flex-row">
                  <Link
                    href={primary.href}
                    className={cn(
                      'group inline-flex h-14 items-center justify-center gap-2 rounded-pill px-7 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                      dark ? 'bg-lime text-ink hover:bg-lime-strong focus-visible:outline-lime' : 'bg-ink text-white hover:bg-brand-deep focus-visible:outline-ink',
                    )}
                  >
                    {primary.label}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                  {secondary && (
                    <Link
                      href={secondary.href}
                      className={cn('inline-flex h-14 items-center gap-2 px-4 font-semibold hover:underline', dark ? 'text-white' : 'text-ink')}
                    >
                      {secondary.label} <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>
              {split && points && (
                <ul
                  className={cn(
                    'flex flex-col divide-y rounded-card p-6 sm:p-8',
                    dark ? 'divide-white/15 bg-white/5 ring-1 ring-white/10' : 'divide-hairline bg-white shadow-card',
                  )}
                >
                  {points.map((point) => (
                    <li key={point} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                      <span
                        className={cn('grid size-9 shrink-0 place-items-center rounded-pill', dark ? 'bg-lime text-ink' : 'bg-ink text-lime')}
                        aria-hidden="true"
                      >
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                      <span className={cn('font-display text-lg font-bold leading-snug', dark ? 'text-white' : 'text-ink')}>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/** Sicherheits- und Hinweisflächen. `warn` nur für echte Gefahrenhinweise (Notruf). */
export function AlertPanel({
  tone = 'info',
  icon: Icon = Info,
  title,
  children,
}: {
  tone?: 'info' | 'warn';
  icon?: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === 'warn' ? 'note' : undefined}
      className={cn('flex h-full gap-4 rounded-card p-6 sm:p-7', tone === 'warn' ? 'bg-coral-soft text-ink' : 'bg-white ring-1 ring-hairline')}
    >
      <span
        className={cn('grid size-11 shrink-0 place-items-center rounded-xl', tone === 'warn' ? 'bg-coral text-white' : 'bg-brand-soft text-brand')}
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="font-display text-lg font-bold leading-snug text-ink">{title}</p>
        <div className="leading-relaxed text-body">{children}</div>
      </div>
    </div>
  );
}

/** Bild mit Hauskante neben Textinhalt. Illustrative Bildwelt wird sichtbar gekennzeichnet. */
export function ImageSplit({
  src,
  alt,
  reverse,
  note = 'Illustrative Bildwelt, keine Kundenaussage.',
  children,
}: {
  src: string;
  alt: string;
  reverse?: boolean;
  note?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
      <Reveal y={24} className={cn('relative aspect-[4/5] w-full lg:aspect-[5/6]', reverse && 'lg:order-2')}>
        <div className={cn('absolute inset-0 overflow-hidden rounded-card', houseEdgeClass)}>
          <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
        </div>
      </Reveal>
      <div className="flex flex-col gap-6">
        {children}
        {note && <p className="text-meta text-body">{note}</p>}
      </div>
    </div>
  );
}

/** Lesefläche für Rechtstexte und lange Artikel: ruhige Zeilenlänge, klare Zwischenüberschriften. */
export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'max-w-3xl text-lg leading-relaxed text-body',
        '[&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:text-ink first:[&_h2]:mt-0',
        '[&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-ink',
        '[&_p]:mt-4 [&_ul]:mt-4 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-6 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6',
        '[&_strong]:font-semibold [&_strong]:text-ink [&_address]:mt-4 [&_address]:not-italic',
        '[&_a]:font-semibold [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-ink',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Kennzahlen-Leiste für klare Regeln (0 €, 0 %, …). Nur belegte Produktfakten, keine Marketingzahlen. */
export function FactStrip({ items, tone = 'dark' }: { items: ReadonlyArray<{ value: string; label: string }>; tone?: 'light' | 'dark' }) {
  return (
    <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" y={16}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn('flex h-full flex-col gap-2 rounded-card p-7', tone === 'dark' ? 'bg-white/5 ring-1 ring-white/10' : 'bg-white ring-1 ring-hairline')}
        >
          <p className={cn('font-display text-5xl font-bold tracking-tight', tone === 'dark' ? 'text-lime' : 'text-brand')}>{item.value}</p>
          <p className={cn('leading-relaxed', tone === 'dark' ? 'text-white/80' : 'text-body')}>{item.label}</p>
        </div>
      ))}
    </Stagger>
  );
}

/** Wiedererkennbare Alltagssituationen. Ausdrücklich keine Kundenzitate, daher ohne Namen und Porträts. */
export function SituationCards({ items }: { items: ReadonlyArray<{ tag: string; text: string }> }) {
  return (
    <Stagger className="grid gap-5 md:grid-cols-3" y={20}>
      {items.map((item) => (
        <figure key={item.tag} className="flex h-full flex-col gap-4 rounded-card rounded-bl-md bg-cream p-7">
          <figcaption className="text-meta font-semibold uppercase tracking-wider text-brand">{item.tag}</figcaption>
          <blockquote className="font-display text-xl font-bold leading-snug text-ink">{`„${item.text}“`}</blockquote>
        </figure>
      ))}
    </Stagger>
  );
}

/** Kompakter Seitenkopf für Rechts- und Referenzseiten: ohne Bild, mit Stand-Angabe. */
/* ---------------------------------------------------------------------------
 * Seitenkompositionen 2026-09-25 (DESIGN.md § Website-Seitenkompositionen).
 * Gemeinsame Bausteine der Leistungs-, Produkt- und Vertrauensseiten. Routen
 * verwenden diese Bausteine statt lokaler Nachbauten.
 * ------------------------------------------------------------------------- */

export type PageMood = 'calm' | 'urgent' | 'careful' | 'value';

/** Dramaturgie → Hero-Ton: Dringendes dunkel, Sorgfalt weiß, Ruhe und Wert Creme. */
export const MOOD_HERO_TONE: Record<PageMood, Tone> = { calm: 'cream', urgent: 'dark', careful: 'white', value: 'cream' };

/** Pflichthinweis unter jeder generierten oder gestellten Bildwelt. */
export const ILLUSTRATIVE_IMAGE_NOTE = 'Illustrative Bildwelt, keine Kundenaussage.';

/** Nutzen-Karte mit belegten Punkten. `ink` auf hellem, `light` auf dunklem Hero. */
export function ProofPanel({
  label = 'Was du davon hast',
  title,
  text,
  points,
  tone = 'ink',
}: {
  label?: string;
  title: string;
  text: string;
  points: readonly string[];
  tone?: 'ink' | 'light';
}) {
  const light = tone === 'light';
  return (
    <div className={cn('flex flex-col gap-6 rounded-card p-7 shadow-lift sm:p-9', light ? 'bg-white text-ink' : 'bg-ink text-white')}>
      <p className={cn('text-meta font-semibold uppercase tracking-wider', light ? 'text-brand' : 'text-lime')}>{label}</p>
      <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
      <p className={cn('leading-relaxed', light ? 'text-body' : 'text-white/75')}>{text}</p>
      <CheckList items={points} tone={light ? 'light' : 'dark'} />
    </div>
  );
}

/** Breitbild mit Hauskante unter einem zentrierten Kopf. Immer mit Bildhinweis. */
export function WideFigure({
  src,
  alt,
  caption = ILLUSTRATIVE_IMAGE_NOTE,
  priority = false,
}: {
  src: string;
  alt: string;
  caption?: React.ReactNode;
  priority?: boolean;
}) {
  return (
    <figure className="flex flex-col gap-3">
      <div className={cn('relative aspect-[4/3] w-full overflow-hidden rounded-card sm:aspect-[21/9]', houseEdgeClass)}>
        <Image src={src} alt={alt} fill priority={priority} sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
      </div>
      <figcaption className="text-meta text-body">{caption}</figcaption>
    </figure>
  );
}

/** Drei belegte Kernaussagen als große, nummerierte Sätze. Nur in `Section tone="dark"`. */
export function NumberedPoints({ points }: { points: readonly string[] }) {
  return (
    <Stagger className="grid gap-x-10 md:grid-cols-3" y={16}>
      {points.map((point, index) => (
        <div key={point} className="flex flex-col gap-4 border-t-2 border-white/15 py-7">
          <span className="font-display text-base font-bold tabular-nums text-lime" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <p className="font-display text-xl font-bold leading-snug text-white">{point}</p>
        </div>
      ))}
    </Stagger>
  );
}

/**
 * Echte Produktansicht im Rahmen, mit Vollbild-Link. Nur auf dunklem Hero.
 * Beispieldaten im Bild müssen in `caption` benannt werden.
 */
export function ProductScreenshot({
  src,
  alt,
  width,
  height,
  caption,
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: React.ReactNode;
  priority?: boolean;
}) {
  return (
    <figure className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-card bg-white/5 p-2 ring-1 ring-white/10 sm:p-3">
        <Image src={src} alt={alt} width={width} height={height} priority={priority} sizes="(min-width: 1280px) 1200px, 100vw" className="h-auto w-full rounded-2xl" />
      </div>
      <figcaption className="text-meta text-white/65">
        {caption}{' '}
        <a href={src} target="_blank" rel="noreferrer" className="font-semibold text-lime underline underline-offset-4">
          Ansicht in voller Größe öffnen
        </a>
      </figcaption>
    </figure>
  );
}

/** Ein Prinzip mit nummerierten Schritten in einer Creme-Fläche, z. B. im zentrierten weißen Hero. */
export function ProcessPanel({ label, steps }: { label: string; steps: React.ComponentProps<typeof StepList>['steps'] }) {
  return (
    <div className="flex flex-col gap-8 rounded-card bg-cream p-7 text-left sm:p-10">
      <p className="flex items-center gap-3 text-meta font-semibold uppercase tracking-wider text-brand">
        <span className="h-0.5 w-6 shrink-0 bg-brand" aria-hidden="true" />
        {label}
      </p>
      <StepList steps={steps} />
    </div>
  );
}

/** Prüfkriterien oder Regeln als Icon-Zeilen mit Trennlinien – statt Kartenraster, wenn neben einem Bild. */
export function CheckRows({ items }: { items: ReadonlyArray<{ icon: LucideIcon; title: string; text: string }> }) {
  return (
    <Stagger className="flex flex-col divide-y divide-hairline" y={12}>
      {items.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand" aria-hidden="true">
            <Icon className="size-5" />
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="font-display text-lg font-bold leading-snug text-ink">{title}</h3>
            <p className="leading-relaxed text-body">{text}</p>
          </div>
        </div>
      ))}
    </Stagger>
  );
}

const asideGrid = {
  heading: 'lg:grid-cols-[0.8fr_1.2fr]',
  media: 'items-center lg:grid-cols-[0.95fr_1.05fr]',
} as const;

/**
 * Zweispaltige Komposition. `heading`: Abschnittskopf links, Inhalt rechts.
 * `media`: Beispiel oder Bild links (eingeblendet), Text und Aktionen rechts.
 */
export function AsideLayout({
  aside,
  children,
  variant = 'heading',
}: {
  aside: React.ReactNode;
  children: React.ReactNode;
  variant?: keyof typeof asideGrid;
}) {
  return (
    <div className={cn('grid gap-10 lg:gap-16', asideGrid[variant])}>
      {variant === 'media' ? <Reveal y={20}>{aside}</Reveal> : aside}
      <div className={cn('flex flex-col', variant === 'media' ? 'gap-6' : 'gap-4')}>{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Startseiten-Bausteine 2026-09-25 (DESIGN.md § Startseite und Login).
 * ------------------------------------------------------------------------- */

/**
 * Produktkapitel der Startseite: Text und Beispielansicht nebeneinander.
 * `mediaFirst` stellt die Beispielansicht ab `lg` nach links (Zickzack);
 * mobil steht der Text immer zuerst.
 */
export function FeatureSplit({
  id,
  tone = 'white',
  media,
  mediaFirst = false,
  footer,
  children,
}: {
  id: string;
  tone?: Tone;
  media: React.ReactNode;
  mediaFirst?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn('scroll-mt-24 py-20 lg:py-28', sectionTone[tone])}>
      <Container className="flex flex-col gap-16">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className={cn('flex flex-col gap-8', mediaFirst && 'lg:order-2')}>{children}</div>
          <div className={cn('min-w-0', mediaFirst && 'lg:order-1')}>{media}</div>
        </div>
        {footer}
      </Container>
    </section>
  );
}

/** Rahmen jeder Beispielansicht: Kontextzeile, Titel und Beispiel-Kennzeichnung sind Pflicht. */
export function DemoFrame({
  context,
  title,
  badge = 'Beispielansicht',
  tone = 'white',
  children,
}: {
  context: string;
  title: string;
  badge?: string;
  tone?: 'white' | 'cream';
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-card p-5 sm:p-7', tone === 'white' ? 'bg-white shadow-lift' : 'bg-cream')}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-5">
        <div>
          <p className="text-sm text-body">{context}</p>
          <p className="font-display text-xl font-bold text-ink">{title}</p>
        </div>
        <ExampleBadge className={tone === 'cream' ? 'bg-white' : undefined}>{badge}</ExampleBadge>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

/**
 * Fähigkeiten oder Schritte als Icon-Kacheln. `numbered` nur für echte Abläufe.
 * `light` auf Creme-Kapitel, `dark` auf dunklem Kapitel.
 */
export function IconTiles({
  items,
  numbered = false,
  tone = 'light',
  columns = 2,
}: {
  items: ReadonlyArray<{ icon: LucideIcon; title: string; text: string }>;
  numbered?: boolean;
  tone?: 'light' | 'dark';
  columns?: 2 | 3;
}) {
  const dark = tone === 'dark';
  const List = numbered ? 'ol' : 'ul';
  return (
    <List className={cn('grid gap-3', columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
      {items.map(({ icon: Icon, title, text }, index) => (
        <li key={title} className={cn('flex flex-col gap-2 rounded-2xl p-4', dark ? 'bg-white/5 ring-1 ring-white/10 sm:p-5' : 'bg-white')}>
          <span className="flex items-center justify-between">
            <span className={cn('grid size-10 place-items-center rounded-xl', dark ? 'bg-white/10 text-lime' : 'bg-brand-soft text-brand')}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
            {numbered && (
              <span className={cn('font-display text-sm font-bold tabular-nums', dark ? 'text-white/50' : 'text-body/60')} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
            )}
          </span>
          <strong className="text-sm font-semibold">{title}</strong>
          <span className={cn('text-sm leading-snug', dark ? 'text-white/65' : 'text-body')}>{text}</span>
        </li>
      ))}
    </List>
  );
}

/** Alle Leistungsbereiche als verlinkte Kacheln. `items` stammt ausschließlich aus SERVICE_CATEGORIES. */
export function ServiceTiles({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<{ slug: string; shortTitle: string; description: string; icon: LucideIcon }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-display text-2xl font-bold tracking-tight">{title}</h3>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map(({ slug, shortTitle, description, icon: Icon }) => (
          <li key={slug}>
            <Link
              href={`/leistungen/${slug}`}
              className="group flex h-full flex-col gap-3 rounded-2xl border border-hairline p-4 transition-[border-color,box-shadow] hover:border-brand hover:shadow-card"
            >
              <span className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <ArrowUpRight className="size-4 text-body opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </span>
              <span>
                <strong className="block text-sm font-semibold text-ink">{shortTitle}</strong>
                <span className="line-clamp-2 text-meta leading-snug text-body">{description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Genau eine Hauptaktion pro Kapitel, mit genau einer belegten Entlastung daneben. */
export function CtaRow({
  href,
  note,
  tone = 'light',
  children,
}: {
  href: string;
  note?: string;
  tone?: 'light' | 'dark';
  children: React.ReactNode;
}) {
  const dark = tone === 'dark';
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <ButtonLink href={href} size="lg" arrow>
        {children}
      </ButtonLink>
      {note && (
        <span className={cn('flex items-center gap-2 text-sm', dark ? 'text-white/75' : 'text-body')}>
          <Check className={cn('size-4', dark ? 'text-lime' : 'text-save')} strokeWidth={3} aria-hidden="true" />
          {note}
        </span>
      )}
    </div>
  );
}

export function DocHero({ eyebrow, title, text, meta }: { eyebrow: string; title: React.ReactNode; text: React.ReactNode; meta?: string }) {
  return (
    <section className="bg-cream">
      <Container className="flex max-w-5xl flex-col gap-5 py-12 lg:py-16">
        <Reveal y={16} className="flex flex-col gap-5">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-display text-balance text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">{title}</h1>
          <p className="max-w-3xl text-pretty text-lg leading-relaxed text-body">{text}</p>
          {meta && <p className="text-meta font-semibold text-body">{meta}</p>}
        </Reveal>
      </Container>
    </section>
  );
}

/** Zweispaltiges Dokument-Layout: Sprungnavigation links (sticky), Inhalt rechts. */
export function DocLayout({ toc, children }: { toc?: ReadonlyArray<{ id: string; label: string }>; children: React.ReactNode }) {
  return (
    <section className="bg-white py-14 lg:py-20">
      <Container className={cn('grid gap-10', toc && 'lg:grid-cols-[240px_1fr] lg:gap-16')}>
        {toc && (
          <nav aria-label="Auf dieser Seite" className="hidden lg:block">
            <div className="sticky top-28 flex flex-col gap-1 border-l border-hairline">
              <p className="mb-2 pl-4 text-meta font-semibold uppercase tracking-wider text-body">Auf dieser Seite</p>
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="-ml-px border-l-2 border-transparent py-1.5 pl-4 text-sm text-body transition-colors hover:border-brand hover:text-ink"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        )}
        <div className="flex min-w-0 flex-col gap-6">{children}</div>
      </Container>
    </section>
  );
}

/** Nummerierter Abschnitt innerhalb eines Dokuments. */
export function DocBlock({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="scroll-mt-28 rounded-card bg-cream p-6 sm:p-8">
      <h2 id={id ? `${id}-title` : undefined} className="font-display text-xl font-bold leading-snug text-ink sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4 leading-relaxed text-body [&_a]:font-semibold [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

/** Rechtliche Querverweise am Seitenende. */
export function LegalNav({ items }: { items: ReadonlyArray<{ href: string; label: string }> }) {
  return (
    <nav aria-label="Rechtliche Angaben" className="flex flex-wrap items-center gap-3 border-t border-hairline pt-8">
      <span className="text-meta font-semibold uppercase tracking-wider text-body">Weitere Angaben</span>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex h-10 items-center gap-1.5 rounded-pill border border-hairline bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {item.label}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      ))}
    </nav>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
