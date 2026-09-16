import { CalendarClock } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { crumbs } from '@/components/nav-config';
import { EHEmptyState, EHButton, EHMetricsBar, EHOwnerFilters, EHOwnerSection, EHPageHeader, EHRecordList, EHStatus, type EHRecordEntry } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { statusLabel } from '@/lib/format';
import { ownerDate, ownerInstant } from '@/lib/owner-format';

type Appointment = {id:number;job_id:number;title:string;start_at:string;status:string;business_name:string|null};
const monthFmt = new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric',timeZone:'Europe/Berlin'});
const appointmentTone = (status: string) => status === 'cancelled' ? 'neutral' as const : status === 'confirmed' ? 'success' as const : 'info' as const;
export default async function Calendar({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const user = await requireUser('homeowner');
  const params = await searchParams;
  const past = params.view === 'past';
  const count = past ? (db.prepare("SELECT COUNT(*) c FROM appointments a JOIN jobs j ON j.id=a.job_id WHERE a.homeowner_id=? AND datetime(a.start_at)<datetime('now')").get(user.id) as {c:number}).c : 0;
  const pages = Math.max(1, Math.ceil(count / 50));
  const requestedPage = Number(params.page);
  const page = past && Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, pages) : 1;
  const rows = db.prepare(`SELECT a.id,a.job_id,a.start_at,a.status,j.title,p.business_name FROM appointments a JOIN jobs j ON j.id=a.job_id LEFT JOIN provider_profiles p ON p.user_id=a.provider_id WHERE a.homeowner_id=? AND datetime(a.start_at) ${past ? '<' : '>='} datetime('now') ORDER BY datetime(a.start_at) ${past ? 'DESC' : 'ASC'},a.id ${past ? 'LIMIT 50 OFFSET ?' : ''}`).all(...(past ? [user.id, (page - 1) * 50] : [user.id])) as Appointment[];
  const groups = new Map<string,EHRecordEntry[]>();
  for (const row of rows) {
    const instant = ownerInstant(row.start_at);
    const month = instant ? monthFmt.format(instant) : 'Datum prüfen';
    const list = groups.get(month) || [];
    list.push({id:String(row.id),title:row.title,detail:row.business_name || 'Betrieb im Auftrag ansehen',date:row.start_at?String(row.start_at).slice(0,10):undefined,dateLabel:ownerDate(row.start_at),status:<EHStatus tone={appointmentTone(row.status)}>{statusLabel(row.status)}</EHStatus>,href:`/app/jobs/${row.job_id}`,icon:<CalendarClock size={20} />});
    groups.set(month,list);
  }
  const confirmed = rows.filter(row => row.status === 'confirmed').length;
  const cancelled = rows.filter(row => row.status === 'cancelled').length;
  const total = past ? count : rows.length;
  const totalLabel = `${total} ${total === 1 ? 'Termin' : 'Termine'}`;
  return <AppShell role="homeowner" active="/app/calendar" title="Termine" breadcrumbs={crumbs('/app/jobs','Termine')}>
    <EHPageHeader title="Deine Termine" context={past ? `${totalLabel} · Seite ${page} von ${pages}` : totalLabel} />
    <EHOwnerFilters label="Zeitraum" items={[{href:'/app/calendar',label:'Anstehend',active:!past},{href:'/app/calendar?view=past',label:'Vergangen',active:past}]} />
    {rows.length===0 ? (
      <EHEmptyState title={past ? 'Keine vergangenen Termine' : 'Keine anstehenden Termine'} text={past ? 'Vergangene Besuche erscheinen später hier.' : 'Neue Anliegen kannst du beschreiben. Bestehende Absprachen findest du in deinen Aufträgen.'} action={<EHButton href="/app/jobs" variant="secondary">Aufträge ansehen</EHButton>} />
    ) : (
      <>
        <EHMetricsBar label="Termine" items={[
          {id:'bestaetigt',label:'Bestätigt',value:confirmed},
          {id:'angefragt',label:'Angefragt',value:rows.length-confirmed-cancelled},
          {id:'abgesagt',label:'Abgesagt',value:cancelled},
        ]} />
        {[...groups].map(([month,items]) => <EHOwnerSection key={month} title={month}><EHRecordList label={month} items={items} /></EHOwnerSection>)}
      </>
    )}
    {past && pages > 1 && <EHOwnerFilters label="Seiten der Terminhistorie" items={[
      ...(page > 1 ? [{href:`/app/calendar?view=past&page=${page-1}`,label:'Neuere Termine',active:false}] : []),
      ...(page < pages ? [{href:`/app/calendar?view=past&page=${page+1}`,label:'Ältere Termine',active:false}] : []),
    ]} />}
  </AppShell>;
}
