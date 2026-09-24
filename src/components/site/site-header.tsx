'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, BadgeCheck, ChevronDown, HardHat, Menu, Siren, Stethoscope, UserRound, X } from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/components/marketing/service-catalog';
import { SiteLogo, buttonClass, cn } from '@/design-system/site';

const LEADING_ITEMS = [
  { label: 'Tarife & Verträge', href: '/#tarife' },
  { label: 'Handwerker finden', href: '/#handwerker' },
] as const;

const TRAILING_ITEMS = [
  { label: 'KI-Hausmanager', href: '/#ki-hausmanager' },
  { label: 'Hausakte', href: '/hausakte' },
  { label: 'Preise', href: '/#preise' },
] as const;

const SERVICE_GROUPS = [
  { title: 'Technik & Versorgung', items: SERVICE_CATEGORIES.slice(0, 4) },
  { title: 'Gebäude & Grundstück', items: SERVICE_CATEGORIES.slice(4, 8) },
  { title: 'Service & Sonderfälle', items: SERVICE_CATEGORIES.slice(8, 12) },
] as const;

const QUICK_PATHS = [
  { label: 'Beratung', hint: 'Erst fachlich einordnen', href: '/beratung', icon: Stethoscope },
  { label: 'Notfall', hint: 'Dringenden Fall richtig starten', href: '/notfall', icon: Siren },
  { label: 'Ansprechpartner', hint: 'Persönlichen Kontakt finden', href: '/so-funktionierts#ansprechpartner', icon: UserRound },
] as const;

const PROMISES = ['Kostenlos für Eigentümer', 'Kein Auftrag ohne deine Freigabe', 'Deine Daten werden nicht verkauft'] as const;

