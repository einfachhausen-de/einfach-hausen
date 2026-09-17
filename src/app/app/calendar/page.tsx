import { CalendarClock } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { EHEmptyState, EHButton, EHMetricsBar, EHOwnerFilters, EHOwnerSection, EHPageHeader, EHRecordList, EHStatus, EHText, EHWorkSection, EHWorkspaceGrid, type EHRecordEntry } from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { statusLabel } from '@/lib/format';
import { ownerDate, ownerInstant } from '@/lib/owner-format';

type Appointment = {id:number;job_id:number;title:string;start_at:string;status:string;business_name:string|null};
const monthFmt = new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric',timeZone:'Europe/Berlin'});
const shortDayFmt = new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',timeZone:'Europe/Berlin'});
const appointmentTone = (status: string) => status === 'cancelled' ? 'neutral' as const : status === 'confirmed' ? 'success' as const : 'info' as const;

/** Beteiligter des Termins. Ohne hinterlegten Betrieb bleibt der Auftrag der Anker. */
const partnerLabel = (row: Appointment) => row.business_name || 'Betrieb im Auftrag ansehen';

/** Kurzes Tagesdatum fuer die Kennzahl. Nur echte Zeitpunkte werden gezeigt, sonst ein Strich. */
function shortDay(value: string | null | undefined): string {
  const raw = String(value ?? '');
  const instant = ownerInstant(raw) ?? (/^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(raw + 'T12:00:00Z') : null);
  return instant && Number.isFinite(instant.getTime()) ? shortDayFmt.format(instant) : '–';
}

/** Ein Termin als Zeile: dieselbe Form tragen Hauptspalte und rechte Spalte. */
function appointmentEntry(row: Appointment): EHRecordEntry {
  return {id:String(row.id),title:row.title,detail:partnerLabel(row),date:row.start_at?String(row.start_at).slice(0,10):undefined,dateLabel:ownerDate(row.start_at),status:<EHStatus tone={appointmentTone(row.status)}>{statusLabel(row.status)}</EHStatus>,href:`/app/jobs/${row.job_id}`,icon:<CalendarClock size={20} />};
}

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
    list.push(appointmentEntry(row));
    groups.set(month,list);
  }
  const total = past ? count : rows.length;
  const totalLabel = `${total} ${total === 1 ? 'Termin' : 'Termine'}`;
  // Die vier Kennzahlen zaehlen ueber die ganze Akte, nicht nur ueber die
  // gerade sichtbare Seite: sonst waere "Diese Woche" von der Filteransicht
  // abhaengig und die Zahl nicht mehr nachvollziehbar.
  const allTotal = (db.prepare('SELECT COUNT(*) c FROM appointments WHERE homeowner_id=?').get(user.id) as {c:number}).c;
  const weekTotal = (db.prepare("SELECT COUNT(*) c FROM appointments WHERE homeowner_id=? AND strftime('%Y-%W',start_at)=strftime('%Y-%W','now')").get(user.id) as {c:number}).c;
  const upcomingTotal = (db.prepare("SELECT COUNT(*) c FROM appointments WHERE homeowner_id=? AND datetime(start_at)>=datetime('now')").get(user.id) as {c:number}).c;
  const upcomingConfirmed = (db.prepare("SELECT COUNT(*) c FROM appointments WHERE homeowner_id=? AND status='confirmed' AND datetime(start_at)>=datetime('now')").get(user.id) as {c:number}).c;
  const upcomingOpen = upcomingTotal - upcomingConfirmed;
  const upcoming = db.prepare(`SELECT a.id,a.job_id,a.start_at,a.status,j.title,p.business_name FROM appointments a JOIN jobs j ON j.id=a.job_id LEFT JOIN provider_profiles p ON p.user_id=a.provider_id WHERE a.homeowner_id=? AND datetime(a.start_at)>=datetime('now') ORDER BY datetime(a.start_at) ASC,a.id ASC LIMIT 5`).all(user.id) as Appointment[];
  const next = upcoming[0];
  return <WerkbankRahmen role="homeowner" active="/app/calendar">
    <EHPageHeader title="Deine Termine" context={past ? `${totalLabel} · Seite ${page} von ${pages}` : totalLabel} />
    <EHMetricsBar label="Termine" items={[
      {id:'gesamt',label:'Termine gesamt',value:allTotal,hint:'in deiner Akte'},
      {id:'woche',label:'Diese Woche',value:weekTotal,hint:'Kalenderwoche'},
      {id:'bestaetigt',label:'Bestätigt',value:upcomingConfirmed,hint:upcomingOpen > 0 ? `${upcomingOpen} offen` : 'noch anstehend'},
      {id:'naechster',label:'Nächster Termin',value:next ? shortDay(next.start_at) : '–',hint:next ? partnerLabel(next) : 'keiner vereinbart'},
    ]} />
    <EHOwnerFilters label="Zeitraum" items={[{href:'/app/calendar',label:'Anstehend',active:!past},{href:'/app/calendar?view=past',label:'Vergangen',active:past}]} />
    <EHWorkspaceGrid main={rows.length===0 ? (
      <EHEmptyState title={past ? 'Keine vergangenen Termine' : 'Keine anstehenden Termine'} text={past ? 'Vergangene Besuche erscheinen später hier.' : 'Neue Anliegen kannst du beschreiben. Bestehende Absprachen findest du in deinen Aufträgen.'} action={<EHButton href="/app/jobs" variant="secondary">Aufträge ansehen</EHButton>} />
    ) : (
      <>{[...groups].map(([month,items]) => <EHOwnerSection key={month} title={month}><EHRecordList label={month} items={items} /></EHOwnerSection>)}</>
    )} aside={<>
      <EHWorkSection title="Nächster Termin">
        {next ? <>
          <EHText>{ownerDate(next.start_at)}</EHText>
          <EHText muted>{partnerLabel(next)}</EHText>
          <EHStatus tone={appointmentTone(next.status)}>{statusLabel(next.status)}</EHStatus>
          <EHButton href={`/app/jobs/${next.job_id}`} variant="secondary" arrow>{next.title}</EHButton>
        </> : <EHText muted>Kein anstehender Termin. Sobald ein Betrieb einen Termin bestätigt, steht er hier mit Datum und Beteiligtem.</EHText>}
      </EHWorkSection>
      <EHWorkSection title="Weitere anstehende Termine">
        <EHRecordList label="Weitere anstehende Termine" items={upcoming.slice(1,5).map(appointmentEntry)} empty="Noch keine weiteren Termine vereinbart." />
      </EHWorkSection>
      <EHWorkSection title="Hausakte">
        <EHText muted>Frühere Arbeiten, Wartungen und Nachweise zu deinem Zuhause sammelt die Haus-Historie – unabhängig von deinen Terminen.</EHText>
        <EHButton href="/app/home/history" variant="secondary" arrow>Zur Haus-Historie</EHButton>
      </EHWorkSection>
    </>} />
    {past && pages > 1 && <EHOwnerFilters label="Seiten der Terminhistorie" items={[
      ...(page > 1 ? [{href:`/app/calendar?view=past&page=${page-1}`,label:'Neuere Termine',active:false}] : []),
      ...(page < pages ? [{href:`/app/calendar?view=past&page=${page+1}`,label:'Ältere Termine',active:false}] : []),
    ]} />}
  </WerkbankRahmen>;
}
