import { AppShell } from '@/components/shell';
import { HomeownerHausmeisterComposer } from '@/components/homeowner/homeowner-hausmeister-composer';
import { HausmeisterQuotaStatus } from '@/components/homeowner/hausmeister-quota-status';
import { startHausmeisterRouteAction } from '@/app/actions';
import {
  EHActions, EHButton, EHConversation, EHErrorState, EHMetricsBar, EHPageHeader, EHRecordList,
  EHStatus, EHText, EHWorkSection, EHWorkspaceGrid, type EHRecordEntry,
} from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiQuotaSnapshot } from '@/lib/ai-engine';
import { dateLabel } from '@/lib/format';
import { HAUSMEISTER_LIMIT_HINTS } from '@/lib/orchestrator';
import { primaryProperty } from '@/lib/properties';

type Task = { id: number; title: string; category: string; due_date: string };
type Message = { id: number; role: 'user' | 'assistant' | 'event'; body: string; created_at: string };

/** Berliner Kalendertag als ISO-Wert; nur so vergleicht SQLite Fälligkeiten ehrlich. */
const berlinDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });

/** Wer spricht - dieselbe Beschriftung im Verlauf und in der rechten Spalte. */
const speaker = (role: Message['role']) => role === 'user' ? 'Du' : role === 'assistant' ? 'Einfach Hausen · KI' : 'Ablauf';

/** Eine Zeile aus einer Nachricht: der Verlauf bleibt dicht, der Volltext steht im Gespräch. */
function excerpt(body: string, max = 96): string {
  const clean = body.replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean;
}

