import {EHScope, EHWorkspaceFrame, EHWorkspaceNavItem} from "@/design-system";
import Link from 'next/link';
import { HouseAssistant } from './house-assistant';
import { Bell, Menu } from 'lucide-react';
import { BottomNav, isNavActive, ownerNav, providerNav } from './bottom-nav';
import { OwnerMobileMenu } from './owner-menu';
import { SidebarAccountMenu } from './sidebar-account-menu';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function AppShell({ role, active, children, title, subtitle }: { role:'homeowner'|'provider'; active:string; children:React.ReactNode; title?:string; subtitle?:string }) {
  const pro = role === 'provider';
  const user=await getCurrentUser();
  const unread=user&&user.role===role?(db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read_at IS NULL').get(user.id) as {c:number}).c:0;
  const items=pro?providerNav:ownerNav;
  const profileHref=pro?'/pro/profile':'/app/profile';
  const initials=user?`${user.first_name?.[0]||''}${user.last_name?.[0]||''}`.toUpperCase():'EH';

  const mobileMenu = pro ? (
    <details className="mobile-menu">
      <summary aria-label="Hauptmenü öffnen"><Menu size={20}/><span>Menü</span></summary>
      <nav className="mobile-menu-panel" aria-label="Hauptnavigation">{items.map(([href,Icon,label])=><Link key={href} href={href} className={isNavActive(active,href)?'active':''}><Icon size={18}/><span>{label}</span></Link>)}</nav>
    </details>
  ) : (
    <OwnerMobileMenu active={active} />
  );

  return <EHScope app><EHWorkspaceFrame homeHref={pro?"/pro":"/app"}
    context={pro ? "Partnerbereich" : title || "Dein Zuhause"}
    navigation={items.map(([href,Icon,label])=><EHWorkspaceNavItem key={href} href={href} active={isNavActive(active,href)} icon={<Icon size={22}/>}>{label}</EHWorkspaceNavItem>)}
    account={<SidebarAccountMenu name={user?`${user.first_name} ${user.last_name}`:'Profil'} initials={initials} accountLabel={pro?'Partnerkonto':'Eigenheim-Konto'} profileHref={profileHref} settingsHref={pro?'/pro/profile':'/app/settings'} helpHref={pro?'/pro/hilfe':'/app/hilfe'} />}
    mobileMenu={mobileMenu}
    notifications={<>{!pro && <HouseAssistant placement="toolbar" />}<Link href="/notifications" aria-label={unread?`${unread} ungelesene Benachrichtigungen`:'Benachrichtigungen'}><Bell size={22}/>{unread>0&&<span>{unread>99?'99+':unread}</span>}</Link>{pro && <Link href={profileHref} aria-label="Profil">{initials}</Link>}</>}
    bottomNav={<BottomNav role={role} active={active}/>}>{children}</EHWorkspaceFrame></EHScope>;
}

export function SectionTitle({ children, href }: {children:React.ReactNode; href?:string}) {
  return <div className="section-title"><strong>{children}</strong>{href && <Link href={href}>Alle anzeigen</Link>}</div>;
}
