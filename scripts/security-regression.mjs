// Focused deterministic security regressions for T-0002 (auth/session/validation/headers).
// Runs against a throwaway SQLite database; the live data/einfach-hausen.db is never touched.
//
// Self-contained runner: the app's TypeScript modules use extensionless relative
// imports, which plain `node` cannot resolve even with native type stripping.
// Instead of shipping extra loader files, this script transpiles the needed
// modules IN MEMORY via node:module stripTypeScriptTypes into an os.tmpdir()
// scratch tree (with node_modules symlinked for bare specifiers) and imports
// them from there. No repository files are created or modified at test time.
//
// Real-world probes run as separate OS processes against shared databases:
// multi-writer limiter contention, concurrent session rotation, and populated
// legacy-schema migration — not just in-process helper calls.
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SOURCES = [
  'src/lib/db.ts',
  'src/lib/contact-directory-schema.ts',
  'src/lib/contact-directory-taxonomy.ts',
  'src/lib/auth.ts',
  'src/lib/demo-accounts.ts',
  'src/lib/admin-auth.ts',
  'src/lib/security/audit.ts',
  'src/lib/security/rate-limit.ts',
  'src/lib/security/schemas.ts',
  'next.config.ts',
];

function buildScratch() {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-sec-src-'));
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(scratch, 'node_modules'), 'dir');
  const urls = {};
  for (const rel of SOURCES) {
    const code = fs.readFileSync(path.join(root, rel), 'utf8');
    let out;
    try {
      out = stripTypeScriptTypes(code);
    } catch (error) {
      throw new Error(`stripTypeScriptTypes failed for ${rel}: ${error.message}`);
    }
    // Give extensionless relative imports an explicit .mjs target inside the scratch tree.
    const rewritten = out.replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g, (_m, pre, spec, post) =>
      pre + spec.replace(/\.mjs$/, '') + '.mjs' + post,
    );
    const destRel = rel.replace(/\.ts$/, '.mjs');
    const dest = path.join(scratch, destRel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, rewritten);
    urls[rel] = pathToFileURL(dest).href;
  }
  return { scratch, urls };
}

function cleanupScratch(scratch) {
  try { fs.rmSync(scratch, { recursive: true, force: true }); } catch {}
}

