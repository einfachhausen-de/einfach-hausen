import { BadgeCheck, CalendarClock, Flame, Leaf, Sprout } from 'lucide-react';
import { EHPageHeader, EHMetricsBar, EHEmptyState, EHPriorityAction, EHRecordList, EHRecordViews, EHStatus, EHText, EHWorkspaceGrid, EHWorkSection, type EHRecordEntry } from '@/design-system';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { ProviderAccessBoundary, ProviderState } from '@/components/provider/workspace';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateLabel, euro } from '@/lib/format';
import { getProviderContext } from '@/lib/provider';

const TYPE_BADGES = [
  { kind: 'emergency', label: 'Notfallservice', icon: Flame },
  { kind: 'consultation', label: 'Beratung', icon: Leaf },
  { kind: 'service', label: 'Auftrag', icon: Sprout },
] as const;

function requestBadge(job: any) {
  const kind = job.request_kind === 'contact' ? 'consultation' : job.emergency_type ? 'emergency' : 'service';
  return TYPE_BADGES.find((entry) => entry.kind === kind) ?? TYPE_BADGES[2];
}

function timeAgo(iso: string | null | undefined) {
  if (!iso) return '';
  const stamp = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const minutes = Math.max(1, Math.round((Date.now() - new Date(stamp).getTime()) / 60000));
  if (!Number.isFinite(minutes)) return '';
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.round(hours / 24);
  return `vor ${days} Tg.`;
}

function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