const navLinkClass = 'rounded-pill px-3.5 py-2 text-sm font-medium text-ink/80 transition-colors hover:bg-cream hover:text-ink';
const summaryReset = 'list-none cursor-pointer [&::-webkit-details-marker]:hidden';

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const servicesRef = useRef<HTMLDetailsElement>(null);
  const mobileRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Disclosures are native <details> (work without JS); this only adds outside-click / Escape closing.
  useEffect(() => {
    const collapse = (target: EventTarget | null) => {
      for (const ref of [servicesRef, mobileRef]) {
        const node = ref.current;
        if (node?.open && !(target instanceof Node && node.contains(target))) node.open = false;
      }
    };
    const onPointer = (event: PointerEvent) => collapse(event.target);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') collapse(null);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (servicesRef.current) servicesRef.current.open = false;
    if (mobileRef.current) mobileRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileExpanded ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileExpanded]);

  const closeAll = () => {
    if (servicesRef.current) servicesRef.current.open = false;
    if (mobileRef.current) mobileRef.current.open = false;
  };

  return (
    <>
      <div className="hidden bg-ink text-white/80 md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-5 text-meta sm:px-8">
          <ul className="flex items-center gap-6">
            {PROMISES.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <BadgeCheck className="size-3.5 text-lime" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/partner" className="flex items-center gap-1.5 font-medium text-white hover:text-lime">
            <HardHat className="size-3.5" aria-hidden="true" />
            Du bist Handwerker? Hier entlang
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <header
        className={cn(
          'sticky top-0 z-50 border-b bg-white transition-shadow',
          scrolled || servicesExpanded ? 'border-hairline shadow-card' : 'border-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 sm:px-8 lg:h-[72px] xl:gap-6">
          <SiteLogo />

          <nav aria-label="Hauptnavigation" className="hidden flex-1 lg:block">
            <ul className="flex items-center gap-0.5">
              {LEADING_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={navLinkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <details ref={servicesRef} onToggle={(event) => setServicesExpanded(event.currentTarget.open)}>
                  <summary className={cn(summaryReset, navLinkClass, 'flex items-center gap-1', servicesExpanded && 'bg-cream text-ink')}>
                    Leistungen
                    <ChevronDown
                      className={cn('size-4 transition-transform', servicesExpanded && 'rotate-180')}
                      aria-hidden="true"
                    />
                  </summary>
                  <ServicesMegaMenu onNavigate={closeAll} />
                </details>
              </li>
              {TRAILING_ITEMS.map((item) => (
                <li key={item.href} className={item.href === '/#preise' ? 'hidden xl:block' : undefined}>
                  <Link href={item.href} className={navLinkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Link href="/login" className="rounded-pill px-4 py-2 text-sm font-semibold text-ink hover:bg-cream">
              Anmelden
            </Link>
            <Link href="/register?role=homeowner" className={buttonClass('lime', 'md')}>
              Kostenlos starten
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <details
            ref={mobileRef}
            className="ml-auto lg:hidden"
            onToggle={(event) => setMobileExpanded(event.currentTarget.open)}
          >
            <summary
              aria-label="Menü öffnen"
              className={cn(summaryReset, 'grid size-11 place-items-center rounded-pill text-ink hover:bg-cream')}
            >
              {mobileExpanded ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
            </summary>
            <MobileMenu onNavigate={closeAll} />
          </details>
        </div>
      </header>
    </>
  );
}

function ServicesMegaMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="absolute inset-x-0 top-full border-b border-hairline bg-white shadow-lift">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 xl:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-meta font-semibold uppercase tracking-wider text-brand">Alles rund ums Eigenheim</p>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Was steht bei dir an?</h2>
            </div>
            <Link
              href="/leistungen"
              onClick={onNavigate}
              className="group flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-ink"
            >
              Alle Leistungen
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {SERVICE_GROUPS.map((group) => (
              <section key={group.title} aria-labelledby={`mega-${group.title}`}>
                <h3 id={`mega-${group.title}`} className="mb-3 text-meta font-semibold uppercase tracking-wider text-body">
                  {group.title}
                </h3>
                <ul className="flex flex-col gap-1">
                  {group.items.map(({ slug, shortTitle, description, icon: Icon }) => (
                    <li key={slug}>
                      <Link
                        href={`/leistungen/${slug}`}
                        onClick={onNavigate}
                        className="group flex items-start gap-3 rounded-2xl p-2.5 transition-colors hover:bg-cream focus-visible:bg-cream"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-lime group-hover:text-ink">
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <strong className="text-sm font-semibold text-ink">{shortTitle}</strong>
                          <span className="line-clamp-1 text-meta text-body">{description}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <aside aria-label="Schnelle Wege" className="flex flex-col gap-5 rounded-card bg-ink p-6 text-white">
          <div className="flex flex-col gap-2">
            <p className="text-meta font-semibold uppercase tracking-wider text-lime">Einfach anfangen</p>
            <p className="font-display text-lg font-bold leading-snug">Noch nicht sicher, was du brauchst?</p>
            <p className="text-sm leading-relaxed text-white/70">
              Beschreib kurz, was ansteht. Wir helfen beim Einordnen – ohne Buchungszwang.
            </p>
          </div>
          <Link href="/#anliegen" onClick={onNavigate} className={buttonClass('lime', 'md', 'w-full')}>
            Anliegen beschreiben
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <ul className="flex flex-col border-t border-white/10 pt-2">
            {QUICK_PATHS.map(({ label, hint, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className="group flex items-center gap-3 rounded-xl px-1 py-2.5 text-white transition-colors hover:text-lime"
                >
                  <Icon className="size-4 shrink-0 text-lime" aria-hidden="true" />
                  <span className="flex flex-1 flex-col">
                    <strong className="text-sm font-semibold">{label}</strong>
                    <span className="text-meta text-white/60">{hint}</span>
                  </span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function MobileMenu({ onNavigate }: { onNavigate: () => void }) {
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const itemClass =
    'flex items-center justify-between rounded-2xl px-4 py-4 font-display text-xl font-bold text-ink hover:bg-cream';

  return (
    <div className="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] overflow-y-auto border-t border-hairline bg-white">
      <nav aria-label="Mobile Navigation" className="flex flex-col gap-1 px-5 py-6">
        {LEADING_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} onClick={onNavigate} className={itemClass}>
            {item.label}
            <ArrowRight className="size-5 text-body" aria-hidden="true" />
          </Link>
        ))}

        <details onToggle={(event) => setServicesExpanded(event.currentTarget.open)}>
          <summary className={cn(summaryReset, itemClass)}>
            Leistungen
            <ChevronDown className={cn('size-5 text-body transition-transform', servicesExpanded && 'rotate-180')} aria-hidden="true" />
          </summary>
          <ul className="grid grid-cols-1 gap-1 px-2 pb-3 sm:grid-cols-2">
            {SERVICE_CATEGORIES.map(({ slug, shortTitle, icon: Icon }) => (
              <li key={slug}>
                <Link
                  href={`/leistungen/${slug}`}
                  onClick={onNavigate}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium text-ink hover:bg-cream"
                >
                  <Icon className="size-4 shrink-0 text-brand" aria-hidden="true" />
                  {shortTitle}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/leistungen"
                onClick={onNavigate}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-base font-semibold text-brand hover:bg-cream"
              >
                Alle Leistungen
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </li>
          </ul>
        </details>

        {TRAILING_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} onClick={onNavigate} className={itemClass}>
            {item.label}
            <ArrowRight className="size-5 text-body" aria-hidden="true" />
          </Link>
        ))}

        <div className="mt-6 flex flex-col gap-3">
          <Link href="/register?role=homeowner" onClick={onNavigate} className={buttonClass('lime', 'lg')}>
            Kostenlos starten
          </Link>
          <Link href="/login" onClick={onNavigate} className={buttonClass('outline', 'lg')}>
            Anmelden
          </Link>
        </div>

        <Link href="/partner" onClick={onNavigate} className="mt-6 flex items-center gap-3 rounded-2xl bg-ink p-4 text-white">
          <HardHat className="size-5 text-lime" aria-hidden="true" />
          <span className="flex-1 text-sm">
            <strong className="block font-semibold">Du bist Handwerker?</strong>
            <span className="text-white/70">Zur Seite für Betriebe</span>
          </span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>

        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 px-4 text-sm text-body">
          {[
            ['Hilfe & FAQ', '/hilfe'],
            ['Kontakt', '/kontakt'],
            ['Impressum', '/impressum'],
            ['Datenschutz', '/datenschutz'],
          ].map(([label, href]) => (
            <li key={href}>
              <Link href={href} onClick={onNavigate} className="text-body hover:text-ink">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
