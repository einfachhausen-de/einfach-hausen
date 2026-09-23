"use client";
import {Fragment, useEffect, useId, useRef, useState, type FormEvent, type ReactNode} from 'react';
import {ArrowUp, BookOpen, Check, ChevronsUpDown, Clock, Copy, ExternalLink, Globe, History, Lightbulb, Mic, Palette, Pencil, Plus, Search, SlidersHorizontal, Sparkles, Telescope, ThumbsDown, ThumbsUp, X} from 'lucide-react';
import {motion, AnimatePresence} from 'motion/react';
import {EHActivity, type EHActivityStep} from './blocks';
import {EHButton, EHText} from './primitives';
import s from './styles.module.css';

export type EHAssistantMessage = {role: 'user' | 'assistant'; content: string};
export type EHSource = {title: string; href: string; domain?: string};
export type EHAssistantSource = EHSource;
export type EHAssistantResult = {reply: string; kind: 'reply' | 'login' | 'quota' | 'error'; steps?: EHActivityStep[]; cards?: ReactNode; sources?: EHSource[]};

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
export function EHAssistant({onSend, loginHref, settingsHref, aboveNavigation = false, placement = 'floating', open, onOpenChange, compact = false}: {
  /** `onStep` meldet die Schritte des Aufrufs, wenn der Aufrufer sie zeigen will. */
  onSend: (messages: EHAssistantMessage[], signal: AbortSignal, onStep?: (step: EHActivityStep) => void) => Promise<EHAssistantResult>;
  loginHref: string; settingsHref: string; aboveNavigation?: boolean; placement?: 'floating' | 'toolbar' | 'panel';
  open?: boolean; onOpenChange?: (open: boolean) => void;
  /** Schmaler Bereich: der Knopf zeigt nur die Kachel, die Beschriftung entfaellt. */
  compact?: boolean;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const letzteFrage = useRef<{text: string; verlauf: EHAssistantMessage[]} | null>(null);
  const [messages, setMessages] = useState<EHAssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<EHAssistantResult | null>(null);
  const [steps, setSteps] = useState<EHActivityStep[]>([]);
  const [karten, setKarten] = useState<Record<number, ReactNode>>({});
  const [quellen, setQuellen] = useState<Record<number, EHSource[]>>({});
  const [copied, setCopied] = useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down'>>({});
  const kartenRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [offenIntern, setOffenIntern] = useState(false);
  const istPanel = placement === 'panel';
  const offen = open ?? offenIntern;
  const tools = [
    {id: 'image', label: 'Bild erstellen', icon: Palette, short: 'Bild'},
    {id: 'web', label: 'Web durchsuchen', icon: Globe, short: 'Web'},
    {id: 'code', label: 'Code schreiben', icon: Pencil, short: 'Code'},
    {id: 'deep', label: 'Tief recherchieren', icon: Telescope, short: 'Research', extra: '5 übrig'},
    {id: 'think', label: 'Länger nachdenken', icon: Lightbulb, short: 'Denken'},
  ] as const;
  const activeTool = selectedTool ? tools.find(t => t.id === selectedTool) : null;
  useEffect(() => {
    const el = composerRef.current; if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    const bereich = log.current; if (!bereich) return;
    const letzte = busy ? null : kartenRefs.current[messages.length - 1];
    if (letzte) {
      const kasten = bereich.getBoundingClientRect(); const ziel = letzte.getBoundingClientRect();
      bereich.scrollTop += ziel.top - kasten.top - 8;
      return;
    }
    bereich.scrollTop = bereich.scrollHeight;
  }, [messages, busy, notice, steps]);
  useEffect(() => {
    if (!istPanel) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && offen) { event.preventDefault(); setOffenIntern(false); onOpenChange?.(false); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [istPanel, offen, onOpenChange]);
  function schrittMerken(step: EHActivityStep) {
    setSteps(bisher => {
      const stelle = bisher.findIndex(vorhanden => vorhanden.key === step.key);
      return stelle < 0 ? [...bisher, step] : bisher.map((vorhanden, i) => i === stelle ? step : vorhanden);
    });
  }
  async function sende(text: string, verlauf: EHAssistantMessage[]) {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    const next: EHAssistantMessage[] = [...verlauf, {role: 'user', content: text}];
    letzteFrage.current = {text, verlauf};
    setBusy(true); setNotice(null); setSteps([]);
    try {
      const result = await onSend(next.slice(-12), controller.signal, istPanel ? schrittMerken : undefined);
      if (controller.signal.aborted) return;
      if (istPanel && result.steps?.length) setSteps(result.steps);
      if (result.kind === 'reply') {
        if (istPanel && result.cards) setKarten(bisher => ({...bisher, [next.length]: result.cards}));
        if (istPanel && result.sources?.length) setQuellen(bisher => ({...bisher, [next.length]: result.sources!}));
        setMessages([...next, {role: 'assistant', content: result.reply}]); setInput(''); setImagePreview(null);
      }
      else setNotice(result);
    } catch {
      if (!controller.signal.aborted) setNotice({kind: 'error', reply: 'Die Verbindung ist gerade unterbrochen. Deine Frage bleibt im Eingabefeld. Du kannst es erneut versuchen.'});
    } finally {
      if (request.current === controller) { request.current = null; setBusy(false); }
    }
  }
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (text) void sende(text, messages);
  }
  function wiederholen() {
    const letzte = letzteFrage.current;
    if (letzte && !request.current) void sende(letzte.text, letzte.verlauf);
  }
  const schritte = steps.map((step, i) => (!busy && step.state === 'failed' && i === steps.length - 1)
    ? {...step, retry: {label: 'Erneut versuchen', onClick: wiederholen}}
    : step);
  function copy(index: number, text: string) {
    try { navigator.clipboard.writeText(text); setCopied(b => ({...b, [index]: true})); setTimeout(() => setCopied(b => ({...b, [index]: false})), 1800); } catch {}
  }
  const nachricht = (message: EHAssistantMessage, index: number) => {
    const istNutzer = message.role === 'user';
    const q = quellen[index];
    const fb = feedback[index];
    const isCopied = copied[index];
    const blase = <div className={s.assistantMessage} data-role={message.role}>
      <span className={s.assistantMessageMeta}>
        {istNutzer ? <span className={s.assistantRoleUser}>Du</span> : <span className={s.assistantRoleAi}><Sparkles size={12} aria-hidden="true" /> Hausmanager · KI</span>}
        {!istNutzer && <span className={s.assistantMetaTime}><Clock size={12} aria-hidden="true" /> gerade eben</span>}
      </span>
      <p>{message.content}</p>
      {!istNutzer && (q?.length || true) && (
        <div className={s.assistantMessageActions}>
          <button type="button" className={s.assistantActionBtn} onClick={() => copy(index, message.content)} aria-label="Antwort kopieren">
            {isCopied ? <Check size={14} /> : <Copy size={14} />}{isCopied ? 'Kopiert' : 'Kopieren'}
          </button>
          {!istNutzer && (
            <>
              <button type="button" className={s.assistantActionBtn} data-active={fb === 'up' ? 'true' : undefined} onClick={() => setFeedback(b => ({...b, [index]: b[index] === 'up' ? undefined as unknown as 'up' : 'up'}))} aria-label="Hilfreich">
                <ThumbsUp size={14} aria-hidden="true" />
              </button>
              <button type="button" className={s.assistantActionBtn} data-active={fb === 'down' ? 'true' : undefined} onClick={() => setFeedback(b => ({...b, [index]: b[index] === 'down' ? undefined as unknown as 'down' : 'down'}))} aria-label="Nicht hilfreich">
                <ThumbsDown size={14} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}
      {!istNutzer && q?.length ? (
        <details className={s.assistantSources} open>
          <summary className={s.assistantSourcesHead}><BookOpen size={14} aria-hidden="true" /> Quellen · {q.length} <span className={s.assistantSourcesHint}>– geprüft aus deinen Daten</span></summary>
          <ul className={s.assistantSourceList}>
            {q.map((src, i) => (
              <li key={i}><a className={s.assistantSourceItem} href={src.href} target={src.href.startsWith('/') ? undefined : '_blank'} rel={src.href.startsWith('/') ? undefined : 'noreferrer'}>
                <span className={s.assistantSourceIcon} aria-hidden="true"><BookOpen size={14} /></span>
                <span className={s.assistantSourceMeta}><strong>{src.title}</strong><span>{src.domain ?? src.href.replace(/^https?:\/\//, '').split('/')[0]}</span></span>
                <ExternalLink size={14} aria-hidden="true" />
              </a></li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>;
    const anhang = karten[index];
    return anhang
      ? <div key={index} className={s.assistantTurn} ref={el => { kartenRefs.current[index] = el; }}>{blase}<div className={s.assistantAttachment}>{anhang}</div></div>
      : <Fragment key={index}>{blase}</Fragment>;
  };
  const kopf = (schliessen: ReactNode) => (
    <header className={s.assistantHeader}>
      <span className={s.assistantHeaderIcon} aria-hidden="true"><Sparkles size={16} /></span>
      <div><h2 id={id+'-title'}>Dein Hausmanager</h2><span>Kennt dein Zuhause · KI-Hilfe</span></div>
      {schliessen}
    </header>
  );
  const verlauf = (
    <div ref={log} className={s.assistantMessages} role="log" aria-label="Chatverlauf" aria-live="polite" aria-relevant="additions text">
      {messages.length === 0 ? (
        <div className={s.assistantWelcome}>
          <h3>Wie kann ich dir helfen?</h3>
          <EHText>Beschreibe dein Anliegen – ich helfe dir, Fragen zu klären und den nächsten Schritt zu finden.</EHText>
          <EHText size="meta" muted>KI kann Fehler machen. Verbindlich wird nur, was du in einer Karte bestätigst.</EHText>
        </div>
      ) : null}
      {messages.length > 0 && (
        <div className={s.assistantVerlaufHead} aria-hidden="true"><History size={14} /> Verlauf · {messages.length} Nachrichten</div>
      )}
      <AnimatePresence initial={false}>
        {messages.map((m, i) => (
          <motion.div key={i} initial={{opacity: 0, y: 6}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} transition={{duration: 0.22, ease: [0.16,1,0.3,1]}}>
            {nachricht(m, i)}
          </motion.div>
        ))}
      </AnimatePresence>
      {busy && (!istPanel || !steps.length) && <p role="status" className={s.assistantBusy}><span className={s.assistantBusyDot} aria-hidden="true" /> Deine Antwort wird vorbereitet …</p>}
      {istPanel && <EHActivity steps={schritte} title="Was die KI macht" label="Ablauf der Antwort" />}
      {notice && <div className={s.assistantNotice} role="status">
        <p>{notice.reply}</p>
        {notice.kind === 'login' && <EHButton href={loginHref}>Zum Hauskonto anmelden</EHButton>}
        {notice.kind === 'quota' && <EHButton href={settingsHref} variant="secondary">KI-Kontingent ansehen</EHButton>}
      </div>}
    </div>
  );
  const hasValue = input.trim().length > 0 || imagePreview;
  const handlePlus = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith('image/')) {
      const r = new FileReader();
      r.onloadend = () => setImagePreview(r.result as string);
      r.readAsDataURL(f);
    }
    e.target.value = '';
  };
  const eingabe = (
    <form className={s.assistantComposer} onSubmit={send}>
      <div className={s.assistantPromptBox}>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden aria-hidden="true" tabIndex={-1} />
        {imagePreview && (
          <div className={s.assistantPromptPreview}>
            <span className={s.assistantPromptPreviewItem}>
              <img src={imagePreview} alt="Anhang Vorschau" />
              <button type="button" className={s.assistantPromptPreviewRemove} aria-label="Anhang entfernen" onClick={() => setImagePreview(null)}><X size={12} /></button>
            </span>
          </div>
        )}
        <textarea
          ref={composerRef}
          id={id+'-question'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const t = input.trim(); if (t) void sende(t, messages); } }}
          rows={1}
          maxLength={4000}
          required
          disabled={busy}
          aria-label="Nachricht"
          placeholder="Nachricht…"
          className={s.assistantPromptInput}
        />
        <div className={s.assistantPromptBar}>
          <div className={s.assistantPromptLeft} style={{position:'relative'}}>
            <button type="button" onClick={handlePlus} className={s.assistantPromptIconBtn} aria-label="Bild anhängen"><Plus size={18} /></button>
            <div style={{position:'relative'}}>
              <button type="button" onClick={() => setToolsOpen(o => !o)} className={s.assistantPromptToolsBtn} aria-expanded={toolsOpen} aria-haspopup="menu"><SlidersHorizontal size={16} /> Tools</button>
              {toolsOpen && (
                <div className={s.assistantPromptToolsMenu} role="menu">
                  {tools.map(t => (
                    <button key={t.id} type="button" role="menuitem" onClick={() => { setSelectedTool(t.id); setToolsOpen(false); }}>
                      <t.icon size={16} /> <span>{t.label}</span> {('extra' in t && t.extra) ? <small>{(t as any).extra}</small> : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {activeTool && (
              <>
                <span aria-hidden="true" style={{width:1, height:16, background:'var(--eh-color-line)'}} />
                <button type="button" onClick={() => setSelectedTool(null)} className={s.assistantPromptToolsBtn} data-active="true">
                  <activeTool.icon size={16} /> {activeTool.short} <X size={14} />
                </button>
              </>
            )}
          </div>
          <div className={s.assistantPromptRight}>
            <button type="button" className={s.assistantPromptIconBtn} aria-label="Spracheingabe"><Mic size={18} /></button>
            <button type="submit" disabled={busy || !hasValue} className={s.assistantPromptSend} aria-label="Nachricht senden"><ArrowUp size={18} /></button>
          </div>
        </div>
      </div>
      <p className={s.assistantPromptHint}>KI kann Fehler machen. Bitte keine sensiblen Daten eingeben. <a href="/kontakt" style={{textDecoration:'underline', textUnderlineOffset:3}}>Persönlicher Kontakt</a></p>
    </form>
  );
  return <div className={s.scope} data-eh-app data-has-panel={istPanel && offen ? true : undefined}>
    {istPanel && offen && <section id={id} className={s.assistantPanel} data-assistant-panel aria-labelledby={id+'-title'}>
      {kopf(<button type="button" className={s.assistantClose} aria-label="Chat schließen" onClick={() => { setOffenIntern(false); onOpenChange?.(false); }}><X size={16} aria-hidden="true" /></button>)}
      {verlauf}
      {eingabe}
    </section>}

    {!(istPanel && offen) && <button ref={launcher} type="button" className={s.assistantLauncher} data-placement={placement} data-kompakt={compact || undefined} data-above-nav={aboveNavigation || undefined}
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
    </button>}

    {!istPanel && <dialog ref={dialog} id={id} className={s.assistantDialog} aria-labelledby={id+'-title'}
      onClose={() => launcher.current?.focus()}>
      {kopf(<button type="button" className={s.assistantClose} aria-label="Chat schließen" onClick={() => dialog.current?.close()}><X size={16} aria-hidden="true" /></button>)}
      {verlauf}
      {eingabe}
    </dialog>}
  </div>;
}