export default async function Pro() {
  const u = await requireUser('provider');
  const ctx = getProviderContext(u.id);

  if (!ctx) {
    const blockedNew = (db.prepare(`SELECT COUNT(*) c FROM job_dispatches WHERE provider_id=? AND status IN ('sent','viewed')`).get(u.id) as any).c as number;
    const blockedRunning = (db.prepare(`SELECT COUNT(*) c FROM jobs j JOIN job_dispatches d ON d.job_id=j.id AND d.provider_id=? WHERE j.status IN ('accepted','in_progress')`).get(u.id) as any).c as number;
    const blockedUpcoming = (db.prepare(`SELECT COUNT(*) c FROM appointments WHERE contact_user_id=? AND status='confirmed' AND datetime(start_at)>=datetime('now','localtime')`).get(u.id) as any).c as number;
    const blockedUnread = (db.prepare(`SELECT COUNT(*) c FROM messages WHERE recipient_id=? AND read_at IS NULL`).get(u.id) as any).c as number;
    return (
      <WerkbankRahmen role="provider" active="/pro">
        <EHPageHeader title={`${greeting()}, ${u.first_name}.`} context="Partnerbereich" />
        <EHMetricsBar label="Stand deines Betriebs" items={[
          { id: 'neu', label: 'Neue Aufträge', value: blockedNew, hint: 'Zuletzt zugeordnete Vorgänge' },
          { id: 'laufend', label: 'Laufende Aufträge', value: blockedRunning },
          { id: 'termine', label: 'Nächste Termine', value: blockedUpcoming, hint: 'Bestätigte Termine' },
          { id: 'nachrichten', label: 'Ungelesene Nachrichten', value: blockedUnread },
        ]} />
        <ProviderState
          icon={<BadgeCheck size={21} />}
          title="Keinem Unternehmen zugeordnet"
          description="Dein App-Zugang ist aktuell keinem aktiven Partnerunternehmen zugeordnet. Bitte lass die Unternehmenszuordnung prüfen."
          tone="unavailable"
        />
        <EHWorkspaceGrid main={
          <EHWorkSection title="Betriebsübersicht">
            <EHEmptyState title="Noch keine Betriebsdaten" text="Sobald die Unternehmenszuordnung aktiv ist, erscheinen hier Aufträge, Termine und Nachrichten." />
          </EHWorkSection>
        } aside={
          <EHWorkSection title="Nächster Schritt">
            <EHText muted>Die Unternehmenszuordnung wird geprüft. Danach erscheinen hier Termine und Vorgänge.</EHText>
          </EHWorkSection>
        } />
      </WerkbankRahmen>
    );
  }

  const p = db.prepare(`SELECT p.*,c.status contract_status,c.insurance_verified,c.qualification_verified,c.contract_verified,c.quality_standard_verified,c.response_target_minutes FROM provider_profiles p LEFT JOIN partner_contracts c ON c.provider_id=p.user_id WHERE p.user_id=?`).get(ctx.providerId) as any;

  if (!p?.verified || p.contract_status !== 'active') {
    const blockedRequests = (db.prepare(`SELECT COUNT(*) c FROM job_dispatches WHERE provider_id=? AND status IN ('sent','viewed','quoted')`).get(ctx.providerId) as any).c as number;
    const blockedRunningJobs = (db.prepare(`SELECT COUNT(*) c FROM jobs j JOIN job_dispatches d ON d.job_id=j.id AND d.provider_id=? WHERE j.status IN ('accepted','in_progress')`).get(ctx.providerId) as any).c as number;
    const blockedUpcoming = (db.prepare(`SELECT COUNT(*) c FROM appointments WHERE contact_user_id=? AND status='confirmed' AND datetime(start_at)>=datetime('now','localtime')`).get(u.id) as any).c as number;
    const blockedUnread = ((db.prepare(`SELECT COUNT(*) c FROM messages WHERE recipient_id=? AND read_at IS NULL`).get(u.id) as any).c as number)
      + ((db.prepare(`SELECT COUNT(*) c FROM contact_messages WHERE provider_id=? AND sender_id!=? AND read_at IS NULL`).get(ctx.providerId, u.id) as any).c as number);
    return (
      <WerkbankRahmen role="provider" active="/pro">
        <EHPageHeader title={`${greeting()}, ${u.first_name}.`} context={ctx.businessName} />
        <EHMetricsBar label="Stand deines Betriebs" items={[
          { id: 'neu', label: 'Neue Aufträge', value: blockedRequests, hint: 'Zuletzt zugeordnete Vorgänge' },
          { id: 'laufend', label: 'Laufende Aufträge', value: blockedRunningJobs },
          { id: 'termine', label: 'Nächste Termine', value: blockedUpcoming, hint: 'Bestätigte Termine' },
          { id: 'nachrichten', label: 'Ungelesene Nachrichten', value: blockedUnread },
        ]} />
        <ProviderState
          icon={<BadgeCheck size={21} />}
          title={!p?.verified ? 'Unternehmensprüfung ausstehend' : 'Partnervertrag noch nicht aktiv'}
          description="Einfach Hausen arbeitet nur mit geprüften, vertraglich gebundenen regionalen Unternehmen. Der Firmeninhaber sieht den aktuellen Prüf- und Vertragsstatus im Profil."
          action={{ href: '/pro/profile', label: 'Partnerstatus ansehen' }}
          tone="unavailable"
        />
        <EHWorkspaceGrid main={
          <EHWorkSection title="Betriebsübersicht">
            <EHEmptyState title="Noch keine Betriebsdaten" text="Sobald Prüfung und Vertrag aktiv sind, erscheinen hier Aufträge, Termine und Nachrichten." />
          </EHWorkSection>
        } aside={
          <EHWorkSection title="Nächster Schritt">
            <EHText muted>Den aktuellen Prüf- und Vertragsstatus im Profil prüfen. Danach erscheinen hier Termine und Vorgänge.</EHText>
          </EHWorkSection>
        } />
      </WerkbankRahmen>
    );
  }

  const requests = db.prepare(`SELECT d.id dispatch_id,d.status dispatch_status,d.match_score,d.distance_km,d.sent_at,j.*,(SELECT amount FROM quotes q WHERE q.job_id=j.id AND q.provider_id=?) my_quote FROM job_dispatches d JOIN jobs j ON j.id=d.job_id WHERE d.provider_id=? AND d.status IN ('sent','viewed','quoted') AND j.status IN ('open','quoted') ORDER BY d.sent_at DESC LIMIT 30`).all(ctx.providerId, ctx.providerId) as any[];
  // "Laufende Aufträge" ist der Betriebsbestand: Aufträge in Bearbeitung, die dem
  // Unternehmen zugeordnet sind. Ohne Auftragsverwaltung zählt stattdessen die
  // eigene zugewiesene Arbeit - sonst stünde dort für Team-Mitglieder eine Null,
  // obwohl sie laufende Vorgänge bearbeiten.
  const runningJobs = ctx.canManageJobs
    ? (db.prepare(`SELECT COUNT(*) c FROM jobs j JOIN job_dispatches d ON d.job_id=j.id AND d.provider_id=? WHERE j.status IN ('accepted','in_progress')`).get(ctx.providerId) as any).c
    : (db.prepare(`SELECT COUNT(*) c FROM jobs j JOIN job_assignments a ON a.job_id=j.id AND a.provider_id=? AND a.contact_user_id=? WHERE j.status IN ('accepted','in_progress')`).get(ctx.providerId, u.id) as any).c;
  const messages = (db.prepare(`SELECT COUNT(*) c FROM messages WHERE recipient_id=? AND read_at IS NULL`).get(u.id) as any).c
    + (db.prepare(`SELECT COUNT(*) c FROM contact_messages WHERE provider_id=? AND sender_id!=? AND read_at IS NULL`).get(ctx.providerId, u.id) as any).c;
  const upcoming = db.prepare(`SELECT a.start_at,j.title,j.postcode,j.id FROM appointments a JOIN jobs j ON j.id=a.job_id WHERE a.contact_user_id=? AND a.status='confirmed' AND datetime(a.start_at)>=datetime('now','localtime') ORDER BY a.start_at ASC LIMIT 2`).all(u.id) as any[];
  const quoteCandidates = requests.filter((job) => !job.my_quote && job.request_kind !== 'contact').length;
  const newRequestsCount = requests.filter((job) => job.dispatch_status === 'sent').length;
  // Standort ist die Grundlage der Auftragszuweisung: PLZ des Betriebs und der
  // Radius, in dem er Aufträge annimmt. Beides darf hier nicht verschwinden.
  const location = `${ctx.jobTitle || 'Ansprechpartner'} · ${p?.radius_km || 25} km um ${p?.postcode || 'deine Region'}`;

  const requestItems: EHRecordEntry[] = requests.slice(0, 5).map((job) => {
    const badge = requestBadge(job);
    const Icon = badge.icon;
    const price = job.my_quote ? euro(job.my_quote) : job.budget_min && job.budget_max ? `ca. ${euro((job.budget_min + job.budget_max) / 2)}` : job.budget_max ? `ca. ${euro(job.budget_max)}` : null;
    return {
      id: String(job.dispatch_id),
      title: job.title.replace(/^Ansprechpartner:\s*/, ''),
      detail: job.description,
      value: price ?? undefined,
      dateLabel: timeAgo(job.sent_at),
      status: <EHStatus tone={job.emergency_type ? 'warning' : 'neutral'}>{badge.label}</EHStatus>,
      icon: <Icon size={20} />,
      href: `/pro/jobs/${job.id}`,
    };
  });

  const appointmentItems: EHRecordEntry[] = upcoming.map((appointment) => {
    const start = new Date(appointment.start_at + 'Z');
    const sameDay = start.toDateString() === new Date().toDateString();
    return {
      id: `${appointment.id}-${appointment.start_at}`,
      title: appointment.title.replace(/^Ansprechpartner:\s*/, ''),
      detail: `${sameDay ? 'Heute' : dateLabel(appointment.start_at.slice(0, 10))}, ${start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr · ${appointment.postcode || 'Terminort'}`,
      icon: <CalendarClock size={20} />,
      href: `/pro/jobs/${appointment.id}`,
    };
  });

  return (
    <WerkbankRahmen role="provider" active="/pro">
      <ProviderAccessBoundary canManageJobs={ctx.canManageJobs} />

      {/* Kompakter Werkzeugkopf statt EHAppHeader: Eyebrow, grosser Titel und
          Erklaertext machten aus der Betriebsstartseite eine Marketingseite
          (Symptom "Dokument statt Werkzeug"). Die Zielvorlage a-liste.png
          traegt an dieser Stelle einen kleinen Titel direkt ueber den
          Kennzahlen. */}
      <EHPageHeader
        title={`${greeting()}, ${u.first_name}.`}
        context={`${ctx.businessName} · ${location}`}
      />

      <EHText muted>{location}</EHText>

      <EHMetricsBar label="Stand deines Betriebs" items={[
        { id: 'anfragen', label: 'Neue Aufträge', value: newRequestsCount, hint: 'In den zuletzt geladenen Aufträgen' },
        { id: 'laufend', label: 'Laufende Aufträge', value: runningJobs },
        { id: 'termine', label: 'Nächste Termine', value: upcoming.length, hint: 'Vorschau der nächsten zwei Termine' },
        { id: 'nachrichten', label: 'Ungelesene Nachrichten', value: messages },
      ]} />

      {ctx.canManageJobs && quoteCandidates > 0 && (
        <EHPriorityAction eyebrow="Als Nächstes" title="Dein nächstes Angebot" text={`${quoteCandidates} Aufträge ohne eigenes Angebot warten auf deine Prüfung.`} href={`/pro/jobs/${requests.find((job) => !job.my_quote && job.request_kind !== 'contact')?.id}`} label="Auftrag prüfen" />
      )}

      <EHWorkspaceGrid main={
        <EHWorkSection title="Passende Kundenaufträge" link={{ href: '/pro/orders', label: 'Alle ansehen' }}>
          <EHRecordViews label="Passende Kundenaufträge" items={requestItems} empty="Keine neuen Aufträge." storageKey="pro-start" switcherLabel="Aufträge: Ansicht wechseln" />
        </EHWorkSection>
      } aside={
        <EHWorkSection title="Deine nächsten Termine" link={{ href: '/pro/calendar', label: 'Kalender' }}>
          <EHRecordList label="Kommende Vor-Ort-Termine" items={appointmentItems} empty="Keine anstehenden Termine." />
        </EHWorkSection>
      } />
    </WerkbankRahmen>
  );
}
