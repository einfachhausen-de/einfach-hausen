import Link from 'next/link';
import { matchesArea, ownerAreas, providerAreas, type NavArea } from './nav-config';

/**
 * One renderer for both portals. The visible text is the short form, because
 * five entries share 390px; the accessible name stays the full label, so a
 * screen reader still hears "Verträge & Tarife" and not just "Verträge".
 */
function NavLinks({ areas, active }: { areas: readonly NavArea[]; active: string }) {
  return <>{areas.map(area=>{
    const Icon = area.icon; const on = matchesArea(active,area);
    return <Link key={area.href} href={area.href} className={on?'active':''} aria-current={on?'page':undefined} aria-label={area.shortLabel ? area.label : undefined}><Icon size={20}/><span>{area.shortLabel ?? area.label}</span></Link>;
  })}</>;
}

export function BottomNav({ role, active }: { role:'homeowner'|'provider'; active:string }) {
  return <nav className="bottom-nav" aria-label="Hauptnavigation"><NavLinks areas={role === 'provider' ? providerAreas : ownerAreas} active={active}/></nav>;
}
