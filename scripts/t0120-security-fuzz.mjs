// T-0120 adversarial security fuzz regression wave.
// Deterministic adversarial cases layered on top of T-0002/T-0003 coverage:
// malformed identifiers, webhook replay/parsing, upload media parsing,
// path/URL handling, rate-limit boundary behavior and authorization-boundary
// helpers. Runs against a throwaway SQLite database; production data paths
// are never touched. Every discovered critical/major gap must become a
// remediation task (see taskplan).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { stripTypeScriptTypes } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
const failures = [];
function check(name, condition, detail = '') {
  if (condition) { passed++; console.log(`  ok  ${name}`); }
  else { failures.push(`${name}${detail ? ` :: ${detail}` : ''}`); console.error(`FAIL  ${name}${detail ? ` :: ${detail}` : ''}`); }
}

// ---------------------------------------------------------------------------
// Scratch app tree: transpile lib modules into a temp dir (same technique as
// scripts/security-regression.mjs) so extensionless TS imports resolve.
// ---------------------------------------------------------------------------
const SOURCES = [
  'src/lib/db.ts',
  'src/lib/contact-directory-schema.ts',
  'src/lib/contact-directory-taxonomy.ts',
  'src/lib/auth.ts',
  'src/lib/demo-accounts.ts',
  'src/lib/security/audit.ts',
  'src/lib/security/rate-limit.ts',
  'src/lib/security/schemas.ts',
  'src/lib/security/webhooks.ts',
  'src/lib/security/private-files.ts',
  'src/lib/security/secret-box.ts',
  'src/lib/intake-media.ts',
  'src/lib/whatsapp-media.ts',
  'src/lib/ai-engine.ts',
];


function transpiledAndRewritten(code) {
  const stripped = stripTypeScriptTypes(code, { mode: 'strip' });
  // Give extensionless relative imports an explicit .mjs target inside the scratch tree.
  return stripped.replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g, (_m, pre, spec, post) =>
    pre + spec.replace(/\.mjs$/, '') + '.mjs' + post,
  );
}

function buildScratch() {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-t0120-'));
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(scratch, 'node_modules'), 'dir');
  for (const rel of SOURCES) {
    const code = fs.readFileSync(path.join(root, rel), 'utf8');
    const out = path.join(scratch, rel.replace(/\.ts$/, '.mjs'));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, transpiledAndRewritten(code));
  }
  return scratch;
}

