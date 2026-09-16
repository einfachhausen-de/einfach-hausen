import fs from 'node:fs';
import path from 'node:path';
import { Bell, CalendarClock, FileText, Search } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { EHButton, EHCallout, EHMetricsBar, EHOwnerSection, EHPageHeader, EHRecordList, EHStatus, type EHRecordEntry } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateLabel, euro } from '@/lib/format';
import { ownerInstant } from '@/lib/owner-format';
import { primaryProperty } from '@/lib/properties';

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
    const bytes = fs.statSync(path.join(process.cwd(), 'data', 'private', relativePath)).size;
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

  return <AppShell role="homeowner" active="/app" title="Start">
    <EHPageHeader title={address || 'Adresse ergänzen'} context={name || undefined} actions={<>
      <EHButton href="/app/jobs" variant="secondary" size="small" aria-label="Aufträge durchsuchen"><Search size={18} /></EHButton>
      <EHButton href="/notifications" variant="secondary" size="small" aria-label={unread ? `${unread} ungelesene Benachrichtigungen` : 'Benachrichtigungen'}><Bell size={18} />{unread > 0 && <EHStatus tone="info">{unread > 99 ? '99+' : unread}</EHStatus>}</EHButton>
    </>} />
    {profile?.onboarding_step && profile.onboarding_step !== 'done' && <EHCallout title="Einrichtung unvollständig"><p>Ergänze die Angaben zu deinem Zuhause.</p><EHButton href="/app/onboarding" variant="secondary">Einrichtung fortsetzen</EHButton></EHCallout>}
    <EHMetricsBar label="Überblick" items={[
      { id: 'termine', label: 'Termine', value: appointments },
      { id: 'dokumente', label: 'Dokumente', value: documentCount },
      { id: 'auftraege', label: 'Aufträge', value: jobs },
    ]} />
    <EHOwnerSection title={`Wartet auf dich (${waiting.length})`}>
      <EHRecordList label="Wartet auf dich" items={waiting} empty="Nichts offen." />
    </EHOwnerSection>
    <EHOwnerSection title="Hausakte" action={{ href: '/app/documents', label: `Alle ${documentCount}` }}>
      <EHRecordList label="Hausakte" items={hausakte} empty="Keine Dokumente." />
    </EHOwnerSection>
  </AppShell>;
}
