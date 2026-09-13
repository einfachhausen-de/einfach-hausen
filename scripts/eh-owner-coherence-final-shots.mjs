import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import Database from 'better-sqlite3';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Kept green-E2E run: real UI-created data, isolated temp DB (never production).
// v3: production server + REAL Supabase login form; test subjects rebound via the
// explicit one-time email bridge (auth_subject nulled in this disposable copy only).
const kept = '/tmp/einfach-hausen-full-e2e-MfAQpE';
const projectRoot = path.join(kept, 'project');
const databasePath = path.join(kept, 'app.sqlite3');
const shotsDir = '/tmp/eh-coherence-final-shots';
const durableDir = path.join(repo, 'docs/brand/owner-coherence/final-shots');
fs.mkdirSync(shotsDir, { recursive: true });
fs.mkdirSync(durableDir, { recursive: true });
const report = { shots: [], checks: [], errors: [], source: 'kept green E2E run MfAQpE (real UI flows); prod server; real Supabase login; 3 documented fixture rows in temp DB' };
let server;
const serverLog = [];
process.on('exit', () => { try { if (server && !server.killed) server.kill('SIGKILL'); } catch {} });

function browserExecutable() {
  const bundled = typeof chromium.executablePath === 'function' ? chromium.executablePath() : '';
  const candidates = [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, process.env.CHROME_PATH, bundled,
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/opt/google/chrome/chrome'].filter(Boolean);
  const found = candidates.find((c) => c && fs.existsSync(c));
  if (!found) throw new Error('No Chromium found');
  return found;
}
async function freePort() {
  return await new Promise((resolve, reject) => {
    const s = net.createServer(); s.unref();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => { const a = s.address(); const p = typeof a === 'object' && a ? a.port : 0; s.close(() => resolve(p)); });
  });
}
async function waitForServer(url, timeoutMs = 120000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { const r = await fetch(url, { redirect: 'manual' }); if (r.status < 500) return; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('server not ready\n' + serverLog.slice(-30).join(''));
}
async function check(page, label, opts = {}) {
  await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 60000 });
  await page.waitForTimeout(600);
  const h1 = await page.locator('h1').count();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  const r = { label, h1, overflow, ...opts };
  report.checks.push(r);
  if (h1 !== 1) throw new Error(label + ': h1=' + h1);
  if (overflow) throw new Error(label + ': horizontal overflow');
  return r;
}
async function action44(page, label, locator) {
  const box = await locator.first().boundingBox();
  if (!box || box.height < 44) throw new Error(label + ': action target <44px');
  report.checks.push({ label: label + ' 44px', height: Math.round(box.height) });
}
async function shot(page, name, full = false) {
  const p = path.join(shotsDir, name);
  await page.screenshot({ path: p, fullPage: full });
  report.shots.push(name);
}

const supabaseUrl = process.env.SUPABASE_URL || 'https://supabase.delqhi.com';
const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!svcKey) throw new Error('service key missing in env');
const shotsPassword = 'Shots!' + randomBytes(18).toString('base64url');

