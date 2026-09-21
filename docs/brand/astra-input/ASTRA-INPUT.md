# ASTRA-INPUT — Soll-Umbau Verträge / Termine / Profil (Einfach Hausen)

> **Veraltet ab 2026-09-21 — vor Weitergabe neu erheben.** Die hier eingebetteten
> „Ist“-Dateien (Datei D `/app/contracts`, Datei E `/app/profile`) entsprechen nicht
> mehr dem `main`-Stand:
> - `/app/contracts` hat seit der Affiliate-Welle (#127–#130, `45a6af3`) einen
>   zusätzlichen Bereich „Vergleichen & Wechseln“ (`?tab=vergleichen`) und eine
>   Ausleitungs-API `/api/affiliate/[category]`.
> - `/app/profile` und `/app/settings` wurden in `5289d1e` (Issue #132) auf das
>   kostenlose Eigentümer-Modell angepasst.
>
> Der Auftrag, die harten Regeln und das `#start`-Muster unten bleiben gültig; die
> eingebetteten Ist-Dateien müssen vor einem neuen Lauf gegen `main` neu gezogen
> werden. Verbindlich bleiben `DESIGN.md` und `docs/PRODUCT_VISION.md`.

Stand: 2026-09-18, `main`. Diese Datei ist die komplette Arbeitsgrundlage für einen
isolierten Agenten ohne Repo-Zugriff. Alles Nötige steht inline unten.

## 1. Auftrag

Baue 3 Seiten nach dem `#start`-Muster (Datei B unten) um:

- `src/app/app/contracts/page.tsx` (Route `/app/contracts`, Ist: Datei D)
- `src/app/app/calendar/page.tsx` (Route `/app/calendar`, Termine — read-only, keine Actions)
- `src/app/app/profile/page.tsx` (Route `/app/profile`, Ist: Datei E)

Liefere 3 **vollständige** Dateien, keine Snippets, keine Platzhalter, kein Lorem.
`calendar` bekommst du nicht als Ist — die Queries stehen im `#start`-Muster (Datei B:
`upcoming`, `appointments`, `next`).

## 2. Harte Regeln (Verstöße werden revertiert)

- Nur diese 3 Dateien anfassen. NIEMALS erfinden/ändern: `packages/eh-design/*`,
  `DESIGN.md`, `globals.css`, `design-system.css`, `scripts/*`, `src/components/auth-v2/`.
- Nur EH-Komponenten aus `@/design-system`, die in den Vorlagen unten schon importiert
  sind. Keine neuen Komponenten erfinden.
- Nur `var(--eh-*)`-Tokens, keine Hex-Farben, keine neuen Breakpoints (1120/760 gelten),
  kein `style={{}}` für Layout (ein `<style>`-Block mit `eh-`-Klassen wie in Datei B ist ok).
- Texte, Routen, Server-Actions, Auth (`requireUser`), Feldnamen, Datenlogik unverändert —
  nur Komposition.
- Keine Mockdaten: jede Zahl aus echten Loadern (`house_contracts`, `appointments`,
  `jobs`, `quotes`, `documents`, `homeowner_profiles`). Erfundene %-Werte verboten.
- Geld nur `euroExact`, Daten nur `dateLabel`/`ownerDate`/`ownerInstant`.
- Komposition pro Seite: `WerkbankRahmen` (`role="homeowner"`, `active`=eigene Route,
  `rail`=Kontextspalte) + Kopf + `EHMetricsBar` (4 Kennzahlen) + Hauptspalte
  (`EHOwnerSection`/`EHRecordList` bzw. `EHWorkspaceGrid` mit `main`/`aside` wie Datei D).
- Am Ende pro Datei selbst prüfen: Import-Check (alle EH-Namen aus Vorlage?),
  Feldnamen-Check gegen Ist, Mock-Check (jede Zahl aus Loader?).

## 3. Soll-Muster `#start` (Kurzfassung von Datei B)

Kopf: Adresse als H1 + Name, rechts CTA `+ Anliegen` nach `/app/hausmeister`.
Fokus-Karte: Zahl + „Warten auf dich" nach `/app/jobs`. Kennzahlen: Termine,
Dokumente, Aufträge, Ungelesen. Sektionen: „Wartet auf dich" / „Hausakte" /
„Nächste Termine". Rail rechts: „Kontext dieser Seite" (Warten-Karte + Profil-Karte
mit echter Vollständigkeit x-von-4, offene Vorgänge, Dokumente).

## 4. Bilder

- Soll-Referenz: [referenz.png](../app-ux-vorschlaege/referenz.png)
  (raw: <https://raw.githubusercontent.com/einfachhausen-de/einfach-hausen/main/docs/brand/app-ux-vorschlaege/referenz.png>)
- Ist-Start: [owner_app__desktop.png](../app-ux-vorschlaege/ist/app/owner_app__desktop.png)
- Ist-Verträge: [owner_app_contracts__desktop.png](../app-ux-vorschlaege/ist/app/owner_app_contracts__desktop.png)
- Ist-Dokumente: [owner_app_documents__desktop.png](../app-ux-vorschlaege/ist/app/owner_app_documents__desktop.png)

## 5. Datei A — Soll-Vorgabe (Auszug Struktur, voll: `docs/brand/app-ux-vorschlaege/index.html`)

Enthält die Soll-Sektionen „Start — der Überblick", „Aufträge — die Werkbank",
„Dokumente — die Ablage", „Kontakte — die Menschen" (je Desktop). Für Verträge,
Termine, Profil gibt es dort KEIN Soll — dafür gilt das `#start`-Muster (Kap. 3).

## 6. Datei B — `src/app/app/page.tsx` (Muster, vollständig)

```tsx
import fs from 'node:fs';
import Link from 'next/link';
import { CalendarClock, ChevronRight, FileText } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { EHButton, EHCallout, EHMetricsBar, EHOwnerSection, EHRecordList, EHStatus, type EHRecordEntry } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateLabel, euro } from '@/lib/format';
import { ownerInstant } from '@/lib/owner-format';
import { primaryProperty } from '@/lib/properties';
import { resolvePrivatePath } from '@/lib/security/private-files';

/**
 * Werkbank-Kopf und Kennzahlenzeile dieser Seite. Ausschliesslich Design-Tokens,
 * keine Rohwerte: die Vorlage setzt Adresse und Name in Zeilengroesse statt in
 * einen Werbekopf, und die drei Kennzahlen bleiben auf dem Telefon eine Reihe.
 * Die Kennzahlenleiste der Bibliothek kippt unter 760px auf zwei Spalten; hier
 * wird nur diese eine Rasterzeile der Seite zurueckgeholt. Der Selektor traegt
 * :nth-child(n), damit er die Bibliotheksregel `.metricsBar > div:nth-child(n+3)`
 * eindeutig schlaegt.
 */
const werkbankLayout = `
.eh-werkbank-rail-h { font-size:10.5px; letter-spacing:.09em; text-transform:uppercase; color:var(--eh-muted); font-weight:700; margin:0 0 10px; }
.eh-werkbank-karte { background:var(--eh-color-white); border:1px solid var(--eh-color-line); border-radius:var(--eh-radius-control); padding:13px 14px; margin-bottom:12px; }
.eh-werkbank-karte h4 { margin:0 0 9px; font-size:13.5px; display:flex; align-items:center; gap:8px; }
.eh-werkbank-badge { background:var(--eh-color-terra); color:var(--eh-color-white); border-radius:var(--eh-radius-pill); font-size:10px; font-weight:700; padding:1px 7px; }
.eh-werkbank-item { display:flex; gap:9px; padding:7px 0; border-top:1px solid var(--eh-color-line); font-size:12.5px; align-items:center; }
.eh-werkbank-item:first-of-type { border-top:0; }
.eh-werkbank-item b { display:block; font-weight:600; }
.eh-werkbank-item small { color:var(--eh-muted); font-size:11.5px; }
.eh-werkbank-ic { width:24px; height:24px; display:grid; place-items:center; color:var(--eh-muted); flex:0 0 auto; font-size:12px; }
.eh-werkbank-go { display:block; text-align:center; background:var(--eh-color-petrol); color:var(--eh-color-white); border-radius:var(--eh-radius-control); padding:8px; font-weight:600; margin-top:10px; text-decoration:none; font-size:13px; }
.eh-werkbank-bar { height:7px; border-radius:var(--eh-radius-pill); background:var(--eh-color-paper); overflow:hidden; margin:8px 0 6px; }
.eh-werkbank-bar i { display:block; height:100%; background:var(--eh-color-petrol); }
.eh-werkbank-row { display:flex; padding:4px 0; font-size:12.5px; }
.eh-werkbank-row > :last-child { margin-left:auto; color:var(--eh-muted); }
.eh-werkbank-kopf { display:flex; align-items:center; gap:12px; padding-bottom:16px; border-bottom:1px solid var(--eh-rule); }
.eh-werkbank-kopf-copy { flex:1; min-width:0; display:grid; gap:2px; }
.eh-werkbank-kopf-cta { flex:none; display:inline-flex; align-items:center; gap:8px; background:var(--eh-color-petrol); color:var(--eh-color-white); border-radius:var(--eh-radius-control); padding:10px 18px; font-weight:600; text-decoration:none; font-size:13.5px; }
.eh-werkbank-kopf-copy h1 { font-size:var(--eh-font-body); font-weight:var(--eh-weight-semibold); line-height:var(--eh-leading-tight); }
.eh-werkbank-kopf-copy span { font-size:var(--eh-font-label); line-height:var(--eh-leading-normal); color:var(--eh-muted); }
.eh-werkbank-fokus { display:flex; align-items:center; gap:14px; min-height:80px; padding:14px 16px; border:1px solid var(--eh-rule); border-radius:var(--eh-radius-panel); background:var(--eh-color-white); text-decoration:none; }
.eh-werkbank-fokus-zahl { flex:none; font-size:var(--eh-font-section); font-weight:var(--eh-weight-semibold); line-height:var(--eh-leading-tight); color:var(--eh-color-terra); font-variant-numeric:tabular-nums; }
.eh-werkbank-fokus-text { flex:1; min-width:0; display:grid; gap:2px; }
.eh-werkbank-fokus-text strong { font-size:var(--eh-font-body); font-weight:var(--eh-weight-semibold); line-height:var(--eh-leading-tight); }
.eh-werkbank-fokus-text span { font-size:var(--eh-font-label); line-height:var(--eh-leading-normal); color:var(--eh-color-secondary); }
.eh-werkbank-fokus-pfeil { flex:none; width:44px; height:44px; display:grid; place-items:center; border-radius:var(--eh-radius-pill); background:var(--eh-color-petrol); color:var(--eh-color-white); }
.eh-werkbank-kennzahlen > dl { grid-auto-flow:column; grid-template-columns:repeat(3,minmax(0,1fr)); }
.eh-werkbank-kennzahlen > dl > div:nth-child(n) { min-height:76px; padding:12px 14px; border-top:0; }
.eh-werkbank-kennzahlen > dl > div:nth-child(n) + div { border-left:1px solid var(--eh-rule); }
`;

/** Kurzes Tagesdatum der Hausakte: "14.09.". Die Chronik sortiert am ISO-Wert. */
function shortDay(value: string): string {
  const raw = String(value);
  const isDay = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const instant = isDay ? new Date(`${raw}T12:00:00Z`) : ownerInstant(raw);
  if (!instant) return raw.slice(0, 10);
  return new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit' }).format(instant);
}

/** Dateityp aus der Endung, Größe aus der privaten Ablage. Fehlt die Datei, bleibt der Typ. */
function documentFacts(relativePath: string): string {
  const extension = /\.([a-z0-9]+)$/i.exec(relativePath);
  const type = extension ? extension[1].toUpperCase() : '';
  try {
    // Ueber resolvePrivatePath statt eines eigenen path.join: die Funktion ist
    // die gepruefte, traversal-sichere Abkuerzung auf die private Ablage. Ein
    // literales path.join(process.cwd(),'data','private',...) wird von Turbopack
    // als Verzeichnis-Asset aufgeloest und laesst den Build scheitern, sobald
    // dort echte Dateien liegen ("Symlink ... points out of the filesystem root").
    const absolute = resolvePrivatePath(relativePath);
    if (!absolute) return type;
    const bytes = fs.statSync(absolute).size;
    const size = bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return [type, size].filter(Boolean).join(', ');
  } catch {
    return type;
  }
}

export default async function Dashboard() {
  const user = await requireUser('homeowner');
  const profile = db.prepare('SELECT address,postcode,onboarding_step FROM homeowner_profiles WHERE user_id=?').get(user.id) as { address?: string; postcode?: string; onboarding_step?: string } | undefined;
  const property = primaryProperty(user.id);
  const address = property?.address || profile?.address || '';
  const name = `${user.first_name} ${user.last_name}`.trim();
  const unread = (db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read_at IS NULL').get(user.id) as { c: number }).c;
  const offers = db.prepare(`SELECT j.id,j.title,COUNT(q.id) quote_count,MIN(q.amount) amount,(SELECT p.business_name FROM quotes q2 LEFT JOIN provider_profiles p ON p.user_id=q2.provider_id WHERE q2.job_id=j.id AND q2.status='pending' ORDER BY q2.amount,q2.id LIMIT 1) business_name FROM jobs j JOIN quotes q ON q.job_id=j.id AND q.status='pending' WHERE j.homeowner_id=? AND j.status='quoted' AND j.request_kind='service' GROUP BY j.id ORDER BY datetime(j.updated_at) DESC`).all(user.id) as { id: number; title: string; quote_count: number; amount: number; business_name: string | null }[];
  const next = db.prepare(`SELECT a.job_id,a.start_at,j.title,p.business_name FROM appointments a JOIN jobs j ON j.id=a.job_id LEFT JOIN provider_profiles p ON p.user_id=a.provider_id WHERE a.homeowner_id=? AND a.status='confirmed' AND datetime(a.start_at)>=datetime('now') ORDER BY datetime(a.start_at) LIMIT 1`).get(user.id) as { job_id: number; start_at: string; title: string; business_name: string | null } | undefined;
  const appointments = (db.prepare(`SELECT COUNT(*) c FROM appointments WHERE homeowner_id=? AND status='confirmed' AND datetime(start_at)>=datetime('now')`).get(user.id) as { c: number }).c;
  const jobs = (db.prepare(`SELECT COUNT(*) c FROM jobs WHERE homeowner_id=? AND request_kind='service' AND status IN ('open','quoted','accepted','in_progress')`).get(user.id) as { c: number }).c;
  const documents = db.prepare(`SELECT d.id,d.title,d.path,d.created_at FROM documents d JOIN jobs j ON j.id=d.job_id WHERE j.homeowner_id=? ORDER BY datetime(d.created_at) DESC LIMIT 3`).all(user.id) as { id: number; title: string; path: string; created_at: string }[];
  const documentCount = (db.prepare(`SELECT COUNT(*) c FROM documents d JOIN jobs j ON j.id=d.job_id WHERE j.homeowner_id=?`).get(user.id) as { c: number }).c;
  const upcoming = db.prepare(`SELECT a.job_id,a.start_at,j.title,p.business_name FROM appointments a JOIN jobs j ON j.id=a.job_id LEFT JOIN provider_profiles p ON p.user_id=a.provider_id WHERE a.homeowner_id=? AND a.status='confirmed' AND datetime(a.start_at)>=datetime('now') ORDER BY datetime(a.start_at) LIMIT 5`).all(user.id) as { job_id: number; start_at: string; title: string; business_name: string | null }[];
  // Echte Profilvollstaendigkeit statt erfundener Balkenwerte: dieselben vier
  // Angaben wie auf /app/profile, damit beide Seiten nicht auseinanderlaufen.
  const profileFields = [
    !!(user.first_name && user.last_name),
    !!(user as { phone?: string }).phone,
    !!profile?.address,
    !!profile?.postcode,
  ];
  const profileFilled = profileFields.filter(Boolean).length;
  const profilePct = Math.round(profileFilled / profileFields.length * 100);

  const waiting: EHRecordEntry[] = [
    ...offers.map(offer => ({
      id: `offer-${offer.id}`,
      title: offer.title,
      detail: [offer.business_name, euro(offer.amount)].filter(Boolean).join(' · '),
      status: <EHStatus tone="warning">{offer.quote_count === 1 ? '1 Angebot' : `${offer.quote_count} Angebote`}</EHStatus>,
      icon: <FileText size={20} />,
      href: `/app/jobs/${offer.id}`,
    })),
    ...(next ? [{
      id: `appointment-${next.job_id}`,
      title: 'Termin bestätigen',
      detail: [next.business_name || next.title, dateLabel(next.start_at)].filter(Boolean).join(' · '),
      status: <EHStatus tone="info">Bestätigen</EHStatus>,
      icon: <CalendarClock size={20} />,
      href: `/app/jobs/${next.job_id}`,
    }] : []),
  ];

  const hausakte: EHRecordEntry[] = documents.map(document => ({
    id: `document-${document.id}`,
    title: document.title,
    detail: [shortDay(document.created_at), documentFacts(document.path)].filter(Boolean).join(' · '),
    date: String(document.created_at).slice(0, 10),
    icon: <FileText size={20} />,
    href: `/api/documents/${document.id}`,
  }));

  const termine: EHRecordEntry[] = upcoming.map(appt => ({
    id: `upcoming-${appt.job_id}-${appt.start_at}`,
    title: appt.title,
    detail: [appt.business_name, dateLabel(appt.start_at)].filter(Boolean).join(' · '),
    date: String(appt.start_at).slice(0, 10),
    status: <EHStatus tone="info">Bestätigt</EHStatus>,
    icon: <CalendarClock size={20} />,
    href: `/app/jobs/${appt.job_id}`,
  }));

  return <WerkbankRahmen role="homeowner" active="/app" brandSub={address} rail={<>
      <p className="eh-werkbank-rail-h">Kontext dieser Seite</p>
      <div className="eh-werkbank-karte">
        <h4>Warten auf dich{waiting.length > 0 && <span className="eh-werkbank-badge">{waiting.length}</span>}</h4>
        {waiting.slice(0, 2).map(w => <div key={w.id} className="eh-werkbank-item"><span className="eh-werkbank-ic">▤</span><span><b>{w.title}</b><small>{w.detail}</small></span></div>)}
        <Link href="/app/jobs" className="eh-werkbank-go">Alle ansehen →</Link>
      </div>
      <div className="eh-werkbank-karte">
        <h4>Profil</h4>
        <div className="eh-werkbank-bar"><i style={{ width: `${profilePct}%` }} /></div>
        <div className="eh-werkbank-row"><span>Angaben</span><span>{profileFilled} von {profileFields.length}</span></div>
        <div className="eh-werkbank-row"><span>Offene Vorgänge</span><span>{jobs}</span></div>
        <div className="eh-werkbank-row"><span>Dokumente</span><span>{documentCount}</span></div>
      </div>
    </>}>
    <style>{werkbankLayout}</style>
    <header className="eh-werkbank-kopf">
      <div className="eh-werkbank-kopf-copy">
        <h1>{address || 'Adresse ergänzen'}</h1>
        {name && <span>{name}</span>}
      </div>
      <Link className="eh-werkbank-kopf-cta" href="/app/hausmeister">+ Anliegen</Link>
    </header>
    <Link className="eh-werkbank-fokus" href="/app/jobs">
      <strong className="eh-werkbank-fokus-zahl">{waiting.length}</strong>
      <span className="eh-werkbank-fokus-text">
        <strong>Warten auf dich</strong>
        <span>Entscheidungen offen</span>
      </span>
      <span className="eh-werkbank-fokus-pfeil" aria-hidden="true"><ChevronRight size={18} /></span>
    </Link>
    {profile?.onboarding_step && profile.onboarding_step !== 'done' && <EHCallout title="Einrichtung unvollständig"><p>Ergänze die Angaben zu deinem Zuhause.</p><EHButton href="/app/onboarding" variant="secondary">Einrichtung fortsetzen</EHButton></EHCallout>}
    <div className="eh-werkbank-kennzahlen">
      <EHMetricsBar label="Überblick" items={[
        { id: 'termine', label: 'Termine', value: appointments },
        { id: 'dokumente', label: 'Dokumente', value: documentCount },
        { id: 'auftraege', label: 'Aufträge', value: jobs },
        { id: 'ungelesen', label: 'Ungelesen', value: unread },
      ]} />
    </div>
    <EHOwnerSection title={`Wartet auf dich (${waiting.length})`}>
      <EHRecordList label="Wartet auf dich" items={waiting} empty="Nichts offen." />
    </EHOwnerSection>
    <EHOwnerSection title="Hausakte" action={{ href: '/app/documents', label: `Alle ${documentCount}` }}>
      <EHRecordList label="Hausakte" items={hausakte} empty="Keine Dokumente." />
    </EHOwnerSection>
    <EHOwnerSection title="Nächste Termine" action={{ href: '/app/calendar', label: 'Kalender' }}>
      <EHRecordList label="Nächste Termine" items={termine} empty="Keine anstehenden Termine." />
    </EHOwnerSection>
  </WerkbankRahmen>;
}
```

## 7. Datei C — `src/components/werkbank-rahmen.tsx` (Rahmen, nur lesen)

```tsx
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Bell, Search } from 'lucide-react';
import { EHScope, EHRouteTabs } from '@/design-system';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { matchesArea, ownerAreas, providerAreas, ownerAreaSubNav, providerAreaSubNav, type ContextTab } from './nav-config';
import { OwnerMobileMenu } from './owner-menu';
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
          <span className={s['wb-chev']} aria-hidden="true">▾</span>
        </div>
        <nav className={s['wb-nav']} aria-label="Hauptnavigation">
          {areas.map(area => {
            const on = matchesArea(active, area) || area.children.some(c => c.href === active);
            return <Link key={area.href} href={area.href} aria-current={on ? 'page' : undefined} className={on ? s['wb-on'] : undefined}>{area.shortLabel ?? area.label}</Link>;
          })}
        </nav>
        <div className={s['wb-tools']}>
          <Link href={pro ? '/pro/notifications' : '/notifications'} className={s.search}><Search size={16} /><span>{searchLabel || 'Suchen'}</span></Link>
          <Link href={pro ? '/pro/notifications' : '/notifications'} className={s.toolIcon} aria-label={unread ? `${unread} ungelesene Benachrichtigungen` : 'Benachrichtigungen'}><Bell size={22} />{unread > 0 && <span className={s.toolBadge}>{unread > 99 ? '99+' : unread}</span>}</Link>
          <Link href={profileHref} className={s.toolAvatar} aria-label="Profil">{initials}</Link>
        </div>
      </div>
      <div className={s['wb-body']}>
        <aside className={s['wb-side']} aria-label="Unternavigation">
          {subNav.items.length > 0 && (<nav aria-label={subGrouplabel}>
            <p className={s['wb-grp']}>{subGrouplabel}</p>
            {subNav.items.map((item: { href: string; label: string; active: boolean }) => {
              const itemOn = item.active;
              return <Link key={item.href} href={item.href} aria-current={itemOn ? 'page' : undefined} className={itemOn ? s['wb-on'] : undefined}>{item.label}</Link>;
            })}
          </nav>)}
          {areas.filter(a => a.href !== subNav.area?.href).map(area => (
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
```

## 8. Datei D — `src/app/app/contracts/page.tsx` (Ist, Datenlogik übernehmen)

Hinweis: Der `tab`-Umschalter (`vertraege`/`sparcheck` per `searchParams`) und beide
Ansichten bleiben erhalten — nur die Komposition wandert ins `#start`-Muster
(Kopf + Kennzahlen + Mitte + Rail). Alle Actions und `lib/contracts`-Helfer bleiben.

```tsx
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import {
  EHButton, EHCallout, EHEmptyState, EHField, EHFieldGrid, EHFormFeedback,
  EHFormSection, EHInput, EHList, EHMetricsBar, EHPageHeader, EHRecordList, EHRecordViews,
  EHSelect, EHStatus, EHSubmitButton, EHText,
  EHTextarea, EHWorkSection, EHWorkflowForm, EHWorkflowStack, EHWorkspaceGrid, EHDetailDisclosure,
} from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { euroExact } from '@/lib/format';
import {
  CONTRACT_KIND_KEYS, CONTRACT_KINDS, COST_INTERVAL_KEYS, COST_INTERVALS, SAVINGS_KINDS, type ContractKind,
  affiliateLink, cancellationDeadline, contractKindLabel, costIntervalLabel, currentTermEnd,
  deadlineDays, deadlineState, estimateSavings, formatDate, monthlyCents, yearlyCents,
} from '@/lib/contracts';
import { addHouseContractAction, setHouseContractStatusAction, updateHouseContractAction } from '@/app/actions';

type ContractRow = {
  id: number; kind: string; provider: string; tariff: string; contract_number: string;
  cost_amount: number | null; cost_interval: string; started_at: string | null;
  term_months: number | null; renewal_months: number | null; cancellation_days: number | null;
  cancellation_deadline: string | null; notice: string; document_title: string;
  document_path: string | null; status: string;
};

const DEADLINE_TONE = { overdue: 'error', soon: 'warning', planned: 'info', unknown: 'neutral' } as const;

function deadlineLabel(row: ContractRow): string {
  const deadline = cancellationDeadline(row);
  if (!deadline) return 'Keine Frist erfasst';
  const days = deadlineDays(deadline) ?? 0;
  if (days < 0) return `Frist verpasst · ${formatDate(deadline)}`;
  if (days === 0) return 'Heute letzter Tag';
  return `Noch ${days} Tage · ${formatDate(deadline)}`;
}

export default async function Contracts({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser('homeowner');
  const sp = await searchParams;
  const tab = sp.tab === 'sparcheck' ? 'sparcheck' : 'vertraege';
  const saved = sp.saved === '1';
  const profile = db.prepare('SELECT postcode FROM homeowner_profiles WHERE user_id=?').get(user.id) as { postcode?: string } | undefined;

  const contracts = db.prepare(`SELECT * FROM house_contracts WHERE homeowner_id=? ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'cancelled' THEN 1 ELSE 2 END, provider COLLATE NOCASE`).all(user.id) as ContractRow[];
  const active = contracts.filter((c) => c.status === 'active');
  const monthlyTotal = active.reduce((sum, c) => sum + (monthlyCents(c.cost_amount, c.cost_interval) ?? 0), 0);
  const yearlyTotal = active.reduce((sum, c) => sum + (yearlyCents(c.cost_amount, c.cost_interval) ?? 0), 0);
  const monthlyByKind = new Map<string, { count: number; cents: number }>();
  for (const row of active) {
    const label = contractKindLabel(row.kind);
    const group = monthlyByKind.get(label) ?? { count: 0, cents: 0 };
    group.count += 1;
    group.cents += monthlyCents(row.cost_amount, row.cost_interval) ?? 0;
    monthlyByKind.set(label, group);
  }

  const withDeadline = active
    .map((row) => ({ row, deadline: cancellationDeadline(row), state: deadlineState(cancellationDeadline(row)) }))
    .filter((entry) => entry.state === 'overdue' || entry.state === 'soon')
    .sort((a, b) => (a.deadline?.getTime() ?? 0) - (b.deadline?.getTime() ?? 0));

  const selectedId = Number(sp.contract);
  const selected = contracts.find((c) => c.id === selectedId) ?? null;
  const estimate = selected
    ? estimateSavings({
        kind: selected.kind,
        yearlyCents: yearlyCents(selected.cost_amount, selected.cost_interval),
        postcode: profile?.postcode || '',
        householdSize: null,
        hasLoyaltyBonus: false,
        switchWilling: true,
      })
    : null;
  const outbound = selected ? affiliateLink(selected.kind) : undefined;

  return <WerkbankRahmen role="homeowner" active="/app/contracts">
    <EHWorkflowStack>
      <EHPageHeader
        title="Verträge & Tarife"
        context={`${active.length} aktiv · ${euroExact(monthlyTotal)} pro Monat`}
        actions={<EHButton href="/app/documents" variant="secondary">Alle Dokumente</EHButton>}
      />
      {saved && <EHFormFeedback kind="success">Gespeichert. Deine Hausakte ist aktuell.</EHFormFeedback>}

      {tab === 'vertraege' ? (
        <>
          <EHMetricsBar label="Verträge" items={[
            { id: 'aktiv', label: 'Aktive Verträge', value: String(active.length), hint: `${contracts.length} erfasst` },
            { id: 'kosten', label: 'Kosten pro Monat', value: euroExact(monthlyTotal), hint: 'nur aktive Verträge' },
            { id: 'jahr', label: 'Kosten pro Jahr', value: euroExact(yearlyTotal), hint: 'aus den erfassten Intervallen' },
            { id: 'fristen', label: 'Fristen · 90 Tage', value: String(withDeadline.length), hint: withDeadline.length > 0 ? 'jetzt handeln' : 'nichts offen' },
          ]} />

          <EHWorkspaceGrid main={<>
          {withDeadline.length > 0 && <EHWorkSection title="Jetzt handeln">
            <EHRecordList label="Fristen in den nächsten 90 Tagen" items={withDeadline.map(({ row, state }) => ({
              id: `frist-${row.id}`,
              title: `${contractKindLabel(row.kind)} · ${row.provider}`,
              detail: deadlineLabel(row),
              status: <EHStatus tone={DEADLINE_TONE[state]}>{state === 'overdue' ? 'Verpasst' : 'Bald'}</EHStatus>,
              href: `/app/contracts?tab=sparcheck&contract=${row.id}`,
            }))} />
          </EHWorkSection>}

          <EHWorkSection title={`Alle Verträge · ${contracts.length}`}>
            {contracts.length === 0
              ? <EHEmptyState title="Noch kein Vertrag erfasst" text="Trag deinen Strom-, DSL- oder Versicherungsvertrag ein. Danach siehst du hier Kosten, Laufzeit und Kündigungsfrist – und im Spar-Check, ob sich ein Wechsel lohnt." />
              : <EHRecordViews label="Erfasste Verträge" storageKey="vertraege" defaultView="liste" switcherLabel="Verträge: Ansicht wechseln" items={contracts.map((row) => {
                  const end = currentTermEnd(row);
                  const started = row.started_at ? formatDate(new Date(`${row.started_at.slice(0, 10)}T12:00:00`)) : '';
                  return {
                    id: String(row.id),
                    title: `${contractKindLabel(row.kind)} · ${row.provider}`,
                    detail: [
                      row.tariff,
                      end ? `Laufzeit bis ${formatDate(end)}` : started ? `Seit ${started}` : null,
                      row.notice,
                    ].filter(Boolean).join(' · '),
                    value: row.cost_amount != null ? `${euroExact(row.cost_amount)} ${costIntervalLabel(row.cost_interval)}` : undefined,
                    date: row.started_at?.slice(0, 10),
                    dateLabel: started,
                    status: row.status === 'active'
                      ? <EHStatus tone={DEADLINE_TONE[deadlineState(cancellationDeadline(row))]}>{deadlineLabel(row)}</EHStatus>
                      : <EHStatus tone="neutral">{row.status === 'cancelled' ? 'Gekündigt' : 'Ausgelaufen'}</EHStatus>,
                    action: row.document_path ? <a href={`/api/house-contracts/${row.id}/document`} target="_blank" rel="noreferrer">{row.document_title || 'Vertragsdokument'}</a> : undefined,
                  };
                })} />}
          </EHWorkSection>
          </>} aside={<>
            <EHWorkSection title="Nächste Kündigungsfrist">
              {withDeadline[0] ? <>
                <EHText>{`${contractKindLabel(withDeadline[0].row.kind)} · ${withDeadline[0].row.provider}`}</EHText>
                <EHStatus tone={DEADLINE_TONE[withDeadline[0].state]}>{deadlineLabel(withDeadline[0].row)}</EHStatus>
                <EHButton href={`/app/contracts?tab=sparcheck&contract=${withDeadline[0].row.id}`} variant="secondary" arrow>Spar-Check öffnen</EHButton>
              </> : <EHText muted>Keine Frist in den nächsten 90 Tagen. Sobald eine Kündigungsfrist näher rückt, steht sie hier.</EHText>}
            </EHWorkSection>
            <EHWorkSection title="Kosten nach Sparte">
              <EHRecordList label="Monatskosten nach Sparte" empty="Noch kein aktiver Vertrag mit Kosten erfasst." items={Array.from(monthlyByKind.entries()).sort((a, b) => b[1].cents - a[1].cents).map(([kind, group]) => ({
                id: `sparte-${kind}`,
                title: kind,
                detail: `${group.count} ${group.count === 1 ? 'Vertrag' : 'Verträge'}`,
                value: euroExact(group.cents),
              }))} />
            </EHWorkSection>
            <EHWorkSection title="Spar-Check">
              <EHText muted>Der Spar-Check schätzt aus deinen hinterlegten Kosten eine Ersparnis-Spanne. Möglich ist das für Strom, Gas, DSL und Versicherungen.</EHText>
              <EHButton href="/app/contracts?tab=sparcheck" variant="secondary" arrow>Spar-Check öffnen</EHButton>
            </EHWorkSection>
          </>} />
        </>
      ) : (
        <>
          <EHPageHeader title="Lohnt sich ein Wechsel?" context={selected ? `${contractKindLabel(selected.kind)} · ${selected.provider}` : `${contracts.length} Verträge zur Auswahl`} />
          {contracts.length === 0
            ? <EHEmptyState title="Erst einen Vertrag erfassen" text="Der Spar-Check rechnet mit deinen echten Kosten. Trag dafür im Tab „Laufende Verträge“ den Vertrag ein, den du prüfen willst." action={<EHButton href="/app/contracts?tab=vertraege">Vertrag erfassen</EHButton>} />
            : <>
                <EHWorkSection title="Vertrag auswählen">
                  <EHRecordList label="Verträge für den Spar-Check" items={contracts.map((row) => ({
                    id: `check-${row.id}`,
                    title: `${contractKindLabel(row.kind)} · ${row.provider}`,
                    detail: row.cost_amount != null ? `${euroExact(row.cost_amount)} ${costIntervalLabel(row.cost_interval)}` : 'Keine Kosten hinterlegt',
                    status: SAVINGS_KINDS.includes(row.kind as ContractKind) ? <EHStatus tone="info">Spar-Check möglich</EHStatus> : <EHStatus>Kein Vergleich</EHStatus>,
                    href: `/app/contracts?tab=sparcheck&contract=${row.id}`,
                  }))} />
                </EHWorkSection>

                {selected && <>
                  <EHWorkSection title={`Spar-Check · ${contractKindLabel(selected.kind)} · ${selected.provider}`}>
                    {!estimate && <EHFormFeedback kind="info">Für diese Sparte gibt es noch keine Vergleichsstrecke. Ein Spar-Check ist für Strom, Gas, DSL und Versicherungen möglich.</EHFormFeedback>}
                    {estimate && <>
                      <EHMetricsBar label="Spar-Check" items={[
                        { id: 'ersparnis', label: 'Ersparnis pro Jahr', value: `${euroExact(estimate.lowCents)} – ${euroExact(estimate.highCents)}` },
                        { id: 'ansatz', label: 'Ansatz Jahreskosten', value: `${Math.round(estimate.rateBps / 100)} %` },
                        { id: 'belastbarkeit', label: 'Belastbarkeit', value: estimate.confidence },
                      ]} />
                      <EHText>Diese Spanne beruht auf folgenden Annahmen:</EHText>
                      <EHList label="Annahmen der Einschätzung" items={estimate.reasons.map((reason, index) => ({ id: `grund-${index}`, title: reason }))} />
                    </>}
                  </EHWorkSection>

                  <EHWorkSection title="Nächste Schritte">
                    <EHList label="Nächste Schritte" items={[
                      { id: 'step-1', title: 'Kündigungsfrist prüfen', text: deadlineLabel(selected) },
                      { id: 'step-2', title: 'Angebote einholen', text: outbound ? 'Über unseren Partnerlink – siehe unten.' : 'Aktuell direkt beim Anbieter oder einem Vergleichsportal deiner Wahl.' },
                      { id: 'step-3', title: 'Nach dem Wechsel Vertrag hier aktualisieren', text: 'Neuer Anbieter, neuer Preis, neue Laufzeit – dann stimmt die nächste Frist wieder.' },
                    ]} />
                    {outbound
                      ? <EHButton href={outbound} arrow>Zum Tarifrechner des Partners</EHButton>
                      : <EHCallout title="Noch keine Partnervermittlung"><p>Sobald Affiliate-Partner für {contractKindLabel(selected.kind).toLowerCase()} vertraglich feststehen, führt dieser Weg direkt zum Tarifrechner. Bis dahin bleibt der Spar-Check bewusst eine Einschätzung ohne Ausleitung.</p></EHCallout>}
                  </EHWorkSection>
                </>}
              </>}
        </>
      )}
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
```

(Formulare `updateHouseContractAction` / `addHouseContractAction` /
`setHouseContractStatusAction` mit denselben Feldnamen wie im Ist bleiben erhalten —
sie sind oben aus Platzgründen gekürzt, im Repo unter `src/app/app/contracts/page.tsx`
Zeilen 136–194 vollständig.)

## 9. Datei E — `src/app/app/profile/page.tsx` (Ist, Form-Vertrag übernehmen)

Feldnamen des Formulars (`firstName`, `lastName`, `phone`, `postcode`, `address`,
Action `saveProfileAction`) exakt übernehmen. Vollständigkeit = dieselben 4 Angaben
wie in Datei B (`profileFields`).

```tsx
import { EHButton, EHPageHeader, EHList, EHCallout, EHField, EHInput, EHWorkspaceGrid, EHIdentitySummary, EHWorkflowForm, EHWorkflowStack, EHFormSection, EHFieldGrid, EHMetricsBar, EHRecordList, EHStatus, EHSubmitButton, EHText, EHWorkSection, type EHRecordEntry } from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { InstallAppCard } from '@/components/install-app-card';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { primaryProperty } from '@/lib/properties';
import { logoutAction,saveProfileAction } from '@/app/actions';

/** Die Angaben, aus denen sich die Vollständigkeit des Profils ergibt. */
type ProfileField = { id: string; label: string; value: string; filled: boolean };

export default async function Profile(){
  const u=await requireUser('homeowner'); const p=db.prepare('SELECT * FROM homeowner_profiles WHERE user_id=?').get(u.id) as any;
  const property=primaryProperty(u.id);
  const initials=`${u.first_name?.[0]||''}${u.last_name?.[0]||''}`.toUpperCase();
  // Kennzahlen und rechte Spalte lesen dieselbe Liste: die Prozentzahl oben und
  // die Eintraege rechts koennen nicht auseinanderlaufen.
  const fields:ProfileField[]=[
    {id:'name',label:'Vor- und Nachname',value:`${u.first_name||''} ${u.last_name||''}`.trim(),filled:!!(u.first_name&&u.last_name)},
    {id:'mobil',label:'Mobilnummer',value:u.phone||'',filled:!!u.phone},
    {id:'strasse',label:'Straße',value:p?.address||'',filled:!!p?.address},
    {id:'plz',label:'PLZ',value:p?.postcode||'',filled:!!p?.postcode},
  ];
  const filled=fields.filter(f=>f.filled).length;
  const complete=filled===fields.length;
  // Abgleich Profiladresse gegen die Hausakte: beide werden beim Speichern des
  // Profils zusammengefuehrt, koennen aber getrennt gepflegt worden sein.
  const addressMatch=!!property&&(property.postcode||'')===(p?.postcode||'')&&(property.address||'')===(p?.address||'');
  const fieldItems:EHRecordEntry[]=fields.map(f=>({
    id:f.id,
    title:f.label,
    detail:f.filled?f.value:'Noch nicht hinterlegt',
    status:f.filled?<EHStatus tone="success">Hinterlegt</EHStatus>:<EHStatus tone="warning">Fehlt</EHStatus>,
  }));
  const verificationItems:EHRecordEntry[]=[
    {id:'haus',title:'Hausakte',detail:property?(property.address||'Ohne hinterlegte Adresse'):'Noch nicht angelegt',status:property?<EHStatus tone="success">Verknüpft</EHStatus>:<EHStatus tone="neutral">Fehlt</EHStatus>},
    {id:'abgleich',title:'Profiladresse ↔ Hausakte',detail:!property?'Ohne Hausakte gibt es nichts abzugleichen':addressMatch?'Beide tragen dieselbe Adresse':'Die Adressen weichen voneinander ab',status:!property?<EHStatus tone="neutral">Kein Abgleich</EHStatus>:addressMatch?<EHStatus tone="success">Stimmt überein</EHStatus>:<EHStatus tone="warning">Weicht ab</EHStatus>},
  ];
  return <WerkbankRahmen role="homeowner" active="/app/profile" brandSub={property?.address || p?.address}>
    <EHWorkflowStack>
    <EHPageHeader title="Profil & Einstellungen" context={u.email} />
    <EHMetricsBar label="Profil & Einstellungen" items={[
      {id:'profil',label:'Profil',value:`${Math.round(filled/fields.length*100)} %`,hint:`${filled} von ${fields.length} Angaben`},
      {id:'kontakt',label:'Kontakt',value:u.phone?'vollständig':'unvollständig',hint:'Mobilnummer für Rückfragen'},
      {id:'adresse',label:'Adresse',value:p?.address&&p?.postcode?'vollständig':'unvollständig',hint:p?.postcode?`PLZ ${p.postcode}`:'PLZ fehlt'},
      {id:'haus',label:'Hausakte',value:property?'verknüpft':'fehlt',hint:property?(property.postcode?`PLZ ${property.postcode}`:'ohne PLZ'):'kein Haus angelegt'},
    ]} />
    <EHWorkspaceGrid main={<EHWorkflowForm action={saveProfileAction}>
      <EHFormSection title="Persönliche Daten" description="So erreichen dich deine Ansprechpartner.">
        <EHFieldGrid>
          <EHField id="profile-first" label="Vorname"><EHInput id="profile-first" name="firstName" autoComplete="given-name" defaultValue={u.first_name}/></EHField>
          <EHField id="profile-last" label="Nachname"><EHInput id="profile-last" name="lastName" autoComplete="family-name" defaultValue={u.last_name}/></EHField>
          <EHField id="profile-phone" label="Mobilnummer" hint="Für direkte Erreichbarkeit; WhatsApp erst nach Freischaltung."><EHInput id="profile-phone" name="phone" type="tel" autoComplete="tel" aria-describedby="profile-phone-hint" defaultValue={u.phone||''} placeholder="+49 …"/></EHField>
          <EHField id="profile-postcode" label="PLZ"><EHInput id="profile-postcode" name="postcode" autoComplete="postal-code" defaultValue={p?.postcode||''}/></EHField>
        </EHFieldGrid>
        <EHField id="profile-address" label="Adresse"><EHInput id="profile-address" name="address" autoComplete="street-address" defaultValue={p?.address||''}/></EHField>
        <EHSubmitButton>Änderungen speichern</EHSubmitButton>
      </EHFormSection>
    </EHWorkflowForm>} aside={<>
      <EHIdentitySummary initials={initials} name={`${u.first_name} ${u.last_name}`} email={u.email} />
      <EHWorkSection title="Profilvollständigkeit">
        <EHStatus tone={complete?'success':'warning'}>{complete?'Alle Angaben hinterlegt':'Noch unvollständig'}</EHStatus>
        <EHText muted>{complete
          ? 'Ansprechpartner sehen Name, Mobilnummer und Adresse, sobald ein Kontakt oder Auftrag es verlangt.'
          : `${filled} von ${fields.length} Angaben sind hinterlegt. Fehlende Angaben ergänzt du im Formular links.`}</EHText>
        <EHRecordList label="Angaben im Profil" items={fieldItems} />
      </EHWorkSection>
      <EHWorkSection title="Verifikation">
        <EHStatus tone={addressMatch?'success':property?'warning':'neutral'}>{addressMatch?'Adresse abgeglichen':property?'Abgleich offen':'Keine Hausakte'}</EHStatus>
        <EHText muted>Deine E-Mail-Adresse ist deine Anmeldung. Die Profiladresse wird beim Speichern in die Hausakte übernommen; stimmen beide überein, arbeiten alle Bereiche mit derselben Adresse.</EHText>
        <EHRecordList label="Abgleich mit der Hausakte" items={verificationItems} />
        <EHButton href="/app/home" variant="secondary" arrow>Mein Haus öffnen</EHButton>
      </EHWorkSection>
    </>}/>
    <EHWorkSection title="Konto & App">
    <EHList label="Profilbereiche" items={[
      { id: 'plans', title: 'Zahlungen & Mitgliedschaft', href: '/app/plans' },
      { id: 'notifications', title: 'Benachrichtigungen', href: '/notifications' },
      { id: 'help', title: 'Hilfe & Support', text: 'Direkte Unterstützung', href: '/app/hilfe' },
    ]} />
    </EHWorkSection>
    <div data-testid="owner-logout-section">
    <EHWorkflowForm action={logoutAction}><EHSubmitButton pendingLabel="Wird abgemeldet …">Ausloggen</EHSubmitButton></EHWorkflowForm>
    <EHWorkflowForm action={logoutAction}><EHButton type="submit" variant="secondary" data-testid="owner-logout-profile" aria-label="Abmelden">Abmelden</EHButton></EHWorkflowForm>
    </div>
    <InstallAppCard/>
    <EHCallout title="WhatsApp ist noch nicht freigeschaltet"><p>In der App kannst du den Hausmeister bereits nutzen. Der WhatsApp-Kanal wird erst angeboten, sobald der Business-Kanal tatsächlich verfügbar ist.</p></EHCallout>
    <EHCallout title="Deine Hausdaten bleiben privat."><p>Partner sehen nur die Informationen, die für einen konkreten Kontakt oder Auftrag notwendig sind.</p></EHCallout>
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
```

## 10. Erwartetes Ergebnis

Drei komplette Dateien: neue `contracts`-, `calendar`-, `profile`-Seiten im
`#start`-Muster, mit übernommener Datenlogik, ohne Mocks, ohne neue Stilfamilie.
Reihenfolge: Verträge → Termine → Profil.