if (!process.env.EH_SEC_SCRATCH) {
  // Parent phase: build scratch, then re-exec self in child phase with it.
  const { scratch } = buildScratch();
  const result = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], {
    env: { ...process.env, EH_SEC_SCRATCH: scratch },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  process.stdout.write(result);
  cleanupScratch(scratch);
  process.exit(0);
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-security-'));
process.env.DATABASE_PATH = path.join(tmpDir, 'regression.db');
process.chdir(tmpDir);
const SCRATCH = process.env.EH_SEC_SCRATCH;
const fixtureAdminPassword = `SecurityE2E!${randomBytes(18).toString('base64url')}`;

let passed = 0;
const failures = [];
function check(name, condition, detail = '') {
  if (condition) { passed++; console.log(`  ok  ${name}`); }
  else { failures.push(`${name}${detail ? ` :: ${detail}` : ''}`); console.error(`FAIL  ${name}${detail ? ` :: ${detail}` : ''}`); }
}

function childEnv(extra = {}) {
  return { ...process.env, DATABASE_PATH: process.env.DATABASE_PATH, EH_SEC_SCRATCH: SCRATCH, ...extra };
}

// Run a short module snippet as a separate OS process using the scratch modules.
function runNode(code, extraEnv = {}, stdio = ['ignore', 'pipe', 'pipe']) {
  return execFileSync(process.execPath, ['--input-type=module', '-e', code], {
    cwd: SCRATCH,
    env: childEnv(extraEnv), encoding: 'utf8', stdio,
  });
}

// Spawn several children at once and resolve when all have exited.
function spawnConcurrently(count, codeFactory, extraEnv = {}) {
  const children = [];
  for (let i = 0; i < count; i++) {
    children.push(new Promise((resolve) => {
      const proc = spawn(process.execPath, ['--input-type=module', '-e', codeFactory(i)], {
        env: childEnv(extraEnv), stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (d) => { stdout += d; });
      proc.stderr.on('data', (d) => { stderr += d; });
      proc.on('close', (code) => resolve({ code, stdout, stderr }));
    }));
  }
  return Promise.all(children);
}

const { db } = await import(pathToFileURL(path.join(SCRATCH, 'src/lib/db.mjs')).href);
// Timestamp helpers: production code writes ISO-with-Z; SQLite datetime('now')
// emits timezone-less UTC that JS would misparse as local time.
const minutesAgoIso = (m) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgoIso = (h) => new Date(Date.now() - h * 3_600_000).toISOString();
const {
  checkRateLimit, consumeRateLimitAttempt, applyRateLimitLockout,
  recordRateLimitFailure, recordRateLimitSuccess,
} = await import(pathToFileURL(path.join(SCRATCH, 'src/lib/security/rate-limit.mjs')).href);
const { logAdminAudit, logSecurityEvent } = await import(pathToFileURL(path.join(SCRATCH, 'src/lib/security/audit.mjs')).href);
const auth = await import(pathToFileURL(path.join(SCRATCH, 'src/lib/auth.mjs')).href);
const adminAuth = await import(pathToFileURL(path.join(SCRATCH, 'src/lib/admin-auth.mjs')).href);
const schemas = await import(pathToFileURL(path.join(SCRATCH, 'src/lib/security/schemas.mjs')).href);

console.log('\n[AC01] DB-backed rate limiting / lockout (sliding-inactivity window)');
check('login allowed initially', checkRateLimit('login', 'user@test.dev').allowed === true);
for (let i = 0; i < 5; i++) recordRateLimitFailure('login', 'user@test.dev');
{
  const blocked = checkRateLimit('login', 'user@test.dev');
  check('blocked after max failures', blocked.allowed === false && blocked.retryAfterSeconds > 0);
}
{
  const before = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  const blockedAgain = checkRateLimit('login', 'user@test.dev');
  const after = db.prepare('SELECT COUNT(*) c FROM users').get().c;
  check('blocked verdict causes no user mutation', blockedAgain.allowed === false && before === after);
}
{
  // Sliding semantics: fresh activity extends the window instead of resetting attempts.
  db.prepare(`INSERT INTO auth_rate_limits(kind,identifier,attempts,window_start_at,blocked_until)
    VALUES('login','user@test.dev',4,?,NULL)
    ON CONFLICT(kind,identifier) DO UPDATE SET attempts=4,window_start_at=excluded.window_start_at,blocked_until=NULL`).run(minutesAgoIso(14));
  recordRateLimitFailure('login', 'user@test.dev');
  const row = db.prepare("SELECT attempts FROM auth_rate_limits WHERE identifier='user@test.dev'").get();
  check('activity within window accumulates to lockout', row.attempts === 5);
}
{
  // Expiry: lockout window passes -> identifier is allowed again.
  const pastIso = new Date(Date.now() - 1_000).toISOString();
  db.prepare("UPDATE auth_rate_limits SET blocked_until=?, window_start_at=? WHERE identifier='user@test.dev'").run(pastIso, hoursAgoIso(2));
  const expired = checkRateLimit('login', 'user@test.dev');
  check('lockout expires and allows retry', expired.allowed === true);
  db.prepare("UPDATE auth_rate_limits SET attempts=99, window_start_at=?, blocked_until=NULL WHERE identifier='user@test.dev'").run(minutesAgoIso(16));
  check('stale window resets counter', checkRateLimit('login', 'user@test.dev').allowed === true);
}
{
  recordRateLimitSuccess('login', 'user@test.dev');
  const remaining = db.prepare("SELECT COUNT(*) c FROM auth_rate_limits WHERE identifier='user@test.dev'").get().c;
  check('success clears limiter row', remaining === 0);
}
for (let i = 0; i < 10; i++) recordRateLimitFailure('register', 'signup-flood');
check('register bucket blocks at its own threshold', checkRateLimit('register', 'signup-flood').allowed === false);
check('register block does not leak into login bucket', checkRateLimit('login', 'signup-flood').allowed === true);
recordRateLimitFailure('admin_login', '127.0.0.1');
check('admin_login tracked independently by ip', checkRateLimit('admin_login', '127.0.0.1').allowed === true);
{
  const lockRow = db.prepare("SELECT blocked_until FROM auth_rate_limits WHERE kind='register' AND identifier='signup-flood'").get();
  check('lockout persisted durably in DB', !!lockRow && !!lockRow.blocked_until);
}
{
  // Malformed persisted state must fail closed, never open the gate.
  db.prepare("INSERT INTO auth_rate_limits(kind,identifier,attempts,window_start_at,blocked_until) VALUES('login','corrupt-state',1,'not-a-timestamp','also-bad')").run();
  check('malformed state denies access', checkRateLimit('login', 'corrupt-state').allowed === false);
  db.prepare("UPDATE auth_rate_limits SET window_start_at=?, blocked_until=NULL WHERE identifier='corrupt-state'").run(new Date().toISOString());
  const consumed = consumeRateLimitAttempt('login', 'corrupt-state');
  check('consumption on repaired state works', consumed.consumed === true && consumed.blocked === false);
}
console.log('\n[AC01] Fail-closed behavior');
{
  db.exec('DROP TABLE auth_rate_limits');
  const degraded = checkRateLimit('login', 'anyone');
  check('limiter failure denies access', degraded.allowed === false);
  let threw = false;
  try { recordRateLimitFailure('login', 'anyone'); } catch { threw = true; }
  check('failure recording never throws', threw === false);
  const consumed = consumeRateLimitAttempt('login', 'anyone');
  check('attempt consumption fails closed without storage', consumed.consumed === false);
  db.exec(`CREATE TABLE IF NOT EXISTS auth_rate_limits (kind TEXT NOT NULL,identifier TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,window_start_at TEXT NOT NULL,blocked_until TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(kind,identifier))`);
}
console.log('\n[AC01] Atomic consumption gates the in-flight batch');
{
  for (let i = 0; i < 5; i++) {
    const v = consumeRateLimitAttempt('login', 'batch-user');
    if (i < 4) check(`attempt ${i + 1} consumed`, v.consumed === true && v.blocked === false);
    else check('fifth attempt triggers block at threshold', v.consumed === true && v.blocked === true);
  }
  const sixth = consumeRateLimitAttempt('login', 'batch-user');
  check('post-lockout consumption refuses', sixth.consumed === false);
  applyRateLimitLockout('login', 'batch-user');
  check('lockout marked after failed attempt', checkRateLimit('login', 'batch-user').allowed === false);
  recordRateLimitSuccess('login', 'batch-user');
  check('successful login clears both dimensions', checkRateLimit('login', 'batch-user').allowed === true);
}

console.log('\n[AC01] Multi-process write contention probe (shared DB, 8 workers x 10 writes)');
{
  const results = await spawnConcurrently(8, () => `
    const rl = await import('${path.join(SCRATCH, 'src/lib/security/rate-limit.mjs')}');
    for (let i = 0; i < 10; i++) rl.recordRateLimitFailure('admin_mutation', 'contention-probe');
    console.log('worker-done');
  `);
  const okWorkers = results.filter(r => r.code === 0).length;
  const row = db.prepare("SELECT attempts FROM auth_rate_limits WHERE identifier='contention-probe'").get();
  check('all contention workers exited cleanly', okWorkers === 8, `ok=${okWorkers}`);
  check('every contended write persisted (no SQLITE_BUSY loss)', row?.attempts === 80, `attempts=${row?.attempts}`);
}
console.log('\n[AC01] Lockout under cross-process burst');
{
  const results = await spawnConcurrently(6, () => `
    const rl = await import('${path.join(SCRATCH, 'src/lib/security/rate-limit.mjs')}');
    for (let i = 0; i < 3; i++) rl.recordRateLimitFailure('login', 'burst-user');
    console.log('worker-done');
  `);
  const okWorkers = results.filter(r => r.code === 0).length;
  const row = db.prepare("SELECT attempts,blocked_until FROM auth_rate_limits WHERE identifier='burst-user'").get();
  check('burst workers exited cleanly', okWorkers === 6, `ok=${okWorkers}`);
  check('lockout capped exactly at maxAttempts under concurrency', row?.attempts === 5, `attempts=${row?.attempts}`);
  check('burst produced durable lockout', !!row?.blocked_until && checkRateLimit('login', 'burst-user').allowed === false);
}

console.log('\n[AC02] Session rotation / invalidation / expiry / DB-enforced uniqueness');
{
  const insertUser = db.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES(?,?,'homeowner','Test','User')");
  insertUser.run('session-owner-101@test.dev', 'x');
  const u101 = db.prepare("SELECT id FROM users WHERE email='session-owner-101@test.dev'").get().id;
  insertUser.run('session-owner-202@test.dev', 'x');
  const u202 = db.prepare("SELECT id FROM users WHERE email='session-owner-202@test.dev'").get().id;

  const firstToken = auth.rotateAndIssueUserSession(u101).token;
  const secondToken = auth.rotateAndIssueUserSession(u101).token;
  const rows101 = db.prepare('SELECT token FROM sessions WHERE user_id=?').all(u101);
  check('rotation leaves exactly one live session', rows101.length === 1 && rows101[0].token === secondToken);
  check('previous token invalidated by rotation', firstToken !== secondToken &&
    db.prepare('SELECT COUNT(*) c FROM sessions WHERE token=?').get(firstToken).c === 0);
  check('other user unaffected by rotation', (() => {
    auth.rotateAndIssueUserSession(u202);
    return db.prepare('SELECT COUNT(*) c FROM sessions WHERE user_id=?').get(u202).c === 1;
  })());
  const issuedRow = db.prepare('SELECT issued_at FROM sessions WHERE user_id=?').get(u202);
  check('issued_at recorded on new sessions', !!issuedRow.issued_at);

  let constraintThrew = false;
  try { auth.issueSessionToken(u101); } catch (error) { constraintThrew = String(error.message).includes('UNIQUE'); }
  check('DB enforces single live session per user', constraintThrowedCheck(constraintThrew));

  db.prepare("UPDATE sessions SET expires_at='2000-01-01T00:00:00.000Z'").run();
  auth.pruneExpiredSessions();
  check('expiry cleanup removes only expired sessions', db.prepare('SELECT COUNT(*) c FROM sessions').get().c === 0);

  // Rotation under cross-process concurrency still yields one live session.
  const rotationResults = await spawnConcurrently(6, () => `
    const auth = await import('${path.join(SCRATCH, 'src/lib/auth.mjs')}');
    auth.rotateAndIssueUserSession(${u202});
    console.log('rotated');
  `);
  check('concurrent rotators exit cleanly', rotationResults.every(r => r.code === 0));
  check('concurrent rotation converges to one live row',
    db.prepare('SELECT COUNT(*) c FROM sessions WHERE user_id=?').get(u202).c === 1);

  process.env.NODE_ENV = 'production';
  const prodPolicy = auth.sessionCookiePolicy();
  check('production cookie uses __Host- prefix', prodPolicy.name === '__Host-mh_session');
  check('production cookie Secure+HttpOnly+Lax+Path/', prodPolicy.options.secure === true && prodPolicy.options.httpOnly === true && prodPolicy.options.sameSite === 'lax' && prodPolicy.options.path === '/');
  process.env.NODE_ENV = 'development';
  const devPolicy = auth.sessionCookiePolicy();
  check('dev cookie stays usable over http', devPolicy.name === 'mh_session' && devPolicy.options.secure === false);
}
function constraintThrowedCheck(v) { return v; }
{
  process.env.NODE_ENV = 'production';
  const adminProd = adminAuth.adminCookiePolicy();
  check('admin production cookie __Host- + Strict + HttpOnly + Secure', adminProd.name === '__Host-mh_admin_session' && adminProd.options.sameSite === 'strict' && adminProd.options.httpOnly === true && adminProd.options.secure === true);
  process.env.NODE_ENV = 'development';

  const t1 = adminAuth.rotateAndIssueAdminSession().token;
  const t2 = adminAuth.rotateAndIssueAdminSession().token;
  const rows = db.prepare('SELECT token FROM admin_sessions').all();
  check('admin rotation leaves exactly one live session', rows.length === 1 && rows[0].token === t2 && t1 !== t2);
  let adminConstraintThrew = false;
  try { adminAuth.issueAdminSessionToken(); } catch (error) { adminConstraintThrew = String(error.message).includes('UNIQUE'); }
  check('DB enforces single admin session invariant', adminConstraintThrew);
  db.prepare("UPDATE admin_sessions SET expires_at='2000-01-01T00:00:00.000Z'").run();
  adminAuth.pruneExpiredAdminSessions();
  check('expired admin sessions pruned', db.prepare('SELECT COUNT(*) c FROM admin_sessions').get().c === 0);
}

console.log('\n[AC03] Admin credential comparison + audit events');
{
  process.env.ADMIN_PASSWORD = fixtureAdminPassword;
  check('correct password accepted', adminAuth.adminPasswordMatches(fixtureAdminPassword) === true);
  check('wrong password rejected', adminAuth.adminPasswordMatches(`wrong-${fixtureAdminPassword}`) === false);
  check('short input rejected without length oracle shortcut', adminAuth.adminPasswordMatches('x') === false);
  check('oversized input rejected', adminAuth.adminPasswordMatches('x'.repeat(500)) === false);
}
{
  // Constant-shape timing WITH the secret configured (the real request path):
  // identical work regardless of input length.
  const secret = process.env.ADMIN_PASSWORD;
  const samples = { short: [], exactLen: [], long: [] };
  for (let round = 0; round < 400; round++) {
    for (const [key, value] of [['short', 'abcde'], ['exactLen', 'z'.repeat(secret.length)], ['long', 'q'.repeat(300)]]) {
      const start = performance.now();
      adminAuth.adminPasswordMatches(value);
      samples[key].push(performance.now() - start);
    }
  }
  const median = (arr) => arr.sort((a, b) => a - b)[Math.floor(arr.length / 2)];
  const mShort = median(samples.short), mExact = median(samples.exactLen), mLong = median(samples.long);
  const ratio = Math.max(mShort, mExact, mLong) / Math.max(0.0001, Math.min(mShort, mExact, mLong));
  check('comparison time independent of input length (configured secret)', ratio < 3, `medians ${mShort.toFixed(4)}/${mExact.toFixed(4)}/${mLong.toFixed(4)}ms ratio=${ratio.toFixed(2)}`);
  delete process.env.ADMIN_PASSWORD;
  check('unset ADMIN_PASSWORD denies everything', adminAuth.adminPasswordMatches(secret) === false);
  process.env.ADMIN_PASSWORD = 'too-short';
  check('weak (<12) configured password denied', adminAuth.adminPasswordMatches('too-short') === false);
  delete process.env.ADMIN_PASSWORD;
}
{
  logAdminAudit('admin-login', 'login_fail', 'ip:203.0.113.9');
  logAdminAudit('admin', 'verification_review', 'provider:7', 'request=3;decision=approved');
  const rows = db.prepare("SELECT actor,action,target,detail FROM admin_audit_log ORDER BY id DESC LIMIT 2").all();
  check('authority events audited', rows.length === 2 && rows[1].action === 'login_fail' && rows[0].action === 'verification_review');
  const blob = JSON.stringify(rows);
  check('audit stores no password/token material', !blob.includes(fixtureAdminPassword) && !blob.includes('password'));
  logSecurityEvent('security_validation_reject', 'register', 'x'.repeat(2000));
  const ev = db.prepare("SELECT detail FROM security_events WHERE kind='security_validation_reject' ORDER BY id DESC LIMIT 1").get();
  check('security event details bounded', ev.detail.length <= 500);
}
{
  // Redaction happens inside clean(): credential-shaped pairs never persist.
  logSecurityEvent('security_validation_reject', 'redact-test', 'password=hunter2 and token=abc123 fine');
  const row = db.prepare("SELECT detail FROM security_events WHERE identifier='redact-test'").get();
  check('credential values redacted before storage', !row.detail.includes('hunter2') && !row.detail.includes('abc123'), row.detail);
  check('redaction marker present', row.detail.includes('[redacted]'));
  logAdminAudit('admin-login', 'probe', '', 'api_key=sk-super-secret-123 rest');
  const aud = db.prepare("SELECT detail FROM admin_audit_log WHERE action='probe'").get();
  check('admin audit redacts api keys', !aud.detail.includes('sk-super-secret-123'), aud.detail);
}

console.log('\n[AC04] Zod validation bounds on critical Server Actions');
{
  const badEmail = schemas.registerSchema.safeParse({ role: 'homeowner', email: 'not-an-email', password: 'longenough1', firstName: 'A', lastName: 'B' });
  check('invalid email rejected', badEmail.success === false);
  const shortPw = schemas.registerSchema.safeParse({ role: 'homeowner', email: 'a@b.de', password: 'short', firstName: 'A', lastName: 'B' });
  check('short password rejected', shortPw.success === false);
  const hugeField = schemas.registerSchema.safeParse({ role: 'homeowner', email: 'a@b.de', password: 'longenough1', firstName: 'A'.repeat(200), lastName: 'B' });
  check('oversized name rejected', hugeField.success === false);
  const validMinimal = schemas.registerSchema.safeParse({ role: 'homeowner', email: 'Owner@Example.DE ', password: ' longenough1 ', firstName: ' Ana ', lastName: ' Weber ' });
  check('valid registration parses with normalization', validMinimal.success === true && validMinimal.data.email === 'owner@example.de' && validMinimal.data.firstName === 'Ana' && validMinimal.data.radius === 25);
  const junkRadius = schemas.registerSchema.safeParse({ role: 'provider', email: 'p@b.de', password: 'longenough1', firstName: 'A', lastName: 'B', radius: 'not-a-number' });
  check('junk radius falls back safely', junkRadius.success === true && junkRadius.data.radius === 25);
  check('login schema rejects malformed email', schemas.loginSchema.safeParse({ email: 'nope', password: 'x' }).success === false);
  check('login schema rejects oversized password', schemas.loginSchema.safeParse({ email: 'a@b.de', password: 'y'.repeat(129) }).success === false);
  check('admin login requires non-empty bounded password', schemas.adminLoginSchema.safeParse({ password: '' }).success === false);
  check('verification decision enum enforced', schemas.verificationDecisionSchema.safeParse({ decision: 'maybe' }).success === false);
  check('claim status enum enforced', schemas.claimStatusSchema.safeParse({ status: 'exploded' }).success === false);
  check('partner contract bounds enforced', schemas.partnerContractSchema.safeParse({ status: 'active', discountBps: 99999 }).success === false);
  check('intake description capped', schemas.intakeDescriptionSchema.safeParse({ description: 'x'.repeat(9000) }).success === false);
  check('quote amount upper bound enforced', schemas.quoteSchema.safeParse({ amount: 100001 }).success === false);
  check('quote amount lower bound enforced', schemas.quoteSchema.safeParse({ amount: 0 }).success === false);
  check('quote message bounded', schemas.quoteSchema.safeParse({ amount: 500, message: 'x'.repeat(2001) }).success === false);
  check('quote valid euro amount parses', schemas.quoteSchema.safeParse({ amount: '1500' }).success === true);
  check('invoice item tax >100 rejected not clamped', schemas.invoiceItemSchema.safeParse({ description: 'a', quantity: '1', unit: 'Stk.', unitPriceEur: '10', taxRatePercent: '150' }).success === false);
  check('invoice item negative price rejected', schemas.invoiceItemSchema.safeParse({ description: 'a', quantity: '1', unitPriceEur: '-5', taxRatePercent: '19' }).success === false);
  check('invoice item oversized quantity rejected', schemas.invoiceItemSchema.safeParse({ description: 'a', quantity: '999999', unitPriceEur: '5', taxRatePercent: '19' }).success === false);
  check('empty invoice rejected', schemas.invoiceSchema.safeParse({ items: [] }).success === false);
  check('>50 invoice items rejected', schemas.invoiceSchema.safeParse({ items: Array.from({ length: 51 }, () => ({ description: 'x', quantity: '1', unit: 'Stk.', unitPriceEur: '1', taxRatePercent: '19' })) }).success === false);
  check('valid invoice with comma decimals parses', schemas.invoiceSchema.safeParse({ items: [{ description: 'Arbeit', quantity: '1,5', unit: 'Std.', unitPriceEur: '50,00', taxRatePercent: '19' }] }).success === true);
  check('blank optional invoice dates use server defaults', schemas.invoiceSchema.safeParse({ items: [{ description: 'Arbeit', quantity: '1', unit: 'Std.', unitPriceEur: '50', taxRatePercent: '19' }], issueDate: '', serviceDate: '', dueDate: '' }).success === true);
  check('malformed invoice date rejected', schemas.invoiceSchema.safeParse({ items: [{ description: 'Arbeit', quantity: '1', unit: 'Std.', unitPriceEur: '50', taxRatePercent: '19' }], issueDate: '22.08.2026' }).success === false);
  check('emergency type enum enforced with safe fallback', schemas.emergencyTypeSchema.parse('water') === 'water' && schemas.emergencyTypeSchema.parse('<script>') === 'other');

  // Structural ordering proof: validation runs before any business mutation
  // (INSERT/UPDATE/DELETE/transaction) inside each covered action, so malformed
  // input can never reach a DB statement.
  const mutationNeedles = ['INSERT INTO', 'UPDATE ', 'DELETE FROM', 'db.transaction'];
  function assertOrdering(sourceFile, actionNames) {
    const source = fs.readFileSync(path.join(root, sourceFile), 'utf8');
    for (const name of actionNames) {
      const startIdx = source.indexOf(`export async function ${name}`);
      if (startIdx === -1) { check(`action present: ${name}`, false); continue; }
      const nextIdx = source.indexOf('\nexport async function', startIdx + 1);
      const body = source.slice(startIdx, nextIdx === -1 ? undefined : nextIdx);
      const guardIdx = Math.min(...['safeParse(', 'checkRateLimit(', '.length<'].map((needle) => {
        const idx = body.indexOf(needle);
        return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
      }));
      const firstMutationIdx = Math.min(...mutationNeedles.map((needle) => {
        const idx = body.indexOf(needle);
        return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
      }));
      check(`validation precedes mutation in ${name}`, guardIdx < firstMutationIdx);
    }
  }
  assertOrdering('src/app/actions.ts', [
    'registerAction', 'loginAction', 'adminLoginAction', 'addProviderMemberAction',
    'sendHausmeisterAction', 'createConsultationAction', 'createEmergencyAction',
    'submitQuoteAction', 'createInvoiceAction',
    'adminReviewVerificationAction', 'adminUpdateClaimAction', 'adminUpdatePartnerContractAction',
  ]);
  assertOrdering('src/app/admin/crm/actions.ts', ['addCrmLeadAction', 'updateCrmLeadAction']);

  // The register action must actually consume the register bucket (record
  // failures), and login must consume BOTH account and IP buckets pre-bcrypt.
  const actionsSource = fs.readFileSync(path.join(root, 'src/app/actions.ts'), 'utf8');
  function actionBody(name) {
    const startIdx = actionsSource.indexOf(`export async function ${name}`);
    const nextIdx = actionsSource.indexOf('\nexport async function', startIdx + 1);
    return actionsSource.slice(startIdx, nextIdx === -1 ? undefined : nextIdx);
  }
  const registerBody = actionBody('registerAction');
  check('register records failures on invalid input', registerBody.includes('recordRateLimitFailure'));
  check('register stores parsed address, not raw form value', registerBody.includes('createPropertyForOwner(id,{address:d.address') && !registerBody.includes("createPropertyForOwner(id,{address:text(fd,'address')"));
  const loginBody = actionBody('loginAction');
  check('login consumes account bucket before bcrypt', loginBody.indexOf('consumeRateLimitAttempt') < loginBody.indexOf('bcrypt.compare'));
  check('login consumes IP bucket dimension', loginBody.includes("consumeRateLimitAttempt('login', `ip:${ip}`)"));
  check('login compares unknown accounts against dummy digest', loginBody.includes('DUMMY_PASSWORD_HASH'));
  check('login re-locks failed attempts', loginBody.includes('applyRateLimitLockout'));
  check('clientIp uses last trusted XFF hop', /forwarded\[forwarded\.length - 1\]/.test(actionsSource.split('async function clientIp')[1].split('}')[0]));
  const crmSource = fs.readFileSync(path.join(root, 'src/app/admin/crm/actions.ts'), 'utf8');
  check('CRM mutations consume the admin_mutation bucket', crmSource.includes("consumeRateLimitAttempt('admin_mutation'"));
  check('CRM mutation and audit commit atomically', crmSource.includes("db.transaction(()=>{ addCrmLead") || crmSource.includes('db.transaction(()=>{ updateCrmLead'));
  const auditSource = fs.readFileSync(path.join(root, 'src/lib/security/audit.ts'), 'utf8');
  check('audit redacts before truncation', auditSource.indexOf('replace(SECRET_PAIR') < auditSource.indexOf('.slice(0, MAX_DETAIL)'));
}

console.log('\n[AC05] Global security headers + preserved cache rules');
{
  process.env.NODE_ENV = 'production';
  const configModule = await import(pathToFileURL(path.join(SCRATCH, 'next.config.mjs')).href);
  const config = configModule.default;
  const headersList = await config.headers();
  const globalEntry = headersList.find((entry) => entry.source === '/(.*)');
  check('global header rule present', !!globalEntry);
  const getHeader = (key) => globalEntry?.headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value ?? '';
  const csp = getHeader('Content-Security-Policy');
  check('CSP default-src self', csp.includes("default-src 'self'"));
  check('CSP frame-ancestors none', csp.includes("frame-ancestors 'none'"));
  check('CSP object-src none', csp.includes("object-src 'none'"));
  check('CSP form-action self', csp.includes("form-action 'self'"));
  check('CSP allows same-origin assets only for scripts', csp.includes("script-src 'self'"));
  check('CSP media-src allows blob playback for voice intake', csp.includes("media-src 'self' blob:"));
  check('HSTS in production', /^max-age=\d+/.test(getHeader('Strict-Transport-Security')));
  check('nosniff', getHeader('X-Content-Type-Options') === 'nosniff');
  check('frame protection DENY', getHeader('X-Frame-Options') === 'DENY');
  check('referrer policy', getHeader('Referrer-Policy') === 'strict-origin-when-cross-origin');
  const permissions = getHeader('Permissions-Policy');
  check('permissions policy keeps microphone self-scoped for voice intake', permissions.includes('microphone=(self)'));
  check('permissions policy locks geolocation', permissions.includes('geolocation=()'));
  const swEntry = headersList.find((entry) => entry.source === '/sw.js');
  const manifestEntry = headersList.find((entry) => entry.source === '/manifest.webmanifest');
  check('sw.js cache rule preserved verbatim', swEntry?.headers?.[0]?.value === 'no-cache, no-store, must-revalidate');
  check('manifest cache rule preserved verbatim', manifestEntry?.headers?.[0]?.value === 'no-cache, max-age=0, must-revalidate');

  // Dev mode must not emit HSTS (http compatibility).
  const devProbe = execFileSync(process.execPath, [
    '--input-type=module',
    '-e',
    `process.env.NODE_ENV='development';
     const cfg=(await import(${JSON.stringify(path.join(SCRATCH, 'next.config.mjs'))})).default;
     const list=await cfg.headers();
     const g=list.find(e=>e.source==='/(.*)');
     const hsts=g.headers.find(h=>h.key==='Strict-Transport-Security');
     const pp=g.headers.find(h=>h.key==='Permissions-Policy').value;
     console.log(JSON.stringify({hasHsts:!!hsts,csp:g.headers.some(h=>h.key==='Content-Security-Policy'),pp}));`,
  ], { cwd: SCRATCH, encoding: 'utf8' });
  const devResult = JSON.parse(devProbe.trim().split('\n').pop());
  check('HSTS omitted in development', devResult.hasHsts === false && devResult.csp === true);
  check('microphone self-scoped also in development', devResult.pp.includes('microphone=(self)'));
}

console.log('\n[Migration] Populated legacy DB: invalidation, dedup, indexes, data preservation');
{
  const legacyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-legacy-db-'));
  const legacyDbPath = path.join(legacyDir, 'legacy.db');
  // Build a realistic PRE-T-0002 database: no issued_at columns, duplicate
  // live sessions per user, multiple admin sessions, sentinel user row.
  runNode(`
    const Database = (await import('better-sqlite3')).default;
    const legacy = new Database(${JSON.stringify(legacyDbPath)});
    legacy.pragma('journal_mode = WAL'); legacy.pragma('foreign_keys = ON');
    legacy.exec(\`
      CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT NOT NULL UNIQUE COLLATE NOCASE,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('homeowner','provider')),first_name TEXT NOT NULL,last_name TEXT NOT NULL,phone TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE homeowner_profiles (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,postcode TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '');
      CREATE TABLE provider_profiles (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,business_name TEXT NOT NULL,trades TEXT NOT NULL DEFAULT '',postcode TEXT NOT NULL DEFAULT '',radius_km INTEGER NOT NULL DEFAULT 25,verified INTEGER NOT NULL DEFAULT 0,rating REAL NOT NULL DEFAULT 0,rating_count INTEGER NOT NULL DEFAULT 0,description TEXT NOT NULL DEFAULT '');
      CREATE TABLE sessions (token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at TEXT NOT NULL);
      CREATE TABLE admin_sessions (token TEXT PRIMARY KEY,expires_at TEXT NOT NULL);
    \`);
    legacy.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES('sentinel@test.dev','legacy-hash','homeowner','Sentinel','User')").run();
    const uid = legacy.prepare("SELECT id FROM users WHERE email='sentinel@test.dev'").get().id;
    const insS = legacy.prepare("INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,datetime('now','+30 days'))");
    insS.run('legacy-token-a1', uid); insS.run('legacy-token-a2', uid);
    const other = legacy.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name) VALUES('other@test.dev','legacy-hash','homeowner','Other','User')").run();
    insS.run('legacy-token-b1', Number(other.lastInsertRowid));
    const insA = legacy.prepare("INSERT INTO admin_sessions(token,expires_at) VALUES(?,datetime('now','+12 hours'))");
    insA.run('legacy-admin-1'); insA.run('legacy-admin-2');
    legacy.close();
    console.log('fixture-ready');
  `, { DATABASE_PATH: legacyDbPath });

  const migrationReport = runNode(`
    // Importing the app's db module runs schema DDL + security migration on the fixture.
    const { db } = await import('${path.join(SCRATCH, 'src/lib/db.mjs')}');
    const report = {
      sentinelPreserved: db.prepare("SELECT COUNT(*) c FROM users WHERE email='sentinel@test.dev' AND password_hash='legacy-hash'").get().c === 1,
      otherUserPreserved: db.prepare("SELECT COUNT(*) c FROM users WHERE email='other@test.dev'").get().c === 1,
      legacySessionsInvalidated: db.prepare("SELECT COUNT(*) c FROM sessions WHERE issued_at IS NULL").get().c === 0,
      singleSessionPerUser: (() => {
        const counts = db.prepare('SELECT user_id, COUNT(*) c FROM sessions GROUP BY user_id').all();
        return counts.every(r => r.c <= 1);
      })(),
      singleAdminSession: db.prepare('SELECT COUNT(*) c FROM admin_sessions').get().c <= 1,
      uniqueUserIndex: !!db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_sessions_user_live'").get(),
      uniqueAdminIndex: !!db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_admin_sessions_single'").get(),
      enforcementWorks: (() => {
        const uid = db.prepare("SELECT id FROM users WHERE email='sentinel@test.dev'").get().id;
        db.prepare("INSERT INTO sessions(token,user_id,expires_at,issued_at) VALUES('new-live-1',?,datetime('now','+30 days'),datetime('now'))").run(uid);
        try {
          db.prepare("INSERT INTO sessions(token,user_id,expires_at,issued_at) VALUES('new-live-2',?,datetime('now','+30 days'),datetime('now'))").run(uid);
          return false;
        } catch (e) { return String(e.message).includes('UNIQUE'); }
        finally { db.prepare("DELETE FROM sessions WHERE token='new-live-1'").run(); }
      })(),
      rateTablesPresent: ['auth_rate_limits','admin_audit_log','security_events'].every(t =>
        !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(t)),
    };
    console.log(JSON.stringify(report));
  `, { DATABASE_PATH: legacyDbPath });
  const migration = JSON.parse(migrationReport.trim().split('\n').pop());
  check('migration: sentinel user row fully preserved', migration.sentinelPreserved);
  check('migration: other users preserved', migration.otherUserPreserved);
  check('migration: legacy NULL-issued_at sessions invalidated once', migration.legacySessionsInvalidated);
  check('migration: at most one live session per user', migration.singleSessionPerUser);
  check('migration: single admin session invariant restored', migration.singleAdminSession);
  check('migration: UNIQUE(user_id) index created', migration.uniqueUserIndex);
  check('migration: single-row admin index created', migration.uniqueAdminIndex);
  check('migration: unique index actively blocks second session', migration.enforcementWorks);
  check('migration: new security tables coexist', migration.rateTablesPresent);
}

console.log('\n[Migration] Fresh-start reliability under parallel module evaluation');
{
  const freshDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-fresh-db-'));
  const freshDbPath = path.join(freshDir, 'fresh.db');
  const results = await spawnConcurrently(6, () => `
    const { db } = await import('${path.join(SCRATCH, 'src/lib/db.mjs')}');
    if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='auth_rate_limits'").get()) throw new Error('schema missing');
    console.log('boot-ok');
  `, { DATABASE_PATH: freshDbPath });
  const okBootstraps = results.filter(r => r.code === 0).length;
  check('parallel first-boot workers all succeed (no fatal SQLITE_BUSY)', okBootstraps === 6,
    results.map(r => r.code !== 0 ? `code=${r.code} out=[${r.stdout.split('\n').slice(-3).join('; ')}] err=[${r.stderr.split('\n').slice(-3).join('; ')}]` : '').filter(Boolean).join(' | '));
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.error(failures.map((f) => ` - ${f}`).join('\n'));
  process.exitCode = 1;
} else {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
