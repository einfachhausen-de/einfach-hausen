// BYOS-Backup-Regression ("Hausakte-Backup in deiner Cloud"):
// Manifest, Hash-geschütztes Confirm mit Thin-out, Fremdbesitz-Schutz,
// 409-Auftrag statt 404, Rehydrate-Roundtrip, Konto-Lifecycle.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { tsClosure } from './lib/ts-scratch.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-byos-'));
process.env.DATABASE_PATH = path.join(dbDir, 'regression.db');
process.chdir(dbDir);
fs.symlinkSync(path.join(root, 'node_modules'), path.join(dbDir, 'node_modules'), 'dir');

for (const rel of tsClosure(root, ['src/lib/byos-archive.ts'])) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  const stripped = stripTypeScriptTypes(src).replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g, (_m, a, s, b) => `${a}${s}.mjs${b}`);
  const dest = path.join(dbDir, rel.replace(/\.ts$/, '.mjs'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, stripped);
}
const byos = await import(pathToFileURL(path.join(dbDir, 'src/lib/byos-archive.mjs')).href);
const { db } = await import(pathToFileURL(path.join(dbDir, 'src/lib/db.mjs')).href);

let checks = 0;
function t(name, fn) { return Promise.resolve().then(fn).then(() => { checks++; console.log(`ok - ${name}`); }); }

function writePrivate(stored, bytes) {
  const full = path.join(dbDir, 'data', 'private', stored);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, bytes, { mode: 0o600 });
  return full;
}
const sha = (b) => createHash('sha256').update(b).digest('hex');

// Fixture: Eigentümer (1) mit Job + Foto, Fremder (2).
db.prepare("INSERT INTO users(id,email,role,first_name,last_name,password_hash) VALUES(1,'o@t.de','homeowner','O','W','x'),(2,'f@t.de','homeowner','F','R','x')").run();
db.prepare("INSERT INTO jobs(id,homeowner_id,title,description,category,postcode) VALUES(10,1,'Hecke','Bitte schneiden','Garten','10115')").run();
const photoBytes = Buffer.from('fake-jpeg-bytes-1234');
const docBytes = Buffer.from('fake-pdf-bytes-5678');
writePrivate('job-media/foto1.jpg', photoBytes);
writePrivate('job-media/dok1.jpg', docBytes);
db.prepare('INSERT INTO job_photos(id,job_id,path) VALUES(100,10,?)').run('job-media/foto1.jpg');
db.prepare('INSERT INTO job_photos(id,job_id,path) VALUES(101,10,?)').run('job-media/dok1.jpg');

await t('frischer Status: keine Cloud, alles betrieblich', async () => {
  const s = await byos.archiveStatusFor(1);
  assert.equal(s.provider, 'none');
  assert.equal(s.operational, 2);
  assert.equal(s.archived, 0);
  assert.equal(s.pending, 0);
});

await t('Manifest listet eigene Dateien mit Hash und Abrufweg', async () => {
  const m = await byos.buildArchiveManifest(1);
  assert.equal(m.files.length, 2);
  const foto = m.files.find((f) => f.stored_path === 'job-media/foto1.jpg');
  assert.equal(foto.operational, true);
  assert.equal(foto.archived, false);
  assert.equal(foto.sha256, sha(photoBytes));
  assert.equal(foto.byte_size, photoBytes.byteLength);
  assert.equal(foto.fetch_path, '/api/job-media/100');
  const fremd = await byos.buildArchiveManifest(2);
  assert.equal(fremd.files.length, 0);
});

await t('falscher Hash: kein Löschen (fail-closed)', async () => {
  const r = await byos.confirmArchiveUploads(1, 'google-drive', [
    { stored_path: 'job-media/dok1.jpg', archive_ref: 'drive-x', sha256: '0'.repeat(64) },
  ]);
  assert.equal(r[0].ok, false);
  assert.equal(r[0].error, 'hash_mismatch');
  assert.equal(fs.existsSync(path.join(dbDir, 'data', 'private', 'job-media/dok1.jpg')), true);
});

