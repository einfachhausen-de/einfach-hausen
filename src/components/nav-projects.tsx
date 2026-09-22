"use client";
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import s from './shell.module.css';
export type AccountNavEntry = {
  href: string;
  label: string;
  icon?: ReactNode;
  isActive: boolean;
};
/**
 * Untere Sidebar-Gruppe ("Zentrale" bei Ownern: Ansprechpartner und
 * Benachrichtigungen; "Konto" bei Partnern aus nav-config).
 * IA-Regel ein Thema/ein Owner: reine Deep-Links mit identischem Label und
 * Ziel wie die jeweilige Flaeche, keine Inhalte hier. /app/settings wird
 * global von settings-dialog-host.tsx als Overlay abgefangen (bestehender
 * Vertrag). Einzige Zahl in der Sidebar ist der echte ungelesene
 * Benachrichtigungs-Count auf /notifications - keine Mock-Badges.
 */
export function NavProjects({
  entries,
  label,
  unread,
}: {
  entries: readonly AccountNavEntry[];
  label: string;
  unread: number;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {entries.map((entry) => (
          <SidebarMenuItem key={entry.href}>
            <SidebarMenuButton asChild isActive={entry.isActive} tooltip={entry.label}>
              <Link href={entry.href} aria-current={entry.isActive ? 'page' : undefined} aria-label={entry.label}>
                {entry.icon}
                <span className="group-data-[collapsible=icon]:hidden">{entry.label}</span>
                {entry.href === '/notifications' && unread > 0 && (
                  <span className={`${s.count} group-data-[collapsible=icon]:hidden`}>{unread > 99 ? '99+' : unread}</span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
