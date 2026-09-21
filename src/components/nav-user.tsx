"use client";
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { ChevronsUpDown, CircleHelp, LogOut, Settings, UserRound } from 'lucide-react';
import { logoutAction } from '@/app/actions';
import { openSettingsDialog } from './settings-dialog-host';
/**
 * Session-Menue im Sidebar-Fuss: Identitaet, Profil, Hilfe & Kontakt, Einstieg
 * in den Einstellungs-Dialog, Abmelden. Das Menue oeffnet sich nach oben
 * (side="top"), damit es direkt ueber dem Profil-Button liegt und nicht als
 * abgeschnittene Karte rechts ueber dem Inhalt schwebt. Keine Nav-Duplikate
 * aus der Haupt-Navigation, keine Badges hier.
 */
export function NavUser({ name, sub, initials, profileHref, hilfeHref }: { name: string; sub: string; initials: string; profileHref: string; hilfeHref: string }) {
  const { isMobile } = useSidebar();
  return (
    <SidebarMenu><SidebarMenuItem><DropdownMenu>
      <DropdownMenuTrigger asChild><SidebarMenuButton size="lg" aria-label="Kontomenü öffnen">
        <Avatar className="size-8 rounded-lg"><AvatarFallback className="rounded-lg">{initials}</AvatarFallback></Avatar>
        <span className="grid flex-1 text-left leading-tight"><span className="truncate font-medium">{name}</span><span className="truncate opacity-70">{sub}</span></span>
        <ChevronsUpDown className="ml-auto size-4" />
      </SidebarMenuButton></DropdownMenuTrigger>
      <DropdownMenuContent side={isMobile ? 'bottom' : 'top'} align="end" sideOffset={8} className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56">
        <DropdownMenuLabel className="py-3"><span className="flex items-center gap-3">
          <Avatar className="size-9 rounded-lg"><AvatarFallback className="rounded-lg">{initials}</AvatarFallback></Avatar>
          <span className="grid flex-1 text-left leading-tight"><span className="truncate font-medium">{name}</span><span className="truncate text-xs opacity-70">{sub}</span></span>
        </span></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href={profileHref}><UserRound /><span>Profil</span></Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href={hilfeHref}><CircleHelp /><span>Hilfe & Kontakt</span></Link></DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openSettingsDialog('account')}><Settings /><span>Einstellungen</span></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><form action={logoutAction}><button type="submit" aria-label="Abmelden" className="flex w-full items-center gap-2"><LogOut /><span>Abmelden</span></button></form></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu></SidebarMenuItem></SidebarMenu>
  );
}
