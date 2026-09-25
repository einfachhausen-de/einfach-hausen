import './werkbank-layout.css';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { EHScope, EHRouteTabs } from '@/design-system';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { statusLabel } from '@/lib/format';
import { getProviderContext } from '@/lib/provider';
import {
  activeArea,
  activeProviderArea,
  ownerAccountItems,
  ownerAccountTabs,
  providerAccountItems,
  type ContextTab,
} from './nav-config';
import { WerkbankShell } from './werkbank-shell';

/**
 * WerkbankRahmen - Server-Rahmen: Daten (Nutzer, ungelesene Anzahl, Breadcrumb
 * aus nav-config, Sidebar-Default aus Cookie) plus Client-Huelle mit
 * Sidebar-Navigation. Pillen-Navi und mobiles Drawer-Menue sind entfallen,
 * die Sidebar uebernimmt; BottomNav bleibt fuer Mobile.
 */
export async function WerkbankRahmen({
  role,
  active,
  children,
  rail,
  tabs,
  brandSub,
  searchLabel,
  pageLabel,
}: {
  role: 'homeowner' | 'provider';
  active: string;
  children: ReactNode;
  rail?: ReactNode;
  tabs?: readonly ContextTab[];
  brandSub?: string;
  searchLabel?: string;
  /** Eigener Seitenname im Pfad fuer Seiten ohne eigenen Navigationspunkt
   *  (z. B. Notfall unter Start), statt dort nur „Start“ zu zeigen. */
  pageLabel?: string;
}) {
  const pro = role === 'provider';
  const user = await getCurrentUser();
  const sameRole = user && user.role === role;
  const unread = sameRole
    ? (db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read_at IS NULL AND channel='in_app'").get(user.id) as { c: number }).c
    : 0;
  // Menueleisten-Zaehler: offene Aufträge. Dieselbe Definition wie die
  // Auftragsseite selbst (nicht abgeschlossen/storniert).
  const jobsHref = pro ? '/pro/orders' : '/app/jobs';
  const calHref = pro ? '/pro/calendar' : '/app/calendar';
  const jobsNewHref = pro ? null : '/app/hausmeister';
  let jobsCount = 0;
  let jobRows: { id: number; title: string; status: string }[] = [];
  const pctx = pro && user ? getProviderContext(user.id) : null;
  if (sameRole) {
    if (!pro) {
      jobsCount = (db.prepare("SELECT COUNT(*) c FROM jobs WHERE homeowner_id=? AND status NOT IN ('completed','cancelled')").get(user.id) as { c: number }).c;
      jobRows = db.prepare("SELECT id,title,status FROM jobs WHERE homeowner_id=? AND status NOT IN ('completed','cancelled') ORDER BY datetime(updated_at) DESC LIMIT 5").all(user.id) as { id: number; title: string; status: string }[];
    } else if (pctx) {
      const ownJobs = pctx.canManageJobs ? '' : 'AND a.contact_user_id=?';
      const ownArgs: number[] = pctx.canManageJobs ? [] : [user.id];
      jobsCount = (db.prepare(`SELECT COUNT(DISTINCT j.id) c FROM job_assignments a JOIN jobs j ON j.id=a.job_id WHERE a.provider_id=? ${ownJobs} AND j.status NOT IN ('completed','closed','cancelled')`).get(pctx.providerId, ...ownArgs) as { c: number }).c;
      jobRows = db.prepare(`SELECT j.id,j.title,j.status FROM job_assignments a JOIN jobs j ON j.id=a.job_id WHERE a.provider_id=? ${ownJobs} AND j.status NOT IN ('completed','closed','cancelled') ORDER BY datetime(j.updated_at) DESC LIMIT 5`).all(pctx.providerId, ...ownArgs) as { id: number; title: string; status: string }[];
    }
  }
  const jobsList = jobRows.map((row) => ({
    id: row.id,
    title: row.title,
    statusText: statusLabel(row.status),
    href: `${pro ? '/pro/jobs' : '/app/jobs'}/${row.id}`,
  }));
  const notices = sameRole
    ? (db.prepare("SELECT id,title,body,href,read_at,created_at FROM notifications WHERE user_id=? AND channel='in_app' ORDER BY read_at IS NULL DESC, created_at DESC, id DESC LIMIT 5").all(user.id) as { id: number; title: string; body: string; href: string; read_at: string | null; created_at: string }[]).map((notice) => ({
        id: notice.id,
        title: notice.title,
        body: notice.body || '',
        href: notice.href || '/notifications',
        unread: notice.read_at === null,
        when: new Date(`${notice.created_at}Z`).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }),
      }))
    : [];
  const profileHref = pro ? '/pro/profile' : '/app/profile';
  const hilfeHref = pro ? '/pro/hilfe' : '/app/hilfe';
  const homeHref = pro ? '/pro' : '/app';
  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : 'EH';
  const business =
    pro && user
      ? (db.prepare('SELECT business_name FROM provider_profiles WHERE user_id=?').get(user.id) as { business_name?: string } | undefined)?.business_name
      : undefined;
  const brandTitle = pro ? business || 'Partnerbereich' : 'einfach hausen';
  const userName = user ? `${user.first_name} ${user.last_name}` : 'Profil';
  const userSub = pro ? business || 'Partnerkonto' : 'Eigenheim-Konto';

  // Startvorschlaege des Kundenberaters: aus der aktuellen Seite und den
  // bereits geladenen Zahleri (keine extra Datenbankabfragen). Nur fuer
  // Eigentuer; andere Seiten zeigen keine Chips. Maximal drei, echte Themen.
  const kiVorschlaege: string[] = (() => {
    if (pro) return [];
    const p = active.split('?')[0];
    if (p === '/app') return jobsCount > 0
      ? ['Was läuft gerade bei meinen Aufträgen?', 'Was braucht meine Aufmerksamkeit?', 'Was fehlt in meiner Hausakte?']
      : ['Was braucht meine Aufmerksamkeit?', 'Was fehlt in meiner Hausakte?', 'Ich brauche einen Handwerker'];
    if (p === '/app/jobs') return jobsCount > 0
      ? ['Was läuft gerade?', 'Was braucht eine Entscheidung?', 'Neuen Auftrag anlegen']
      : ['Neuen Auftrag anlegen', 'Handwerker finden', 'Was fehlt in meiner Hausakte?'];
    if (p.startsWith('/app/jobs/')) return ['Status dieses Auftrags', 'Angebote vergleichen', 'Termin vorschlagen'];
    if (p === '/app/contracts') return ['Tarife sparen prüfen', 'Welche Kündigungsfristen laufen?', 'Verträge ansehen'];
    if (p === '/app/home') return ['Was fehlt in meiner Hausakte?', 'Dokumente suchen', 'Hauspass öffnen'];
    if (p === '/app/documents') return ['Rechnungen suchen', 'Verträge suchen', 'Dokument hochladen'];
    if (p === '/app/calendar') return ['Termine diese Woche', 'Nächste Wartung', 'Termin vorschlagen'];
    if (p === '/app/messages') return ['Was ist seit gestern neu?', 'Aufträge ansehen', 'Termine ansehen'];
    if (p === '/app/partners') return ['Wer ist mein Elektriker?', 'Meine Ansprechpartner', 'Neuen Auftrag anlegen'];
    return [];
  })();

  const jar = await cookies();
  const defaultOpen = jar.get('sidebar_state')?.value !== 'false';
  // Rechter Bereich: derselbe Griff zum Ein- und Ausklappen wie links an der
  // Seitenleiste; der Zustand liegt wie dort in einem Cookie.
  const defaultRailOpen = jar.get('rail_state')?.value !== 'false';

  const pathOnly = active.split('?')[0];
  const area = pro ? activeProviderArea(active) : activeArea(active);
  const accountPool = pro ? providerAccountItems : [...ownerAccountItems, ...ownerAccountTabs];
  const child = area?.children.find((c) => c.href === active) ?? area?.children.find((c) => c.href === pathOnly);
  let section: { href: string; label: string } | null = null;
  let page = 'Start';
  if (area && child && child.href !== area.href) {
    section = { href: area.href, label: area.label };
    page = child.label;
  } else if (area) {
    page = area.label;
  } else {
    const hit = accountPool.find((item) => item.href === active || item.href === pathOnly);
    if (hit) {
      section = { href: profileHref, label: 'Konto' };
      page = hit.label;
    } else if (pathOnly === '/notifications') {
      section = { href: profileHref, label: 'Konto' };
      page = 'Benachrichtigungen';
    }
  }
  if (pageLabel) {
    section = area ? { href: area.href, label: area.label } : { href: homeHref, label: 'Start' };
    page = pageLabel;
  }

  return (
    <EHScope app>
      <WerkbankShell
        role={role}
        kiVorschlaege={kiVorschlaege}
        active={active}
        defaultOpen={defaultOpen}
        defaultRailOpen={defaultRailOpen}
        pro={pro}
        brandTitle={brandTitle}
        brandSub={brandSub || (pro ? 'Geschäftsführung' : undefined)}
        homeHref={homeHref}
        userName={userName}
        userSub={userSub}
        userInitials={initials}
        unread={unread}
        notices={notices}
        jobsHref={jobsHref}
        jobsCount={jobsCount}
        jobsNewHref={jobsNewHref}
        jobsList={jobsList}
        calHref={calHref}
        profileHref={profileHref}
        hilfeHref={hilfeHref}
        searchLabel={searchLabel || 'Suchen'}
        breadcrumb={{ section, page }}
        main={
          <>
            {tabs && tabs.length > 0 && <EHRouteTabs label="Kontextnavigation" items={tabs} />}
            {children}
          </>
        }
        rail={rail}
      />
    </EHScope>
  );
}
