"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EHButton, EHActions, EHCallout, EHFormFeedback, EHText, EHWorkflowStack,
} from "@/design-system";
import {
  BACKUP_ERROR_COPY, detectPlatform, isNativeApp, runBackupRound, startAutoRestore, suggestedProvider,
  type BackupError, type NativeCloudProvider,
} from "@/lib/cloud-backup-bridge";
import styles from "./settings.module.css";

type Status = {
  provider: "google-drive" | "icloud" | "none";
  auto_restore: boolean;
  linked_at: string | null;
  operational: number;
  archived: number;
  pending: number;
  last_archived_at: string | null;
};

const PROVIDER_LABEL: Record<string, string> = {
  "google-drive": "Google Drive",
  icloud: "iCloud",
  none: "Aus",
};

// BYOS-Backup-Karte ("Hausakte-Backup in deiner Cloud"): Wahl der
// Nutzer-Cloud, Auto-Rückholung, Status und Backup-Jetzt. Liste, Suche und
// KI-Übersicht bleiben immer verfügbar — hier geht es nur um das Archiv der
// großen Originale. Volle oder ausgeloggte Cloud löscht nichts; das Backup
// pausiert dann mit klarem Hinweis.
export function CloudBackupCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<"load" | "save" | "backup" | null>("load");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/account/cloud-backup/status", { method: "GET" });
      if (!res.ok) throw new Error("status");
      setStatus(await res.json());
    } catch {
      setError("Backup-Status konnte nicht geladen werden.");
    } finally {
      setBusy((b) => (b === "load" ? null : b));
    }
  }, []);

  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const res = await fetch("/api/account/cloud-backup/status", { method: "GET" });
        if (!res.ok) throw new Error("status");
        const data = await res.json();
        if (live) setStatus(data);
      } catch {
        if (live) setError("Backup-Status konnte nicht geladen werden.");
      } finally {
        if (live) setBusy((b) => (b === "load" ? null : b));
      }
    };
    void load();
    // Hintergrund-Abgleich: erfüllt Rückholaufträge (auch von der KI) von allein.
    const stop = startAutoRestore(60_000);
    return () => { live = false; stop(); };
  }, []);

  async function choose(provider: "google-drive" | "icloud" | "none") {
    setError("");
    setNotice("");
    setBusy("save");
    try {
      const res = await fetch("/api/account/cloud-backup/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, auto_restore: status?.auto_restore ?? true }),
      });
      if (!res.ok) throw new Error("save");
      setStatus(await res.json());
      setNotice(provider === "none" ? "Cloud-Backup ist ausgeschaltet." : "Gespeichert. Das Backup nutzt ab jetzt deine Cloud.");
    } catch {
      setError("Konnte nicht gespeichert werden. Bitte später erneut versuchen.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleAutoRestore(next: boolean) {
    if (!status || status.provider === "none") return;
    setBusy("save");
    try {
      const res = await fetch("/api/account/cloud-backup/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: status.provider, auto_restore: next }),
      });
      if (!res.ok) throw new Error("save");
      setStatus(await res.json());
    } catch {
      setError("Konnte nicht gespeichert werden.");
    } finally {
      setBusy(null);
    }
  }

  async function backupNow() {
    if (!status || status.provider === "none") return;
    setError("");
    setNotice("");
    setBusy("backup");
    try {
      const result = await runBackupRound(status.provider as NativeCloudProvider);
      await refresh();
      if (result.error) {
        const known = (BACKUP_ERROR_COPY as Record<string, string>)[result.error.code] ?? result.error.message;
        if (result.error.code === "NATIVE_PLUGIN_MISSING") {
          setNotice("Manifest heruntergeladen. In der nativen App läuft das Backup vollautomatisch in deine Cloud.");
        } else {
          setError(known);
        }
        if (result.confirmed > 0) setNotice(`${result.confirmed} Dateien sind jetzt sicher in deiner Cloud.`);
      } else {
        setNotice(result.confirmed > 0
          ? `${result.confirmed} Dateien sind jetzt sicher in deiner Cloud.`
          : "Alles ist bereits gesichert.");
      }
    } catch (e) {
      setError(e instanceof Error && e.message in BACKUP_ERROR_COPY
        ? BACKUP_ERROR_COPY[e.message as keyof typeof BACKUP_ERROR_COPY]
        : "Backup fehlgeschlagen. Bitte später erneut versuchen.");
    } finally {
      setBusy(null);
    }
  }

  if (busy === "load" || !status) {
    return <p className={styles.statusLine}>Cloud-Backup wird geprüft …</p>;
  }

  const platform = detectPlatform();
  const hint = suggestedProvider();
  const native = isNativeApp();

  return (
    <EHWorkflowStack>
      <EHText muted>
        Deine Hausakte gehört dir: Namen, Minibilder und Daten bleiben immer in der App —
        die großen Originale sichert die App in {platform === "ios" ? "deiner iCloud" : platform === "android" ? "deinem Google Drive" : "deiner Cloud (Google Drive oder iCloud)"}.
        Das kostet dich nichts extra.
      </EHText>
      {error && <EHFormFeedback kind="error">{error}</EHFormFeedback>}
      {notice && <EHCallout title="Cloud-Backup"><EHText>{notice}</EHText></EHCallout>}

      <div className={styles.statusGrid} role="status" aria-live="polite">
        <div><span>Dateien</span><strong>{status.operational}</strong></div>
        <div><span>Sicher in deiner Cloud</span><strong>{status.archived}</strong></div>
        <div><span>Wartet auf Rückholung</span><strong>{status.pending}</strong></div>
        <p>
          {status.provider === "none"
            ? `Vorschlag für dieses Gerät: ${PROVIDER_LABEL[hint]}.`
            : `Aktiv: ${PROVIDER_LABEL[status.provider]}${status.last_archived_at ? ` · letztes Backup ${new Date(status.last_archived_at).toLocaleDateString("de-DE")}` : ""}.`
          } {native ? "Native App erkannt." : "Web-Vorschau: Manifest-Download statt Direkt-Upload."}
        </p>
      </div>

      <EHActions>
        <EHButton variant={status.provider === "google-drive" ? "primary" : "secondary"} onClick={() => choose("google-drive")} disabled={busy !== null}>
          Google Drive
        </EHButton>
        <EHButton variant={status.provider === "icloud" ? "primary" : "secondary"} onClick={() => choose("icloud")} disabled={busy !== null}>
          iCloud
        </EHButton>
        {status.provider !== "none" && (
          <EHButton variant="secondary" onClick={() => choose("none")} disabled={busy !== null}>
            Ausschalten
          </EHButton>
        )}
      </EHActions>

      {status.provider !== "none" && (
        <EHWorkflowStack>
          <label className={styles.statusLine} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={status.auto_restore}
              disabled={busy !== null}
              onChange={(e) => toggleAutoRestore(e.target.checked)}
              aria-label="Dateien automatisch aus meiner Cloud zurückholen"
              style={{ width: 20, height: 20 }}
            />
            Dateien automatisch zurückholen (auch wenn die KI sie braucht)
          </label>
          <EHActions>
            <EHButton variant="primary" onClick={backupNow} disabled={busy !== null}>
              {busy === "backup" ? "Sichert …" : "Jetzt sichern"}
            </EHButton>
          </EHActions>
          <EHText muted>
            Volle oder ausgeloggte Cloud? Es geht nichts verloren — das Backup pausiert nur und meldet sich.
          </EHText>
        </EHWorkflowStack>
      )}
    </EHWorkflowStack>
  );
}

export type { BackupError };
