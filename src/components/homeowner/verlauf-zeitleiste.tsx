"use client";

import Link from "next/link";
import { ChevronDown, History } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import styles from "@/app/app/eigentuemer-start.module.css";

/**
 * Verlauf-Zeitleiste — Haus-Historie als Karten-Muster nach der
 * Betreiber-Vorlage (21st.dev-incident-status-timeline, 23.09.): Kopf mit
 * Symbol (sofortige Erkennung), Statusplakette und Aufklapp-Zeile; darunter
 * die Ereignisse an einer durchgehenden Linie, der neueste Punkt betont.
 * Muster adaptiert, nicht kopiert: hauseigene Tokens statt oklch-Theme,
 * Zustand ueber data-tone, keine Tailwind-Utils.
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
  href: string;
};

export function VerlaufZeitleiste({ eintraege, fuss }: {
  eintraege: readonly VerlaufEintrag[];
  fuss?: string;
}) {
  const aktuell = eintraege[0];
  return (
    <div className={styles.tlCard}>
      <Collapsible defaultOpen>
        <div className={styles.tlHead}>
          <span className={styles.tlIcon} aria-hidden="true"><History size={16} /></span>
          <span className={styles.tlHeadCopy}>
            <strong className={styles.tlHeadTitel}>{aktuell ? aktuell.titel : 'Noch kein Vorgang'}</strong>
            <span className={styles.tlHeadMeta}>
              {aktuell
                ? <>Zuletzt <span data-tone={aktuell.ton}>{aktuell.status}</span> · {aktuell.datum}</>
                : 'Sobald du einen Auftrag anlegst, steht er hier'}
              <span className={styles.tlHeadCount}>{eintraege.length} Vorgaenge</span>
            </span>
          </span>
          {aktuell && <span className={styles.tlBadge} data-tone={aktuell.ton}>{aktuell.status}</span>}
        </div>
        <CollapsibleTrigger className={styles.tlToggle} aria-label="Zeitleiste ein- oder ausklappen">
          Zeitleiste
          <ChevronDown className={styles.tlChevron} size={14} aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          {eintraege.length === 0 ? (
            <p className={styles.tlLeer}>Noch keine Vorgänge. Sobald ein Auftrag läuft, erscheint er hier in der Zeitleiste.</p>
          ) : (
          <ul className={styles.tlList} aria-label="Verlauf als Zeitleiste">
            {eintraege.map((eintrag, i) => (
              <li key={eintrag.id} className={styles.tlItem}>
                <Link className={styles.tlRow} href={eintrag.href}>
                  <span className={styles.tlDot} data-neuest={i === 0 || undefined} aria-hidden="true" />
                  <span className={styles.tlBody}>
                    <strong className={styles.tlTitel}>{eintrag.titel}</strong>
                    <span className={styles.tlBadge} data-tone={eintrag.ton}>{eintrag.status}</span>
                    <time className={styles.tlWhen} dateTime={eintrag.iso}>{eintrag.datum}</time>
                    {eintrag.zusatz && <span className={styles.tlZusatz}>{eintrag.zusatz}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
