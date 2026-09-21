import { Bell, CircleHelp, Settings, UserRound, UsersRound, WalletCards } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
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
} from './nav-config';
const PROVIDER_ACCOUNT_ICONS = [UserRound, WalletCards, CircleHelp, Settings] as const;
/**
 * App-Navigation aus nav-config: Hauptbereiche je Rolle, echter Nutzer im
 * Footer, Marke im Kopf. Keine Demo-Daten, keine Mock-Badges.
 * IA-Regel ein Thema/ein Owner: Oben die Haus-Navigation, unten die
 * "Zentrale" mit Ansprechpartner und Benachrichtigungen direkt ueber dem
 * Profil-Button. Profil, Hilfe & Kontakt und Einstellungen leben im
 * Avatar-Menue (NavUser), nicht als eigene Sidebar-Zeilen. /app/settings
 * wird global von settings-dialog-host.tsx als Overlay abgefangen
 * (bestehender Vertrag). nav-config bleibt die einzige Quelle: Der
 * Ansprechpartner-Bereich wird hier nur anders platziert, nicht neu
 * definiert (BottomNav, Breadcrumbs und Active-Logik lesen weiter
 * ownerAreas).
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
  // Der Ansprechpartner-Bereich gehoert unten in die Zentrale, nicht in die
  // obere Navigation. Nur Darstellung: ownerAreas bleibt unveraendert.
  const mainAreas = pro ? areas : areas.filter((area) => area.href !== '/app/messages');
  const entries = mainAreas.map((area) => {
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
  // Unten die "Zentrale": Ansprechpartner ueber Benachrichtigungen, direkt
  // ueber dem Profil-Button. Einzige Zahl in der Sidebar ist der echte
  // ungelesene Benachrichtigungs-Count - keine Mock-Badges.
  let bottomEntries: readonly AccountNavEntry[];
  let bottomLabel = 'Konto';
  if (pro) {
    bottomEntries = providerAccountItems.map((item, index) => {
      const Icon = PROVIDER_ACCOUNT_ICONS[index] ?? UserRound;
      return {
        href: item.href,
        label: item.label,
        icon: <Icon />,
        isActive: item.href === active,
      };
    });
  } else {
    const messagesArea = ownerAreas.find((area) => area.href === '/app/messages');
    const MessagesIcon = messagesArea?.icon ?? UsersRound;
    bottomEntries = [
      {
        href: messagesArea?.href ?? '/app/messages',
        label: messagesArea?.label ?? 'Ansprechpartner',
        icon: <MessagesIcon />,
        isActive: messagesArea ? matchesArea(active, messagesArea) : active === '/app/messages',
      },
      {
        href: '/notifications',
        label: 'Benachrichtigungen',
        icon: <Bell />,
        isActive: active === '/notifications',
      },
    ];
    bottomLabel = 'Zentrale';
  }
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <TeamSwitcher title={brandTitle} sub={brandSub} homeHref={homeHref} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain entries={entries} label="Navigation" />
        <NavProjects entries={bottomEntries} label={bottomLabel} unread={unread} />
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