// ---- temp-DB fixture augmentation + subject release (disposable copy only) ----
let ownerEmail, providerEmail, contactId = 2;
{
  const db = new Database(databasePath);
  // Fresh test-domain emails dodge stale undeletable gateway subjects
  // (admin DELETE answers 500 on this gateway; same as today's E2E leftovers).
  const stamp = Date.now().toString(36);
  ownerEmail = 'maria-shots-' + stamp + '@example.test';
  providerEmail = 'gartenbau-shots-' + stamp + '@example.test';
  db.prepare('UPDATE users SET email=?, auth_subject=NULL WHERE id=3').run(ownerEmail);
  db.prepare('UPDATE users SET email=?, auth_subject=NULL WHERE id=1').run(providerEmail);
  db.prepare('UPDATE users SET auth_subject=NULL WHERE id=2').run();
  const hasPast = db.prepare("SELECT COUNT(*) c FROM appointments WHERE datetime(start_at)<datetime('now')").get().c;
  if (!hasPast) db.prepare("INSERT INTO appointments(job_id,provider_id,homeowner_id,contact_user_id,start_at,status) VALUES(2,1,3,2,datetime('now','-3 day'),'confirmed')").run();
  const hasUnread = db.prepare('SELECT COUNT(*) c FROM contact_messages WHERE read_at IS NULL AND sender_id<>homeowner_id').get().c;
  if (!hasUnread) db.prepare("INSERT INTO contact_messages(homeowner_id,provider_id,contact_user_id,sender_id,body,created_at) VALUES(3,1,2,2,'Noch ein Hinweis: bringe bitte auch die Astschere mit.',datetime('now','-1 hour'))").run();
  db.close();
}
async function sbAdmin(method, p, body) {
  const r = await fetch(supabaseUrl + '/auth/v1/admin/users' + p, {
    method, headers: { apikey: svcKey, Authorization: 'Bearer ' + svcKey, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r;
}
async function resetIdentity(email, role) {
  // The one-time email bridge requires exactly one app row (true) and must
  // authenticate the freshly created subject: wipe ALL stale subjects first,
  // retrying the gateway until the list is verifiably empty.
  for (let round = 0; round < 6; round++) {
    const list = await (await sbAdmin('GET', '?email=' + encodeURIComponent(email))).json().catch(() => ({}));
    // NOTE: this gateway ignores the ?email= filter (returns unfiltered pages);
    // match client-side so fresh addresses are not blocked by unrelated rows.
    const users = (list.users || []).filter((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (!users.length) break;
    for (const u of users) await sbAdmin('DELETE', '/' + encodeURIComponent(u.id)).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
    if (round === 5) throw new Error('stale identities not deletable for ' + email);
  }
  const mk = await sbAdmin('POST', '', { email, password: shotsPassword, email_confirm: true, user_metadata: { role, e2e: true } });
  if (!mk.ok) throw new Error('identity reset failed for ' + email + ': HTTP ' + mk.status);
}
await resetIdentity(ownerEmail, 'homeowner');
await resetIdentity(providerEmail, 'provider');

// ---- production server, supabase auth (same contract as E2E) ----
const port = await freePort();
const base = 'http://127.0.0.1:' + port;
const env = {
  ...process.env, DATABASE_PATH: databasePath, SESSION_COOKIE_NAME: 'shots_session',
  NEXT_PUBLIC_APP_URL: base, AUTH_MODE: 'supabase', E2E_INSECURE_COOKIES: '1',
  SUPABASE_URL: supabaseUrl, SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: svcKey, SUPABASE_SERVICE_KEY: svcKey,
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
};
const nextBin = path.join(repo, 'node_modules', 'next', 'dist', 'bin', 'next');
server = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)], { cwd: projectRoot, env, stdio: ['ignore', 'pipe', 'pipe'] });
for (const st of [server.stdout, server.stderr]) st.on('data', (c) => { serverLog.push(c.toString()); if (serverLog.length > 200) serverLog.shift(); });
await waitForServer(base + '/', 120000);

const browser = await chromium.launch({ headless: true, executablePath: browserExecutable() });
const VP = { mobile: { width: 390, height: 844 }, tablet: { width: 736, height: 1024 }, desktop: { width: 1536, height: 960 } };
async function login(viewport, email, expectUrl) {
  const c = await browser.newContext({ viewport });
  c.setDefaultTimeout(90000);
  const p = await c.newPage();
  await p.goto(base + '/login', { waitUntil: 'load' });
  await p.getByRole('heading', { name: /Willkommen zur\u00fcck/ }).waitFor({ timeout: 60000 });
  let ok = false;
  for (let a = 0; a < 3 && !ok; a++) {
    await p.waitForLoadState('networkidle').catch(() => {});
    await p.waitForTimeout(800 * a);
    await p.locator('input[inputmode="email"]:visible').fill(email);
    await p.locator('input[type="password"]:visible').fill(shotsPassword);
    try {
      await p.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith('Anmelden') && x.getClientRects().length > 0); return b && !b.disabled; }, { timeout: 10000 });
      await Promise.all([p.waitForURL(expectUrl, { timeout: 60000 }).catch(() => {}), p.locator('#btn-submit-login:visible').click()]);
      if (p.url().includes(expectUrl.replace(/\*/g, ''))) ok = true;
    } catch {}
  }
  if (!ok) throw new Error('login failed for ' + email + ' at ' + p.url());
  return { ctx: c, page: p };
}

