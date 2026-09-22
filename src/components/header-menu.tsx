"use client";
import Link from 'next/link';
import { Calendar, ClipboardList, FileText, Plus, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NotificationsMenu, type NoticeItem } from './notifications-menu';
import { openSearch } from './werkbank-suche';
import s from './shell.module.css';

export type MenuJob = {
  id: number;
  title: string;
  statusText: string;
  href: string;
};

export type HeaderMenuCounts = {
  jobsHref: string;
  jobsCount: number;
  jobsNewHref: string | null;
  jobsList: readonly MenuJob[];
  calHref: string;
  calCount: number;
  unread: number;
  notices: readonly NoticeItem[];
};

const MENU_ITEM_CLASS = "min-h-[44px] gap-2 px-2 py-2 text-base";

/**
 * Kopf-Menueleiste der Werkbank: Suchen, Aufträge, Kalender,
 * Benachrichtigung — mit echten Zaehlern, wo es etwas Neues gibt
 * (offene Aufträge, bestaetigte bevorstehende Termine, ungelesene
 * Mitteilungen). Suchen oeffnet die Bereichssuche per Event, Kalender ist
 * ein Direkt-Link, Aufträge und Benachrichtigung oeffnen Mini-Listen
 * (laufende Aufträge + Alle Aufträge bzw. neueste Mitteilungen).
 * Optik und Zeilen folgen den bestehenden Topbar-Werkzeugen
 * (44px-Ziele, Token-Farben, Terra-Zaehlplakette).
 */
export function HeaderMenu({ jobsHref, jobsCount, jobsNewHref, jobsList, calHref, calCount, unread, notices }: HeaderMenuCounts) {
  const jobsLabel = jobsCount > 0 ? `Aufträge, ${jobsCount} offen` : 'Aufträge';
  return (
    <nav className={s.menuBar} aria-label="Werkzeugleiste">
      <button type="button" className={s.menuItem} aria-label="Suche öffnen (Cmd + K)" onClick={openSearch}>
        <Search size={20} aria-hidden="true" />
        <span className={s.menuLabel}>Suchen</span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={s.menuItem} aria-label={`${jobsLabel} (Menü)`}>
            <ClipboardList size={20} aria-hidden="true" />
            <span className={s.menuLabel}>Aufträge</span>
            {jobsCount > 0 && <span className={s.toolBadge}>{jobsCount > 99 ? '99+' : jobsCount}</span>}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" sideOffset={8} className="w-80 max-w-[calc(100vw-2rem)] rounded-lg p-2">
          <DropdownMenuLabel className="py-2">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate font-medium">Aufträge</span>
              <span className="shrink-0 opacity-70">{jobsCount > 0 ? `${jobsCount} offen` : 'Nichts offen'}</span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {jobsNewHref && (
            <DropdownMenuItem asChild className={MENU_ITEM_CLASS}>
              <Link href={jobsNewHref} className="text-inherit">
                <Plus size={20} aria-hidden="true" className="shrink-0 opacity-70" />
                <span>Neuer Auftrag</span>
              </Link>
            </DropdownMenuItem>
          )}
          {jobsList.length === 0 && (
            <p className="px-2 py-3 opacity-70">Keine offenen Aufträge.</p>
          )}
          {jobsList.map((job) => (
            <DropdownMenuItem key={job.id} asChild className={MENU_ITEM_CLASS}>
              <Link href={job.href} className="text-inherit">
                <ClipboardList size={20} aria-hidden="true" className="shrink-0 opacity-70" />
                <span className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate font-medium">{job.title}</span>
                  <span className="truncate opacity-70">{job.statusText}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className={MENU_ITEM_CLASS}>
            <Link href={jobsHref} className="text-inherit">
              <FileText size={20} aria-hidden="true" className="shrink-0 opacity-70" />
              <span>Alle Aufträge</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Link
        href={calHref}
        className={s.menuItem}
        aria-label={calCount > 0 ? `Kalender, ${calCount} anstehend` : 'Kalender'}
      >
        <Calendar size={20} aria-hidden="true" />
        <span className={s.menuLabel}>Kalender</span>
        {calCount > 0 && <span className={s.toolBadge}>{calCount > 99 ? '99+' : calCount}</span>}
      </Link>
      <NotificationsMenu unread={unread} items={notices} menuLabel="Benachrichtigung" />
    </nav>
  );
}
