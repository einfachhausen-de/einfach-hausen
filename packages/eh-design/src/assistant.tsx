"use client";
import {useEffect, useId, useRef, useState, type FormEvent, type ReactNode} from 'react';
import {ChevronsUpDown, Sparkles} from 'lucide-react';
import {EHButton, EHText} from './primitives';
import {EHField, EHTextarea} from './app';
import s from './styles.module.css';

export type EHAssistantMessage = {role: 'user' | 'assistant'; content: string};
export type EHAssistantResult = {reply: string; kind: 'reply' | 'login' | 'quota' | 'error'};

/**
 * User-opened customer assistant; data access and account policy belong to the
 * consumer.
 *
 * `placement` legt den Ort fest:
 * - `floating` schwebt als Karte ueber der Website,
 * - `toolbar` sitzt als Knopf in einer Werkzeugleiste,
 * - `panel` sitzt im Fluss eines rechten Bereiches. Dort schwebt nichts: der
 *   Knopf sitzt am unteren Rand des Bereiches wie das Kontomenue der
 *   Seitenleiste, und die Chatkarte oeffnet darueber im selben Bereich. Der
 *   Aufrufer haelt Breite und Zustand (`open`/`onOpenChange`) und kann den
 *   mittleren Bereich mitschrumpfen lassen.
 */
