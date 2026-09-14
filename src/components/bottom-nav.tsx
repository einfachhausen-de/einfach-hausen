import Link from 'next/link';
import { ClipboardList, Home, MessageSquare, UsersRound, UserRound } from 'lucide-react';
import { matchesArea, ownerAreas } from './nav-config';

export const providerNav = [
  ['/pro', Home, 'Anfragen'],
  ['/pro/orders', ClipboardList, 'Aufträge'],
  ['/pro/messages', MessageSquare, 'Nachrichten'],
  ['/pro/team', UsersRound, 'Team'],
  ['/pro/profile', UserRound, 'Profil'],
] as const;

export function isNavActive(active:string, href:string){
  if(href==='/app'||href==='/pro') return active===href;
  return active===href || active.startsWith(`${href}/`);
}

export function BottomNav({ role, active }: { role:'homeowner'|'provider'; active:string }) {
  if (role === 'provider') return <nav className="bottom-nav" aria-label="Hauptnavigation">{providerNav.map(([href,Icon,label])=>{
    const on = isNavActive(active,href);
    return <Link key={href} href={href} className={on?'active':''} aria-current={on?'page':undefined}><Icon size={20}/><span>{label}</span></Link>;
  })}</nav>;
  return <nav className="bottom-nav" aria-label="Hauptnavigation">{ownerAreas.map(area=>{
    const Icon = area.icon; const on = matchesArea(active,area);
    return <Link key={area.href} href={area.href} className={on?'active':''} aria-current={on?'page':undefined}><Icon size={20}/><span>{area.label}</span></Link>;
  })}</nav>;
}
