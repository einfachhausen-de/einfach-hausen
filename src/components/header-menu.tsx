"use client";
import Link from 'next/link';
import { Calendar, ClipboardList, FileText, Plus, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SERVICE_CATEGORIES } from '@/components/marketing/service-catalog';
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
  unread: number;
  notices: readonly NoticeItem[];
};

const MENU_ITEM_CLASS = "min-h-[44px] gap-2 px-2 py-2 text-base";

/**
 * Kopf-Menueleiste der Werkbank: Suchen, Aufträge, Benachrichtigung — mit
 * echten Zaehlern, wo es etwas Neues gibt (offene Aufträge, ungelesene
 * Mitteilungen). Suchen oeffnet die Bereichssuche per Event. Das
 * Aufträge-Menue fuehrt Neu (direkt oder ueber einen der 12 Bereiche ins
 * passende Hausmeister-Thema), laufende Aufträge sowie Alle Aufträge und
 * Alle Termine. Benachrichtigung zeigt die neuesten Mitteilungen.
 * Optik: schlanke Bar, reine Icon-Reihen.
 */
export function HeaderMenu({ jobsHref, jobsCount, jobsNewHref, jobsList, calHref, unread, notices }: HeaderMenuCounts) {
  const jobsLabel = jobsCount > 0 ? `Aufträge, ${jobsCount} offen` : 'Aufträge';
  const hasJobsContent = Boolean(jobsNewHref) || jobsList.length > 0;
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
          <DropdownMenuLabel className="py-2">
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate font-medium">Aufträge</span>
              <span className="shrink-0 opacity-70">{jobsCount > 0 ? `${jobsCount} offen` : 'Nichts offen'}</span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {jobsNewHref && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger asChild className={MENU_ITEM_CLASS}>
                <Link href={jobsNewHref} className="text-inherit">
                  <Plus size={16} aria-hidden="true" className="shrink-0 opacity-70" />
                  <span>Neuer Auftrag</span>
                </Link>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-[50vh] w-64 overflow-y-auto rounded-lg p-2">
                {SERVICE_CATEGORIES.map((area) => {
                  const Icon = area.icon;
                  return (
                    <DropdownMenuItem key={area.slug} asChild className={MENU_ITEM_CLASS}>
                      <Link href={`/app/hausmeister?topic=${area.slug}`} className="text-inherit">
                        <Icon size={16} aria-hidden="true" className="shrink-0 opacity-70" />
                        <span>{area.shortTitle}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
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
          {hasJobsContent && <DropdownMenuSeparator />}
          <DropdownMenuItem asChild className={MENU_ITEM_CLASS}>
            <Link href={jobsHref} className="text-inherit">
              <FileText size={16} aria-hidden="true" className="shrink-0 opacity-70" />
              <span>Alle Aufträge</span>
            </Link>
          </DropdownMenuItem>
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
