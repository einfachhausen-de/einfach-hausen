"use client";
import {Fragment, useEffect, useId, useRef, useState, type FormEvent, type ReactNode} from 'react';
import {ArrowUp, BookOpen, Camera, Check, ChevronsUpDown, ClipboardPlus, Clock, Copy, ExternalLink, FilePlus2, FileText, FileUp, FolderSearch, History, ListChecks, Mic, Plus, Scale, SlidersHorizontal, Sparkles, ThumbsDown, ThumbsUp, X} from 'lucide-react';
import {motion, AnimatePresence} from 'motion/react';
import {EHActivity, type EHActivityStep} from './blocks';
import {EHButton, EHText} from './primitives';
import s from './styles.module.css';

export type EHAssistantMessage = {role: 'user' | 'assistant'; content: string};
export type EHSource = {title: string; href: string; domain?: string};
export type EHAssistantResult = {reply: string; kind: 'reply' | 'login' | 'quota' | 'error'; steps?: EHActivityStep[]; cards?: ReactNode; sources?: EHSource[]; suggestions?: string[]};
/** Anhang am Eingabefeld: `photo` ist ein Schaden-/Situationsbild,
 *  `document` ein Hausdokument (PDF/Bild), das in die Hausakte wandert. */
export type EHChatAttachment = {file: File; kind: 'photo' | 'document'};
export type EHSendOptions = {tool?: string; attachment?: EHChatAttachment | null};

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
export function EHAssistant({onSend, loginHref, settingsHref, aboveNavigation = false, placement = 'floating', open, onOpenChange, compact = false, suggestions}: {
  /** `onStep` meldet die Schritte des Aufrufs; `options` tragen ein bewusst
      ausgewaehltes Tool und den Anhang (Foto/Dokument) an den Aufrufer. */
  onSend: (messages: EHAssistantMessage[], signal: AbortSignal, onStep?: (step: EHActivityStep) => void, options?: EHSendOptions) => Promise<EHAssistantResult>;
  loginHref: string; settingsHref: string; aboveNavigation?: boolean; placement?: 'floating' | 'toolbar' | 'panel';
  open?: boolean; onOpenChange?: (open: boolean) => void;
  /** Schmaler Bereich: der Knopf zeigt nur die Kachel, die Beschriftung entfaellt. */
  compact?: boolean;
  /** Startvorschlaege (aktuelle Seite + eigene Daten) fuer den leeren Verlauf;
      erscheinen ueber dem Eingabefeld und verschwinden mit der 1. Nachricht. */
  suggestions?: string[];
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
  /** Anhang am Eingabefeld: Foto oder Dokument; Vorschau und Sende-Option. */
  const [anhang, setAnhang] = useState<EHChatAttachment | null>(null);
  const [anhangMenu, setAnhangMenu] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  /** Follow-up-Vorschlaege der letzten Antwort; verschwinden beim Tippen. */
  const [folgen, setFolgen] = useState<string[]>([]);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [notice, setNotice] = useState<EHAssistantResult | null>(null);
  const [steps, setSteps] = useState<EHActivityStep[]>([]);
  // Empfehlungskarten haengen an der Antwort, zu der sie gehoeren - nicht am
  // Ende des Verlaufs, damit die naechste Frage sie nicht ueberschreibt.
  const [karten, setKarten] = useState<Record<number, ReactNode>>({});
  const [quellen, setQuellen] = useState<Record<number, EHSource[]>>({});
  const [copied, setCopied] = useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down'>>({});
  // Die Karte ist die Antwort: nach ihr richtet sich der Blick, nicht nach dem
  // Seitenfluss darunter.
  const kartenRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [offenIntern, setOffenIntern] = useState(false);
  const istPanel = placement === 'panel';
  const offen = open ?? offenIntern;
  // Die IDs sind die serverseitige Chat-Tool-Allowlist: ein Klick waehlt die
  // Faehigkeit direkt aus, statt einem Modell das Erraten zu ueberlassen.
  const tools = [
    {id: 'create_job', label: 'Auftrag erstellen', icon: ClipboardPlus, short: 'Auftrag', placeholder: 'Was soll gemacht werden?'},
    {id: 'compare_tariffs', label: 'Tarife vergleichen', icon: Scale, short: 'Tarife', placeholder: 'Welchen Vertrag möchtest du vergleichen?'},
    {id: 'compare_quotes', label: 'Handwerkerangebote vergleichen', icon: ListChecks, short: 'Angebote', placeholder: 'Welchen Auftrag oder welche Angebote möchtest du vergleichen?'},
    {id: 'search_house', label: 'Hausakte durchsuchen', icon: FolderSearch, short: 'Hausakte', placeholder: 'Wonach suchst du in deiner Hausakte?'},
    {id: 'create_report', label: 'Bericht erstellen', icon: FilePlus2, short: 'Bericht', placeholder: 'Worüber soll ich dir einen Bericht erstellen?'},
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

  /** Ein gemeldeter Schritt ersetzt seinen Vorgaenger mit demselben Schluessel. */
  function schrittMerken(step: EHActivityStep) {
    setSteps(bisher => {
      const stelle = bisher.findIndex(vorhanden => vorhanden.key === step.key);
      return stelle < 0 ? [...bisher, step] : bisher.map((vorhanden, i) => i === stelle ? step : vorhanden);
    });
  }

  async function sende(text: string, verlauf: EHAssistantMessage[]) {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    const inhalt = text || (anhang ? (anhang.kind === 'photo' ? 'Foto mitgesendet' : 'Dokument hochgeladen') : '');
    if (!inhalt) return;
    const next: EHAssistantMessage[] = [...verlauf, {role: 'user', content: inhalt}];
    letzteFrage.current = {text: inhalt, verlauf};
    setBusy(true); setNotice(null); setSteps([]);
    // Tool und Anhang reisen mit der konkreten Frage; erst nach einer
    // gelungene Antwort wird der Modus zurueckgesetzt, damit eine
    // Wiederholung denselben Kontext nimmt.
    const optionen: EHSendOptions = {tool: selectedTool ?? undefined, attachment: anhang};
    try {
      // Der Bereich liest mit, was gerade passiert; schwebende Karte und
      // Werkzeugleiste bleiben unveraendert.
      const result = await onSend(next.slice(-12), controller.signal, istPanel ? schrittMerken : undefined, optionen);
      if (controller.signal.aborted) return;
      if (istPanel && result.steps?.length) setSteps(result.steps);
      if (result.kind === 'reply') {
        if (istPanel && result.cards) setKarten(bisher => ({...bisher, [next.length]: result.cards}));
        if (istPanel && result.sources?.length) setQuellen(bisher => ({...bisher, [next.length]: result.sources!}));
        setMessages([...next, {role: 'assistant', content: result.reply}]); setInput('');
        setAnhang(null); setImagePreview(null); setSelectedTool(null);
        setFolgen((result.suggestions ?? []).slice(0, 3));
      }
      else { setNotice(result); setFolgen([]); }
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

  /** Ein fehlgeschlagener Schritt laesst sich mit derselben Frage wiederholen. */
  function wiederholen() {
    const letzte = letzteFrage.current;
    if (letzte && !request.current) void sende(letzte.text, letzte.verlauf);
  }

  // Nur der letzte, fehlgeschlagene Schritt bekommt die Wiederholung: sie gilt
  // immer der ganzen Frage.
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

  const hasValue = input.trim().length > 0 || anhang !== null;
  const photoInputRef = useRef<HTMLInputElement>(null);
  const dokumentInputRef = useRef<HTMLInputElement>(null);
  const handlePlus = () => setAnhangMenu(o => !o);
  const anhangNehmen = (e: React.ChangeEvent<HTMLInputElement>, kind: EHChatAttachment['kind']) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    setAnhangMenu(false);
    if (!f) return;
    setAnhang({file: f, kind});
    if (kind === 'photo' && (f.type.startsWith('image/') || f.type === 'image/heic' || f.type === 'image/heif')) {
      const r = new FileReader();
      r.onloadend = () => setImagePreview(r.result as string);
      r.readAsDataURL(f);
    }
  };
  const anhangEntfernen = () => { setAnhang(null); setImagePreview(null); };
  // Vorschlaege ueber dem Eingabefeld: im leeren Verlauf die Startvorschlaege
  // des Aufrufers, danach die Follow-ups der letzten Antwort. Klick uebernimmt
  // den Text in die Eingabe; gesendet wird erst mit Enter.
  const chips = (messages.length === 0 ? (suggestions ?? []) : folgen).slice(0, 3);
  const eingabe = (
    <form className={s.assistantComposer} onSubmit={send}>
      {chips.length > 0 && (
        <div className={s.assistantSuggestions} role="list" aria-label="Vorschläge">
          {chips.map(chip => (
            <button key={chip} type="button" role="listitem" className={s.assistantSuggestion}
              onClick={() => { setInput(chip); setFolgen([]); composerRef.current?.focus(); }}>
              {chip}
            </button>
          ))}
        </div>
      )}
      <div className={s.assistantPromptBox}>
        <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" capture="environment" onChange={e => anhangNehmen(e, 'photo')} hidden aria-hidden="true" tabIndex={-1} />
        <input ref={dokumentInputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={e => anhangNehmen(e, 'document')} hidden aria-hidden="true" tabIndex={-1} />
        {anhang && (
          <div className={s.assistantPromptPreview}>
            <span className={s.assistantPromptPreviewItem} data-doku={anhang.kind === 'document' ? 'true' : undefined}>
              {anhang.kind === 'photo' && imagePreview
                ? <img src={imagePreview} alt="Foto-Vorschau" />
                : <span aria-hidden="true" className={s.assistantPromptPreviewDocIcon}><FileText size={16} /></span>}
              <span className={s.assistantPromptPreviewName}>{anhang.kind === 'photo' ? 'Foto' : anhang.file.name.slice(0, 32)}</span>
              <button type="button" className={s.assistantPromptPreviewRemove} aria-label="Anhang entfernen" onClick={anhangEntfernen}><X size={12} /></button>
            </span>
          </div>
        )}
        <textarea
          ref={composerRef}
          id={id+'-question'}
          value={input}
          onChange={e => { setInput(e.target.value); if (folgen.length) setFolgen([]); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const t = input.trim(); if (t) void sende(t, messages); } }}
          rows={1}
          maxLength={4000}
          required
          disabled={busy}
          aria-label="Nachricht"
          placeholder={activeTool?.placeholder ?? 'Nachricht…'}
          className={s.assistantPromptInput}
        />
        <div className={s.assistantPromptBar}>
          <div className={s.assistantPromptLeft} style={{position:'relative'}}>
            <div style={{position:'relative'}}>
              <button type="button" onClick={handlePlus} className={s.assistantPromptIconBtn} aria-label="Foto oder Datei hinzufügen" aria-haspopup="menu" aria-expanded={anhangMenu}><Plus size={18} /></button>
              {anhangMenu && (
                <div className={s.assistantPromptToolsMenu} role="menu" aria-label="Anhang hinzufügen">
                  <button type="button" role="menuitem" onClick={() => { photoInputRef.current?.click(); setAnhangMenu(false); }}><Camera size={16} /> <span>Foto machen</span></button>
                  <button type="button" role="menuitem" onClick={() => { dokumentInputRef.current?.click(); setAnhangMenu(false); }}><FileUp size={16} /> <span>Datei hochladen</span></button>
                </div>
              )}
            </div>
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

  return <div className={s.scope} data-eh-app>
    {istPanel && offen && <section id={id} className={s.assistantPanel} aria-labelledby={id+'-title'}>
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

    {/* Schwebend und Werkzeugleiste bleiben ein modaler Dialog - wie auf der
        Website vorgesehen; der Bereich braucht keinen. */}
    {!istPanel && <dialog ref={dialog} id={id} className={s.assistantDialog} aria-labelledby={id+'-title'}
      onClose={() => launcher.current?.focus()}>
      {kopf(<button type="button" className={s.assistantClose} aria-label="Chat schließen" onClick={() => dialog.current?.close()}><X size={16} aria-hidden="true" /></button>)}
      {verlauf}
      {eingabe}
    </dialog>}
  </div>;
}
