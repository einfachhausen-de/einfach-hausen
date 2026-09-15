import { execFileSync, spawn } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { tsClosure } from './lib/ts-scratch.mjs';
import Database from 'better-sqlite3';

// T-0203: GDPR account deletion + export. Phase A proves the deletion core
// (anonymization, retention rows, file unlinking) on a scratch app dir; Phase B
// proves the routes against a real server instance with an ephemeral Supabase
// identity. No production mutations.

const root = process.cwd();
// Health storage check requires the uploads dir; production bootstraps it via deploy/update-on-oci.sh.
fs.mkdirSync(path.join(root, 'public', 'uploads'), { recursive: true });
const results = [];
let server;

function check(name, condition, detail = '') {
  const ok = Boolean(condition);
  results.push({ name, ok });
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${name}${detail ? ` :: ${detail}` : ''}`);
  if (!ok) throw new Error(`${name}${detail ? ` :: ${detail}` : ''}`);
}

function dockerEnv(name) {
  const raw = execFileSync('docker', ['inspect', '-f', '{{range .Config.Env}}{{println .}}{{end}}', name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return Object.fromEntries(raw.trim().split('\n').filter(Boolean).map((line) => { const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]; }));
}
const kongEnv = dockerEnv('supabase-kong');
const supabaseUrl = 'https://supabase.delqhi.com';
const anonKey = kongEnv.SUPABASE_ANON_KEY;
const serviceKey = kongEnv.SUPABASE_SERVICE_KEY;

async function adminRequest(pathname, init = {}) {
  return await fetch(`${supabaseUrl}${pathname}`, { ...init, headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });
}

async function freePort() {
  return await new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => { const a = s.address(); s.close(() => resolve(a.port)); });
    s.on('error', reject);
  });
}

async function ssrCookies(email, password) {
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signed = await client.auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.session) throw new Error('supabase sign-in failed');
  const items = [];
  const { createServerClient } = await import('@supabase/ssr');
  const sc = createServerClient(supabaseUrl, anonKey, { cookies: { getAll: () => [], setAll: (i) => { items.push(...i.map((x) => ({ name: x.name, value: x.value }))); } } });
  await sc.auth.setSession({ access_token: signed.data.session.access_token, refresh_token: signed.data.session.refresh_token });
  return items.map(({ name, value }) => `${name}=${value}`).join('; ');
}

async function startNext(env) {
  const port = await freePort();
  let logs = '';
  const child = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', String(port)], { cwd: root, env: { ...env, NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${port}` }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', (d) => { logs = (logs + d).slice(-8000); });
  child.stderr.on('data', (d) => { logs = (logs + d).slice(-8000); });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 160; i++) {
    if (child.exitCode !== null) throw new Error('next exited before readiness');
    try { const r = await fetch(`${base}/api/health`, { redirect: 'manual' }); if (r.status < 500) return { child, base, logs: () => logs }; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  child.kill('SIGTERM');
  throw new Error('next readiness timeout');
}

async function phaseA() {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-t0203-app-'));
  const dbPath = path.join(scratch, 'app.db');
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(scratch, 'node_modules'), 'dir');
  const mediaDir = path.join(scratch, 'data', 'private', 'job-media');
  fs.mkdirSync(mediaDir, { recursive: true });
  fs.writeFileSync(path.join(mediaDir, 'proof.txt'), 'x');
  fs.writeFileSync(path.join(scratch, 'data', 'private', 'verify.txt'), 'x');
  // Private roots resolve against process.cwd() -> run the lib from the scratch dir.
  const files = tsClosure(root, ['src/lib/db.ts', 'src/lib/mailer.ts', 'src/lib/notifications.ts', 'src/lib/security/audit.ts', 'src/lib/security/rate-limit.ts', 'src/lib/security/private-files.ts', 'src/lib/auth.ts', 'src/lib/account-deletion.ts']);
  for (const rel of files) {
    const src = fs.readFileSync(path.join(root, rel), 'utf8');
    const stripped = stripTypeScriptTypes(src).replace(/(from\s*['"])(\.\.?\/[^'"]+)(['"])/g, (_m, a, s, b) => `${a}${s}.mjs${b}`);
    const dest = path.join(scratch, rel.replace(/\.ts$/, '.mjs'));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, stripped);
  }
  const prevCwd = process.cwd();
  process.chdir(scratch);
  try {
    const { db } = await import('file://' + path.join(scratch, 'src/lib/db.mjs'));
    const { deleteAccountData } = await import('file://' + path.join(scratch, 'src/lib/account-deletion.mjs'));
    db.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name,phone,auth_subject) VALUES('gdpr@example.test','hash','homeowner','Max','Muster','+49123','subject-to-delete')").run();
    const uid = Number(db.prepare("SELECT id FROM users WHERE email='gdpr@example.test'").get().id);
    db.prepare("INSERT INTO homeowner_profiles(user_id,postcode,address) VALUES(?,'10115','Weg 1')").run(uid);
    db.prepare("INSERT INTO sessions(token,user_id,expires_at,issued_at) VALUES('tok',?,datetime('now','+1 day'),datetime('now'))").run(uid);
    db.prepare("INSERT INTO notifications(user_id,kind,title,body,href) VALUES(?,'info','t','b','/app')").run(uid);
    db.prepare("INSERT INTO house_assets(homeowner_id,kind,name) VALUES(?,'heizung','Altanlage')").run(uid);
    db.prepare("INSERT INTO jobs(homeowner_id,title,description,category,postcode) VALUES(?,'T','D','handwerk','10115')").run(uid);
    const jid = Number(db.prepare("SELECT id FROM jobs WHERE homeowner_id=?").get(uid).id);
    db.prepare("INSERT INTO job_photos(job_id,path) VALUES(?,?)").run(jid, 'job-media/proof.txt');
    db.prepare("INSERT INTO messages(job_id,sender_id,recipient_id,body) VALUES(?,?,?,'hi')").run(jid, uid, uid);
    // Retention job with invoice stays.
    db.prepare("INSERT INTO jobs(homeowner_id,title,description,category,postcode) VALUES(?,'Rechnung','D','handwerk','10115')").run(uid);
    const jid2 = Number(db.prepare("SELECT id FROM jobs WHERE title='Rechnung'").get().id);
    db.prepare("INSERT INTO invoices(job_id,provider_id,homeowner_id,invoice_number,issue_date,service_date,due_date,seller_name,buyer_name,created_by_user_id) VALUES(?, ?, ?, 'R-1', '2026-01-01', '2026-01-01', '2026-02-01', 'Firma', 'Kunde', ?)").run(jid2, uid, uid, uid);

    const result = await deleteAccountData(uid);
    const u = db.prepare('SELECT * FROM users WHERE id=?').get(uid);
    check('user row anonymized', String(u.email).startsWith('geloescht-') && u.auth_subject === null && u.password_hash === '' && u.first_name === 'Gelöscht', JSON.stringify({ email: u.email, subject: u.auth_subject }));
    check('sessions deleted', db.prepare('SELECT COUNT(*) c FROM sessions WHERE user_id=?').get(uid).c === 0);
    check('notifications deleted', db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id=?').get(uid).c === 0);
    check('house assets deleted', db.prepare('SELECT COUNT(*) c FROM house_assets WHERE homeowner_id=?').get(uid).c === 0);
    check('personal job deleted with photo+message', db.prepare('SELECT COUNT(*) c FROM jobs WHERE id=?').get(jid).c === 0 && db.prepare('SELECT COUNT(*) c FROM job_photos WHERE job_id=?').get(jid).c === 0 && db.prepare('SELECT COUNT(*) c FROM messages WHERE job_id=?').get(jid).c === 0);
    check('retention job+invoice kept', db.prepare('SELECT COUNT(*) c FROM jobs WHERE id=?').get(jid2).c === 1 && db.prepare('SELECT COUNT(*) c FROM invoices WHERE invoice_number=?').get('R-1').c === 1);
    check('private file unlinked', !fs.existsSync(path.join(mediaDir, 'proof.txt')));
    check('deletion counted files', result.files >= 1, String(result.files));
    check('security event written', db.prepare("SELECT COUNT(*) c FROM security_events WHERE kind='account_delete'").get().c === 1);
    db.close();
  } finally {
    process.chdir(prevCwd);
    try { fs.rmSync(scratch, { recursive: true, force: true }); } catch {}
  }
}

