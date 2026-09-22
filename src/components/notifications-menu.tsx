"use client";
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import s from './shell.module.css';

export type NoticeItem = {
  id: number;
  title: string;
  body: string;
  href: string;
  unread: boolean;
  when: string;
};

/**
 * Glocken-Menue in der Werkbank-Kopfzeile: die fuenf neuesten Mitteilungen
 * (ungelesene zuerst) als Mini-Liste wie das Avatar-Menue, dazu "Alle
 * ansehen" nach /notifications. Keine Mutationen hier — Lesestand und
 * Vollstaendigkeit leben weiter auf der Benachrichtigungsseite. Zeilen und
 * Ecken folgen der Menue-Geometrie (min-h 44px, rounded-md).
 */
const MENU_ITEM_CLASS = "min-h-[44px] gap-2 px-2 py-2 text-sm";

export function NotificationsMenu({ unread, items, menuLabel }: { unread: number; items: readonly NoticeItem[]; menuLabel?: string }) {
  const label = menuLabel
    ? (unread > 0 ? `${menuLabel}, ${unread} ungelesen` : menuLabel)
    : (unread > 0 ? `${unread} ungelesene Benachrichtigungen` : 'Benachrichtigungen');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={menuLabel ? s.menuItem : s.toolIcon}
          aria-label={menuLabel ? `${label} (Menü)` : label}
        >
          <Bell size={menuLabel ? 18 : 22} />
          {menuLabel ? <span className={s.menuLabel}>{menuLabel}</span> : null}
          {unread > 0 && <span className={s.toolBadge}>{unread > 99 ? '99+' : unread}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" sideOffset={8} className="w-80 max-w-[calc(100vw-2rem)] rounded-md p-2">
        <DropdownMenuLabel className="py-2">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate font-medium">Benachrichtigungen</span>
            <span className="shrink-0 opacity-70">{unread > 0 ? `${unread} ungelesen` : 'Alles gelesen'}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 && (
          <p className="px-2 py-3 opacity-70">Noch keine Benachrichtigungen. Wichtige Änderungen erscheinen hier automatisch.</p>
        )}
        {items.map((item) => (
          <DropdownMenuItem key={item.id} asChild className={MENU_ITEM_CLASS}>
            <Link href={item.href} className="text-inherit">
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-medium">{item.unread ? `${item.title} · ungelesen` : item.title}</span>
                {item.body ? <span className="truncate opacity-70">{item.body}</span> : null}
                <span className="truncate opacity-70">{item.when}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className={MENU_ITEM_CLASS}>
          <Link href="/notifications" className="text-inherit"><span>Alle ansehen</span></Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
