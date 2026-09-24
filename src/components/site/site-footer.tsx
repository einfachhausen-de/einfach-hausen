import Link from 'next/link';
import { ArrowRight, HardHat } from 'lucide-react';
import { SiteLogo } from '@/design-system/site';

const GROUPS = [
  {
    title: 'Produkt',
    links: [
      ['Tarife vergleichen', '/#tarife'],
      ['Handwerker finden', '/#handwerker'],
      ['KI-Hausmanager', '/#ki-hausmanager'],
      ['Digitale Hausakte', '/hausakte'],
      ['So funktioniert’s', '/so-funktionierts'],
      ['Preise', '/preise'],
    ],
  },
  {
    title: 'Leistungen',
    links: [
      ['Heizung & Energie', '/leistungen/heizung'],
      ['Sanitär & Wasser', '/leistungen/sanitaer-wasser'],
      ['Elektro & Smart Home', '/leistungen/elektro-smart-home'],
      ['Dach, Fenster & Türen', '/leistungen/dach-fenster-tueren'],
      ['Garten & Außen', '/leistungen/garten-aussenbereich'],
      ['Alle Leistungen', '/leistungen'],
    ],
  },
  {
    title: 'Hilfe',
    links: [
      ['Hilfe & FAQ', '/hilfe'],
      ['Notfall', '/notfall'],
      ['Sicherheit & Daten', '/sicherheit'],
      ['Ratgeber', '/blog'],
      ['Lexikon', '/lexikon'],
      ['Kontakt', '/kontakt'],
    ],
  },
  {
    title: 'Unternehmen',
    links: [
      ['Über uns', '/ueber-uns'],
      ['Impressum', '/impressum'],
      ['Datenschutz', '/datenschutz'],
      ['AGB', '/agb'],
      ['Barrierefreiheit', '/barrierefreiheit'],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div className="flex flex-col gap-6">
            <SiteLogo tone="dark" className="w-fit" />
            <p className="max-w-sm leading-relaxed text-white/70">
              Die App für dein Eigenheim: Tarife vergleichen und wechseln, geprüfte Handwerker finden, alle Unterlagen griffbereit und ein
              KI-Hausmanager, der mitdenkt.
            </p>
            <Link
              href="/partner"
              className="group flex max-w-sm items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-lime text-ink">
                <HardHat className="size-5" aria-hidden="true" />
              </span>
              <span className="flex-1 text-sm">
                <strong className="block font-semibold">Einfach Hausen für Betriebe</strong>
                <span className="text-white/60">Mehr Stammkunden, 0 % Provision</span>
              </span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {GROUPS.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className="mb-4 text-sm font-semibold text-white">{group.title}</h2>
                <ul className="flex flex-col gap-3">
                  {group.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-white/60 transition-colors hover:text-lime">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-meta text-white/60 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Einfach Hausen. Ausgeführt wird durch eigenständige, geprüfte Partnerbetriebe.</p>
          <p>Kein Auftrag und kein Tarifwechsel ohne deine ausdrückliche Freigabe.</p>
        </div>
      </div>
    </footer>
  );
}