export function EHAssistant({onSend, loginHref, settingsHref, aboveNavigation = false, placement = 'floating', open, onOpenChange}: {
  onSend: (messages: EHAssistantMessage[], signal: AbortSignal) => Promise<EHAssistantResult>;
  loginHref: string; settingsHref: string; aboveNavigation?: boolean; placement?: 'floating' | 'toolbar' | 'panel';
  open?: boolean; onOpenChange?: (open: boolean) => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const [messages, setMessages] = useState<EHAssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<EHAssistantResult | null>(null);
  const [offenIntern, setOffenIntern] = useState(false);
  const istPanel = placement === 'panel';
  const offen = open ?? offenIntern;

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [messages, busy, notice]);
  // Der Bereich ist kein Dialog: Escape schliesst ihn, wie es die Karte selbst
  // auch kann.
  useEffect(() => {
    if (!istPanel) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && offen) { event.preventDefault(); setOffenIntern(false); onOpenChange?.(false); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [istPanel, offen, onOpenChange]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || request.current) return;
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setNotice(null);
    const next: EHAssistantMessage[] = [...messages, {role: 'user', content: text}];
    try {
      const result = await onSend(next.slice(-12), controller.signal);
      if (controller.signal.aborted) return;
      if (result.kind === 'reply') { setMessages([...next, {role: 'assistant', content: result.reply}]); setInput(''); }
      else setNotice(result);
    } catch {
      if (!controller.signal.aborted) setNotice({kind: 'error', reply: 'Die Verbindung ist gerade unterbrochen. Deine Frage bleibt im Eingabefeld. Du kannst es erneut versuchen.'});
    } finally {
      if (request.current === controller) { request.current = null; setBusy(false); }
    }
  }

  const kopf = (schliessen: ReactNode) => (
    <header className={s.assistantHeader}>
      <img src="/brand/logo-full.png" alt="einfachhausen" width={72} height={46} />
      <div><h2 id={id+'-title'}>Dein Hausmanager</h2><span>Kennt dein Zuhause</span></div>
      {schliessen}
    </header>
  );

  const verlauf = (
    <div ref={log} className={s.assistantMessages} role="log" aria-label="Chatverlauf" aria-live="polite" aria-relevant="additions text">
      <div className={s.assistantWelcome}>
        <h3>Was beschäftigt dich an deinem Haus?</h3>
        <EHText>Beschreibe dein Anliegen. Ich helfe dir, Fragen zu klären und den nächsten Schritt zu finden.</EHText>
        <EHText size="meta" muted>Du sprichst mit einer KI. Antworten können Fehler enthalten. Ein Chat beauftragt keinen Betrieb.</EHText>
      </div>
      {messages.map((message, index) => <div key={index} className={s.assistantMessage} data-role={message.role}>
        <strong>{message.role === 'user' ? 'Du' : 'Hausmanager · KI'}</strong><p>{message.content}</p>
      </div>)}
      {busy && <p role="status">Deine Antwort wird vorbereitet …</p>}
      {notice && <div className={s.assistantNotice} role="status">
        <p>{notice.reply}</p>
        {notice.kind === 'login' && <EHButton href={loginHref}>Zum Hauskonto anmelden</EHButton>}
        {notice.kind === 'quota' && <EHButton href={settingsHref} variant="secondary">KI-Kontingent ansehen</EHButton>}
      </div>}
    </div>
  );

  const eingabe = (
    <form className={s.assistantComposer} onSubmit={send}>
      <EHField id={id+'-question'} label="Deine Frage" hint="Bitte keine Passwörter oder Zahlungsdaten eingeben.">
        <EHTextarea id={id+'-question'} value={input} onChange={event => setInput(event.target.value)}
          rows={3} maxLength={4000} required disabled={busy} aria-describedby={id+'-question-hint'} placeholder="Zum Beispiel: Meine Heizung macht ungewöhnliche Geräusche." />
      </EHField>
      <div className={s.assistantActions}>
        <a href="/kontakt">Persönlicher Kontakt</a>
        <EHButton type="submit" disabled={busy || !input.trim()} aria-busy={busy} arrow>{busy ? 'Wird gesendet …' : 'Frage senden'}</EHButton>
      </div>
    </form>
  );

  return <div className={s.scope} data-eh-app>
    {istPanel && offen && <section id={id} className={s.assistantPanel} aria-labelledby={id+'-title'}>
      {kopf(<EHButton variant="quiet" aria-label="Chat schließen" onClick={() => { setOffenIntern(false); onOpenChange?.(false); }}>×</EHButton>)}
      {verlauf}
      {eingabe}
    </section>}

    <button ref={launcher} type="button" className={s.assistantLauncher} data-placement={placement} data-above-nav={aboveNavigation || undefined}
      aria-label={istPanel ? (offen ? 'Kundenberater schließen' : 'Kundenberater öffnen') : 'Hausassistent öffnen'}
      aria-haspopup={istPanel ? undefined : 'dialog'} aria-expanded={istPanel ? offen : undefined} aria-controls={id}
      data-offen={istPanel && offen ? true : undefined}
      onClick={() => {
        if (istPanel) { setOffenIntern(!offen); onOpenChange?.(!offen); return; }
        dialog.current?.showModal();
      }}>
      {istPanel
        ? <><span className={s.assistantLauncherAvatar} aria-hidden="true"><Sparkles size={18} /></span>
            <span className={s.assistantLauncherCopy}>
              <strong>Hausmanager</strong>
              <small>KI-Hilfe</small>
            </span>
            <ChevronsUpDown className={s.assistantLauncherChevron} size={16} aria-hidden="true" /></>
        : <><img src="/brand/logo-full.png" alt="" width={64} height={42} />
            <span><strong>{placement === 'toolbar' ? 'Hausmanager' : 'Frag deinen Hausmanager'}</strong>{placement !== 'toolbar' && <small>KI-Hilfe rund um dein Zuhause</small>}</span></>}
    </button>

    {/* Schwebend und Werkzeugleiste bleiben ein modaler Dialog - wie auf der
        Website vorgesehen; der Bereich braucht keinen. */}
    {!istPanel && <dialog ref={dialog} id={id} className={s.assistantDialog} aria-labelledby={id+'-title'}
      onClose={() => launcher.current?.focus()}>
      {kopf(<EHButton variant="quiet" aria-label="Chat schließen" onClick={() => dialog.current?.close()}>×</EHButton>)}
      {verlauf}
      {eingabe}
    </dialog>}
  </div>;
}
