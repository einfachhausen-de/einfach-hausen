import Link from 'next/link';
import { Container } from '@/design-system/site';
import { ProHeader } from './pro-header';

const FOOTER_LINKS = [
  ['Für Eigentümer', '/'],
  ['Kontakt', '/kontakt'],
  ['Impressum', '/impressum'],
  ['Datenschutz', '/datenschutz'],
  ['AGB', '/agb'],
] as const;

export function ProShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink font-sans text-white antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-pill focus:bg-lime focus:px-4 focus:py-2 focus:text-ink"
      >
        Zum Inhalt springen
      </a>
      <ProHeader />
      <main id="main-content">{children}</main>
      <footer className="border-t border-white/15">
        <Container className="flex flex-col gap-6 py-10 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Einfach Hausen · Partnernetzwerk für regionale Betriebe</p>
          <nav aria-label="Rechtliches" className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map(([label, href]) => (
              <Link key={href} href={href} className="text-white/70 transition-colors hover:text-lime">
                {label}
              </Link>
            ))}
          </nav>
        </Container>
      </footer>
    </div>
  );
}
