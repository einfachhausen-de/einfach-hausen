import Link from 'next/link';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import s from './shell.module.css';

/**
 * Marken-Kopf der Sidebar: "eh"-Kachel plus Titel und Adresszeile (brandSub).
 * Kein Team-Dropdown, keine Acme-Demo-Teams, kein "Add team".
 */
export function TeamSwitcher({ title, sub, homeHref }: { title: string; sub?: string; homeHref: string }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild tooltip={title}>
          <Link href={homeHref} aria-label={title}>
            <span className={s['wb-mark']} aria-hidden="true">
              eh
            </span>
            <span className="grid flex-1 text-left leading-tight">
              <span className="truncate font-medium">{title}</span>
              {sub ? <span className="truncate opacity-70">{sub}</span> : null}
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
