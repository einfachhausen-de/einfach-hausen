import Link from 'next/link';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import s from './shell.module.css';

const WORDMARK = 'einfach hausen';

/**
 * Marken-Kopf der Sidebar: Original-Logo (eingeklappt das Logo-Zeichen) plus
 * Kontextzeilen. Der Wortmarken-Titel wird nicht doppelt als Text gesetzt,
 * weil das Logo ihn bereits traegt; Betriebsname und Adresse bleiben sichtbar.
 */
export function TeamSwitcher({ title, sub, homeHref }: { title: string; sub?: string; homeHref: string }) {
  const lines = [title, sub].filter((line): line is string => Boolean(line) && line!.toLowerCase() !== WORDMARK);
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild tooltip={title}>
          <Link href={homeHref} aria-label={`${title} – Start`}>
            <img
              src="/brand/logo-full.png"
              alt=""
              width={58}
              height={40}
              className={`${s['wb-logo']} group-data-[collapsible=icon]:hidden`}
            />
            <img
              src="/brand/logo-mark.png"
              alt=""
              width={32}
              height={24}
              className={`${s['wb-logo-mark']} hidden group-data-[collapsible=icon]:block`}
            />
            {lines.length > 0 && (
              <span className={`${s['wb-brand-copy']} group-data-[collapsible=icon]:hidden`}>
                <span className="truncate font-semibold">{lines[0]}</span>
                {lines[1] ? <span className="truncate opacity-70">{lines[1]}</span> : null}
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
