'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { Camera, ChevronDown, FileUp, Flame, PenLine, ShieldCheck, Smartphone, Wifi, Zap } from 'lucide-react';
import { AFFILIATE_CATEGORIES, AFFILIATE_CATEGORY_LABELS } from '@/lib/affiliate';

/**
 * Anlage-Menue (Betreiber 24.09.): beide Primäraktionen des Promo-Banners
 * öffnen dasselbe Aufklappfeld im Look des Chat-Plus-Menues — "Vertrag
 * anlegen" mit den drei Eingangswegen (Hochladen, Scannen, Selbst
 * eintragen), "Anbieter vergleichen" mit allen Kategorien, die wir beim
 * Partnervergleich anbieten. Ein Klick auf einen Punkt springt zur
 * zugehörigen Vergleichskarte. Menues bleiben im HTML stehen (hidden) und
 * werden erst per Klick sichtbar — so sind die Wege auch ohne JS auffindbar.
 */
type MenuePunkt = { label: string; href: string; icon?: ComponentType<{ size?: number }> };

function MenueKnopf({
  label, menueLabel, items, tone,
}: {
  label: string;
  menueLabel: string;
  items: MenuePunkt[];
  tone?: 'ghost';
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
    <div className="eh-anlage-wrap" ref={wrapRef}>
      <button
        type="button"
        className={tone === 'ghost' ? 'eh-promo-ghost eh-promo-ghost-btn' : 'eh-promo-button'}
        aria-haspopup="true"
        aria-expanded={offen}
        onClick={() => setOffen((o) => !o)}
      >
        {label}
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      <div className="eh-anlage-menue" role="menu" aria-label={menueLabel} hidden={!offen}>
        {items.map((punkt) => {
          const PunktIcon = punkt.icon;
          return (
            <Link key={punkt.href} role="menuitem" href={punkt.href} onClick={() => setOffen(false)}>
              {PunktIcon && <PunktIcon size={16} />}
              {punkt.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const WEGE: MenuePunkt[] = [
  { label: 'Hochladen', href: '__BASE__?weg=hochladen', icon: FileUp },
  { label: 'Scannen', href: '__BASE__?weg=scannen', icon: Camera },
  { label: 'Selbst eintragen', href: '__BASE__?weg=manuell', icon: PenLine },
];

const VERGLEICH_ICON: Record<string, ComponentType<{ size?: number }>> = {
  strom: Zap, gas: Flame, dsl: Wifi, mobilfunk: Smartphone, versicherung: ShieldCheck,
};

export function AnlageMenue({ base }: { base: string }) {
  const wege = WEGE.map((w) => ({ ...w, href: w.href.replace('__BASE__', base) }));
  const vergleiche: MenuePunkt[] = AFFILIATE_CATEGORIES.map((kategorie) => ({
    label: AFFILIATE_CATEGORY_LABELS[kategorie],
    href: `#vergleich-${kategorie}`,
    icon: VERGLEICH_ICON[kategorie],
  }));
  return (
    <>
      <MenueKnopf label="Vertrag anlegen" menueLabel="Weg zum Vertrag auswählen" items={wege} />
      <MenueKnopf label="Anbieter vergleichen" menueLabel="Kategorie zum Vergleichen auswählen" items={vergleiche} tone="ghost" />
    </>
  );
}
