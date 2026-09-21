import '@/components/werkbank-layout.css';
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
  const unread = (db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read_at IS NULL AND channel='in_app'").get(user.id) as { c: number }).c;
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
