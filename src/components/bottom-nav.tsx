import Link from 'next/link';
import { matchesArea, ownerAreas, providerAreas } from './nav-config';

export function BottomNav({ role, active }: { role:'homeowner'|'provider'; active:string }) {
  if (role === 'provider') return <nav className="bottom-nav" aria-label="Hauptnavigation">{providerAreas.map(area=>{
    const Icon = area.icon; const on = matchesArea(active,area);
    return <Link key={area.href} href={area.href} className={on?'active':''} aria-current={on?'page':undefined}><Icon size={20}/><span>{area.label}</span></Link>;
  })}</nav>;
  return <nav className="bottom-nav" aria-label="Hauptnavigation">{ownerAreas.map(area=>{
    const Icon = area.icon; const on = matchesArea(active,area);
    return <Link key={area.href} href={area.href} className={on?'active':''} aria-current={on?'page':undefined}><Icon size={20}/><span>{area.label}</span></Link>;
  })}</nav>;
}
