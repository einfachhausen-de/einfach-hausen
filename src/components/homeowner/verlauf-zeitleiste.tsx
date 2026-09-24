"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, ChevronDown, ChevronRight, History } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import styles from "@/app/app/eigentuemer-start.module.css";

/**
 * Verlauf-Zeitleiste — Haus-Historie als Karten-Muster nach der
 * Betreiber-Vorlage (21st.dev-incident-status-timeline, 23.09.). Der Kopf
 * fuehrt NUR die Verlaufs-Bilanz (Anzahlen, Stand) — kein Einzelvorgang und
 * kein Termin-Status, damit die Karte eindeutig „Historie" ist und nicht wie
 * eine Termin-Erinnerung wirkt (Betreiber-Order 23.09.: 'Historie oder
 * Termin?'). Vorgaenge erscheinen ausschliesslich in der Liste darunter,
 * der naechste Schritt steht als eigene 'Als naechstes'-Zeile ueber der
 * Karte (VerlaufNaechstes), nicht mehr als Fuss in ihr. Zwei Gruppen:
 * „Anstehend“ (gefuellte Petrol-Punkte) und „Vergangen“ (hohle graue Punkte,
 * blassere Schrift) — damit auf einen Blick erkennbar ist, was noch laeuft
 * und was erledigt ist (Betreiber-Nachschurf 23.09.). Ueber MAX_SICHTBAR
 * hinaus verbirgt sich der Rest hinter „Mehr anzeigen“.
 * Muster adaptiert, nicht kopiert: hauseigene Tokens statt oklch-Theme,
 * Zustand ueber data-tone/data-vergangen, keine Tailwind-Utils.
 */
export type VerlaufEintrag = {
  id: string;
  titel: string;
  status: string;
  ton: "neutral" | "info" | "ok" | "warn";
  /** Kurzdatum zur Anzeige, z. B. „24.09.“. */
  datum: string;
  /** Maschinenlesbarer Wert fuer <time> (ISO), wenn vorhanden. */
  iso?: string;
  /** Zeile unter dem Titel, z. B. „Termin 10:00 Uhr“. */
  zusatz?: string;
  /** Erledigte oder abgebrochene Vorgaenge: blassere Schrift (Betreiber-Order). */
  vergangen?: boolean;
  href: string;
};

/** So viele Vorgaenge zeigt die Zeitleiste im Ruhezustand. */
const MAX_SICHTBAR = 5;

/** Bilanz-Kopf: wie viele Vorgaenge, wie davon offen; `stand` = Kurzdatum. */
export function VerlaufZeitleiste({ eintraege, stand }: {
  eintraege: readonly VerlaufEintrag[];
  stand?: string;
}) {
  const [alle, setAlle] = useState(false);
  const anstehend = eintraege.filter((e) => !e.vergangen);
  const vergangene = eintraege.filter((e) => e.vergangen);
  // Anstehendes ist der handlungsrelevante Teil und bleibt voll staendig;
  // gekuerzt wird nur das Vergangene, bis die Zeilenfuellung erreicht ist.
  const restPlatz = Math.max(0, MAX_SICHTBAR - anstehend.length);
  const sichtbar = alle ? vergangene : vergangene.slice(0, restPlatz);
  const verborgen = vergangene.length - sichtbar.length;
  const neuesteId = eintraege[0]?.id;

  const zeile = (eintrag: VerlaufEintrag) => (
    <li key={eintrag.id} className={styles.tlItem}>
      <Link className={styles.tlRow} href={eintrag.href} data-vergangen={eintrag.vergangen || undefined}>
        <span className={styles.tlDot} data-neuest={eintrag.id === neuesteId || undefined} aria-hidden="true" />
        <span className={styles.tlBody}>
          <strong className={styles.tlTitel}>{eintrag.titel}</strong>
          <span className={styles.tlBadge} data-tone={eintrag.ton}>{eintrag.status}</span>
          <time className={styles.tlWhen} dateTime={eintrag.iso}>{eintrag.datum}</time>
          {eintrag.zusatz && <span className={styles.tlZusatz}>{eintrag.zusatz}</span>}
        </span>
      </Link>
    </li>
  );

  const offen = anstehend.length;
  const vergangen = vergangene.length;
  return (
    <div className={styles.tlCard}>
      <Collapsible defaultOpen>
        <div className={styles.tlHead}>
          <span className={styles.tlIcon} aria-hidden="true"><History size={16} /></span>
          <span className={styles.tlHeadCopy}>
            <strong className={styles.tlHeadTitel}>{eintraege.length === 0 ? 'Noch kein Vorgang' : `${eintraege.length} Vorgänge im Verlauf`}</strong>
            <span className={styles.tlHeadMeta}>
              {eintraege.length === 0
                ? 'Sobald du einen Auftrag anlegst, steht er hier'
                : <>{offen} anstehend · {vergangen} vergangen{stand ? ` · Stand ${stand}` : ''}</>}
            </span>
          </span>
        </div>
        <CollapsibleTrigger className={styles.tlToggle} aria-label="Zeitleiste ein- oder ausklappen">
          Zeitleiste
          <ChevronDown className={styles.tlChevron} size={14} aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          {eintraege.length === 0 ? (
            <p className={styles.tlLeer}>Noch keine Vorgänge. Sobald ein Auftrag läuft, erscheint er hier in der Zeitleiste.</p>
          ) : (
            <div className={styles.tlGruppen}>
              {anstehend.length > 0 && (
                <div>
                  <p className={styles.tlGruppe}>Anstehend &amp; laufend</p>
                  <ul className={styles.tlList} aria-label="Noch offene und laufende Vorgaenge">
                    {anstehend.map(zeile)}
                  </ul>
                </div>
              )}
              {sichtbar.length > 0 && (
                <div>
                  <p className={styles.tlGruppe}>Vergangen</p>
                  <ul className={styles.tlList} aria-label="Abgeschlossene Vorgaenge">
                    {sichtbar.map(zeile)}
                  </ul>
                </div>
              )}
              {(verborgen > 0 || alle) && (
                <button
                  type="button"
                  className={styles.tlMehr}
                  onClick={() => setAlle((v) => !v)}
                  aria-expanded={alle}
                >
                  {alle ? 'Weniger anzeigen' : `Mehr anzeigen (${verborgen} weitere)`}
                </button>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/**
 * 'Als naechstes'-Zeile ueber der Verlaufs-Karte (Betreiber-Order 23.09.):
 * der naechste Schritt (Termin oder offene Entscheidung) fuehrt die Historie,
 * statt in ihr unteruzutauchen. Eigener Link, eigene Beschriftung.
 */
export function VerlaufNaechstes({ label, titel, wann, href }: {
  label: string;
  titel: string;
  wann?: string;
  href: string;
}) {
  return (
    <Link className={styles.tlNext} href={href}>
      <span className={styles.tlNextIcon} aria-hidden="true"><CalendarClock size={16} /></span>
      <span className={styles.tlNextLabel}>{label}</span>
      <strong className={styles.tlNextTitel}>{titel}</strong>
      {wann && <span className={styles.tlNextWhen}>{wann}</span>}
      <ChevronRight className={styles.tlNextChev} size={16} aria-hidden="true" />
    </Link>
  );
}
