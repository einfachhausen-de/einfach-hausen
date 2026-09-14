import { AppShell } from '@/components/shell';
import { crumbs } from '@/components/nav-config';
import { EHOwnerPageHeader, EHOwnerFilters, EHOwnerSection, EHOwnerRecords, EHEmptyState, EHButton, type EHOwnerRecord } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { statusLabel } from '@/lib/format';
import { ownerDate, ownerInstant } from '@/lib/owner-format';

type Appointment = {id:number;job_id:number;title:string;start_at:string;status:string;business_name:string|null};
const monthFmt = new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric',timeZone:'Europe/Berlin'});
export default async function Calendar({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const user = await requireUser('homeowner');
  const params = await searchParams;
  const past = params.view === 'past';
  const count = past ? (db.prepare("SELECT COUNT(*) c FROM appointments a JOIN jobs j ON j.id=a.job_id WHERE a.homeowner_id=? AND datetime(a.start_at)<datetime('now')").get(user.id) as {c:number}).c : 0;
  const pages = Math.max(1, Math.ceil(count / 50));
  const requestedPage = Number(params.page);
  const page = past && Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, pages) : 1;
  const rows = db.prepare(`SELECT a.id,a.job_id,a.start_at,a.status,j.title,p.business_name FROM appointments a JOIN jobs j ON j.id=a.job_id LEFT JOIN provider_profiles p ON p.user_id=a.provider_id WHERE a.homeowner_id=? AND datetime(a.start_at) ${past ? '<' : '>='} datetime('now') ORDER BY datetime(a.start_at) ${past ? 'DESC' : 'ASC'},a.id ${past ? 'LIMIT 50 OFFSET ?' : ''}`).all(...(past ? [user.id, (page - 1) * 50] : [user.id])) as Appointment[];
  const groups = new Map<string,EHOwnerRecord[]>();
  for (const row of rows) {
    const instant = ownerInstant(row.start_at);
    const month = instant ? monthFmt.format(instant) : 'Datum prüfen';
    const list = groups.get(month) || [];
    list.push({id:String(row.id),href:`/app/jobs/${row.job_id}`,title:row.title,detail:ownerDate(row.start_at),meta:row.business_name || 'Betrieb im Auftrag ansehen',status:statusLabel(row.status),tone:row.status==='cancelled' ? 'neutral' : row.status==='confirmed' ? 'success' : 'info',action:'Auftrag öffnen'});
    groups.set(month,list);
  }
  const total = past ? count : rows.length;
  return <AppShell role="homeowner" active="/app/calendar" title="Termine" breadcrumbs={crumbs('/app/jobs','Termine')}>
    <EHOwnerPageHeader title="Deine Termine" context={`${total} ${total === 1 ? 'Termin' : 'Termine'}`} text="Alle Termine mit Status. Details stehen im jeweiligen Auftrag." />
    <EHOwnerFilters label="Zeitraum" items={[{href:'/app/calendar',label:'Anstehend',active:!past},{href:'/app/calendar?view=past',label:'Vergangen',active:past}]} />
    {rows.length===0 ? (
      <EHEmptyState title={past ? 'Keine vergangenen Termine' : 'Keine anstehenden Termine'} text={past ? 'Vergangene Besuche erscheinen später hier.' : 'Neue Anliegen kannst du beschreiben. Bestehende Absprachen findest du in deinen Aufträgen.'} action={<EHButton href="/app/jobs" variant="secondary">Aufträge ansehen</EHButton>} />
    ) : (
      <EHOwnerSection title={past ? 'Vergangene Termine' : 'Anstehende Termine'} text={past ? `Seite ${page} von ${pages}.` : undefined}>
        {null}
      </EHOwnerSection>
    )}
    {[...groups].map(([month,items]) => <EHOwnerSection key={month} title={month}><EHOwnerRecords label={month} items={items} /></EHOwnerSection>)}
    {past && pages > 1 && <EHOwnerFilters label="Seiten der Terminhistorie" items={[
      ...(page > 1 ? [{href:`/app/calendar?view=past&page=${page-1}`,label:'Neuere Termine',active:false}] : []),
      ...(page < pages ? [{href:`/app/calendar?view=past&page=${page+1}`,label:'Ältere Termine',active:false}] : []),
    ]} />}
  </AppShell>;
}
