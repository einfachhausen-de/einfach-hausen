import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { EHEmptyState, EHButton, EHMetricsBar, EHOwnerFilters, EHOwnerSection, EHRecordList, EHStatus, type EHRecordEntry } from '@/design-system';
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

/** Werkbank-Kopf, Kennzahlenzeile und rechte Spalte. Dieselben Token wie /app:
 * Karten, Registerlinie, keine zweite Stilfamilie. Die Kennzahlenleiste der
 * Bibliothek kippt unter 760px auf zwei Spalten; hier wird nur diese eine
 * Rasterzeile der Seite zurueckgeholt. Der Selektor traegt :nth-child(n),
 * damit er die Bibliotheksregel `.metricsBar > div:nth-child(n+3)` eindeutig
 * schlaegt. */
const werkbankLayout = `
.eh-werkbank-rail-h { font-size:var(--eh-font-eyebrow); letter-spacing:var(--eh-track-wide); text-transform:uppercase; color:var(--eh-muted); font-weight:var(--eh-weight-bold); margin:0 0 10px; }
.eh-werkbank-karte { background:var(--eh-color-white); border:1px solid var(--eh-color-line); border-radius:var(--eh-radius-control); padding:13px 14px; margin-bottom:12px; }
.eh-werkbank-karte h4 { margin:0 0 9px; font-size:var(--eh-font-label); display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.eh-werkbank-karte h4 .eh-werkbank-badge { margin-left:auto; }
.eh-werkbank-badge { background:var(--eh-color-terra); color:var(--eh-color-white); border-radius:var(--eh-radius-pill); font-size:var(--eh-font-meta); font-weight:var(--eh-weight-bold); padding:1px 7px; }
.eh-werkbank-item { display:flex; gap:9px; padding:7px 0; border-top:1px solid var(--eh-color-line); font-size:var(--eh-font-meta); align-items:center; }
.eh-werkbank-item:first-of-type { border-top:0; }
.eh-werkbank-item b { display:block; font-weight:var(--eh-weight-semibold); }
.eh-werkbank-item small { color:var(--eh-muted); font-size:var(--eh-font-eyebrow); }
.eh-werkbank-item > :last-child { margin-left:auto; color:var(--eh-muted); text-align:right; }
.eh-werkbank-ic { width:24px; height:24px; display:grid; place-items:center; color:var(--eh-muted); flex:0 0 auto; font-size:var(--eh-font-meta); }
.eh-werkbank-go { display:block; text-align:center; background:var(--eh-color-petrol); color:var(--eh-color-white); border-radius:var(--eh-radius-control); padding:8px; font-weight:var(--eh-weight-semibold); margin-top:10px; text-decoration:none; font-size:var(--eh-font-label); }
.eh-werkbank-bar { height:7px; border-radius:var(--eh-radius-pill); background:var(--eh-color-paper); overflow:hidden; margin:8px 0 6px; }
.eh-werkbank-bar i { display:block; height:100%; background:var(--eh-color-petrol); }
.eh-werkbank-row { display:flex; padding:4px 0; font-size:var(--eh-font-meta); }
.eh-werkbank-row > :last-child { margin-left:auto; color:var(--eh-muted); }
.eh-werkbank-kopf { display:flex; align-items:center; gap:12px; padding-bottom:16px; border-bottom:1px solid var(--eh-rule); }
.eh-werkbank-kopf-copy { flex:1; min-width:0; display:grid; gap:2px; }
.eh-werkbank-kopf-tools { flex:none; display:flex; align-items:center; gap:8px; }
.eh-werkbank-kopf-cta { flex:none; display:inline-flex; align-items:center; gap:8px; background:var(--eh-color-petrol); color:var(--eh-color-white); border-radius:var(--eh-radius-control); padding:10px 18px; font-weight:var(--eh-weight-semibold); text-decoration:none; font-size:var(--eh-font-label); }
.eh-werkbank-kopf-copy h1 { font-size:var(--eh-font-body); font-weight:var(--eh-weight-semibold); line-height:var(--eh-leading-tight); }
.eh-werkbank-kopf-copy span { font-size:var(--eh-font-label); line-height:var(--eh-leading-normal); color:var(--eh-muted); }
.eh-werkbank-kennzahlen > dl { grid-auto-flow:column; grid-template-columns:repeat(3,minmax(0,1fr)); }
.eh-werkbank-kennzahlen > dl > div:nth-child(n) { min-height:76px; padding:12px 14px; border-top:0; }
.eh-werkbank-kennzahlen > dl > div:nth-child(n) + div { border-left:1px solid var(--eh-rule); }
`;

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
  return <WerkbankRahmen role="homeowner" active="/app/calendar" rail={<>
      <p className="eh-werkbank-rail-h">Kontext dieser Seite</p>
      <div className="eh-werkbank-karte">
        <h4>Nächster Termin{next && <span className="eh-werkbank-badge">alsbald</span>}</h4>
        {next ? <>
          <div className="eh-werkbank-item"><span className="eh-werkbank-ic"><CalendarClock size={16} /></span><span><b>{ownerDate(next.start_at)}</b><small>{partnerLabel(next)}</small></span></div>
          <Link href={`/app/jobs/${next.job_id}`} className="eh-werkbank-go">Zum Auftrag →</Link>
        </> : <p className="eh-werkbank-item">Kein anstehender Termin. Sobald ein Betrieb einen Termin bestätigt, steht er hier mit Datum und Beteiligtem.</p>}
      </div>
      <div className="eh-werkbank-karte">
        <h4>Weitere anstehende Termine</h4>
        {upcoming.length > 1 ? upcoming.slice(1,5).map((row) => (
          <div key={row.id} className="eh-werkbank-item"><span><b>{shortDay(row.start_at)} · {row.title}</b><small>{partnerLabel(row)}</small></span></div>
        )) : <p className="eh-werkbank-item">Noch keine weiteren Termine vereinbart.</p>}
      </div>
      <div className="eh-werkbank-karte">
        <h4>Hausakte</h4>
        <p className="eh-werkbank-item">Frühere Arbeiten, Wartungen und Nachweise zu deinem Zuhause sammelt die Haus-Historie – unabhängig von deinen Terminen.</p>
        <Link href="/app/home/history" className="eh-werkbank-go">Zur Haus-Historie →</Link>
      </div>
    </>}>
    <style>{werkbankLayout}</style>
    <header className="eh-werkbank-kopf">
      <div className="eh-werkbank-kopf-copy">
        <h1>Deine Termine</h1>
        <span>{past ? `${totalLabel} · Seite ${page} von ${pages}` : totalLabel}</span>
      </div>
      <div className="eh-werkbank-kopf-tools">
        <Link className="eh-werkbank-kopf-cta" href="/app/hausmeister">+ Anliegen</Link>
      </div>
    </header>
    <div className="eh-werkbank-kennzahlen">
      <EHMetricsBar label="Termine" items={[
        {id:'gesamt',label:'Termine gesamt',value:allTotal,hint:'in deiner Akte'},
        {id:'woche',label:'Diese Woche',value:weekTotal,hint:'Kalenderwoche'},
        {id:'bestaetigt',label:'Bestätigt',value:upcomingConfirmed,hint:upcomingOpen > 0 ? `${upcomingOpen} offen` : 'noch anstehend'},
        {id:'naechster',label:'Nächster Termin',value:next ? shortDay(next.start_at) : '–',hint:next ? partnerLabel(next) : 'keiner vereinbart'},
      ]} />
    </div>
    <EHOwnerFilters label="Zeitraum" items={[{href:'/app/calendar',label:'Anstehend',active:!past},{href:'/app/calendar?view=past',label:'Vergangen',active:past}]} />
    {rows.length===0 ? (
      <EHEmptyState title={past ? 'Keine vergangenen Termine' : 'Keine anstehenden Termine'} text={past ? 'Vergangene Besuche erscheinen später hier.' : 'Neue Anliegen kannst du beschreiben. Bestehende Absprachen findest du in deinen Aufträgen.'} action={<EHButton href="/app/jobs" variant="secondary">Aufträge ansehen</EHButton>} />
    ) : (
      [...groups].map(([month,items]) => <EHOwnerSection key={month} title={month}><EHRecordList label={month} items={items} /></EHOwnerSection>)
    )}
    {past && pages > 1 && <EHOwnerFilters label="Seiten der Terminhistorie" items={[
      ...(page > 1 ? [{href:`/app/calendar?view=past&page=${page-1}`,label:'Neuere Termine',active:false}] : []),
      ...(page < pages ? [{href:`/app/calendar?view=past&page=${page+1}`,label:'Ältere Termine',active:false}] : []),
    ]} />}
  </WerkbankRahmen>;
}