await t('Fremdbesitz: kein Löschen', async () => {
  const r = await byos.confirmArchiveUploads(2, 'google-drive', [
    { stored_path: 'job-media/foto1.jpg', archive_ref: 'drive-y', sha256: sha(photoBytes) },
  ]);
  assert.equal(r[0].ok, false);
  assert.equal(fs.existsSync(path.join(dbDir, 'data', 'private', 'job-media/foto1.jpg')), true);
});

await t('Traversal-Pfad: kein Löschen', async () => {
  const r = await byos.confirmArchiveUploads(1, 'google-drive', [
    { stored_path: '../regression.db', archive_ref: 'drive-z', sha256: sha(photoBytes) },
  ]);
  assert.equal(r[0].ok, false);
  assert.equal(fs.existsSync(path.join(dbDir, 'regression.db')), true);
});

await t('korrekter Hash: Thin-out, Meta bleibt, 409-Auftrag', async () => {
  const r = await byos.confirmArchiveUploads(1, 'google-drive', [
    { stored_path: 'job-media/foto1.jpg', archive_ref: 'drive-abc', sha256: sha(photoBytes) },
  ]);
  assert.equal(r[0].ok, true);
  assert.equal(fs.existsSync(path.join(dbDir, 'data', 'private', 'job-media/foto1.jpg')), false);
  // Metadaten-Zeile lebt weiter: Liste/Suche/KI sehen das Foto weiterhin.
  const meta = db.prepare('SELECT id FROM job_photos WHERE id=100').get();
  assert.equal(meta.id, 100);
  const m = await byos.buildArchiveManifest(1);
  const foto = m.files.find((f) => f.stored_path === 'job-media/foto1.jpg');
  assert.equal(foto.archived, true);
  assert.equal(foto.operational, false);
  assert.equal(foto.archive_provider, 'google-drive');
  assert.equal(foto.fetch_path, null);
  const body = byos.archivedNeededBody('job-media/foto1.jpg');
  assert.equal(body.error, 'archive_rehydrate_needed');
  assert.equal(body.archive_provider, 'google-drive');
  assert.equal(byos.archivedNeededBody('job-media/dok1.jpg'), null);
  const s = await byos.archiveStatusFor(1);
  assert.equal(s.archived, 1);
  assert.equal(s.operational, 2);
});

await t('Rehydrate: Auftrag, Fremdschutz, Wiederherstellung', async () => {
  assert.equal(byos.requestRehydrate(2, 'job-media/foto1.jpg'), false);
  assert.equal(byos.requestRehydrate(1, 'job-media/foto1.jpg'), true);
  assert.equal(byos.requestRehydrate(1, 'job-media/dok1.jpg'), false);
  const pending = byos.pendingRehydrates(1);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].archive_provider, 'google-drive');
  assert.equal(await byos.restoreArchivedFile(2, 'job-media/foto1.jpg', photoBytes), 'not_archived');
  assert.equal(await byos.restoreArchivedFile(1, 'job-media/foto1.jpg', photoBytes), 'restored');
  assert.equal(fs.existsSync(path.join(dbDir, 'data', 'private', 'job-media/foto1.jpg')), true);
  assert.equal(byos.pendingRehydrates(1).length, 0);
  const m = await byos.buildArchiveManifest(1);
  assert.equal(m.files.find((f) => f.stored_path === 'job-media/foto1.jpg').operational, true);
});

await t('Cloud-Verknüpfung speichern und Konto-Lifecycle räumt auf', async () => {
  byos.setCloudLink(1, 'icloud', true);
  const link = byos.getCloudLink(1);
  assert.equal(link.provider, 'icloud');
  assert.equal(link.auto_restore, true);
  assert.equal(byos.normalizeProviderSetting('dropbox'), null);
  assert.equal(byos.normalizeArchiveProvider('icloud'), 'icloud');
  byos.purgeUserArchiveState(1);
  assert.equal(byos.getArchiveRow('job-media/foto1.jpg'), undefined);
  assert.equal(byos.getCloudLink(1).provider, 'none');
  const s = await byos.archiveStatusFor(1);
  assert.equal(s.archived, 0);
});

console.log(`\nBYOS-Backup-Regression: ${checks} Checks bestanden.`);