async function phaseB() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eh-t0203-server-'));
  const dbPath = path.join(tmpDir, 'app.db');
  const email = `t0203-${randomUUID()}@e2e.einfachhausen.de`;
  const password = `T0203!${randomBytes(18).toString('base64url')}`;
  const created = await adminRequest('/auth/v1/admin/users', { method: 'POST', body: JSON.stringify({ email, password, email_confirm: true }) });
  if (!created.ok) throw new Error(`identity creation failed: HTTP ${created.status}`);
  const identity = await created.json();
  server = await startNext({
    ...process.env,
    DATABASE_PATH: dbPath,
    AUTH_MODE: 'supabase',
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: anonKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    SESSION_COOKIE_NAME: 'mh_session_e2e',
    E2E_INSECURE_COOKIES: '1',
  });
  let db;
  let uid;
  try {
    db = new Database(dbPath);
    db.prepare("INSERT INTO users(email,password_hash,role,first_name,last_name,auth_subject) VALUES(?,?,?,?,?,?)").run(email, 'hash', 'homeowner', 'T0203', 'Owner', identity.id);
    uid = Number(db.prepare('SELECT id FROM users WHERE email=?').get(email).id);
    const anon = await fetch(`${server.base}/api/account/export`);
    check('export unauthenticated -> 401', anon.status === 401, String(anon.status));
    const cookie = await ssrCookies(email, password);
    const exp = await fetch(`${server.base}/api/account/export`, { headers: { Cookie: cookie } });
    const expText = await exp.text();
    let body = {};
    try { body = JSON.parse(expText); } catch {}
    check('export authenticated -> 200 with account payload', exp.status === 200 && body.account?.email === email, `status=${exp.status} body=${expText.slice(0, 160)} logs=${server.logs().slice(-600)}`);
    const del = await fetch(`${server.base}/api/konto-loeschen`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({ userId: 'someone-else' }) });
    check('deletion authenticated -> 200 ok', del.status === 200, `status=${del.status} body=${(await del.text()).slice(0, 80)}`);
    const u = db.prepare('SELECT email,auth_subject FROM users WHERE id=?').get(uid);
    check('route deletion anonymized the user', String(u.email).startsWith('geloescht-') && u.auth_subject === null, JSON.stringify(u));
    const identityCheck = await adminRequest(`/auth/v1/admin/users/${encodeURIComponent(identity.id)}`);
    check('supabase identity deleted server-side', identityCheck.status === 404, String(identityCheck.status));
  } finally {
    db.close();
    if (server?.child && server.child.exitCode === null) server.child.kill('SIGKILL');
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

let exitCode = 0;
try { await phaseA(); } catch (e) { console.error('phaseA failed:', e && e.message || e); exitCode = 1; }
try { await phaseB(); } catch (e) { console.error('phaseB failed:', e && e.message || e); exitCode = 1; }
const failed = results.filter((r) => !r.ok);
console.log(`[T-0203] ${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : exitCode);
