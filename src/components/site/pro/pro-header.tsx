'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Menu, X } from 'lucide-react';
import { SiteLogo, buttonClass } from '@/design-system/site';

const NAV = [
  { label: 'Vorteile', href: '#vorteile' },
  { label: 'So funktioniert’s', href: '#ablauf' },
  { label: 'Partner-App', href: '#partner-app' },
  { label: 'Tarife', href: '#tarife' },
  { label: 'FAQ', href: '#faq' },
] as const;

export function ProHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/15 bg-ink text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8 lg:h-[72px]">
        <div className="flex shrink-0 items-center gap-2">
          <SiteLogo tone="dark" href="/partner" label="Einfach Hausen für Betriebe" className="[&_img]:h-14 lg:[&_img]:h-16" />
          <span className="rounded-md bg-lime px-2 py-0.5 text-meta font-bold uppercase tracking-wider text-ink">Pro</span>
        </div>

        <nav aria-label="Partner-Navigation" className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="rounded-pill px-3.5 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Link href="/" className="flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Für Eigentümer
          </Link>
          <Link href="/login" className="rounded-pill px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
            Partner-Login
          </Link>
          <Link href="/register?role=provider" className={buttonClass('lime', 'md')}>
            Partner werden
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto grid size-11 place-items-center rounded-pill hover:bg-white/10 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="pro-mobile-menu"
          aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
        </button>
      </div>

      {menuOpen && (
        <nav id="pro-mobile-menu" aria-label="Mobile Partner-Navigation" className="flex flex-col gap-1 border-t border-white/15 bg-ink px-5 pb-6 pt-3 lg:hidden">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl px-4 py-3 font-display text-lg font-bold text-white hover:bg-white/10"
            >
              {item.label}
            </a>
          ))}
          <Link href="/register?role=provider" className={buttonClass('lime', 'lg', 'mt-4')}>
            Partner werden
          </Link>
          <Link href="/login" className={buttonClass('outline-dark', 'lg')}>
            Partner-Login
          </Link>
          <Link href="/" className="mt-3 text-center text-sm text-white/70">
            Zur Seite für Eigentümer
          </Link>
        </nav>
      )}
    </header>
  );
}
