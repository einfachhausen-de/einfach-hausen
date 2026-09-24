/**
 * Unterseiten-Bausteine der Website (Designsystem 1.1 · Website-Baukasten).
 *
 * Komponiert ausschließlich aus @/design-system/site und den Theme-Tokens aus
 * src/app/globals.css. Bewegung kommt aus der vorhandenen Motion-Schicht
 * (Reveal/Stagger): kurz, endlich, nur transform/opacity, reduced-motion zeigt
 * sofort den Endzustand, ohne JavaScript ist nichts versteckt.
 */
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Info, type LucideIcon } from 'lucide-react';
import { Reveal, Stagger } from '@/components/marketing/motion';
import { Container, Eyebrow, SectionHeading, cn, houseEdgeClass } from '@/design-system/site';

type Tone = 'white' | 'cream' | 'dark';

const sectionTone: Record<Tone, string> = {
  white: 'bg-white text-ink',
  cream: 'bg-cream text-ink',
  dark: 'bg-brand-deep text-white',
};

export function PageHero({
  eyebrow,
  title,
  text,
  actions,
  aside,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  text: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-cream">
      <Container
        className={cn('grid gap-12 py-14 lg:py-20', aside ? 'items-center lg:grid-cols-[1.1fr_0.9fr] lg:gap-16' : 'max-w-5xl')}
      >
        <Reveal y={16} className="flex flex-col gap-6">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-display text-balance text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-body sm:text-xl">{text}</p>
          {actions && <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">{actions}</div>}
          {children}
        </Reveal>
        {aside && (
          <Reveal y={24} delay={0.15}>
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

/** Beispielkarte für den Hero: klar als Beispiel gekennzeichnet, keine echten Kundendaten. */
export function ExampleCard({
  label,
  title,
  rows,
  note,
}: {
  label: string;
  title: string;
  rows: ReadonlyArray<{ title: string; text: string }>;
  note?: string;
}) {
  return (
    <figure className="flex flex-col gap-5 rounded-card bg-white p-6 shadow-lift ring-1 ring-hairline sm:p-8">
      <figcaption className="text-meta font-semibold uppercase tracking-wider text-brand">{label}</figcaption>
      <p className="font-display text-2xl font-bold leading-snug text-ink">{title}</p>
      <Stagger className="flex flex-col gap-3" y={12}>
        {rows.map((row, index) => (
          <div key={row.title} className="flex gap-4 rounded-2xl bg-cream p-4">
            <span
              className="grid size-8 shrink-0 place-items-center rounded-xl bg-ink font-display text-sm font-bold text-lime"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="font-semibold text-ink">{row.title}</p>
              <p className="text-sm leading-relaxed text-body">{row.text}</p>
            </div>
          </div>
        ))}
      </Stagger>
      {note && <p className="text-meta text-body">{note}</p>}
    </figure>
  );
}

export function StepList({
  steps,
  tone = 'light',
}: {
  steps: ReadonlyArray<{ title: string; text: React.ReactNode }>;
  tone?: 'light' | 'dark';
}) {
  return (
    <Stagger className="grid gap-5 md:grid-cols-3" y={20}>
      {steps.map((step, index) => (
        <div
          key={step.title}
          className={cn(
            'flex h-full flex-col gap-4 rounded-card p-7',
            tone === 'light' ? 'bg-cream' : 'bg-white/5 ring-1 ring-white/10',
          )}
        >
          <span
            className={cn(
              'grid size-12 place-items-center rounded-2xl font-display text-lg font-bold',
              tone === 'light' ? 'bg-ink text-lime' : 'bg-lime text-ink',
            )}
            aria-hidden="true"
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className={cn('font-display text-xl font-bold', tone === 'light' ? 'text-ink' : 'text-white')}>{step.title}</h3>
          <p className={cn('leading-relaxed', tone === 'light' ? 'text-body' : 'text-white/75')}>{step.text}</p>
        </div>
      ))}
    </Stagger>
  );
}

export function FeatureCards({
  items,
  tone = 'light',
  columns = 3,
}: {
  items: ReadonlyArray<{ title: string; text: React.ReactNode; icon?: LucideIcon }>;
  tone?: 'light' | 'dark';
  columns?: 2 | 3;
}) {
  return (
    <Stagger className={cn('grid gap-5', columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')} y={20}>
      {items.map(({ title, text, icon: Icon }) => (
        <div
          key={title}
          className={cn(
            'flex h-full flex-col gap-3 rounded-card p-7',
            tone === 'light' ? 'bg-white ring-1 ring-hairline' : 'bg-white/5 ring-1 ring-white/10',
          )}
        >
          {Icon && (
            <span
              className={cn(
                'mb-1 grid size-11 place-items-center rounded-xl',
                tone === 'light' ? 'bg-brand-soft text-brand' : 'bg-lime/15 text-lime',
              )}
              aria-hidden="true"
            >
              <Icon className="size-5" />
            </span>
          )}
          <h3 className={cn('font-display text-lg font-bold leading-snug', tone === 'light' ? 'text-ink' : 'text-white')}>{title}</h3>
          <p className={cn('leading-relaxed', tone === 'light' ? 'text-body' : 'text-white/75')}>{text}</p>
        </div>
      ))}
    </Stagger>
  );
}

export function LinkCards({
  items,
  columns = 3,
}: {
  items: ReadonlyArray<{ label?: string; title: string; text?: string; href: string; icon?: LucideIcon }>;
  columns?: 2 | 3 | 4;
}) {
  const grid = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[columns];
  return (
    <Stagger className={cn('grid gap-4', grid)} y={16} gap={0.05}>
      {items.map(({ label, title, text, href, icon: Icon }) => (
        <Link
          key={href + title}
          href={href}
          className="group flex h-full flex-col gap-3 rounded-card bg-white p-6 ring-1 ring-hairline transition-shadow hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <div className="flex items-start justify-between gap-4">
            {Icon ? (
              <span className="grid size-11 place-items-center rounded-xl bg-cream text-brand transition-colors group-hover:bg-lime group-hover:text-ink" aria-hidden="true">
                <Icon className="size-5" />
              </span>
            ) : (
              label && <span className="text-meta font-semibold uppercase tracking-wider text-brand">{label}</span>
            )}
            <ArrowUpRight
              className="size-5 shrink-0 text-body transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
              aria-hidden="true"
            />
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

export function ClosingCta({
  title,
  text,
  primary,
  secondary,
}: {
  title: string;
  text: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="bg-white py-16 lg:py-24">
      <Container>
        <Reveal y={24}>
          <div className="rounded-[2.5rem] bg-lime px-6 py-14 text-center sm:px-12 lg:py-20">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
              <h2 className="font-display text-balance text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">{title}</h2>
              <p className="max-w-xl text-pretty text-lg text-ink/75">{text}</p>
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <Link
                  href={primary.href}
                  className="group inline-flex h-14 items-center justify-center gap-2 rounded-pill bg-ink px-7 text-base font-semibold text-white transition-colors hover:bg-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {primary.label}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                {secondary && (
                  <Link href={secondary.href} className="inline-flex h-14 items-center gap-2 px-4 font-semibold text-ink hover:underline">
                    {secondary.label} <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
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

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
