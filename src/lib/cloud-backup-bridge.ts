// Client-Brücke für das BYOS-Backup ("Hausakte-Backup in deiner Cloud").
//
// Aufgaben:
// - Plattform erkennen (Android → Google Drive, iOS → iCloud, Web → Export).
// - Offene Rückholaufträge pollen und automatisch aus der Nutzer-Cloud
//   zurückholen (Auto-Restore, auch wenn die KI die Datei angefordert hat).
// - Klare Fehlermeldungen für: Cloud voll, ausgeloggt, Token abgelaufen.
//
// Native Upload-/Download-Pfade (Drive REST v3 appDataFolder, CloudKit
// private DB) leben im Capacitor-Plugin `EHCloudBackup` (nativ: Kotlin/Swift
// + OAuth-/CloudKit-Berechtigungen + Store-Credentials). Diese Brücke
// definiert die JS-Schnittstelle dazu, verdrahtet alles, was ohne
// Store-Credentials geht (Status, Manifest, Confirm, Rehydrate, Web-Fallback)
// und wirft für native Uploads bis zur Plugin-Lieferung einen eindeutigen
// NATIVE_PLUGIN_MISSING-Fehler statt still zu scheitern.

export type NativeCloudProvider = 'google-drive' | 'icloud';

export type BackupErrorCode =
  | 'CLOUD_FULL'
  | 'NOT_LOGGED_IN'
  | 'TOKEN_EXPIRED'
  | 'NETWORK'
  | 'NATIVE_PLUGIN_MISSING'
  | 'HASH_MISMATCH'
  | 'UNKNOWN';

export class BackupError extends Error {
  code: BackupErrorCode;
  constructor(code: BackupErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export const BACKUP_ERROR_COPY: Record<BackupErrorCode, string> = {
  CLOUD_FULL: 'Deine Cloud ist voll. Es geht nichts verloren — das Backup pausiert, bis wieder Platz ist.',
  NOT_LOGGED_IN: 'Bitte melde dich in deiner Cloud an (Google oder Apple), dann läuft das Backup weiter.',
  TOKEN_EXPIRED: 'Die Cloud-Anmeldung ist abgelaufen. Bitte einmal neu anmelden.',
  NETWORK: 'Keine Verbindung. Das Backup wird automatisch nachgeholt.',
  NATIVE_PLUGIN_MISSING: 'Der native Cloud-Zugriff ist in dieser Vorschau noch nicht aktiv — nutze den Web-Export.',
  HASH_MISMATCH: 'Eine Datei kam beschädigt an und wurde nicht übernommen. Versuch es erneut.',
  UNKNOWN: 'Backup fehlgeschlagen. Bitte später erneut versuchen.',
};

declare global {
  interface Window {
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
    EHCloudBackup?: NativeBridge;
  }
}

// Vom nativen Plugin implementiert (Kotlin/Swift). Jede Datei wird vor dem
// Upload mit dem Nutzer-Passwort verschlüsselt (WhatsApp-Modell: E2E-Backup).
export interface NativeBridge {
  provider(): Promise<NativeCloudProvider>;
  uploadFile(entry: { stored_path: string; bytes: ArrayBuffer; mime: string }): Promise<{ archive_ref: string }>;
  downloadFile(entry: { archive_ref: string; provider: NativeCloudProvider }): Promise<ArrayBuffer>;
}

function nativeBridge(): NativeBridge | null {
  if (typeof window === 'undefined') return null;
  return window.EHCloudBackup ?? null;
}

export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.Capacitor?.isNativePlatform?.() === true; } catch { return false; }
}

export function detectPlatform(): 'android' | 'ios' | 'web' {
  if (typeof window === 'undefined') return 'web';
  const cap = window.Capacitor?.getPlatform?.();
  if (cap === 'android') return 'android';
  if (cap === 'ios') return 'ios';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  return 'web';
}

export function suggestedProvider(): NativeCloudProvider {
  return detectPlatform() === 'ios' ? 'icloud' : 'google-drive';
}

export interface ManifestEntry {
  kind: string;
  id: number;
  title: string;
  stored_path: string;
  fetch_path: string | null;
  mime: string;
  byte_size: number | null;
  sha256: string | null;
  archived: boolean;
  archive_provider: NativeCloudProvider | null;
  operational: boolean;
}

export function backupErrorFromStatus(status: number): BackupError {
  if (status === 401 || status === 403) return new BackupError('NOT_LOGGED_IN', BACKUP_ERROR_COPY.NOT_LOGGED_IN);
  if (status === 429) return new BackupError('NETWORK', BACKUP_ERROR_COPY.NETWORK);
  if (status >= 500) return new BackupError('NETWORK', BACKUP_ERROR_COPY.NETWORK);
  return new BackupError('UNKNOWN', BACKUP_ERROR_COPY.UNKNOWN);
}

