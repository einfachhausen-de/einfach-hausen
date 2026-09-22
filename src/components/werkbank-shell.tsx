"use client";

import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { AppSidebar } from './app-sidebar';
import { ClientNav } from './client-nav';
import { HeaderMenu, type MenuJob } from './header-menu';
import type { NoticeItem } from './notifications-menu';
import { SettingsDialogHost } from './settings-dialog-host';
import { HouseAssistant } from './house-assistant';
import { WerkbankSuche } from './werkbank-suche';
import { BottomNav } from './bottom-nav';
import s from './shell.module.css';

export type Crumb = { section: { href: string; label: string } | null; page: string };

/**
 * Client-Huelle des Werkbank-Rahmens: TooltipProvider plus SidebarProvider mit
 * AppSidebar und SidebarInset. Kopfzeile nur Werkzeuge (Trigger, Breadcrumb,
 * Menueleiste mit Suche/Aufträgen/Kalender/Benachrichtigung, Avatar);
 * BottomNav bleibt fuer Mobile erhalten.
 */
export function WerkbankShell({
  role,
  active,
  defaultOpen,
  defaultRailOpen = true,
  pro,
  brandTitle,
  brandSub,
  homeHref,
  userName,
  userSub,
  userInitials,
  unread,
  notices,
  jobsHref,
  jobsCount,
  jobsNewHref,
  jobsList,
  calHref,
  profileHref,
  hilfeHref,
  searchLabel,
  breadcrumb,
  main,
  rail,
}: {
  role: 'homeowner' | 'provider';
  active: string;
  defaultOpen: boolean;
  pro: boolean;
  brandTitle: string;
  brandSub?: string;
  homeHref: string;
  userName: string;
  userSub: string;
  userInitials: string;
  unread: number;
  notices: readonly NoticeItem[];
  jobsHref: string;
  jobsCount: number;
  jobsNewHref: string | null;
  jobsList: readonly MenuJob[];
  calHref: string;
  profileHref: string;
  hilfeHref: string;
  searchLabel: string;
  breadcrumb: Crumb;
  main: ReactNode;
  rail?: ReactNode;
  defaultRailOpen?: boolean;
}) {
  // Der Kundenberater sitzt als rechter Bereich im Fluss - wie die Sidebar
  // links: der Bereich schiebt sich auf, der mittlere Bereich wird schmaler.
  // Nichts schwebt ueber dem Inhalt.
  const [kiOffen, setKiOffen] = useState(false);
  const hatKi = role === 'homeowner';
  // Der rechte Bereich laesst sich am Rand ein- und ausklappen - mit demselben
  // Griff wie die Seitenleiste links. Der Zustand bleibt im Cookie, damit die
  // Seite nach dem Neuladen gleich aussieht.
  const [railZu, setRailZu] = useState(!defaultRailOpen);
  const railId = useId();
  function railUmschalten() {
    setRailZu(zu => {
      const naechster = !zu;
      if (naechster) setKiOffen(false);
      document.cookie = `rail_state=${naechster ? 'false' : 'true'}; path=/; max-age=${60 * 60 * 24 * 7}`;
      return naechster;
    });
  }
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <ClientNav />
        <AppSidebar
          role={role}
          active={active}
          brandTitle={brandTitle}
          brandSub={brandSub}
          homeHref={homeHref}
          userName={userName}
          userSub={userSub}
          userInitials={userInitials}
          unread={unread}
          profileHref={profileHref}
          hilfeHref={hilfeHref}
        />
        <SidebarInset>
          <div className={s['wb-top']}>
            <div className={`${s['wb-tools']} min-w-0 flex-1`}>
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumb.section && (
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href={breadcrumb.section.href}>{breadcrumb.section.label}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  )}
                  {breadcrumb.section && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    <BreadcrumbPage>{breadcrumb.page}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className={s['wb-tools']}>
              <WerkbankSuche pro={pro} label={searchLabel} />
              <HeaderMenu
                jobsHref={jobsHref}
                jobsCount={jobsCount}
                jobsNewHref={jobsNewHref}
                jobsList={jobsList}
                calHref={calHref}
                unread={unread}
                notices={notices}
              />
              <Link
                href={profileHref}
                className={s.toolAvatar}
                aria-label="Profil"
                aria-current={active === profileHref ? 'page' : undefined}
              >
                {userInitials}
              </Link>
            </div>
          </div>
          <div className={s['wb-content']}>
            <main className={s['wb-main']}>{main}</main>
            {(rail || hatKi) && (
              <aside id={railId} aria-label={rail ? 'Kontext dieser Seite' : 'Kundenberater'} className={s['wb-rail']}
                data-ki={hatKi && kiOffen ? 'offen' : undefined} data-zu={railZu || undefined}>
                {/* Griff am Rand des Bereiches, Gegenstueck zum Griff der
                    Seitenleiste: unsichtbarer Streifen, Linie beim Zeigen,
                    Ziehen-Symbol als Zeiger, Klick klappt ein oder aus. */}
                <button type="button" className={s['wb-rail-griff']} aria-controls={railId} aria-expanded={!railZu}
                  aria-label={railZu ? 'Rechten Bereich ausklappen' : 'Rechten Bereich einklappen'}
                  title={railZu ? 'Rechten Bereich ausklappen' : 'Rechten Bereich einklappen'}
                  onClick={railUmschalten} />
                {rail && <div className={s['wb-rail-kontext']}>{rail}</div>}
                {hatKi && <HouseAssistant placement="panel" open={kiOffen} onOpenChange={setKiOffen} />}
              </aside>
            )}
          </div>
          <div className={s['wb-bottom']}>
            <BottomNav role={role} active={active} />
          </div>
        </SidebarInset>
        <SettingsDialogHost />
      </SidebarProvider>
    </TooltipProvider>
  );
}
