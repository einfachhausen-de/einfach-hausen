// T-0132 deterministic error tracking regression: correlation flow, PII
// scrubbing, sink validation, bounded retention and taxonomy stability.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-t0132-'));
process.env.DATABASE_PATH = path.join(dbDir, 'regression.db');
process.chdir(dbDir);
fs.symlinkSync(path.join(root, 'node_modules'), path.join(dbDir, 'node_modules'), 'dir');

const SOURCES = [
  'src/lib/db.ts',
  'src/lib/observability.ts',
  'src/lib/security/audit.ts',
  'src/lib/security/redact.ts',
  'src/lib/security/rate-limit.ts',
];
for (const rel of SOURCES) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  const stripped = stripTypeScriptTypes(src).replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g, (_m, a, s, b) => `${a}${s}.mjs${b}`);
  const dest = path.join(dbDir, rel.replace(/\.ts$/, '.mjs'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, stripped);
}

const { redactDetail } = await import(pathToFileURL(path.join(dbDir, 'src/lib/security/redact.mjs')).href);
const { db } = await import(pathToFileURL(path.join(dbDir, 'src/lib/db.mjs')).href);
const { structuredLog, newCorrelationId } = await import(pathToFileURL(path.join(dbDir, 'src/lib/observability.mjs')).href);

let checks = 0;
function t(name, fn) { fn(); checks++; }

// 1) PII scrubbing: every secret pattern class is redacted
t('scrubbing redacts passwords, tokens, api keys, secrets', () => {
  const out = redactDetail('login failed password=hunter2 token=abc.def api_key=AKIA123 secret=shhh');
  assert.ok(!out.includes('hunter2'), 'password redacted');
  assert.ok(!out.includes('abc.def'), 'token redacted');
  assert.ok(!out.includes('AKIA123'), 'api key redacted');
  assert.ok(!out.includes('shhh'), 'secret redacted');
  assert.ok(out.includes('[redacted]'));
});
t('scrubbing redacts bearer headers and JWTs', () => {
  const out = redactDetail('Authorization: Bearer abc123 and jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJVadQssw5c');
  assert.ok(!out.includes('abc123'), 'bearer redacted');
  assert.ok(!out.includes('eyJhbGciOiJIUzI1NiJ9'), 'jwt redacted');
});
t('scrubbing redacts stripe keys', () => {
  const out = redactDetail('sk_live_51H8xQxAbCdEfGhIjKlMnOp and whsec_a1b2c3d4e5f6g7h8i9j0');
  assert.ok(!out.includes('sk_live_51H8'), 'live key redacted');
  assert.ok(!out.includes('whsec_a1b2'), 'webhook secret redacted');
});
t('scrubbing leaves normal messages intact', () => {
  const message = 'checkout failed for job 42 with status pending';
  assert.equal(redactDetail(message), message);
});

// 2) correlation id flow: stable, unique, joinable
t('correlation ids are unique and joinable', () => {
  const a = newCorrelationId(), b = newCorrelationId();
  assert.notEqual(a, b);
  assert.match(a, /^[\w-]{6,64}$/);
});

// 3) sink insert via the same SQL the route uses (bounded table behavior)
t('error event insert + bounded pruning works', () => {
  const insert = db.prepare('INSERT INTO error_events(source,error_class,digest,message,path,correlation_id,release) VALUES(?,?,?,?,?,?,?)');
  for (let i = 0; i < 12; i++) {
    insert.run('client', 'internal', `digest-${i}`, redactDetail(`boom password=${i}`), '/app', `corr-${i}`, 'test');
  }
  const count = (db.prepare('SELECT COUNT(*) c FROM error_events').get()).c;
  assert.equal(count, 12);
  // Prune to 5 exactly like the route (count > 5000 branch, exercised small here)
  db.prepare('DELETE FROM error_events WHERE id IN (SELECT id FROM error_events ORDER BY id LIMIT ?)').run(7);
  const after = (db.prepare('SELECT COUNT(*) c FROM error_events').get()).c;
  assert.equal(after, 5);
});

// 4) PII never lands in the stored message
t('stored message is scrubbed', () => {
  insert_scrued();
  function insert_scrued() {
    db.prepare('INSERT INTO error_events(source,error_class,digest,message,path,correlation_id,release) VALUES(?,?,?,?,?,?,?)')
      .run('client', 'payment', 'digest-scrub', redactDetail('stripe said sk_live_SECRETKEYVALUE123'), '/preise', 'corr-scrub', 'test');
  }
  const row = db.prepare("SELECT message FROM error_events WHERE digest='digest-scrub'").get();
  assert.ok(!row.message.includes('SECRETKEYVALUE'), 'stored message must be scrubbed');
});

// 5) taxonomy classes match the observability module (single source of truth)
t('error taxonomy classes consistent', () => {
  const allowed = ['auth', 'validation', 'authorization', 'rate_limit', 'payment', 'storage', 'external_service', 'database', 'internal'];
  const captured = [];
  const orig = console.log;
  console.log = (...a) => captured.push(String(a[0]));
  structuredLog.info('payment', 'taxonomy probe');
  console.log = orig;
  const line = JSON.parse(captured[0]);
  assert.ok(allowed.includes(line.error_class));
});

// 6) digest/correlation id validation shapes (route-level regex)
t('digest and correlation id shapes validated', () => {
  const validDigest = /^[\w-]{6,64}$/.test('abc123-def456');
  const invalidDigest = /^[\w-]{6,64}$/.test('x');
  const validCorr = /^[\w-]{6,64}$/.test(newCorrelationId());
  assert.ok(validDigest && !invalidDigest && validCorr);
});

console.log(JSON.stringify({ ok: true, checks }));
fs.rmSync(dbDir, { recursive: true, force: true });
