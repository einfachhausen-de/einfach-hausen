"use client";
/**
 * EHActionTiles — die goldene Mitte zwischen Karte und Button (Betreiber
 * 24.09.: „omg das gefaellt mir! das muss ins design system"): flache
 * Aktionskacheln in einer Reihe, je mit Icon-Chip, Titel, einzeiligem
 * Kurztext und Chevron. Ein Klick oeffnet darunter das Aufklapp-Menue im
 * Look des Chat-Plus-Menues; die Punkte bleiben als echte Links im HTML
 * stehen (hidden), damit alles ohne JS auffindbar bleibt.
 * Daten sind bewusst serialisierbar (Strings + Schluessel) — Seiten
 * composeen, die Kachel entscheidet nur ueber Darstellung.
 */
import {useEffect, useRef, useState, type ComponentType} from 'react';
import {EH_ICONS, type EHIconKey} from './icons';
import s from './styles.module.css';

export type EHActionTileIcon = EHIconKey;
export type EHActionTileMenuItem = {label: string; href: string; icon?: EHActionTileIcon};
export type EHActionTile = {
  label: string;
  hint?: string;
  icon?: EHActionTileIcon;
  menuLabel?: string;
  items: EHActionTileMenuItem[];
};


function Tile({tile}: {tile: EHActionTile}) {
  const [offen, setOffen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!offen) return;
    const aufKlick = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOffen(false); };
    const aufTast = (e: KeyboardEvent) => { if (e.key === 'Escape') setOffen(false); };
    document.addEventListener('mousedown', aufKlick);
    document.addEventListener('keydown', aufTast);
    return () => { document.removeEventListener('mousedown', aufKlick); document.removeEventListener('keydown', aufTast); };
  }, [offen]);
  const Icon = tile.icon ? EH_ICONS[tile.icon] : null;
  return (
    <div className={s.actionWrap} ref={wrapRef}>
      <button type="button" className={s.actionTile} aria-haspopup="true" aria-expanded={offen} onClick={() => setOffen((o) => !o)}>
        {Icon && <span className={s.actionIcon} aria-hidden="true"><Icon size={18} /></span>}
        <span className={s.actionText}><strong>{tile.label}</strong>{tile.hint && <small>{tile.hint}</small>}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{display:'block'}}><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div className={s.actionMenu} role="menu" aria-label={tile.menuLabel ?? tile.label} hidden={!offen}>
        {tile.items.map((punkt) => {
          const PunktIcon = punkt.icon ? EH_ICONS[punkt.icon] : null;
          return (
            <a key={punkt.href} role="menuitem" href={punkt.href} onClick={() => setOffen(false)}>
              {PunktIcon && <PunktIcon size={16} />}
              {punkt.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function EHActionTiles({tiles, ariaLabel}: {tiles: EHActionTile[]; ariaLabel?: string}) {
  return (
    <div className={s.actionRow} role="group" aria-label={ariaLabel ?? 'Aktionen'}>
      {tiles.map((tile) => <Tile key={tile.label} tile={tile} />)}
    </div>
  );
}
