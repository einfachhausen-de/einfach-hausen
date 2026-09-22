import { Bell, CircleHelp, Settings, UserRound, WalletCards } from 'lucide-react';
import { NavMain, type MainNavEntry } from '@/components/nav-main';
import { NavProjects, type AccountNavEntry } from '@/components/nav-projects';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  matchesArea,
  ownerAreas,
  providerAccountItems,
  providerAreas,
  type NavArea,
} from './nav-config';
import s from './shell.module.css';
const PROVIDER_ACCOUNT_ICONS = [UserRound, WalletCards, CircleHelp, Settings] as const;
/**
 * App-Navigation aus nav-config: Hauptbereiche je Rolle, echter Nutzer im
 * Footer, Marke im Kopf. Keine Demo-Daten, keine Mock-Badges.
 * IA-Regel ein Thema/ein Owner: Oben die Haus-Navigation (Start, Aufträge &
 * Termine, Verträge & Tarife), unten die "Zentrale" mit Hausakte (mit
 * Unterpunkten), Ansprechpartner und Benachrichtigungen direkt ueber dem
 * Profil-Button. Profil, Hilfe & Kontakt und Einstellungen leben im
 * Avatar-Menue (NavUser), nicht als eigene Sidebar-Zeilen. /app/settings
 * wird global von settings-dialog-host.tsx als Overlay abgefangen
 * (bestehender Vertrag). nav-config bleibt die einzige Quelle: Bereiche
 * werden hier nur anders platziert und sortiert, nicht neu definiert
 * (BottomNav, Breadcrumbs und Active-Logik lesen weiter ownerAreas).
 */
export function AppSidebar({
  role,
  active,
  brandTitle,
  brandSub,
  homeHref,
  userName,
  userSub,
  userInitials,
  unread,
  profileHref,
  hilfeHref,
}: {
  role: 'homeowner' | 'provider';
  active: string;
  brandTitle: string;
  brandSub?: string;
  homeHref: string;
  userName: string;
  userSub: string;
  userInitials: string;
  unread: number;
  profileHref: string;
  hilfeHref: string;
}) {
  const pro = role === 'provider';
  const areas = pro ? providerAreas : ownerAreas;
  const toEntry = (area: NavArea): MainNavEntry => {
    const Icon = area.icon;
    const items = area.children.map((child) => ({
      href: child.href,
      label: child.label,
      isActive: child.href === active,
    }));
    return {
      href: area.href,
      label: area.label,
      icon: <Icon />,
      isActive: matchesArea(active, area) || items.some((item) => item.isActive),
      exact: area.href === active,
      items,
    };
  };
  const byHref = new Map(areas.map((area) => [area.href, area] as const));
  // Obere Navigation der Owner: Start, Aufträge & Termine, Verträge & Tarife.
  // Nur Darstellung und Reihenfolge: ownerAreas bleibt unveraendert.
  const topHrefs = pro ? areas.map((area) => area.href) : ['/app', '/app/jobs', '/app/contracts'];
  const entries: readonly MainNavEntry[] = topHrefs.flatMap((href) => {
    const area = byHref.get(href);
    return area ? [toEntry(area)] : [];
  });
  // Unten die "Zentrale": Hausakte (mit Unterpunkten) ueber Ansprechpartner
  // ueber Benachrichtigungen, direkt ueber dem Profil-Button. Einzige Zahl
  // in der Sidebar ist der echte ungelesene Benachrichtigungs-Count -
  // keine Mock-Badges.
  const bottomMain: readonly MainNavEntry[] | null = pro
    ? null
    : [
        ...(byHref.get('/app/home') ? [toEntry(byHref.get('/app/home')!)] : []),
        ...(byHref.get('/app/messages') ? [toEntry(byHref.get('/app/messages')!)] : []),
        {
          href: '/notifications',
          label: 'Benachrichtigungen',
          icon: <Bell />,
          isActive: active === '/notifications',
          exact: active === '/notifications',
          items: [],
          badge:
            unread > 0 ? (
              <span className={`${s.count} group-data-[collapsible=icon]:hidden`}>
                {unread > 99 ? '99+' : unread}
              </span>
            ) : undefined,
        },
      ];
  const providerBottom: readonly AccountNavEntry[] = providerAccountItems.map((item, index) => {
    const Icon = PROVIDER_ACCOUNT_ICONS[index] ?? UserRound;
    return {
      href: item.href,
      label: item.label,
      icon: <Icon />,
      isActive: item.href === active,
    };
  });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher title={brandTitle} sub={brandSub} homeHref={homeHref} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain entries={entries} label="Navigation" />
        {pro ? (
          <NavProjects entries={providerBottom} label="Konto" unread={unread} />
        ) : (
          bottomMain && <NavMain entries={bottomMain} label="Zentrale" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          name={userName}
          sub={userSub}
          initials={userInitials}
          profileHref={profileHref}
          hilfeHref={hilfeHref}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
