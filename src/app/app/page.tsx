import fs from 'node:fs';
import Link from 'next/link';
import { Bell, CalendarClock, ChevronRight, FileText, Search } from 'lucide-react';
import { AppShell } from '@/components/shell';
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
.eh-werkbank-kopf-copy h1 { font-size:var(--eh-font-body); font-weight:var(--eh-weight-semibold); line-height:var(--eh-leading-tight); }
.eh-werkbank-kopf-copy span { font-size:var(--eh-font-label); line-height:var(--eh-leading-normal); color:var(--eh-muted); }
.eh-werkbank-kopf-tools { flex:none; display:flex; gap:12px; }
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
  const profile = db.prepare('SELECT address,onboarding_step FROM homeowner_profiles WHERE user_id=?').get(user.id) as { address?: string; onboarding_step?: string } | undefined;
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

  return <AppShell role="homeowner" active="/app" rail={<>
      <p className="eh-werkbank-rail-h">Kontext dieser Seite</p>
      <div className="eh-werkbank-karte">
        <h4>Warten auf dich{waiting.length > 0 && <span className="eh-werkbank-badge">{waiting.length}</span>}</h4>
        {waiting.slice(0, 2).map(w => <div key={w.id} className="eh-werkbank-item"><span className="eh-werkbank-ic">▤</span><span><b>{w.title}</b><small>{w.detail}</small></span></div>)}
        <Link href="/app/jobs" className="eh-werkbank-go">Alle ansehen →</Link>
      </div>
      <div className="eh-werkbank-karte">
        <h4>Vollständigkeit</h4>
        <div className="eh-werkbank-bar"><i style={{ width: '68%' }} /></div>
        <div className="eh-werkbank-row"><span>Technik</span><span>4 von 6</span></div>
        <div className="eh-werkbank-row"><span>Verträge</span><span>3 von 5</span></div>
        <div className="eh-werkbank-row"><span>Nachweise</span><span>2 von 4</span></div>
      </div>
    </>}>
    <style>{werkbankLayout}</style>
    <header className="eh-werkbank-kopf">
      <div className="eh-werkbank-kopf-copy">
        <h1>{address || 'Adresse ergänzen'}</h1>
        {name && <span>{name}</span>}
      </div>
      <div className="eh-werkbank-kopf-tools">
        <EHButton href="/app/jobs" variant="secondary" size="small" aria-label="Aufträge durchsuchen"><Search size={18} /></EHButton>
        <EHButton href="/notifications" variant="secondary" size="small" aria-label={unread ? `${unread} ungelesene Benachrichtigungen` : 'Benachrichtigungen'}><Bell size={18} />{unread > 0 && <EHStatus tone="info">{unread > 99 ? '99+' : unread}</EHStatus>}</EHButton>
      </div>
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
  </AppShell>;
}
