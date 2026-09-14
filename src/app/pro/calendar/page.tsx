import { CalendarDays } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { ProviderAccessBoundary, ProviderPageIntro, ProviderSectionHeader, ProviderState } from '@/components/provider/workspace';
import { EHWorkMetrics, EHWorkSection, EHScheduleList } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { statusLabel } from '@/lib/format';
import { getProviderContext } from '@/lib/provider';

const DONE_STATUSES = new Set(['completed', 'cancelled', 'closed', 'paid']);

function berlinDayKey(d: Date) {
  return new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function toItem(row: any) {
  const start = new Date(row.start_at);
  return {
    id: String(row.id),
    title: row.title,
    dateLabel: new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin', timeZoneName: 'short' }).format(start),
    day: new Intl.DateTimeFormat('de-DE', { day: '2-digit', timeZone: 'Europe/Berlin' }).format(start),
    month: new Intl.DateTimeFormat('de-DE', { month: 'short', timeZone: 'Europe/Berlin' }).format(start),
    detail: `${row.first_name} ${row.last_name}${row.contact_first ? ` · Ansprechpartner: ${row.contact_first} ${row.contact_last}` : ''}`,
    href: `/pro/jobs/${row.job_id}`,
    status: statusLabel(row.status),
    _time: Number.isFinite(start.getTime()) ? start.getTime() : Number.NaN,
    _done: DONE_STATUSES.has(String(row.status ?? '')),
  };
}

export default async function ProCalendar() {
  const u = await requireUser('provider');
  const ctx = getProviderContext(u.id);
  if (!ctx) {
    return <AppShell role="provider" active="/pro/calendar" title="Termine" subtitle="Zugang prüfen">
      <ProviderPageIntro eyebrow="Planung" title="Termine" description="Hier findest du die Kundentermine deines Betriebs." />
      <ProviderState
        icon={<CalendarDays size={21} />}
        title="Termine derzeit nicht verfügbar"
        description="Deinem Zugang ist kein aktiver Betrieb zugeordnet oder dein Teamzugang wurde deaktiviert. Bitte lass die Zuordnung durch deine Betriebsleitung prüfen."
        tone="unavailable"
        action={{ href: '/pro/hilfe', label: 'Hilfe zum Partnerzugang' }}
      />
    </AppShell>;
  }

  const rows = ctx.canManageJobs
    ? db.prepare(`SELECT a.*,j.title,x.first_name,x.last_name,cu.first_name contact_first,cu.last_name contact_last FROM appointments a JOIN jobs j ON j.id=a.job_id JOIN users x ON x.id=a.homeowner_id LEFT JOIN users cu ON cu.id=a.contact_user_id WHERE a.provider_id=? ORDER BY a.start_at`).all(ctx.providerId) as any[]
    : db.prepare(`SELECT a.*,j.title,x.first_name,x.last_name,cu.first_name contact_first,cu.last_name contact_last FROM appointments a JOIN jobs j ON j.id=a.job_id JOIN users x ON x.id=a.homeowner_id LEFT JOIN users cu ON cu.id=a.contact_user_id WHERE a.provider_id=? AND a.contact_user_id=? ORDER BY a.start_at`).all(ctx.providerId, u.id) as any[];

  const items = rows.map(toItem);
  const now = new Date();
  const todayKey = berlinDayKey(now);
  const today = items.filter((i) => !i._done && Number.isFinite(i._time) && berlinDayKey(new Date(i._time)) === todayKey);
  const upcoming = items.filter((i) => !i._done && Number.isFinite(i._time) && new Date(i._time).getTime() > now.getTime() && berlinDayKey(new Date(i._time)) !== todayKey);
  const overdue = items.filter((i) => !i._done && Number.isFinite(i._time) && new Date(i._time).getTime() <= now.getTime() && berlinDayKey(new Date(i._time)) !== todayKey);
  const undated = items.filter((i) => !i._done && !Number.isFinite(i._time));
  const done = items.filter((i) => i._done);

  return (
    <AppShell role="provider" active="/pro/calendar" title="Termine" subtitle={ctx.canManageJobs ? 'Betriebstermine' : 'Deine Termine'}>
      <ProviderPageIntro
        eyebrow="Planung"
        title="Termine"
        description={ctx.canManageJobs ? 'Kundentermine des Betriebs mit ihrem aktuellen Status.' : 'Termine, bei denen du als Ansprechpartner hinterlegt bist.'}
      />
      <ProviderAccessBoundary canManageJobs={ctx.canManageJobs} />

      {items.length > 0 && (
        <EHWorkMetrics items={[
          { label: 'Heute', value: today.length, href: '#pro-cal-today', hint: 'Anstehende Kundentermine' },
          { label: 'Anstehend', value: upcoming.length + undated.length, href: '#pro-cal-upcoming', hint: 'Geplante Folgetermine' },
          { label: 'Überfällig', value: overdue.length, href: '#pro-cal-overdue', hint: 'Nacharbeiten oder neu planen' },
          { label: 'Erledigt', value: done.length, href: '#pro-cal-done', hint: 'Abgeschlossene Termine' },
        ]} />
      )}

      {items.length === 0 && (
        <EHWorkSection title="Termine · 0 Termine">
          <ProviderState
            icon={<CalendarDays size={21} />}
            title="Noch keine Termine"
            description="Sobald ein bestätigter Kundentermin hinterlegt ist, erscheint er hier zusammen mit Auftrag und Ansprechpartner."
            action={{ href: '/pro/orders', label: 'Aufträge ansehen' }}
          />
        </EHWorkSection>
      )}

      {items.length > 0 && (
        <div id="pro-cal-overdue">
          <EHWorkSection title={`Überfällig · ${overdue.length}`}>
            <ProviderSectionHeader title="Nacharbeiten" description="Vergangene Termine mit offenem Status — prüfen und neu planen oder abschließen." />
            {overdue.length > 0 ? <EHScheduleList label="Überfällige Termine" items={overdue} /> : (
              <ProviderState compact icon={<CalendarDays size={21} />} title="Nichts überfällig" description="Alle Termine sind im Plan." tone="success" />
            )}
          </EHWorkSection>
        </div>
      )}

      {items.length > 0 && (
        <div id="pro-cal-today">
          <EHWorkSection title={`Heute · ${today.length}`}>
            <ProviderSectionHeader title="Heute" description="Alles, was heute ansteht — mit Kunde, Auftrag und Ansprechpartner." />
            {today.length > 0 ? <EHScheduleList label="Termine heute" items={today} /> : (
              <ProviderState compact icon={<CalendarDays size={21} />} title="Heute keine Termine" description="Der Tag ist frei für Vorbereitung und Anfragen." />
            )}
          </EHWorkSection>
        </div>
      )}

      {items.length > 0 && (
        <div id="pro-cal-upcoming">
          <EHWorkSection title={`Anstehend · ${upcoming.length + undated.length}`}>
            <ProviderSectionHeader title="Anstehend" description="Geplante Folgetermine in chronologischer Reihenfolge." />
            {(upcoming.length + undated.length) > 0 ? <EHScheduleList label="Anstehende Termine" items={[...upcoming, ...undated]} /> : (
              <ProviderState compact icon={<CalendarDays size={21} />} title="Keine Folgetermine" description="Sobald ein weiterer Kundentermin bestätigt ist, steht er hier." />
            )}
          </EHWorkSection>
        </div>
      )}

      {items.length > 0 && (
        <div id="pro-cal-done">
          <EHWorkSection title={`Erledigt · ${done.length}`}>
            <ProviderSectionHeader title="Erledigt" description="Abgeschlossene Termine zur Nachvollziehbarkeit." />
            {done.length > 0 ? <EHScheduleList label="Erledigte Termine" items={done} /> : (
              <ProviderState compact icon={<CalendarDays size={21} />} title="Noch nichts erledigt" description="Abgeschlossene Termine bleiben hier nachvollziehbar." />
            )}
          </EHWorkSection>
        </div>
      )}
    </AppShell>
  );
}
