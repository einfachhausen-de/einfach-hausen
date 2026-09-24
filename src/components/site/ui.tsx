import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from './cn';

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-5 sm:px-8', className)}>{children}</div>;
}

export function Eyebrow({ children, tone = 'light', className }: { children: React.ReactNode; tone?: 'light' | 'dark'; className?: string }) {
  return (
    <p
      className={cn(
        'inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider',
        tone === 'light' ? 'bg-brand-soft text-brand' : 'bg-white/10 text-lime',
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', tone === 'light' ? 'bg-brand' : 'bg-lime')} aria-hidden="true" />
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
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  text?: React.ReactNode;
  tone?: 'light' | 'dark';
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={cn('flex max-w-3xl flex-col gap-4', align === 'center' && 'mx-auto items-center text-center', className)}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          'font-display text-balance text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl',
          tone === 'light' ? 'text-ink' : 'text-white',
        )}
      >
        {title}
      </h2>
      {text && (
        <p className={cn('text-pretty text-lg leading-relaxed', tone === 'light' ? 'text-body' : 'text-white/70')}>{text}</p>
      )}
    </div>
  );
}

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: 'lime' | 'ink' | 'outline' | 'outline-dark' | 'white';
  size?: 'md' | 'lg';
  arrow?: boolean;
  className?: string;
};

const buttonVariants: Record<NonNullable<ButtonProps['variant']>, string> = {
  lime: 'bg-lime text-ink hover:bg-lime-strong shadow-[0_8px_24px_-8px_rgba(163,230,53,0.6)]',
  ink: 'bg-ink text-white hover:bg-brand-deep',
  white: 'bg-white text-ink hover:bg-cream',
  outline: 'border border-hairline bg-white text-ink hover:border-ink',
  'outline-dark': 'border border-white/20 text-white hover:bg-white/10',
};

export function ButtonLink({ href, children, variant = 'lime', size = 'md', arrow, className }: ButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        size === 'lg' ? 'h-14 px-7 text-base' : 'h-11 px-5 text-sm',
        buttonVariants[variant],
        className,
      )}
    >
      {children}
      {arrow && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
    </Link>
  );
}

export function CheckList({ items, tone = 'light', className }: { items: readonly string[]; tone?: 'light' | 'dark'; className?: string }) {
  return (
    <ul className={cn('flex flex-col gap-3', className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full',
              tone === 'light' ? 'bg-lime text-ink' : 'bg-lime/15 text-lime',
            )}
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
