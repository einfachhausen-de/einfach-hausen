"use client";
/**
 * TabellenSucheLive — die Vertrags-Suchleiste filtert schon beim Eintippen
 * (Betreiber 24.09.: »bereits beim eintippen sollen ergebnisse gefiltert
 * angezeigt werden«). Progressive Verbesserung: Die Zeilen werden direkt im
 * DOM ein-/ausgeblendet, daneben bleibt das GET-Formular voll wirksam —
 * ohne JavaScript (oder per Enter) filtert der Server wie bisher.
 */
import { useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';

export function TabellenSucheLive({
  base, defaultValue = '', hidden = {},
}: {
  base: string;
  defaultValue?: string;
  /** Fixierte Filter-Achsen (Status, Sortierung, …) fuer den GET-Fallback. */
  hidden?: Record<string, string | undefined>;
}) {
  const [q, setQ] = useState(defaultValue);
  const [live, setLive] = useState<{ sichtbar: number; total: number } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function anwenden(next: string) {
    setQ(next);
    const form = formRef.current;
    const tabelle = form?.closest('.eh-vtbl')?.querySelector('tbody');
    if (!form || !tabelle) return;
    const needle = next.trim().toLowerCase();
    const rows = Array.from(tabelle.querySelectorAll('tr')) as HTMLTableRowElement[];
    const leer = rows.find((r) => r.querySelector('.eh-vtbl-leer'));
    const daten = rows.filter((r) => r !== leer);
    let sichtbar = 0;
    for (const row of rows) {
      if (row === leer) { row.hidden = !!needle; continue; }
      row.hidden = !!needle && !row.textContent?.toLowerCase().includes(needle);
      if (!row.hidden) sichtbar += 1;
    }
    setLive(needle ? { sichtbar, total: daten.length } : null);
    // Solange live gefiltert wird, tritt diese Zeile an die Stelle der
    // serverseitigen Trefferzeile (die bleibt fuer Enter/neuladen erhalten).
    const serverZeile = form.closest('.eh-vtbl')?.querySelector('.eh-vtbl-treffer:not([data-live])') as HTMLElement | null;
    if (serverZeile) serverZeile.hidden = !!needle;
  }

  function leeren() {
    anwenden('');
    inputRef.current?.focus();
  }

  return (
    <>
      <form ref={formRef} method="get" action={base} className="eh-vtbl-suche" role="search">
        <Search size={15} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={q}
          onChange={(e) => anwenden(e.target.value)}
          placeholder="Anbieter, Tarif, Nummer oder Notiz filtern …"
          aria-label="Verträge filtern"
        />
        {q !== '' && <button type="button" className="eh-vtbl-suche-x" aria-label="Suche leeren" onClick={leeren}><X size={14} aria-hidden="true" /></button>}
        <button type="submit" className="eh-vtbl-suche-btn" aria-label="Suchen"><ArrowRight size={14} aria-hidden="true" /></button>
        {Object.entries(hidden).map(([k, v]) => v !== undefined && <input key={k} type="hidden" name={k} value={v} />)}
      </form>
      <p className="eh-vtbl-treffer" data-live="true" role="status" hidden={!live}>
        {live && <>{live.sichtbar} von {live.total} Verträgen · <button type="button" className="eh-vtbl-reset" onClick={leeren}>Alles zurücksetzen</button></>}
      </p>
    </>
  );
}
