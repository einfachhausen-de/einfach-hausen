"use client";
import {useCallback, useId, useState, useSyncExternalStore, type ReactNode} from "react";
import {EHEmptyState, EHField, EHInput} from "./app";
import {EHActions, EHButton} from "./primitives";
import type {EHRecordEntry} from "./workspace-records";
import {EHRecordCards, EHRecordList, EHRecordTimeline} from "./workspace-records";
import s from "./styles.module.css";

export const EH_RECORD_VIEWS = ["liste", "karten", "chronik"] as const;
export type EHRecordView = (typeof EH_RECORD_VIEWS)[number];

const STORAGE_PREFIX = "eh-ansicht:";
/** Rauf und runter im selben Tab: "storage" hoert nur auf fremde Tabs. */
const STORAGE_EVENT = "eh-ansicht";

const VIEW_LABELS: Record<EHRecordView, string> = {liste: "Liste", karten: "Karten", chronik: "Chronik"};

const VIEW_ICONS: Record<EHRecordView, ReactNode> = {
  liste: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>,
  karten: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  chronik: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M6 3v3m0 4v4m0 4v3M12 8h9M12 16h9"/><rect x="4" y="6" width="4" height="4" rx="1"/><rect x="4" y="14" width="4" height="4" rx="1"/></svg>,
};

function isRecordView(value: string | null): value is EHRecordView {
  return value === "liste" || value === "karten" || value === "chronik";
}

function readStoredView(key: string): EHRecordView | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return isRecordView(raw) ? raw : null;
  } catch {
    // Privater Modus oder kein Speicher: dann gilt die Auswahl nur fuer diese Seite.
    return null;
  }
}

/**
 * Die gewaehlte Ansicht ueberlebt im LocalStorage - ein URL-Parameter wuerde
 * jede der 41 Seiten zwingen, searchParams zu lesen und weiterzureichen, und
 * jeder Umschalter waere ein Server-Roundtrip. Geteilt werden kann sie so
 * nicht; das ist der Preis, den diese Codebasis (siehe EHSidebar) schon zahlt.
 */
export function useEHRecordView(storageKey = "standard", fallback: EHRecordView = "liste") {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("storage", onChange);
    window.addEventListener(STORAGE_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(STORAGE_EVENT, onChange);
    };
  }, []);

  const read = useCallback(() => readStoredView(storageKey) ?? fallback, [storageKey, fallback]);
  const stored = useSyncExternalStore(subscribe, read, () => fallback);
  const [chosen, setChosen] = useState<EHRecordView | null>(null);

  const setView = useCallback((next: EHRecordView) => {
    setChosen(next);
    try {
      window.localStorage.setItem(STORAGE_PREFIX + storageKey, next);
    } catch {
      return;
    }
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }, [storageKey]);

  return [chosen ?? stored, setView] as const;
}

export function EHViewSwitcher({label = "Ansicht wechseln", value, onChange, views = EH_RECORD_VIEWS}: {
  label?: string;
  value: EHRecordView;
  onChange: (view: EHRecordView) => void;
  views?: readonly EHRecordView[];
}) {
  return (
    <div className={s.viewSwitcher} role="group" aria-label={label}>
      {views.map((view) => (
        <button
          key={view}
          type="button"
          data-view={view}
          aria-pressed={value === view}
          onClick={() => onChange(view)}
        >
          {VIEW_ICONS[view]}
          <span>{VIEW_LABELS[view]}</span>
        </button>
      ))}
    </div>
  );
}

/** Umschalter und Darstellung in einem Stueck - der Normalfall fuer eine Seite. */
export function EHRecordViews({label, items, empty, views = EH_RECORD_VIEWS, defaultView = "liste", storageKey = "standard", switcherLabel, searchLabel, searchPlaceholder = "Titel, Details oder Datum"}: {
  label: string;
  items: readonly EHRecordEntry[];
  empty?: ReactNode;
  views?: readonly EHRecordView[];
  defaultView?: EHRecordView;
  storageKey?: string;
  switcherLabel?: string;
  /** Optional: durchsucht nur den bereits geladenen Bestand dieser Liste. */
  searchLabel?: string;
  searchPlaceholder?: string;
}) {
  const [view, setView] = useEHRecordView(storageKey, defaultView);
  const searchId = useId();
  const [query, setQuery] = useState("");
  const terms = searchLabel ? query.trim().toLocaleLowerCase("de-DE").split(/\s+/u).filter(Boolean) : [];
  const found = terms.length ? items.filter(item => {
    const text = [item.title, item.detail, item.value, item.note, item.date, item.dateLabel].filter(Boolean).join(" ").toLocaleLowerCase("de-DE");
    return terms.every(term => text.includes(term));
  }) : items;
  const activeView = views.includes(view) ? view : views.includes(defaultView) ? defaultView : views[0] ?? "liste";
  function clearSearch() {
    setQuery("");
    document.getElementById(searchId)?.focus();
  }

  return (
    <div className={s.recordViews}>
      {searchLabel && <>
        <EHField id={searchId} label={searchLabel}>
          <EHInput id={searchId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={searchPlaceholder} aria-describedby={searchId+"-count"}/>
        </EHField>
        <EHActions>
          <p id={searchId+"-count"} className={s.fieldHint} role="status">{found.length} von {items.length} Einträgen</p>
          {query && <EHButton type="button" variant="secondary" onClick={clearSearch}>Suche zurücksetzen</EHButton>}
        </EHActions>
      </>}
      <EHViewSwitcher label={switcherLabel} value={activeView} onChange={setView} views={views}/>

      {terms.length > 0 && found.length === 0 ? <EHEmptyState title="Keine Treffer" text="Ändere den Suchbegriff oder setze die Suche zurück, um wieder alle Einträge zu sehen."/> : <>
        {activeView === "liste" && <EHRecordList label={label} items={found} empty={empty}/>}
        {activeView === "karten" && <EHRecordCards label={label} items={found} empty={empty}/>}
        {activeView === "chronik" && <EHRecordTimeline label={label} items={found} empty={empty}/>}
      </>}
    </div>
  );
}
