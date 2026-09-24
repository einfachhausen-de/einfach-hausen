import Link from 'next/link';
import { displayFont } from '../fonts';
import { cn } from '../cn';
import { ProHeader } from './pro-header';

export function ProShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(displayFont.variable, 'min-h-screen bg-ink font-sans text-white antialiased')}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-lime focus:px-4 focus:py-2 focus:text-ink"
      >
        Zum Inhalt springen
      </a>
      <ProHeader />
      <main id="main-content">{children}</main>
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 text-sm text-white/50 sm:px-8 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Einfach Hausen · Partnernetzwerk für regionale Betriebe</p>
          <nav aria-label="Rechtliches" className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              ['Für Eigentümer', '/'],
              ['Kontakt', '/kontakt'],
              ['Impressum', '/impressum'],
              ['Datenschutz', '/datenschutz'],
              ['AGB', '/agb'],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="hover:text-lime">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
