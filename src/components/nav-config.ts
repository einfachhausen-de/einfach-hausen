import { ClipboardList, FileSignature, Home, House, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavChild = { href: string; label: string };

export type NavArea = {
  href: string;
  label: string;
  icon: LucideIcon;
  /**
   * Routes that belong to this area although they do not sit below its own
   * path. Without this, /app/documents or /app/year would leave the owner
   * navigation without an active state.
   */
  owns: readonly string[];
  children: readonly NavChild[];
};

// One source of truth for the owner navigation. Sidebar, bottom navigation and
// the mobile drawer all read from here - previously each of them carried its own
// list with its own labels and targets.
export const ownerAreas: readonly NavArea[] = [
  {
    href: '/app',
    label: 'Start',
    icon: Home,
    owns: ['/app/hausmeister', '/app/hausmanager', '/app/consultation', '/app/emergency', '/app/insurance', '/app/onboarding'],
    children: [],
  },
  {
    href: '/app/home',
    label: 'Hausakte',
    icon: House,
    owns: ['/app/documents', '/app/year'],
    children: [
      { href: '/app/home', label: 'Übersicht' },
      { href: '/app/home/history', label: 'Historie' },
      { href: '/app/documents', label: 'Dokumente' },
      { href: '/app/year', label: 'Wartung' },
      { href: '/app/home/passport', label: 'Hauspass' },
      { href: '/app/home/sale', label: 'Verkauf' },
    ],
  },
  {
    href: '/app/contracts',
    label: 'Verträge & Tarife',
    icon: FileSignature,
    owns: [],
    children: [
      { href: '/app/contracts?tab=vertraege', label: 'Laufende Verträge' },
      { href: '/app/contracts?tab=sparcheck', label: 'Spar-Check' },
    ],
  },
  {
    href: '/app/jobs',
    label: 'Aufträge & Termine',
    icon: ClipboardList,
    owns: ['/app/calendar'],
    children: [
      { href: '/app/jobs', label: 'Aktiv' },
      { href: '/app/jobs?tab=completed', label: 'Abgeschlossen' },
      { href: '/app/calendar', label: 'Termine' },
    ],
  },
  {
    href: '/app/messages',
    label: 'Ansprechpartner',
    icon: UsersRound,
    owns: ['/app/partners'],
    children: [],
  },
];

/**
 * Account destinations are deliberately not part of the main navigation: they
 * describe the person, not the house. They live in the account menu instead.
 */
export const ownerAccountItems: readonly NavChild[] = [
  { href: '/app/profile', label: 'Profil & Einstellungen' },
  { href: '/notifications', label: 'Benachrichtigungen' },
  { href: '/app/plans', label: 'Mitgliedschaft & Pakete' },
  { href: '/app/hilfe', label: 'Hilfe & Kontakt' },
];

export function matchesArea(active: string, area: NavArea): boolean {
  if (active === area.href) return true;
  if (area.owns.includes(active)) return true;
  // /app is the prefix of every owner route, so it must not match by prefix.
  if (area.href === '/app') return false;
  return active.startsWith(`${area.href}/`);
}

export function activeArea(active: string): NavArea | undefined {
  return ownerAreas.find((area) => matchesArea(active, area));
}
