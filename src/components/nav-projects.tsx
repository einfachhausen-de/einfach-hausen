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
import { openSettingsDialog } from './settings-dialog-host';

export type AccountNavEntry = {
  href: string;
  label: string;
  icon?: ReactNode;
  isActive: boolean;
  /**
   * Wenn gesetzt, öffnet der Eintrag den Einstellungs-Dialog als Overlay über
   * der aktuellen Seite (mit diesem Default-Bereich), statt zu navigieren.
   */
  dialogSection?: string;
};

/**
 * Konto-Gruppe aus nav-config (ownerAccountItems / providerAccountItems).
 * Einzige Zahl in der Sidebar ist der echte ungelesene
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
            {entry.dialogSection ? (
              <SidebarMenuButton
                type="button"
                isActive={entry.isActive}
                tooltip={entry.label}
                onClick={() => openSettingsDialog(entry.dialogSection)}
              >
                {entry.icon}
                <span>{entry.label}</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild isActive={entry.isActive} tooltip={entry.label}>
                <Link href={entry.href} aria-current={entry.isActive ? 'page' : undefined}>
                  {entry.icon}
                  <span>{entry.label}</span>
                  {entry.href === '/notifications' && unread > 0 && (
                    <span className={s.count}>{unread > 99 ? '99+' : unread}</span>
                  )}
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
