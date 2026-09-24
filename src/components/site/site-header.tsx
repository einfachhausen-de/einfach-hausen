'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, HardHat, Menu, X } from 'lucide-react';
import { SiteLogo, buttonClass, cn } from '@/design-system/site';

export const NAV_ITEMS = [
  { label: 'Tarife & Verträge', href: '/#tarife' },
  { label: 'Handwerker finden', href: '/#handwerker' },
  { label: 'KI-Hausmanager', href: '/#ki-hausmanager' },
  { label: 'Hausakte', href: '/hausakte' },
  { label: 'Preise', href: '/#preise' },
] as const;

const PROMISES = ['Kostenlos für Eigentümer', 'Kein Auftrag ohne deine Freigabe', 'Deine Daten werden nicht verkauft'] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

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
          scrolled ? 'border-hairline shadow-card' : 'border-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8 lg:h-[72px]">
          <SiteLogo />

          <nav aria-label="Hauptnavigation" className="hidden flex-1 lg:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-pill px-3.5 py-2 text-sm font-medium text-ink/80 transition-colors hover:bg-cream hover:text-ink"
                  >
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

          <button
            type="button"
            className="ml-auto grid size-11 place-items-center rounded-pill text-ink hover:bg-cream lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
          </button>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto bg-white lg:hidden">
            <nav aria-label="Mobile Navigation" className="flex flex-col gap-1 px-5 py-6">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between rounded-2xl px-4 py-4 font-display text-xl font-bold text-ink hover:bg-cream"
                >
                  {item.label}
                  <ArrowRight className="size-5 text-body" aria-hidden="true" />
                </Link>
              ))}
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/register?role=homeowner" className={buttonClass('lime', 'lg')}>
                  Kostenlos starten
                </Link>
                <Link href="/login" className={buttonClass('outline', 'lg')}>
                  Anmelden
                </Link>
              </div>
              <Link href="/partner" className="mt-6 flex items-center gap-3 rounded-2xl bg-ink p-4 text-white">
                <HardHat className="size-5 text-lime" aria-hidden="true" />
                <span className="flex-1 text-sm">
                  <strong className="block font-semibold">Du bist Handwerker?</strong>
                  <span className="text-white/70">Zur Seite für Betriebe</span>
                </span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
