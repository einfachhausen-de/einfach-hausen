'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './messages.module.css';

export function ProviderMessageComposer({ homeownerId, peerName, unreadCount }: { homeownerId: number; peerName: string; unreadCount: number }) {
  const endpoint = `/api/support/messages/${homeownerId}`;
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const pendingRequestId = useRef<string | null>(null);
  const wasOffline = useRef(false);

  useEffect(() => {
    const syncOnline = () => {
      const nextOnline = navigator.onLine;
      setOnline(nextOnline);
      if (!nextOnline) {
        wasOffline.current = true;
        setStatus('');
      } else if (wasOffline.current) {
        wasOffline.current = false;
        setStatus('Verbindung wiederhergestellt. Du kannst wieder senden.');
      }
    };
    syncOnline();
    window.addEventListener('online', syncOnline);
    window.addEventListener('offline', syncOnline);
    return () => {
      window.removeEventListener('online', syncOnline);
      window.removeEventListener('offline', syncOnline);
    };
  }, []);

  useEffect(() => {
    if (!unreadCount || !online || !navigator.onLine) return;
    let cancelled = false;
    fetch(endpoint, { method: 'PATCH', cache: 'no-store' })
      .then((response) => {
        if (!response.ok && !cancelled) setStatus('Lesestatus konnte nicht synchronisiert werden.');
      })
      .catch(() => {
        if (!cancelled) setStatus('Lesestatus wird beim nächsten Laden erneut synchronisiert.');
      });
    return () => { cancelled = true; };
  }, [endpoint, online, unreadCount]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    setError('');
    setStatus('');
    if (!online) {
      setError('Offline: Die Nachricht wurde nicht gesendet. Dein Text bleibt erhalten.');
      return;
    }
    if (!trimmed) {
      setError('Schreib zuerst eine Nachricht.');
      return;
    }

    const requestId = pendingRequestId.current || crypto.randomUUID();
    pendingRequestId.current = requestId;
    setSending(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ body: trimmed, requestId }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setError(payload.error || 'Nachricht konnte nicht gesendet werden. Bitte erneut versuchen.');
        return;
      }
      pendingRequestId.current = null;
      setBody('');
      setStatus('Nachricht gesendet.');
      // Server-Komponenten neu abrufen statt die ganze Seite neu laden:
      // Offene Accordeons, Scrollposition und Eingabe bleiben erhalten.
      router.refresh();
    } catch {
      setError('Verbindung unterbrochen. Die Nachricht ist nicht verloren; versuche es erneut.');
    } finally {
      setSending(false);
    }
  }

  return <>
    {!online && <div className={styles.offline} role="alert">Offline · Senden ist deaktiviert, bis die Verbindung zurück ist.</div>}
    {error && <div className={styles.error} role="alert">{error}</div>}
    {status && <div className={styles.status} role="status" aria-live="polite">{status}</div>}
    <form onSubmit={submit} className={styles.composer} data-message-composer="provider">
      <label className={styles.srOnly} htmlFor="provider-direct-message">Nachricht an {peerName}</label>
      <textarea
        id="provider-direct-message"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={2}
        maxLength={4000}
        placeholder={`Nachricht an ${peerName} …`}
        disabled={sending}
        aria-describedby="provider-message-hint"
      />
      <button type="submit" aria-label="Nachricht senden" disabled={sending || !online || !body.trim()}>{sending ? '…' : '↗'}</button>
      <small id="provider-message-hint" className={styles.hint}>{body.length}/4000 · Zeilenumbrüche sind möglich.</small>
    </form>
  </>;
}
