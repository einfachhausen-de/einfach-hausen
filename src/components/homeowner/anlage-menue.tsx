'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { BarChart3, Camera, ChevronDown, FileUp, Flame, PenLine, ShieldCheck, Smartphone, Wifi, Zap } from 'lucide-react';
import { AFFILIATE_CATEGORIES, AFFILIATE_CATEGORY_LABELS } from '@/lib/affiliate';

/**
 * Schnellaktionen-Kacheln (Betreiber 24.09., „goldene Mitte zwischen Cards
 * und Buttons"): flache Kachel mit Icon-Chip, Titel, Kurztext und Chevron —
 * Klick oeffnet darunter das Aufklapp-Menue im Look des Chat-Plus-Menues.
 * Vertrag erfassen: die drei Wege; Anbieter vergleichen: alle Kategorien,
 * die wir beim Partnervergleich anbieten. Punkte bleiben als echte Links im
 * HTML stehen (hidden), damit es ohne JS auffindbar ist.
 */
type Punkt = { label: string; href: string; icon: ComponentType<{ size?: number }> };

function Kachel({ title, hint, icon: Icon, items, menueLabel }: {
  title: string;
  hint: string;
  icon: ComponentType<{ size?: number }>;
  items: Punkt[];
  menueLabel: string;
}) {
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
    <div className="eh-akt-wrap" ref={wrapRef}>
      <button type="button" className="eh-akt-tile" aria-haspopup="true" aria-expanded={offen} onClick={() => setOffen((o) => !o)}>
        <span className="eh-akt-ic" aria-hidden="true"><Icon size={18} /></span>
        <span className="eh-akt-tx"><strong>{title}</strong><small>{hint}</small></span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      <div className="eh-akt-menue" role="menu" aria-label={menueLabel} hidden={!offen}>
        {items.map((punkt) => {
          const PunktIcon = punkt.icon;
          return (
            <Link key={punkt.href} role="menuitem" href={punkt.href} onClick={() => setOffen(false)}>
              <PunktIcon size={16} />
              {punkt.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const VERGLEICH_ICON: Record<string, ComponentType<{ size?: number }>> = {
  strom: Zap, gas: Flame, dsl: Wifi, mobilfunk: Smartphone, versicherung: ShieldCheck,
};

export function AnlageMenue({ base }: { base: string }) {
  const wege: Punkt[] = [
    { label: 'Hochladen', href: `${base}?weg=hochladen`, icon: FileUp },
    { label: 'Scannen', href: `${base}?weg=scannen`, icon: Camera },
    { label: 'Selbst eintragen', href: `${base}?weg=manuell`, icon: PenLine },
  ];
  const vergleiche: Punkt[] = AFFILIATE_CATEGORIES.map((kategorie) => ({
    label: AFFILIATE_CATEGORY_LABELS[kategorie],
    href: `#vergleich-${kategorie}`,
    icon: VERGLEICH_ICON[kategorie],
  }));
  return (
    <div className="eh-akt-row">
      <Kachel title="Vertrag erfassen" hint="Beleg rein — die KI liest Anbieter, Frist, Titel" icon={FileUp} items={wege} menueLabel="Weg zum Vertrag auswählen" />
      <Kachel title="Anbieter vergleichen" hint="Fünf Kategorien, Vergleich beim Partner" icon={BarChart3} items={vergleiche} menueLabel="Kategorie zum Vergleichen auswählen" />
    </div>
  );
}
