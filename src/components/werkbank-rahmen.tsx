import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { EHScope, EHRouteTabs } from '@/design-system';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
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
}: {
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
  const unread =
    user && user.role === role
      ? (db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read_at IS NULL').get(user.id) as { c: number }).c
      : 0;
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

  const jar = await cookies();
  const defaultOpen = jar.get('sidebar_state')?.value !== 'false';

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

  return (
    <EHScope app>
      <WerkbankShell
        role={role}
        active={active}
        defaultOpen={defaultOpen}
        pro={pro}
        brandTitle={brandTitle}
        brandSub={brandSub || (pro ? 'Geschäftsführung' : undefined)}
        homeHref={homeHref}
        userName={userName}
        userSub={userSub}
        userInitials={initials}
        unread={unread}
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
