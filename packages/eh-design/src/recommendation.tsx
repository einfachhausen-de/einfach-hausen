"use client";
import {useRef, useState} from 'react';
import {ChevronDown} from 'lucide-react';
import {EHButton, EHStatus} from './primitives';
import s from './styles.module.css';

export type EHRecommendationOption = {key: string; provider: string; price: string; note?: string; markers?: string[]};
export type EHRecommendationLabels = {alternatives?: string; other?: string; primary?: string; pending?: string; booked?: string; failed?: string};
const AUSZEICHNUNG_TON: Record<string, 'neutral' | 'success' | 'info' | 'warning'> = {
  'Günstigstes': 'success', 'Schnellster Termin': 'info', 'Neu im Netzwerk': 'neutral', '24/7 Notdienst': 'warning',
};
function auszeichnungen(markers?: string[]) {
  return (markers ?? []).map(marker => <EHStatus key={marker} tone={AUSZEICHNUNG_TON[marker] ?? 'neutral'}>{marker}</EHStatus>);
}
/**
 * Empfehlung mit Alternativen: die Karte stellt eine Entscheidung vor, die
 * gueltige Wahl steht vorausgewaehlt, die uebrigen liegen hinter einem nativ
 * aufklappbaren Fach. `onPrimary` fuehrt die Entscheidung aus - der Aufrufer
 * entscheidet, was das heisst (Server Action) und meldet den Erfolg zurueck;
 * erst danach zeigt die Karte "Gebucht". Hier wird nichts erfunden.
 */
export function EHRecommendation({question, subject, options, href, hrefLabel = 'Vorgang öffnen', onPrimary, labels}: {
  question: string; subject?: string; options: EHRecommendationOption[]; href?: string; hrefLabel?: string;
  onPrimary: (key: string) => Promise<boolean>; labels?: EHRecommendationLabels;
}) {
  const t = {alternatives: 'Andere Angebote', other: 'Weitere Angebote', primary: 'Buchen', pending: 'Wird gebucht …', booked: 'Gebucht', failed: 'Das hat nicht geklappt. Bitte öffne den Vorgang und buche dort.', ...labels};
  const fach = useRef<HTMLDetailsElement>(null);
  const [gewaehlt, setGewaehlt] = useState(0);
  const [gebucht, setGebucht] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState(false);
  if (!options.length) return null;
  const stelle = Math.min(Math.max(gewaehlt, 0), options.length - 1);
  const aktiv = options[stelle];
  const andere = options.map((option, index) => ({option, index})).filter(({index}) => index !== stelle);
  const istGebucht = gebucht === aktiv.key;

  async function buchen() {
    if (busy || istGebucht) return;
    setBusy(true); setFehler(false);
    try {
      if (await onPrimary(aktiv.key)) setGebucht(aktiv.key);
      else setFehler(true);
    } catch { setFehler(true); }
    finally { setBusy(false); }
  }

  return <section className={s.recommendation} aria-label={question}>
    <div className={s.recommendationBody}>
      <p className={s.recommendationQuestion}>{question}</p>
      <p className={s.recommendationText}>
        {subject && <>Auftrag „{subject}“: </>}
        <span className={s.recommendationChip}>
          <span className={s.recommendationInitial} aria-hidden="true">{aktiv.provider.trim().charAt(0).toUpperCase()}</span>{aktiv.provider}
        </span>
        {' '}für <span className={s.recommendationValue}>{aktiv.price}</span>
        {aktiv.note && <span className={s.recommendationAvailability}>{aktiv.note}</span>}
      </p>
    </div>

    {andere.length > 0 && <details className={s.recommendationDrawer} ref={fach}>
      <summary className={s.recommendationToggle}>
        {t.alternatives}
        <ChevronDown className={s.recommendationChevron} size={16} aria-hidden="true" />
      </summary>
      <p className={s.recommendationOther}>{t.other}</p>
      <ul>{andere.map(({option, index}) => <li key={option.key}>
        <button type="button" className={s.recommendationOption} onClick={() => {
          setGewaehlt(index); setGebucht(null); setFehler(false);
          if (fach.current) fach.current.open = false;
        }}>
          <span className={s.recommendationOptionHead}>
            <span className={s.recommendationOptionName}>{option.provider}</span>
            <span className={s.recommendationOptionPrice}>{option.price}</span>
          </span>
          <span className={s.recommendationMarkers}>{auszeichnungen(option.markers)}</span>
        </button>
      </li>)}</ul>
    </details>}

    <div className={s.recommendationFoot}>
      <span className={s.recommendationMarkers}>{istGebucht ? <EHStatus tone="success">{t.booked}</EHStatus> : auszeichnungen(aktiv.markers)}</span>
      <span className={s.recommendationActions}>
        {href && <EHButton href={href} variant="quiet" size="small">{hrefLabel}</EHButton>}
        {!istGebucht && <EHButton variant="primary" size="small" onClick={buchen} disabled={busy} aria-busy={busy || undefined}>
          {busy ? t.pending : t.primary}
        </EHButton>}
      </span>
    </div>
    {istGebucht && <p className={s.recommendationNote}>{`Gebucht: ${aktiv.provider}, ${aktiv.price}. Termin, Zahlung und Ansprechpartner stehen im Vorgang.`}</p>}
    {fehler && <p className={s.recommendationFehler} role="status">{t.failed}</p>}
  </section>;
}
