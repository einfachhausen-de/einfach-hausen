import { ClipboardList, FileSignature, Home, House, MessageSquare, UsersRound, UserRound } from 'lucide-react';
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
      { href: '/app/year', label: 'Mein Jahr' },
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
    // The status views of the job list (offen, in Arbeit, abgeschlossen) are
    // filters inside one page, not destinations of their own - they stay in the
    // page and must not pretend to be navigation.
    children: [
      { href: '/app/jobs', label: 'Aufträge' },
      { href: '/app/calendar', label: 'Termine' },
    ],
  },
  {
    href: '/app/messages',
    label: 'Ansprechpartner',
    icon: UsersRound,
    owns: ['/app/partners'],
    // /app/partners redirects to /app/messages: one surface, one destination.
    // A tab pointing at it would be a second label for the same page.
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

/**
 * Profil and App-Einstellungen are one place with two views, so they carry tabs
 * like every other multi-page destination. They are not an ownerArea because
 * they describe the account, not the house.
 */
export const ownerAccountTabs: readonly NavChild[] = [
  { href: '/app/profile', label: 'Profil' },
  { href: '/app/settings', label: 'App-Einstellungen' },
];

// The partner navigation follows the same rules as the owner navigation: one
// list, "owns" for routes that live elsewhere, children for its own pages.
export const providerAreas: readonly NavArea[] = [
  {
    href: '/pro',
    label: 'Anfragen',
    icon: Home,
    // /pro/leads is a destination of this area, so it needs a link and not only
    // an active state - it is a child here. /pro/onboarding stays in "owns"
    // alone: it is a one-time setup flow that the profile already links to, not
    // a page anyone switches between.
    owns: ['/pro/onboarding', '/pro/leads'],
    children: [
      { href: '/pro', label: 'Anfragen' },
      { href: '/pro/leads', label: 'Immobilien-Leads' },
    ],
  },
  {
    href: '/pro/orders',
    label: 'Aufträge',
    icon: ClipboardList,
    // /pro/jobs is a redirect stub onto /pro/orders. /pro/invoices is not here:
    // only /pro/invoices/[id] exists, the bare path has no page.
    owns: ['/pro/jobs'],
    children: [
      { href: '/pro/orders', label: 'Aufträge' },
      { href: '/pro/calendar', label: 'Termine' },
    ],
  },
  { href: '/pro/messages', label: 'Nachrichten', icon: MessageSquare, owns: [], children: [] },
  { href: '/pro/team', label: 'Team', icon: UsersRound, owns: [], children: [] },
  {
    href: '/pro/profile',
    label: 'Profil',
    icon: UserRound,
    owns: ['/pro/plans', '/pro/hilfe'],
    children: [
      { href: '/pro/profile', label: 'Profil & Vertrauen' },
      { href: '/pro/plans', label: 'Partner-Tarife' },
      { href: '/pro/hilfe', label: 'Hilfe' },
    ],
  },
];

export const providerAccountItems: readonly NavChild[] = [
  { href: '/pro/profile', label: 'Profil & Vertrauen' },
  { href: '/pro/plans', label: 'Partner-Tarife' },
  { href: '/pro/hilfe', label: 'Hilfe & Kontakt' },
];

export type CrumbTrail = readonly { href?: string; label: string }[];

/**
 * One shape for every page below the first level: "Start › Bereich › Seite".
 * Pages pass only the area they belong to and their own name, so a trail can
 * never invent a hierarchy the navigation does not have.
 */
export function crumbs(areaHref: string | null, leaf: string): CrumbTrail {
  const trail: { href?: string; label: string }[] = [{ href: '/app', label: 'Start' }];
  const area = areaHref ? ownerAreas.find((candidate) => candidate.href === areaHref) : undefined;
  if (area && area.href !== '/app') trail.push({ href: area.href, label: area.label });
  trail.push({ label: leaf });
  return trail;
}

export function matchesArea(active: string, area: NavArea): boolean {
  if (active === area.href) return true;
  if (area.owns.includes(active)) return true;
  // /app and /pro are the prefix of every route in their portal, so they must
  // not match by prefix.
  if (area.href === '/app' || area.href === '/pro') return false;
  return active.startsWith(`${area.href}/`);
}

export function activeArea(active: string): NavArea | undefined {
  return ownerAreas.find((area) => matchesArea(active, area));
}

export function activeProviderArea(active: string): NavArea | undefined {
  return providerAreas.find((area) => matchesArea(active, area));
}

export type ContextTab = { href: string; label: string; active: boolean };

/**
 * Contextual navigation for one area: its pages, in the order the navigation
 * defines them. The shell renders them so every page of an area shows the same
 * tabs in the same place - previously each page linked to its siblings in its
 * own way, or not at all.
 *
 * Areas with a single page have nothing to switch between and get no tab bar.
 * Pages whose views live in the query string (/app/contracts) pass their own
 * tabs, because only the page knows which view is active.
 */
export function contextTabs(active: string, areas: readonly NavArea[], pick: (active: string) => NavArea | undefined): readonly ContextTab[] | undefined {
  const area = pick(active);
  if (!area || area.children.length < 2) return undefined;
  return area.children.map((child) => ({ href: child.href, label: child.label, active: child.href === active }));
}

export function ownerContextTabs(active: string): readonly ContextTab[] | undefined {
  return contextTabs(active, ownerAreas, activeArea);
}

export function providerContextTabs(active: string): readonly ContextTab[] | undefined {
  return contextTabs(active, providerAreas, activeProviderArea);
}
