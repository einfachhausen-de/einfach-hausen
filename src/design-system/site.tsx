/**
 * Designsystem 1.1 · Website-Baukasten (öffentliche Eigentümer- und Partnerseiten).
 *
 * Kanonische Bausteine für die Website. Farben, Radien, Schatten und Schriftgrößen
 * kommen ausschließlich aus den Tokens in packages/eh-design/src/tokens.json, die in
 * src/app/globals.css als Tailwind-Theme (brand, lime, cream, ink …) bereitstehen.
 * Keine Verläufe, kein Glas, keine Dauerschleifen, keine zweite Schrift.
 */
import Image from 'next/image';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { ArrowRight, Check } from 'lucide-react';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['meta'] }],
      rounded: [{ rounded: ['pill', 'card', 'cut'] }],
      shadow: [{ shadow: ['card', 'lift'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tone = 'light' | 'dark';
type Children = { children: React.ReactNode; className?: string };

export function Container({ className, children }: Children) {
  return <div className={cn('mx-auto w-full max-w-7xl px-5 sm:px-8', className)}>{children}</div>;
}

export function Eyebrow({ children, tone = 'light', className }: Children & { tone?: Tone }) {
  return (
    <p
      className={cn(
        'inline-flex w-fit items-center gap-2 rounded-pill px-3 py-1 text-meta font-semibold uppercase tracking-wider',
        tone === 'light' ? 'bg-brand-soft text-brand' : 'bg-white/10 text-lime',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-pill', tone === 'light' ? 'bg-brand' : 'bg-lime')} aria-hidden="true" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  tone = 'light',
  align = 'left',
  as: Tag = 'h2',
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  text?: React.ReactNode;
  tone?: Tone;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2';
  className?: string;
}) {
  return (
    <div className={cn('flex max-w-3xl flex-col gap-4', align === 'center' && 'mx-auto items-center text-center', className)}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <Tag
        className={cn(
          'font-display text-balance text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl',
          tone === 'light' ? 'text-ink' : 'text-white',
        )}
      >
        {title}
      </Tag>
      {text && <p className={cn('text-pretty text-lg leading-relaxed', tone === 'light' ? 'text-body' : 'text-white/75')}>{text}</p>}
    </div>
  );
}

type ButtonVariant = 'lime' | 'ink' | 'outline' | 'outline-dark' | 'white';

const buttonVariants: Record<ButtonVariant, string> = {
  lime: 'bg-lime text-ink hover:bg-lime-strong',
  ink: 'bg-ink text-white hover:bg-brand-deep',
  white: 'bg-white text-ink hover:bg-cream',
  outline: 'border border-hairline bg-white text-ink hover:border-ink',
  'outline-dark': 'border border-white/25 text-white hover:bg-white/10',
};

export const buttonClass = (variant: ButtonVariant = 'lime', size: 'md' | 'lg' = 'md', className?: string) =>
  cn(
    'group inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    size === 'lg' ? 'h-14 px-7 text-base' : 'h-11 px-5 text-sm',
    buttonVariants[variant],
    className,
  );

export function ButtonLink({
  href,
  children,
  variant = 'lime',
  size = 'md',
  arrow,
  className,
}: Children & { href: string; variant?: ButtonVariant; size?: 'md' | 'lg'; arrow?: boolean }) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
      {arrow && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
    </Link>
  );
}

export function CheckList({ items, tone = 'light', className }: { items: readonly string[]; tone?: Tone; className?: string }) {
  return (
    <ul className={cn('flex flex-col gap-3', className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span
            className={cn('mt-0.5 grid size-6 shrink-0 place-items-center rounded-pill', tone === 'light' ? 'bg-lime text-ink' : 'bg-lime/15 text-lime')}
            aria-hidden="true"
          >
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          <span className={cn('leading-relaxed', tone === 'light' ? 'text-ink' : 'text-white/85')}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Hauskante: genau eine 45°-Ecke oben rechts an großen Bildflächen. Nie an Bedienelementen. */
export const houseEdgeClass =
  '[clip-path:polygon(0_0,calc(100%_-_var(--eh-radius-cut))_0,100%_var(--eh-radius-cut),100%_100%,0_100%)]';

export function HouseEdgeImage({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-card', houseEdgeClass, className)}>
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
    </div>
  );
}

/** Gerätehülle für illustrative App-Ansichten. Inhalt ist immer als Beispiel gekennzeichnet. */
export function PhoneFrame({ children, className, label = 'Beispielansicht der App' }: Children & { label?: string }) {
  return (
    <figure className={cn('relative w-[300px]', className)}>
      <div className="rounded-[2.9rem] bg-ink p-2.5 shadow-lift ring-1 ring-white/10">
        <div className="relative h-[620px] overflow-hidden rounded-[2.4rem] bg-cream">
          <div className="absolute left-1/2 top-2.5 z-10 h-6 w-24 -translate-x-1/2 rounded-pill bg-ink" aria-hidden="true" />
          {children}
        </div>
      </div>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}

/** Original-Logo, unverändert. Auf dunklen Flächen die freigegebene helle Variante. */
export function SiteLogo({ tone = 'light', className, href = '/', label = 'Einfach Hausen – Startseite' }: { tone?: Tone; className?: string; href?: string; label?: string }) {
  return (
    <Link href={href} aria-label={label} className={cn('block shrink-0', className)}>
      {tone === 'light' ? (
        <Image src="/brand/logo-full.png" alt="einfach hausen" width={760} height={527} priority className="h-11 w-auto lg:h-12" />
      ) : (
        <Image src="/brand/LOGO_white.png" alt="einfach hausen" width={1536} height={1024} className="-my-2 h-16 w-auto lg:h-[4.5rem]" />
      )}
    </Link>
  );
}

/** Kleine Kennzeichnung für illustrative Inhalte (Beispielpreise, Beispielanbieter). */
export function ExampleNote({ children, tone = 'light', className }: Children & { tone?: Tone }) {
  return <p className={cn('text-meta', tone === 'light' ? 'text-body' : 'text-white/60', className)}>{children}</p>;
}
