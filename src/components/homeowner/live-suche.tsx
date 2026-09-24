"use client";
/**
 * LiveSuche — Suchleiste, die beim Eintippen filtert (Betreiber 24.09.:
 * »bereits beim eintippen sollen ergebnisse gefiltert/angezeigt werden«,
 * fuer Vertrags-Tabelle und Angebote-Liste gleichermaßen). Progressive
 * Verbesserung: Die Zeilen werden direkt im DOM ein-/ausgeblendet; daneben
 * bleibt das GET-Formular voll wirksam — ohne JavaScript (oder per Enter)
 * filtert der Server wie bisher.
 */
import { useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';

export function LiveSuche({
  base, defaultValue = '', hidden = {}, noun,
  root, items, leer,
  formClassName, trefferClassName,
  placeholder, label,
  submitClassName = 'eh-vtbl-suche-btn', submitText,
}: {
  base: string;
  defaultValue?: string;
  /** Fixierte Filter-Achsen (Art, Sortierung, …) fuer den GET-Fallback. */
  hidden?: Record<string, string | undefined>;
  /** Substantiv fuer den Zaehler: »Verträge« / »Angebote«. */
  noun: string;
  /** Wrapper, innerhalb dessen gefiltert wird (closest), z.B. '.eh-vtbl'. */
  root: string;
  /** Selektor der filterbaren Elemente, z.B. 'tbody tr'. */
  items: string;
  /** Leer-Ausgabe des Servers; weicht, solange live Treffer stehen. */
  leer?: string;
  formClassName: string;
  trefferClassName: string;
  placeholder: string;
  label: string;
  submitClassName?: string;
  /** Text-Knopf statt Pfeil-Icon (Angebote-Suche). */
  submitText?: string;
}) {
  const [q, setQ] = useState(defaultValue);
  const [live, setLive] = useState<{ sichtbar: number; total: number } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function anwenden(next: string) {
    setQ(next);
    const form = formRef.current;
    const bereich = form?.closest(root);
    if (!form || !bereich) return;
    const needle = next.trim().toLowerCase();
    const elemente = Array.from(bereich.querySelectorAll(items)) as HTMLElement[];
    const leerEl = leer ? (bereich.querySelector(leer) as HTMLElement | null) : null;
    const daten = leerEl ? elemente.filter((el) => !el.contains(leerEl) && el !== leerEl) : elemente;
    let sichtbar = 0;
    for (const el of elemente) {
      el.hidden = !!needle && !el.textContent?.toLowerCase().includes(needle);
      if (!el.hidden) sichtbar += 1;
    }
    if (leerEl) leerEl.hidden = needle !== '' && sichtbar > 0;
    setLive(needle ? { sichtbar, total: daten.length } : null);
    // Die serverseitige Trefferzeile weicht nur, solange live gefiltert wird.
    const serverZeile = bereich.querySelector(`.${trefferClassName}:not([data-live])`) as HTMLElement | null;
    if (serverZeile) serverZeile.hidden = !!needle;
  }

  function leeren() {
    anwenden('');
    inputRef.current?.focus();
  }

  return (
    <>
      <form ref={formRef} method="get" action={base} className={formClassName} role="search">
        <Search size={15} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={q}
          onChange={(e) => anwenden(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
        />
        {q !== '' && <button type="button" className="eh-live-x" aria-label="Suche leeren" onClick={leeren}><X size={14} aria-hidden="true" /></button>}
        <button type="submit" className={submitClassName} aria-label={submitText ? undefined : 'Suchen'}>{submitText ?? <ArrowRight size={14} aria-hidden="true" />}</button>
        {Object.entries(hidden).map(([k, v]) => v !== undefined && <input key={k} type="hidden" name={k} value={v} />)}
      </form>
      <p className={trefferClassName} data-live="true" role="status" hidden={!live}>
        {live && <>{live.sichtbar} von {live.total} {noun} · <button type="button" className="eh-live-reset" onClick={leeren}>Alles zurücksetzen</button></>}
      </p>
    </>
  );
}
