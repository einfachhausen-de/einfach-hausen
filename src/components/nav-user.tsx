"use client";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { ChevronsUpDown, LogOut, Settings } from 'lucide-react';
import { logoutAction } from '@/app/actions';
import { openSettingsDialog } from './settings-dialog-host';
/** Session-Menue: Identitaet, Einstieg in den Einstellungs-Dialog, Abmelden. IA-Regel: Popover besitzt ausschliesslich Session & Identitaet. Keine Nav-Duplikate, keine Badges hier. */
export function NavUser({ name, sub, initials }: { name: string; sub: string; initials: string }) {
  const { isMobile } = useSidebar();
  return (
    <SidebarMenu><SidebarMenuItem><DropdownMenu>
      <DropdownMenuTrigger asChild><SidebarMenuButton size="lg">
        <Avatar className="size-8 rounded-lg"><AvatarFallback className="rounded-lg">{initials}</AvatarFallback></Avatar>
        <span className="grid flex-1 text-left leading-tight"><span className="truncate font-medium">{name}</span><span className="truncate opacity-70">{sub}</span></span>
        <ChevronsUpDown className="ml-auto size-4" />
      </SidebarMenuButton></DropdownMenuTrigger>
      <DropdownMenuContent side={isMobile ? 'bottom' : 'right'} align="end" sideOffset={4} className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56">
        <DropdownMenuLabel className="py-3"><span className="flex items-center gap-3">
          <Avatar className="size-9 rounded-lg"><AvatarFallback className="rounded-lg">{initials}</AvatarFallback></Avatar>
          <span className="grid flex-1 text-left leading-tight"><span className="truncate font-medium">{name}</span><span className="truncate text-xs opacity-70">{sub}</span></span>
        </span></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openSettingsDialog('account')}><Settings /><span>Einstellungen</span></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><form action={logoutAction}><button type="submit" aria-label="Abmelden" className="flex w-full items-center gap-2"><LogOut /><span>Abmelden</span></button></form></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu></SidebarMenuItem></SidebarMenu>
  );
}
