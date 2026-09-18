"use client";
/**
 * WerkbankSuche — Ausloeser + Palette der Werkbank-Topbar.
 *
 * Die "Suchen"-Pille war zuvor ein Kopierfehler: sie zeigte ein Search-ymbol,
 * linkte aber auf die Benachrichtigungen (Owner) bzw. eine nicht existente
 * Provider-Route. Der Soll-Zustand nach dem Vorbild der directory-Palette
 * (PR Nummer 106) ist ein Tastatur-Kurzbefehl, der ein Menue oeffnet — keine eigene
 * Route. Vorschlaege sind die echten Navigationsbereiche aus nav-config.
 */
import { useEffect, useState, useRef, useId } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { ownerAreas, providerAreas, type NavArea } from './nav-config';
import s from './shell.module.css';

export function WerkbankSuche({ pro, label }: { pro: boolean; label: string }) {
  const areas = (pro ? providerAreas : ownerAreas) as readonly NavArea[];
  const items = areas.flatMap(area => [{ href: area.href, label: area.label }, ...area.children]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [pos, setPos] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) && !(target as HTMLInputElement).readOnly;
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 's') && !typing) {
        e.preventDefault();
        toggle(!open);
      } else if (e.key === 'Escape' && open) {
        toggle(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function toggle(next: boolean) {
    if (next) { setQ(''); setPos(0); }
    setOpen(next);
  }

  function focusInput(el: HTMLInputElement | null) {
    inputRef.current = el;
    el?.focus();
  }

  // Umlaute normalisieren, damit "vertrag" auch "Verträge" findet.
  const norm = (value: string) => value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const needle = norm(q.trim());
  const hits = needle === ''
    ? items
    : items.filter(item => norm(item.label).includes(needle));

  function go(href: string) {
    toggle(false);
    router.push(href);
  }

  if (!open) {
    return (
      <button type="button" className={s.search} aria-label="Suche öffnen (Cmd + K)" onClick={() => toggle(true)}>
        <Search size={16} aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className={s.searchOpen}>
      <div className={s.searchPanel} role="dialog" aria-modal="true" aria-label="Bereichssuche">
        <div className={s.searchField}>
          <Search size={16} aria-hidden="true" />
          <input
            ref={focusInput}
            id={listId + '-input'}
            type="search"
            placeholder="Bereich suchen …"
            value={q}
            onChange={e => { setQ(e.target.value); setPos(0); }}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setPos(p => Math.min(p + 1, hits.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setPos(p => Math.max(p - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); if (hits[pos]) go(hits[pos].href); }
            }}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={hits[pos] ? listId + '-' + pos : undefined}
          />
          <button type="button" className={s.searchClose} aria-label="Suche schließen" onClick={() => setOpen(false)}>Esc</button>
        </div>
        {hits.length === 0
          ? <p className={s.searchEmpty}>Kein Bereich passt zu deiner Eingabe.</p>
          : <ul id={listId} role="listbox" aria-label="Bereiche">
            {hits.slice(0, 12).map((hit, index) => (
              <li key={hit.href + index} role="option" id={listId + '-' + index} aria-selected={index === pos}>
                <button type="button" onMouseEnter={() => setPos(index)} onClick={() => go(hit.href)}>
                  {hit.label}
                </button>
              </li>
            ))}
          </ul>}
      </div>
      <button type="button" className={s.searchBackdrop} aria-label="Suche schließen" onClick={() => setOpen(false)} tabIndex={-1} />
    </div>
  );
}