export default async function Hausmeister({searchParams}:{searchParams:Promise<Record<string,string>>}){
  const user=await requireUser('homeowner'); const sp=await searchParams;
  const thread=db.prepare(`SELECT * FROM assistant_threads WHERE user_id=? AND channel='app' ORDER BY updated_at DESC LIMIT 1`).get(user.id) as any;
  const messages=thread?db.prepare('SELECT * FROM assistant_messages WHERE thread_id=? ORDER BY created_at DESC,id DESC LIMIT 20').all(thread.id).reverse() as Message[]:[];
  const draft=thread?db.prepare('SELECT intent FROM assistant_drafts WHERE thread_id=?').get(thread.id) as {intent:'service'|'contact'}|undefined:undefined;
  const lastAssistant=[...messages].reverse().find(m=>m.role==='assistant');
  let lastMeta:any={}; try{lastMeta=lastAssistant?JSON.parse((lastAssistant as any).metadata_json||'{}'):{};}catch{}
  const showNextChoice=Boolean(lastMeta.assistantOnly&&!draft);
  const starterHints:Record<string,string>={garten:'Was soll draußen oder im Garten gemacht werden?',reparatur:'Was ist kaputt oder muss repariert werden?',pflege:'Was soll gereinigt oder gepflegt werden?',technik:'Wobei brauchst du Hilfe mit Technik oder Installation?'};
  const starterHint=sp.topic?starterHints[sp.topic]:undefined;

  const quota = aiQuotaSnapshot(user.id);
  // Der Verlauf ist auf 20 Nachrichten begrenzt; die Kennzahl zaehlt deshalb
  // nicht die sichtbaren Zeilen, sondern den echten Stand des Gespraechs.
  const messageCount = thread ? (db.prepare('SELECT COUNT(*) c FROM assistant_messages WHERE thread_id=?').get(thread.id) as {c:number}).c : 0;
  const property = primaryProperty(user.id);
  const today = berlinDay.format(new Date());
  const openTasks = (property ? db.prepare(`
    SELECT id,title,category,due_date FROM maintenance_tasks
    WHERE property_id=? AND homeowner_id=? AND status='open'
    ORDER BY date(due_date) ASC LIMIT 5
  `).all(property.id,user.id) : []) as Task[];
  const openTaskCount = property ? (db.prepare(`SELECT COUNT(*) c FROM maintenance_tasks WHERE property_id=? AND homeowner_id=? AND status='open'`).get(property.id,user.id) as {c:number}).c : 0;
  const overdueCount = property ? (db.prepare(`SELECT COUNT(*) c FROM maintenance_tasks WHERE property_id=? AND homeowner_id=? AND status='open' AND date(due_date)<?`).get(property.id,user.id,today) as {c:number}).c : 0;

  const taskItems: EHRecordEntry[] = openTasks.map(task => ({
    id: String(task.id),
    title: task.title,
    detail: [task.category, `fällig ${dateLabel(task.due_date)}`].filter(Boolean).join(' · '),
    status: task.due_date.slice(0,10) < today ? <EHStatus tone="error">Überfällig</EHStatus> : <EHStatus tone="neutral">Offen</EHStatus>,
    href: '/app/year',
  }));
  const activityItems: EHRecordEntry[] = [...messages].reverse().slice(0,3).map(message => ({
    id: String(message.id),
    title: speaker(message.role),
    detail: excerpt(message.body),
    date: String(message.created_at).slice(0,10),
    dateLabel: dateLabel(message.created_at),
  }));
  const conversation = [
    ...(messages.length===0 ? [{id:'welcome',mine:false,author:speaker('assistant'),body:'Beschreib einfach, was los ist. Ich helfe beim Einordnen – danach entscheidest du, ob du nur einen Ansprechpartner möchtest oder einen Auftrag organisieren willst.'}] : []),
    ...messages.map(message => ({id:String(message.id),mine:message.role==='user',author:speaker(message.role),body:message.body})),
  ];

  return <AppShell role="homeowner" active="/app" title="Hausmeister">
    <EHPageHeader title="Hausmeister" context={thread ? `Letzte Nachricht ${dateLabel(thread.updated_at)}` : 'Noch kein Gespräch'} />
    <EHMetricsBar label="Hausmeister" items={[
      {id:'nachrichten',label:'Nachrichten',value:String(messageCount),hint:thread?'im laufenden Gespräch':'noch kein Gespräch begonnen'},
      {id:'aufgaben',label:'Offene Aufgaben',value:String(openTaskCount),hint:overdueCount>0?`${overdueCount} überfällig`:property?'nichts überfällig':'kein Haus hinterlegt'},
      {id:'kontingent',label:'Kontingent frei',value:`${quota.freemiumRemaining} von ${quota.freemiumAllowed}`,hint:quota.byok?'eigener Schlüssel aktiv':'KI-Aktionen pro Monat'},
      {id:'bonus',label:'Bonus-Aktionen',value:String(quota.credits),hint:'zusätzlich verfügbar'},
    ]} />
    <EHWorkspaceGrid main={<>
      {sp.error&&<EHErrorState text={sp.error} />}
      <EHConversation role="owner" name="Einfach Hausen" detail="KI-Hausmeister · antwortet auf Basis deiner Angaben" messages={conversation} composer={<>
        {draft&&<EHText size="meta" muted>{draft.intent==='contact'
          ? 'Ansprechpartner finden: Nur noch eine kurze Info, dann suchen wir den passenden Menschen.'
          : 'Auftrag organisieren: Nur noch eine kurze Info, dann können passende Partner angefragt werden.'}</EHText>}
        {showNextChoice&&<EHWorkSection title="Wie soll es weitergehen?">
          <EHText muted>Keine Aktion passiert automatisch. Du entscheidest, wie der Hausmeister weitermacht.</EHText>
          <EHActions>
            <EHButton href="#hausmeister-composer" variant="secondary">Frage klären</EHButton>
            <form action={startHausmeisterRouteAction.bind(null,'contact')}><EHButton type="submit" variant="secondary">Ansprechpartner finden</EHButton></form>
            <form action={startHausmeisterRouteAction.bind(null,'service')}><EHButton type="submit">Auftrag organisieren</EHButton></form>
          </EHActions>
        </EHWorkSection>}
        <div id="hausmeister-composer"><HomeownerHausmeisterComposer continuingIntent={draft?.intent} starterHint={starterHint} incomingDraft={typeof sp.draft === 'string' ? sp.draft : undefined}/></div>
      </>} />
    </>} aside={<>
      <EHWorkSection title="Offene Aufgaben">
        <EHRecordList label="Offene Aufgaben" items={taskItems} empty={property?'Aktuell nichts fällig. Neue Aufgaben erscheinen hier automatisch.':'Für dein Haus ist noch nichts hinterlegt.'} />
        {openTaskCount>0&&<EHText muted>{openTaskCount} {openTaskCount===1?'Aufgabe':'Aufgaben'} offen{overdueCount>0?` · ${overdueCount} überfällig`:''}.</EHText>}
        <EHButton href="/app/year" variant="secondary" arrow>Alle Aufgaben in Mein Jahr</EHButton>
      </EHWorkSection>
      <EHWorkSection title="Letzte Aktivität">
        {thread ? <>
          <EHStatus tone="info">Gespräch vom {dateLabel(thread.updated_at)}</EHStatus>
          <EHRecordList label="Letzte Nachrichten" items={activityItems} empty="Noch keine Nachricht in diesem Gespräch." />
        </> : <EHText muted>Hier erscheint die letzte Nachricht, sobald du dem Hausmeister etwas beschrieben hast.</EHText>}
        <EHButton href="/app/hausmanager" variant="secondary" arrow>Ältere Gespräche &amp; Automatisierungen</EHButton>
      </EHWorkSection>
      <EHWorkSection title="Hausakte">
        <EHText muted>Frühere Arbeiten, Wartungen und Nachweise zu deinem Zuhause sammelt die Haus-Historie – unabhängig vom Gespräch mit dem Hausmeister.</EHText>
        <EHButton href="/app/home/history" variant="secondary" arrow>Zur Haus-Historie</EHButton>
      </EHWorkSection>
      <EHWorkSection title="KI-Kontingent & Limits">
        <div data-testid="hausmeister-quota" role="status" aria-live="polite">
          <p>KI-Kontingent: {quota.freemiumRemaining} von {quota.freemiumAllowed} frei · {quota.credits} Bonus-Aktionen{quota.byok ? ' · eigener Key aktiv' : ''}.</p>
          <p data-testid="hausmeister-limit-401">{HAUSMEISTER_LIMIT_HINTS.unauthenticated}</p>
          <p data-testid="hausmeister-limit-402">{HAUSMEISTER_LIMIT_HINTS.quotaExhausted}</p>
          <p data-testid="hausmeister-limit-429">{HAUSMEISTER_LIMIT_HINTS.rateLimited}</p>
        </div>
        <HausmeisterQuotaStatus />
      </EHWorkSection>
    </>} />
  </AppShell>;
}
