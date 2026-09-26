'use client';

import '@/components/werkbank-layout.css';
import { useEffect, useId, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { EHButton } from '@/design-system';

/**
 * Fehlerzustand im Werkbank-Stil fuer die Route-Grenzen von /app und /pro.
 * Nutzt denselben Kopf wie die Werkbank-Seiten, damit auch ein Fehler nicht
 * wie eine andere App aussieht. Fokus springt auf den Zustand, damit
 * Screenreader die Meldung sofort vorlesen.
 */
export function WerkbankFehler({ title, text, retryLabel, onRetry, homeHref, homeLabel, landmark = true }: {
  title: string;
  text: string;
  retryLabel: string;
  onRetry: () => void;
  homeHref: string;
  homeLabel: string;
  landmark?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => { ref.current?.focus(); }, []);
  const Tag = landmark ? 'main' : 'section';
  return (
    <Tag ref={ref} className="eh-werkbank-zustand" role="alert" aria-labelledby={titleId} tabIndex={-1}>
      <span className="eh-werkbank-zustand-kicker"><AlertCircle aria-hidden="true" />Das hat nicht geklappt</span>
      <header className="eh-werkbank-kopf">
        <div className="eh-werkbank-kopf-copy"><h1 id={titleId}>{title}</h1></div>
      </header>
      <p className="eh-werkbank-zustand-text">{text}</p>
      <div className="eh-werkbank-zustand-tools">
        <EHButton type="button" onClick={onRetry}>{retryLabel}</EHButton>
        <a className="eh-werkbank-abschnitt-link" href={homeHref}>{homeLabel}<span aria-hidden="true"> →</span></a>
      </div>
    </Tag>
  );
}
