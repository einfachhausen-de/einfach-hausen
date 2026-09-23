"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import styles from "@/app/app/eigentuemer-start.module.css";

/**
 * Verlauf-Zeitleiste — Haus-Historie als Karten-Muster nach der
 * Betreiber-Vorlage (21st.dev-incident-status-timeline, 23.09.). Kopf mit
 * Symbol, Statusplakette und Aufklapp-Zeile; darunter ZWEI Gruppen:
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

export function VerlaufZeitleiste({ eintraege, fuss }: {
  eintraege: readonly VerlaufEintrag[];
  fuss?: string;
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

  return (
    <div className={styles.tlCard}>
      <Collapsible defaultOpen>
        <div className={styles.tlHead}>
          <span className={styles.tlIcon} aria-hidden="true"><History size={16} /></span>
          <span className={styles.tlHeadCopy}>
            <strong className={styles.tlHeadTitel}>{eintraege[0] ? eintraege[0].titel : 'Noch kein Vorgang'}</strong>
            <span className={styles.tlHeadMeta}>
              {eintraege[0]
                ? <>Zuletzt <span data-tone={eintraege[0].ton}>{eintraege[0].status}</span> · {eintraege[0].datum}</>
                : 'Sobald du einen Auftrag anlegst, steht er hier'}
              <span className={styles.tlHeadCount}>{eintraege.length} Vorgänge</span>
            </span>
          </span>
          {eintraege[0] && <span className={styles.tlBadge} data-tone={eintraege[0].ton}>{eintraege[0].status}</span>}
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
          {fuss && (
            <>
              <span className={styles.tlTrenn} aria-hidden="true" />
              <p className={styles.tlFuss}>{fuss}</p>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
