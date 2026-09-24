'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Menu, X } from 'lucide-react';
import logoFull from '@/components/marketing/assets/logo-full.png';

const NAV = [
  { label: 'Vorteile', href: '#vorteile' },
  { label: 'So funktioniert’s', href: '#ablauf' },
  { label: 'Partner-App', href: '#partner-app' },
  { label: 'Tarife', href: '#tarife' },
  { label: 'FAQ', href: '#faq' },
] as const;

export function ProHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/90 text-white backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8 lg:h-[72px]">
        <Link href="/partner" className="flex shrink-0 items-center gap-3" aria-label="Einfach Hausen für Betriebe">
          <Image src={logoFull} alt="" width={70} height={48} className="h-10 w-auto brightness-0 invert" />
          <span className="rounded-md bg-lime px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-ink">Pro</span>
        </Link>

        <nav aria-label="Partner-Navigation" className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="rounded-full px-3.5 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Link href="/" className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Für Eigentümer
          </Link>
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-white/10">
            Partner-Login
          </Link>
          <Link
            href="/register?role=provider"
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-lime px-5 text-sm font-semibold text-ink transition-colors hover:bg-lime-strong"
          >
            Partner werden
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          className="ml-auto grid size-11 place-items-center rounded-full hover:bg-white/10 lg:hidden"
          aria-expanded={open}
          aria-controls="pro-mobile-menu"
          aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <nav id="pro-mobile-menu" aria-label="Mobile Partner-Navigation" className="flex flex-col gap-1 border-t border-white/10 bg-ink px-5 pb-6 pt-3 lg:hidden">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-2xl px-4 py-3 font-display text-lg font-bold hover:bg-white/5"
            >
              {item.label}
            </a>
          ))}
          <Link href="/register?role=provider" className="mt-4 flex h-14 items-center justify-center rounded-full bg-lime font-semibold text-ink">
            Partner werden
          </Link>
          <Link href="/login" className="flex h-14 items-center justify-center rounded-full border border-white/20 font-semibold">
            Partner-Login
          </Link>
          <Link href="/" className="mt-3 text-center text-sm text-white/60">
            Zur Seite für Eigentümer
          </Link>
        </nav>
      )}
    </header>
  );
}
