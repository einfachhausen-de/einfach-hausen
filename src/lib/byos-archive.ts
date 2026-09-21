import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from './db';
import { privateRoot, resolvePrivatePath } from './security/private-files';

// BYOS-Backup ("Hausakte-Backup in deiner Cloud", WhatsApp-Modell):
//
// - Der Server ("Schreibtisch") hält ALLE Metadaten dauerhaft in der DB:
//   Name, Datum, Größe, MIME-Typ, Zugehörigkeit (Auftrag/Haus), Miniatur.
//   Liste, Suche und KI-Übersicht funktionieren deshalb immer — auch wenn der
//   Nutzer aus seiner Google-/Apple-Cloud ausgeloggt ist oder sie voll ist.
// - Das große Original (Foto, PDF, Video) liegt im Archiv der Nutzer-Cloud
//   (Android: Google Drive appDataFolder, iOS: iCloud/CloudKit). Dorthin lädt
//   die native App hoch; der Server sieht die fremde Cloud nie direkt.
// - Thin-out (kein doppelter Speicher auf Dauer): Das Server-Original wird
//   erst gelöscht, wenn die App per /confirm beweist, dass die Archivkopie
//   byte-identisch ist (SHA-256 über die Server-Datei muss mit dem
//   Client-Hash übereinstimmen). Kein Confirm (z. B. Cloud voll) = kein
//   Löschen. Es verschwindet nie etwas von allein.
// - Rehydrate: Angeforderte Dateien (Web/KI/Öffnen) melden 409
//   {error:'archive_rehydrate_needed'}; die App holt das Original aus der
//   Nutzer-Cloud zurück und lädt es per /rehydrate wieder hoch. Danach ist
//   die Datei überall (Web, Partner-Freigabe, KI) wieder normal verfügbar.
//
// Der archive_ref ist bewusst provider-neutral (Drive-Datei-ID oder
// CloudKit-Record-ID als String), damit Android↔iOS-Restore über das
// portable Manifest funktioniert — anders als bei WhatsApp.

export type ArchiveProvider = 'google-drive' | 'icloud';
export type CloudProviderSetting = ArchiveProvider | 'none';

export type ArchiveFileKind = 'job_media' | 'job_document' | 'house_history_document' | 'house_contract_document';

export interface ArchiveManifestEntry {
  kind: ArchiveFileKind;
  id: number;
  title: string;
  stored_path: string;
  fetch_path: string | null;
  mime: string;
  byte_size: number | null;
  sha256: string | null;
  archived: boolean;
  archive_provider: ArchiveProvider | null;
  operational: boolean;
}

export interface ArchiveStatus {
  provider: CloudProviderSetting;
  auto_restore: boolean;
  linked_at: string | null;
  operational: number;
  archived: number;
  pending: number;
  last_archived_at: string | null;
}

const VALID_SETTINGS: CloudProviderSetting[] = ['google-drive', 'icloud', 'none'];

export function normalizeProviderSetting(value: unknown): CloudProviderSetting | null {
  return typeof value === 'string' && (VALID_SETTINGS as string[]).includes(value)
    ? (value as CloudProviderSetting)
    : null;
}

export function normalizeArchiveProvider(value: unknown): ArchiveProvider | null {
  return value === 'google-drive' || value === 'icloud' ? value : null;
}

