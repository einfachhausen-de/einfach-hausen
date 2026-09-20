import { Bell, CircleHelp, Settings, UserRound, WalletCards } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavProjects } from '@/components/nav-projects';
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
  ownerAccountItems,
  ownerAreas,
  providerAccountItems,
  providerAreas,
} from './nav-config';
const OWNER_ACCOUNT_ICONS = [UserRound, Bell, WalletCards, CircleHelp, Settings] as const;
const PROVIDER_ACCOUNT_ICONS = [UserRound, WalletCards, CircleHelp, Settings] as const;
/**
 * App-Navigation aus nav-config: Hauptbereiche je Rolle plus Konto-Gruppe,
 * echter Nutzer im Footer, Marke im Kopf. Keine Demo-Daten, keine Mock-Badges.
 * IA-Regel ein Thema/ein Owner: Die Konto-Gruppe enthaelt reine Deep-Links mit
 * identischem Label und Ziel wie die Owner-Flaeche. /app/settings wird global
 * von settings-dialog-host.tsx als Overlay abgefangen (bestehender Vertrag).
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
  const entries = areas.map((area) => {
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
  });
  const accountItems = pro ? providerAccountItems : ownerAccountItems;
  const accountIcons = pro ? PROVIDER_ACCOUNT_ICONS : OWNER_ACCOUNT_ICONS;
  const accountEntries = accountItems.map((item, index) => {
    const Icon = accountIcons[index] ?? UserRound;
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
        <NavProjects entries={accountEntries} label="Konto" unread={unread} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          name={userName}
          sub={userSub}
          initials={userInitials}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
