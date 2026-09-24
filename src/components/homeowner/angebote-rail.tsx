'use client';

/**
 * AngebotsRail (Betreiber 24.09., Wolt-Vorbild): Die Sektion zeigt standardmaessig
 * nur Vorschlaege — Kacheln, bei denen der Partner einen besseren Tarif hat als
 * der erfasste eigene. "Alle ansehen" holt den Rest dazu. Weil die Kachel-Menues
 * der Schnellaktionen auf #vergleich-<kategorie> springen, wird automatisch
 * aufgeklappt, sobald ein Sprungziel gerade ausgeblendet waere.
 */
import { useEffect, useState } from 'react';
import { EHOfferCard, type EHOfferCardProps } from '@/design-system';
import { CompareRail } from './compare-rail';

export type AngebotsKachel = EHOfferCardProps & { vorschlag: boolean };

export function AngebotsRail({ cards, label = 'Angebote nebeneinander' }: { cards: AngebotsKachel[]; label?: string }) {
  const vorschlaege = cards.filter((c) => c.vorschlag);
  const ausblendbar = vorschlaege.length > 0 && vorschlaege.length < cards.length;
  const [alle, setAlle] = useState(!ausblendbar);
  useEffect(() => {
    const pruefe = () => {
      const tiefe = window.location.hash.replace(/^#/, '');
      if (tiefe && cards.some((c) => c.id === tiefe && !c.vorschlag)) setAlle(true);
    };
    pruefe();
    window.addEventListener('hashchange', pruefe);
    return () => window.removeEventListener('hashchange', pruefe);
  }, [cards]);
  const sichtbar = alle ? cards : vorschlaege;
  return (
    <>
      {ausblendbar && (
        <p className="eh-angebot-schalter">
          {alle ? (
            <button type="button" onClick={() => setAlle(false)}>Weniger anzeigen</button>
          ) : (
            <button type="button" onClick={() => setAlle(true)}>{`Alle ansehen (${cards.length - vorschlaege.length} weitere)`}</button>
          )}
        </p>
      )}
      <CompareRail label={label}>
        <div className="eh-vergleich-slider">
          {sichtbar.map((kachel) => (
            <EHOfferCard key={kachel.id ?? kachel.title} {...kachel} />
          ))}
        </div>
      </CompareRail>
    </>
  );
}
