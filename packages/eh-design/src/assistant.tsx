"use client";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Copy,
  ExternalLink,
  Globe,
  History,
  Lightbulb,
  Mic,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Telescope,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { EHActivity, type EHActivityStep } from './blocks';
import { EHButton } from './primitives';
import s from './styles.module.css';

export type EHAssistantMessage = { role: 'user' | 'assistant'; content: string };
export type EHAssistantSource = { id: string; title: string; href: string; domain: string };
export type EHAssistantResult = {
  reply: string;
  kind: 'reply' | 'login' | 'quota' | 'error';
  steps?: EHActivityStep[];
  cards?: ReactNode;
  sources?: EHAssistantSource[];
};

const TOOLS = [
  { id: 'image', name: 'Bild erstellen', shortName: 'Bild', icon: Palette },
  { id: 'search', name: 'Web durchsuchen', shortName: 'Suche', icon: Globe },
  { id: 'code', name: 'Code schreiben', shortName: 'Code', icon: Pencil },
  { id: 'research', name: 'Tief recherchieren', shortName: 'Recherche', icon: Telescope, extra: '5 übrig' },
  { id: 'think', name: 'Länger nachdenken', shortName: 'Denken', icon: Lightbulb },
];

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
export function EHAssistant({
  onSend,
  loginHref,
  settingsHref,
  aboveNavigation = false,
  placement = 'floating',
  open,
  onOpenChange,
  compact = false,
}: {
  /** `onStep` meldet die Schritte des Aufrufs, wenn der Aufrufer sie zeigen will. */
  onSend: (messages: EHAssistantMessage[], signal: AbortSignal, onStep?: (step: EHActivityStep) => void) => Promise<EHAssistantResult>;
  loginHref: string;
  settingsHref: string;
  aboveNavigation?: boolean;
  placement?: 'floating' | 'toolbar' | 'panel';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Schmaler Bereich: der Knopf zeigt nur die Kachel, die Beschriftung entfaellt. */
  compact?: boolean;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const letzteFrage = useRef<{ text: string; verlauf: EHAssistantMessage[] } | null>(null);
  const [messages, setMessages] = useState<EHAssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<EHAssistantResult | null>(null);
  const [steps, setSteps] = useState<EHActivityStep[]>([]);
  const [karten, setKarten] = useState<Record<number, ReactNode>>({});
  const [quellen, setQuellen] = useState<Record<number, EHAssistantSource[]>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down' | null>>({});
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const kartenRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [offenIntern, setOffenIntern] = useState(false);
  const istPanel = placement === 'panel';
  const offen = open ?? offenIntern;

  useEffect(() => () => request.current?.abort(), []);

  useEffect(() => {
    const bereich = log.current;
    if (!bereich) return;
    const letzte = busy ? null : kartenRefs.current[messages.length - 1];
    if (letzte) {
      const kasten = bereich.getBoundingClientRect();
      const ziel = letzte.getBoundingClientRect();
      bereich.scrollTop += ziel.top - kasten.top - 8;
      return;
    }
    bereich.scrollTop = bereich.scrollHeight;
  }, [messages, busy, notice, steps]);

  useEffect(() => {
    if (!istPanel) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && offen) {
        event.preventDefault();
        setOffenIntern(false);
        onOpenChange?.(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [istPanel, offen, onOpenChange]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(Math.max(el.scrollHeight, 40), 160)}px`;
    }
  }, [input]);

  /** Ein gemeldeter Schritt ersetzt seinen Vorgaenger mit demselben Schluessel. */
  function schrittMerken(step: EHActivityStep) {
    setSteps(bisher => {
      const stelle = bisher.findIndex(vorhanden => vorhanden.key === step.key);
      return stelle < 0 ? [...bisher, step] : bisher.map((vorhanden, i) => i === stelle ? step : vorhanden);
    });
  }

  async function sende(text: string, verlauf: EHAssistantMessage[]) {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const next: EHAssistantMessage[] = [...verlauf, { role: 'user', content: text }];
    letzteFrage.current = { text, verlauf };
    setBusy(true);
    setNotice(null);
    setSteps([]);
    try {
      const result = await onSend(next.slice(-12), controller.signal, istPanel ? schrittMerken : undefined);
      if (controller.signal.aborted) return;
      if (istPanel && result.steps?.length) setSteps(result.steps);
      if (result.kind === 'reply') {
        if (istPanel && result.cards) setKarten(bisher => ({ ...bisher, [next.length]: result.cards }));
        if (result.sources?.length) setQuellen(bisher => ({ ...bisher, [next.length]: result.sources! }));
        setMessages([...next, { role: 'assistant', content: result.reply }]);
        setInput('');
        setImagePreview(null);
        setSelectedTool(null);
        setToolsOpen(false);
      } else {
        setNotice(result);
      }
    } catch {
      if (!controller.signal.aborted) {
        setNotice({
          kind: 'error',
          reply: 'Die Verbindung ist gerade unterbrochen. Deine Frage bleibt im Eingabefeld. Du kannst es erneut versuchen.',
        });
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  function handleSendText() {
    const text = input.trim();
    if (!text && !imagePreview) return;
    const tool = selectedTool ? TOOLS.find(t => t.id === selectedTool) : null;
    const prompt = tool ? `[${tool.shortName}] ${text}` : text;
    void sende(prompt || 'Bild analysieren', messages);
  }

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSendText();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendText();
    }
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  /** Ein fehlgeschlagener Schritt laesst sich mit derselben Frage wiederholen. */
  function wiederholen() {
    const letzte = letzteFrage.current;
    if (letzte && !request.current) void sende(letzte.text, letzte.verlauf);
  }

  const schritte = steps.map((step, i) => (!busy && step.state === 'failed' && i === steps.length - 1)
    ? { ...step, retry: { label: 'Erneut versuchen', onClick: wiederholen } }
    : step);

  const activeToolObj = selectedTool ? TOOLS.find(t => t.id === selectedTool) : null;
  const ActiveIcon = activeToolObj?.icon;

  const kopf = (schliessen: ReactNode) => (
    <header className={s.assistantHeader}>
      <div className={s.assistantHeaderAvatar} aria-hidden="true"><Sparkles size={16} /></div>
      <div className={s.assistantHeaderCopy}>
        <h2 id={id + '-title'}>Dein Hausmanager</h2>
        <span>Kennt dein Zuhause</span>
      </div>
      <div className={s.assistantHeaderTools}>
        <button
          type="button"
          className={s.assistantHeaderBtn}
          aria-label="Chatverlauf"
          title={messages.length > 0 ? `Verlauf (${messages.length} Nachrichten)` : 'Chatverlauf'}
          onClick={() => setNotice(b => b ? null : { kind: 'reply', reply: `Im Verlauf sind aktuell ${messages.length} Nachrichten gespeichert.` })}
        >
          <History size={16} aria-hidden="true" />
        </button>
        {schliessen}
      </div>
    </header>
  );

  const verlauf = (
    <div ref={log} className={s.assistantMessages} role="log" aria-label="Chatverlauf" aria-live="polite" aria-relevant="additions text">
      {messages.length === 0 && (
        <div className={s.assistantWelcome}>
          <div className={s.assistantWelcomeIcon} aria-hidden="true"><Sparkles size={22} /></div>
          <h3>Wie kann ich dir helfen?</h3>
          <p>Beschreibe dein Anliegen rund um dein Haus. Ich helfe dir, Fragen zu klären und passende Handwerker oder Angebote zu finden.</p>
          <span className={s.assistantWelcomeNotice}>
            Du sprichst mit einer KI. Antworten können Fehler enthalten. Verbindlich wird nur, was du in einer Karte buchst.
          </span>
        </div>
      )}
      {messages.map((m, i) => {
        const isUser = m.role === 'user';
        if (isUser) {
          return (
            <div key={i} className={s.assistantMessageUser}>
              {m.content}
            </div>
          );
        }
        const anhang = karten[i];
        const turnSources = quellen[i];
        return (
          <div key={i} className={s.assistantMessageAssistant} ref={el => { kartenRefs.current[i] = el; }}>
            <div className={s.assistantMessageAuthor}>
              <Sparkles size={14} aria-hidden="true" />
              <span>Hausmanager · KI</span>
            </div>
            <div className={s.assistantMessageBody}>{m.content}</div>
            {turnSources && turnSources.length > 0 && (
              <details className={s.assistantSources}>
                <summary className={s.assistantSourcesSummary}>
                  <BookOpen size={14} aria-hidden="true" />
                  <span>{turnSources.length} {turnSources.length === 1 ? 'Quelle' : 'Quellen'}</span>
                  <ChevronDown size={12} className={s.assistantSourcesChevron} aria-hidden="true" />
                </summary>
                <ul className={s.assistantSourcesList}>
                  {turnSources.map(src => (
                    <li key={src.id}>
                      <a href={src.href} className={s.assistantSourceItem} target={src.href.startsWith('http') ? '_blank' : undefined} rel={src.href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                        <strong>{src.title}</strong>
                        <small>{src.domain}</small>
                        <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <div className={s.assistantActionsRow}>
              <button
                type="button"
                className={s.assistantActionBtn}
                aria-label={copiedIndex === i ? 'Kopiert' : 'Antwort kopieren'}
                title="Antwort kopieren"
                onClick={() => {
                  void navigator.clipboard?.writeText(m.content);
                  setCopiedIndex(i);
                  setTimeout(() => setCopiedIndex(null), 1600);
                }}
              >
                {copiedIndex === i ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              </button>
              <button
                type="button"
                className={s.assistantActionBtn}
                aria-label="Antwort wiederholen"
                title="Antwort wiederholen"
                onClick={wiederholen}
              >
                <RotateCcw size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={s.assistantActionBtn}
                aria-label="Hilfreich"
                aria-pressed={feedback[i] === 'up'}
                title="Hilfreich"
                onClick={() => setFeedback(prev => ({ ...prev, [i]: prev[i] === 'up' ? null : 'up' }))}
              >
                <ThumbsUp size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={s.assistantActionBtn}
                aria-label="Nicht hilfreich"
                aria-pressed={feedback[i] === 'down'}
                title="Nicht hilfreich"
                onClick={() => setFeedback(prev => ({ ...prev, [i]: prev[i] === 'down' ? null : 'down' }))}
              >
                <ThumbsDown size={14} aria-hidden="true" />
              </button>
            </div>
            {anhang && <div className={s.assistantAttachment}>{anhang}</div>}
          </div>
        );
      })}
      {busy && (!istPanel || !steps.length) && <p role="status">Deine Antwort wird vorbereitet …</p>}
      {istPanel && <EHActivity steps={schritte} title="Was die KI macht" label="Ablauf der Antwort" />}
      {notice && (
        <div className={s.assistantNotice} role="status">
          <p>{notice.reply}</p>
          {notice.kind === 'login' && <EHButton href={loginHref}>Zum Hauskonto anmelden</EHButton>}
          {notice.kind === 'quota' && <EHButton href={settingsHref} variant="secondary">KI-Kontingent ansehen</EHButton>}
        </div>
      )}
    </div>
  );

  const eingabe = (
    <form className={s.assistantPromptBox} onSubmit={send}>
      <input type="file" ref={fileInputRef} onChange={onFileChange} className={s.fileInputHidden} accept="image/*" />

      {imagePreview && (
        <div className={s.assistantPromptPreview}>
          <img src={imagePreview} alt="Vorschau" />
          <button type="button" className={s.assistantPromptPreviewClose} aria-label="Bild entfernen" onClick={() => setImagePreview(null)}>
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Nachricht an deinen Hausmanager …"
        className={s.assistantPromptInput}
        disabled={busy}
        maxLength={4000}
      />

      <div className={s.assistantPromptBar}>
        <div className={s.assistantPromptLeft}>
          <button
            type="button"
            className={s.assistantPromptIconBtn}
            aria-label="Bild anfügen"
            title="Bild anfügen"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            className={s.assistantPromptToolsBtn}
            aria-label="Tools auswählen"
            title="Tools auswählen"
            aria-expanded={toolsOpen}
            onClick={() => setToolsOpen(!toolsOpen)}
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            <span>Tools</span>
          </button>

          {activeToolObj && ActiveIcon && (
            <button
              type="button"
              className={s.assistantPromptActiveTool}
              onClick={() => setSelectedTool(null)}
              title="Tool entfernen"
              aria-label={`${activeToolObj.name} entfernen`}
            >
              <ActiveIcon size={14} aria-hidden="true" />
              <span>{activeToolObj.shortName}</span>
              <X size={12} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className={s.assistantPromptRight}>
          <button
            type="button"
            className={s.assistantPromptIconBtn}
            aria-label="Spracheingabe"
            title="Spracheingabe"
            onClick={() => {}}
          >
            <Mic size={16} aria-hidden="true" />
          </button>

          <button
            type="submit"
            className={s.assistantPromptSendBtn}
            disabled={busy || (!input.trim() && !imagePreview)}
            aria-label="Nachricht senden"
            title="Senden"
          >
            <ArrowUp size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {toolsOpen && (
        <div className={s.assistantToolsPopover}>
          {TOOLS.map(t => {
            const TIcon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                className={s.assistantToolOption}
                onClick={() => {
                  setSelectedTool(t.id);
                  setToolsOpen(false);
                }}
              >
                <TIcon size={16} aria-hidden="true" />
                <span>{t.name}</span>
                {t.extra && <small>{t.extra}</small>}
              </button>
            );
          })}
        </div>
      )}
    </form>
  );

  return (
    <div className={s.scope} data-eh-app>
      {istPanel && offen && (
        <section id={id} className={s.assistantPanel} aria-labelledby={id + '-title'}>
          {kopf(
            <button
              type="button"
              className={s.assistantHeaderBtn}
              aria-label="Chat schließen"
              onClick={() => {
                setOffenIntern(false);
                onOpenChange?.(false);
              }}
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
          {verlauf}
          {eingabe}
        </section>
      )}

      {!(istPanel && offen) && (
        <button
          ref={launcher}
          type="button"
          className={s.assistantLauncher}
          data-placement={placement}
          data-kompakt={compact || undefined}
          data-above-nav={aboveNavigation || undefined}
          aria-label={istPanel ? (offen ? 'Kundenberater schließen' : 'Kundenberater öffnen') : 'Hausassistent öffnen'}
          aria-haspopup={istPanel ? undefined : 'dialog'}
          aria-expanded={istPanel ? offen : undefined}
          aria-controls={id}
          data-offen={istPanel && offen ? true : undefined}
          onClick={() => {
            if (istPanel) {
              setOffenIntern(!offen);
              onOpenChange?.(!offen);
              return;
            }
            dialog.current?.showModal();
          }}
        >
          {istPanel ? (
            <>
              <span className={s.assistantLauncherAvatar} aria-hidden="true">
                <Sparkles size={18} />
              </span>
              <span className={s.assistantLauncherCopy}>
                <strong>Hausmanager</strong>
                <small>KI-Hilfe</small>
              </span>
              <ChevronsUpDown className={s.assistantLauncherChevron} size={16} aria-hidden="true" />
            </>
          ) : (
            <>
              <img src="/brand/logo-full.png" alt="" width={64} height={42} />
              <span>
                <strong>{placement === 'toolbar' ? 'Hausmanager' : 'Frag deinen Hausmanager'}</strong>
                {placement !== 'toolbar' && <small>KI-Hilfe rund um dein Zuhause</small>}
              </span>
            </>
          )}
        </button>
      )}

      {/* Schwebend und Werkzeugleiste bleiben ein modaler Dialog - wie auf der
          Website vorgesehen; der Bereich braucht keinen. */}
      {!istPanel && (
        <dialog
          ref={dialog}
          id={id}
          className={s.assistantDialog}
          aria-labelledby={id + '-title'}
          onClose={() => launcher.current?.focus()}
        >
          {kopf(
            <button
              type="button"
              className={s.assistantHeaderBtn}
              aria-label="Chat schließen"
              onClick={() => dialog.current?.close()}
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
          {verlauf}
          {eingabe}
        </dialog>
      )}
    </div>
  );
}
