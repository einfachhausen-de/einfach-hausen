"use client";
import Link from 'next/link';
import { Calendar, ClipboardList, Search } from 'lucide-react';
import { NotificationsMenu, type NoticeItem } from './notifications-menu';
import { openSearch } from './werkbank-suche';
import s from './shell.module.css';

export type HeaderMenuCounts = {
  jobsHref: string;
  jobsCount: number;
  calHref: string;
  calCount: number;
  unread: number;
  notices: readonly NoticeItem[];
};

/**
 * Kopf-Menueleiste der Werkbank: Suchen, Aufträge, Kalender,
 * Benachrichtigung — mit echten Zaehlern, wo es etwas Neues gibt
 * (offene Aufträge, bestaetigte bevorstehende Termine, ungelesene
 * Mitteilungen). Links navigieren clientseitig, Suchen oeffnet die
 * Bereichssuche per Event, Benachrichtigung oeffnet die Mini-Liste.
 * Optik und Zeilen folgen den bestehenden Topbar-Werkzeugen
 * (44px-Ziele, Token-Farben, Terra-Zaehlplakette).
 */
export function HeaderMenu({ jobsHref, jobsCount, calHref, calCount, unread, notices }: HeaderMenuCounts) {
  return (
    <nav className={s.menuBar} aria-label="Werkzeugleiste">
      <button type="button" className={s.menuItem} aria-label="Suche öffnen (Cmd + K)" onClick={openSearch}>
        <Search size={18} aria-hidden="true" />
        <span className={s.menuLabel}>Suchen</span>
      </button>
      <Link
        href={jobsHref}
        className={s.menuItem}
        aria-label={jobsCount > 0 ? `Aufträge, ${jobsCount} offen` : 'Aufträge'}
      >
        <ClipboardList size={18} aria-hidden="true" />
        <span className={s.menuLabel}>Aufträge</span>
        {jobsCount > 0 && <span className={s.toolBadge}>{jobsCount > 99 ? '99+' : jobsCount}</span>}
      </Link>
      <Link
        href={calHref}
        className={s.menuItem}
        aria-label={calCount > 0 ? `Kalender, ${calCount} anstehend` : 'Kalender'}
      >
        <Calendar size={18} aria-hidden="true" />
        <span className={s.menuLabel}>Kalender</span>
        {calCount > 0 && <span className={s.toolBadge}>{calCount > 99 ? '99+' : calCount}</span>}
      </Link>
      <NotificationsMenu unread={unread} items={notices} menuLabel="Benachrichtigung" />
    </nav>
  );
}