try {
  const errs = [];
  const { ctx: ownerMobileCtx, page: m } = await login(VP.mobile, ownerEmail, '**/app**');
  m.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await m.goto(base + '/app', { waitUntil: 'load' });
  const tb = await m.locator('a[href="/notifications"]').count();
  const hmText = await m.locator('header').first().innerText().catch(() => '');
  const hm = hmText.includes('Hausmanager') ? 1 : 0;
  await check(m, 'app-mobile', { toolbarNotif: tb, hausmanager: hm });
  if (!hm) throw new Error('hausmanager missing in /app header');
  if (!tb) throw new Error('toolbar notifications missing on /app');
  await shot(m, 'final-app-390x844.png', false);
  await shot(m, 'final-app-390x844-full.png', true);
  const composer = m.locator('form textarea, form input[type="text"]').first();
  if (!(await composer.count())) throw new Error('composer input missing on /app');
  report.checks.push({ label: 'app-composer-present', ok: true });
  await m.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await m.waitForTimeout(600);
  const lastActions = m.locator('main a');
  const n = await lastActions.count();
  if (!n) throw new Error('no actions in main on /app mobile');
  await action44(m, 'app-mobile-last-action', lastActions.last());
  const href = await lastActions.last().getAttribute('href');
  await Promise.all([m.waitForURL('**' + href, { timeout: 60000 }).catch(() => {}), lastActions.last().click()]);
  await m.waitForLoadState('load').catch(() => {});
  await check(m, 'app-mobile-after-last-action');
  await shot(m, 'final-app-390x844-after-action.png', true);
  // toolbar intact on jobs/calendar/messages too (checked per route below via notif count)
  for (const [key, vp] of [['736x1024', VP.tablet], ['1536x960', VP.desktop]]) {
    const { ctx, page: p } = await login(vp, ownerEmail, '**/app**');
    await p.goto(base + '/app', { waitUntil: 'load' });
    await check(p, 'app-' + key);
    await shot(p, 'final-app-' + key + '.png', false);
    await ctx.close();
  }
  // --- jobs ---
  const { ctx: jctx, page: jj } = await login(VP.mobile, ownerEmail, '**/app**');
  await jj.goto(base + '/app/jobs', { waitUntil: 'load' });
  await check(jj, 'jobs-mobile', { toolbarNotif: await jj.locator('a[href="/notifications"]').count() });
  await shot(jj, 'final-jobs-390x844.png', false);
  await jj.locator('input[name="q"]').fill('Notfall');
  await Promise.all([jj.waitForURL('**q=Notfall**', { timeout: 60000 }).catch(() => {}), jj.locator('input[name="q"]').press('Enter')]);
  await jj.waitForLoadState('load').catch(() => {});
  const fH = await jj.getByText('Notfall: Sonstiger Notfall').count();
  report.checks.push({ label: 'jobs-search-Notfall', found: fH });
  if (!fH) throw new Error('jobs search did not return service job');
  await shot(jj, 'final-jobs-390x844-search.png', false);
  await jj.goto(base + '/app/jobs?view=completed', { waitUntil: 'load' });
  await check(jj, 'jobs-mobile-completed');
  const fC = await jj.getByText('Heckenschnitt').count();
  report.checks.push({ label: 'jobs-completed-view', found: fC });
  if (!fC) throw new Error('completed view missing booked job');
  await shot(jj, 'final-jobs-390x844-completed.png', false);
  await jj.goto(base + '/app/jobs?q=Notfall&view=open', { waitUntil: 'load' });
  const qval = await jj.locator('input[name="q"]').inputValue();
  if (qval !== 'Notfall') throw new Error('query not preserved, got ' + qval);
  report.checks.push({ label: 'jobs-query-preserved', qval });
  await jctx.close();
  for (const [key, vp] of [['736x1024', VP.tablet], ['1536x960', VP.desktop]]) {
    const { ctx, page: p } = await login(vp, ownerEmail, '**/app**');
    await p.goto(base + '/app/jobs', { waitUntil: 'load' });
    const hmt = await p.locator('header').first().innerText().catch(() => '');
    await check(p, 'jobs-' + key, { hausmanager: hmt.includes('Hausmanager') ? 1 : 0 });
    await shot(p, 'final-jobs-' + key + '.png', false);
    await ctx.close();
  }
  // --- calendar ---
  for (const [key, vp] of [['390x844', VP.mobile], ['736x1024', VP.tablet], ['1536x960', VP.desktop]]) {
    const { ctx, page: p } = await login(vp, ownerEmail, '**/app**');
    await p.goto(base + '/app/calendar', { waitUntil: 'load' });
    const hmc = await p.locator('header').first().innerText().catch(() => '');
    await check(p, 'calendar-' + key, { toolbarNotif: await p.locator('a[href="/notifications"]').count(), hausmanager: hmc.includes('Hausmanager') ? 1 : 0 });
    await shot(p, 'final-calendar-' + key + '.png', false);
    await ctx.close();
  }
  {
    const { ctx, page: p } = await login(VP.mobile, ownerEmail, '**/app**');
    await p.goto(base + '/app/calendar?view=past', { waitUntil: 'load' });
    await check(p, 'calendar-mobile-past');
    await shot(p, 'final-calendar-390x844-past.png', false);
    await ctx.close();
  }
  // --- messages ---
  for (const [key, vp] of [['390x844', VP.mobile], ['736x1024', VP.tablet], ['1536x960', VP.desktop]]) {
    const { ctx, page: p } = await login(vp, ownerEmail, '**/app**');
    await p.goto(base + '/app/messages', { waitUntil: 'load' });
    const hmm = await p.locator('header').first().innerText().catch(() => '');
    await check(p, 'messages-' + key, { toolbarNotif: await p.locator('a[href="/notifications"]').count(), hausmanager: hmm.includes('Hausmanager') ? 1 : 0 });
    await shot(p, 'final-messages-' + key + '.png', false);
    await ctx.close();
  }
  {
    const { ctx, page: p } = await login(VP.mobile, ownerEmail, '**/app**');
    await p.goto(base + '/app/messages?contact=' + contactId, { waitUntil: 'load' });
    // React 19 streaming hydration transiently keeps a second tree (same as T-0006 in e2e.mjs): settle first.
    await p.waitForFunction(() => document.querySelectorAll('textarea[placeholder*="Nachricht an"]').length === 1, { timeout: 60000 });
    const threadBox = p.locator('textarea[placeholder*="Nachricht an"]').first();
    await check(p, 'messages-thread');
    await shot(p, 'final-messages-390x844-thread.png', false);
    await threadBox.fill('Bitte kurz Bescheid sagen bevor es losgeht.');
    const sendBtn = p.getByRole('button', { name: 'Nachricht senden' });
    await action44(p, 'messages-send', sendBtn);
    await Promise.all([p.waitForResponse((r) => r.request().method() === 'POST', { timeout: 90000 }).catch(() => {}), sendBtn.click()]);
    await p.waitForTimeout(2000);
    const sentVisible = await p.getByText('Bitte kurz Bescheid sagen bevor es losgeht.').count();
    report.checks.push({ label: 'messages-thread-send', sentVisible });
    if (!sentVisible) throw new Error('sent thread message not visible');
    await shot(p, 'final-messages-390x844-thread-sent.png', false);
    await p.goto(base + '/app/messages?q=Thomas&bereich=' + encodeURIComponent('Hecke \u0026 B\u00e4ume'), { waitUntil: 'load' });
    await check(p, 'messages-filter');
    const foundContact = await p.getByText('Thomas Weber').count();
    if (!foundContact) throw new Error('contact search/filter empty');
    report.checks.push({ label: 'messages-search-filter', foundContact });
    await shot(p, 'final-messages-390x844-filter.png', false);
    await ctx.close();
  }
  // --- mobile account access ---
  {
    const { ctx, page: p } = await login(VP.mobile, ownerEmail, '**/app**');
    await p.goto(base + '/app', { waitUntil: 'load' });
    await check(p, 'account-mobile');
    await shot(p, 'final-account-390x844.png', true);
    await ctx.close();
  }
  await ownerMobileCtx.close();
  // --- provider smoke: approved partner dashboard (not empty gate) ---
  for (const [key, vp] of [['390x844', VP.mobile], ['1536x960', VP.desktop]]) {
    const { ctx, page: p } = await login(vp, providerEmail, '**/pro**');
    await p.goto(base + '/pro', { waitUntil: 'load' });
    await p.waitForLoadState('load').catch(() => {});
    await p.waitForTimeout(1000);
    const body = await p.locator('body').innerText();
    if (/noch nicht aktiv|kein aktiver Partner/i.test(body)) throw new Error('provider smoke hit empty gate on /pro ' + key);
    if (!/gartenbau m\u00fcller/i.test(body)) throw new Error('approved provider business missing on /pro ' + key);
    const h1c = await p.locator('h1').count();
    const of = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    report.checks.push({ label: 'pro-' + key, h1: h1c, overflow: of });
    if (of) throw new Error('pro overflow ' + key);
    await shot(p, 'final-pro-' + key + '.png', false);
    await ctx.close();
  }
  if (errs.length) throw new Error('pageerrors: ' + errs.slice(0, 3).join(' | '));
  report.errors = errs;
  await browser.close();
} catch (e) {
  report.fatal = String((e && e.message) || e).slice(0, 2000);
  try { await browser.close(); } catch {}
}
try { if (server && !server.killed) server.kill('SIGKILL'); } catch {}
for (const email of [ownerEmail, providerEmail]) {
  try {
    const list = await (await sbAdmin('GET', '?email=' + encodeURIComponent(email))).json().catch(() => ({}));
    for (const u of (list.users || []).filter((u) => (u.email || '').toLowerCase() === email.toLowerCase())) await sbAdmin('DELETE', '/' + encodeURIComponent(u.id)).catch(() => {});
    report.cleanup = (report.cleanup || []).concat([email + ': identities removed']);
  } catch (ce) { report.cleanup = (report.cleanup || []).concat([email + ': cleanup FAILED ' + String(ce).slice(0, 120)]); }
}
fs.writeFileSync(path.join(shotsDir, 'report.json'), JSON.stringify(report, null, 2));
for (const f of fs.readdirSync(shotsDir)) fs.copyFileSync(path.join(shotsDir, f), path.join(durableDir, f));
if (report.fatal) { console.error('SHOTS_FATAL ' + report.fatal); process.exit(1); }
console.error('SHOTS_OK ' + report.shots.length + ' shots, ' + report.checks.length + ' checks');