// Web-Fallback: Manifest als JSON herunterladen (Muster: AccountActions-Export).
// Der Nutzer kann die Datei selbst in Drive/iCloud legen; die native App
// lädt sie später tröpfchenweise hoch und bestätigt per /confirm.
export async function downloadManifestFallback(): Promise<void> {
  const res = await fetch('/api/account/cloud-backup/manifest', { method: 'GET' });
  if (!res.ok) throw backupErrorFromStatus(res.status);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `einfach-hausen-cloud-manifest-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export interface BackupRunResult { uploaded: number; confirmed: number; failed: number; error: BackupError | null }

// Eine Backup-Runde: Manifest holen → fehlende Originale in die Nutzer-Cloud
// hochladen → byte-identische Kopien per Hash bestätigen (erst dann dünnt der
// Server aus). Bricht bei voller Cloud ab, ohne etwas zu löschen.
export async function runBackupRound(provider: NativeCloudProvider): Promise<BackupRunResult> {
  const bridge = nativeBridge();
  if (!bridge) {
    await downloadManifestFallback();
    return { uploaded: 0, confirmed: 0, failed: 0, error: new BackupError('NATIVE_PLUGIN_MISSING', BACKUP_ERROR_COPY.NATIVE_PLUGIN_MISSING) };
  }
  const manifestRes = await fetch('/api/account/cloud-backup/manifest', { method: 'GET' });
  if (!manifestRes.ok) return { uploaded: 0, confirmed: 0, failed: 0, error: backupErrorFromStatus(manifestRes.status) };
  const manifest = (await manifestRes.json()) as { files: ManifestEntry[] };
  const pending = manifest.files.filter((f) => !f.archived && f.operational && f.fetch_path && f.sha256);
  const uploads: Array<{ stored_path: string; archive_ref: string; sha256: string }> = [];
  let failed = 0;
  let fatal: BackupError | null = null;
  for (const entry of pending.slice(0, 50)) {
    try {
      const bytes = await (await fetch(entry.fetch_path as string)).arrayBuffer();
      const { archive_ref } = await bridge.uploadFile({ stored_path: entry.stored_path, bytes, mime: entry.mime });
      uploads.push({ stored_path: entry.stored_path, archive_ref, sha256: entry.sha256 as string });
    } catch (error) {
      failed += 1;
      if (error instanceof BackupError && (error.code === 'CLOUD_FULL' || error.code === 'NOT_LOGGED_IN' || error.code === 'TOKEN_EXPIRED')) {
        fatal = error;
        break;
      }
      fatal = error instanceof BackupError ? error : new BackupError('UNKNOWN', BACKUP_ERROR_COPY.UNKNOWN);
    }
  }
  let confirmed = 0;
  if (uploads.length > 0) {
    const confirmRes = await fetch('/api/account/cloud-backup/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider, uploads }),
    });
    if (confirmRes.ok) {
      const done = (await confirmRes.json()) as { ok: number };
      confirmed = done.ok;
    }
  }
  return { uploaded: uploads.length, confirmed, failed, error: fatal };
}

export interface RestoreRunResult { restored: number; error: BackupError | null }

// Auto-Restore: offene Rückholaufträge (von Web/KI/Öffnen angefordert) aus
// der Nutzer-Cloud holen und serverseitig wiederherstellen — ohne Zutun.
export async function runRestoreRound(): Promise<RestoreRunResult> {
  const bridge = nativeBridge();
  if (!bridge) return { restored: 0, error: null };
  const res = await fetch('/api/account/cloud-backup/rehydrate', { method: 'GET' });
  if (!res.ok) return { restored: 0, error: backupErrorFromStatus(res.status) };
  const { pending } = (await res.json()) as { pending: Array<{ stored_path: string; archive_provider: NativeCloudProvider; archive_ref: string }> };
  let restored = 0;
  for (const job of pending.slice(0, 20)) {
    try {
      const bytes = await bridge.downloadFile({ archive_ref: job.archive_ref, provider: job.archive_provider });
      const form = new FormData();
      form.set('stored_path', job.stored_path);
      form.set('file', new Blob([bytes], { type: 'application/octet-stream' }), 'restore.bin');
      const up = await fetch('/api/account/cloud-backup/rehydrate', { method: 'POST', body: form });
      if (up.ok) restored += 1;
    } catch {
      break;
    }
  }
  return { restored, error: null };
}

let restoreTimer: ReturnType<typeof setInterval> | null = null;

// Startet den Hintergrund-Abgleich (Vordergrund-Polling): fragt regelmäßig
// nach Rückholaufträgen, damit KI/Web-Anfragen von allein erfüllt werden.
export function startAutoRestore(intervalMs = 60_000): () => void {
  stopAutoRestore();
  const tick = () => { void runRestoreRound(); };
  restoreTimer = setInterval(tick, intervalMs);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', tick);
  }
  void tick();
  return stopAutoRestore;
}

export function stopAutoRestore(): void {
  if (restoreTimer) clearInterval(restoreTimer);
  restoreTimer = null;
}