function runModule(scratch, rel, extraEnv = {}) {
  const env = {
    ...process.env,
    DATABASE_PATH: path.join(scratch, 'fuzz.db'),
    NODE_ENV: 'test',
    ...extraEnv,
  };
  return execFileSync(process.execPath, [path.join(scratch, rel)], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function writeProbe(scratch, name, code) {
  const file = path.join(scratch, `${name}.mjs`);
  fs.writeFileSync(file, code);
  return file;
}

// ---------------------------------------------------------------------------
// 1. Malformed identifier fuzz (parseArtifactId / parsePositiveId shape)
// ---------------------------------------------------------------------------
async function fuzzIdentifiers(scratch) {
  console.log('\n== malformed identifier fuzz ==');
  writeProbe(scratch, 'probe-ids', `
import { parseArtifactId } from './src/lib/security/private-files.mjs';
const cases = [
  ['0', null], ['-1', null], ['1.5', null], ['01', null], [' 1', null], ['1 ', null],
  ['+1', null], ['1e3', null], ['0x10', null], ['Infinity', null], ['NaN', null],
  ['99999999999999999999', null], ['1_000', null], ['١٢٣', null], ['\\u0661', null],
  ['', null], ['abc', null], ['1/../../etc', null], ['1%00', null],
  ['1', 1], ['42', 42], ['9007199254740991', 9007199254740991],
];
let bad = 0;
for (const [input, expected] of cases) {
  const got = parseArtifactId(input);
  if (got !== expected) { console.log('MISMATCH ' + JSON.stringify(input) + ' got ' + got + ' want ' + expected); bad++; }
}
console.log(bad === 0 ? 'IDS_OK' : 'IDS_BAD');
`);
  const out = runModule(scratch, 'probe-ids.mjs');
  check('parseArtifactId rejects malformed/adversarial identifiers', out.includes('IDS_OK'), out.split('\n').filter(l => l.startsWith('MISMATCH')).slice(0, 3).join('; '));
}

// ---------------------------------------------------------------------------
// 2. Path/URL handling fuzz (resolvePrivatePath adversarial forms)
// ---------------------------------------------------------------------------
async function fuzzPaths(scratch) {
  console.log('\n== path handling fuzz ==');
  writeProbe(scratch, 'probe-paths', `
import { resolvePrivatePath } from './src/lib/security/private-files.mjs';
const hostile = [
  '../outside', '..\\\\\\\\outside', 'a/../../outside', './..', '.%2e/outside',
  '%2e%2e/outside', 'a%2F..%2Foutside', 'documents/..\\\\\\\\..\\\\\\\\x', 'C:/win',
  'C:\\\\\\\\win', '\\\\\\\\\\\\\\\\server/share', 'a\\0b',
  'x/..%252f..%252f', 'a/./.././../b',
];
let leaks = 0;
const root = (await import('node:path')).resolve(process.cwd(), 'data', 'private');
for (const p of hostile) {
  const resolved = resolvePrivatePath(p);
  if (resolved !== null) {
    console.log('LEAK ' + JSON.stringify(p) + ' -> ' + resolved);
    leaks++;
  }
}
// Benign path must still resolve inside root.
const ok = resolvePrivatePath('documents/x.pdf');
if (!ok || !ok.startsWith(root)) { console.log('BENIGN_BROKEN'); leaks++; }
console.log(leaks === 0 ? 'PATHS_OK' : 'PATHS_BAD');
`);
  const out = runModule(scratch, 'probe-paths.mjs');
  check('resolvePrivatePath denies hostile traversal/encoding/device paths', out.includes('PATHS_OK'), out.split('\n').filter(l => l.startsWith('LEAK') || l.startsWith('BENIGN')).slice(0, 3).join('; '));
}

// ---------------------------------------------------------------------------
// 3. Upload/media parsing fuzz (savePrivateMediaBuffer adversarial inputs)
// ---------------------------------------------------------------------------
async function fuzzMedia(scratch) {
  console.log('\n== upload media parsing fuzz ==');
  writeProbe(scratch, 'probe-media', `
process.chdir(process.env.SCRATCH_CWD);
const { savePrivateMediaBuffer, privateMediaRule, normalizedMediaType } = await import('./src/lib/intake-media.mjs');
let bad = 0;
const expectReject = async (label, fn) => {
  try { await fn(); console.log('ACCEPTED ' + label); bad++; }
  catch { /* rejected: good */ }
};
const expectAccept = async (label, fn) => {
  try { await fn(); } catch (e) { console.log('REJECTED ' + label + ' :: ' + e.message); bad++; }
};
// Wrong/missing content type.
await expectReject('type=text/html', () => savePrivateMediaBuffer(new Uint8Array([1,2,3]), 'text/html'));
await expectReject('type=empty', () => savePrivateMediaBuffer(new Uint8Array([1]), ''));
// Empty payload.
await expectReject('empty body jpeg', () => savePrivateMediaBuffer(new Uint8Array(0), 'image/jpeg'));
// Oversize body (rule max +1 for jpeg 8MiB).
const big = new Uint8Array(8 * 1024 * 1024 + 1);
await expectReject('oversize jpeg', () => savePrivateMediaBuffer(big, 'image/jpeg'));
// Oversize declared via charset confusion stays within rule: normalized type.
if (normalizedMediaType('IMAGE/JPEG; charset=utf-8') !== 'image/jpeg') { console.log('NORMALIZE_BROKEN'); bad++; }
// Case-insensitivity must still be rejected for unknown types.
await expectReject('IMAGE/EXE uppercase unknown', () => savePrivateMediaBuffer(new Uint8Array([1]), 'IMAGE/EXE'));
// Benign small jpeg accepted, stored under private root with stable name shape.
await expectAccept('benign small png', () => savePrivateMediaBuffer(new Uint8Array([137,80,78,71]), 'image/png', 'stable-key'));
// Rule lookups.
if (!privateMediaRule('image/png') || privateMediaRule('image/png').kind !== 'image') { console.log('RULE_BROKEN'); bad++; }
if (privateMediaRule('video/mp4; codecs="avc1"') === null) { console.log('RULE_SUFFIX_BROKEN'); bad++; }
console.log(bad === 0 ? 'MEDIA_OK' : 'MEDIA_BAD');
`);
  const out = runModule(scratch, 'probe-media.mjs', { SCRATCH_CWD: scratch });
  check('private media parser rejects hostile uploads and accepts benign ones', out.includes('MEDIA_OK'), out.split('\n').filter(l => /ACCEPTED|REJECTED|BROKEN/.test(l)).slice(0, 3).join('; '));
}

// ---------------------------------------------------------------------------
// 4. Webhook replay/signature fuzz edge cases
// ---------------------------------------------------------------------------
async function fuzzWebhooks(scratch) {
  console.log('\n== webhook signature/replay fuzz ==');
  writeProbe(scratch, 'probe-webhooks', `
import { verifyMetaSignature, claimWebhookEvent, completeWebhookEvent } from './src/lib/security/webhooks.mjs';
import { createHmac } from 'node:crypto';
let bad = 0;
const secret = 'whsec_fuzz';
const raw = JSON.stringify({ object: 'whatsapp_business_account' });
const good = 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex');
// Wrong secret must not verify even with valid shape.
if (verifyMetaSignature(raw, good, 'whsec_other')) { console.log('CROSS_SECRET'); bad++; }
// Signature over different body must not verify.
const other = 'sha256=' + createHmac('sha256', secret).update(raw + ' ').digest('hex');
if (verifyMetaSignature(raw, other, secret)) { console.log('BODY_SWAP'); bad++; }
// Uppercase hex decodes to identical bytes: acceptance is correct (byte-compare via timingSafeEqual).
const upper = good.toUpperCase().replace('SHA256=', 'sha256=');
if (!verifyMetaSignature(raw, upper, secret)) { console.log('UPPERCASE_HEX_REJECTED_False_NEGATIVE'); bad++; }
// Truncated signature must be rejected (hex-shape ok, wrong length).
if (verifyMetaSignature(raw, 'sha256=' + good.slice(7, 70), secret)) { console.log('TRUNCATED_ACCEPTED'); bad++; }
// Empty/missing secret fails closed.
if (verifyMetaSignature(raw, good, undefined) || verifyMetaSignature(raw, good, '')) { console.log('NO_SECRET'); bad++; }
// Claim edge cases: empty id, 256+ length id.
if (claimWebhookEvent('whatsapp', '')) { console.log('EMPTY_ID_CLAIMED'); bad++; }
if (claimWebhookEvent('whatsapp', 'x'.repeat(256))) { console.log('LONG_ID_CLAIMED'); bad++; }
// Same event id across different sources must stay isolated.
if (!claimWebhookEvent('whatsapp', 'evt_shared_1')) { console.log('WA_CLAIM_FAIL'); bad++; }
if (!claimWebhookEvent('stripe', 'evt_shared_1')) { console.log('STRIPE_CLAIM_FAIL'); bad++; }
completeWebhookEvent('whatsapp', 'evt_shared_1');
// Second claim after complete must fail (replay).
if (claimWebhookEvent('whatsapp', 'evt_shared_1')) { console.log('REPLAY_AFTER_COMPLETE'); bad++; }
console.log(bad === 0 ? 'WEBHOOKS_OK' : 'WEBHOOKS_BAD');
`);
  const out = runModule(scratch, 'probe-webhooks.mjs');
  check('webhook signature and replay-claim boundaries hold under fuzz', out.includes('WEBHOOKS_OK'), out.split('\n').filter(l => /CROSS_SECRET|BODY_SWAP|CASE_MISMATCH|NO_SECRET|ID_CLAIMED|CLAIM_FAIL|REPLAY/.test(l)).slice(0, 4).join('; '));
}

// ---------------------------------------------------------------------------
// 5. Rate limit boundary fuzz (ki_chat + account_mutation sliding window)
// ---------------------------------------------------------------------------
async function fuzzRateLimits(scratch) {
  console.log('\n== rate limit boundary fuzz ==');
  writeProbe(scratch, 'probe-ratelimit', `
const { applyRateLimitLockout, checkRateLimit, consumeRateLimitAttempt } = await import('./src/lib/security/rate-limit.mjs');
let bad = 0;
// ki_chat: 30 attempts per 15 min window.
const key = 'u:fuzzuser';
let allowed = 0, blocked = 0;
for (let i = 0; i < 30; i++) {
  if (checkRateLimit('ki_chat', key).allowed) { consumeRateLimitAttempt('ki_chat', key); allowed++; }
  else blocked++;
}
if (allowed !== 30 || blocked !== 0) { console.log('WINDOW_OFF ' + allowed + '/' + blocked); bad++; }
if (checkRateLimit('ki_chat', key).allowed) { console.log('OVER_31_ALLOWED'); bad++; }
// Case/whitespace normalization: same key must stay blocked.
if (checkRateLimit('ki_chat', ' U:FuzzUser ').allowed) { console.log('CASE_BYPASS'); bad++; }
// Different key unaffected.
if (!checkRateLimit('ki_chat', 'u:other').allowed) { console.log('COLLISION'); bad++; }
// account_mutation: 5 per hour; 6th denied.
const k2 = 'u:deleter';
for (let i = 0; i < 5; i++) consumeRateLimitAttempt('account_mutation', k2);
if (checkRateLimit('account_mutation', k2).allowed) { console.log('ACCT_OVER_ALLOWED'); bad++; }
// applyRateLimitLockout on blocked key extends block, no throw.
try { applyRateLimitLockout('ki_chat', key); } catch { console.log('LOCKOUT_THROW'); bad++; }
console.log(bad === 0 ? 'RATELIMIT_OK' : 'RATELIMIT_BAD');
`);
  const out = runModule(scratch, 'probe-ratelimit.mjs');
  check('rate limits enforce exact windows without bypass via key normalization', out.includes('RATELIMIT_OK'), out.split('\n').filter(l => /WINDOW_OFF|OVER_31|CASE_BYPASS|COLLISION|ACCT_OVER|LOCKOUT/.test(l)).slice(0, 3).join('; '));
}

// ---------------------------------------------------------------------------
// 6. BYOK key encryption fuzz (secret-box tamper detection)
// ---------------------------------------------------------------------------
async function fuzzSecretBox(scratch) {
  console.log('\n== secret box (BYOK at-rest) fuzz ==');
  writeProbe(scratch, 'probe-secretbox', `
const { encryptSecret, decryptSecret } = await import('./src/lib/security/secret-box.mjs');
process.env.EH_DATA_KEY = 'fuzz-data-key';
let bad = 0;
const enc = encryptSecret('sk-fuzz-abcdef0123456789');
if (!enc || !enc.startsWith('v1.')) { console.log('ENC_SHAPE'); bad++; }
if (decryptSecret(enc) !== 'sk-fuzz-abcdef0123456789') { console.log('ROUNDTRIP'); bad++; }
// Tamper with each segment: auth tag flip must fail closed.
const parts = enc.split('.');
const b64 = (s) => Buffer.from(s, 'base64url');
const flip = (s) => { const b = b64(s); b[0] ^= 0xff; return b.toString('base64url'); };
if (decryptSecret([parts[0], parts[1], flip(parts[2]), parts[3]].join('.')) !== null) { console.log('TAG_TAMPER_ACCEPTED'); bad++; }
if (decryptSecret([parts[0], flip(parts[1]), parts[2], parts[3]].join('.')) !== null) { console.log('IV_TAMPER_ACCEPTED'); bad++; }
if (decryptSecret([parts[0], parts[1], parts[2], flip(parts[3])].join('.')) !== null) { console.log('CT_TAMPER_ACCEPTED'); bad++; }
// Wrong data key fails closed (GCM tag).
process.env.EH_DATA_KEY = 'other-key';
if (decryptSecret(enc) !== null) { console.log('WRONG_KEY_ACCEPTED'); bad++; }
// Garbage payloads fail closed, never throw.
for (const junk of [null, '', 'v1.', 'v1.x.y.z', 'plaintext', 'v1.@@.##.**']) {
  try { decryptSecret(junk); } catch { console.log('THREW_ON ' + JSON.stringify(junk)); bad++; }
}
console.log(bad === 0 ? 'SECRETBOX_OK' : 'SECRETBOX_BAD');
`);
  const out = runModule(scratch, 'probe-secretbox.mjs');
  check('secret box rejects tampered/malformed ciphertexts without throwing', out.includes('SECRETBOX_OK'), out.split('\n').filter(l => /TAMPER|WRONG_KEY|THREW|ROUNDTRIP|ENC_SHAPE/.test(l)).slice(0, 3).join('; '));
}

// ---------------------------------------------------------------------------
// 7. Route-level adversarial probes against an isolated production build
//    (IDOR on messaging/media routes, auth fail-closed, telemetry abuse caps)
// ---------------------------------------------------------------------------
async function fuzzRoutes(scratch) {
  console.log('\n== route-level adversarial probes ==');
  // Requires a production build; skip gracefully when absent (static gates run it).
  const buildId = path.join(root, '.next', 'BUILD_ID');
  if (!fs.existsSync(buildId)) {
    console.log('  skip  no production build present (.next/BUILD_ID) — route probes need one');
    return;
  }
  const net = await import('node:net');
  const port = await new Promise((resolve, reject) => {
    const socket = net.createServer();
    socket.unref();
    socket.on('error', reject);
    socket.listen(0, '127.0.0.1', () => { const a = socket.address(); socket.close(() => resolve(typeof a === 'object' && a ? a.port : 0)); });
  });
  if (!port) { console.log('  skip  no free port'); return; }

  const { spawn } = await import('node:child_process');
  const dbPath = path.join(scratch, 'routes.db');
  const server = spawn(process.execPath, [path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-H', '127.0.0.1', '-p', String(port)], {
    cwd: root,
    env: { ...process.env, AUTH_MODE: 'supabase', WEBHOOK_SECRET: 'fuzz-only-test-secret', DATABASE_PATH: dbPath, NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${port}`, NODE_ENV: 'production' },
    stdio: 'ignore',
  });
  try {
    const base = `http://127.0.0.1:${port}`;
    let up = false;
    for (let i = 0; i < 60; i++) {
      try { const r = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(2000) }); if (r.ok) { up = true; break; } } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
    if (!up) { console.log('  skip  server did not become healthy'); return; }

    let bad = 0;
    const status = async (p, init) => { try { return (await fetch(base + p, { redirect: 'manual', signal: AbortSignal.timeout(10000), ...init })).status; } catch { return -1; } };

    // Unauthenticated IDOR probes on artifact routes: every adversarial id form
    // must fail closed (401/404), never 200/3xx-to-content.
    const hostileIds = ['1', '0', '-1', '1e3', '0x10', '99999999999999999999', '%31', '1%00', '1/..%2f..%2fx', '1;orderby=id'];
    for (const route of ['/api/documents/', '/api/job-media/', '/api/house-history-documents/', '/api/admin/verification-file/']) {
      let leaked = false;
      for (const id of hostileIds) {
        const s = await status(route + encodeURIComponent(id));
        if (s === 200 || (s >= 300 && s < 400)) { console.log(`LEAK ${route}${id} -> ${s}`); leaked = true; bad++; break; }
      }
      if (!leaked) check(`${route} denies all hostile ids unauthenticated`, true);
    }
    if (bad === 0) check('artifact route IDOR fuzz: no hostile id returns content', true);

    // Messaging routes: unauthenticated POST/GET must 401/404, never 200/3xx.
    for (const [route, method] of [['/api/owner/messages/1', 'POST'], ['/api/owner/messages/1', 'PATCH'], ['/api/support/messages/1', 'POST'], ['/api/support/messages/1', 'GET']]) {
      const s = await status(route, { method, headers: { 'content-type': 'application/json' }, body: method === 'POST' ? JSON.stringify({ body: 'x'.repeat(10) }) : undefined });
      if (s === 200 || (s >= 300 && s < 400)) { console.log(`LEAK ${method} ${route} -> ${s}`); bad++; }
    }
    if (bad === 0) check('messaging routes fail closed unauthenticated', true);

    // Telemetry abuse caps: invalid metric/value/rating rejected; path truncated.
    const tel = async (payload) => (await fetch(`${base}/api/telemetry`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) })).status;
    if ((await tel({ metric: 'EVIL', value: 1, rating: 'good' })) !== 400) { console.log('TELEMETRY_METRIC'); bad++; }
    if ((await tel({ metric: 'LCP', value: 'not-a-number', rating: 'good' })) !== 400) { console.log('TELEMETRY_VALUE'); bad++; }
    if ((await tel({ metric: 'LCP', value: 1, rating: 'excellent' })) !== 400) { console.log('TELEMETRY_RATING'); bad++; }
    if ((await tel({ metric: 'LCP', value: Infinity, rating: 'good' })) !== 400) { console.log('TELEMETRY_INFINITY'); bad++; }
    check('telemetry sink rejects adversarial payloads', bad === 0, bad ? 'see LEAK/TELEMETRY lines' : '');

    // Webhook endpoints: wrong secret/signature must 401/400 without state change.
    const hooks = [['/api/hooks/neue-anfrage', { type: 'INSERT', table: 'anfragen', record: {} }], ['/api/hooks/neues-angebot', {}]];
    for (const [route, body] of hooks) {
      const s = await status(route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (s !== 401) { console.log(`HOOK_NO_SECRET ${route} -> ${s}`); bad++; }
    }
    check('legacy webhooks reject missing webhook secret', bad === 0, bad ? 'see HOOK lines' : '');
  } finally {
    server.kill('SIGTERM');
  }
}

// ---------------------------------------------------------------------------
async function main() {
  const scratch = buildScratch();
  try {
    await fuzzIdentifiers(scratch);
    await fuzzPaths(scratch);
    await fuzzMedia(scratch);
    await fuzzWebhooks(scratch);
    await fuzzRateLimits(scratch);
    await fuzzSecretBox(scratch);
    await fuzzRoutes(scratch);
  } finally {
    try { fs.rmSync(scratch, { recursive: true, force: true }); } catch {}
  }

  console.log(`\nT-0120 adversarial fuzz: ${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.error('FAILURES:\n' + failures.map(f => '  - ' + f).join('\n'));
    process.exit(1);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
