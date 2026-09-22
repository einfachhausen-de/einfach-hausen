"use client";
import {usePathname} from 'next/navigation';
import {EHAssistant, EHRecommendation, type EHActivityStep, type EHAssistantMessage, type EHAssistantResult, type EHAssistantSource} from '@/design-system';
import {bookQuoteAction} from '@/app/actions';
import type {OfferCard} from '@/lib/offer-cards';

const AUSFALL = 'Eine Antwort ist gerade nicht verfügbar. Bitte versuche es später erneut.';
const IDLE_MS = 30000;

type Ergebnisrahmen = {status?: number; reply?: string; steps?: EHActivityStep[]; cards?: OfferCard[]; sources?: EHAssistantSource[]};

/** Offene Angebote als Karte unter der Antwort; gebucht wird nur per Knopf. */
function kartenknoten(karten?: OfferCard[]) {
  if (!karten?.length) return undefined;
  return <>{karten.map(karte => <EHRecommendation key={karte.jobId} question={karte.question} subject={karte.subject}
    options={karte.options} href={karte.jobHref} onPrimary={bookQuoteAction} />)}</>;
}
/** Ereignisrahmen des Stromes: `data: {...}\n\n`. Unbekanntes wird ueberlesen. */
function rahmenLesen(puffer: string, onStep: (step: EHActivityStep) => void) {
  const teile = puffer.split('\n\n');
  const rest = teile.pop() ?? '';
  let fertig: Ergebnisrahmen | undefined;
  for (const teil of teile) {
    const daten = teil.split('\n').filter(zeile => zeile.startsWith('data:')).map(zeile => zeile.slice(5).trim()).join('');
    if (!daten) continue;
    try {
      const ereignis = JSON.parse(daten) as {type?: string} & Ergebnisrahmen & {step?: EHActivityStep};
      if (ereignis.type === 'step' && ereignis.step) onStep(ereignis.step);
      else if (ereignis.type === 'done') fertig = ereignis;
    } catch { /* unvollstaendige Zeile */ }
  }
  return {rest, fertig};
}

function ergebnis(status: number, data: Ergebnisrahmen): EHAssistantResult {
  const reply = typeof data.reply === 'string' ? data.reply : AUSFALL;
  const steps = data.steps?.length ? {steps: data.steps} : {};
  const cards = kartenknoten(data.cards);
  const sources = data.sources?.length ? {sources: data.sources} : {};
  if (status === 401) return {kind: 'login', reply, ...steps};
  if (status === 402) return {kind: 'quota', reply, ...steps};
  return {kind: status >= 200 && status < 300 ? 'reply' : 'error', reply, ...steps, ...sources, ...(cards ? {cards} : {})};
}

async function send(messages: EHAssistantMessage[], signal: AbortSignal, onStep?: (step: EHActivityStep) => void): Promise<EHAssistantResult> {
  // Wachhund statt fester Frist: solange Ereignisse kommen, darf der Aufruf
  // laufen. Erst 30 Sekunden Stille brechen ab.
  const abbruch = new AbortController();
  let wache = setTimeout(() => abbruch.abort(), IDLE_MS);
  const wachhalten = () => { clearTimeout(wache); wache = setTimeout(() => abbruch.abort(), IDLE_MS); };
  try {
    const response = await fetch(`/api/ki${onStep ? '?stream=1' : ''}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', ...(onStep ? {'Accept': 'text/event-stream'} : {})},
      body: JSON.stringify({messages}),
      signal: AbortSignal.any([signal, abbruch.signal]),
    });
    if (onStep && response.ok && response.body && (response.headers.get('content-type') ?? '').includes('text/event-stream')) {
      const leser = response.body.getReader();
      const decoder = new TextDecoder();
      let puffer = '';
      let fertig: Ergebnisrahmen | undefined;
      for (;;) {
        const {value, done} = await leser.read();
        if (done) break;
        wachhalten();
        puffer += decoder.decode(value, {stream: true});
        const gelesen = rahmenLesen(puffer, onStep);
        puffer = gelesen.rest;
        if (gelesen.fertig) fertig = gelesen.fertig;
      }
      return fertig ? ergebnis(fertig.status ?? 200, fertig) : {kind: 'error', reply: AUSFALL};
    }
    const data = await response.json();
    return ergebnis(response.status, data);
  } finally {
    clearTimeout(wache);
  }
}

export function HouseAssistant({placement = 'floating', open, onOpenChange, compact = false}: {
  placement?: 'floating' | 'toolbar' | 'panel';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Der rechte Bereich ist eingeklappt: nur die Kachel bleibt sichtbar. */
  compact?: boolean;
}) {
  const path = usePathname();
  const isOwner = path === '/app' || path?.startsWith('/app/');
  // Die schwebende Karte gehoert zur Website; im Eigentuemerbereich sitzt der
  // Kundenberater im rechten Bereich der Werkbank und in der Werkzeugleiste.
  if (placement === 'floating' && isOwner) return null;
  if (placement !== 'floating' && !isOwner) return null;
  // Do not compete with authentication, provider work, payments, print or existing chat.
  if (!path || path === '/app/onboarding' || path.startsWith('/app/onboarding/') || /^\/(login|register|auth|onboarding|pro|admin|ki-chat|checkout|pay|transfer|partner-invite|design-system)(\/|$)/.test(path)
      || /^\/(passport|receipt)(\/|$)/.test(path) || /^\/app\/invoices\//.test(path)
      || ['/impressum', '/datenschutz', '/app/hausmeister'].includes(path) || (path === '/app/messages' && placement !== 'toolbar')) return null;
  return <EHAssistant placement={placement} key={path} onSend={send} loginHref="/login" settingsHref="/app/settings"
    aboveNavigation={path === '/app' || path.startsWith('/app/')} open={open} onOpenChange={onOpenChange} compact={compact} />;
}
