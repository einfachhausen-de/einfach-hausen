"use client";

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { ChevronRightIcon } from 'lucide-react';

export type MainNavChild = { href: string; label: string; isActive: boolean };

export type MainNavEntry = {
  href: string;
  label: string;
  icon?: ReactNode;
  isActive: boolean;
  exact: boolean;
  items: readonly MainNavChild[];
};

/**
 * Hauptbereiche aus nav-config (ownerAreas / providerAreas).
 * Der Eltern-Eintrag ist ein echtes Link-Ziel, das Chevron oeffnet nur die
 * Unterpunkte. Aktiv-Logik (matchesArea) liefert der Server-Rahmen.
 */
export function NavMain({ entries, label }: { entries: readonly MainNavEntry[]; label: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {entries.map((entry) =>
          entry.items.length === 0 ? (
            <SidebarMenuItem key={entry.href}>
              <SidebarMenuButton asChild isActive={entry.isActive} tooltip={entry.label}>
                <Link href={entry.href} aria-current={entry.isActive ? 'page' : undefined}>
                  {entry.icon}
                  <span>{entry.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <NavCollapsibleEntry key={entry.href} entry={entry} />
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

/**
 * Unkontrollierter Collapsible-State (`defaultOpen`) greift nur beim ersten
 * Mount: Bei Client-Navigation (kein Full-Reload, kein Remount des
 * Sidebar-Baums) blieb ein per Route aktiv gewordener Abschnitt geschlossen
 * bzw. ein ehemals aktiver offen — die Seitenleiste „klappte“ scheinbar zu.
 * Der aktive-sensitive `key` mountet den Abschnitt genau beim Wechsel des
 * Aktiv-Zustands neu, sodass `defaultOpen` wieder aus der aktiven Route
 * abgeleitet wird; manuelles Umschalten bleibt dazwischen erhalten.
 * Das mobile Sheet-Schließen bei Navigation ist korrektes Verhalten und
 * bleibt unverändert.
 */
function NavCollapsibleEntry({ entry }: { entry: MainNavEntry }) {
  return (
    <Collapsible
      key={entry.isActive ? `${entry.href}:active` : entry.href}
      asChild
      defaultOpen={entry.isActive}
    >
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={entry.isActive} tooltip={entry.label}>
          <Link href={entry.href} aria-current={entry.exact ? 'page' : undefined}>
            {entry.icon}
            <span>{entry.label}</span>
          </Link>
        </SidebarMenuButton>
        <CollapsibleTrigger asChild>
          <SidebarMenuAction aria-label={`Untermenue ${entry.label} umschalten`}>
            <ChevronRightIcon />
          </SidebarMenuAction>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {entry.items.map((child) => (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton asChild isActive={child.isActive}>
                  <Link href={child.href} aria-current={child.isActive ? 'page' : undefined}>
                    <span>{child.label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
