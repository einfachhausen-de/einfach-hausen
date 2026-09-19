"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Bell, ChevronsUpDown, CircleHelp, LogOut, UserRound } from 'lucide-react';
import { logoutAction } from '@/app/actions';
import s from './shell.module.css';

/**
 * Echter eingeloggter Nutzer (Name, Konto-Untertitel, Initialen) plus Logout.
 * Menuepunkte sind echte Routen (Profil, Benachrichtigungen mit echtem Count,
 * Hilfe) - keine Upgrade-/Billing-Demo-Eintraege.
 */
export function NavUser({
  name,
  sub,
  initials,
  profileHref,
  hilfeHref,
  notificationsHref,
  unread,
}: {
  name: string;
  sub: string;
  initials: string;
  profileHref: string;
  hilfeHref: string;
  notificationsHref: string;
  unread: number;
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate opacity-70">{sub}</span>
              </span>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isMobile ? 'bottom' : 'right'} align="end" sideOffset={4}>
            <DropdownMenuLabel>
              <span className="flex items-center gap-2">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate opacity-70">{sub}</span>
                </span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={profileHref}>
                  <UserRound />
                  <span>Profil und Einstellungen</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={notificationsHref}>
                  <Bell />
                  <span>Benachrichtigungen</span>
                  {unread > 0 && <span className={s.count}>{unread > 99 ? '99+' : unread}</span>}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={hilfeHref}>
                  <CircleHelp />
                  <span>Hilfe und Kontakt</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logoutAction}>
                <button type="submit" aria-label="Abmelden" className="flex items-center gap-2">
                  <LogOut />
                  <span>Abmelden</span>
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
