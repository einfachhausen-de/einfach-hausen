import {EHScope, EHRouteTabs, EHWorkspaceFrame, EHWorkspaceNavItem} from "@/design-system";
import Link from 'next/link';
import { HouseAssistant } from './house-assistant';
import { Bell, Menu } from 'lucide-react';
import { BottomNav } from './bottom-nav';
import { matchesArea, ownerAreas, providerAreas, ownerContextTabs, providerContextTabs, type ContextTab } from './nav-config';
import { OwnerMobileMenu } from './owner-menu';
import { SidebarAccountMenu } from './sidebar-account-menu';
import { Breadcrumbs, type Crumb } from './breadcrumbs';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function AppShell({ role, active, children, title, subtitle, breadcrumbs, tabs }: { role:'homeowner'|'provider'; active:string; children:React.ReactNode; title?:string; subtitle?:string; breadcrumbs?:readonly Crumb[]; tabs?:readonly ContextTab[] }) {
  const pro = role === 'provider';
  const user=await getCurrentUser();
  const unread=user&&user.role===role?(db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read_at IS NULL').get(user.id) as {c:number}).c:0;
  const profileHref=pro?'/pro/profile':'/app/profile';
  const initials=user?`${user.first_name?.[0]||''}${user.last_name?.[0]||''}`.toUpperCase():'EH';

  // Contextual navigation: the pages of the current area, always directly under
  // the breadcrumbs. Pages whose views live in the query string pass their own
  // tabs; `tabs={[]}` is the explicit "this page wants none".
  const contextTabs = tabs ?? (pro ? providerContextTabs(active) : ownerContextTabs(active));

  const mobileMenu = pro ? (
    <details className="mobile-menu">
      <summary aria-label="Hauptmenü öffnen"><Menu size={20}/><span>Menü</span></summary>
      <nav className="mobile-menu-panel" aria-label="Hauptnavigation">{providerAreas.map(area=>{const Icon=area.icon;const on=matchesArea(active,area);return <Link key={area.href} href={area.href} className={on?'active':''} aria-current={on?'page':undefined}><Icon size={18}/><span>{area.label}</span></Link>;})}</nav>
    </details>
  ) : (
    <OwnerMobileMenu active={active} />
  );

  return <EHScope app><EHWorkspaceFrame homeHref={pro?"/pro":"/app"}
    context={pro ? "Partnerbereich" : title || "Dein Zuhause"}
    navigation={pro
      ? providerAreas.map(area=>{const Icon=area.icon;return <EHWorkspaceNavItem key={area.href} href={area.href} active={matchesArea(active,area)} icon={<Icon size={22}/>}>{area.label}</EHWorkspaceNavItem>;})
      : ownerAreas.map(area=>{const Icon=area.icon;return <EHWorkspaceNavItem key={area.href} href={area.href} active={matchesArea(active,area)} icon={<Icon size={22}/>}>{area.label}</EHWorkspaceNavItem>;})}
    account={<SidebarAccountMenu name={user?`${user.first_name} ${user.last_name}`:'Profil'} initials={initials} accountLabel={pro?'Partnerkonto':'Eigenheim-Konto'} profileHref={profileHref} settingsHref={pro?'/pro/profile':'/app/settings'} helpHref={pro?'/pro/hilfe':'/app/hilfe'} />}
    mobileMenu={mobileMenu}
    notifications={<>{!pro && <HouseAssistant placement="toolbar" />}<Link href="/notifications" aria-label={unread?`${unread} ungelesene Benachrichtigungen`:'Benachrichtigungen'}><Bell size={22}/>{unread>0&&<span>{unread>99?'99+':unread}</span>}</Link>{pro && <Link href={profileHref} aria-label="Profil">{initials}</Link>}</>}
    bottomNav={<BottomNav role={role} active={active}/>}>{breadcrumbs&&breadcrumbs.length>0&&<Breadcrumbs trail={breadcrumbs}/>}{contextTabs&&contextTabs.length>0&&<EHRouteTabs label="Kontextnavigation" items={contextTabs}/>}{children}</EHWorkspaceFrame></EHScope>;
}

export function SectionTitle({ children, href }: {children:React.ReactNode; href?:string}) {
  return <div className="section-title"><strong>{children}</strong>{href && <Link href={href}>Alle anzeigen</Link>}</div>;
}
