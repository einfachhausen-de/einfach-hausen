"use client";
import Link from 'next/link';
import { Calendar, CalendarDays, ClipboardList, FileText, Plus, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NotificationsMenu, type NoticeItem } from './notifications-menu';
import { openSearch } from './werkbank-suche';
import s from './shell.module.css';

export type MenuJob = {
  id: number;
  title: string;
  statusText: string;
  href: string;
};

export type MenuEvent = {
  id: number;
  title: string;
  when: string;
  href: string;
};

export type HeaderMenuCounts = {
  jobsHref: string;
  jobsCount: number;
  jobsNewHref: string | null;
  jobsList: readonly MenuJob[];
  calHref: string;
  calCount: number;
  calList: readonly MenuEvent[];
  unread: number;
  notices: readonly NoticeItem[];
};

const MENU_ITEM_CLASS = "min-h-[44px] gap-2 px-2 py-2 text-base";

/**
 * Kopf-Menueleiste der Werkbank: Suchen, Aufträge, Kalender,
 * Benachrichtigung — mit echten Zaehlern, wo es etwas Neues gibt
 * (offene Aufträge, bestaetigte bevorstehende Termine, ungelesene
 * Mitteilungen). Suchen oeffnet die Bereichssuche per Event, Aufträge und
 * Kalender oeffnen Mini-Listen (laufende Einträge + Alle-Ansicht),
 * Benachrichtigung die neuesten Mitteilungen.
 * Optik und Zeilen folgen der Referenz (schlanke Bar, Icon-Reihen ohne
 * Kopf- und Leertext) in Token-Farben, Terra-Zaehlplakette.
 */
export function HeaderMenu({ jobsHref, jobsCount, jobsNewHref, jobsList, calHref, calCount, calList, unread, notices }: HeaderMenuCounts) {
  const jobsLabel = jobsCount > 0 ? `Aufträge, ${jobsCount} offen` : 'Aufträge';
  const calLabel = calCount > 0 ? `Kalender, ${calCount} anstehend` : 'Kalender';
  return (
    <nav className={s.menuBar} aria-label="Werkzeugleiste">
      <button type="button" className={s.menuItem} aria-label="Suche öffnen (Cmd + K)" onClick={openSearch}>
        <Search size={16} aria-hidden="true" />
        <span className={s.menuLabel}>Suchen</span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={s.menuItem} aria-label={`${jobsLabel} (Menü)`}>
            <ClipboardList size={16} aria-hidden="true" />
            <span className={s.menuLabel}>Aufträge</span>
            {jobsCount > 0 && <span className={s.toolBadge}>{jobsCount > 99 ? '99+' : jobsCount}</span>}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" sideOffset={8} className="w-80 max-w-[calc(100vw-2rem)] rounded-lg p-2">
          {jobsNewHref && (
            <DropdownMenuItem asChild className={MENU_ITEM_CLASS}>
              <Link href={jobsNewHref} className="text-inherit">
                <Plus size={16} aria-hidden="true" className="shrink-0 opacity-70" />
                <span>Neuer Auftrag</span>
              </Link>
            </DropdownMenuItem>
          )}
          {jobsList.map((job) => (
            <DropdownMenuItem key={job.id} asChild className={MENU_ITEM_CLASS}>
              <Link href={job.href} className="text-inherit">
                <ClipboardList size={16} aria-hidden="true" className="shrink-0 opacity-70" />
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
              <FileText size={16} aria-hidden="true" className="shrink-0 opacity-70" />
              <span>Alle Aufträge</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={s.menuItem} aria-label={`${calLabel} (Menü)`}>
            <Calendar size={16} aria-hidden="true" />
            <span className={s.menuLabel}>Kalender</span>
            {calCount > 0 && <span className={s.toolBadge}>{calCount > 99 ? '99+' : calCount}</span>}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" sideOffset={8} className="w-80 max-w-[calc(100vw-2rem)] rounded-lg p-2">
          {calList.map((event) => (
            <DropdownMenuItem key={event.id} asChild className={MENU_ITEM_CLASS}>
              <Link href={event.href} className="text-inherit">
                <CalendarDays size={16} aria-hidden="true" className="shrink-0 opacity-70" />
                <span className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate font-medium">{event.title}</span>
                  <span className="truncate opacity-70">{event.when}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className={MENU_ITEM_CLASS}>
            <Link href={calHref} className="text-inherit">
              <Calendar size={16} aria-hidden="true" className="shrink-0 opacity-70" />
              <span>Alle Termine</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NotificationsMenu unread={unread} items={notices} menuLabel="Benachrichtigung" />
    </nav>
  );
}
