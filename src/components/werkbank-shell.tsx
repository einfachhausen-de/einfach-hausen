"use client";

import Link from 'next/link';
import type { ReactNode } from 'react';
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
import { NotificationsMenu, type NoticeItem } from './notifications-menu';
import { SettingsDialogHost } from './settings-dialog-host';
import { WerkbankSuche } from './werkbank-suche';
import { BottomNav } from './bottom-nav';
import s from './shell.module.css';

export type Crumb = { section: { href: string; label: string } | null; page: string };

/**
 * Client-Huelle des Werkbank-Rahmens: TooltipProvider plus SidebarProvider mit
 * AppSidebar und SidebarInset. Kopfzeile nur Werkzeuge (Trigger, Breadcrumb,
 * Suche, Glocke, Avatar); BottomNav bleibt fuer Mobile erhalten.
 */
export function WerkbankShell({
  role,
  active,
  defaultOpen,
  pro,
  brandTitle,
  brandSub,
  homeHref,
  userName,
  userSub,
  userInitials,
  unread,
  notices,
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
  profileHref: string;
  hilfeHref: string;
  searchLabel: string;
  breadcrumb: Crumb;
  main: ReactNode;
  rail?: ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
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
              <NotificationsMenu unread={unread} items={notices} />
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
            {rail && (
              <aside aria-label="Kontext dieser Seite" className={s['wb-rail']}>
                {rail}
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
