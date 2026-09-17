import { CalendarDays } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { ProviderAccessBoundary, ProviderState } from '@/components/provider/workspace';
import { EHMetricsBar, EHButton, EHPageHeader, EHRecordList, EHRecordViews, EHStatus, EHText, EHWorkSection, EHWorkspaceGrid, type EHRecordEntry } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { statusLabel } from '@/lib/format';
import { getProviderContext } from '@/lib/provider';

const DONE_STATUSES = new Set(['completed', 'cancelled', 'closed', 'paid']);

type AppointmentItem = EHRecordEntry & { _time: number; _done: boolean };

function berlinDayKey(d: Date) {
  return new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function toItem(row: any) {
  const start = new Date(row.start_at);
  const time = Number.isFinite(start.getTime()) ? start.getTime() : Number.NaN;
  return {
    id: String(row.id),
    title: row.title,
    detail: `${row.first_name} ${row.last_name}${row.contact_first ? ` · Ansprechpartner: ${row.contact_first} ${row.contact_last}` : ''}`,
    dateLabel: new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin', timeZoneName: 'short' }).format(start),
    date: Number.isFinite(time) ? berlinDayKey(start) : undefined,
    status: <EHStatus tone={DONE_STATUSES.has(String(row.status ?? '')) ? 'success' : 'neutral'}>{statusLabel(row.status)}</EHStatus>,
    icon: <CalendarDays size={20} />,
    href: `/pro/jobs/${row.job_id}`,
    _time: time,
    _done: DONE_STATUSES.has(String(row.status ?? '')),
  };
}

export default async function ProCalendar() {
  const u = await requireUser('provider');
  const ctx = getProviderContext(u.id);
  if (!ctx) {
    return <WerkbankRahmen role="provider" active="/pro/calendar">
      <ProviderState
        icon={<CalendarDays size={21} />}
        title="Termine derzeit nicht verfügbar"
        description="Deinem Zugang ist kein aktiver Betrieb zugeordnet oder dein Teamzugang wurde deaktiviert. Bitte lass die Zuordnung durch deine Betriebsleitung prüfen."
        tone="unavailable"
        action={{ href: '/pro/hilfe', label: 'Hilfe zum Partnerzugang' }}
      />
    </WerkbankRahmen>;
  }

  const rows = ctx.canManageJobs
    ? db.prepare(`SELECT a.*,j.title,x.first_name,x.last_name,cu.first_name contact_first,cu.last_name contact_last FROM appointments a JOIN jobs j ON j.id=a.job_id JOIN users x ON x.id=a.homeowner_id LEFT JOIN users cu ON cu.id=a.contact_user_id WHERE a.provider_id=? ORDER BY a.start_at`).all(ctx.providerId) as any[]
    : db.prepare(`SELECT a.*,j.title,x.first_name,x.last_name,cu.first_name contact_first,cu.last_name contact_last FROM appointments a JOIN jobs j ON j.id=a.job_id JOIN users x ON x.id=a.homeowner_id LEFT JOIN users cu ON cu.id=a.contact_user_id WHERE a.provider_id=? AND a.contact_user_id=? ORDER BY a.start_at`).all(ctx.providerId, u.id) as any[];

  const items: AppointmentItem[] = rows.map(toItem);
  const now = new Date();
  const todayKey = berlinDayKey(now);
  const today = items.filter((i) => !i._done && Number.isFinite(i._time) && berlinDayKey(new Date(i._time)) === todayKey);
  const upcoming = items.filter((i) => !i._done && Number.isFinite(i._time) && new Date(i._time).getTime() > now.getTime() && berlinDayKey(new Date(i._time)) !== todayKey);
  const overdue = items.filter((i) => !i._done && Number.isFinite(i._time) && new Date(i._time).getTime() <= now.getTime() && berlinDayKey(new Date(i._time)) !== todayKey);
  const undated = items.filter((i) => !i._done && !Number.isFinite(i._time));
  const done = items.filter((i) => i._done);
  // Der naechste Termin ist der erste, der noch aussteht: heute vor spaeter.
  // Undatierte Termine bleiben aussen vor, weil sie kein belastbares Datum tragen.
  const next = today[0] ?? upcoming[0];

  return (
    <WerkbankRahmen role="provider" active="/pro/calendar">
      <EHPageHeader title="Termine" context={`${items.length} Termine${ctx.canManageJobs ? ' des Betriebs' : ' mit dir als Ansprechpartner'}`} />
      <ProviderAccessBoundary canManageJobs={ctx.canManageJobs} />

      {items.length > 0 && (
        <EHMetricsBar label="Termine" items={[
          { id: 'heute', label: 'Heute', value: today.length, hint: 'Anstehende Kundentermine' },
          { id: 'anstehend', label: 'Anstehend', value: upcoming.length + undated.length, hint: 'Geplante Folgetermine' },
          { id: 'ueberfaellig', label: 'Überfällig', value: overdue.length, hint: 'Nacharbeiten oder neu planen' },
          { id: 'erledigt', label: 'Erledigt', value: done.length, hint: 'Abgeschlossene Termine' },
        ]} />
      )}

      <EHWorkspaceGrid main={<>
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
              {overdue.length > 0 ? <EHRecordViews label="Überfällige Termine" items={overdue} storageKey="pro-cal-ueberfaellig" switcherLabel="Überfällige Termine: Ansicht wechseln" /> : (
                <ProviderState compact icon={<CalendarDays size={21} />} title="Nichts überfällig" description="Alle Termine sind im Plan." tone="success" />
              )}
            </EHWorkSection>
          </div>
        )}

        {items.length > 0 && (
          <div id="pro-cal-today">
            <EHWorkSection title={`Heute · ${today.length}`}>
              {today.length > 0 ? <EHRecordViews label="Termine heute" items={today} storageKey="pro-cal-heute" switcherLabel="Termine heute: Ansicht wechseln" /> : (
                <ProviderState compact icon={<CalendarDays size={21} />} title="Heute keine Termine" description="Der Tag ist frei für Vorbereitung und Anfragen." />
              )}
            </EHWorkSection>
          </div>
        )}

        {items.length > 0 && (
          <div id="pro-cal-upcoming">
            <EHWorkSection title={`Anstehend · ${upcoming.length + undated.length}`}>
              {(upcoming.length + undated.length) > 0 ? <EHRecordViews label="Anstehende Termine" items={[...upcoming, ...undated]} storageKey="pro-cal-anstehend" switcherLabel="Anstehende Termine: Ansicht wechseln" /> : (
                <ProviderState compact icon={<CalendarDays size={21} />} title="Keine Folgetermine" description="Sobald ein weiterer Kundentermin bestätigt ist, steht er hier." />
              )}
            </EHWorkSection>
          </div>
        )}

        {items.length > 0 && (
          <div id="pro-cal-done">
            <EHWorkSection title={`Erledigt · ${done.length}`}>
              {done.length > 0 ? <EHRecordViews label="Erledigte Termine" items={done} storageKey="pro-cal-erledigt" switcherLabel="Erledigte Termine: Ansicht wechseln" /> : (
                <ProviderState compact icon={<CalendarDays size={21} />} title="Noch nichts erledigt" description="Abgeschlossene Termine bleiben hier nachvollziehbar." />
              )}
            </EHWorkSection>
          </div>
        )}
      </>} aside={<>
        <EHWorkSection title="Nächster Termin">
          {next ? <>
            <EHText>{next.dateLabel}</EHText>
            <EHText muted>{next.detail}</EHText>
            {next.status}
            {next.href && <EHButton href={next.href} variant="secondary" arrow>{next.title}</EHButton>}
          </> : <EHText muted>Kein anstehender Termin. Sobald ein Kundentermin bestätigt ist, steht er hier mit Datum und Ansprechpartner.</EHText>}
        </EHWorkSection>
        <EHWorkSection title="Weitere anstehende Termine">
          <EHRecordList label="Weitere anstehende Termine" items={[...today, ...upcoming].filter((item) => item !== next).slice(0, 4)} empty="Noch keine weiteren Termine vereinbart." />
        </EHWorkSection>
        <EHButton href="/pro/orders" variant="secondary" arrow>Aufträge ansehen</EHButton>
      </>} />
    </WerkbankRahmen>
  );
}
