import { ChevronRight,ClipboardCheck,HelpCircle,MessageCircle,Sparkles } from 'lucide-react';
import { AppShell } from '@/components/shell';
import { HomeownerHausmeisterComposer } from '@/components/homeowner/homeowner-hausmeister-composer';
import { startHausmeisterRouteAction } from '@/app/actions';
import { requireUser } from '@/lib/auth';
import { EHPageHeader, EHPanel, EHErrorState } from '@/design-system';
import { db } from '@/lib/db';
import { aiQuotaSnapshot } from '@/lib/ai-engine';
import { HAUSMEISTER_LIMIT_HINTS } from '@/lib/orchestrator';
import { HausmeisterQuotaStatus } from '@/components/homeowner/hausmeister-quota-status';

export default async function Hausmeister({searchParams}:{searchParams:Promise<Record<string,string>>}){
  const user=await requireUser('homeowner'); const sp=await searchParams;
  const thread=db.prepare(`SELECT * FROM assistant_threads WHERE user_id=? AND channel='app' ORDER BY updated_at DESC LIMIT 1`).get(user.id) as any;
  const messages=thread?db.prepare('SELECT * FROM assistant_messages WHERE thread_id=? ORDER BY created_at DESC,id DESC LIMIT 20').all(thread.id).reverse() as any[]:[];
  const draft=thread?db.prepare('SELECT intent FROM assistant_drafts WHERE thread_id=?').get(thread.id) as {intent:'service'|'contact'}|undefined:undefined;
  const lastAssistant=[...messages].reverse().find(m=>m.role==='assistant');
  let lastMeta:any={}; try{lastMeta=lastAssistant?JSON.parse(lastAssistant.metadata_json||'{}'):{};}catch{}
  const showNextChoice=Boolean(lastMeta.assistantOnly&&!draft);
  const starterHints:Record<string,string>={garten:'Was soll draußen oder im Garten gemacht werden?',reparatur:'Was ist kaputt oder muss repariert werden?',pflege:'Was soll gereinigt oder gepflegt werden?',technik:'Wobei brauchst du Hilfe mit Technik oder Installation?'};
  const starterHint=sp.topic?starterHints[sp.topic]:undefined;

  const quota = aiQuotaSnapshot(user.id);
  return <AppShell role="homeowner" active="/app" title="Hausmeister">
    <div className="housemaster-panel">
      <EHPageHeader title="Hausmeister" context="Bereit" />
      <p><a href="/app/hausmanager">Zum KI-Hausmanager: alte Gespräche, Aufgaben & Automatisierungen →</a></p>{sp.error&&<EHErrorState text={sp.error} />}
      <EHPanel title="KI-Kontingent & Limits">
        <div data-testid="hausmeister-quota" role="status" aria-live="polite">
          <p>KI-Kontingent: {quota.freemiumRemaining} von {quota.freemiumAllowed} frei · {quota.credits} Bonus-Aktionen{quota.byok ? ' · eigener Key aktiv' : ''}.</p>
          <p data-testid="hausmeister-limit-401">{HAUSMEISTER_LIMIT_HINTS.unauthenticated}</p>
          <p data-testid="hausmeister-limit-402">{HAUSMEISTER_LIMIT_HINTS.quotaExhausted}</p>
          <p data-testid="hausmeister-limit-429">{HAUSMEISTER_LIMIT_HINTS.rateLimited}</p>
        </div>
        <HausmeisterQuotaStatus />
      </EHPanel>
      <div className="agent-chat housemaster-chat">
        {messages.map(m=><div className={`agent-message ${m.role}`} key={m.id}><div className="message-head">{m.role==='user'?'Du':<><Sparkles size={14}/> Einfach Hausen</>}</div><p>{m.body}</p></div>)}
        {showNextChoice&&<EHPanel title="Wie soll es weitergehen?"><div role="region" aria-live="polite" aria-label="Wie soll der Hausmeister weitermachen?">
          <div className="resolution-copy"><strong>Wie soll es weitergehen?</strong><span>Keine Aktion passiert automatisch.</span></div>
          <div className="resolution-actions owner-resolution-actions">
            <a href="#hausmeister-composer" className="resolution-button question-choice"><HelpCircle/><span><strong>Frage klären</strong><small>Im Gespräch bleiben und erst einmal nichts beauftragen.</small></span><ChevronRight/></a>
            <form action={startHausmeisterRouteAction.bind(null,'contact')}><button className="resolution-button" type="submit"><MessageCircle/><span><strong>Ansprechpartner finden</strong><small>Mit einem passenden geprüften Menschen sprechen, ohne Auftrag.</small></span><ChevronRight/></button></form>
            <form action={startHausmeisterRouteAction.bind(null,'service')}><button className="resolution-button primary-choice" type="submit"><ClipboardCheck/><span><strong>Auftrag organisieren</strong><small>Erst jetzt Angebote, Termin und Ausführung organisieren.</small></span><ChevronRight/></button></form>
          </div>
        </div></EHPanel>}
        {draft&&<div className="route-progress" role="status" aria-live="polite"><span>{draft.intent==='contact'?<MessageCircle/>:<ClipboardCheck/>}</span><div><strong>{draft.intent==='contact'?'Ansprechpartner finden':'Auftrag organisieren'}</strong><small>{draft.intent==='contact'?'Nur noch eine kurze Info, dann suchen wir den passenden Menschen.':'Nur noch eine kurze Info, dann können passende Partner angefragt werden.'}</small></div></div>}
        <div id="hausmeister-composer" className="owner-housemaster-composer"><HomeownerHausmeisterComposer continuingIntent={draft?.intent} starterHint={starterHint} incomingDraft={typeof sp.draft === 'string' ? sp.draft : undefined}/></div>
      </div>
    </div>
  </AppShell>;
}
