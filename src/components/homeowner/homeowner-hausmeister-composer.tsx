'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Camera, Mic, Send, Square } from 'lucide-react';
import { sendHausmeisterAction } from '@/app/actions';
import { EHPanel, EHText, EHButton, EHActions } from '@/design-system';

// T-0155: the intake draft survives network failures. The text is mirrored to
// localStorage on every keystroke, restored on mount, and only cleared after
// the action resolved (redirect counts as success). Server-action errors are
// caught inline - the error boundary must never eat the user's draft.

export function HomeownerHausmeisterComposer({
  continuingIntent,
  starterHint,
  incomingDraft,
}: {
  continuingIntent?: 'service' | 'contact' | null;
  starterHint?: string;
  incomingDraft?: string;
}) {
  const [text, setText] = useState(() => {
    // Draft restore via lazy initializer (T-0155): survives network loss and
    // accidental reloads without an extra render pass.
    try { return window.localStorage.getItem('eh-draft:hausmeister-intake') ?? ''; } catch { return ''; }
  });
  const [handledDraft, setHandledDraft] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [listening, setListening] = useState(false);
  const [offline, setOffline] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState('');
  const recognition = useRef<any>(null);
  const descriptionId = useId();
  const fileId = useId();
  const statusId = useId();
  const draftKey = 'eh-draft:hausmeister-intake';

  useEffect(() => {
    try {
      if (text) window.localStorage.setItem(draftKey, text);
      else window.localStorage.removeItem(draftKey);
    } catch {}
  }, [text]);

  async function submitDraft(formData: FormData) {
    if (submitting) return; // double-action guard
    setSubmitting(true);
    setSubmitError('');
    try {
      await sendHausmeisterAction(formData);
      // Redirect inside the action navigates away; reaching here without one
      // means the action handled the request (e.g. clarify flow).
      try { window.localStorage.removeItem(draftKey); } catch {}
      setText('');
    } catch (error) {
      // Next.js redirect() throws a control-flow error with a NEXT_REDIRECT
      // digest - it must bubble so the router navigates.
      const digest = (error as { digest?: string })?.digest ?? '';
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) throw error;
      setSubmitError('Senden fehlgeschlagen (mögliche 429 – zu viele Anfragen). Dein Text bleibt erhalten - versuch es erneut, sobald du wieder online bist.');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const syncNetwork = () => setOffline(!navigator.onLine);
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const syncCapabilities = () => setSpeechSupported(Boolean(Ctor));
    syncCapabilities();
    syncNetwork();
    window.addEventListener('online', syncNetwork);
    window.addEventListener('offline', syncNetwork);
    return () => {
      recognition.current?.stop?.();
      window.removeEventListener('online', syncNetwork);
      window.removeEventListener('offline', syncNetwork);
    };
  }, []);

  function toggleVoice() {
    if (listening) {
      recognition.current?.stop();
      setListening(false);
      setVoiceStatus('Spracheingabe beendet. Du kannst den Text vor dem Senden noch ändern.');
      return;
    }

    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) {
      setSpeechSupported(false);
      setVoiceStatus('Spracheingabe ist in diesem Browser nicht verfügbar. Text und Medien funktionieren weiterhin.');
      return;
    }

    const instance = new Ctor();
    recognition.current = instance;
    instance.lang = 'de-DE';
    instance.interimResults = true;
    instance.continuous = false;
    instance.onresult = (event: any) => {
      let value = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) value += event.results[i][0].transcript;
      setText(value.trim());
    };
    instance.onend = () => {
      setListening(false);
      setVoiceStatus('Spracheingabe beendet. Prüfe den erkannten Text und sende ihn dann ab.');
    };
    instance.onerror = () => {
      setListening(false);
      setVoiceStatus('Spracheingabe hat nicht funktioniert. Du kannst dein Anliegen weiterhin tippen oder ein Medium hinzufügen.');
    };
    setListening(true);
    setVoiceStatus('Spracheingabe läuft. Sprich jetzt dein Anliegen.');
    instance.start();
  }

  const placeholder = continuingIntent === 'contact'
    ? 'Beantworte nur noch die kurze Rückfrage, damit ich deinen Ansprechpartner finde …'
    : continuingIntent === 'service'
      ? 'Beantworte nur noch die kurze Rückfrage, damit ich den Auftrag organisieren kann …'
      : starterHint || 'Beschreib kurz, was bei dir zu Hause los ist …';

  const connectionStatus = offline
    ? 'Du bist offline. Dein Text bleibt hier erhalten; senden kannst du wieder mit Internetverbindung.'
    : !speechSupported
      ? 'Spracheingabe ist in diesem Browser nicht verfügbar. Text und Medien funktionieren weiterhin.'
      : voiceStatus;

  return (
    <form action={submitDraft} className="agent-composer" aria-describedby={connectionStatus ? statusId : undefined}>
      {incomingDraft?.trim() && incomingDraft !== handledDraft && <EHPanel title="Deine mitgebrachte Frage">
        <EHText>{incomingDraft}</EHText>
        <EHText>Übernimm den Text in dein Eingabefeld und prüfe ihn vor dem Senden. Ein vorhandener Entwurf bleibt erhalten.</EHText>
        <EHActions>
          <EHButton type="button" disabled={submitting} onClick={() => {
            setText(current => current.trim() && current.trim() !== incomingDraft.trim()
              ? current + '\n\n' + incomingDraft : incomingDraft);
            setHandledDraft(incomingDraft);
            document.getElementById(descriptionId)?.focus();
          }}>{text.trim() ? 'Zum Entwurf hinzufügen' : 'In Eingabefeld übernehmen'}</EHButton>
          <EHButton type="button" variant="secondary" disabled={submitting} onClick={() => {
            setHandledDraft(incomingDraft);
            document.getElementById(descriptionId)?.focus();
          }}>Vorschlag verwerfen</EHButton>
        </EHActions>
      </EHPanel>}
      <label className="owner-visually-hidden" htmlFor={descriptionId}>Anliegen an den Hausmanager</label>
      <textarea
        id={descriptionId}
        name="description"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        required
        placeholder={placeholder}
        aria-describedby={connectionStatus ? statusId : undefined}
      />
      <div className="agent-actions">
        <label className="icon-action" htmlFor={fileId} title="Foto, Video oder Sprachnachricht hinzufügen">
          <Camera size={19} aria-hidden="true" />
          <span>Medien</span>
          <input
            id={fileId}
            name="photo"
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime,video/x-m4v,audio/aac,audio/mpeg,audio/mp4,audio/ogg,audio/opus,audio/wav,audio/x-wav"
          />
        </label>
        <button
          className={listening ? 'icon-action recording' : 'icon-action'}
          type="button"
          onClick={toggleVoice}
          aria-pressed={listening}
          aria-describedby={!speechSupported ? statusId : undefined}
          aria-label={listening ? 'Spracheingabe beenden' : speechSupported ? 'Spracheingabe starten' : 'Spracheingabe nicht verfügbar; Alternativen anzeigen'}
        >
          {listening ? <Square size={18} aria-hidden="true" /> : <Mic size={19} aria-hidden="true" />}
          <span>{listening ? 'Stopp' : speechSupported ? 'Diktieren' : 'Sprache nicht verfügbar'}</span>
        </button>
        <button className="send-action" type="submit" disabled={offline || submitting || text.trim().length < 4} aria-busy={submitting}>
          <Send size={18} aria-hidden="true" />
          <span>{submitting ? 'Wird gesendet…' : continuingIntent ? 'Weiter' : 'Anliegen senden'}</span>
        </button>
        {submitError && (
          <p className="owner-composer-status" role="alert" data-tone="error">{submitError}</p>
        )}
      </div>
      {connectionStatus && (
        <p id={statusId} className="owner-composer-status" role="status" aria-live="polite" aria-atomic="true">
          {connectionStatus}
        </p>
      )}
    </form>
  );
}
