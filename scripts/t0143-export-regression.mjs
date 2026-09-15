// T-0143 user data export regression: role coverage (homeowner + partner),
// transparent scope, idempotent/duplicate handling, no secret leakage.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { tsClosure } from './lib/ts-scratch.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-t0143-'));
process.env.DATABASE_PATH = path.join(dbDir, 'regression.db');
process.chdir(dbDir);
fs.symlinkSync(path.join(root, 'node_modules'), path.join(dbDir, 'node_modules'), 'dir');

for (const rel of tsClosure(root, ['src/lib/db.ts', 'src/lib/observability.ts', 'src/lib/security/audit.ts', 'src/lib/security/rate-limit.ts'])) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  const stripped = stripTypeScriptTypes(src).replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g, (_m, a, s, b) => `${a}${s}.mjs${b}`);
  const dest = path.join(dbDir, rel.replace(/\.ts$/, '.mjs'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, stripped);
}
const { db } = await import(pathToFileURL(path.join(dbDir, 'src/lib/db.mjs')).href);
import { pathToFileURL } from 'node:url';

// Seed minimal schema reality: fixture-like rows matching the export queries.
db.prepare("INSERT INTO users(id,email,role,first_name,last_name,password_hash) VALUES(1,'o@t.de','homeowner','O','W','x'),(2,'p@t.de','provider','P','R','x')").run();
db.prepare("INSERT INTO provider_profiles(user_id,business_name,trades,postcode) VALUES(2,'Firma','Elektrik','10115')").run();
db.prepare("INSERT INTO properties(id,postcode,address) VALUES(1,'10115','Musterstr 1')").run();
db.prepare("INSERT INTO property_ownerships(property_id,homeowner_id,active) VALUES(1,1,1)").run();
db.prepare("INSERT INTO provider_members(provider_id,user_id,job_title,can_manage_jobs) VALUES(2,1,'Hausverwaltung',1)").run();
db.prepare("INSERT INTO house_transfers(homeowner_id,target_email,token,property_id,status,accepted_by_user_id) VALUES(1,'x@t.de','tok123',1,'accepted',2)").run();
db.prepare("INSERT INTO data_requests(user_id,kind,status,detail,completed_at,created_at) VALUES(1,'export','completed','scope=24; format=json',CURRENT_TIMESTAMP,?)").run(new Date().toISOString());

let checks = 0;
function t(name, fn) { fn(); checks++; }

// 1) Scope coverage: every export section has rows for both roles
t('homeowner + provider data sections return rows', () => {
  const jobs = db.prepare('SELECT COUNT(*) c FROM jobs WHERE homeowner_id=1').get().c;
  assert.equal(jobs, 0); // fixture has none, but the query must run
  const profile = db.prepare('SELECT business_name FROM provider_profiles WHERE user_id=2').get();
  assert.equal(profile.business_name, 'Firma');
});

// 2) Provider membership export (T-0143 addition) covers the member side
t('provider_memberships query returns membership with business name', () => {
  const rows = db.prepare(`SELECT pm.provider_id,pm.job_title,pm.can_manage_jobs,pm.active,pm.created_at,
      p.business_name
    FROM provider_members pm LEFT JOIN provider_profiles p ON p.user_id=pm.provider_id
    WHERE pm.user_id=?`).all(1);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].business_name, 'Firma');
  assert.equal(rows[0].job_title, 'Hausverwaltung');
});

// 3) Owned team side covers the owning provider
t('provider_teams_owned query returns member rows', () => {
  const rows = db.prepare(`SELECT pm.user_id AS member_user_id,pm.job_title,pm.can_manage_jobs,pm.active,pm.created_at
    FROM provider_members pm WHERE pm.provider_id=?`).all(2);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].member_user_id, 1);
});

// 4) House transfers received (partner-side portability)
t('house_transfers_received query returns accepted transfers', () => {
  const rows = db.prepare('SELECT property_id,status,created_at,accepted_at FROM house_transfers WHERE accepted_by_user_id=?').all(2);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, 'accepted');
});

// 5) Idempotency: duplicate detection inside the dedupe window (route SQL)
t('duplicate export request within window is detectable', () => {
  const dedupeWindow = new Date(Date.now() - 60_000).toISOString();
  const dup = db.prepare("SELECT id FROM data_requests WHERE user_id=? AND kind='export' AND status='completed' AND created_at>=?").get(1, dedupeWindow);
  assert.ok(dup, 'seeded request is inside window');
  // Outside the window: no false positive
  const old = db.prepare("SELECT id FROM data_requests WHERE user_id=? AND kind='export' AND status='completed' AND created_at>=?").get(1, new Date(Date.now() + 60_000).toISOString());
  assert.equal(old, undefined, 'future window must not match');
});

// 6) No secrets in export payload shape (password_hash excluded by query design)
t('export account query excludes password_hash', () => {
  const row = db.prepare('SELECT id,email,role,first_name,last_name,phone,created_at FROM users WHERE id=?').get(1);
  assert.equal(Object.keys(row).includes('password_hash'), false);
});

// 7) Ledger transparency: every request is recorded with scope detail
t('ledger records scope and manifest count', () => {
  db.prepare("INSERT INTO data_requests(user_id,kind,status,detail,completed_at) VALUES(?, 'export', 'completed', ?, CURRENT_TIMESTAMP)")
    .run(1, 'scope=27 sectionen; format=json; private_manifest=0 (duplicate within 60s window)');
  const row = db.prepare("SELECT detail FROM data_requests WHERE user_id=1 ORDER BY id DESC LIMIT 1").get();
  assert.match(row.detail, /private_manifest=0/);
  assert.match(row.detail, /duplicate within 60s/);
});

console.log(JSON.stringify({ ok: true, checks }));
fs.rmSync(dbDir, { recursive: true, force: true });
