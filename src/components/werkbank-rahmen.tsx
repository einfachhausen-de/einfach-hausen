import Link from 'next/link';
import type { ReactNode } from 'react';
import { Bell } from 'lucide-react';
import { EHScope, EHRouteTabs } from '@/design-system';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { matchesArea, ownerAreas, providerAreas, ownerAreaSubNav, providerAreaSubNav, type ContextTab } from './nav-config';
import { OwnerMobileMenu } from './owner-menu';
import { WerkbankSuche } from './werkbank-suche';
import { BottomNav } from './bottom-nav';
import s from './shell.module.css';

/**
 * WerkbankRahmen — Soll-Komposition aus vergleich.html, consumer-seitig gebaut.
 * Einreihige Topbar (Marke | Pillen-Navi | Werkzeuge), Seitenleiste mit den
 * Unterpunkten der aktuellen Seite, Mitte, rechte Kontextspalte. Haltepunkte
 * 1180/1120/980/760 stehen am Ende von shell.module.css. Keine versiegelte
 * Datei wird angefasst; alle Farben/Schriften/Radien kommen aus eh-Tokens.
 */
export async function WerkbankRahmen({ role, active, children, rail, tabs, brandSub, searchLabel }: {
  role: 'homeowner' | 'provider';
  active: string;
  children: ReactNode;
  rail?: ReactNode;
  tabs?: readonly ContextTab[];
  brandSub?: string;
  searchLabel?: string;
}) {
  const pro = role === 'provider';
  const user = await getCurrentUser();
  const unread = user && user.role === role
    ? (db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read_at IS NULL').get(user.id) as { c: number }).c
    : 0;
  const profileHref = pro ? '/pro/profile' : '/app/profile';
  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : 'EH';
  const business = pro && user
    ? (db.prepare('SELECT business_name FROM provider_profiles WHERE user_id=?').get(user.id) as { business_name?: string } | undefined)?.business_name
    : undefined;

  const areas = pro ? providerAreas : ownerAreas;
  const subNav = pro ? providerAreaSubNav(active) : ownerAreaSubNav(active);
  // Die erste Gruppe trägt den Namen des aktiven Hauptmenüpunkts — die
  // Seitenleiste zeigt immer den Inhalt des aktiven Bereichs, nicht starr
  // dieselbe Überschrift.
  const subGrouplabel = subNav.area?.label ?? 'Arbeitsbereich';
  const profileOn = active === '/app/profile';
  const settingsOn = active === '/app/settings';
  // Keine automatischen Kontext-Tabs: Die Seitenleiste zeigt dieselben
  // Unterpunkte bereits. Nur explizit übergebene `tabs` (Profil/Einstellungen,
  // die nicht in der Seitenleiste stehen) werden noch gerendert.

  return <EHScope app>
    <div className={s['wb']}>
      <div className={s['wb-top']}>
        <div className={s['wb-mobile']}>{pro ? null : <OwnerMobileMenu active={active} />}</div>
        <div className={s['wb-brand']}>
          <span className={s['wb-mark']} aria-hidden="true">eh</span>
          <span className={s['wb-name']}><b>{pro ? (business || 'Partnerbereich') : 'einfach hausen'}</b><small>{brandSub || (pro ? 'Geschäftsführung' : '')}</small></span>
          
        </div>
        <nav className={s['wb-nav']} aria-label="Hauptnavigation">
          {areas.map(area => {
            const on = matchesArea(active, area) || area.children.some(c => c.href === active);
            return <Link key={area.href} href={area.href} aria-current={on ? 'page' : undefined} className={on ? s['wb-on'] : undefined}>{area.shortLabel ?? area.label}</Link>;
          })}
        </nav>
        <div className={s['wb-tools']}>
          <WerkbankSuche pro={pro} label={searchLabel || 'Suchen'} />
          <Link href={pro ? '/pro/notifications' : '/notifications'} className={s.toolIcon} aria-label={unread ? `${unread} ungelesene Benachrichtigungen` : 'Benachrichtigungen'}><Bell size={22} />{unread > 0 && <span className={s.toolBadge}>{unread > 99 ? '99+' : unread}</span>}</Link>
          <Link href={profileHref} className={s.toolAvatar} aria-label="Profil" aria-current={active === profileHref ? 'page' : undefined}>{initials}</Link>
        </div>
      </div>
      <div className={rail ? s['wb-body'] : s['wb-body'] + ' ' + s['wb-norail']}>
        <aside className={s['wb-side']} aria-label="Unternavigation">
          {subNav.items.length > 0 && (<nav aria-label={subGrouplabel}>
            <p className={s['wb-grp']}>{subGrouplabel}</p>
            {subNav.items.map((item: { href: string; label: string; active: boolean }) => {
              const itemOn = item.active;
              return <Link key={item.href} href={item.href} aria-current={itemOn ? 'page' : undefined} className={itemOn ? s['wb-on'] : undefined}>{item.label}</Link>;
            })}
          </nav>)}
          {areas
            .filter(a => a.href !== subNav.area?.href)
            .filter(a => a.children.length > 0)
            .map(area => (
            <nav key={area.href} aria-label={area.label}>
              <p className={s['wb-grp']}>{area.label}</p>
              {area.children.map(c => <Link key={c.href} href={c.href}>{c.label}</Link>)}
            </nav>
          ))}
          {!pro && (
            <nav aria-label="Konto">
              <p className={s['wb-grp']}>Konto</p>
              <Link href="/app/profile" aria-current={profileOn ? 'page' : undefined} className={profileOn ? s['wb-on'] : undefined}>Profil</Link>
              <Link href="/app/settings" aria-current={settingsOn ? 'page' : undefined} className={settingsOn ? s['wb-on'] : undefined}>App-Einstellungen</Link>
            </nav>
          )}
          <div className={s['wb-me']}>
            <span className={s['wb-meav']} aria-hidden="true">{initials}</span>
            <span className={s['wb-mename']}><b>{user ? `${user.first_name} ${user.last_name}` : 'Profil'}</b><small>{pro ? 'Partnerkonto' : 'Eigenheim-Konto'}</small></span>
          </div>
        </aside>
        <main className={s['wb-main']}>
          {tabs && tabs.length > 0 && <EHRouteTabs label="Kontextnavigation" items={tabs} />}
          {children}
        </main>
        {rail && <aside className={s['wb-rail']} aria-label="Kontext dieser Seite">
          {rail}
        </aside>}
      </div>
      <div className={s['wb-bottom']}><BottomNav role={role} active={active} /></div>
    </div>
  </EHScope>;
}
