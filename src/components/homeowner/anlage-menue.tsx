'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Camera, ChevronDown, FileUp, PenLine } from 'lucide-react';

/**
 * Anlage-Menue (Betreiber 24.09.): "Vertrag anlegen" oeffnet ein Aufklappfeld
 * im Look des Chat-Plus-Menues — Hochladen, Scannen, Selbst eintragen fuehren
 * direkt in den jeweiligen Formular-Weg. Daneben der ruhige Vergleichs-Button.
 * Das Menue bleibt im HTML stehen (hidden) und wird erst per Klick sichtbar —
 * so sind die Wege auch ohne JS auffindbar und pruefbar.
 */
const WEGE = [
  { id: 'hochladen', label: 'Hochladen', icon: FileUp },
  { id: 'scannen', label: 'Scannen', icon: Camera },
  { id: 'manuell', label: 'Selbst eintragen', icon: PenLine },
] as const;

export function AnlageMenue({ base, vergleichHref }: { base: string; vergleichHref: string }) {
  const [offen, setOffen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!offen) return;
    const onKlick = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOffen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOffen(false); };
    document.addEventListener('mousedown', onKlick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onKlick); document.removeEventListener('keydown', onKey); };
  }, [offen]);
  return (
    <>
      <div className="eh-anlage-wrap" ref={wrapRef}>
        <button type="button" className="eh-promo-button" aria-haspopup="true" aria-expanded={offen} onClick={() => setOffen((o) => !o)}>
          Vertrag anlegen
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        <div className="eh-anlage-menue" role="menu" aria-label="Weg zum Vertrag auswählen" hidden={!offen}>
          {WEGE.map((weg) => (
            <Link key={weg.id} role="menuitem" href={`${base}?weg=${weg.id}`} onClick={() => setOffen(false)}>
              <weg.icon size={16} aria-hidden="true" />
              {weg.label}
            </Link>
          ))}
        </div>
      </div>
      <a className="eh-promo-ghost" href={vergleichHref}>Anbieter vergleichen</a>
    </>
  );
}
