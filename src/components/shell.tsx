import {EHScope, EHRouteTabs, EHWorkspaceFrame, EHWorkspaceNavItem} from "@/design-system";
import Link from 'next/link';
import { HouseAssistant } from './house-assistant';
import { Bell, Menu, Search } from 'lucide-react';
import { BottomNav } from './bottom-nav';
import { matchesArea, ownerAreas, providerAreas, ownerAreaSubNav, providerAreaSubNav, type ContextTab } from './nav-config';
import { OwnerMobileMenu } from './owner-menu';
import { SidebarAccountMenu } from './sidebar-account-menu';
import { Breadcrumbs, type Crumb } from './breadcrumbs';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import type { ReactNode } from 'react';
import s from './shell.module.css';

export async function AppShell({ role, active, children, title, subtitle, breadcrumbs, tabs, rail }: { role:'homeowner'|'provider'; active:string; children:ReactNode; title?:string; subtitle?:string; breadcrumbs?:readonly Crumb[]; tabs?:readonly ContextTab[]; rail?:ReactNode }) {
  const pro = role === 'provider';
  const user=await getCurrentUser();
  const unread=user&&user.role===role?(db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read_at IS NULL').get(user.id) as {c:number}).c:0;
  const profileHref=pro?'/pro/profile':'/app/profile';
  const initials=user?`${user.first_name?.[0]||''}${user.last_name?.[0]||''}`.toUpperCase():'EH';

  const contextTabs = tabs ?? (pro ? null : (() => {
    const {items} = ownerAreaSubNav(active);
    if (items.length < 2) return undefined;
    return items.map((c: { href: string; label: string; active: boolean }) => ({ href: c.href, label: c.label, active: c.active }));
  })());

  const mobileMenu = pro ? (
    <details className="mobile-menu">
      <summary aria-label="Hauptmenü öffnen"><Menu size={20}/><span>Menü</span></summary>
      <nav className="mobile-menu-panel" aria-label="Hauptnavigation">{providerAreas.map(area=>{const Icon=area.icon;const on=matchesArea(active,area);return <Link key={area.href} href={area.href} className={on?'active':''} aria-current={on?'page':undefined}><Icon size={18}/><span>{area.label}</span></Link>;})}</nav>
    </details>
  ) : (
    <OwnerMobileMenu active={active} />
  );

  // Hauptmenü oben: die Hauptbereiche als Pills. Welche Bereiche das sind, ist
  // pro Rolle fest - ownerAreas für Eigentümer, providerAreas für Betriebe.
  const areas = pro ? providerAreas : ownerAreas;
  const mainNav = (
    <div className={s.topnav} role="navigation" aria-label="Hauptnavigation">
      {areas.map(area => {
        const isActive = matchesArea(active, area) || area.children.some(c => c.href === active);
        return <Link key={area.href} href={area.href} aria-current={isActive ? 'page' : undefined}>{area.shortLabel ?? area.label}</Link>;
      })}
    </div>
  );

  // Seitenleiste: die Unterpunkte des aktiven Bereichs, gruppiert nach
  // Obergruppe (Hausakte, Arbeitsbereich, Konto ...). Vorher waren hier die
  // fünf Hauptbereiche zu sehen - unabhängig von der Seite. Das war der
  // Hauptunterschied zur Referenz.
  const subNav = pro ? providerAreaSubNav(active) : ownerAreaSubNav(active);
  const sidebarNav = (
    <>
      {subNav.items.length > 0 && (
        <nav aria-label={pro ? 'Arbeitsbereich' : 'Arbeitsbereich'}>
          <p className={s.subgrp}>Arbeitsbereich</p>
          {subNav.items.map((item: { href: string; label: string; active: boolean }) => (
            <Link key={item.href} href={item.href} aria-current={item.active ? 'page' : undefined}>{item.label}</Link>
          ))}
        </nav>
      )}
      {areas.filter(a => a.href !== subNav.area?.href).map(area => (
        <nav key={area.href} aria-label={area.label}>
          <p className={s.subgrp}>{area.label}</p>
          {area.children.map(c => <Link key={c.href} href={c.href}>{c.label}</Link>)}
        </nav>
      ))}
    </>
  );

  return <EHScope app><EHWorkspaceFrame homeHref={pro?"/pro":"/app"}
    context={pro ? 'Partnerbereich' : 'Dein Zuhause'}
    navigation={sidebarNav}
    mainNav={mainNav}
    account={<SidebarAccountMenu name={user?`${user.first_name} ${user.last_name}`:'Profil'} initials={initials} accountLabel={pro?'Partnerkonto':'Eigenheim-Konto'} profileHref={profileHref} settingsHref={pro?'/pro/profile':'/app/settings'} helpHref={pro?'/pro/hilfe':'/app/hilfe'} />}
    mobileMenu={mobileMenu}
    notifications={<>{!pro && <HouseAssistant placement="toolbar" />}<Link href={pro?'/pro/notifications':'/notifications'} className={s.search}><Search size={16}/><span>Suchen</span></Link><Link href="/notifications" aria-label={unread?`${unread} ungelesene Benachrichtigungen`:'Benachrichtigungen'}><Bell size={22}/>{unread>0&&<span>{unread>99?'99+':unread}</span>}</Link>{pro && <Link href={profileHref} aria-label="Profil">{initials}</Link>}</>}
    bottomNav={<BottomNav role={role} active={active}/>} rail={rail}>{breadcrumbs&&breadcrumbs.length>0&&<Breadcrumbs trail={breadcrumbs}/>}{contextTabs&&contextTabs.length>0&&<EHRouteTabs label="Kontextnavigation" items={contextTabs}/>}{children}</EHWorkspaceFrame></EHScope>;
}

export function SectionTitle({ children, href }: {children:React.ReactNode; href?:string}) {
  return <div className="section-title"><strong>{children}</strong>{href && <Link href={href}>Alle anzeigen</Link>}</div>;
}
