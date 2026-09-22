import { WerkbankRahmen } from '@/components/werkbank-rahmen';
import { HomeownerHausmeisterComposer } from '@/components/homeowner/homeowner-hausmeister-composer';
import { HausmeisterQuotaStatus } from '@/components/homeowner/hausmeister-quota-status';
import { startHausmeisterRouteAction } from '@/app/actions';
import {
  EHActions, EHButton, EHConversation, EHErrorState, EHMetricsBar, EHPageHeader, EHRecordList,
  EHStatus, EHText, EHWorkSection, EHWorkspaceGrid, EHWorkflowStack, type EHRecordEntry,
} from '@/design-system';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiQuotaSnapshot } from '@/lib/ai-engine';
import { dateLabel } from '@/lib/format';
import { primaryProperty } from '@/lib/properties';

type Task = { id: number; title: string; category: string; due_date: string };
type Message = { id: number; role: 'user' | 'assistant' | 'event'; body: string; created_at: string };

/** Berliner Kalendertag als ISO-Wert; nur so vergleicht SQLite Fälligkeiten ehrlich. */
const berlinDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });

/** Wer spricht - dieselbe Beschriftung im Verlauf. */
const speaker = (role: Message['role']) => role === 'user' ? 'Du' : role === 'assistant' ? 'Einfach Hausen' : 'Ablauf';

export default async function Hausmeister({searchParams}:{searchParams:Promise<Record<string,string>>}){
  const user=await requireUser('homeowner'); const sp=await searchParams;
  const thread=db.prepare(`SELECT * FROM assistant_threads WHERE user_id=? AND channel='app' ORDER BY updated_at DESC LIMIT 1`).get(user.id) as any;
  const messages=thread?db.prepare('SELECT * FROM assistant_messages WHERE thread_id=? ORDER BY created_at DESC,id DESC LIMIT 20').all(thread.id).reverse() as Message[]:[];
  const draft=thread?db.prepare('SELECT intent FROM assistant_drafts WHERE thread_id=?').get(thread.id) as {intent:'service'|'contact'}|undefined:undefined;
  const lastAssistant=[...messages].reverse().find(m=>m.role==='assistant');
  let lastMeta:any={}; try{lastMeta=lastAssistant?JSON.parse((lastAssistant as any).metadata_json||'{}'):{};}catch{}
  const showNextChoice=Boolean(lastMeta.assistantOnly&&!draft);
  const starterHints:Record<string,string>={garten:'Was soll draußen oder im Garten gemacht werden?',reparatur:'Was ist kaputt oder muss repariert werden?',pflege:'Was soll gereinigt oder gepflegt werden?',technik:'Wobei brauchst du Hilfe mit Technik oder Installation?',
    'haus-technik':'Was klemmt, wackelt oder muss montiert werden?',
    'elektro-smart-home':'Was macht bei Strom, Wallbox oder Smart Home Probleme?',
    heizung:'Geht es um Wartung, Störung oder Optimierung von Heizung oder Klima?',
    'sanitaer-wasser':'Wo tropft, klemmt oder läuft etwas mit Wasser nicht rund?',
    'dach-fenster-tueren':'Was ist an Dach, Fenstern oder Türen auffällig?',
    'innenausbau-sanierung':'Welche Räume sollen renoviert oder umgebaut werden?',
    'garten-aussenbereich':'Was soll draußen oder im Garten gemacht werden?',
    'reinigung-pflege':'Was soll gereinigt oder gepflegt werden?',
    'saisonale-dienste':'Welcher saisonale Einsatz steht an?',
    spezialfaelle:'Was passt in kein Gewerk oder braucht besondere Fachkunde?',
    'umzug-entruempelung':'Was soll geräumt, transportiert oder umgezogen werden?',
    'beratung-notfall':'Brauchst du zuerst nur eine Einschätzung oder ist es dringend?'};
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
  const conversation = [
    ...(messages.length===0 ? [{id:'welcome',mine:false,author:speaker('assistant'),body:'Beschreib einfach, was los ist. Ich helfe beim Einordnen – danach entscheidest du, ob du nur einen Ansprechpartner möchtest oder einen Auftrag organisieren willst.'}] : []),
    ...messages.map(message => ({id:String(message.id),mine:message.role==='user',author:speaker(message.role),body:message.body})),
  ];

  return <WerkbankRahmen role="homeowner" active="/app">
    <EHWorkflowStack>
    <EHPageHeader title="Hausmeister" context={thread ? `Letzte Nachricht ${dateLabel(thread.updated_at)}` : 'Noch kein Gespräch'} />
    <EHMetricsBar label="Hausmeister" items={[
      {id:'nachrichten',label:'Nachrichten',value:String(messageCount),hint:thread?'im laufenden Gespräch':'noch kein Gespräch begonnen'},
      {id:'aufgaben',label:'Offene Aufgaben',value:String(openTaskCount),hint:overdueCount>0?`${overdueCount} überfällig`:property?'nichts überfällig':'kein Haus hinterlegt'},
    ]} />
    <EHWorkspaceGrid main={<>
      {sp.error&&<EHErrorState text={sp.error} />}
      <EHConversation role="owner" name="Einfach Hausen" detail="Dein Hausmeister · antwortet auf Basis deiner Angaben" messages={conversation} composer={<>
        {draft&&<EHText size="meta" muted>{draft.intent==='contact'
          ? 'Ansprechpartner finden: Nur noch eine kurze Info, dann suchen wir den passenden Menschen.'
          : 'Auftrag organisieren: Nur noch eine kurze Info, dann können passende Partner angefragt werden.'}</EHText>}
        {showNextChoice&&<EHWorkSection title="Wie soll es weitergehen?">
          <EHText muted>Nichts passiert automatisch. Du entscheidest.</EHText>
          <EHActions>
            <form action={startHausmeisterRouteAction.bind(null,'contact')}><EHButton type="submit" variant="secondary">Ansprechpartner finden</EHButton></form>
            <form action={startHausmeisterRouteAction.bind(null,'service')}><EHButton type="submit">Auftrag organisieren</EHButton></form>
          </EHActions>
        </EHWorkSection>}
        <div id="hausmeister-composer"><HomeownerHausmeisterComposer continuingIntent={draft?.intent} starterHint={starterHint} incomingDraft={typeof sp.draft === 'string' ? sp.draft : undefined}/></div>
      </>} />
      <p data-testid="hausmeister-quota" role="status" className="eh-werkbank-item">Noch {quota.freemiumRemaining} {quota.freemiumRemaining === 1 ? 'Frage' : 'Fragen'} frei diesen Monat.</p>
    </>} aside={<>
      <EHWorkSection title="Offene Aufgaben">
        <EHRecordList label="Offene Aufgaben" items={taskItems} empty={property?'Aktuell nichts fällig. Neue Aufgaben erscheinen hier automatisch.':'Für dein Haus ist noch nichts hinterlegt.'} />
        <EHButton href="/app/year" variant="secondary" arrow>Alle Aufgaben in Mein Jahr</EHButton>
      </EHWorkSection>
      <EHWorkSection title="Mehr">
        <EHText muted>Ältere Gespräche und Erinnerungen findest du beim Hausmanager.</EHText>
        <EHButton href="/app/hausmanager" variant="secondary" arrow>Zum Hausmanager</EHButton>
      </EHWorkSection>
      <HausmeisterQuotaStatus />
    </>} />
    </EHWorkflowStack>
  </WerkbankRahmen>;
}
