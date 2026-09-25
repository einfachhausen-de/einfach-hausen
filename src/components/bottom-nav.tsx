import Link from 'next/link';
import { matchesArea, ownerAreas, providerAreas, type NavArea } from './nav-config';

/**
 * Eigentümer: vier Ziele wie in der Website-Ansicht der App (DESIGN.md §13:
 * vier Bereiche, keine umbrechende Beschriftung). Ansprechpartner bleiben über
 * Seitenleiste, Start und Aufträge erreichbar.
 */
const OWNER_BOTTOM_HREFS = ['/app', '/app/contracts', '/app/jobs', '/app/home'] as const;

/**
 * One renderer for both portals. The visible text is the short form; the
 * accessible name stays the full label, so a screen reader still hears
 * "Verträge & Tarife" and not just "Verträge". State travels in aria-current.
 */
function NavLinks({ areas, active }: { areas: readonly NavArea[]; active: string }) {
  return (
    <>
      {areas.map((area) => {
        const Icon = area.icon;
        const on = matchesArea(active, area) || area.children.some((child) => child.href === active);
        return (
          <Link
            key={area.href}
            href={area.href}
            aria-current={on ? 'page' : undefined}
            aria-label={area.shortLabel ? area.label : undefined}
          >
            <span className="eh-nav-symbol" aria-hidden="true">
              <Icon size={20} />
            </span>
            <span>{area.shortLabel ?? area.label}</span>
          </Link>
        );
      })}
    </>
  );
}

export function BottomNav({ role, active }: { role: 'homeowner' | 'provider'; active: string }) {
  const areas =
    role === 'provider'
      ? providerAreas
      : OWNER_BOTTOM_HREFS.flatMap((href) => ownerAreas.filter((area) => area.href === href));
  return (
    <nav className="bottom-nav" aria-label="Hauptnavigation" data-eintraege={areas.length}>
      <NavLinks areas={areas} active={active} />
    </nav>
  );
}
