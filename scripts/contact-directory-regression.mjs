/**
 * scripts/contact-directory-regression.mjs
 * Contact directory regression: in-memory DB, taxonomy IDs derived from the
 * ROOT-SUPPLIED const (no invented IDs). Injectable store, no fixtures.
 * PROPOSED command (root approval required BEFORE execution — DO NOT RUN YET):
 *   node --experimental-strip-types --test scripts/contact-directory-regression.mjs
 * (--experimental-strip-types precedent: scripts/test-fixtures.mjs.)
 * Status: AUTHORED, UNRUN. No repository edits made. No fake artifacts:
 * every assertion exercises the drafted store/schema code paths.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { CONTACT_DIRECTORY_CATEGORIES } from '../src/lib/contact-directory-taxonomy.ts';
import { initializeContactDirectory } from '../src/lib/contact-directory-schema.ts';
import { createContactDirectoryStore } from '../src/lib/contact-directory-store.ts';

const gartenSubs = CONTACT_DIRECTORY_CATEGORIES.find((main) => main.id === 'garten').subcategories;
const G1 = gartenSubs[0].id;
const G2 = gartenSubs[1].id;
const G3 = gartenSubs[2].id;
const E1 = CONTACT_DIRECTORY_CATEGORIES.find((main) => main.id === 'elektro').subcategories[0].id;
const E_WALLBOX = 'elektro-wallbox-und-ladeinfrastruktur';

test('root taxonomy pins hold: 17 mains, Garten first3 IDs', () => {
  assert.equal(CONTACT_DIRECTORY_CATEGORIES.length, 17);
  assert.equal(G1, 'garten-garten-und-landschaftsbauer');
  assert.equal(G2, 'garten-gaertner-gartenpflege');
  assert.equal(G3, 'garten-baumpfleger-baumfaeller');
  assert.equal(E_WALLBOX, 'elektro-wallbox-und-ladeinfrastruktur');
});

function openTestDb() {
  const database = new Database(':memory:');
  database.pragma('foreign_keys = ON');
  database.exec(
    'CREATE TABLE users(id INTEGER PRIMARY KEY,first_name TEXT,last_name TEXT,phone TEXT,email TEXT);' +
      'CREATE TABLE provider_profiles(user_id INTEGER PRIMARY KEY,business_name TEXT);' +
      'CREATE TABLE homeowner_contacts(homeowner_id INTEGER NOT NULL,provider_id INTEGER NOT NULL,' +
      "contact_user_id INTEGER NOT NULL,category TEXT NOT NULL DEFAULT '',PRIMARY KEY(homeowner_id,contact_user_id));",
  );
  initializeContactDirectory(database);
  database
    .prepare("INSERT INTO users(id,first_name,last_name,phone,email) VALUES(7,'Haus','Besitzer',NULL,NULL)")
    .run();
  return database;
}

function storeFor(database) {
  return createContactDirectoryStore(database, CONTACT_DIRECTORY_CATEGORIES);
}

function seedPlatformContact(database, homeownerId = 7, userId = 8) {
  database
    .prepare('INSERT INTO users(id,first_name,last_name,phone,email) VALUES(?,?,?,?,?)')
    .run(userId, 'Max', 'Meister', '+49170111222', 'max@betrieb.de');
  database.prepare('INSERT INTO provider_profiles(user_id,business_name) VALUES(?,?)').run(userId, 'Meister GmbH');
  database
    .prepare('INSERT INTO homeowner_contacts(homeowner_id,provider_id,contact_user_id,category) VALUES(?,?,?,?)')
    .run(homeownerId, userId, userId, 'Heizung & Sanitär');
}

test('startup twice is idempotent and keeps unknown rows', () => {
  const database = openTestDb();
  database.prepare("INSERT INTO contact_directory_mains(slug,title,sort,active) VALUES('custom','Custom & Alt',99,1)").run();
  initializeContactDirectory(database);
  initializeContactDirectory(database);
  const kept = database.prepare("SELECT title FROM contact_directory_mains WHERE slug='custom'").get();
  assert.equal(kept.title, 'Custom & Alt');
});

test('platform backfill snapshots profile and retains legacy category untouched', () => {
  const database = openTestDb();
  database.exec('DROP TRIGGER trg_hc_entry_mirror_insert; DROP TRIGGER trg_hc_entry_mirror_update;');
  seedPlatformContact(database);
  initializeContactDirectory(database);
  const store = storeFor(database);
  const found = store.findByPlatformUserId(7, 8);
  assert.equal(found.ok, true);
  assert.equal(found.value.name, 'Max Meister');
  assert.equal(found.value.company, 'Meister GmbH');
  assert.equal(found.value.legacyCategory, 'Heizung & Sanitär');
  assert.deepEqual(found.value.subcategoryIds, []);
});

test('create manual with three subs, then replace to one, then empty removes the group', () => {
  const database = openTestDb();
  const store = storeFor(database);
  const created = store.createManual({
    ownerId: 7,
    requestId: 'req-create-0001',
    mainId: 'garten',
    initialSubcategoryId: G1,
    subcategoryIds: [G1, G2, G3],
    name: 'Lisa Grün',
    company: 'Grün & Co',
    phone: '+49170222333',
    email: 'lisa@gruen.de',
    allowPossibleDuplicate: true,
  });
  assert.equal(created.ok, true);
  assert.deepEqual(created.value.subcategoryIds, [G1, G2, G3].sort());
  const replaced = store.replaceAssignments({
    ownerId: 7,
    entryId: created.value.id,
    mainId: 'garten',
    subcategoryIds: [G1],
    revision: created.value.revision,
  });
  assert.equal(replaced.ok, true);
  assert.deepEqual(replaced.value.subcategoryIds, [G1]);
  const emptied = store.replaceAssignments({
    ownerId: 7,
    entryId: created.value.id,
    mainId: 'garten',
    subcategoryIds: [],
    revision: replaced.value.revision,
  });
  assert.equal(emptied.ok, true);
  assert.deepEqual(emptied.value.subcategoryIds, []);
  assert.equal(emptied.value.revision, replaced.value.revision + 1);
  const entryAlive = store.get(7, created.value.id);
  assert.equal(entryAlive.ok, true);
  assert.equal(entryAlive.value.name, 'Lisa Grün');
});

test('replace removes only that main and preserves other mains', () => {
  const database = openTestDb();
  const store = storeFor(database);
  const created = store.createManual({
    ownerId: 7,
    requestId: 'req-multimain-1',
    mainId: 'garten',
    initialSubcategoryId: G1,
    subcategoryIds: [G1],
    name: 'Multi Main',
    company: '',
    phone: '',
    email: '',
    allowPossibleDuplicate: true,
  });
  assert.equal(created.ok, true);
  const added = store.addExisting({
    ownerId: 7,
    entryId: created.value.id,
    mainId: 'elektro',
    initialSubcategoryId: E_WALLBOX,
    subcategoryIds: [E_WALLBOX],
    revision: created.value.revision,
  });
  assert.equal(added.ok, true);
  const replaced = store.replaceAssignments({
    ownerId: 7,
    entryId: created.value.id,
    mainId: 'garten',
    subcategoryIds: [G2],
    revision: added.value.revision,
  });
  assert.equal(replaced.ok, true);
  assert.deepEqual(replaced.value.subcategoryIds, [E_WALLBOX, G2].sort());
});

test('addExisting unions without wiping and identical set is stale-proof no-op', () => {
  const database = openTestDb();
  const store = storeFor(database);
  seedPlatformContact(database);
  initializeContactDirectory(database);
  const entry = store.findByPlatformUserId(7, 8).value;
  const added = store.addExisting({
    ownerId: 7,
    entryId: entry.id,
    mainId: 'garten',
    initialSubcategoryId: G1,
    subcategoryIds: [G1, G2],
    revision: entry.revision,
  });
  assert.equal(added.ok, true);
  assert.deepEqual(added.value.subcategoryIds, [G1, G2].sort());
  const noop = store.addExisting({
    ownerId: 7,
    entryId: entry.id,
    mainId: 'garten',
    initialSubcategoryId: G1,
    subcategoryIds: [G1, G2],
    revision: 9999,
  });
  assert.equal(noop.ok, true);
  assert.deepEqual(noop.value.subcategoryIds, [G1, G2].sort());
});

test('same requestId repeats same id; different payload conflicts', () => {
  const database = openTestDb();
  const store = storeFor(database);
  const base = {
    ownerId: 7,
    requestId: 'req-idem-42',
    mainId: 'garten',
    initialSubcategoryId: G1,
    subcategoryIds: [G1],
    name: 'Idem Mann',
    company: '',
    phone: '+49170333444',
    email: '',
    allowPossibleDuplicate: true,
  };
  const first = store.createManual(base);
  assert.equal(first.ok, true);
  const repeat = store.createManual(base);
  assert.equal(repeat.ok, true);
  assert.equal(repeat.value.id, first.value.id);
  const conflict = store.createManual({ ...base, phone: '+49170555666' });
  assert.equal(conflict.ok, false);
  assert.equal(conflict.code, 'conflict');
});

test('tenant isolation: foreign owner/entry rejected, cross-owner link blocked by composite FK', () => {
  const database = openTestDb();
  const store = storeFor(database);
  const created = store.createManual({
    ownerId: 7,
    requestId: 'req-tenant-1',
    mainId: 'garten',
    initialSubcategoryId: G1,
    subcategoryIds: [G1],
    name: 'Tenant A',
    company: '',
    phone: '',
    email: '',
    allowPossibleDuplicate: true,
  });
  assert.equal(created.ok, true);
  assert.equal(store.get(9, created.value.id).ok, false);
  assert.equal(
    store.replaceAssignments({ ownerId: 9, entryId: created.value.id, mainId: 'garten', subcategoryIds: [], revision: 0 }).ok,
    false,
  );
  assert.throws(() =>
    database
      .prepare('INSERT INTO homeowner_contact_subcategories(homeowner_id,entry_id,subcategory_id) VALUES(?,?,?)')
      .run(9, created.value.id, G1),
  );
});

test('invalid subcategory and foreign-main selection rejected before writes', () => {
  const database = openTestDb();
  const store = storeFor(database);
  const badSub = store.createManual({
    ownerId: 7,
    requestId: 'req-badsub-1',
    mainId: 'garten',
    initialSubcategoryId: 'nope.missing',
    subcategoryIds: ['nope.missing'],
    name: 'Bad Sub',
    company: '',
    phone: '',
    email: '',
    allowPossibleDuplicate: true,
  });
  assert.equal(badSub.ok, false);
  assert.equal(badSub.code, 'validation');
  const foreignMain = store.createManual({
    ownerId: 7,
    requestId: 'req-foreign-1',
    mainId: 'garten',
    initialSubcategoryId: E_WALLBOX,
    subcategoryIds: [E_WALLBOX],
    name: 'Foreign Main',
    company: '',
    phone: '',
    email: '',
    allowPossibleDuplicate: true,
  });
  assert.equal(foreignMain.ok, false);
  assert.equal(foreignMain.code, 'validation');
  assert.equal(store.list(7).value.length, 0);
});

test('same name twice allowed; email duplicates require confirmation, never auto-merge', () => {
  const database = openTestDb();
  const store = storeFor(database);
  const first = store.createManual({
    ownerId: 7,
    requestId: 'req-samename-1',
    mainId: 'garten',
    initialSubcategoryId: G1,
    subcategoryIds: [G1],
    name: 'Alex Gleich',
    company: 'Gleich GmbH',
    phone: '',
    email: '',
    allowPossibleDuplicate: true,
  });
  assert.equal(first.ok, true);
  const second = store.createManual({
    ownerId: 7,
    requestId: 'req-samename-2',
    mainId: 'elektro',
    initialSubcategoryId: E_WALLBOX,
    subcategoryIds: [E_WALLBOX],
    name: 'Alex Gleich',
    company: 'Gleich GmbH',
    phone: '',
    email: '',
    allowPossibleDuplicate: true,
  });
  assert.equal(second.ok, true);
  assert.notEqual(second.value.id, first.value.id);
  const dup = store.createManual({
    ownerId: 7,
    requestId: 'req-dupmail-1',
    mainId: 'garten',
    initialSubcategoryId: G2,
    subcategoryIds: [G2],
    name: 'Alex Anders',
    company: '',
    phone: '',
    email: 'alex@gleich.de',
  });
  assert.equal(dup.ok, true);
  const dupMail = store.createManual({
    ownerId: 7,
    requestId: 'req-dupmail-2',
    mainId: 'garten',
    initialSubcategoryId: G2,
    subcategoryIds: [G2],
    name: 'Alex Zweiter',
    company: '',
    phone: '',
    email: 'alex@gleich.de',
  });
  assert.equal(dupMail.ok, false);
  assert.equal(dupMail.code, 'duplicate-candidates');
  assert.equal(dupMail.candidates.length, 1);
  const confirmed = store.createManual({
    ownerId: 7,
    requestId: 'req-dupmail-3',
    mainId: 'garten',
    initialSubcategoryId: G2,
    subcategoryIds: [G2],
    name: 'Alex Zweiter',
    company: '',
    phone: '',
    email: 'alex@gleich.de',
    allowPossibleDuplicate: true,
  });
  assert.equal(confirmed.ok, true);
});

test('manual editing with optimistic revision; platform entries immutable', () => {
  const database = openTestDb();
  const store = storeFor(database);
  seedPlatformContact(database);
  initializeContactDirectory(database);
  const platform = store.findByPlatformUserId(7, 8).value;
  const forbidden = store.updateManual({
    ownerId: 7,
    entryId: platform.id,
    revision: platform.revision,
    name: 'Gehackt',
    company: '',
    phone: '',
    email: '',
  });
  assert.equal(forbidden.ok, false);
  assert.equal(forbidden.code, 'forbidden');
  const created = store.createManual({
    ownerId: 7,
    requestId: 'req-edit-1',
    mainId: 'garten',
    initialSubcategoryId: G1,
    subcategoryIds: [G1],
    name: 'Edit Me',
    company: '',
    phone: '+49170666777',
    email: '',
    allowPossibleDuplicate: true,
  });
  assert.equal(created.ok, true);
  const stale = store.updateManual({
    ownerId: 7,
    entryId: created.value.id,
    revision: created.value.revision + 5,
    name: 'Edit Neu',
    company: '',
    phone: '+49170666777',
    email: '',
  });
  assert.equal(stale.ok, false);
  assert.equal(stale.code, 'stale-revision');
  const updated = store.updateManual({
    ownerId: 7,
    entryId: created.value.id,
    revision: created.value.revision,
    name: 'Edit Neu',
    company: '',
    phone: '+49170666777',
    email: '',
  });
  assert.equal(updated.ok, true);
  assert.equal(updated.value.name, 'Edit Neu');
  assert.equal(updated.value.revision, created.value.revision + 1);
});

test('old homeowner_contacts writes mirror via triggers; no delete trigger erases address book', () => {
  const database = openTestDb();
  const store = storeFor(database);
  seedPlatformContact(database);
  initializeContactDirectory(database);
  database
    .prepare('INSERT OR IGNORE INTO homeowner_contacts(homeowner_id,provider_id,contact_user_id,category) VALUES(?,?,?,?)')
    .run(7, 8, 8, 'Heizung & Sanitär');
  database
    .prepare(
      'INSERT INTO homeowner_contacts(homeowner_id,provider_id,contact_user_id,category) VALUES(?,?,?,?) ' +
        'ON CONFLICT(homeowner_id,contact_user_id) DO UPDATE SET category=excluded.category',
    )
    .run(7, 8, 8, 'Elektro');
  const mirrored = store.findByPlatformUserId(7, 8);
  assert.equal(mirrored.ok, true);
  assert.equal(mirrored.value.legacyCategory, 'Elektro');
  database.prepare('DELETE FROM homeowner_contacts WHERE homeowner_id=? AND contact_user_id=?').run(7, 8);
  const kept = store.findByPlatformUserId(7, 8);
  assert.equal(kept.ok, true);
  assert.equal(kept.value.legacyCategory, 'Elektro');
});

test('account deletion cascades linked entries, links and receipts', () => {
  const database = openTestDb();
  const store = storeFor(database);
  seedPlatformContact(database);
  initializeContactDirectory(database);
  const created = store.createManual({
    ownerId: 7,
    requestId: 'req-cascade-1',
    mainId: 'garten',
    initialSubcategoryId: G1,
    subcategoryIds: [G1],
    name: 'Cascade Case',
    company: '',
    phone: '',
    email: '',
    allowPossibleDuplicate: true,
  });
  assert.equal(created.ok, true);
  database.prepare('DELETE FROM users WHERE id=?').run(7);
  assert.equal(store.list(7).value.length, 0);
  assert.equal(
    database.prepare('SELECT COUNT(*) c FROM homeowner_contact_subcategories WHERE homeowner_id=?').get(7).c,
    0,
  );
  assert.equal(
    database.prepare('SELECT COUNT(*) c FROM contact_directory_receipts WHERE homeowner_id=?').get(7).c,
    0,
  );
});

test('concurrent duplicate creates from two connections return one entry', { timeout: 30000 }, async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, dirname } = await import('node:path');
  const { fileURLToPath, pathToFileURL } = await import('node:url');
  const { Worker } = await import('node:worker_threads');
  const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
  const dir = mkdtempSync(join(tmpdir(), 'eh-dir-race-'));
  const dbPath = join(dir, 'race.db');
  const database = new Database(dbPath);
  database.pragma('foreign_keys = ON');
  database.exec(
    'CREATE TABLE users(id INTEGER PRIMARY KEY,first_name TEXT,last_name TEXT,phone TEXT,email TEXT);' +
      'CREATE TABLE provider_profiles(user_id INTEGER PRIMARY KEY,business_name TEXT);' +
      'CREATE TABLE homeowner_contacts(homeowner_id INTEGER NOT NULL,provider_id INTEGER NOT NULL,' +
      "contact_user_id INTEGER NOT NULL,category TEXT NOT NULL DEFAULT '',PRIMARY KEY(homeowner_id,contact_user_id));",
  );
  initializeContactDirectory(database);
  database
    .prepare("INSERT INTO users(id,first_name,last_name,phone,email) VALUES(7,'Haus','Besitzer',NULL,NULL)")
    .run();
  // Taxonomy already seeded by initializeContactDirectory above (upsert); no manual re-insert.
  const workerPath = join(dir, 'race-worker.mjs');
  writeFileSync(
    workerPath,
    "import { parentPort, workerData } from 'node:worker_threads';\n" +
      "import { createRequire } from 'node:module';\n" +
      "import { pathToFileURL } from 'node:url';\n" +
      "const require = createRequire(workerData.repoRoot + '/package.json');\n" +
      "const BetterSqlite = require('better-sqlite3');\n" +
      "const Database = BetterSqlite.default ?? BetterSqlite;\n" +
      "const taxonomy = await import(pathToFileURL(workerData.taxonomyPath).href);\n" +
      "const storeMod = await import(pathToFileURL(workerData.storePath).href);\n" +
      "const database = new Database(workerData.dbPath);\n" +
      "database.pragma('busy_timeout = 5000');\n" +
      "const store = storeMod.createContactDirectoryStore(database, taxonomy.CONTACT_DIRECTORY_CATEGORIES);\n" +
      "const result = store.createManual(workerData.input);\n" +
      "parentPort.postMessage({ ok: result.ok, code: result.code ?? null, id: result.ok ? result.value.id : null });\n",
  );
  const input = {
    ownerId: 7,
    requestId: 'req-race-0001',
    mainId: 'garten',
    initialSubcategoryId: G1,
    subcategoryIds: [G1],
    name: 'Race Runner',
    company: '',
    phone: '+49170999000',
    email: '',
    allowPossibleDuplicate: true,
  };
  const workerData = {
    repoRoot,
    dbPath,
    taxonomyPath: join(repoRoot, 'src', 'lib', 'contact-directory-taxonomy.ts'),
    storePath: join(repoRoot, 'src', 'lib', 'contact-directory-store.ts'),
    input,
  };
  const runWorker = () =>
    new Promise((resolve, reject) => {
      const worker = new Worker(workerPath, { workerData, execArgv: process.execArgv });
      worker.once('message', resolve);
      worker.once('error', reject);
    });
  const [first, second] = await Promise.all([runWorker(), runWorker()]);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.id, second.id);
  assert.equal(database.prepare('SELECT COUNT(*) c FROM homeowner_contact_entries WHERE homeowner_id=?').get(7).c, 1);
  assert.equal(database.prepare('SELECT COUNT(*) c FROM contact_directory_receipts WHERE homeowner_id=?').get(7).c, 1);
  database.close();
  rmSync(dir, { recursive: true, force: true });
});

test('stale revision race: second tab loses unless identical set', () => {
  const database = openTestDb();
  const store = storeFor(database);
  const created = store.createManual({
    ownerId: 7,
    requestId: 'req-stale-1',
    mainId: 'garten',
    initialSubcategoryId: G1,
    subcategoryIds: [G1],
    name: 'Stale Tab',
    company: '',
    phone: '',
    email: '',
    allowPossibleDuplicate: true,
  });
  assert.equal(created.ok, true);
  const tabA = store.replaceAssignments({
    ownerId: 7,
    entryId: created.value.id,
    mainId: 'garten',
    subcategoryIds: [G1, G2],
    revision: created.value.revision,
  });
  assert.equal(tabA.ok, true);
  const tabB = store.replaceAssignments({
    ownerId: 7,
    entryId: created.value.id,
    mainId: 'garten',
    subcategoryIds: [G3],
    revision: created.value.revision,
  });
  assert.equal(tabB.ok, false);
  assert.equal(tabB.code, 'stale-revision');
  assert.equal(tabB.currentRevision, tabA.value.revision);
  const tabBNoop = store.replaceAssignments({
    ownerId: 7,
    entryId: created.value.id,
    mainId: 'garten',
    subcategoryIds: [G2, G1],
    revision: created.value.revision,
  });
  assert.equal(tabBNoop.ok, true);
  assert.deepEqual(tabBNoop.value.subcategoryIds, [G1, G2].sort());
});

test('null phone and missing profile: real legacy rows backfill without inferred services', () => {
  const database = openTestDb();
  database.exec('DROP TRIGGER trg_hc_entry_mirror_insert; DROP TRIGGER trg_hc_entry_mirror_update;');
  database.prepare('INSERT INTO users(id,first_name,last_name,phone,email) VALUES(?,?,?,NULL,NULL)').run(11, 'Ohne', 'Telefon');
  database.prepare('INSERT INTO homeowner_contacts(homeowner_id,provider_id,contact_user_id,category) VALUES(?,?,?,?)').run(7, 11, 11, 'Sicherheit & Schloss');
  const store = storeFor(database);
  assert.equal(store.findByPlatformUserId(7, 11).ok, false);
  initializeContactDirectory(database);
  const found = store.findByPlatformUserId(7, 11);
  assert.equal(found.ok, true);
  assert.equal(found.value.name, 'Ohne Telefon');
  assert.equal(found.value.phone, '');
  assert.equal(found.value.email, '');
  assert.equal(found.value.company, '');
  assert.equal(found.value.legacyCategory, 'Sicherheit & Schloss');
  assert.deepEqual(found.value.subcategoryIds, []);
  assert.deepEqual(database.pragma('foreign_key_check'), []);
  // A genuinely missing user is not a manual contact. Preserve the FK boundary.
  assert.throws(() => database.prepare('INSERT INTO homeowner_contacts(homeowner_id,provider_id,contact_user_id,category) VALUES(?,?,?,?)').run(7, 12, 12, 'Haus & Allgemein'), /FOREIGN KEY/);
  assert.equal(store.findByPlatformUserId(7, 12).ok, false);
  database.close();
});

test('ignored outer upsert fires no trigger; conflict upsert mirrors', () => {
  const database = openTestDb();
  const store = storeFor(database);
  seedPlatformContact(database);
  initializeContactDirectory(database);
  const before = store.findByPlatformUserId(7, 8).value;
  assert.equal(before.legacyCategory, 'Heizung & Sanitär');
  const ignored = database
    .prepare('INSERT OR IGNORE INTO homeowner_contacts(homeowner_id,provider_id,contact_user_id,category) VALUES(?,?,?,?)')
    .run(7, 8, 8, 'Elektro');
  assert.equal(ignored.changes, 0);
  assert.equal(store.findByPlatformUserId(7, 8).value.legacyCategory, 'Heizung & Sanitär');
  database
    .prepare(
      'INSERT INTO homeowner_contacts(homeowner_id,provider_id,contact_user_id,category) VALUES(?,?,?,?) ' +
        'ON CONFLICT(homeowner_id,contact_user_id) DO UPDATE SET category=excluded.category',
    )
    .run(7, 8, 8, 'Elektro');
  assert.equal(store.findByPlatformUserId(7, 8).value.legacyCategory, 'Elektro');
  database
    .prepare('UPDATE homeowner_contacts SET category=? WHERE homeowner_id=? AND contact_user_id=?')
    .run('Garten', 7, 8);
  assert.equal(store.findByPlatformUserId(7, 8).value.legacyCategory, 'Garten');
});

test('receipt composite FK binds receipt owner to entry owner', () => {
  const database = openTestDb();
  const store = storeFor(database);
  database
    .prepare("INSERT INTO users(id,first_name,last_name,phone,email) VALUES(9,'Zweit','Besitzer',NULL,NULL)")
    .run();
  const created = store.createManual({
    ownerId: 7,
    requestId: 'req-receiptfk-1',
    mainId: 'garten',
    initialSubcategoryId: G1,
    subcategoryIds: [G1],
    name: 'Receipt Owner',
    company: '',
    phone: '',
    email: '',
    allowPossibleDuplicate: true,
  });
  assert.equal(created.ok, true);
  assert.throws(() =>
    database
      .prepare('INSERT INTO contact_directory_receipts(homeowner_id,request_id,payload_hash,entry_id) VALUES(?,?,?,?)')
      .run(9, 'req-cross-owner', 'hash', created.value.id),
  );
  database
    .prepare('INSERT INTO contact_directory_receipts(homeowner_id,request_id,payload_hash,entry_id) VALUES(?,?,?,?)')
    .run(7, 'req-same-owner', 'hash', created.value.id);
  database.prepare('DELETE FROM users WHERE id=?').run(7);
  assert.equal(database.prepare('SELECT COUNT(*) c FROM contact_directory_receipts WHERE homeowner_id=?').get(7).c, 0);
  assert.equal(store.list(7).value.length, 0);
});

test('real deletion path: anonymize keeps users row, explicit deletes clear directory PII', () => {
  const database = openTestDb();
  const store = storeFor(database);
  const created = store.createManual({
    ownerId: 7, requestId: 'req-del-real-1', mainId: 'garten',
    initialSubcategoryId: G1, subcategoryIds: [G1],
    name: 'Zu Löschen', company: '', phone: '+49170000001', email: 'del@beispiel.de',
    allowPossibleDuplicate: true,
  });
  assert.equal(created.ok, true);
  // Real deleteAccountData() anonymizes users (UPDATE), never DELETEs -> CASCADE never fires.
  database.prepare("UPDATE users SET email=?, first_name='Gelöscht' WHERE id=?").run('geloescht-7@accounts.anonymisiert.invalid', 7);
  assert.equal(store.get(7, created.value.id).ok, true);
  // Exact statements from patched account-deletion.ts:
  database.prepare('DELETE FROM homeowner_contact_subcategories WHERE homeowner_id=?').run(7);
  database.prepare('DELETE FROM contact_directory_receipts WHERE homeowner_id=?').run(7);
  database.prepare('DELETE FROM homeowner_contact_entries WHERE homeowner_id=?').run(7);
  assert.equal(store.list(7).value.length, 0);
  assert.equal(database.prepare('SELECT COUNT(*) c FROM contact_directory_receipts WHERE homeowner_id=?').get(7).c, 0);
});

test('provider deletion unlinks to manual snapshot, keeps assignments', () => {
  const database = openTestDb();
  seedPlatformContact(database);
  initializeContactDirectory(database);
  const store = storeFor(database);
  const before = store.findByPlatformUserId(7, 8);
  assert.equal(before.ok, true);
  database.prepare('INSERT OR IGNORE INTO homeowner_contact_subcategories(homeowner_id,entry_id,subcategory_id) VALUES(?,?,?)').run(7, before.value.id, G1);
  database.prepare('UPDATE homeowner_contact_entries SET contact_user_id=NULL WHERE contact_user_id=?').run(8);
  const after = store.get(7, before.value.id);
  assert.equal(after.ok, true);
  assert.equal(after.value.platformUserId, null);
  assert.equal(after.value.name, 'Max Meister');
  assert.deepEqual(after.value.subcategoryIds, [G1]);
});