// Additive, idempotente Schema-Erweiterung (Muster: ensureCrmSchema). Wird
// lazy aus den Backup-Routen aufgerufen, damit der Next.js-Startpfad und
// parallele Build-Worker unberührt bleiben.
export function ensureByosArchiveSchema(): void {
  db.exec(`CREATE TABLE IF NOT EXISTS file_archive_state (
    stored_path TEXT PRIMARY KEY,
    owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    archive_provider TEXT NOT NULL CHECK(archive_provider IN ('google-drive','icloud')),
    archive_ref TEXT NOT NULL DEFAULT '',
    sha256 TEXT NOT NULL DEFAULT '',
    byte_size INTEGER,
    archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rehydrate_requested INTEGER NOT NULL DEFAULT 0
  )`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_file_archive_owner ON file_archive_state(owner_user_id, archived_at DESC)`);
  db.exec(`CREATE TABLE IF NOT EXISTS user_cloud_links (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'none' CHECK(provider IN ('google-drive','icloud','none')),
    auto_restore INTEGER NOT NULL DEFAULT 1,
    linked_at TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

export function getCloudLink(userId: number): { provider: CloudProviderSetting; auto_restore: boolean; linked_at: string | null } {
  ensureByosArchiveSchema();
  const row = db.prepare('SELECT provider, auto_restore, linked_at FROM user_cloud_links WHERE user_id=?').get(userId) as
    { provider: string; auto_restore: number; linked_at: string | null } | undefined;
  const provider = normalizeProviderSetting(row?.provider) ?? 'none';
  return { provider, auto_restore: row ? row.auto_restore === 1 : true, linked_at: row?.linked_at ?? null };
}

export function setCloudLink(userId: number, provider: CloudProviderSetting, autoRestore: boolean): void {
  ensureByosArchiveSchema();
  db.prepare(`INSERT INTO user_cloud_links(user_id, provider, auto_restore, linked_at, updated_at)
    VALUES(?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET provider=excluded.provider, auto_restore=excluded.auto_restore,
      linked_at=excluded.linked_at, updated_at=CURRENT_TIMESTAMP`)
    .run(userId, provider, autoRestore ? 1 : 0, provider === 'none' ? null : new Date().toISOString());
}

function mimeForStored(storedPath: string): string {
  const ext = path.extname(String(storedPath || '')).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.heic') return 'image/heic';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.webm') return 'image/webm';
  if (ext === '.mov') return 'video/quicktime';
  if (ext === '.m4v') return 'video/x-m4v';
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.m4a') return 'audio/mp4';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.ogg' || ext === '.opus') return 'audio/ogg';
  return 'application/octet-stream';
}

type OwnedRow = { id: number; title: string; stored_path: string; created_at: string };

// Alle privaten Dateipfade im Besitz des Nutzers (Eigentümer-Sicht). Titel und
// IDs bleiben dauerhaft in den Fachtabellen — das ist die Garantie, dass
// Liste/Suche/KI-Übersicht nie von der Nutzer-Cloud abhängen.
export function ownedArchiveRows(userId: number): Array<OwnedRow & { kind: ArchiveFileKind; fetch_path: string | null }> {
  ensureByosArchiveSchema();
  const rows: Array<OwnedRow & { kind: ArchiveFileKind; fetch_path: string | null }> = [];
  const push = (list: OwnedRow[], kind: ArchiveFileKind, fetch: (id: number) => string | null) => {
    for (const r of list) {
      if (typeof r.stored_path !== 'string' || !r.stored_path) continue;
      rows.push({ ...r, kind, fetch_path: fetch(r.id) });
    }
  };
  push(
    db.prepare(`SELECT jp.id, ('Foto #' || jp.id) AS title, jp.path AS stored_path, jp.created_at
      FROM job_photos jp JOIN jobs j ON j.id=jp.job_id WHERE j.homeowner_id=?`).all(userId) as OwnedRow[],
    'job_media', (id) => `/api/job-media/${id}`,
  );
  push(
    db.prepare(`SELECT d.id, d.title, d.path AS stored_path, d.created_at
      FROM documents d JOIN jobs j ON j.id=d.job_id WHERE j.homeowner_id=?`).all(userId) as OwnedRow[],
    'job_document', (id) => `/api/documents/${id}`,
  );
  push(
    db.prepare(`SELECT hhd.id, hhd.title, hhd.path AS stored_path, hhd.created_at
      FROM house_history_documents hhd JOIN house_history_entries hhe ON hhe.id=hhd.entry_id
      WHERE hhe.homeowner_id=?`).all(userId) as OwnedRow[],
    'house_history_document', (id) => `/api/house-history-documents/${id}`,
  );
  push(
    db.prepare(`SELECT hc.id, COALESCE(NULLIF(hc.document_title,''), 'Vertrag #' || hc.id) AS title,
        hc.document_path AS stored_path, hc.created_at FROM house_contracts hc
      WHERE hc.homeowner_id=? AND hc.document_path IS NOT NULL`).all(userId) as OwnedRow[],
    'house_contract_document', (id) => `/api/house-contracts/${id}/document`,
  );
  return rows;
}

export function getArchiveRow(storedPath: string): {
  owner_user_id: number; kind: string; archive_provider: string; archive_ref: string;
  sha256: string; byte_size: number | null; archived_at: string; rehydrate_requested: number;
} | undefined {
  ensureByosArchiveSchema();
  return db.prepare('SELECT owner_user_id, kind, archive_provider, archive_ref, sha256, byte_size, archived_at, rehydrate_requested FROM file_archive_state WHERE stored_path=?')
    .get(storedPath) as {
      owner_user_id: number; kind: string; archive_provider: string; archive_ref: string;
      sha256: string; byte_size: number | null; archived_at: string; rehydrate_requested: number;
    } | undefined;
}

async function hashStoredFile(storedPath: string): Promise<{ bytes: Buffer; sha256: string } | null> {
  const lexical = resolvePrivatePath(storedPath);
  if (!lexical) return null;
  try {
    const bytes = await fs.readFile(lexical);
    return { bytes, sha256: createHash('sha256').update(bytes).digest('hex') };
  } catch {
    return null;
  }
}

// Manifest für die App: Was gehört dem Nutzer, was liegt wo, was fehlt noch
// im Archiv? Hash + Größe belegen die Integrität vor dem Thin-out.
export async function buildArchiveManifest(userId: number): Promise<{ exported_at: string; files: ArchiveManifestEntry[] }> {
  const rows = ownedArchiveRows(userId);
  const files: ArchiveManifestEntry[] = [];
  for (const row of rows) {
    const archived = getArchiveRow(row.stored_path);
    const live = await hashStoredFile(row.stored_path);
    files.push({
      kind: row.kind,
      id: row.id,
      title: row.title,
      stored_path: row.stored_path,
      fetch_path: live ? row.fetch_path : null,
      mime: mimeForStored(row.stored_path),
      byte_size: live ? live.bytes.byteLength : (archived?.byte_size ?? null),
      sha256: live ? live.sha256 : null,
      archived: Boolean(archived),
      archive_provider: archived ? (normalizeArchiveProvider(archived.archive_provider) ?? null) : null,
      operational: Boolean(live),
    });
  }
  return { exported_at: new Date().toISOString(), files };
}

export type ConfirmItem = { stored_path: string; archive_ref: string; sha256: string };
export type ConfirmResult = { stored_path: string; ok: boolean; error: string | null };

// Bestätigt byte-identische Archivkopien und dünnt erst dann das
// Server-Original aus. Hash-Mismatch, Fremdbesitz oder fehlende Datei brechen
// den einzelnen Eintrag fail-closed ab — es wird nichts gelöscht.
export async function confirmArchiveUploads(userId: number, provider: ArchiveProvider, items: ConfirmItem[]): Promise<ConfirmResult[]> {
  ensureByosArchiveSchema();
  const owned = new Map(ownedArchiveRows(userId).map((r) => [r.stored_path, r]));
  const results: ConfirmResult[] = [];
  for (const item of items.slice(0, 200)) {
    const storedPath = typeof item.stored_path === 'string' ? item.stored_path : '';
    const ref = typeof item.archive_ref === 'string' ? item.archive_ref.slice(0, 512) : '';
    const claimed = typeof item.sha256 === 'string' ? item.sha256.toLowerCase() : '';
    const meta = owned.get(storedPath);
    if (!meta || !/^[0-9a-f]{64}$/.test(claimed)) {
      results.push({ stored_path: storedPath, ok: false, error: 'unknown_or_invalid' });
      continue;
    }
    const live = await hashStoredFile(storedPath);
    if (!live || live.sha256 !== claimed) {
      results.push({ stored_path: storedPath, ok: false, error: 'hash_mismatch' });
      continue;
    }
    // Byte-identisch belegt: Original löschen (best-effort), Archivzeile schreiben.
    const lexical = resolvePrivatePath(storedPath);
    if (lexical) {
      try { await fs.unlink(lexical); } catch { /* bereits weg: weiter */ }
    }
    db.prepare(`INSERT INTO file_archive_state(stored_path, owner_user_id, kind, archive_provider, archive_ref, sha256, byte_size, archived_at, rehydrate_requested)
      VALUES(?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0)
      ON CONFLICT(stored_path) DO UPDATE SET owner_user_id=excluded.owner_user_id, kind=excluded.kind,
        archive_provider=excluded.archive_provider, archive_ref=excluded.archive_ref, sha256=excluded.sha256,
        byte_size=excluded.byte_size, archived_at=CURRENT_TIMESTAMP, rehydrate_requested=0`)
      .run(storedPath, userId, meta.kind, provider, ref, live.sha256, live.bytes.byteLength);
    results.push({ stored_path: storedPath, ok: true, error: null });
  }
  return results;
}

// Markiert eine archivierte Datei für den automatischen Rückholauftrag
// (Web/KI/Öffnen fordern an, die App liefert). Idempotent.
export function requestRehydrate(userId: number, storedPath: string): boolean {
  ensureByosArchiveSchema();
  const owned = ownedArchiveRows(userId).some((r) => r.stored_path === storedPath);
  if (!owned) return false;
  const row = getArchiveRow(storedPath);
  if (!row || row.owner_user_id !== userId) return false;
  db.prepare('UPDATE file_archive_state SET rehydrate_requested=1 WHERE stored_path=?').run(storedPath);
  return true;
}

export function pendingRehydrates(userId: number): Array<{ stored_path: string; kind: string; archive_provider: string; archive_ref: string }> {
  ensureByosArchiveSchema();
  return db.prepare(`SELECT stored_path, kind, archive_provider, archive_ref FROM file_archive_state
    WHERE owner_user_id=? AND rehydrate_requested=1 ORDER BY archived_at ASC LIMIT 100`).all(userId) as Array<{
      stored_path: string; kind: string; archive_provider: string; archive_ref: string;
    }>;
}

// Stellt das Original wieder her (Upload aus der Nutzer-Cloud durch die App).
// Nur eigene archivierte Pfade, defensive Pfadauflösung, Modus 0600.
export async function restoreArchivedFile(userId: number, storedPath: string, bytes: Uint8Array): Promise<'restored' | 'not_archived' | 'invalid' | 'too_large'> {
  ensureByosArchiveSchema();
  if (!bytes.byteLength || bytes.byteLength > 25 * 1024 * 1024) return 'too_large';
  const row = getArchiveRow(storedPath);
  if (!row || row.owner_user_id !== userId) return 'not_archived';
  const owned = ownedArchiveRows(userId).some((r) => r.stored_path === storedPath);
  if (!owned) return 'not_archived';
  const lexical = resolvePrivatePath(storedPath);
  if (!lexical) return 'invalid';
  if (!lexical.startsWith(privateRoot() + path.sep)) return 'invalid';
  await fs.mkdir(path.dirname(lexical), { recursive: true, mode: 0o700 });
  await fs.writeFile(lexical, bytes, { mode: 0o600 });
  db.prepare('UPDATE file_archive_state SET rehydrate_requested=0 WHERE stored_path=?').run(storedPath);
  return 'restored';
}

export async function archiveStatusFor(userId: number): Promise<ArchiveStatus> {
  ensureByosArchiveSchema();
  const link = getCloudLink(userId);
  const rows = ownedArchiveRows(userId);
  let archived = 0;
  let pending = 0;
  let last: string | null = null;
  for (const row of rows) {
    const state = getArchiveRow(row.stored_path);
    if (!state) continue;
    archived += 1;
    if (state.rehydrate_requested === 1) pending += 1;
    if (!last || state.archived_at > last) last = state.archived_at;
  }
  return {
    provider: link.provider,
    auto_restore: link.auto_restore,
    linked_at: link.linked_at,
    operational: rows.length,
    archived,
    pending,
    last_archived_at: last,
  };
}

// Zustand für die vier Datei-Routen, wenn die Bytes ausgedünnt sind: Der
// Aufrufer antwortet 409 mit klarem Auftrag statt 404. Gibt null zurück, wenn
// kein Archivzustand passt (Aufrufer antwortet dann wie bisher 404).
export function archivedStateFor(storedPath: string): { archive_provider: string } | null {
  const row = getArchiveRow(storedPath);
  if (!row) return null;
  return { archive_provider: row.archive_provider };
}

export function archivedNeededBody(storedPath: string): { error: string; stored_path: string; archive_provider: string; hint: string } | null {
  const state = archivedStateFor(storedPath);
  if (!state) return null;
  return {
    error: 'archive_rehydrate_needed',
    stored_path: storedPath,
    archive_provider: state.archive_provider,
    hint: 'Diese Datei liegt sicher in deiner Cloud. Tippe sie in der App an — sie wird automatisch zurückgeholt.',
  };
}

// DSGVO-Lifecycle: Archivzeilen und Cloud-Verknüpfung sterben mit dem Konto.
export function purgeUserArchiveState(userId: number): void {
  ensureByosArchiveSchema();
  db.prepare('DELETE FROM file_archive_state WHERE owner_user_id=?').run(userId);
  db.prepare('DELETE FROM user_cloud_links WHERE user_id=?').run(userId);
}
